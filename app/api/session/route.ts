type PortalIdentity = {
  email: string;
  displayName: string;
  source: "cloudflare-access" | "hosted-preview";
};

function clean(value: string | null): string {
  if (!value) return "";
  try { return decodeURIComponent(value).trim(); } catch { return value.trim(); }
}

function identityFromRequest(request: Request): PortalIdentity | null {
  const cloudflareEmail = request.headers.get("cf-access-authenticated-user-email")?.trim().toLowerCase();
  if (cloudflareEmail) {
    const suppliedName = clean(request.headers.get("cf-access-authenticated-user-name"));
    const displayName = suppliedName || cloudflareEmail.split("@")[0] || cloudflareEmail;
    return { email: cloudflareEmail, displayName: displayName.slice(0, 160), source: "cloudflare-access" };
  }

  const hostedEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (hostedEmail) {
    const suppliedName = clean(request.headers.get("oai-authenticated-user-name") || request.headers.get("oai-authenticated-user-full-name"));
    const displayName = suppliedName || hostedEmail.split("@")[0] || hostedEmail;
    return { email: hostedEmail, displayName: displayName.slice(0, 160), source: "hosted-preview" };
  }

  return null;
}

export async function GET(request: Request) {
  const identity = identityFromRequest(request);
  return Response.json({
    authenticated: Boolean(identity),
    user: identity,
    authMode: "edge-identity",
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
