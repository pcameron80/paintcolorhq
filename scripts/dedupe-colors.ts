/**
 * Consolidate duplicate color rows (same brand + name + hex) into one
 * canonical row per group. See scripts/lib/dedupe-rules.ts for how the
 * canonical row is chosen.
 *
 * For each group this script:
 *   1. Folds the dupes' color numbers into canonical.alternate_numbers
 *   2. Backfills canonical fields that are null but present on a dupe
 *      (lrv, undertone, description_extended, collections)
 *   3. Re-points any project_colors rows from dupes to the canonical
 *   4. Deletes the dupes' cross_brand_matches rows (both directions) —
 *      matches are fully recomputed afterwards anyway (compute-matches +
 *      seed-matches), this just keeps the DB consistent in between
 *   5. Deletes the dupe color rows
 *   6. Refreshes brands.color_count for affected brands
 *
 * It always (re)writes src/data/color-redirects.json — the old-slug →
 * canonical-slug map that next.config.ts turns into 301 redirects. That file
 * is committed; run this in dry-run mode and commit the result BEFORE
 * applying, so redirects deploy alongside (or ahead of) the row deletion.
 *
 * Usage:
 *   tsx scripts/dedupe-colors.ts          # dry run: report + redirect map only
 *   tsx scripts/dedupe-colors.ts --apply  # perform the DB changes
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { dupeGroupKey, pickCanonical } from "./lib/dedupe-rules";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const REDIRECTS_FILE = path.resolve(
  __dirname,
  "../src/data/color-redirects.json",
);
const APPLY = process.argv.includes("--apply");

interface ColorRow {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  color_number: string | null;
  hex: string;
  lrv: number | null;
  undertone: string | null;
  description_extended: string | null;
  collections: unknown;
  alternate_numbers: string[] | null;
  created_at: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // --- Load brands + all colors -------------------------------------------
  const { data: brands, error: brandErr } = await supabase
    .from("brands")
    .select("id, slug");
  if (brandErr || !brands) {
    console.error("Failed to fetch brands:", brandErr?.message);
    process.exit(1);
  }
  const brandSlugById = new Map<string, string>(
    brands.map((b) => [b.id, b.slug]),
  );

  console.log("Loading colors...");
  const colors: ColorRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("colors")
      .select(
        "id, brand_id, name, slug, color_number, hex, lrv, undertone, description_extended, collections, alternate_numbers, created_at",
      )
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) {
      console.error("Failed to fetch colors:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    colors.push(...(data as ColorRow[]));
    from += data.length;
  }
  console.log(`  ${colors.length} colors loaded`);

  // --- Find duplicate groups and pick canonicals ---------------------------
  const groups = new Map<string, ColorRow[]>();
  for (const c of colors) {
    const key = dupeGroupKey(c.brand_id, c.name, c.hex);
    const list = groups.get(key);
    if (list) list.push(c);
    else groups.set(key, [c]);
  }

  interface PlanEntry {
    brandSlug: string;
    canonical: ColorRow;
    dupes: ColorRow[];
    alternates: string[];
  }
  const plan: PlanEntry[] = [];
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    const brandSlug = brandSlugById.get(rows[0].brand_id) ?? "?";
    const { canonical, dupes, alternates } = pickCanonical(rows, brandSlug);
    plan.push({ brandSlug, canonical, dupes, alternates });
  }
  plan.sort((a, b) =>
    `${a.brandSlug}/${a.canonical.slug}`.localeCompare(
      `${b.brandSlug}/${b.canonical.slug}`,
    ),
  );

  const dupeIds = plan.flatMap((p) => p.dupes.map((d) => d.id));
  const perBrand = new Map<string, number>();
  for (const p of plan) {
    perBrand.set(p.brandSlug, (perBrand.get(p.brandSlug) ?? 0) + p.dupes.length);
  }

  console.log(`\nDuplicate groups: ${plan.length}`);
  console.log(`Rows to delete:  ${dupeIds.length}`);
  for (const [brand, n] of [...perBrand].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${brand}: ${n}`);
  }

  // --- Write redirect map (always, including dry runs) ----------------------
  const redirects: Record<string, string> = {};
  for (const p of plan) {
    for (const d of p.dupes) {
      redirects[`${p.brandSlug}/${d.slug}`] = `${p.brandSlug}/${p.canonical.slug}`;
    }
  }
  fs.mkdirSync(path.dirname(REDIRECTS_FILE), { recursive: true });
  fs.writeFileSync(REDIRECTS_FILE, JSON.stringify(redirects, null, 2) + "\n");
  console.log(
    `\nRedirect map written: ${REDIRECTS_FILE} (${Object.keys(redirects).length} entries)`,
  );

  // --- Report ---------------------------------------------------------------
  console.log("\nPlan (canonical ← dupes):");
  for (const p of plan) {
    const alts = p.alternates.length ? `  alt#: [${p.alternates.join(", ")}]` : "";
    console.log(
      `  ${p.brandSlug}/${p.canonical.slug} ← ${p.dupes.map((d) => d.slug).join(", ")}${alts}`,
    );
  }

  if (!APPLY) {
    console.log("\nDry run — no DB changes. Re-run with --apply to execute.");
    return;
  }

  // --- Apply ----------------------------------------------------------------
  console.log("\nApplying...");

  // 1. Update canonical rows: alternate_numbers + null-field backfill
  let updated = 0;
  for (const p of plan) {
    const patch: Record<string, unknown> = {};
    const existingAlts = p.canonical.alternate_numbers ?? [];
    const mergedAlts = [...new Set([...existingAlts, ...p.alternates])];
    if (mergedAlts.length > 0) patch.alternate_numbers = mergedAlts;
    for (const field of ["lrv", "undertone", "description_extended", "collections"] as const) {
      if (p.canonical[field] == null) {
        const donor = p.dupes.find((d) => d[field] != null);
        if (donor) patch[field] = donor[field];
      }
    }
    if (Object.keys(patch).length === 0) continue;
    const { error } = await supabase
      .from("colors")
      .update(patch)
      .eq("id", p.canonical.id);
    if (error) {
      console.error(`  Update failed for ${p.canonical.slug}:`, error.message);
      process.exit(1);
    }
    updated++;
  }
  console.log(`  Canonical rows updated: ${updated}`);

  // 2. Re-point user project colors (defensive — usually zero rows)
  for (const p of plan) {
    for (const d of p.dupes) {
      const { error } = await supabase
        .from("project_colors")
        .update({ color_id: p.canonical.id })
        .eq("color_id", d.id);
      if (error) {
        console.error(`  project_colors re-point failed for ${d.slug}:`, error.message);
        process.exit(1);
      }
    }
  }
  console.log("  project_colors re-pointed");

  // 3+4. Delete matches referencing dupes (both directions)
  for (const col of ["source_color_id", "match_color_id"] as const) {
    let deleted = 0;
    for (const ids of chunk(dupeIds, 50)) {
      const { data, error } = await supabase
        .from("cross_brand_matches")
        .delete()
        .in(col, ids)
        .select("id");
      if (error) {
        console.error(`  Match delete (${col}) failed:`, error.message);
        process.exit(1);
      }
      deleted += data?.length ?? 0;
    }
    console.log(`  cross_brand_matches deleted via ${col}: ${deleted}`);
  }

  // 5. Delete dupe color rows
  let deletedColors = 0;
  for (const ids of chunk(dupeIds, 100)) {
    const { data, error } = await supabase
      .from("colors")
      .delete()
      .in("id", ids)
      .select("id");
    if (error) {
      console.error("  Color delete failed:", error.message);
      process.exit(1);
    }
    deletedColors += data?.length ?? 0;
  }
  console.log(`  Color rows deleted: ${deletedColors}`);

  // 6. Refresh brands.color_count for affected brands
  const affectedBrandIds = [...new Set(plan.map((p) => p.canonical.brand_id))];
  for (const brandId of affectedBrandIds) {
    const { count, error } = await supabase
      .from("colors")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", brandId);
    if (error || count == null) {
      console.error(`  Count failed for brand ${brandId}:`, error?.message);
      continue;
    }
    const { error: updErr } = await supabase
      .from("brands")
      .update({ color_count: count })
      .eq("id", brandId);
    if (updErr) console.error(`  color_count update failed:`, updErr.message);
    else console.log(`  ${brandSlugById.get(brandId)}: color_count = ${count}`);
  }

  console.log(
    "\nDone. Now recompute matches:\n" +
      "  npm run export-db-colors && npm run compute-matches && npm run seed-matches",
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
