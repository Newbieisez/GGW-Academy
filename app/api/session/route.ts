import { requireVerifiedGGWUser } from "@/lib/require-ggw-user";

type PortalIdentity = {
  email: string;
  displayName: string;
  source: "cloudflare-access";
};

export async function GET(request: Request) {
  const user = requireVerifiedGGWUser(request);
  const identity: PortalIdentity | null = user
    ? { ...user, source: "cloudflare-access" }
    : null;

  return Response.json(
    {
      authenticated: Boolean(identity),
      user: identity,
      authMode: "cloudflare-access",
    },
    {
      status: identity ? 200 : 401,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
