/**
 * Regenerate src/generated/brand-most-viewed.json: for each brand, the color
 * pages with the most clean pageviews in Plausible over the last 90 days.
 *
 *   npx tsx scripts/build-brand-most-viewed.ts [endDate]
 *
 * endDate is a UTC day (default: yesterday); the window is the 90 days ending
 * on it. Needs the NAS root ssh key (see scripts/analytics/README.md). The
 * brand pages read the committed JSON; nothing queries analytics at request
 * time. Refresh it by hand or on a schedule, then commit the output.
 *
 * What the file holds, and what it deliberately leaves out:
 *  - Only /colors/<brand>/<color> pages (the SQL excludes /colors/family).
 *  - Colors that are now redirects (src/data/color-redirects.json) are dropped
 *    here. Noindex colors (variants, code-only names) cannot be seen without
 *    the database, so the brand page applies isColorIndexable() at render.
 *  - A brand needs at least MIN_COLORS colors with MIN_VIEWS views each, or it
 *    gets no entry and its page shows no "most viewed" section. Thin traffic
 *    would otherwise rank colors on one or two views.
 *  - Counts are kept in the file for audit. The page does not print them.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/generated/brand-most-viewed.json");

const BRAND_SLUGS = new Set([
  "behr", "benjamin-moore", "colorhouse", "dunn-edwards", "dutch-boy", "farrow-ball", "hirshfields",
  "kilz", "ppg", "ral", "sherwin-williams", "valspar", "vista-paint",
]);
const WINDOW_DAYS = 90;
const MIN_VIEWS = 5;
const MIN_COLORS = 12;
const MAX_COLORS = 30; // candidates stored; the page shows up to 24 after its own filters

const day = (d: Date) => d.toISOString().slice(0, 10);

function parseWindow(arg?: string) {
  const end = arg ? new Date(`${arg}T00:00:00Z`) : new Date(Date.now() - 86_400_000);
  if (Number.isNaN(end.getTime())) throw new Error(`Bad endDate: ${arg}`);
  const start = new Date(end.getTime() - (WINDOW_DAYS - 1) * 86_400_000);
  return { start: day(start), end: day(end) };
}

const { start, end } = parseWindow(process.argv[2]);
const tsv = execFileSync(
  join(ROOT, "scripts/analytics/run-clickhouse.sh"),
  [join(ROOT, "scripts/analytics/brand-most-viewed.sql"), start, end],
  { env: { ...process.env, CH_FORMAT: "TSVWithNames" }, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);

const redirects = new Set(Object.keys(JSON.parse(readFileSync(join(ROOT, "src/data/color-redirects.json"), "utf8"))));
const [header, ...lines] = tsv.trim().split("\n");
const cols = header.split("\t");
const idx = Object.fromEntries(cols.map((c, i) => [c, i]));
if (!["brand", "color", "views", "visits", "window_start"].every((c) => c in idx)) {
  throw new Error(`Unexpected columns: ${header}`);
}

let windowStart = start;
const byBrand: Record<string, { slug: string; views: number; visits: number }[]> = {};
for (const line of lines) {
  const f = line.split("\t");
  const brand = f[idx.brand];
  const slug = f[idx.color];
  windowStart = f[idx.window_start] > windowStart ? f[idx.window_start] : windowStart;
  if (!BRAND_SLUGS.has(brand) || !slug || redirects.has(`${brand}/${slug}`)) continue;
  const views = Number(f[idx.views]);
  if (views < MIN_VIEWS) continue;
  (byBrand[brand] ??= []).push({ slug, views, visits: Number(f[idx.visits]) });
}

const brands: Record<string, { slug: string; views: number; visits: number }[]> = {};
const skipped: string[] = [];
for (const brand of [...BRAND_SLUGS].sort()) {
  const rows = (byBrand[brand] ?? []).sort((a, b) => b.views - a.views || b.visits - a.visits || a.slug.localeCompare(b.slug));
  if (rows.length >= MIN_COLORS) brands[brand] = rows.slice(0, MAX_COLORS);
  else skipped.push(`${brand} (${rows.length})`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: "Plausible, clean traffic",
      filter: "Not GNU/Linux; US, CA, GB, IE, AU or NZ; visitor-days over 100 pageviews dropped",
      queryStart: start,
      windowStart, // first day Plausible has data inside the window
      windowEnd: end,
      minViews: MIN_VIEWS,
      brands,
    },
    null,
    1,
  ) + "\n",
);
console.log(`Wrote ${OUT}\nWindow ${windowStart}..${end}; brands with a section: ${Object.keys(brands).length}; skipped (colors with >=${MIN_VIEWS} views): ${skipped.join(", ") || "none"}`);
