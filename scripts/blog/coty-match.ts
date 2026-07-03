/**
 * coty-match.ts — Color of the Year newsjacking generator.
 *
 * When a paint brand announces its next Color of the Year, run this against the
 * announced hex to get the single closest color in EVERY other brand — ready to
 * drop into a same-day "closest match in every brand" blog post. Announcements
 * cluster Aug–Oct; see docs/coty-playbook.md for the runbook and the per-brand
 * announcement windows.
 *
 * For the input hex it converts sRGB → CIE LAB (D65), then calls the existing
 * nearest_colors_by_lab RPC (migration 010) once per brand (in_limit 3) and
 * refines each candidate with the exact CIEDE2000 formula — the same two-stage
 * method the live matcher uses (src/lib/color-match.ts) — keeping the closest
 * color per brand.
 *
 * Output: (1) a ranked table for the terminal, (2) a ready-to-paste JSX block
 * for a new src/lib/blog-posts.tsx entry, (3) a same-day publish checklist.
 *
 * Usage:
 *   npm run coty -- --hex B8A992 --name "Universal Khaki" --brand "Sherwin-Williams" --number "SW 6150"
 *   npx tsx scripts/blog/coty-match.ts --hex #B8A992 --name "..." --brand "..." [--number "..."]
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { hexToRgb, rgbToLab, deltaE2000, type Lab } from "../../src/lib/color-utils.ts";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

// CLI args — space-separated values, e.g. `--hex B8A992` (matches check-samplize).
const argv = process.argv.slice(2);
const getArg = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const USAGE =
  'Usage: npm run coty -- --hex B8A992 --name "Universal Khaki" --brand "Sherwin-Williams" --number "SW 6150"\n' +
  "  --hex     required  6-digit sRGB hex, with or without #\n" +
  "  --name    required  the announced color's name\n" +
  "  --brand   required  the announcing brand (name or slug)\n" +
  "  --number  optional  the color code (e.g. SW 6150)";

/** Normalize a hex string → "#RRGGBB" uppercase, or null if it isn't 6 hex digits. */
function normalizeHex(raw: string): string | null {
  const clean = raw.replace(/^#/, "").trim();
  return /^[0-9a-fA-F]{6}$/.test(clean) ? `#${clean.toUpperCase()}` : null;
}

// Site convention (src/app/colors/[brandSlug]/[colorSlug]/page.tsx): plain-language
// closeness, never a raw number in the UI. <2 nearly identical, <5 very similar.
function closenessLabel(deltaE: number): string {
  return deltaE < 2 ? "Nearly identical" : deltaE < 5 ? "Very similar" : "Visible difference";
}

// PostgREST may serialize numeric columns as strings; coerce to number | null.
function num(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// One row from nearest_colors_by_lab (flat brand columns; numeric fields may
// arrive as strings from PostgREST, so everything numeric is coerced below).
interface CandidateRow {
  name: string;
  hex: string;
  slug: string;
  color_number: string | null;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number | string | null;
  lab_a: number | string | null;
  lab_b_val: number | string | null;
  brand_name: string;
  brand_slug: string;
}

interface BrandMatch {
  brandName: string;
  brandSlug: string;
  colorName: string;
  colorNumber: string | null;
  hex: string;
  slug: string;
  deltaE: number;
}

async function main() {
  const nameArg = getArg("--name");
  const brandArg = getArg("--brand");
  const numberArg = getArg("--number");
  const hexArg = getArg("--hex");

  if (!hexArg || !nameArg || !brandArg) {
    console.error("Missing required argument.\n\n" + USAGE);
    process.exit(1);
  }
  const hex = normalizeHex(hexArg);
  if (!hex) {
    console.error(`Bad hex: "${hexArg}" — need 6 hex digits (e.g. B8A992 or #B8A992).\n\n` + USAGE);
    process.exit(1);
  }

  const { r, g, b } = hexToRgb(hex);
  const inputLab = rgbToLab(r, g, b);

  // Every brand we track, so we can hit the RPC once per brand and resolve the
  // announcing brand (matched on name OR slug, case-insensitive).
  const { data: brands, error: brandsErr } = await supabase
    .from("brands")
    .select("slug, name")
    .order("name");
  if (brandsErr) throw new Error(`Could not read brands: ${brandsErr.message}`);
  if (!brands || brands.length === 0) throw new Error("No brands in the database.");

  const announced = brands.find(
    (br) =>
      br.slug.toLowerCase() === brandArg.toLowerCase() ||
      br.name.toLowerCase() === brandArg.toLowerCase(),
  );
  if (!announced) {
    console.error(
      `⚠️  "${brandArg}" didn't match a tracked brand by name or slug — its own brand won't be ` +
        `excluded from the matches. Tracked: ${brands.map((br) => br.slug).join(", ")}`,
    );
  }
  const refBrandName = announced ? announced.name : brandArg;

  // Closest color per brand, skipping the announcing brand (it's the reference,
  // not a match).
  const results: BrandMatch[] = [];
  for (const brand of brands) {
    if (announced && brand.slug === announced.slug) continue;

    const { data, error } = await supabase.rpc("nearest_colors_by_lab", {
      in_l: inputLab.L,
      in_a: inputLab.a,
      in_b: inputLab.b,
      in_brand: brand.slug,
      in_limit: 3,
    });
    if (error) throw new Error(`RPC nearest_colors_by_lab failed for ${brand.slug}: ${error.message}`);

    const rows = (data ?? []) as CandidateRow[];
    let best: BrandMatch | null = null;
    for (const row of rows) {
      const labL = num(row.lab_l);
      const labA = num(row.lab_a);
      const labB = num(row.lab_b_val);
      const candidateLab: Lab =
        labL != null && labA != null && labB != null
          ? { L: labL, a: labA, b: labB }
          : rgbToLab(row.rgb_r, row.rgb_g, row.rgb_b);
      const deltaE = Number(deltaE2000(inputLab, candidateLab).toFixed(2));
      if (!best || deltaE < best.deltaE) {
        best = {
          brandName: brand.name,
          brandSlug: brand.slug,
          colorName: row.name,
          colorNumber: row.color_number,
          hex: row.hex,
          slug: row.slug,
          deltaE,
        };
      }
    }
    if (best) results.push(best);
  }
  results.sort((a, z) => a.deltaE - z.deltaE);

  if (results.length === 0) throw new Error("No matches found in any brand — check the hex and the DB.");

  printTable(refBrandName, nameArg, numberArg, hex, results);
  printJsx(refBrandName, nameArg, numberArg, hex, results);
  printChecklist(refBrandName, nameArg, numberArg, hex, results);
}

/** (1) Human-readable ranked table. */
function printTable(
  refBrand: string,
  name: string,
  number: string | undefined,
  hex: string,
  results: BrandMatch[],
) {
  const refLabel = number ? `${name} (${number})` : name;
  console.log("\n=== Closest match per brand ===");
  console.log(`Reference: ${refLabel} · ${refBrand} · ${hex}\n`);

  const head = ["Brand", "Color", "Number", "Hex", "ΔE", "Closeness"];
  const rows = results.map((m) => [
    m.brandName,
    m.colorName,
    m.colorNumber ?? "—",
    m.hex.toUpperCase(),
    m.deltaE.toFixed(2),
    closenessLabel(m.deltaE),
  ]);
  const widths = head.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length)),
  );
  const line = (cells: string[]) =>
    cells.map((c, i) => c.padEnd(widths[i])).join("  ");
  console.log(line(head));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const r of rows) console.log(line(r));
}

