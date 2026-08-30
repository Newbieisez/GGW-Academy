import { env } from "cloudflare:workers";

type ChatPayload = {
  message?: unknown;
  context?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
};

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_MESSAGE_LENGTH = 2_000;
const VALID_MODULES = new Set(["daily", "data", "visuals", "automation", "agents", "governance"]);

const SYSTEM_INSTRUCTION = [
  "You are the Gemini coach inside the Global Gaming Women AI Academy.",
  "Help adult beginners use Google Workspace and Gemini for practical nonprofit work.",
  "Give one clear next step, then one review or safety check.",
  "Use plain language and short sections. Explain unfamiliar terms in one sentence.",
  "Do not claim you can see GGW Drive, Gmail, Docs, Sheets, meetings, or saved learner files.",
  "Do not ask learners to paste confidential donor, member, payment, HR, or legal information.",
  "For finance, compliance, legal, personnel, or external communications, recommend human review before a decision or send.",
  "If a Google feature may depend on Workspace edition, language, admin settings, or rollout, say so and give the learner a way to check.",
  "If the question is unclear, ask one focused clarifying question instead of guessing.",
].join(" ");

function getBindingValue(name: string): string {
  const bindings = env as unknown as Record<string, unknown>;
  return typeof bindings[name] === "string" ? bindings[name].trim() : "";
}

function cleanContext(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const context = value as Record<string, unknown>;
  const page = typeof context.page === "string" ? context.page.trim().slice(0, 40) : "";
  const moduleId = typeof context.moduleId === "string" && VALID_MODULES.has(context.moduleId) ? context.moduleId : "";
  return [page && `page: ${page}`, moduleId && `learning path: ${moduleId}`].filter(Boolean).join(", ");
}

function extractText(payload: GeminiResponse): string {
  return (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => typeof part.text === "string" ? part.text : "")
    .join("")
    .trim()
    .slice(0, 8_000);
}

export async function POST(request: Request) {
  const identity = request.headers.get("oai-authenticated-user-email")?.trim();
  if (!identity) {
    return Response.json({ configured: false, reply: "Please sign in through the approved GGW account before using the Gemini coach." }, { status: 401 });
  }

  let payload: ChatPayload;
  try {
    payload = await request.json() as ChatPayload;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const message = typeof payload.message === "string" ? payload.message.trim().slice(0, MAX_MESSAGE_LENGTH) : "";
  if (!message) return Response.json({ error: "Ask one question to start." }, { status: 400 });

  const apiKey = getBindingValue("GEMINI_API_KEY");
  const configuredModel = getBindingValue("GEMINI_MODEL");
  const model = /^[a-zA-Z0-9._-]{1,80}$/.test(configuredModel) ? configuredModel : DEFAULT_MODEL;
  if (!apiKey) {
    return Response.json({
      configured: false,
      model,
      reply: "The Gemini coach is ready in this page, but the site owner still needs to connect a secure Gemini API key. Until then, use the prompt library for ready-to-copy questions and keep your work in practice mode.",
    });
  }

  const context = cleanContext(payload.context);
  const prompt = context ? `Learner context: ${context}\n\nLearner question:\n${message}` : `Learner question:\n${message}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 700 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return Response.json({ configured: true, error: "Gemini is temporarily unavailable. Try again in a moment or use a prompt from the library." }, { status: 502 });
    }

    const result = await response.json() as GeminiResponse;
    const reply = extractText(result);
    if (!reply) return Response.json({ configured: true, error: "Gemini returned no answer. Try asking one smaller question." }, { status: 502 });
    return Response.json({ configured: true, model, reply });
  } catch {
    return Response.json({ configured: true, error: "The Gemini connection timed out. Try again or use the prompt library." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
