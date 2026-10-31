/**
 * Palette statistics study: lightness (LRV), crowding and retirement figures
 * for /paint-color-statistics. Writes src/data/palette-stats-study.json and the
 * per-brand CSV at public/data/paint-color-statistics-by-brand.csv.
 *
 * Sibling of scripts/study-duplication.ts, which owns the duplication and
 * originality figures. This one is read-only too: SELECTs and local files only.
 *
 * Which rows count. A color is in the study only when it can be checked against
 * the manufacturer's own current palette, read from a palette drift scan
 * (data/brand-scans/<date>/<brand>-live.json, see docs/data-pipeline.md):
 *   - its color_number or an alternate number matches a code in the feed
 *     (through the brand's normalizeCode),
 *   - its name matches the feed's name (case and punctuation ignored),
 *   - its stored hex is within CIEDE2000 2 of the feed's swatch,
 *   - it is not one of the rows flagged by the 2026-10-31 data audit
 *     (scripts/lib/study-exclusions.json),
 * and each manufacturer code counts once. RAL is left out: it is an industrial
 * standard, and 198 of its 213 stored swatches are 2+ off RAL's own.
 * Colorhouse has no live source, and Kilz rows not on kilz.com fail the feed
 * check, so the 2,200 rows that are copies of 2020 colornerd data drop out.
 *
 * LRV. Only the manufacturer's published LRV is used, taken from the same feed:
 * Benjamin Moore, Behr, Sherwin-Williams and Dutch Boy. Dunn-Edwards,
 * Hirshfield's, Vista Paint and PPG publish LRV on their sites, but our copies
 * are not reconciled yet (the stored values are computed from the hex and run
 * up to 7 points high on Dunn-Edwards whites), so they are left out of every
 * LRV figure. Valspar, Kilz, Farrow & Ball and Colorhouse publish none here.
 * A published value more than 10 points from the LRV implied by the brand's
 * own swatch is treated as a feed error and skipped, as apply-published-lrv.ts
 * does. Benjamin Moore PM- premix codes are skipped (their feed LRV disagrees
 * with BM's color pages).
 *
 * Stored labels are not used. color_family and undertone are under review
 * (2026-10-31 audit), so "gray", "beige" and "white" here mean the word in the
 * color's name, and hue zones come from CIELAB values computed from the hex.
 *
 * Usage: npm run study-palette-stats                     (writes JSON + CSV)
 *        npm run study-palette-stats -- --dry            (prints the JSON only)
 *        npm run study-palette-stats -- --scan-dir=data/brand-scans/2026-10-11
 *        npm run study-palette-stats -- --dump=/tmp/rows.json   (verified rows, for analysis)
 */
import "./blog/load-env.ts"; // MUST be first: populates env (a worktree falls back to the main checkout's).
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SOURCES } from "./lib/palette-sources";
import { normCode, normName, normHex, type LiveColor } from "./lib/palette-diff";
import { hexToRgb, rgbToLab, deltaE2000 } from "./lib/color-utils";
import { calculateLrv } from "./lib/color-math";
import exclusionsFile from "./lib/study-exclusions.json";
import duplicationStudy from "../src/data/duplication-study.json";
import { COLOR_OF_THE_YEAR } from "../src/lib/color-of-the-year";
import { COTY_HISTORY } from "../src/data/coty-history";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/palette-stats-study.json");
const CSV_OUT = path.join(root, "public/data/paint-color-statistics-by-brand.csv");
const PAGE = 1000;
const HEX_TOLERANCE = 2;
const LRV_FEED_SANITY = 10;
const DEFAULT_SCAN = "data/brand-scans/2026-10-11";
/** Brands whose feed carries a published LRV we can use as-is. */
const LRV_BRANDS = ["benjamin-moore", "behr", "sherwin-williams", "dutch-boy"];
/** Brands that publish LRV on their sites but whose values we have not reconciled. */
const LRV_PENDING = ["dunn-edwards", "hirshfields", "vista-paint", "ppg"];
const LRV_SKIP_CODES: Record<string, RegExp> = { "benjamin-moore": /^PM-/ };

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

