/**
 * Retire color rows that do not exist in the manufacturer's catalog.
 *
 * Found 2026-10-11 while reconciling against the palette scan: three rows,
 * all hand-inserted on 2026-02-17 to support blog posts, describe colors the
 * brands do not sell under that code.
 *   - benjamin-moore/silver-peony-1475: BM 1475 is Graystone (we hold it as
 *     graystone-1475). No BM color is named Silver Peony.
 *   - behr/sage-green-ppu11-07: Behr PPU11-07 is Clary Sage (we hold it as
 *     clary-sage-ppu11-07). Behr's Sage Green is ICC-77, a different swatch.
 *   - sherwin-williams/wholesome-sw-6980: SW 6980 is Gutsy Grape. No SW color
 *     is named Wholesome.
 *
 * Each old URL 301s (src/data/color-redirects.json) to the real color closest
 * to the swatch the page showed, which is what a visitor was looking at.
 *
 * What --apply does, per row:
 *   1. Backs up the row, its own matches and every match row that lists it.
 *   2. Rebuilds the top 5 (in the retired row's brand) for every source that
 *      listed it, so no list is left one short. Same method as
 *      compute-matches.ts: CIEDE2000, archived colors never targets.
 *   3. Re-points project_colors to the redirect target.
 *   4. Deletes the row's own matches and the row, then refreshes
 *      brands.color_count.
 *
 * Usage (from the main checkout):
 *   npx tsx scripts/retire-bad-color-rows.ts           # dry run
 *   npx tsx scripts/retire-bad-color-rows.ts --apply   # backup, then write
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { deltaE2000 } from "../src/lib/color-utils";
import type { Lab } from "../src/lib/color-utils";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

const APPLY = process.argv.includes("--apply");
const TOP_N = 5;

const RETIRE = [
  { brand: "benjamin-moore", slug: "silver-peony-1475", redirectTo: "iced-mauve-2115-50" },
  { brand: "behr", slug: "sage-green-ppu11-07", redirectTo: "whitewater-bay-ppu11-10" },
  { brand: "sherwin-williams", slug: "wholesome-sw-6980", redirectTo: "spiced-cider-7702" },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, {
  global: { fetch: (u, init) => fetch(u, { ...init, cache: "no-store" }) },
});

type ColorRow = {
  id: string;
  slug: string;
  name: string;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  is_archived: boolean | null;
  brand_id: string;
};
type MatchRow = { id?: string; source_color_id: string; match_color_id: string; delta_e_score: number; rank: number };

const labOf = (c: ColorRow): Lab => ({ L: Number(c.lab_l), a: Number(c.lab_a), b: Number(c.lab_b_val) });
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

async function all<T>(query: (from: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY\n" : "MODE: DRY RUN (pass --apply to write)\n");
  const { data: brands, error } = await supabase.from("brands").select("id, slug");
  if (error) throw new Error(error.message);
  const brandId = new Map((brands as { id: string; slug: string }[]).map((b) => [b.slug, b.id]));

  const colors = await all<ColorRow>((from) =>
    supabase.from("colors").select("id, slug, name, lab_l, lab_a, lab_b_val, is_archived, brand_id").order("id").range(from, from + 999),
  );
  const bySlug = new Map(colors.map((c) => [`${c.brand_id}/${c.slug}`, c]));
  const retiring = RETIRE.map((r) => {
    const bid = brandId.get(r.brand)!;
    const row = bySlug.get(`${bid}/${r.slug}`);
    const target = bySlug.get(`${bid}/${r.redirectTo}`);
    if (!target) throw new Error(`Redirect target missing: ${r.brand}/${r.redirectTo}`);
    return { ...r, bid, row, target };
  });
  const retiredIds = new Set(retiring.flatMap((r) => (r.row ? [r.row.id] : [])));

  const backup: Record<string, unknown> = {};
  const deletes: string[] = [];
  const inserts: MatchRow[] = [];
  const nameOf = new Map(colors.map((c) => [c.id, c.name]));

  for (const r of retiring) {
    if (!r.row) {
      console.log(`${r.brand}/${r.slug}: already gone, skipping`);
      continue;
    }
    const own = await all<MatchRow>((from) =>
      supabase.from("cross_brand_matches").select("id, source_color_id, match_color_id, delta_e_score, rank").eq("source_color_id", r.row!.id).order("id").range(from, from + 999),
    );
    const listing = await all<MatchRow>((from) =>
      supabase.from("cross_brand_matches").select("id, source_color_id, match_color_id, delta_e_score, rank").eq("match_color_id", r.row!.id).order("id").range(from, from + 999),
    );
    // Every source that listed the retired row gets its top 5 in that brand rebuilt.
    const targets = colors.filter((c) => c.brand_id === r.bid && !c.is_archived && !retiredIds.has(c.id));
    const targetIds = new Set(colors.filter((c) => c.brand_id === r.bid).map((c) => c.id));
    const sources = [...new Set(listing.map((m) => m.source_color_id))];
    const oldLists: MatchRow[] = [];
    for (let i = 0; i < sources.length; i += 100) {
      const chunk = sources.slice(i, i + 100);
      const rows = await all<MatchRow>((from) =>
        supabase.from("cross_brand_matches").select("id, source_color_id, match_color_id, delta_e_score, rank").in("source_color_id", chunk).order("id").range(from, from + 999),
      );
      oldLists.push(...rows.filter((m) => targetIds.has(m.match_color_id)));
    }
    const byId = new Map(colors.map((c) => [c.id, c]));
    for (const srcId of sources) {
      const src = byId.get(srcId)!;
      const top = targets
        .map((c) => ({ c, d: deltaE2000(labOf(src), labOf(c)) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, TOP_N);
      inserts.push(...top.map((t, i) => ({ source_color_id: srcId, match_color_id: t.c.id, delta_e_score: round(t.d, 2), rank: i + 1 })));
    }
    deletes.push(...own.map((m) => m.id!), ...oldLists.map((m) => m.id!));
    backup[`${r.brand}/${r.slug}`] = { row: r.row, ownMatches: own, rebuiltLists: oldLists };

    console.log(`${r.brand}/${r.slug} ("${r.row.name}") -> 301 to ${r.redirectTo} ("${r.target.name}")`);
    console.log(`  own matches to delete: ${own.length}`);
    console.log(`  sources that list it: ${sources.length}; their ${r.brand} top ${TOP_N} rebuilt (${oldLists.length} rows)`);
    const sample = sources[0];
    if (sample) {
      const fmt = (rows: MatchRow[]) =>
        rows.filter((m) => m.source_color_id === sample).sort((a, b) => a.rank - b.rank).map((m) => `${nameOf.get(m.match_color_id)} ${m.delta_e_score}`).join(", ");
      console.log(`  e.g. ${nameOf.get(sample)}:\n    before: ${fmt(oldLists)}\n    after:  ${fmt(inserts)}`);
    }
  }

  if (!APPLY) {
    console.log(`\nWould delete ${deletes.length} match rows, insert ${inserts.length}, delete ${retiredIds.size} colors.`);
    console.log("Dry run — nothing written.");
    return;
  }

  const backupDir = path.resolve(process.cwd(), "scripts/data/backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `retire-bad-color-rows-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);

  // Insert the rebuilt lists first, then delete the old rows, so no source is ever left without matches.
  for (let i = 0; i < inserts.length; i += 500) {
    const { error: e } = await supabase.from("cross_brand_matches").insert(inserts.slice(i, i + 500));
    if (e) throw new Error(`insert failed: ${e.message}`);
  }
  for (let i = 0; i < deletes.length; i += 200) {
    const { error: e } = await supabase.from("cross_brand_matches").delete().in("id", deletes.slice(i, i + 200));
    if (e) throw new Error(`match delete failed: ${e.message}`);
  }
  for (const r of retiring) {
    if (!r.row) continue;
    const { error: e1 } = await supabase.from("project_colors").update({ color_id: r.target.id }).eq("color_id", r.row.id);
    if (e1) throw new Error(`project_colors re-point failed: ${e1.message}`);
    const { error: e2 } = await supabase.from("colors").delete().eq("id", r.row.id);
    if (e2) throw new Error(`color delete failed for ${r.slug}: ${e2.message}`);
    const { count } = await supabase.from("colors").select("id", { count: "exact", head: true }).eq("brand_id", r.bid);
    await supabase.from("brands").update({ color_count: count }).eq("id", r.bid);
    console.log(`Retired ${r.brand}/${r.slug}`);
  }
  console.log(`Matches: inserted ${inserts.length}, deleted ${deletes.length}. Redeploy so the prebuild regenerates match data.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
