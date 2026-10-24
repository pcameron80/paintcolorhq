/**
 * Bing Webmaster stats for before/after checks on title or content changes,
 * plus Bing's index, crawl, sitemap and inbound-link view of the site. Bing
 * (plus Yahoo and DuckDuckGo, which use its index) is the site's largest
 * search channel, so any change aimed at Google gets checked here too.
 *
 * Read-only: every call is a Webmaster API Get* method. Needs
 * BING_WEBMASTER_API_KEY in .env.local (Bing Webmaster Tools → Settings →
 * API access → API key). The key travels in the request URL, so request URLs
 * are never printed and any error text is scrubbed of the key.
 *
 * WEEKLY BUCKETS AND THE 100-ROW CAP. GetPageStats and GetPageQueryStats
 * return one row per key per weekly bucket. Each bucket's Date is the last
 * day of the 7 days it covers. GetPageStats returns at most the top 100 pages
 * per bucket (verified 2026-10-23: exactly 100 rows a week for 17 weeks, cut
 * at 1 impression), so long-tail pages are missing. Use GA4 landing pages with
 * sessionSource bing for long-tail coverage. Because data only exists per
 * week, select windows in whole weeks with --weeks or --from/--to.
 *
 * Usage (npm run bing-stats -- <command> [flags]):
 *   pages                     top pages, newest 4 weekly buckets
 *     --weeks=N               newest N buckets (default 4)
 *     --from=YYYY-MM-DD       first bucket end date to include
 *     --to=YYYY-MM-DD         last bucket end date to include
 *     --days=N                deprecated: buckets ending in the last N days
 *     --match=<regex>         filter page URLs
 *     --by-week               also print one table per bucket
 *     --save=<name>           write scripts/seo/snapshots/bing-<date>-<name>.json
 *   queries --page=<URL>      queries for one page (same window flags)
 *   brands-did                weekly clicks for the SW/BM brand-title test
 *                             against pooled control brand pages, with the
 *                             difference-in-differences
 *     --pre-from, --pre-to, --post-from, --post-to   override the windows
 *   crawl [--days=N]          GetCrawlStats daily rows (InIndex trend)
 *   issues                    GetCrawlIssues
 *   feeds [--live]            GetFeeds + GetFeedDetails; --live counts the
 *                             live sitemap URLs for comparison
 *   url-info --url=<URL> | --urls-file=<file> | --sample=N [--seed=S]
 *                             GetUrlInfo per URL, 1 request a second by default
 *                             (--interval-ms, never under 500), with backoff on throttling;
 *                             --sample picks N color URLs from
 *                             src/generated/sitemap.json for a coverage
 *                             estimate
 *   links [--max-pages=N] [--targets-file=<outreach.md>]
 *                             GetLinkCounts + GetUrlLinks: referring domains,
 *                             diffed against the outreach targets
 *   crawl-settings            GetCrawlSettings
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// The repo root .env.local first; then the working directory's, so the script
// also runs from a git worktree with `cd <main checkout> && npx tsx <path>`.
dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const SITE_URL = "https://www.paintcolorhq.com/";
const ORIGIN = "https://www.paintcolorhq.com";
const API = "https://ssl.bing.com/webmaster/api.svc/json";
const SNAPSHOT_DIR = path.resolve(__dirname, "snapshots");
const PAGE_CAP = 100;
const DAY_MS = 86_400_000;

interface BingRow {
  Query: string; // the page URL for GetPageStats, the search query otherwise
  Impressions: number;
  Clicks: number;
  AvgImpressionPosition: number;
  Date: string; // "/Date(1759190400000)/" or "/Date(1316156400000-0700)/"
}

interface Aggregate {
  key: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number | null;
  weeks: number;
}

interface Bucket {
  weekEnding: string;
  rows: number;
  truncated: boolean;
  minImpressions: number;
}

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("--")) ?? "pages";
function arg(name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}
function flag(name: string): boolean {
  return args.includes(`--${name}`);
}
function dateArg(name: string): string | undefined {
  const v = arg(name);
  if (v !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`--${name} must be YYYY-MM-DD`);
  return v;
}

function apiKey(): string {
  const key = process.env.BING_WEBMASTER_API_KEY;
  if (!key) throw new Error("BING_WEBMASTER_API_KEY is not set in .env.local");
  return key;
}

function scrub(text: string): string {
  const key = process.env.BING_WEBMASTER_API_KEY;
  return key ? text.split(key).join("***") : text;
}

/** One Get* call; returns the `d` payload. Never echoes the request URL. */
async function bingRaw(method: string, params: Record<string, string> = {}): Promise<unknown> {
  const qs = new URLSearchParams({ apikey: apiKey(), siteUrl: SITE_URL, ...params }).toString();
  let res: Response;
  try {
    res = await fetch(`${API}/${method}?${qs}`, { headers: { Accept: "application/json" } });
  } catch (err) {
    throw new Error(`Bing ${method} request failed: ${scrub(err instanceof Error ? err.message : String(err))}`);
  }
  const text = await res.text();
  if (!res.ok) throw new Error(`Bing ${method} ${res.status}: ${scrub(text.slice(0, 300))}`);
  return JSON.parse(text).d ?? null;
}

