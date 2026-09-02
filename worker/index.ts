/** Cloudflare Worker entry point for the GGW AI Workbench. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB?: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

type AccessIdentity = {
  email?: string;
  name?: string;
};

type AccessContext = {
  aud?: string;
  getIdentity(): Promise<AccessIdentity | null>;
};

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  access?: AccessContext;
}

const TRUSTED_IDENTITY_HEADERS = [
  "cf-access-authenticated-user-email",
  "cf-access-authenticated-user-name",
  "oai-authenticated-user-email",
  "oai-authenticated-user-name",
  "oai-authenticated-user-full-name",
];

async function withVerifiedIdentity(request: Request, ctx: ExecutionContext): Promise<Request> {
  const headers = new Headers(request.headers);

  // Cloudflare Access is the authentication authority for production.
  // Prefer the Worker-native Access context when available. For a hostname
  // protected as a self-hosted Access app, Cloudflare forwards the signed-in
  // identity in Cf-Access-* headers; preserve that identity only when the
  // Access JWT assertion is also present.
  const forwardedAccessEmail = headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase() || "";
  const forwardedAccessName = headers.get("cf-access-authenticated-user-name")?.trim() || "";
  const hasAccessAssertion = Boolean(headers.get("cf-access-jwt-assertion"));

  for (const header of TRUSTED_IDENTITY_HEADERS) headers.delete(header);

  let email = "";
  let name = "";

  if (ctx.access) {
    const identity = await ctx.access.getIdentity();
    email = identity?.email?.trim().toLowerCase() || "";
    name = identity?.name?.trim() || "";
  }

  if (!email && hasAccessAssertion && forwardedAccessEmail) {
    email = forwardedAccessEmail;
    name = forwardedAccessName;
  }

  if (email) {
    headers.set("cf-access-authenticated-user-email", email);
    headers.set("oai-authenticated-user-email", email);
  }
  if (name) {
    headers.set("cf-access-authenticated-user-name", name);
    headers.set("oai-authenticated-user-name", name);
    headers.set("oai-authenticated-user-full-name", name);
  }

  return new Request(request, { headers });
}

function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-Frame-Options", "SAMEORIGIN");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const verifiedRequest = await withVerifiedIdentity(request, ctx);
    const url = new URL(verifiedRequest.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(verifiedRequest, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, verifiedRequest.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return addSecurityHeaders(response);
    }

    const response = await handler.fetch(verifiedRequest, env, ctx);
    return addSecurityHeaders(response);
  },
};

export default worker;