interface Brand {
  id: string;
  name: string;
  slug: string;
}
interface Color {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  hex: string;
  color_number: string | null;
  alternate_numbers: string[] | null;
  availability: "current" | "retired" | "discontinued";
}
export interface StudyRow {
  id: string;
  brand: string;
  name: string;
  slug: string;
  code: string;
  hex: string;
  availability: Color["availability"];
  L: number;
  a: number;
  b: number;
  C: number;
  h: number;
  /** manufacturer-published LRV, LRV_BRANDS only */
  lrv: number | null;
}

/** Resolve the scan dir against cwd, this checkout, then the main checkout (data/ is gitignored). */
function resolveScanDir(rel: string): string {
  const candidates = [path.resolve(process.cwd(), rel), path.resolve(root, rel)];
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim();
    candidates.push(path.resolve(path.dirname(common), rel));
  } catch {
    /* not a git checkout */
  }
  const hit = candidates.find((c) => fs.existsSync(c));
  if (!hit) throw new Error(`Scan dir ${rel} not found (tried ${candidates.join(", ")}). Run npm run scan-palettes first.`);
  return hit;
}

async function fetchAll<T extends { id: string }>(
  build: (after: string | null) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  let after: string | null = null;
  for (;;) {
    const { data, error } = await build(after);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
    after = data[data.length - 1].id;
  }
}

const labOf = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
};
const lrvOf = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  return calculateLrv(r, g, b);
};

export interface Loaded {
  brands: Brand[];
  colors: Color[];
  rows: StudyRow[];
  scanDir: string;
  /** every verified row before the one-row-per-code step, keyed "brandSlug|colorSlug" */
  bySlug: Map<string, StudyRow>;
  coverage: Record<string, { total: number; noFeed: number; notInFeed: number; nameMismatch: number; hexOff: number; flagged: number; duplicateCode: number; counted: number; withLrv: number; lrvSkipped: number }>;
}

