/**
 * Pinterest API helpers for the auto-pinner.
 *
 * Two functions: refreshAccessToken (uses the long-lived refresh token to
 * mint a fresh access token) and createPin (POST /v5/pins). Plus the four
 * board IDs we created so the cron can route content to the right board.
 *
 * Tokens come from Vercel env vars (PINTEREST_*). For MVP there's no
 * persistence — every cron run does a fresh refresh, paying the ~200ms
 * cost in exchange for never dealing with stale tokens.
 */

export const PINTEREST_BOARDS = {
  paintColors: "1116681738796524224",
  colorPalettes: "1116681738796524225",
  colorComparisons: "1116681738796524226",
  paintColorGuides: "1116681738796524227",
} as const;

export type PinterestBoardKey = keyof typeof PINTEREST_BOARDS;

export interface PinterestPinSpec {
  board_id: string;
  title: string;
  description: string;
  alt_text: string;
  media_source: { source_type: "image_url"; url: string };
  link: string;
}

interface PinterestTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface PinterestPinResponse {
  id: string;
  board_id: string;
  link: string;
  title: string;
}

/**
 * Trade the long-lived refresh token for a fresh access token. Pinterest
 * access tokens expire in 30 days — refresh tokens last 60 — so calling
 * this on every cron run is overkill but keeps things simple until we
 * persist tokens in Supabase.
 */
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = process.env.PINTEREST_REFRESH_TOKEN;
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing PINTEREST_REFRESH_TOKEN, PINTEREST_CLIENT_ID, or PINTEREST_CLIENT_SECRET env var");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinterest token refresh failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as PinterestTokenResponse;
  return data.access_token;
}

export async function createPin(
  pin: PinterestPinSpec,
  accessToken: string,
): Promise<PinterestPinResponse> {
  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pin),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinterest pin creation failed (${res.status}): ${errText}`);
  }

  return res.json() as Promise<PinterestPinResponse>;
}