async function bing(method: string, params: Record<string, string> = {}): Promise<BingRow[]> {
  return ((await bingRaw(method, params)) ?? []) as BingRow[];
}

function msDate(value: unknown): number {
  const ms = /\/Date\((-?\d+)/.exec(String(value ?? ""))?.[1];
  return ms ? Number(ms) : 0;
}
/** "/Date(...)/" → YYYY-MM-DD (UTC), or "" for missing or year-1 dates. */
function isoDay(value: unknown): string {
  const ms = msDate(value);
  return ms > 0 ? new Date(ms).toISOString().slice(0, 10) : "";
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Group rows by bucket end date and pick the buckets the flags ask for. */
function selectBuckets(rows: BingRow[], capped: boolean): { picked: BingRow[]; buckets: Bucket[] } {
  const byWeek = new Map<string, BingRow[]>();
  for (const row of rows) {
    const day = isoDay(row.Date);
    if (!day) continue;
    byWeek.set(day, [...(byWeek.get(day) ?? []), row]);
  }
  let weeks = [...byWeek.keys()].sort().reverse(); // newest first
  const from = dateArg("from");
  const to = dateArg("to");
  const days = arg("days");
  if (from || to) {
    weeks = weeks.filter((w) => (!from || w >= from) && (!to || w <= to));
  } else if (days !== undefined) {
    const n = Number(days);
    const since = new Date(Date.now() - n * DAY_MS).toISOString().slice(0, 10);
    weeks = weeks.filter((w) => w >= since);
    const expected = Math.floor(n / 7);
    console.warn(
      `--days is deprecated: Bing data is weekly. --days=${n} selected ${weeks.length} bucket(s)` +
        (weeks.length < expected ? `, fewer than the ${expected} whole weeks it implies.` : ".") +
        " Use --weeks=N or --from/--to.",
    );
  } else {
    const n = Number(arg("weeks") ?? 4);
    if (!Number.isInteger(n) || n < 1) throw new Error("--weeks must be a whole number of 1 or more");
    weeks = weeks.slice(0, n);
  }
  weeks.sort();
  const buckets = weeks.map((w) => {
    const r = byWeek.get(w) ?? [];
    return {
      weekEnding: w,
      rows: r.length,
      truncated: capped && r.length >= PAGE_CAP,
      minImpressions: r.length ? Math.min(...r.map((x) => x.Impressions)) : 0,
    };
  });
  return { picked: weeks.flatMap((w) => byWeek.get(w) ?? []), buckets };
}

function aggregate(rows: BingRow[]): Aggregate[] {
  const byKey = new Map<string, { imp: number; clicks: number; posWeight: number; weeks: Set<string> }>();
  for (const row of rows) {
    const agg = byKey.get(row.Query) ?? { imp: 0, clicks: 0, posWeight: 0, weeks: new Set<string>() };
    agg.imp += row.Impressions;
    agg.clicks += row.Clicks;
    // Bing reports position per bucket; weight it by that bucket's impressions.
    agg.posWeight += row.AvgImpressionPosition * row.Impressions;
    agg.weeks.add(isoDay(row.Date));
    byKey.set(row.Query, agg);
  }
  return [...byKey.entries()]
    .map(([key, a]) => ({
      key,
      impressions: a.imp,
      clicks: a.clicks,
      ctr: a.imp ? a.clicks / a.imp : 0,
      position: a.imp ? a.posWeight / a.imp : null,
      weeks: a.weeks.size,
    }))
    .sort((x, y) => y.impressions - x.impressions);
}

function printBuckets(buckets: Bucket[]) {
  if (!buckets.length) {
    console.log("No weekly buckets in the selected window.");
    return;
  }
  console.log(`Weeks ending ${buckets.map((b) => b.weekEnding).join(", ")}`);
  console.log(`Rows per bucket: ${buckets.map((b) => `${b.weekEnding.slice(5)} ${b.rows}`).join(", ")}`);
  for (const b of buckets.filter((x) => x.truncated)) {
    console.warn(
      `WARNING week ending ${b.weekEnding}: ${b.rows} rows. The Bing API returns the top ${PAGE_CAP} pages per week; ` +
        `pages at or below ${b.minImpressions} impression(s) that week are missing. ` +
        "For long-tail coverage use GA4 landing pages with sessionSource bing.",
    );
  }
  console.log("");
}

function print(rows: Aggregate[], label: string) {
  console.log(
    `${label.padEnd(70)} ${"impr".padStart(7)} ${"clicks".padStart(6)} ${"ctr".padStart(6)} ${"pos".padStart(5)} ${"wks".padStart(3)}`,
  );
  for (const r of rows) {
    const key = r.key.replace(ORIGIN, "");
    console.log(
      `${key.slice(0, 70).padEnd(70)} ${String(r.impressions).padStart(7)} ${String(r.clicks).padStart(6)} ` +
        `${(r.ctr * 100).toFixed(1).padStart(5)}% ${r.position === null ? "  -" : r.position.toFixed(1).padStart(5)} ` +
        `${String(r.weeks).padStart(3)}`,
    );
  }
  const imp = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  console.log(`\n${rows.length} rows, ${imp} impressions, ${clicks} clicks`);
}

function save(name: string, payload: Record<string, unknown>) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const file = path.join(SNAPSHOT_DIR, `bing-${new Date().toISOString().slice(0, 10)}-${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ ...payload, savedAt: new Date().toISOString() }, null, 2) + "\n");
  console.log(`Saved ${path.relative(process.cwd(), file)}`);
}

async function statsCommand(method: string, params: Record<string, string>, label: string, capped: boolean) {
  const match = arg("match");
  const pattern = match ? new RegExp(match) : null;
  const { picked, buckets } = selectBuckets(await bing(method, params), capped);
  const filtered = picked.filter((r) => !pattern || pattern.test(r.Query));
  printBuckets(buckets);
  const rows = aggregate(filtered);
  print(rows, label);
  const perWeek = buckets.map((b) => ({
    weekEnding: b.weekEnding,
    rows: aggregate(filtered.filter((r) => isoDay(r.Date) === b.weekEnding)),
  }));
  if (flag("by-week")) {
    for (const w of perWeek) {
      console.log(`\n--- week ending ${w.weekEnding}`);
      print(w.rows, label);
    }
  }
  const name = arg("save");
  if (name) {
    save(name, {
      command,
      ...params,
      match: match ?? null,
      buckets: buckets.map(({ weekEnding, rows: n, truncated }) => ({ weekEnding, rows: n, truncated })),
      rows,
      ...(flag("by-week") ? { byWeek: perWeek } : {}),
    });
  }
}

// ---- brands-did ------------------------------------------------------------

const TEST_BRANDS = ["sherwin-williams", "benjamin-moore"];
const CONTROL_BRANDS = [
  "behr",
  "dunn-edwards",
  "dutch-boy",
  "farrow-ball",
  "hirshfields",
  "kilz",
  "ppg",
  "ral",
  "valspar",
  "vista-paint",
];

/** Brand slug for a /brands/<slug> URL (any query string), else null. */
function brandOf(url: string): string | null {
  const m = /^https?:\/\/[^/]+\/brands\/([^/?#]+)\/?(?:[?#].*)?$/.exec(url);
  return m ? m[1] : null;
}

async function brandsDid() {
  const preFrom = dateArg("pre-from") ?? "2026-09-18";
  const preTo = dateArg("pre-to") ?? "2026-10-09";
  const postFrom = dateArg("post-from") ?? "2026-10-16";
  const postTo = dateArg("post-to") ?? "9999-12-31";
  const rows = await bing("GetPageStats");
  const inPre = (d: string) => d >= preFrom && d <= preTo;
  const inPost = (d: string) => d >= postFrom && d <= postTo;
  // Bing returns only the top 100 pages per week, so a small control brand page
  // can drop out of a capped week and drag the pooled control down. Use a
  // balanced panel: only control brands present in every week used.
  const rowCount = new Map<string, number>();
  const present = new Map<string, Set<string>>();
  for (const row of rows) {
    const day = isoDay(row.Date);
    if (!day) continue;
    rowCount.set(day, (rowCount.get(day) ?? 0) + 1);
    const brand = brandOf(row.Query);
    if (brand) present.set(brand, (present.get(brand) ?? new Set()).add(day));
  }
  const used = [...rowCount.keys()].filter((d) => inPre(d) || inPost(d)).sort();
  const panel = CONTROL_BRANDS.filter((b) => used.every((d) => present.get(b)?.has(d)));
  const dropped = CONTROL_BRANDS.filter((b) => !panel.includes(b));
  const weeks = new Map<string, { test: number; control: number; testImp: number; controlImp: number; n: number }>();
  for (const d of used) weeks.set(d, { test: 0, control: 0, testImp: 0, controlImp: 0, n: rowCount.get(d) ?? 0 });
  for (const row of rows) {
    const w = weeks.get(isoDay(row.Date));
    if (!w) continue;
    const brand = brandOf(row.Query);
    if (brand && TEST_BRANDS.includes(brand)) {
      w.test += row.Clicks;
      w.testImp += row.Impressions;
    } else if (brand && panel.includes(brand)) {
      w.control += row.Clicks;
      w.controlImp += row.Impressions;
    }
  }

  console.log(`Test arm: ${TEST_BRANDS.join(", ")}`);
  console.log(`Controls (pooled, present every week): ${panel.join(", ") || "none"}`);
  if (dropped.length) console.log(`Controls dropped (missing from a capped week): ${dropped.join(", ")}`);
  console.log(`Pre: weeks ending ${preFrom}..${preTo}. Post: weeks ending ${postFrom}..${postTo === "9999-12-31" ? "latest" : postTo}.\n`);
  console.log(
    `${"week ending".padEnd(12)} ${"period".padEnd(6)} ${"test clk".padStart(8)} ${"test ctr".padStart(8)} ` +
      `${"ctrl clk".padStart(8)} ${"ctrl ctr".padStart(8)} ${"rows".padStart(5)}`,
  );
  const pct = (c: number, i: number) => (i ? `${((c / i) * 100).toFixed(1)}%` : "-");
  for (const d of used) {
    const w = weeks.get(d)!;
    console.log(
      `${d.padEnd(12)} ${(inPre(d) ? "pre" : "post").padEnd(6)} ${String(w.test).padStart(8)} ${pct(w.test, w.testImp).padStart(8)} ` +
        `${String(w.control).padStart(8)} ${pct(w.control, w.controlImp).padStart(8)} ${String(w.n).padStart(5)}` +
        (w.n >= PAGE_CAP ? "  (capped at 100 pages)" : ""),
    );
  }
  const mean = (ds: string[], k: "test" | "control") =>
    ds.length ? ds.reduce((s, d) => s + weeks.get(d)![k], 0) / ds.length : NaN;
  const pre = used.filter(inPre);
  const post = used.filter(inPost);
  const tPre = mean(pre, "test");
  const tPost = mean(post, "test");
  const cPre = mean(pre, "control");
  const cPost = mean(post, "control");
  const f = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : "-");
  console.log(`\nClicks per week (mean)   pre (${pre.length} wk)   post (${post.length} wk)   change`);
  console.log(`  test arm               ${f(tPre).padStart(8)}   ${f(tPost).padStart(9)}   ${f(tPost - tPre).padStart(6)}`);
  console.log(`  controls               ${f(cPre).padStart(8)}   ${f(cPost).padStart(9)}   ${f(cPost - cPre).padStart(6)}`);
  // Headline is the ratio form: the test arm and the pooled controls run at
  // different traffic levels, so an absolute click difference depends on scale.
  const ratio = (tPost / tPre) / (cPost / cPre);
  console.log(`\nDifference-in-differences, ratio form (headline): ${Number.isFinite(ratio) ? `${((ratio - 1) * 100).toFixed(1)}%` : "-"} (test arm relative to controls)`);
  console.log(`Absolute form (secondary, scale-dependent): ${f(tPost - tPre - (cPost - cPre))} clicks/week`);
  if (post.length < 3) {
    console.warn(`\nOnly ${post.length} post week(s) so far: read the result as direction, not a verdict.`);
  }
}

// ---- crawl / issues / feeds / crawl-settings ------------------------------

async function crawl() {
  const rows = ((await bingRaw("GetCrawlStats")) ?? []) as Record<string, unknown>[];
  const since = new Date(Date.now() - Number(arg("days") ?? 30) * DAY_MS).toISOString().slice(0, 10);
  const cols = ["InIndex", "CrawledPages", "CrawlErrors", "Code2xx", "Code301", "Code4xx", "Code5xx", "BlockedByRobotsTxt", "InLinks"];
  console.log(`${"date".padEnd(11)} ${cols.map((c) => c.slice(0, 10).padStart(10)).join(" ")}`);
  const picked = rows.filter((r) => isoDay(r.Date) >= since).sort((a, b) => msDate(a.Date) - msDate(b.Date));
  for (const r of picked) {
    console.log(`${isoDay(r.Date).padEnd(11)} ${cols.map((c) => String(r[c] ?? "-").padStart(10)).join(" ")}`);
  }
  if (picked.length > 1) {
    const first = Number(picked[0].InIndex);
    const last = Number(picked[picked.length - 1].InIndex);
    console.log(`\nInIndex ${isoDay(picked[0].Date)} ${first} → ${isoDay(picked[picked.length - 1].Date)} ${last} (${last - first >= 0 ? "+" : ""}${last - first})`);
  }
  const name = arg("save");
  if (name) save(name, { command, rows: picked });
}

async function issues() {
  const rows = ((await bingRaw("GetCrawlIssues")) ?? []) as Record<string, unknown>[];
  for (const r of rows) {
    console.log(`${String(r.HttpCode).padStart(4)} issues=${String(r.Issues).padStart(6)} inlinks=${String(r.InLinks ?? "-").padStart(4)}  ${String(r.Url).replace(ORIGIN, "")}`);
  }
  console.log(`\n${rows.length} URLs with crawl issues (Issues is Bing's bit-flag code).`);
}

async function countLiveSitemap(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const index = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  const locs = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!/<sitemapindex/.test(index)) {
    counts.set(`${ORIGIN}/sitemap.xml`, locs.length);
    return counts;
  }
  for (const loc of locs) {
    const body = await (await fetch(loc)).text();
    counts.set(loc, (body.match(/<loc>/g) ?? []).length);
  }
  return counts;
}

async function feeds() {
  const top = ((await bingRaw("GetFeeds")) ?? []) as Record<string, unknown>[];
  const live = flag("live") ? await countLiveSitemap() : null;
  const totals: string[] = [];
  const show = (f: Record<string, unknown>, indent: string) => {
    const url = String(f.Url);
    const liveCount = live?.get(url);
    console.log(
      `${indent}${url.replace(ORIGIN, "")}  status=${f.Status} type=${f.Type} urls=${f.UrlCount}` +
        `${liveCount !== undefined ? ` live=${liveCount}` : ""} lastCrawled=${isoDay(f.LastCrawled) || "-"} submitted=${isoDay(f.Submitted) || "-"}`,
    );
  };
  for (const f of top) {
    show(f, "");
    const children = ((await bingRaw("GetFeedDetails", { feedUrl: String(f.Url) })) ?? []) as Record<string, unknown>[];
    // GetFeedDetails on an index lists the index itself too; count child sitemaps only.
    const leaves = children.filter((c) => String(c.Url) !== String(f.Url) && !/index/i.test(String(c.Type)));
    for (const c of leaves) show(c, "  ");
    const sum = leaves.length ? leaves.reduce((s, c) => s + Number(c.UrlCount ?? 0), 0) : Number(f.UrlCount ?? 0);
    totals.push(`  ${String(f.Url)}: ${sum} URLs in ${leaves.length || 1} sitemap(s)`);
  }
  console.log(`\nBing-reported URLs per submitted feed (each feed is counted on its own; ${top.length} submitted):`);
  for (const t of totals) console.log(t);
  if (live) console.log(`Live sitemap URLs (${ORIGIN}/sitemap.xml): ${[...live.values()].reduce((s, n) => s + n, 0)}`);
}

async function crawlSettings() {
  console.log(JSON.stringify(await bingRaw("GetCrawlSettings"), null, 2));
}

// ---- url-info --------------------------------------------------------------

/** Retry a call that Bing throttled (400 "ThrottleHost"), backing off 15 s, 30 s, 60 s, 120 s. */
async function withThrottleRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/ThrottleHost/i.test(msg) || attempt >= 4) throw err;
      const wait = 15_000 * 2 ** attempt;
      console.warn(`  Bing throttled the request; waiting ${wait / 1000} s before retry ${attempt + 1} of 4`);
      await sleep(wait);
    }
  }
}