export async function load(sb: SupabaseClient, scanRel = DEFAULT_SCAN): Promise<Loaded> {
  const scanDir = resolveScanDir(scanRel);
  const { data: brandRows, error } = await sb.from("brands").select("id, name, slug");
  if (error) throw new Error(error.message);
  const brands = (brandRows ?? []) as Brand[];
  const colors = await fetchAll<Color>((after) => {
    let q = sb.from("colors").select("id, brand_id, name, slug, hex, color_number, alternate_numbers, availability").order("id").limit(PAGE);
    if (after) q = q.gt("id", after);
    return q;
  });

  const flagged = new Set<string>(Object.values(exclusionsFile.findings).flatMap((f) => f.ids));
  const coverage: Loaded["coverage"] = {};
  const best = new Map<string, { row: StudyRow; dE: number }>();
  const bySlug = new Map<string, StudyRow>();

  for (const brand of brands) {
    const own = colors.filter((c) => c.brand_id === brand.id);
    const cov = { total: own.length, noFeed: 0, notInFeed: 0, nameMismatch: 0, hexOff: 0, flagged: 0, duplicateCode: 0, counted: 0, withLrv: 0, lrvSkipped: 0 };
    coverage[brand.slug] = cov;
    const liveFile = path.join(scanDir, `${brand.slug}-live.json`);
    if (brand.slug === "ral" || !fs.existsSync(liveFile)) {
      cov.noFeed = own.length;
      continue;
    }
    const src = SOURCES[brand.slug];
    const key = (c: string) => normCode(src?.normalizeCode ? src.normalizeCode(c) : c);
    const feed = new Map<string, LiveColor>();
    for (const c of JSON.parse(fs.readFileSync(liveFile, "utf8")) as LiveColor[]) {
      if (!normHex(c.hex) || (src?.keep && !src.keep(c)) || feed.has(key(c.code))) continue;
      feed.set(key(c.code), c);
    }
    for (const c of own) {
      if (flagged.has(c.id)) {
        cov.flagged++;
        continue;
      }
      const codes = [c.color_number, ...(c.alternate_numbers ?? [])].filter((x): x is string => !!x);
      const hitCode = codes.map(key).find((k) => feed.has(k));
      if (!hitCode) {
        cov.notInFeed++;
        continue;
      }
      const f = feed.get(hitCode)!;
      if (normName(c.name) !== normName(f.name)) {
        cov.nameMismatch++;
        continue;
      }
      const lab = labOf(c.hex);
      const dE = deltaE2000(lab, labOf(normHex(f.hex)!));
      if (dE >= HEX_TOLERANCE) {
        cov.hexOff++;
        continue;
      }
      let lrv: number | null = null;
      if (LRV_BRANDS.includes(brand.slug) && f.lrv != null && f.lrv > 0 && !LRV_SKIP_CODES[brand.slug]?.test(normCode(f.code))) {
        if (Math.abs(f.lrv - lrvOf(normHex(f.hex)!)) <= LRV_FEED_SANITY) lrv = f.lrv;
        else cov.lrvSkipped++;
      }
      const C = Math.hypot(lab.a, lab.b);
      const h = ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;
      const row: StudyRow = { id: c.id, brand: brand.slug, name: c.name.trim(), slug: c.slug, code: f.code, hex: c.hex.toLowerCase(), availability: c.availability, L: lab.L, a: lab.a, b: lab.b, C, h, lrv };
      bySlug.set(`${brand.slug}|${c.slug}`, row);
      const k = `${brand.slug}|${hitCode}`;
      const prev = best.get(k);
      if (prev) cov.duplicateCode++;
      if (!prev || dE < prev.dE || (dE === prev.dE && row.availability === "current" && prev.row.availability !== "current")) best.set(k, { row, dE });
    }
  }
  const rows = [...best.values()].map((v) => v.row);
  for (const r of rows) {
    coverage[r.brand].counted++;
    if (r.lrv != null) coverage[r.brand].withLrv++;
  }
  return { brands, colors, rows, scanDir, bySlug, coverage };
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d ? round1((100 * n) / d) : 0);
export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return round1(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}
const mean = (xs: number[]) => round1(xs.reduce((s, x) => s + x, 0) / xs.length);

/** Words in a color's name, matched whole. "white" is the last word only, so White Oak and White Truffle are not whites. */
export const NAME_WORDS: { word: string; label: string; re: RegExp }[] = [
  { word: "white", label: "White (last word)", re: /\bwhites?$/i },
  { word: "cream", label: "Cream", re: /\bcreams?\b/i },
  { word: "beige", label: "Beige", re: /\bbeiges?\b/i },
  { word: "khaki", label: "Khaki", re: /\bkhakis?\b/i },
  { word: "gray", label: "Gray or grey", re: /\bgr[ae]ys?\b/i },
  { word: "green", label: "Green", re: /\bgreens?\b/i },
  { word: "sage", label: "Sage", re: /\bsages?\b/i },
  { word: "taupe", label: "Taupe", re: /\btaupes?\b/i },
  { word: "blue", label: "Blue", re: /\bblues?\b/i },
  { word: "navy", label: "Navy", re: /\bnavy\b/i },
  { word: "black", label: "Black", re: /\bblacks?\b/i },
];
/** A white below this LRV is an off-white by the usual decorating rule of thumb. */
const WHITE_LRV = 80;
const MIN_WORD_COLORS = 15;

