import { NextResponse } from "next/server";

export type GGWUser = {
  email: string;
  displayName: string;
};

const OWNER_EMAIL = "erezhaimowicz@gmail.com";

function isAllowedGGWIdentity(email: string): boolean {
  return email === OWNER_EMAIL || email.endsWith("@globalgamingwomen.org");
}

/**
 * Validates request headers reconstructed from verified Cloudflare Access identity.
 * Allows GGW staff accounts plus the explicit owner/admin Gmail account.
 */
export function requireVerifiedGGWUser(request: Request): GGWUser | null {
  const email = request.headers
    .get("cf-access-authenticated-user-email")
    ?.trim()
    .toLowerCase();

  if (!email || !isAllowedGGWIdentity(email)) {
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
    { error: "Unauthorized: approved GGW credentials required." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
