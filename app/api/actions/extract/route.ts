import { env } from "cloudflare:workers";
import { requireVerifiedGGWUser, unauthorizedResponse } from "@/lib/require-ggw-user";

const rateLimit = new Map<string, { count: number; reset: number }>();
function allowed(key: string) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || now > current.reset) {
    rateLimit.set(key, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (current.count >= 15) return false;
  current.count += 1;
  return true;
}

function binding(name: string) {
  const bindings = env as unknown as Record<string, unknown>;
  return typeof bindings[name] === "string" ? bindings[name].trim() : "";
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}
function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export async function POST(request: Request) {
  const user = requireVerifiedGGWUser(request);
  if (!user) return unauthorizedResponse();
  const key = request.headers.get("cf-connecting-ip") || user.email;
  if (!allowed(key)) return Response.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429, headers: { "Cache-Control": "no-store" } });

  let rawNotes = "";
  try {
    const body = await request.json() as { rawNotes?: unknown };
    rawNotes = typeof body.rawNotes === "string" ? body.rawNotes.trim() : "";
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!rawNotes) return Response.json({ error: "Add meeting notes first." }, { status: 400 });
  if (rawNotes.length > 15_000) return Response.json({ error: "Meeting notes exceed the 15,000 character limit." }, { status: 400 });

  const apiKey = binding("GEMINI_API_KEY");
  const model = binding("GEMINI_MODEL") || "gemini-2.5-flash";
  if (!apiKey) return Response.json({ error: "The secure AI helper is not configured on this deployment." }, { status: 503 });

  const prompt = `Extract structured meeting outputs from the notes below. Return JSON with exactly these keys: meetingTitle, meetingDate, decisions, actionItems, openQuestions, followUps, risks. meetingTitle and meetingDate may be null. decisions/openQuestions/followUps/risks must be arrays of strings. actionItems must be an array of objects with task, owner, dueDate; owner and dueDate may be null. Return ONLY explicitly supported information. Never invent owners, dates, decisions, commitments, deadlines, or priorities.\n\nSOURCE NOTES:\n${rawNotes}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.15, responseMimeType: "application/json", maxOutputTokens: 1400 } }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Model request failed");
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
    const result = JSON.parse(text || "{}") as Record<string, unknown>;

    if (!isStringOrNull(result.meetingTitle) || !isStringOrNull(result.meetingDate) || !stringArray(result.decisions) || !stringArray(result.openQuestions) || !stringArray(result.followUps) || !stringArray(result.risks) || !Array.isArray(result.actionItems)) throw new Error("Invalid response shape");
    const actionItems = result.actionItems.map((item) => {
      if (!item || typeof item !== "object") throw new Error("Invalid action item");
      const action = item as Record<string, unknown>;
      if (typeof action.task !== "string" || !action.task.trim() || !isStringOrNull(action.owner) || !isStringOrNull(action.dueDate)) throw new Error("Invalid action item");
      return { task: action.task.trim().slice(0, 800), owner: action.owner?.trim().slice(0, 160) || null, dueDate: action.dueDate?.trim().slice(0, 80) || null };
    });
    return Response.json({ meetingTitle: result.meetingTitle, meetingDate: result.meetingDate, decisions: result.decisions.slice(0, 30), actionItems, openQuestions: result.openQuestions.slice(0, 30), followUps: result.followUps.slice(0, 30), risks: result.risks.slice(0, 30) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not safely extract the meeting plan. Your notes were not changed." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timeout);
  }
}
