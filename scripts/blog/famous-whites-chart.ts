/**
 * Render the "famous whites, mapped" scatter chart used by
 * /blog/famous-white-paints-compared.
 *
 * x = LAB b* (warmth), y = LRV. Pair callouts use the site closeness
 * vocabulary (src/lib/closeness.ts), never raw Delta E numbers.
 *
 * Writes public/blog/famous-whites-map-full.png (2000x1440) and
 * public/blog/famous-whites-map.webp (1200x864).
 *
 * Usage: npx tsx scripts/blog/famous-whites-chart.ts
 */
import "./load-env";
import * as path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import { deltaE2000, rgbToLab } from "../../src/lib/color-utils";
import type { Lab } from "../../src/lib/color-utils";
import { closenessLabel } from "../../src/lib/closeness";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../public/blog");

// Manufacturer-published values that win over the stored row until
// scripts/fix-bm-whites.ts --apply has run. Harmless afterward.
const PUBLISHED: Record<string, { hex: string; lrv: number }> = {
  "benjamin-moore/white-dove-oc-17": { hex: "#EFEEE5", lrv: 83.2 },
  "benjamin-moore/chantilly-lace-2121-70": { hex: "#F4F6F1", lrv: 90 },
};

type Point = { key: string; label: string; dx: number; dy: number; anchor?: "start" | "middle" | "end" };

// dx/dy: label offset from the swatch center, in pixels.
const POINTS: Point[] = [
  // UPW is the row Behr publishes (LRV 94). W-B-500 (97.3) is not in Behr's live palette.
  { key: "behr/ultra-pure-white-upw", label: "Behr Ultra Pure White", dx: 50, dy: 9, anchor: "start" },
  { key: "behr/polar-bear-75", label: "Behr Polar Bear", dx: 50, dy: 9, anchor: "start" },
  { key: "farrow-ball/all-white-2005", label: "F&B All White", dx: 0, dy: -42 },
  { key: "valspar/ultra-white-7006-24", label: "Valspar Ultra White", dx: 0, dy: -42 },
  { key: "benjamin-moore/chantilly-lace-2121-70", label: "BM Chantilly Lace", dx: -40, dy: 9, anchor: "end" },
  { key: "benjamin-moore/simply-white-2143-70", label: "BM Simply White", dx: 0, dy: 62 },
  { key: "farrow-ball/wimborne-white-239", label: "F&B Wimborne White", dx: 0, dy: -42 },
  { key: "farrow-ball/pointing-2003", label: "F&B Pointing", dx: 0, dy: -42 },
  { key: "sherwin-williams/extra-white-7006", label: "SW Extra White", dx: 0, dy: -42 },
  { key: "sherwin-williams/pure-white-7005", label: "SW Pure White", dx: -48, dy: 0, anchor: "end" },
  { key: "sherwin-williams/snowbound-7004", label: "SW Snowbound", dx: 0, dy: 62 },
  { key: "sherwin-williams/greek-villa-7551", label: "SW Greek Villa", dx: -48, dy: -18, anchor: "end" },
  { key: "benjamin-moore/cloud-white-oc-130", label: "BM Cloud White", dx: 0, dy: -42 },
  { key: "behr/swiss-coffee-12", label: "Behr Swiss Coffee", dx: 50, dy: -14, anchor: "start" },
  { key: "benjamin-moore/swiss-coffee-oc-45", label: "BM Swiss Coffee", dx: 50, dy: 12, anchor: "start" },
  { key: "sherwin-williams/alabaster-7008", label: "SW Alabaster", dx: 0, dy: 66 },
  { key: "benjamin-moore/white-dove-oc-17", label: "BM White Dove", dx: -40, dy: 9, anchor: "end" },
];

// Pairs to call out on the chart. Label text comes from closenessLabel();
// tx/ty offset the label from the connector midpoint, in pixels.
const PAIRS: { a: string; b: string; tx: number; ty: number; anchor: "start" | "middle" | "end" }[] = [
  { a: "benjamin-moore/chantilly-lace-2121-70", b: "behr/polar-bear-75", tx: 0, ty: 64, anchor: "middle" },
  { a: "benjamin-moore/cloud-white-oc-130", b: "behr/swiss-coffee-12", tx: 24, ty: -24, anchor: "start" },
  { a: "sherwin-williams/alabaster-7008", b: "benjamin-moore/white-dove-oc-17", tx: -130, ty: 58, anchor: "middle" },
];

