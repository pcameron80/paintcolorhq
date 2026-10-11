/**
 * IndexNow request shared by indexnow-submit.ts and publish-check.ts.
 * Targeted submissions only: callers pass a handful of new blog URLs.
 */
export const BASE = "https://www.paintcolorhq.com";
const HOST = "www.paintcolorhq.com";
// Public IndexNow key (also hosted at /{KEY}.txt) — same one /api/cron/indexnow uses.
const KEY = "a28e7cd07d004d4b94cfcd6bc2129bda";
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** POST the URLs to IndexNow. Returns the HTTP status; throws on a non-2xx. */
export async function submitIndexNow(urlList: string[]): Promise<number> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  if (!res.ok) throw new Error(`IndexNow ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.status;
}
