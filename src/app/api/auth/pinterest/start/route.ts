/**
 * Pinterest OAuth — start the flow.
 *
 * Generates a random state nonce (CSRF protection), sets it in a short-lived
 * httpOnly cookie, then redirects to Pinterest's authorization page with the
 * full set of scopes the auto-pinner will need.
 *
 * Visit https://www.paintcolorhq.com/api/auth/pinterest/start in a browser to
 * begin authentication.
 */

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REDIRECT_URI = "https://www.paintcolorhq.com/api/auth/pinterest/callback";
const SCOPES = [
  "boards:read",
  "boards:write",
  "pins:read",
  "pins:write",
  "user_accounts:read",
].join(",");

export async function GET() {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "PINTEREST_CLIENT_ID env var not set" },
      { status: 500 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    state,
  });

  const authUrl = `https://www.pinterest.com/oauth/?${params.toString()}`;
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("pinterest_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 min — ample time for the user to approve
    path: "/",
  });
  return res;
}
