/**
 * check-nearest-v2.ts: verify migration 015 (nearest_colors_by_lab_v2) after it
 * is applied. Read-only: it only calls the two RPCs over GET with the anon key,
 * the same way src/lib/color-match.ts does, so it also proves the anon grant.
 *
 *   npx tsx scripts/check-nearest-v2.ts            # 50 hexes, limit 200
 *   npx tsx scripts/check-nearest-v2.ts --limit 50 # smaller pool
 *
 * Checks, per hex (50 fixed hexes, each run unfiltered; every 5th also with a
 * brand filter):
 *   1. v1 still answers (no error, non-empty).
 *   2. v2 answers with the same number of rows.
 *   3. Same rows apart from availability: per position, the LAB distance
 *      matches; within an exact-distance tie, the id sets match (v2 breaks
 *      ties on id, v1 does not, so order inside a tie may differ). The last
 *      tie group can be cut by the limit, so there only the count must match.
 *      Every shared id carries identical values in all 16 v1 columns.
 *   4. availability is one of current / retired / discontinued on every row.
 *   5. in_current_only=true returns only current rows, and they are exactly
 *      the current rows of the unfiltered v2 call in the same order (prefix).
 *
 * Exits 1 on any failure. Prints how many top-1 results are retired or
 * discontinued, which is the number the v2 labels exist to surface.
 */
import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { hexToRgb, rgbToLab } from "../src/lib/color-utils.ts";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (.env.local).");
  process.exit(1);
}
const supabase = createClient(url, anonKey);

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : 200;

const V1_COLUMNS = [
  "id", "name", "hex", "slug", "color_number",
  "rgb_r", "rgb_g", "rgb_b", "lab_l", "lab_a", "lab_b_val",
  "undertone", "lrv", "color_family", "brand_name", "brand_slug",
] as const;
const AVAILABILITY = new Set(["current", "retired", "discontinued"]);
const BRANDS = ["sherwin-williams", "benjamin-moore", "behr", "valspar", "ppg"];

// 20 common neutrals and named-color reference points, then 30 hexes spread
// over the RGB cube by a fixed linear congruential generator (same every run).
const FIXED = [
  "#ffffff", "#f5f5f0", "#ede6d6", "#d6cfc4", "#c2b8a3", "#a89f91", "#8a8378",
  "#6e6a64", "#4a4a48", "#222222", "#000000", "#e8dccb", "#b5a48b", "#7d8471",
  "#2f4f4f", "#1f3a5f", "#5b7c99", "#c8553d", "#f2c14e", "#6b4226",
];
function lcgHexes(n: number): string[] {
  let s = 20261024;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    out.push("#" + (s % 0x1000000).toString(16).padStart(6, "0"));
  }
  return out;
}
const HEXES = [...FIXED, ...lcgHexes(30)];

type Row = Record<string, unknown>;

async function call(fn: string, args: Record<string, unknown>): Promise<Row[]> {
  const { data, error } = await supabase.rpc(fn, args, { get: true });
  if (error) throw new Error(`${fn} ${JSON.stringify(args)}: ${error.message}`);
  return (data ?? []) as Row[];
}

function dist(r: Row, l: number, a: number, b: number): number {
  const dl = Number(r.lab_l) - l;
  const da = Number(r.lab_a) - a;
  const db = Number(r.lab_b_val) - b;
  return dl * dl + da * da + db * db;
}

// Split rows into consecutive groups of (numerically) equal distance.
function tieGroups(rows: Row[], l: number, a: number, b: number): Row[][] {
  const groups: Row[][] = [];
  let last = NaN;
  for (const r of rows) {
    const d = dist(r, l, a, b);
    if (groups.length && Math.abs(d - last) <= 1e-9 * Math.max(1, d)) groups[groups.length - 1].push(r);
    else groups.push([r]);
    last = d;
  }
  return groups;
}

