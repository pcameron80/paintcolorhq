/**
 * Pinterest API helpers for the auto-pinner.
 *
 * createPin (POST /v5/pins) plus the four board IDs we created so the cron
 * can route content to the right board. The access token comes from the
 * PINTEREST_ACCESS_TOKEN Vercel env var. Token refresh lives in the local
 * scripts (scripts/pinterest-publish.ts); the public OAuth routes and the
 * unused refreshAccessToken() helper were removed 2026-10-24.
 */

// Pinterest splits production and sandbox into separate environments with
// separate data + separate API hosts. Until the app graduates from trial to
// standard access, pin creation must go through sandbox. Toggle by setting
// PINTEREST_USE_SANDBOX=true; once standard access lands, unset it (or set
// to false) and it routes to the real production boards/host.
const USE_SANDBOX = process.env.PINTEREST_USE_SANDBOX === "true";

export const PINTEREST_API_HOST = USE_SANDBOX
  ? "https://api-sandbox.pinterest.com"
  : "https://api.pinterest.com";

const PRODUCTION_BOARDS = {
  paintColors: "1116681738796524224",
  colorPalettes: "1116681738796524225",
  colorComparisons: "1116681738796524226",
  paintColorGuides: "1116681738796524227",
} as const;

const SANDBOX_BOARDS = {
  paintColors: "1116681738796524288",
  colorPalettes: "1116681738796524289",
  colorComparisons: "1116681738796524290",
  paintColorGuides: "1116681738796524292",
} as const;

export const PINTEREST_BOARDS = USE_SANDBOX ? SANDBOX_BOARDS : PRODUCTION_BOARDS;

export type PinterestBoardKey = keyof typeof PINTEREST_BOARDS;

export interface PinterestPinSpec {
  board_id: string;
  title: string;
  description: string;
  alt_text: string;
  media_source: { source_type: "image_url"; url: string };
  link: string;
}

interface PinterestPinResponse {
  id: string;
  board_id: string;
  link: string;
  title: string;
}

export async function createPin(
  pin: PinterestPinSpec,
  accessToken: string,
): Promise<PinterestPinResponse> {
  const res = await fetch(`${PINTEREST_API_HOST}/v5/pins`, {
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
