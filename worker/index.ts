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

const GGW_DOMAIN = "@globalgamingwomen.org";

const TRUSTED_IDENTITY_HEADERS = [
  "cf-access-authenticated-user-email",
  "cf-access-authenticated-user-name",
  "oai-authenticated-user-email",
  "oai-authenticated-user-name",
  "oai-authenticated-user-full-name",
];

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/workbench") ||
    pathname.startsWith("/data-cleanup") ||
    pathname.startsWith("/api/academy") ||
    pathname.startsWith("/api/cleanup") ||
    pathname.startsWith("/api/outreach") ||
    pathname.startsWith("/api/actions") ||
    pathname.startsWith("/api/gemini")
  );
}

async function verifiedAccessIdentity(ctx: ExecutionContext): Promise<AccessIdentity | null> {
  if (!ctx.access) return null;
  return ctx.access.getIdentity();
}

function requestWithVerifiedIdentity(request: Request, identity: AccessIdentity | null): Request {
  const headers = new Headers(request.headers);

  // Never trust identity headers supplied by the inbound request. They are
  // removed first and reconstructed only from the Worker-native Access context.
  for (const header of TRUSTED_IDENTITY_HEADERS) headers.delete(header);

  const email = identity?.email?.trim().toLowerCase() || "";
  const name = identity?.name?.trim().slice(0, 160) || "";

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

function accessDenied(status: 401 | 403, message: string): Response {
  return addSecurityHeaders(
    new Response(message, {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    }),
  );
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const identity = await verifiedAccessIdentity(ctx);
    const email = identity?.email?.trim().toLowerCase() || "";

    if (isProtectedPath(url.pathname)) {
      if (!identity || !email) {
        return accessDenied(401, "Unauthorized");
      }
      if (!email.endsWith(GGW_DOMAIN)) {
        return accessDenied(403, "Forbidden");
      }
    }

    const verifiedRequest = requestWithVerifiedIdentity(request, identity);

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
