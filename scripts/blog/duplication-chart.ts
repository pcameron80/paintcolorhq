/**
 * Render the duplication-study chart used by /blog/most-duplicated-paint-color.
 *
 * Top: every color each paint brand sells as a hue-sorted strip, with the share
 * of its palette that has no nearly identical twin at another brand. Bottom:
 * "Exhibit A", Benjamin Moore Flurry and its closest twin at each other brand.
 *
 * Figures come from src/data/duplication-study.json (npm run study-duplication),
 * so run that first. Wording uses the site closeness vocabulary
 * (src/lib/closeness.ts), never raw Delta E numbers.
 *
 * Writes public/blog/most-duplicated-paint-color-chart-full.png (2400x3186) and
 * public/blog/most-duplicated-paint-color-chart.webp (1200x1593).
 *
 * Usage: npx tsx scripts/blog/duplication-chart.ts
 */
import "./load-env";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/blog");
const PAGE = 1000;

interface Study {
  runDate: string;
  totals: { colors: number; brands: number };
  twins: { twinnedPct: number };
  exactHex: { hexes: number };
  brands: { name: string; slug: string; total: number }[];
  originality: { name: string; slug: string; total: number; uniquePct: number }[];
}

interface Row {
  id: string;
  hex: string;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  brands: { slug: string };
}

const W = 2400;
const H = 3186;
const ML = 132;
const CW = W - 2 * ML;
const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const fmt = (n: number) => n.toLocaleString("en-US");
const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"];