const W = 2000;
const H = 1440;
const PLOT = { x0: 170, x1: 1940, y0: 288, y1: 1296 };
const X = { min: 0.5, max: 9 };
const Y = { min: 80.5, max: 99 };
const sx = (b: number) => PLOT.x0 + ((b - X.min) / (X.max - X.min)) * (PLOT.x1 - PLOT.x0);
const sy = (lrv: number) => PLOT.y1 - ((lrv - Y.min) / (Y.max - Y.min)) * (PLOT.y1 - PLOT.y0);
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const data: Record<string, { hex: string; lrv: number; lab: Lab }> = {};
  for (const p of POINTS) {
    const [brand, slug] = p.key.split("/");
    const { data: row, error } = await supabase
      .from("colors")
      .select("hex,lrv,lab_l,lab_a,lab_b_val,brands!inner(slug)")
      .eq("slug", slug)
      .eq("brands.slug", brand)
      .single();
    if (error || !row) throw new Error(`Missing ${p.key}: ${error?.message}`);
    const pub = PUBLISHED[p.key];
    if (pub && pub.hex.toLowerCase() !== String(row.hex).toLowerCase()) {
      const h = pub.hex.replace("#", "");
      const lab = rgbToLab(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
      console.log(`Using published value for ${p.key}: ${pub.hex} (stored ${row.hex})`);
      data[p.key] = { hex: pub.hex, lrv: pub.lrv, lab };
    } else {
      data[p.key] = { hex: row.hex, lrv: Number(row.lrv), lab: { L: row.lab_l, a: row.lab_a, b: row.lab_b_val } };
    }
  }

  const parts: string[] = [];
  parts.push(`<rect width="${W}" height="${H}" fill="#101014"/>`);
  parts.push(`<text x="110" y="92" font-size="56" fill="#F2EEE6" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">THE FAMOUS WHITES, MAPPED</text>`);
  const sub = [
    "The 17 most-searched white paints, placed by warmth and lightness. Warmth is LAB b* (higher = creamier);",
    "LRV is how much light the paint reflects. On the brands' published values, Alabaster and White Dove",
    "rate nearly identical, and so do Benjamin Moore's Cloud White and Behr's Swiss Coffee.",
  ];
  sub.forEach((t, i) =>
    parts.push(`<text x="110" y="${142 + i * 36}" font-size="26" fill="#9A968E" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">${esc(t)}</text>`),
  );

  // Grid and axes
  parts.push(`<rect x="${PLOT.x0}" y="${PLOT.y0}" width="${PLOT.x1 - PLOT.x0}" height="${PLOT.y1 - PLOT.y0}" fill="none" stroke="#2A2A30" stroke-width="2"/>`);
  for (let b = 1; b <= 9; b++) {
    parts.push(`<line x1="${sx(b)}" y1="${PLOT.y0}" x2="${sx(b)}" y2="${PLOT.y1}" stroke="#222228" stroke-width="1.5"/>`);
    parts.push(`<text x="${sx(b)}" y="${PLOT.y1 + 36}" font-size="22" fill="#6E6A64" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">${b}</text>`);
  }
  for (let l = 82.5; l <= 97.5; l += 2.5) {
    parts.push(`<line x1="${PLOT.x0}" y1="${sy(l)}" x2="${PLOT.x1}" y2="${sy(l)}" stroke="#222228" stroke-width="1.5"/>`);
    parts.push(`<text x="${PLOT.x0 - 18}" y="${sy(l) + 8}" font-size="22" fill="#6E6A64" text-anchor="end" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">${l.toFixed(1)}</text>`);
  }
  parts.push(`<text x="${(PLOT.x0 + PLOT.x1) / 2}" y="${PLOT.y1 + 86}" font-size="30" fill="#9A968E" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">warmth (LAB b*): left is cooler, right is warmer and creamier</text>`);
  parts.push(`<text transform="translate(76 ${(PLOT.y0 + PLOT.y1) / 2}) rotate(-90)" font-size="30" fill="#9A968E" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">Light Reflectance Value (LRV)</text>`);

  // Pair connectors
  for (const pr of PAIRS) {
    const a = data[pr.a];
    const b = data[pr.b];
    const label = closenessLabel(deltaE2000(a.lab, b.lab));
    const color = label === "Nearly identical" ? "#7FB9A0" : label === "Very similar" ? "#D9A86C" : "#D98A6C";
    const ax = sx(a.lab.b), ay = sy(a.lrv), bx = sx(b.lab.b), by = sy(b.lrv);
    parts.push(`<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="4" stroke-dasharray="14 10"/>`);
    const mx = (ax + bx) / 2 + pr.tx;
    const my = (ay + by) / 2 + pr.ty;
    parts.push(`<text x="${mx}" y="${my}" font-size="26" fill="${color}" text-anchor="${pr.anchor}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">${label}</text>`);
  }

  // Swatches and labels
  for (const p of POINTS) {
    const d = data[p.key];
    const cx = sx(d.lab.b);
    const cy = sy(d.lrv);
    parts.push(`<rect x="${cx - 26}" y="${cy - 26}" width="52" height="52" rx="4" fill="${d.hex}" stroke="#3A3A42" stroke-width="3"/>`);
    parts.push(`<text x="${cx + p.dx}" y="${cy + p.dy}" font-size="25" fill="#E8E4DC" text-anchor="${p.anchor ?? "middle"}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">${esc(p.label)}</text>`);
  }

  parts.push(`<text x="110" y="${H - 22}" font-size="23" fill="#5E5A55" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">Data and method: PaintColorHQ, brands' published color values, CIEDE2000. Updated October 2026. Full comparison: paintcolorhq.com/blog/famous-white-paints-compared</text>`);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join("")}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_DIR, "famous-whites-map-full.png"));
  await sharp(Buffer.from(svg)).resize(1200, 864).webp({ quality: 88 }).toFile(path.join(OUT_DIR, "famous-whites-map.webp"));
  console.log("Wrote famous-whites-map-full.png and famous-whites-map.webp");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
