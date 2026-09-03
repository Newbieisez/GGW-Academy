import { NextResponse } from "next/server";

export type GGWUser = {
  email: string;
  displayName: string;
};

/**
 * Validates request headers reconstructed exclusively from verified Cloudflare Access identity.
 * Rejects any request that lacks verified @globalgamingwomen.org credentials.
 */
export function requireVerifiedGGWUser(request: Request): GGWUser | null {
  const email = request.headers
    .get("cf-access-authenticated-user-email")
    ?.trim()
    .toLowerCase();

  if (!email || !email.endsWith("@globalgamingwomen.org")) {
    return null;
  }

  const rawName =
    request.headers.get("cf-access-authenticated-user-name")?.trim() ||
    email.split("@")[0];

  return {
    email,
    displayName: rawName.slice(0, 160),
  };
}

/** Fail-closed API response for missing or unauthorized GGW identity. */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized: GGW staff credentials required." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
