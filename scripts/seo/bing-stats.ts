/**
 * Bing Webmaster per-page and per-query stats, for before/after checks on
 * title or content changes. Bing (plus Yahoo and DuckDuckGo, which use its
 * index) is the site's largest search channel, so any change aimed at Google
 * gets checked here too.
 *
 * Needs BING_WEBMASTER_API_KEY in .env.local
 * (Bing Webmaster Tools → Settings → API access → API key).
 *
 * Usage:
 *   npm run bing-stats -- pages                         # all pages, last 28 days
 *   npm run bing-stats -- pages --match=/brands/ --days=14
 *   npm run bing-stats -- queries --page=https://www.paintcolorhq.com/brands/ppg
 *   npm run bing-stats -- pages --match=/brands/ --save=brands-baseline
 *
 * --save writes the rows to scripts/seo/snapshots/bing-<YYYY-MM-DD>-<name>.json
 * so a later run can be compared against the same pages.
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const SITE_URL = "https://www.paintcolorhq.com/";
const API = "https://ssl.bing.com/webmaster/api.svc/json";
const SNAPSHOT_DIR = path.resolve(__dirname, "snapshots");

interface BingRow {
  Query: string; // the page URL for GetPageStats, the search query otherwise
  Impressions: number;
  Clicks: number;
  AvgImpressionPosition: number;
  Date: string; // "/Date(1759190400000)/"
}

interface Aggregate {
  key: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number | null;
}

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("--")) ?? "pages";
function arg(name: string): string | undefined {
  return args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

async function bing(method: string, params: Record<string, string>): Promise<BingRow[]> {
  const apikey = process.env.BING_WEBMASTER_API_KEY;
  if (!apikey) {
    throw new Error("BING_WEBMASTER_API_KEY is not set in .env.local");
  }
  const qs = new URLSearchParams({ apikey, ...params }).toString();
  const res = await fetch(`${API}/${method}?${qs}`, { headers: { Accept: "application/json" } });
  const text = await res.text();
  // Never echo the request URL: it carries the API key.
  if (!res.ok) throw new Error(`Bing ${method} ${res.status}: ${text.slice(0, 300)}`);
  return (JSON.parse(text).d ?? []) as BingRow[];
}

function rowTime(row: BingRow): number {
  const ms = /\/Date\((\d+)/.exec(row.Date)?.[1];
  return ms ? Number(ms) : 0;
}

function aggregate(rows: BingRow[], days: number): Aggregate[] {
  const since = Date.now() - days * 86_400_000;
  const byKey = new Map<string, { imp: number; clicks: number; posWeight: number }>();
  for (const row of rows) {
    if (rowTime(row) < since) continue;
    const agg = byKey.get(row.Query) ?? { imp: 0, clicks: 0, posWeight: 0 };
    agg.imp += row.Impressions;
    agg.clicks += row.Clicks;
    // Bing reports position per bucket; weight it by that bucket's impressions.
    agg.posWeight += row.AvgImpressionPosition * row.Impressions;
    byKey.set(row.Query, agg);
  }
  return [...byKey.entries()]
    .map(([key, a]) => ({
      key,
      impressions: a.imp,
      clicks: a.clicks,
      ctr: a.imp ? a.clicks / a.imp : 0,
      position: a.imp ? a.posWeight / a.imp : null,
    }))
    .sort((x, y) => y.impressions - x.impressions);
}

function print(rows: Aggregate[], label: string) {
  console.log(`${label.padEnd(70)} ${"impr".padStart(7)} ${"clicks".padStart(6)} ${"ctr".padStart(6)} ${"pos".padStart(5)}`);
  for (const r of rows) {
    const key = r.key.replace("https://www.paintcolorhq.com", "");
    console.log(
      `${key.slice(0, 70).padEnd(70)} ${String(r.impressions).padStart(7)} ${String(r.clicks).padStart(6)} ` +
        `${(r.ctr * 100).toFixed(1).padStart(5)}% ${r.position === null ? "  -" : r.position.toFixed(1).padStart(5)}`,
    );
  }
  const imp = rows.reduce((s, r) => s + r.impressions, 0);
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  console.log(`\n${rows.length} rows, ${imp} impressions, ${clicks} clicks`);
}

function save(name: string, rows: Aggregate[], meta: Record<string, unknown>) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const file = path.join(SNAPSHOT_DIR, `bing-${new Date().toISOString().slice(0, 10)}-${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ ...meta, savedAt: new Date().toISOString(), rows }, null, 2) + "\n");
  console.log(`Saved ${path.relative(process.cwd(), file)}`);
}

async function main() {
  const days = Number(arg("days") ?? 28);
  if (command === "pages") {
    const match = arg("match");
    const pattern = match ? new RegExp(match) : null;
    const rows = aggregate(await bing("GetPageStats", { siteUrl: SITE_URL }), days).filter(
      (r) => !pattern || pattern.test(r.key),
    );
    print(rows, `page (last ${days} days)`);
    const name = arg("save");
    if (name) save(name, rows, { command, match: match ?? null, days });
  } else if (command === "queries") {
    const page = arg("page");
    if (!page) throw new Error("queries needs --page=<full URL>");
    const rows = aggregate(await bing("GetPageQueryStats", { siteUrl: SITE_URL, page }), days);
    print(rows, `query for ${page.replace("https://www.paintcolorhq.com", "")}`);
    const name = arg("save");
    if (name) save(name, rows, { command, page, days });
  } else {
    throw new Error(`Unknown command "${command}". Use "pages" or "queries".`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
