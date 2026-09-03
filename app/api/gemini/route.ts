import { env } from "cloudflare:workers";
import { requireVerifiedGGWUser, unauthorizedResponse } from "@/lib/require-ggw-user";

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
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const SYSTEM_INSTRUCTION = [
  "You are the AI helper inside the Global Gaming Women AI Workbench.",
  "Help GGW staff complete practical nonprofit work using WildApricot, Google Workspace, approved AI tools, and documented workflows.",
  "Give the fastest safe path: exact steps, a useful prompt or output structure when appropriate, and one final verification check.",
  "Use plain language and short sections. Explain unfamiliar terms in one sentence.",
  "Do not claim you can see GGW Drive, Gmail, Docs, Sheets, meetings, WildApricot records, or saved portal content unless it was explicitly supplied in the request.",
  "Do not ask users to paste confidential donor, member, payment, HR, legal, credential, or security information unless GGW has explicitly approved that use and the information is necessary for the task.",
  "For finance, compliance, legal, tax, personnel, governance, or external communications, require human review before a decision, filing, record change, or send.",
  "Treat WildApricot, approved Google files, signed agreements, official government/funder sources, and GGW policy as authoritative over AI output.",
  "If a Google or third-party feature may depend on plan, language, administrator settings, permissions, or rollout, say so and give a way to verify availability.",
  "If the question is unclear, ask one focused clarifying question instead of guessing.",
].join(" ");

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  record.count += 1;
  return true;
}

function getBindingValue(name: string): string {
  const bindings = env as unknown as Record<string, unknown>;
  return typeof bindings[name] === "string" ? bindings[name].trim() : "";
}

function cleanContext(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const context = value as Record<string, unknown>;
  const page = typeof context.page === "string" ? context.page.trim().slice(0, 40) : "";
  const moduleId = typeof context.moduleId === "string" && VALID_MODULES.has(context.moduleId) ? context.moduleId : "";
  return [page && `page: ${page}`, moduleId && `workflow context: ${moduleId}`].filter(Boolean).join(", ");
}

function extractText(payload: GeminiResponse): string {
  return (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => typeof part.text === "string" ? part.text : "")
    .join("")
    .trim()
    .slice(0, 8_000);
}

function noStoreJson(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  // Authentication is always checked before rate limiting, body parsing, or model execution.
  const user = requireVerifiedGGWUser(request);
  if (!user) return unauthorizedResponse();

  const clientIdentifier = request.headers.get("cf-connecting-ip")?.trim() || user.email;
  if (!checkRateLimit(clientIdentifier)) {
    return noStoreJson({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  let payload: ChatPayload;
  try {
    payload = await request.json() as ChatPayload;
  } catch {
    return noStoreJson({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!message) return noStoreJson({ error: "Ask one question to start." }, { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return noStoreJson({ error: `Questions are limited to ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.` }, { status: 400 });
  }

  const apiKey = getBindingValue("GEMINI_API_KEY");
  const configuredModel = getBindingValue("GEMINI_MODEL");
  const model = /^[a-zA-Z0-9._-]{1,80}$/.test(configuredModel) ? configuredModel : DEFAULT_MODEL;
  if (!apiKey) {
    return noStoreJson({
      configured: false,
      model,
      reply: "The secure AI helper is not connected on this deployment yet. Use the Prompt Library for task-ready prompts, keep authoritative source files in control, and verify the result before taking action.",
    });
  }

  const context = cleanContext(payload.context);
  const prompt = context ? `Workbench context: ${context}\n\nStaff question:\n${message}` : `Staff question:\n${message}`;
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
      return noStoreJson({ configured: true, error: "The AI helper is temporarily unavailable. Try again in a moment or use a prompt from the library." }, { status: 502 });
    }

    const result = await response.json() as GeminiResponse;
    const reply = extractText(result);
    if (!reply) return noStoreJson({ configured: true, error: "The AI helper returned no answer. Try asking one smaller question." }, { status: 502 });
    return noStoreJson({ configured: true, model, reply });
  } catch {
    return noStoreJson({ configured: true, error: "The AI connection timed out. Try again or use the Prompt Library." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