/** (2) Ready-to-paste JSX for a new src/lib/blog-posts.tsx entry. */
function printJsx(
  refBrand: string,
  name: string,
  number: string | undefined,
  hex: string,
  results: BrandMatch[],
) {
  const closest = results[0];
  const refSwatchName = number ? `${name} ${number}` : name;

  // Reference row first (mirrors the most-duplicated post, where the reference
  // color is row 1). No href: a brand-new CotY usually has no PCHQ page yet —
  // add one to the reference row once its color page exists.
  const rowLines: string[] = [
    `                { brand: ${j(refBrand)}, swatch: { hex: ${j(hex)}, name: ${j(refSwatchName)}, href: undefined }, close: "the reference" },`,
  ];
  for (const m of results) {
    const swatchName = m.colorNumber ? `${m.colorName} ${m.colorNumber}` : m.colorName;
    const href = `/colors/${m.brandSlug}/${m.slug}`;
    const close = `${closenessLabel(m.deltaE)} (ΔE ${m.deltaE.toFixed(2)})`;
    rowLines.push(
      `                { brand: ${j(m.brandName)}, swatch: { hex: ${j(m.hex.toUpperCase())}, name: ${j(swatchName)}, href: ${j(href)} }, close: ${j(close)} },`,
    );
  }

  const strongName = number ? `${name} ${number}` : name;
  const jsx = `        <p className="text-lg leading-relaxed text-gray-800">
          ${escapeText(refBrand)} named <strong>${escapeText(strongName)}</strong> its Color of the
          Year (hex ${hex}). Below is the closest color in every other brand we track, scored with
          CIEDE2000 (Delta E 2000) — the color-difference standard paint manufacturers use for
          quality control. The nearest overall is ${escapeText(closest.colorName)} from{" "}
          ${escapeText(closest.brandName)} (${closenessLabel(closest.deltaE).toLowerCase()}).
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold">Brand</th>
                <th className="py-2 pr-4 font-semibold">Closest color</th>
                <th className="py-2 font-semibold">How close</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {[
${rowLines.join("\n")}
              ].map((row) => (
                <tr key={row.brand} className="border-b border-gray-100">
                  <td className="py-2 pr-4 whitespace-nowrap">{row.brand}</td>
                  <td className="py-2 pr-4"><Swatch hex={row.swatch.hex} name={row.swatch.name} href={row.swatch.href} /></td>
                  <td className="py-2 whitespace-nowrap text-gray-600">{row.close}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Closest match shown per brand, scored with CIEDE2000 (Delta E 2000) against ${escapeText(name)}.
          Under 2.0 is very close; formulas, sheens, and bases still differ between brands, so confirm
          the final pick with a physical sample.
        </p>`;

  console.log("\n=== Paste into a new src/lib/blog-posts.tsx content() block ===\n");
  console.log(jsx);
}

