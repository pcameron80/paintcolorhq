/**
 * check-attribution.ts
 *
 * Checks whether the external sites using the free color-match API, the MCP
 * tool or the embed widget credit PaintColorHQ. Reads api_referrers (migration
 * 013, filled by the server routes), fetches each page and looks for a link to
 * paintcolorhq.com (kind 'embed': our /embed iframe, which carries its own
 * credit link, also counts).
 *
 * Usage:
 *   npm run check-attribution                 # dry run, rows not checked in 7 days
 *   npm run check-attribution -- --all        # dry run, every row
 *   npm run check-attribution -- --write      # also write results back
 *
 * Limits: static HTML only (JS-injected links and iframes are not seen), and
 * many rows are a site root because browsers send only the origin cross-origin.
 * Treat "no" as "check by hand", not as proof. Server-to-server API calls carry
 * no Referer and are never recorded.
 *
 * Uses the service role (the table is service-role only). Always exits 0.
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { lookup } from "node:dns/promises";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import { createClient } from "@supabase/supabase-js";
import { isIgnoredHost } from "../src/lib/attribution";
import { detectCredit, isOriginOnly, type CheckKind } from "./lib/attribution-check";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const WRITE = process.argv.includes("--write");
const ALL = process.argv.includes("--all");
const RECHECK_DAYS = 7;
const TIMEOUT_MS = 15_000;
const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 5;
const USER_AGENT = "PaintColorHQ-attribution-check/1.0 (+https://www.paintcolorhq.com/api)";

interface Row {
  id: number;
  kind: CheckKind;
  referrer_url: string;
  referrer_host: string;
  hits: number;
  last_seen: string | null;
  last_checked: string | null;
}

interface Outcome {
  row: Row;
  hasCredit: boolean | null; // null = unreachable
  note: string;
}

// The URLs come from request headers anyone can set, and this script runs on a
// LAN machine. Refuse anything that is, or resolves to, a local/private address.
async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("not http(s)");
  if (isIgnoredHost(url.hostname)) throw new Error("ignored or private host");
  const addrs = await lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true });
  if (addrs.some((a) => isIgnoredHost(a.address))) throw new Error("resolves to a private address");
}

// The pre-check above can be raced by DNS rebinding (a host that resolves
// public for the check, private for the request). This lookup runs at connect
// time, so the address actually dialed is the one validated.
const safeLookup = ((hostname: string, options: dns.LookupOptions, cb: (...args: unknown[]) => void) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
    if (err) return cb(err);
    const list = addrs as dns.LookupAddress[];
    if (!list.length || list.some((a) => isIgnoredHost(a.address))) {
      return cb(new Error("resolves to a private address"));
    }
    if (options.all) return cb(null, list);
    cb(null, list[0].address, list[0].family);
  });
}) as unknown as typeof dns.lookup;

interface RawResponse { status: number; location: string | null; body: string }

function request(url: URL): Promise<RawResponse> {
  const mod = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        timeout: TIMEOUT_MS,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const location = (res.headers.location as string | undefined) ?? null;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location, body: "" });
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (c: Buffer) => {
          chunks.push(c);
          total += c.byteLength;
          if (total >= MAX_BYTES) res.destroy();
        });
        const done = () => resolve({ status, location, body: Buffer.concat(chunks).toString("utf8") });
        res.on("end", done);
        res.on("close", done);
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

async function fetchPage(start: string): Promise<string> {
  let url = new URL(start);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublic(url);
    const res = await request(url);
    if (res.status >= 300 && res.status < 400) {
      if (!res.location) throw new Error(`HTTP ${res.status} without Location`);
      url = new URL(res.location, url);
      continue;
    }
    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`);
    return res.body;
  }
  throw new Error("too many redirects");
}

async function check(row: Row): Promise<Outcome> {
  try {
    const html = await fetchPage(row.referrer_url);
    const { hasCredit, note } = detectCredit(html, row.kind);
    const suffix = !hasCredit && isOriginOnly(row.referrer_url) ? "; origin only, the using page may be elsewhere" : "";
    return { row, hasCredit, note: note + suffix };
  } catch (err) {
    const msg = err instanceof Error ? (err.name === "TimeoutError" ? "timeout" : err.message) : String(err);
    return { row, hasCredit: null, note: `unreachable: ${msg}`.slice(0, 300) };
  }
}

function pad(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    return;
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    global: { fetch: (u, init) => fetch(u, { ...init, cache: "no-store" }) },
  });

  let query = supabase
    .from("api_referrers")
    .select("id, kind, referrer_url, referrer_host, hits, last_seen, last_checked")
    .order("hits", { ascending: false })
    .limit(1000);
  if (!ALL) {
    const cutoff = new Date(Date.now() - RECHECK_DAYS * 86_400_000).toISOString();
    query = query.or(`last_checked.is.null,last_checked.lt.${cutoff}`);
  }
  const { data, error } = await query;
  if (error) {
    console.error(`Could not read api_referrers: ${error.message} (is migration 013 applied?)`);
    return;
  }
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) {
    console.log(ALL ? "No rows in api_referrers." : `No rows due for a check (none unchecked in ${RECHECK_DAYS} days). Use --all to recheck everything.`);
    console.log("0 sites, 0 credit us, 0 don't, 0 unreachable");
    return;
  }

  // Small, polite concurrency.
  const outcomes: Outcome[] = [];
  const queue = [...rows];
  await Promise.all(
    Array.from({ length: Math.min(4, queue.length) }, async () => {
      for (let row = queue.shift(); row; row = queue.shift()) outcomes.push(await check(row));
    }),
  );
  outcomes.sort((a, b) => b.row.hits - a.row.hits);

  console.log(
    `${pad("host", 32)} ${pad("kind", 6)} ${"hits".padStart(7)}  ${pad("last_seen", 11)} ${pad("has_credit", 11)} note`,
  );
  for (const o of outcomes) {
    const credit = o.hasCredit === null ? "?" : o.hasCredit ? "yes" : "NO";
    console.log(
      `${pad(o.row.referrer_host, 32)} ${pad(o.row.kind, 6)} ${String(o.row.hits).padStart(7)}  ${pad((o.row.last_seen ?? "").slice(0, 10), 11)} ${pad(credit, 11)} ${o.note}`,
    );
    console.log(`${"".padEnd(32)} ${o.row.referrer_url}`);
  }

  if (WRITE) {
    const now = new Date().toISOString();
    let failed = 0;
    for (const o of outcomes) {
      const { error: upErr } = await supabase
        .from("api_referrers")
        .update({ last_checked: now, has_credit: o.hasCredit, check_note: o.note })
        .eq("id", o.row.id);
      if (upErr) failed++;
    }
    console.log(failed ? `\nWrote ${outcomes.length - failed} rows, ${failed} failed.` : `\nWrote ${outcomes.length} rows.`);
  } else {
    console.log("\nDry run. Pass --write to save results.");
  }

  const credit = outcomes.filter((o) => o.hasCredit === true).length;
  const noCredit = outcomes.filter((o) => o.hasCredit === false).length;
  const unreachable = outcomes.filter((o) => o.hasCredit === null).length;
  console.log(`${outcomes.length} sites, ${credit} credit us, ${noCredit} don't, ${unreachable} unreachable`);
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit(0));