const text = (x: number, y: number, size: number, fill: string, s: string, anchor: "start" | "middle" | "end" = "start") =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-family="${FONT}">${esc(s)}</text>`;

/** Hue order for a strip: chromatic colors by LCh hue starting at red, then neutrals light to dark. */
function stripOrder(rows: Row[]): Row[] {
  const NEUTRAL_CHROMA = 8;
  const START_HUE = 20; // LCh hue of a clear red; pinks below it wrap to the end of the chromatic run
  const keyed = rows.map((r) => {
    const c = Math.hypot(r.lab_a, r.lab_b_val);
    const h = ((Math.atan2(r.lab_b_val, r.lab_a) * 180) / Math.PI + 360) % 360;
    return { r, neutral: c < NEUTRAL_CHROMA, hue: (h - START_HUE + 360) % 360, L: r.lab_l };
  });
  const chromatic = keyed.filter((k) => !k.neutral).sort((a, b) => a.hue - b.hue);
  const neutral = keyed.filter((k) => k.neutral).sort((a, b) => b.L - a.L);
  return [...chromatic, ...neutral].map((k) => k.r);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set (looked for .env.local here and in the main checkout).");
    process.exit(2);
  }
  const study = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/duplication-study.json"), "utf8")) as Study;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);

  // Every color, keyset-paginated on the primary key.
  const rows: Row[] = [];
  for (let after: string | null = null; ; ) {
    let q = sb.from("colors").select("id, hex, lab_l, lab_a, lab_b_val, brands!inner(slug)").order("id").limit(PAGE);
    if (after) q = q.gt("id", after);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as unknown as Row[]));
    if (!data || data.length < PAGE) break;
    after = data[data.length - 1].id as string;
  }
  if (rows.length !== study.totals.colors)
    console.warn(`Note: DB has ${rows.length} colors, the study JSON ${study.totals.colors}. Re-run npm run study-duplication.`);

  // Exhibit A: Flurry and its rank-1 twin at each other brand.
  const { data: flurry, error: fErr } = await sb
    .from("colors")
    .select("id, name, hex, brands!inner(slug, name)")
    .eq("slug", "flurry-cc-100")
    .eq("brands.slug", "benjamin-moore")
    .single();
  if (fErr || !flurry) throw new Error(`Flurry not found: ${fErr?.message}`);
  const { data: twinRows, error: tErr } = await sb
    .from("cross_brand_matches")
    .select("delta_e_score, match:match_color_id (name, hex, brands!inner(slug, name))")
    .eq("source_color_id", flurry.id)
    .eq("rank", 1)
    .lt("delta_e_score", 1.0)
    .order("delta_e_score");
  if (tErr) throw new Error(tErr.message);
  type Twin = { delta_e_score: number; match: { name: string; hex: string; brands: { slug: string; name: string } } };
  const twins = (twinRows ?? []) as unknown as Twin[];
  // RAL is a standard, not a paint brand: show it last and label it so.
  twins.sort((a, b) => Number(a.match.brands.slug === "ral") - Number(b.match.brands.slug === "ral"));
  const exhibit = [
    { brand: (flurry.brands as unknown as { name: string }).name, name: flurry.name as string, hex: flurry.hex as string },
    ...twins.map((t) => ({ brand: t.match.brands.slug === "ral" ? "RAL (standard)" : t.match.brands.name, name: t.match.name, hex: t.match.hex })),
  ];

  const asOf = new Date(`${study.runDate}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const parts: string[] = [];
  parts.push(`<rect width="${W}" height="${H}" fill="#101014"/>`);

  // Title and subtitle
  parts.push(text(ML, 140, 84, "#F2EEE6", "SEVEN IN TEN PAINT COLORS HAVE"));
  parts.push(text(ML, 228, 84, "#F2EEE6", "A NEARLY IDENTICAL TWIN"));
  [
    `All ${fmt(study.totals.colors)} colors from ${study.totals.brands} paint brands, compared with the CIEDE2000 color-difference standard.`,
    `${study.twins.twinnedPct}% have a nearly identical twin at a competing brand, close enough that most people cannot tell`,
    `them apart side by side, and ${fmt(study.exactHex.hexes)} exact hex values are sold under different names by two or more brands.`,
  ].forEach((t, i) => parts.push(text(ML, 292 + i * 44, 32, "#9A968E", t)));

  // One strip per paint brand, most original first.
  const BLOCK = 150;
  const Y0 = 430;
  study.originality.forEach((b, i) => {
    const y = Y0 + i * BLOCK;
    const own = stripOrder(rows.filter((r) => r.brands.slug === b.slug));
    parts.push(
      `<text x="${ML}" y="${y + 32}" font-size="34" fill="#F2EEE6" font-family="${FONT}">${esc(b.name)}<tspan dx="16" font-size="26" fill="#6E6A64">${fmt(own.length)} colors</tspan></text>`,
    );
    parts.push(text(ML + CW, y + 32, 34, "#F2EEE6", `${b.uniquePct.toFixed(1)}% unique`, "end"));
    const w = CW / own.length;
    own.forEach((r, j) => {
      parts.push(`<rect x="${(ML + j * w).toFixed(2)}" y="${y + 48}" width="${(w + 0.6).toFixed(2)}" height="72" fill="${r.hex}"/>`);
    });
    parts.push(`<rect x="${ML}" y="${y + 128}" width="${CW}" height="8" fill="#2A2A30"/>`);
    parts.push(`<rect x="${ML}" y="${y + 128}" width="${((CW * b.uniquePct) / 100).toFixed(1)}" height="8" fill="#F2EEE6"/>`);
  });

  const yCap = Y0 + study.originality.length * BLOCK + 30;
  [
    "Each strip: every color the brand sells, sorted by hue. White bar: the share of the palette no other brand sells",
    "nearly identically. The RAL classic standard is included in the comparison but not shown as a palette.",
  ].forEach((t, i) => parts.push(text(ML, yCap + i * 38, 26, "#6E6A64", t)));

  // Exhibit A
  const yEx = yCap + 170;
  parts.push(text(ML, yEx, 44, "#F2EEE6", "EXHIBIT A: THE MOST DUPLICATED COLOR IN AMERICA"));
  // One swatch per brand, so the swatch count is the brand count (RAL included, as in the post).
  [
    `${NUMBER_WORDS[exhibit.length] ?? exhibit.length} of the ${NUMBER_WORDS[study.totals.brands]?.toLowerCase() ?? study.totals.brands} brands we track sell this warm off-white, under different names and at different prices.`,
    "Benjamin Moore's Flurry and Dunn-Edwards' Swan White share the same hex value; the rest rate nearly identical to it.",
  ].forEach((t, i) => parts.push(text(ML, yEx + 60 + i * 44, 30, "#9A968E", t)));

  const GAP = 16;
  const sw = (CW - GAP * (exhibit.length - 1)) / exhibit.length;
  const ySw = yEx + 160;
  exhibit.forEach((e, i) => {
    const x = ML + i * (sw + GAP);
    parts.push(`<rect x="${x.toFixed(1)}" y="${ySw}" width="${sw.toFixed(1)}" height="270" fill="${e.hex}"/>`);
    parts.push(text(x + sw / 2, ySw + 316, 22, "#E8E4DC", e.brand, "middle"));
    parts.push(text(x + sw / 2, ySw + 352, 22, "#8A867E", e.name, "middle"));
  });

  parts.push(text(ML, H - 86, 26, "#5E5A55", `Data and method: PaintColorHQ, CIEDE2000 computed across all ${fmt(study.totals.colors)} colors. Updated ${asOf}.`));
  parts.push(text(ML, H - 46, 26, "#5E5A55", "Full study: paintcolorhq.com/blog/most-duplicated-paint-color"));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${parts.join("")}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_DIR, "most-duplicated-paint-color-chart-full.png"));
  await sharp(Buffer.from(svg)).resize(1200, 1593).webp({ quality: 88 }).toFile(path.join(OUT_DIR, "most-duplicated-paint-color-chart.webp"));
  console.log(`Wrote most-duplicated-paint-color-chart-full.png (${W}x${H}) and most-duplicated-paint-color-chart.webp (1200x1593).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