/** (3) Same-day publish checklist. */
function printChecklist(
  refBrand: string,
  name: string,
  number: string | undefined,
  hex: string,
  results: BrandMatch[],
) {
  const today = new Date().toISOString().slice(0, 10);
  const closest = results[0];
  const codeSuffix = number ? ` ${number}` : "";
  console.log("\n=== Same-day checklist ===");
  console.log(
    `1. Paste the JSX into a new src/lib/blog-posts.tsx entry — date: "${today}" (today = publishes
   immediately). Set author "Philip Cameron"; fill title, excerpt, tags, and the faq field.
2. PR through the preview gate (run seo-preflight and seo-drift), then merge.
3. IndexNow — preferred: npm run indexnow-blog -- --slug=<your-post-slug>
   raw curl fallback (key file: public/a28e7cd07d004d4b94cfcd6bc2129bda.txt):
     curl -X POST "https://api.indexnow.org/indexnow" \\
       -H "Content-Type: application/json; charset=utf-8" \\
       -d '{"host":"www.paintcolorhq.com","key":"a28e7cd07d004d4b94cfcd6bc2129bda","keyLocation":"https://www.paintcolorhq.com/a28e7cd07d004d4b94cfcd6bc2129bda.txt","urlList":["https://www.paintcolorhq.com/blog/<your-post-slug>"]}'
4. Request indexing in the GSC UI (URL Inspection → Request Indexing) for the new URL.
5. If ${refBrand} is a major brand, add a line to public/llms.txt under "Common Questions This Site Answers":
     - What is the ${refBrand} [year] Color of the Year? → ${name}${codeSuffix} — hex ${hex}, closest cross-brand match ${closest.colorName} (${closest.brandName}, ${closenessLabel(closest.deltaE).toLowerCase()}).
6. Pinterest — queue a pin via the existing drip (see project memory: Pinterest automation pipeline).`,
  );
}

/** JS string literal for embedding in the generated array (handles quotes/backslashes). */
function j(value: string): string {
  return JSON.stringify(value);
}

/** Escape a string for use as JSX text content (only & and < are unsafe there). */
function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
