import { env } from "cloudflare:workers";
import { requireVerifiedGGWUser, unauthorizedResponse } from "@/lib/require-ggw-user";

const RECIPIENTS = ["Sponsor / Donor", "Event Attendee", "New Member", "Renewing Member"] as const;
const TONES = ["Warm & Professional", "Friendly & Conversational", "Concise & Direct", "Formal"] as const;
const GOALS: Record<string, string[]> = {
  "Sponsor / Donor": ["Thank them", "Follow up after a meeting", "Sponsorship opportunity", "Request next steps", "Send requested information", "Reconnect with an existing sponsor"],
  "Event Attendee": ["Registration confirmation", "Event reminder", "Thank you for attending", "Post-event resources", "Feedback request", "Invite to another event"],
  "New Member": ["Welcome message", "Getting-started instructions", "Introduce benefits/resources", "Invite to upcoming event", "Introduce volunteer opportunities"],
  "Renewing Member": ["Friendly renewal reminder", "Renewal approaching", "Membership expired", "Re-engagement message", "Thank them for renewing"],
};

const limits = new Map<string, { count: number; reset: number }>();
function allowed(key: string) {
  const now = Date.now();
  const current = limits.get(key);
  if (!current || now > current.reset) {
    limits.set(key, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (current.count >= 30) return false;
  current.count += 1;
  return true;
}

function getBinding(name: string) {
  const bindings = env as unknown as Record<string, unknown>;
  return typeof bindings[name] === "string" ? bindings[name].trim() : "";
}

async function geminiJson(prompt: string): Promise<Record<string, unknown>> {
  const apiKey = getBinding("GEMINI_API_KEY");
  const model = getBinding("GEMINI_MODEL") || "gemini-2.5-flash";
  if (!apiKey) throw new Error("Gemini is not configured on this deployment.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: 1200 },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Gemini request failed.");
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
    const parsed = JSON.parse(text || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Gemini returned an invalid response.");
    return parsed as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}

function stringField(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const user = requireVerifiedGGWUser(request);
  if (!user) return unauthorizedResponse();

  const key = request.headers.get("cf-connecting-ip") || user.email;
  if (!allowed(key)) return Response.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429, headers: { "Cache-Control": "no-store" } });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const mode = stringField(body.mode, 30);
  try {
    if (mode === "extract") {
      const contextInput = stringField(body.contextInput, 10_000);
      if (!contextInput) return Response.json({ error: "Add notes or source details first." }, { status: 400 });
      const result = await geminiJson(`Extract outreach facts from the source text below. Return JSON with exactly these keys: recipientName, recipientEmail, organization, event, interest, nextStep, uncertainties. Use empty strings for missing scalar fields and an array of strings for uncertainties. Do not infer or invent names, titles, dates, prices, commitments, benefits, deadlines, event details, or relationships.\n\nSOURCE:\n${contextInput}`);
      return Response.json({
        recipientName: stringField(result.recipientName),
        recipientEmail: stringField(result.recipientEmail),
        organization: stringField(result.organization),
        event: stringField(result.event),
        interest: stringField(result.interest),
        nextStep: stringField(result.nextStep),
        uncertainties: Array.isArray(result.uncertainties) ? result.uncertainties.filter((v): v is string => typeof v === "string").slice(0, 10) : [],
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (mode === "generate") {
      const recipient = stringField(body.recipient, 80);
      const goal = stringField(body.goal, 120);
      const tone = stringField(body.tone, 80);
      const keepBrief = body.keepBrief === true;
      if (!RECIPIENTS.includes(recipient as (typeof RECIPIENTS)[number]) || !TONES.includes(tone as (typeof TONES)[number]) || !GOALS[recipient]?.includes(goal)) {
        return Response.json({ error: "Choose a valid audience, goal, and tone." }, { status: 400 });
      }
      const rawFacts = body.confirmedFacts;
      if (!rawFacts || typeof rawFacts !== "object" || Array.isArray(rawFacts)) return Response.json({ error: "Confirmed facts are required." }, { status: 400 });
      const facts = rawFacts as Record<string, unknown>;
      const confirmedFacts = {
        recipientName: stringField(facts.recipientName), recipientEmail: stringField(facts.recipientEmail), organization: stringField(facts.organization),
        event: stringField(facts.event), interest: stringField(facts.interest), nextStep: stringField(facts.nextStep),
      };
      const result = await geminiJson(`Draft a Global Gaming Women outreach email using ONLY the confirmed facts below. Return JSON with exactly subject and body. Audience: ${recipient}. Goal: ${goal}. Tone: ${tone}. ${keepBrief ? "Keep the body under 100 words." : "Keep it concise and professional."} Never invent names, dates, amounts, commitments, benefits, deadlines, URLs, locations, or event information. If a fact is unavailable, write around it naturally. If recipientName is blank, begin with "Hello,".\n\nCONFIRMED FACTS:\n${JSON.stringify(confirmedFacts)}`);
      const subject = stringField(result.subject, 180);
      const draftBody = stringField(result.body, 8_000);
      if (!subject || !draftBody) throw new Error("Gemini returned an incomplete draft.");
      return Response.json({ subject, body: draftBody }, { headers: { "Cache-Control": "no-store" } });
    }

    if (mode === "validate") {
      const draftSubject = stringField(body.draftSubject, 500);
      const draftBody = stringField(body.draftBody, 15_000);
      const confirmedFacts = body.confirmedFacts;
      if (!draftBody || !confirmedFacts || typeof confirmedFacts !== "object") return Response.json({ error: "Draft and confirmed facts are required." }, { status: 400 });
      const result = await geminiJson(`Compare this email against the confirmed facts. Return JSON with safe (boolean), unsupportedClaims (array of objects with text and reason), and verifiedFacts (array of strings). Standard wording that naturally supports the requested communication goal is allowed, but any new specific name, organization, date, amount, URL, location, benefit, deadline, promise, commitment, or event detail not supported by the facts must make safe=false.\n\nFACTS:\n${JSON.stringify(confirmedFacts)}\n\nSUBJECT:\n${draftSubject}\n\nBODY:\n${draftBody}`);
      const claims = Array.isArray(result.unsupportedClaims) ? result.unsupportedClaims.filter((item) => item && typeof item === "object").slice(0, 20).map((item) => {
        const claim = item as Record<string, unknown>;
        return { text: stringField(claim.text, 500), reason: stringField(claim.reason, 500) };
      }) : [];
      const verifiedFacts = Array.isArray(result.verifiedFacts) ? result.verifiedFacts.filter((v): v is string => typeof v === "string").slice(0, 30) : [];
      return Response.json({ safe: result.safe === true && claims.length === 0, unsupportedClaims: claims, verifiedFacts }, { headers: { "Cache-Control": "no-store" } });
    }

    return Response.json({ error: "Unsupported outreach operation." }, { status: 400 });
  } catch {
    return Response.json({ error: "The secure AI workflow is temporarily unavailable. Your source data was not changed." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
