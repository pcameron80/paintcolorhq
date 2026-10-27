/**
 * Reconcile Benjamin Moore White Dove (OC-17) and Chantilly Lace (OC-65,
 * stored as 2121-70) with the manufacturer's published values.
 *
 * Source of truth: the color detail pages on benjaminmoore.com, which embed
 * the color record (hex, r/g/b, lrv) in their page data (checked 2026-10-11):
 *   https://www.benjaminmoore.com/en-us/paint-colors/color/oc-17/white-dove
 *     -> hex EFEEE5, rgb 239/238/229, LRV 83.16
 *   https://www.benjaminmoore.com/en-us/paint-colors/color/oc-65/chantilly-lace
 *   https://www.benjaminmoore.com/en-us/paint-colors/color/2121-70/chantilly-lace
 *     -> hex F4F6F1, rgb 244/246/241, LRV 90.04 (OC-65 and 2121-70 are the
 *        same color; BM lists each as the other's "equivalent")
 *
 * Our rows held #F3EFE0 (White Dove) and #f5f7f2 (Chantilly Lace). LRVs
 * already agree. Undertone is left alone: BM does not publish one.
 *
 * What --apply does:
 *   1. Backs up the two color rows and every cross_brand_matches row it will
 *      replace to scripts/backups/fix-bm-whites-<timestamp>.json.
 *   2. Updates hex, rgb_r/g/b and lab_l/lab_a/lab_b_val (recomputed with
 *      rgbToLab from src/lib/color-utils).
 *   3. Recomputes cross_brand_matches the same way compute-matches.ts does
 *      (top 5 per target brand, CIEDE2000, archived colors never targets):
 *        a. forward: the two colors as sources, every other brand as target;
 *        b. reverse: every non-BM source whose Benjamin Moore top 5 contains
 *           either color before or after the change gets its BM rows rebuilt.
 *
 * public/match-data/*.json is rebuilt by the prebuild hook
 * (scripts/build-match-data.ts) on the next deploy: the hex change alters its
 * content fingerprint, so the build cache misses. Redeploy after applying,
 * never while a match write is still running, and allow up to 24 h for
 * rendered pages to pick up the new files (fetch revalidate 86400).
 *
 * Usage:
 *   npx tsx scripts/fix-bm-whites.ts           # dry run: prints before/after
 *   npx tsx scripts/fix-bm-whites.ts --apply   # backs up, then writes
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { deltaE2000, rgbToLab } from "../src/lib/color-utils";
import type { Lab } from "../src/lib/color-utils";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const APPLY = process.argv.includes("--apply");
const TOP_N = 5;
const BM_SLUG = "benjamin-moore";

type Fix = { slug: string; label: string; r: number; g: number; b: number; lrv: number; source: string };

const FIXES: Fix[] = [
  {
    slug: "white-dove-oc-17",
    label: "White Dove OC-17",
    r: 239,
    g: 238,
    b: 229,
    lrv: 83.16,
    source: "https://www.benjaminmoore.com/en-us/paint-colors/color/oc-17/white-dove",
  },
  {
    slug: "chantilly-lace-2121-70",
    label: "Chantilly Lace OC-65 / 2121-70",
    r: 244,
    g: 246,
    b: 241,
    lrv: 90.04,
    source: "https://www.benjaminmoore.com/en-us/paint-colors/color/oc-65/chantilly-lace",
  },
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
  name: string;
  color_number: string;
  slug: string;
  hex: string;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  lrv: number | null;
  undertone: string | null;
  is_archived: boolean;
  brand_id: string;
  brand_slug: string;
};

type MatchRow = { id?: string; source_color_id: string; match_color_id: string; delta_e_score: number; rank: number };

const hex2 = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

async function loadColors(): Promise<ColorRow[]> {
  const out: ColorRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    // Stable ordering is required: un-ordered range() pages can skip or repeat rows.
    const { data, error } = await supabase
      .from("colors")
      .select("id,name,color_number,slug,hex,rgb_r,rgb_g,rgb_b,lab_l,lab_a,lab_b_val,lrv,undertone,is_archived,brand_id,brands(slug)")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const d of data as unknown as (Omit<ColorRow, "brand_slug"> & { brands: { slug: string } })[]) {
      const { brands, ...rest } = d;
      out.push({ ...rest, brand_slug: brands.slug });
    }
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function matchesForSources(sourceIds: string[]): Promise<MatchRow[]> {
  const out: MatchRow[] = [];
  for (let i = 0; i < sourceIds.length; i += 100) {
    const chunk = sourceIds.slice(i, i + 100);
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("cross_brand_matches")
        .select("id,source_color_id,match_color_id,delta_e_score,rank")
        .in("source_color_id", chunk)
        .order("id")
        .range(from, from + 999);
      if (error) throw error;
      out.push(...(data as MatchRow[]));
      if (!data || data.length < 1000) break;
    }
  }
  return out;
}

function topN(src: Lab, targets: ColorRow[], labOf: (c: ColorRow) => Lab): { c: ColorRow; d: number }[] {
  return targets
    .map((c) => ({ c, d: deltaE2000(src, labOf(c)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, TOP_N);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (will write)\n" : "MODE: DRY RUN (no writes; pass --apply to write)\n");

  const colors = await loadColors();
  console.log(`Loaded ${colors.length} colors`);

  const byBrand = new Map<string, ColorRow[]>();
  for (const c of colors) {
    if (!byBrand.has(c.brand_slug)) byBrand.set(c.brand_slug, []);
    byBrand.get(c.brand_slug)!.push(c);
  }

  // ---- 1. Color row changes --------------------------------------------
  const newLab = new Map<string, Lab>();
  const colorUpdates: { before: ColorRow; after: Partial<ColorRow> }[] = [];
  for (const fix of FIXES) {
    const row = colors.find((c) => c.brand_slug === BM_SLUG && c.slug === fix.slug);
    if (!row) throw new Error(`Row not found: ${BM_SLUG}/${fix.slug}`);
    const lab = rgbToLab(fix.r, fix.g, fix.b);
    const after = {
      hex: `#${hex2(fix.r)}${hex2(fix.g)}${hex2(fix.b)}`,
      rgb_r: fix.r,
      rgb_g: fix.g,
      rgb_b: fix.b,
      lab_l: round(lab.L, 4),
      lab_a: round(lab.a, 4),
      lab_b_val: round(lab.b, 4),
      lrv: round(fix.lrv, 1),
    };
    newLab.set(row.id, { L: after.lab_l, a: after.lab_a, b: after.lab_b_val });
    const shift = deltaE2000({ L: row.lab_l, a: row.lab_a, b: row.lab_b_val }, newLab.get(row.id)!);
    console.log(`\n${fix.label}  (source: ${fix.source})`);
    for (const k of Object.keys(after) as (keyof typeof after)[]) {
      const b = row[k];
      const a = after[k];
      const changed = String(b).toLowerCase() !== String(a).toLowerCase();
      console.log(`  ${k.padEnd(10)} ${String(b).padEnd(10)} -> ${a}${changed ? "" : "  (unchanged)"}`);
    }
    console.log(`  shift between stored and published color: CIEDE2000 ${shift.toFixed(2)}`);
    console.log(`  undertone  ${row.undertone} (left unchanged; BM publishes none)`);
    colorUpdates.push({ before: row, after });
  }

  const labOf = (c: ColorRow): Lab => newLab.get(c.id) ?? { L: c.lab_l, a: c.lab_a, b: c.lab_b_val };
  const fixedIds = new Set(newLab.keys());
  const bmTargets = (byBrand.get(BM_SLUG) ?? []).filter((c) => !c.is_archived);

  // ---- 2. Forward matches (the two colors as sources) -------------------
  const forwardNew: MatchRow[] = [];
  for (const id of fixedIds) {
    const src = colors.find((c) => c.id === id)!;
    for (const [brand, list] of byBrand) {
      if (brand === BM_SLUG) continue;
      const top = topN(labOf(src), list.filter((c) => !c.is_archived), labOf);
      top.forEach((t, i) =>
        forwardNew.push({ source_color_id: id, match_color_id: t.c.id, delta_e_score: round(t.d, 2), rank: i + 1 }),
      );
    }
  }
  const forwardOld = await matchesForSources([...fixedIds]);

  const nameOf = new Map(colors.map((c) => [c.id, `${c.brand_slug}/${c.name} ${c.color_number}`]));
  for (const id of fixedIds) {
    console.log(`\nForward matches for ${nameOf.get(id)} (rank 1 per brand, before -> after):`);
    for (const brand of [...byBrand.keys()].filter((b) => b !== BM_SLUG).sort()) {
      const inBrand = (m: MatchRow) => m.source_color_id === id && m.rank === 1 && nameOf.get(m.match_color_id)?.startsWith(`${brand}/`);
      const o = forwardOld.find(inBrand);
      const n = forwardNew.find(inBrand);
      const fmt = (m?: MatchRow) => (m ? `${nameOf.get(m.match_color_id)} (${m.delta_e_score})` : "none");
      console.log(`  ${brand.padEnd(17)} ${fmt(o)}  ->  ${fmt(n)}`);
    }
  }

  // ---- 3. Reverse matches (other brands' BM top 5) ----------------------
  // Old BM top 5 that includes either color: read from the table.
  const oldReverseHits: MatchRow[] = [];
  for (const id of fixedIds) {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from("cross_brand_matches")
        .select("id,source_color_id,match_color_id,delta_e_score,rank")
        .eq("match_color_id", id)
        .order("id")
        .range(from, from + 999);
      if (error) throw error;
      oldReverseHits.push(...(data as MatchRow[]));
      if (!data || data.length < 1000) break;
    }
  }
  const affected = new Set(oldReverseHits.map((m) => m.source_color_id));

  // New BM top 5 for every non-BM source, using the corrected Lab values.
  const newBmTop = new Map<string, { c: ColorRow; d: number }[]>();
  for (const src of colors) {
    if (src.brand_slug === BM_SLUG) continue;
    const s = labOf(src);
    // Cheap pre-check: skip the full scan when neither fixed color could make the top 5.
    const dFixed = [...fixedIds].map((id) => deltaE2000(s, newLab.get(id)!));
    if (!affected.has(src.id) && Math.min(...dFixed) > 20) continue;
    const top = topN(s, bmTargets, labOf);
    if (affected.has(src.id) || top.some((t) => fixedIds.has(t.c.id))) {
      affected.add(src.id);
      newBmTop.set(src.id, top);
    }
  }
  const bmIds = new Set((byBrand.get(BM_SLUG) ?? []).map((c) => c.id));
  const reverseOldAll = (await matchesForSources([...affected])).filter((m) => bmIds.has(m.match_color_id));
  const reverseNew: MatchRow[] = [];
  let reverseChanged = 0;
  for (const srcId of affected) {
    const top = newBmTop.get(srcId) ?? topN(labOf(colors.find((c) => c.id === srcId)!), bmTargets, labOf);
    const rows = top.map((t, i) => ({ source_color_id: srcId, match_color_id: t.c.id, delta_e_score: round(t.d, 2), rank: i + 1 }));
    const old = reverseOldAll.filter((m) => m.source_color_id === srcId).sort((a, b) => a.rank - b.rank);
    const sig = (r: MatchRow[]) => r.map((m) => `${m.match_color_id}:${m.delta_e_score}`).join(",");
    if (sig(old) !== sig(rows)) {
      reverseChanged++;
      if (reverseChanged <= 5) {
        const fmt = (r: MatchRow[]) => r.map((m) => `${nameOf.get(m.match_color_id)} (${m.delta_e_score})`).join(", ");
        console.log(`\n  ${nameOf.get(srcId)}\n    before: ${fmt(old)}\n    after:  ${fmt(rows)}`);
      }
    }
    reverseNew.push(...rows);
  }
  console.log(
    `\nReverse: ${affected.size} non-BM colors have White Dove or Chantilly Lace in their Benjamin Moore top 5 before or after; ${reverseChanged} of them change.`,
  );

  if (!APPLY) {
    console.log("\nDry run complete. Nothing written. Re-run with --apply to back up and write.");
    return;
  }

  // ---- 4. Backup, then write --------------------------------------------
  const backupDir = path.resolve(__dirname, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `fix-bm-whites-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify({ colors: colorUpdates.map((u) => u.before), forwardMatches: forwardOld, reverseBmMatches: reverseOldAll }, null, 2),
  );
  console.log(`\nBackup written: ${backupPath}`);

  for (const u of colorUpdates) {
    const { error } = await supabase.from("colors").update(u.after).eq("id", u.before.id);
    if (error) throw error;
    console.log(`Updated color ${u.before.name} ${u.before.color_number}`);
  }

  const replace = async (oldRows: MatchRow[], newRows: MatchRow[], label: string) => {
    const ids = oldRows.map((m) => m.id!).filter(Boolean);
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase.from("cross_brand_matches").delete().in("id", ids.slice(i, i + 200));
      if (error) throw error;
    }
    for (let i = 0; i < newRows.length; i += 500) {
      const { error } = await supabase.from("cross_brand_matches").insert(newRows.slice(i, i + 500));
      if (error) throw error;
    }
    console.log(`${label}: deleted ${ids.length}, inserted ${newRows.length}`);
  };
  await replace(forwardOld, forwardNew, "Forward matches");
  await replace(reverseOldAll, reverseNew, "Reverse BM matches");

  console.log(
    "\nDone. Redeploy now: the prebuild hook rebuilds /match-data (the content fingerprint changed). " +
      "Pages pick up the new files within 24 h.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