/** Deterministic PRNG so a --seed reproduces the same sample. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleColorUrls(n: number, seed: number): string[] {
  const file = path.resolve(__dirname, "../../src/generated/sitemap.json");
  if (!fs.existsSync(file)) throw new Error("src/generated/sitemap.json is missing; run npm run build-sitemap-data first");
  const colors = (JSON.parse(fs.readFileSync(file, "utf8")).colors ?? []) as { brandSlug: string; colorSlug: string }[];
  const rand = mulberry32(seed);
  const pool = [...colors];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((c) => `${ORIGIN}/colors/${c.brandSlug}/${c.colorSlug}`);
}

async function urlInfo() {
  let urls: string[];
  const one = arg("url");
  const file = arg("urls-file");
  const sample = arg("sample");
  const seed = Number(arg("seed") ?? 20261024);
  if (one) urls = [one];
  else if (file) urls = fs.readFileSync(file, "utf8").split(/\s+/).filter((u) => u.startsWith("http"));
  else if (sample) urls = sampleColorUrls(Number(sample), seed);
  else throw new Error("url-info needs --url=<URL>, --urls-file=<file> or --sample=N");

  // HttpStatus reads 0 even for crawled pages (checked 2026-10-24), so it is kept
  // but the summary uses DocumentSize, which is set once Bing has stored the page.
  // At most 2 requests a second. Bing still answers "ThrottleHost" after a few
  // dozen calls in a row; withThrottleRetry backs off and retries those.
  const interval = Math.max(500, Number(arg("interval-ms") ?? 1000));
  const results: { url: string; http: number; size: number; discovered: string; crawled: string; error?: string }[] = [];
  for (const [i, url] of urls.entries()) {
    if (i > 0) await sleep(interval);
    try {
      const d = ((await withThrottleRetry(() => bingRaw("GetUrlInfo", { url }))) ?? {}) as Record<string, unknown>;
      results.push({
        url,
        http: Number(d.HttpStatus ?? 0),
        size: Number(d.DocumentSize ?? 0),
        discovered: isoDay(d.DiscoveryDate),
        crawled: isoDay(d.LastCrawledDate),
      });
    } catch (err) {
      results.push({ url, http: 0, size: 0, discovered: "", crawled: "", error: err instanceof Error ? err.message : String(err) });
    }
    const r = results[results.length - 1];
    console.log(
      `${String(r.size ? `${Math.round(r.size / 1024)}K` : "-").padStart(5)} discovered=${(r.discovered || "-").padEnd(10)} crawled=${(r.crawled || "-").padEnd(10)} ${url.replace(ORIGIN, "")}${r.error ? `  ERROR ${r.error}` : ""}`,
    );
  }
  const ok = results.filter((r) => !r.error);
  const known = ok.filter((r) => r.discovered || r.crawled).length;
  const crawled = ok.filter((r) => r.crawled).length;
  const stored = ok.filter((r) => r.size > 0).length;
  const p = (n: number) => (ok.length ? `${((n / ok.length) * 100).toFixed(1)}%` : "-");
  console.log(`\n${ok.length} URLs answered (${results.length - ok.length} errors)${sample ? `, seed ${seed}` : ""}`);
  console.log(`  known to Bing (discovered or crawled): ${known} (${p(known)})`);
  console.log(`  crawled at least once:                 ${crawled} (${p(crawled)})`);
  console.log(`  page stored (DocumentSize > 0):        ${stored} (${p(stored)})`);
  const name = arg("save");
  if (name) save(name, { command, seed: sample ? seed : null, results });
}

// ---- links -----------------------------------------------------------------

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `http://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}
const stem = (s: string) => s.toLowerCase().replace(/&|\band\b/g, "").replace(/[^a-z0-9]/g, "");

/** Outreach targets from the Targets table: name stems plus any hostnames in the row. */
function loadTargets(file: string): { name: string; stem: string; hosts: string[] }[] {
  if (!fs.existsSync(file)) return [];
  const targets: { name: string; stem: string; hosts: string[] }[] = [];
  let inTable = false;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (/^##\s+Targets/.test(line)) inTable = true;
    else if (/^##\s/.test(line)) inTable = false;
    if (!inTable || !/^\|\s*\d+\s*\|/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells[2].startsWith("~~")) continue; // dropped target
    const name = cells[2].replace(/\(.*?\)/g, "").trim();
    const hosts = [...line.matchAll(/(?:@|\b)((?:[a-z0-9-]+\.)+(?:com|ca|net|org|co))\b/gi)]
      .map((m) => m[1].toLowerCase().replace(/^www\./, ""))
      .filter((h) => !/paintcolorhq|linkedin|cdsfulfillment/.test(h));
    targets.push({ name, stem: stem(name), hosts: [...new Set(hosts)] });
  }
  return targets;
}

async function links() {
  const maxPages = Number(arg("max-pages") ?? 50);
  const counts: { Url: string; Count: number }[] = [];
  for (let page = 0; ; page++) {
    const d = ((await bingRaw("GetLinkCounts", { page: String(page) })) ?? {}) as { Links?: { Url: string; Count: number }[]; TotalPages?: number };
    counts.push(...(d.Links ?? []));
    if (page + 1 >= (d.TotalPages ?? 0)) break;
    await sleep(500);
  }
  counts.sort((a, b) => b.Count - a.Count);
  if (!counts.length) {
    // Seen 2026-10-24: GetLinkCounts and GetUrlLinks answer 200 with empty lists for
    // this site while GetCrawlStats reports InLinks of 25, so an empty result here
    // does not mean "no backlinks".
    console.warn(
      "Bing's API returned no inbound-link data (GetLinkCounts is empty). That is not proof of zero links: " +
        "check the Backlinks report in the Bing Webmaster Tools UI and the GSC Links report instead.",
    );
  }
  console.log(`${counts.length} site pages with inbound links (Bing). Top ${Math.min(maxPages, counts.length)}:`);
  for (const c of counts.slice(0, 20)) console.log(`${String(c.Count).padStart(6)}  ${c.Url.replace(ORIGIN, "") || "/"}`);

  const domains = new Map<string, { links: number; examples: Set<string> }>();
  for (const c of counts.slice(0, maxPages)) {
    for (let page = 0; ; page++) {
      await sleep(500);
      const d = ((await bingRaw("GetUrlLinks", { link: c.Url, page: String(page) })) ?? {}) as {
        Details?: { Url: string; AnchorText: string }[];
        TotalPages?: number;
      };
      for (const l of d.Details ?? []) {
        const host = hostOf(l.Url);
        if (!host || host.endsWith("paintcolorhq.com")) continue;
        const e = domains.get(host) ?? { links: 0, examples: new Set<string>() };
        e.links += 1;
        if (e.examples.size < 2) e.examples.add(l.Url);
        domains.set(host, e);
      }
      if (page + 1 >= (d.TotalPages ?? 0)) break;
    }
  }
  const sorted = [...domains.entries()].sort((a, b) => b[1].links - a[1].links);
  console.log(`\n${sorted.length} referring domains across the top ${Math.min(maxPages, counts.length)} linked pages:`);
  for (const [host, e] of sorted) console.log(`${String(e.links).padStart(5)}  ${host}  e.g. ${[...e.examples][0]}`);

  const targetsFile = arg("targets-file") ?? path.resolve(process.cwd(), "reports/competitor-gap-2026-10/outreach.md");
  const targets = loadTargets(targetsFile);
  if (!targets.length) {
    console.log(`\nNo outreach targets read (${targetsFile} missing or no Targets table); skipping the diff.`);
  } else {
    console.log(`\nOutreach targets (${targets.length}) against Bing referring domains:`);
    let linked = 0;
    for (const t of targets) {
      const hit = sorted.find(([host]) => t.hosts.some((h) => host === h || host.endsWith(`.${h}`)) || (t.stem.length >= 6 && stem(host.split(".")[0]).includes(t.stem)));
      if (hit) linked += 1;
      console.log(`  ${hit ? "LINKED " : "-      "} ${t.name}${hit ? `  (${hit[0]}, ${hit[1].links} links)` : ""}`);
    }
    console.log(`${linked} of ${targets.length} targets link to the site in Bing's data. Name matching is best effort; check the domain list above too.`);
  }
  const name = arg("save");
  if (name) {
    save(name, {
      command,
      linkedPages: counts,
      referringDomains: sorted.map(([host, e]) => ({ host, links: e.links, examples: [...e.examples] })),
    });
  }
}

async function main() {
  if (command === "pages") {
    await statsCommand("GetPageStats", {}, "page", true);
  } else if (command === "queries") {
    const page = arg("page");
    if (!page) throw new Error("queries needs --page=<full URL>");
    await statsCommand("GetPageQueryStats", { page }, `query for ${page.replace(ORIGIN, "")}`, false);
  } else if (command === "brands-did") {
    await brandsDid();
  } else if (command === "crawl") {
    await crawl();
  } else if (command === "issues") {
    await issues();
  } else if (command === "feeds") {
    await feeds();
  } else if (command === "url-info") {
    await urlInfo();
  } else if (command === "links") {
    await links();
  } else if (command === "crawl-settings") {
    await crawlSettings();
  } else {
    throw new Error(
      `Unknown command "${command}". Use pages, queries, brands-did, crawl, issues, feeds, url-info, links or crawl-settings.`,
    );
  }
}

main().catch((err) => {
  console.error(scrub(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
