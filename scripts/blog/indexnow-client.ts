/**
 * IndexNow request shared by indexnow-submit.ts and publish-check.ts.
 * Targeted submissions only: callers pass a handful of new or changed URLs.
 *
 * There used to be a daily /api/cron/indexnow route that submitted the whole
 * sitemap (about 27,000 URLs). It was deleted on 2026-10-24 for flooding the
 * engines. Do not rebuild it, and do not loop this function over the sitemap.
 *
 * Every attempt, accepted or not, is appended to a JSONL ledger outside the repo
 * (~/Library/Application Support/PaintColorHQ/indexnow-ledger.jsonl, override
 * with $INDEXNOW_LEDGER) so there is one record of what was sent and when.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export const BASE = "https://www.paintcolorhq.com";
const HOST = "www.paintcolorhq.com";
// Public IndexNow key, hosted at /{KEY}.txt (public/). Keep that file: the engines
// fetch it to verify every submission.
const KEY = "a28e7cd07d004d4b94cfcd6bc2129bda";
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

export const LEDGER_PATH =
  process.env.INDEXNOW_LEDGER ??
  path.join(os.homedir(), "Library/Application Support/PaintColorHQ/indexnow-ledger.jsonl");

function appendLedger(entry: Record<string, unknown>) {
  try {
    fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
    fs.appendFileSync(LEDGER_PATH, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  } catch (e) {
    console.error(`IndexNow ledger write failed (${LEDGER_PATH}):`, e instanceof Error ? e.message : e);
  }
}

/** POST the URLs to IndexNow. Returns the HTTP status; throws on a non-2xx.
 *  `source` names the caller in the ledger. */
export async function submitIndexNow(urlList: string[], source: string): Promise<number> {
  let status = 0;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
    });
    status = res.status;
    if (!res.ok) throw new Error(`IndexNow ${res.status}: ${(await res.text()).slice(0, 200)}`);
    appendLedger({ source, status, urls: urlList });
    return status;
  } catch (e) {
    appendLedger({ source, status, urls: urlList, error: e instanceof Error ? e.message : String(e) });
    throw e;
  }
}