function compare(v1: Row[], v2: Row[], l: number, a: number, b: number): string[] {
  const errs: string[] = [];
  if (v1.length === 0) errs.push("v1 returned 0 rows");
  if (v1.length !== v2.length) {
    errs.push(`row count v1=${v1.length} v2=${v2.length}`);
    return errs;
  }
  const g1 = tieGroups(v1, l, a, b);
  const g2 = tieGroups(v2, l, a, b);
  if (g1.length !== g2.length) {
    errs.push(`tie-group count v1=${g1.length} v2=${g2.length}`);
    return errs;
  }
  for (let i = 0; i < g1.length; i++) {
    const ids1 = g1[i].map((r) => String(r.id)).sort();
    const ids2 = g2[i].map((r) => String(r.id)).sort();
    const isLast = i === g1.length - 1;
    if (ids1.length !== ids2.length) errs.push(`group ${i}: size v1=${ids1.length} v2=${ids2.length}`);
    else if (!isLast && ids1.join() !== ids2.join()) errs.push(`group ${i}: different ids at equal distance`);
  }
  const byId = new Map(v2.map((r) => [String(r.id), r]));
  for (const r1 of v1) {
    const r2 = byId.get(String(r1.id));
    if (!r2) continue; // only possible inside the limit-cut last tie group
    for (const col of V1_COLUMNS) {
      if (JSON.stringify(r1[col]) !== JSON.stringify(r2[col])) {
        errs.push(`id ${r1.id}: ${col} v1=${JSON.stringify(r1[col])} v2=${JSON.stringify(r2[col])}`);
      }
    }
  }
  for (const r of v2) {
    if (!AVAILABILITY.has(String(r.availability))) errs.push(`id ${r.id}: availability=${JSON.stringify(r.availability)}`);
    const extra = Object.keys(r).filter((k) => k !== "availability" && !(V1_COLUMNS as readonly string[]).includes(k));
    if (extra.length) errs.push(`unexpected v2 columns: ${extra.join(", ")}`);
  }
  return errs;
}

async function main() {
  let failures = 0;
  let cases = 0;
  let identical = 0;
  let top1NotCurrent = 0;

  for (let i = 0; i < HEXES.length; i++) {
    const hex = HEXES[i];
    const { r, g, b } = hexToRgb(hex);
    const lab = rgbToLab(r, g, b);
    const brands: (string | null)[] = [null];
    if (i % 5 === 0) brands.push(BRANDS[(i / 5) % BRANDS.length]);

    for (const brand of brands) {
      cases++;
      const args: Record<string, unknown> = { in_l: lab.L, in_a: lab.a, in_b: lab.b, in_limit: LIMIT };
      if (brand) args.in_brand = brand; // omit when unfiltered, as color-match.ts does
      const label = `${hex}${brand ? ` [${brand}]` : ""}`;
      try {
        const [v1, v2, cur] = await Promise.all([
          call("nearest_colors_by_lab", args),
          call("nearest_colors_by_lab_v2", args),
          call("nearest_colors_by_lab_v2", { ...args, in_current_only: true }),
        ]);
        const errs = compare(v1, v2, lab.L, lab.a, lab.b);

        if (cur.some((x) => x.availability !== "current")) errs.push("in_current_only returned a non-current row");
        const v2Current = v2.filter((x) => x.availability === "current").map((x) => String(x.id));
        const curIds = cur.map((x) => String(x.id));
        // v2's current rows must be a prefix of the current-only call (which
        // can reach further, since it skips the non-current rows).
        const prefixOk = v2Current.length <= curIds.length && v2Current.every((id, k) => curIds[k] === id);
        if (!prefixOk) errs.push("in_current_only order differs from unfiltered v2's current rows");

        if (!brand && v2[0] && v2[0].availability !== "current") top1NotCurrent++;

        if (errs.length) {
          failures++;
          console.log(`FAIL ${label}`);
          for (const e of errs.slice(0, 8)) console.log(`     ${e}`);
        } else {
          identical++;
          console.log(`ok   ${label}  rows=${v2.length}  top1=${v2[0]?.name} (${v2[0]?.availability})`);
        }
      } catch (err) {
        failures++;
        console.log(`FAIL ${label}  ${(err as Error).message}`);
      }
    }
  }

  console.log("");
  console.log(`${identical} of ${cases} cases identical apart from availability (${HEXES.length} hexes, limit ${LIMIT}).`);
  console.log(`${top1NotCurrent} of ${HEXES.length} unfiltered top-1 results are retired or discontinued.`);
  console.log("Also run the Supabase security advisor: expect no function_search_path_mutable entry for nearest_colors_by_lab_v2.");
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