/** CIELAB hue sectors (degrees) for colors with chroma 10 or more. */
const SECTORS: { name: string; from: number; to: number }[] = [
  { name: "Red and pink", from: 345, to: 30 },
  { name: "Orange and tan", from: 30, to: 70 },
  { name: "Yellow, cream and gold", from: 70, to: 105 },
  { name: "Green", from: 105, to: 165 },
  { name: "Teal", from: 165, to: 225 },
  { name: "Blue", from: 225, to: 290 },
  { name: "Purple", from: 290, to: 345 },
];
const NEUTRAL_CHROMA = 10;
const BANDS: { name: string; min: number }[] = [
  { name: "Very light", min: 85 },
  { name: "Light", min: 70 },
  { name: "Mid", min: 50 },
  { name: "Dark", min: 30 },
  { name: "Very dark", min: -Infinity },
];
export const sectorOf = (h: number) => SECTORS.find((s) => (s.from < s.to ? h >= s.from && h < s.to : h >= s.from || h < s.to))!.name;
export const bandOf = (L: number) => BANDS.find((b) => L >= b.min)!.name;

export function computeStudy(loaded: Loaded) {
  const { brands, colors, rows, bySlug, coverage } = loaded;
  const brandName = (slug: string) => brands.find((b) => b.slug === slug)!.name;
  const withLrv = rows.filter((r) => r.lrv != null);
  const currentLrv = withLrv.filter((r) => r.availability === "current");

  // 1. How light each brand's current palette is.
  const pooledCurrent = currentLrv.map((r) => r.lrv!);
  const lrvBrands = LRV_BRANDS.map((slug) => {
    const xs = currentLrv.filter((r) => r.brand === slug).map((r) => r.lrv!);
    return {
      name: brandName(slug),
      slug,
      colors: xs.length,
      medianLrv: median(xs),
      meanLrv: mean(xs),
      lrv80PlusPct: pct(xs.filter((x) => x >= WHITE_LRV).length, xs.length),
      lrvUnder20Pct: pct(xs.filter((x) => x < 20).length, xs.length),
      vsPooledMedian: round1(median(xs) - median(pooledCurrent)),
    };
  }).sort((a, b) => b.medianLrv - a.medianLrv);

  // 2. How light a color called "gray" (or "white", "beige") really is.
  const nameWords = NAME_WORDS.map(({ word, label, re }) => {
    const hits = currentLrv.filter((r) => re.test(r.name));
    const xs = hits.map((r) => r.lrv!).sort((a, b) => a - b);
    return {
      word,
      label,
      colors: xs.length,
      medianLrv: median(xs),
      p10: xs.length ? round1(xs[Math.floor(0.1 * (xs.length - 1))]) : NaN,
      p90: xs.length ? round1(xs[Math.ceil(0.9 * (xs.length - 1))]) : NaN,
      under50: xs.filter((x) => x < 50).length,
      under50Pct: pct(xs.filter((x) => x < 50).length, xs.length),
    };
  })
    .filter((w) => w.colors >= MIN_WORD_COLORS)
    .sort((a, b) => b.medianLrv - a.medianLrv);

  const whites = currentLrv.filter((r) => NAME_WORDS[0].re.test(r.name));
  const offWhites = whites.filter((r) => r.lrv! < WHITE_LRV);
  const whitesByBrand = LRV_BRANDS.map((slug) => {
    const own = whites.filter((r) => r.brand === slug);
    const below = own.filter((r) => r.lrv! < WHITE_LRV).length;
    return { name: brandName(slug), slug, whites: own.length, belowWhiteLrv: below, belowWhiteLrvPct: pct(below, own.length), medianLrv: median(own.map((r) => r.lrv!)) };
  }).sort((a, b) => b.belowWhiteLrvPct - a.belowWhiteLrvPct);
  const darkestWhites = [...whites]
    .sort((a, b) => a.lrv! - b.lrv! || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((r) => ({ brand: brandName(r.brand), brandSlug: r.brand, name: r.name, code: r.code, slug: r.slug, hex: r.hex, lrv: r.lrv! }));

  // 3. Retired versus current, for brands with a retired list of 100+ colors that publish LRV.
  const retired = LRV_BRANDS.map((slug) => {
    const own = withLrv.filter((r) => r.brand === slug);
    const ret = own.filter((r) => r.availability === "retired").map((r) => r.lrv!);
    const cur = own.filter((r) => r.availability === "current").map((r) => r.lrv!);
    return { name: brandName(slug), slug, listed: own.length, retired: ret.length, retiredPct: pct(ret.length, own.length), retiredMedianLrv: median(ret), currentMedianLrv: median(cur) };
  }).filter((r) => r.retired >= 100);

  // 4. Color of the Year: published LRV of each Benjamin Moore, Behr and Sherwin-Williams pick.
  const COTY_BRANDS = ["benjamin-moore", "behr", "sherwin-williams"];
  const picks = [
    ...COTY_HISTORY,
    ...COLOR_OF_THE_YEAR.flatMap((cycle) =>
      cycle.picks.filter((p) => p.colorSlug).map((p) => ({ year: cycle.year, brandSlug: p.brandSlug, brandName: p.brandName, name: p.name, code: p.code, colorSlug: p.colorSlug!, sourceUrl: p.sourceUrl })),
    ),
  ]
    .filter((p) => COTY_BRANDS.includes(p.brandSlug))
    .map((p) => {
      const row = bySlug.get(`${p.brandSlug}|${p.colorSlug}`);
      if (!row || row.lrv == null) throw new Error(`Color of the Year ${p.year} ${p.name} (${p.brandSlug}/${p.colorSlug}) has no verified published LRV`);
      return { year: p.year, brand: p.brandName, brandSlug: p.brandSlug, name: p.name, code: p.code, slug: p.colorSlug, hex: row.hex, lrv: row.lrv };
    })
    .sort((a, b) => a.year - b.year || a.brand.localeCompare(b.brand));
  const years = [...new Set(picks.map((p) => p.year))];
  const EARLY_TO = 2023;
  const early = picks.filter((p) => p.year <= EARLY_TO);
  const late = picks.filter((p) => p.year > EARLY_TO);
  const coty = {
    brands: COTY_BRANDS.map(brandName),
    picks,
    byYear: years.map((y) => {
      const ps = picks.filter((p) => p.year === y);
      return { year: y, picks: ps.length, meanLrv: mean(ps.map((p) => p.lrv)) };
    }),
    early: { from: Math.min(...early.map((p) => p.year)), to: EARLY_TO, picks: early.length, meanLrv: mean(early.map((p) => p.lrv)) },
    late: { from: EARLY_TO + 1, to: Math.max(...late.map((p) => p.year)), picks: late.length, meanLrv: mean(late.map((p) => p.lrv)), under25: late.filter((p) => p.lrv < 25).length },
  };

  // 5. Where colors pile up: hue sector x lightness, from each verified swatch.
  const N = rows.length;
  const neutral = rows.filter((r) => r.C < NEUTRAL_CHROMA);
  const nearWhite = neutral.filter((r) => r.L >= BANDS[0].min);
  const tinted = rows.filter((r) => r.C >= NEUTRAL_CHROMA);
  const grid = [{ name: "Near-neutral", from: null as number | null, to: null as number | null }, ...SECTORS].map((s) => {
    const inRow = s.from == null ? neutral : tinted.filter((r) => sectorOf(r.h) === s.name);
    return { name: s.name, total: inRow.length, pct: pct(inRow.length, N), bands: BANDS.map((b) => inRow.filter((r) => bandOf(r.L) === b.name).length) };
  });
  const cells = grid.flatMap((g) => g.bands.map((count, i) => ({ row: g.name, band: BANDS[i].name, count, pct: pct(count, N) }))).sort((a, b) => b.count - a.count);
  const sectorCounts = grid.slice(1).map((g) => ({ name: g.name, colors: g.total, pctOfTinted: pct(g.total, tinted.length) })).sort((a, b) => b.colors - a.colors);
  const zones = {
    colors: N,
    neutralChromaMax: NEUTRAL_CHROMA,
    bands: BANDS.map((b, i) => ({ name: b.name, minL: i === BANDS.length - 1 ? 0 : b.min, maxL: i === 0 ? 100 : BANDS[i - 1].min })),
    neutral: { colors: neutral.length, pct: pct(neutral.length, N) },
    nearWhite: { colors: nearWhite.length, pct: pct(nearWhite.length, N) },
    tinted: tinted.length,
    sectors: sectorCounts,
    grid,
    mostCrowded: cells.slice(0, 3),
    emptiest: cells.filter((c) => c.count > 0).slice(-3).reverse(),
    emptyCells: cells.filter((c) => c.count === 0).length,
  };

  // 6. Per-brand table (also written as CSV).
  const dup = new Map(duplicationStudy.brands.map((b) => [b.slug, b]));
  const perBrand = brands
    .map((b) => {
      const own = colors.filter((c) => c.brand_id === b.id);
      const v = rows.filter((r) => r.brand === b.slug);
      const lb = lrvBrands.find((x) => x.slug === b.slug);
      return {
        name: b.name,
        slug: b.slug,
        catalog: own.length,
        current: own.filter((c) => c.availability === "current").length,
        retired: own.filter((c) => c.availability === "retired").length,
        // RAL is outside the originality ranking (an industrial standard), so its share is left blank.
        uniquePct: b.slug === "ral" ? null : (dup.get(b.slug)?.uniquePct ?? null),
        verified: v.length,
        nearNeutralPct: v.length ? pct(v.filter((r) => r.C < NEUTRAL_CHROMA).length, v.length) : null,
        nearWhitePct: v.length ? pct(v.filter((r) => r.C < NEUTRAL_CHROMA && r.L >= BANDS[0].min).length, v.length) : null,
        lrvColors: lb?.colors ?? null,
        medianLrv: lb?.medianLrv ?? null,
        lrv80PlusPct: lb?.lrv80PlusPct ?? null,
        lrvUnder20Pct: lb?.lrvUnder20Pct ?? null,
        lrvSource: LRV_BRANDS.includes(b.slug)
          ? "published by the brand"
          : LRV_PENDING.includes(b.slug)
            ? "published by the brand, not yet reconciled; left out"
            : b.slug === "ral"
              ? "not studied (industrial standard)"
              : "not published in our sources; left out",
      };
    })
    .sort((a, b) => b.catalog - a.catalog || a.name.localeCompare(b.name));

  const excluded = Object.entries(exclusionsFile.findings).map(([id, f]) => ({ id, title: f.title, rows: f.ids.length }));
  const sum = (k: keyof Loaded["coverage"][string]) => Object.values(coverage).reduce((s, c) => s + c[k], 0);

  return {
    runDate: new Date().toISOString().slice(0, 10),
    scanDate: path.basename(loaded.scanDir),
    auditDate: exclusionsFile.audit,
    duplicationRunDate: duplicationStudy.runDate,
    method: {
      rows: `A color counts only when its code and name match the manufacturer's current palette (scan of ${path.basename(loaded.scanDir)}) and its stored hex is within CIEDE2000 ${HEX_TOLERANCE} of the brand's swatch; each manufacturer code counts once. RAL is not studied.`,
      lrv: `Manufacturer-published LRV only: ${LRV_BRANDS.map(brandName).join(", ")}. Current colors only unless stated. ${LRV_PENDING.map(brandName).join(", ")} publish LRV but our copies are not reconciled yet, so they are left out; the other brands publish none in our sources.`,
      names: `A word in the color's name, matched whole. "White" means the last word is White or Whites. Words with fewer than ${MIN_WORD_COLORS} colors are not shown.`,
      zones: `CIELAB from each verified swatch hex. Near-neutral is chroma under ${NEUTRAL_CHROMA}; hue sectors in degrees: ${SECTORS.map((s) => `${s.name} ${s.from}-${s.to}`).join(", ")}. Lightness bands by L*: ${BANDS.map((b) => `${b.name} ${b.min === -Infinity ? "under 30" : `${b.min}+`}`).join(", ")}.`,
      coty: `Published LRV of each ${COTY_BRANDS.map(brandName).join(", ")} Color of the Year pick, ${Math.min(...years)} to ${Math.max(...years)}. Sherwin-Williams named a nine-color capsule for 2025, so that year has two picks.`,
      whiteLrv: `${WHITE_LRV}`,
    },
    coverage: {
      catalog: colors.length,
      verified: rows.length,
      withPublishedLrv: withLrv.length,
      currentWithPublishedLrv: currentLrv.length,
      lrvBrands: LRV_BRANDS.map(brandName),
      lrvPendingBrands: LRV_PENDING.map(brandName),
      ral: coverage.ral?.total ?? 0,
      noLiveSource: sum("noFeed") - (coverage.ral?.total ?? 0),
      notInFeed: sum("notInFeed"),
      nameMismatch: sum("nameMismatch"),
      hexOff: sum("hexOff"),
      flagged: sum("flagged"),
      duplicateCode: sum("duplicateCode"),
      lrvFeedOutliers: sum("lrvSkipped"),
      excluded,
    },
    lrv: { pooledCurrentMedian: median(pooledCurrent), brands: lrvBrands, nameWords, whites: { colors: whites.length, belowWhiteLrv: offWhites.length, belowWhiteLrvPct: pct(offWhites.length, whites.length), medianLrv: median(whites.map((r) => r.lrv!)), byBrand: whitesByBrand, darkest: darkestWhites }, retired },
    coty,
    zones,
    perBrand,
  };
}

const CSV_COLUMNS: [string, string][] = [
  ["brand", "name"],
  ["catalog_colors", "catalog"],
  ["current_colors", "current"],
  ["retired_colors", "retired"],
  ["pct_with_no_nearly_identical_twin", "uniquePct"],
  ["colors_verified_against_brand_palette", "verified"],
  ["pct_near_neutral", "nearNeutralPct"],
  ["pct_near_white_neutral", "nearWhitePct"],
  ["current_colors_with_published_lrv", "lrvColors"],
  ["median_published_lrv_current", "medianLrv"],
  ["pct_lrv_80_plus", "lrv80PlusPct"],
  ["pct_lrv_under_20", "lrvUnder20Pct"],
  ["lrv_source", "lrvSource"],
];
const csvCell = (v: unknown) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(perBrand: ReturnType<typeof computeStudy>["perBrand"]): string {
  const lines = [CSV_COLUMNS.map((c) => c[0]).join(",")];
  for (const b of perBrand) lines.push(CSV_COLUMNS.map(([, k]) => csvCell((b as Record<string, unknown>)[k])).join(","));
  return lines.join("\n") + "\n";
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set (looked for .env.local here and in the main checkout).");
    process.exit(2);
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
  const loaded = await load(sb, arg("scan-dir") ?? DEFAULT_SCAN);
  console.log(`Loaded ${loaded.colors.length} colors; ${loaded.rows.length} verified against ${loaded.scanDir}.`);
  console.table(loaded.coverage);
  const dump = arg("dump");
  if (dump) {
    fs.writeFileSync(dump, JSON.stringify({ rows: loaded.rows }));
    console.log(`Dumped verified rows to ${dump}`);
  }
  const study = computeStudy(loaded);
  const json = JSON.stringify(study, null, 2) + "\n";
  if (process.argv.includes("--dry")) {
    process.stdout.write(json);
    return;
  }
  fs.writeFileSync(OUT, json);
  fs.mkdirSync(path.dirname(CSV_OUT), { recursive: true });
  fs.writeFileSync(CSV_OUT, toCsv(study.perBrand));
  console.log(`Wrote ${path.relative(root, OUT)} and ${path.relative(root, CSV_OUT)}.`);
}

// Run only when executed directly, so tests can import the pure helpers.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
