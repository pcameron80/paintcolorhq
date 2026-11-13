/**
 * Retire color rows: delete each one, 301 its URL to a target row, and keep
 * every match list and user project whole. Backs everything up first and can
 * put it all back with --revert.
 *
 * Two uses:
 *   - Duplicates. scripts/dedupe-colors.ts writes a plan whose `pairs` list
 *     each loser and its canonical; pass it with --pairs. The loser's code is
 *     folded into the canonical's alternate_numbers (foldCode: true).
 *   - Rows that do not exist in the manufacturer's catalog (the default
 *     list below, found 2026-10-11 and applied then): each was hand-inserted
 *     on 2026-02-17 for a blog post under a code that belongs to another
 *     color, so its code is NOT folded anywhere (foldCode: false).
 *
 * The redirects themselves live in src/data/color-redirects.json and must be
 * committed and deployed before --apply (dedupe-colors.ts --write-redirects
 * merges them). --apply refuses to run while any pair's redirect is missing
 * from that file.
 *
 * What --apply does:
 *   1. Writes a backup to scripts/data/backups/retire-<timestamp>.json: every
 *      retired row (all columns), its own matches, every match list rebuilt,
 *      every project_colors row that pointed at it, and each target's
 *      alternate_numbers before the fold.
 *   2. Deletes the retired rows' own matches and, for every source that
 *      listed a retired row, that source's whole list in the retired row's
 *      brand; inserts the rebuilt top 5 (CIEDE2000, archived colors never
 *      targets, retired rows excluded). If an insert fails, the deleted rows
 *      are restored before stopping.
 *   3. Folds codes into the targets' alternate_numbers (foldCode pairs only).
 *      Never copies availability, LRV or hex.
 *   4. Re-points project_colors to the target (or drops the ref when that
 *      project already holds the target; the ref is in the backup).
 *   5. Deletes the retired rows and refreshes brands.color_count.
 *
 * A pair is refused when the target is not in the brand's live feed but the
 * row being retired is (last_seen_live_on), or when the target is itself
 * being retired.
 *
 * Usage (from the main checkout):
 *   npx tsx scripts/retire-bad-color-rows.ts --pairs=<file>            # dry run
 *   npx tsx scripts/retire-bad-color-rows.ts --pairs=<file> --apply    # backup, then write
 *   npx tsx scripts/retire-bad-color-rows.ts --revert=<backup>         # dry run of the revert
 *   npx tsx scripts/retire-bad-color-rows.ts --revert=<backup> --apply # put everything back
 * <file> is a dedupe plan (its `pairs`) or a JSON array of
 * { brand, slug, redirectTo, redirectToBrand?, foldCode? }. redirectToBrand
 * retires a row into another brand's row (the 2026-11 audit's Dutch Boy DCP
 * rows are Hirshfield's colors); such a pair never folds its code.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { deltaE2000 } from '../src/lib/color-utils';
import type { Lab } from '../src/lib/color-utils';
import { stripHisp } from './lib/dedupe-rules';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const PAIRS_FILE = args.find((a) => a.startsWith('--pairs='))?.slice('--pairs='.length);
const REVERT_FILE = args.find((a) => a.startsWith('--revert='))?.slice('--revert='.length);
const TOP_N = 5;
const REDIRECTS_FILE = path.resolve(process.cwd(), 'src/data/color-redirects.json');

export interface RetirePair {
  brand: string;
  slug: string;
  redirectTo: string;
  /** the target's brand, when it is not `brand` */
  redirectToBrand?: string;
  /** fold the retired row's code into the target's alternate_numbers */
  foldCode?: boolean;
}

/** "brand/slug" of the row a pair redirects to, as src/data/color-redirects.json writes it. */
function targetKey(p: RetirePair): string {
  return `${p.redirectToBrand ?? p.brand}/${p.redirectTo}`;
}

/** Applied 2026-10-11; kept as the default so a bare run is a no-op report. */
const DEFAULT_PAIRS: RetirePair[] = [
  { brand: 'benjamin-moore', slug: 'silver-peony-1475', redirectTo: 'iced-mauve-2115-50', foldCode: false },
  { brand: 'behr', slug: 'sage-green-ppu11-07', redirectTo: 'whitewater-bay-ppu11-10', foldCode: false },
  { brand: 'sherwin-williams', slug: 'wholesome-sw-6980', redirectTo: 'spiced-cider-7702', foldCode: false },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const supabase = createClient(url, key, {
  global: { fetch: (u, init) => fetch(u, { ...init, cache: 'no-store' }) },
});

type ColorRow = {
  id: string;
  slug: string;
  name: string;
  color_number: string | null;
  alternate_numbers: string[] | null;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  is_archived: boolean | null;
  last_seen_live_on: string | null;
  brand_id: string;
};
type MatchRow = { id?: string; source_color_id: string; match_color_id: string; delta_e_score: number; rank: number };
type ProjectColorRow = { id: string; project_id: string; color_id: string; [k: string]: unknown };

interface Backup {
  created_at: string;
  pairs: RetirePair[];
  /** full rows, all columns */
  colors: Record<string, unknown>[];
  /** match rows deleted (the retired rows' own lists and every rebuilt list) */
  deletedMatches: MatchRow[];
  /** ids of the rebuilt rows inserted; filled in after the insert */
  insertedMatchIds: string[];
  projectColors: ProjectColorRow[];
  /** target id -> alternate_numbers before the fold */
  targetAlternates: Record<string, string[] | null>;
}

/** Columns Postgres computes; never sent back on insert. */
const GENERATED_COLUMNS = ['is_archived'];

const labOf = (c: ColorRow): Lab => ({ L: Number(c.lab_l), a: Number(c.lab_a), b: Number(c.lab_b_val) });
const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const chunks = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

async function all<T>(query: (from: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

async function selectIn<T>(table: string, cols: string, col: string, ids: string[], size = 100): Promise<T[]> {
  const out: T[] = [];
  for (const part of chunks(ids, size)) {
    out.push(...(await all<T>((from) => supabase.from(table).select(cols).in(col, part).order('id').range(from, from + 999) as never)));
  }
  return out;
}

function loadPairs(): RetirePair[] {
  if (!PAIRS_FILE) return DEFAULT_PAIRS;
  const raw = JSON.parse(fs.readFileSync(PAIRS_FILE, 'utf8')) as RetirePair[] | { pairs: RetirePair[] };
  const pairs = Array.isArray(raw) ? raw : raw.pairs;
  if (!Array.isArray(pairs)) throw new Error(`${PAIRS_FILE}: expected an array or an object with "pairs"`);
  return pairs.map((p) => ({ foldCode: true, ...p }));
}

async function refreshCounts(brandIds: string[]) {
  for (const bid of brandIds) {
    const { count, error } = await supabase.from('colors').select('id', { count: 'exact', head: true }).eq('brand_id', bid);
    if (error || count == null) throw new Error(`count failed for ${bid}: ${error?.message}`);
    const { error: e } = await supabase.from('brands').update({ color_count: count }).eq('id', bid);
    if (e) throw new Error(`color_count update failed: ${e.message}`);
  }
}

async function retire() {
  const pairs = loadPairs();
  console.log(`${APPLY ? 'MODE: APPLY' : 'MODE: DRY RUN (pass --apply to write)'}; ${pairs.length} pairs from ${PAIRS_FILE ?? 'the built-in 2026-10-11 list'}\n`);

  const { data: brands, error } = await supabase.from('brands').select('id, slug');
  if (error) throw new Error(error.message);
  const brandId = new Map((brands as { id: string; slug: string }[]).map((b) => [b.slug, b.id]));

  const colors = await all<ColorRow>((from) =>
    supabase
      .from('colors')
      .select('id, slug, name, color_number, alternate_numbers, lab_l, lab_a, lab_b_val, is_archived, last_seen_live_on, brand_id')
      .order('id')
      .range(from, from + 999),
  );
  const byKey = new Map(colors.map((c) => [`${c.brand_id}/${c.slug}`, c]));
  const byId = new Map(colors.map((c) => [c.id, c]));

  // --- Resolve and validate pairs --------------------------------------------
  const resolved: (RetirePair & { row: ColorRow; target: ColorRow })[] = [];
  const problems: string[] = [];
  let gone = 0;
  for (const p of pairs) {
    const bid = brandId.get(p.brand);
    if (!bid) { problems.push(`${p.brand}: unknown brand`); continue; }
    const tbid = brandId.get(p.redirectToBrand ?? p.brand);
    if (!tbid) { problems.push(`${p.redirectToBrand}: unknown brand`); continue; }
    if (tbid !== bid && p.foldCode) { problems.push(`${p.brand}/${p.slug}: cannot fold a code into another brand's row`); continue; }
    const row = byKey.get(`${bid}/${p.slug}`);
    const target = byKey.get(`${tbid}/${p.redirectTo}`);
    if (!target) { problems.push(`${p.brand}/${p.slug}: redirect target ${targetKey(p)} missing`); continue; }
    if (!row) { gone++; continue; }
    if (row.id === target.id) { problems.push(`${p.brand}/${p.slug}: redirects to itself`); continue; }
    if (row.last_seen_live_on && !target.last_seen_live_on) {
      problems.push(`${p.brand}/${p.slug}: is in the live feed but its target ${p.redirectTo} is not (refused)`);
      continue;
    }
    resolved.push({ ...p, row, target });
  }
  const retiredIds = new Set(resolved.map((r) => r.row.id));
  for (const r of resolved) {
    if (retiredIds.has(r.target.id)) problems.push(`${r.brand}/${r.slug}: target ${r.redirectTo} is itself being retired`);
  }
  if (gone) console.log(`${gone} pair(s) already applied (row gone), skipped`);
  if (problems.length) {
    console.error(`Refusing: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  if (!resolved.length) {
    console.log('Nothing to retire.');
    return;
  }

  const redirects = JSON.parse(fs.readFileSync(REDIRECTS_FILE, 'utf8')) as Record<string, string>;
  const missingRedirects = resolved.filter((r) => redirects[`${r.brand}/${r.slug}`] !== targetKey(r));
  console.log(`Redirects present in src/data/color-redirects.json: ${resolved.length - missingRedirects.length}/${resolved.length}`);

  // --- Matches -----------------------------------------------------------------
  const ids = [...retiredIds];
  const own = await selectIn<MatchRow>('cross_brand_matches', 'id, source_color_id, match_color_id, delta_e_score, rank', 'source_color_id', ids);
  const listing = await selectIn<MatchRow>('cross_brand_matches', 'id, source_color_id, match_color_id, delta_e_score, rank', 'match_color_id', ids);

  // Every (source, brand) list that names a retired row is rebuilt once, even
  // when it names two retired rows of the same brand.
  const lists = new Map<string, { src: string; bid: string }>();
  for (const m of listing) {
    if (retiredIds.has(m.source_color_id)) continue; // its own list is deleted anyway
    const bid = byId.get(m.match_color_id)!.brand_id;
    lists.set(`${m.source_color_id}|${bid}`, { src: m.source_color_id, bid });
  }
  const sources = [...new Set([...lists.values()].map((l) => l.src))];
  const sourceRows = await selectIn<MatchRow>('cross_brand_matches', 'id, source_color_id, match_color_id, delta_e_score, rank', 'source_color_id', sources);
  const oldLists = sourceRows.filter((m) => lists.has(`${m.source_color_id}|${byId.get(m.match_color_id)?.brand_id}`));

  const targetsByBrand = new Map<string, ColorRow[]>();
  for (const c of colors) {
    if (c.is_archived || retiredIds.has(c.id)) continue;
    targetsByBrand.set(c.brand_id, [...(targetsByBrand.get(c.brand_id) ?? []), c]);
  }
  const inserts: MatchRow[] = [];
  for (const { src, bid } of lists.values()) {
    const s = byId.get(src)!;
    const top = (targetsByBrand.get(bid) ?? [])
      .map((c) => ({ c, d: deltaE2000(labOf(s), labOf(c)) }))
      // Same tie-break as compute-matches.ts: live rows first, then slug.
      .sort((a, b) => a.d - b.d || Number(!!b.c.last_seen_live_on) - Number(!!a.c.last_seen_live_on) || a.c.slug.localeCompare(b.c.slug))
      .slice(0, TOP_N);
    inserts.push(...top.map((t, i) => ({ source_color_id: src, match_color_id: t.c.id, delta_e_score: round(t.d, 2), rank: i + 1 })));
  }
  const deletedMatches = [...new Map([...own, ...oldLists].map((m) => [m.id!, m])).values()];

  // --- Project refs and alternate numbers -------------------------------------
  const refs = await selectIn<ProjectColorRow>('project_colors', '*', 'color_id', ids);
  const targetIds = [...new Set(resolved.map((r) => r.target.id))];
  const targetRefs = await selectIn<ProjectColorRow>('project_colors', 'id, project_id, color_id', 'color_id', targetIds);
  const alternates = new Map<string, string[]>();
  for (const r of resolved) {
    if (!r.foldCode) continue;
    const cur = alternates.get(r.target.id) ?? [...(r.target.alternate_numbers ?? [])];
    const targetCode = (r.target.color_number ?? '').trim().toUpperCase();
    for (const code of [r.row.color_number, ...(r.row.alternate_numbers ?? [])]) {
      const c = stripHisp((code ?? '').trim());
      if (c && c.toUpperCase() !== targetCode && !cur.some((x) => x.toUpperCase() === c.toUpperCase())) cur.push(c);
    }
    alternates.set(r.target.id, cur);
  }

  // --- Report ------------------------------------------------------------------
  for (const r of resolved.slice(0, 15)) {
    console.log(`  ${r.brand}/${r.slug} ("${r.row.name}") -> ${r.redirectToBrand ? targetKey(r) : r.redirectTo} ("${r.target.name}")${r.foldCode ? ` fold ${r.row.color_number}` : ''}`);
  }
  if (resolved.length > 15) console.log(`  ... and ${resolved.length - 15} more`);
  console.log(`\nColors to delete: ${resolved.length}`);
  console.log(`Match rows: delete ${deletedMatches.length} (${own.length} own, ${oldLists.length} in ${lists.size} rebuilt lists), insert ${inserts.length}`);
  console.log(`Targets getting alternate_numbers: ${alternates.size}`);
  console.log(`project_colors refs to re-point: ${refs.length}`);
  const sample = [...lists.values()][0];
  if (sample) {
    const name = (id: string) => byId.get(id)?.name ?? id;
    const fmt = (rows: MatchRow[]) =>
      rows
        .filter((m) => m.source_color_id === sample.src && byId.get(m.match_color_id)?.brand_id === sample.bid)
        .sort((a, b) => a.rank - b.rank)
        .map((m) => name(m.match_color_id))
        .join(', ');
    console.log(`e.g. ${name(sample.src)}:\n  before: ${fmt(oldLists)}\n  after:  ${fmt(inserts)}`);
  }

  if (!APPLY) {
    if (missingRedirects.length) console.log(`\n${missingRedirects.length} redirect(s) missing; --apply will refuse until they are committed and deployed.`);
    console.log('\nDry run, nothing written.');
    return;
  }
  if (missingRedirects.length) {
    console.error(
      `Refusing: ${missingRedirects.length} redirect(s) not in src/data/color-redirects.json, e.g. ${missingRedirects[0].brand}/${missingRedirects[0].slug}.\n` +
        'Run dedupe-colors.ts --write-redirects, commit and deploy, then apply.',
    );
    process.exit(1);
  }

  // --- Apply -------------------------------------------------------------------
  const fullRows = await selectIn<Record<string, unknown>>('colors', '*', 'id', ids);
  const backup: Backup = {
    created_at: new Date().toISOString(),
    pairs: resolved.map(({ brand, slug, redirectTo, redirectToBrand, foldCode }) => ({ brand, slug, redirectTo, redirectToBrand, foldCode })),
    colors: fullRows,
    deletedMatches,
    insertedMatchIds: [],
    projectColors: refs,
    targetAlternates: Object.fromEntries([...alternates.keys()].map((id) => [id, byId.get(id)!.alternate_numbers ?? null])),
  };
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `retire-${backup.created_at.replace(/[:.]/g, '-')}.json`);
  const saveBackup = () => fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  saveBackup();
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);

  // Old rows go first: a rebuilt list shares most entries with the old one and
  // (source, match) is unique. On an insert failure, restore before stopping.
  for (const part of chunks(deletedMatches.map((m) => m.id!), 200)) {
    const { error: e } = await supabase.from('cross_brand_matches').delete().in('id', part);
    if (e) throw new Error(`match delete failed: ${e.message}. Restore with --revert=${backupPath} --apply`);
  }
  for (const part of chunks(inserts, 500)) {
    const { data, error: e } = await supabase.from('cross_brand_matches').insert(part).select('id');
    if (e) {
      console.error(`insert failed (${e.message}); restoring the ${deletedMatches.length} deleted match rows`);
      for (const ins of chunks(backup.insertedMatchIds, 200)) await supabase.from('cross_brand_matches').delete().in('id', ins);
      for (const del of chunks(deletedMatches, 500)) {
        const { error: r } = await supabase.from('cross_brand_matches').upsert(del, { onConflict: 'id' });
        if (r) throw new Error(`RESTORE FAILED: ${r.message}. Restore by hand from ${backupPath}`);
      }
      throw new Error('Restored; nothing retired.');
    }
    backup.insertedMatchIds.push(...(data as { id: string }[]).map((d) => d.id));
  }
  saveBackup();
  console.log(`Matches: deleted ${deletedMatches.length}, inserted ${inserts.length}`);

  for (const [id, alts] of alternates) {
    const { error: e } = await supabase.from('colors').update({ alternate_numbers: alts }).eq('id', id);
    if (e) throw new Error(`alternate_numbers update failed for ${id}: ${e.message}`);
  }
  console.log(`alternate_numbers updated on ${alternates.size} targets`);

  const targetOf = new Map(resolved.map((r) => [r.row.id, r.target.id]));
  const held = new Set(targetRefs.map((r) => `${r.project_id}|${r.color_id}`));
  let repointed = 0;
  let dropped = 0;
  for (const ref of refs) {
    const to = targetOf.get(ref.color_id)!;
    if (held.has(`${ref.project_id}|${to}`)) {
      const { error: e } = await supabase.from('project_colors').delete().eq('id', ref.id);
      if (e) throw new Error(`project_colors delete failed: ${e.message}`);
      dropped++;
    } else {
      const { error: e } = await supabase.from('project_colors').update({ color_id: to }).eq('id', ref.id);
      if (e) throw new Error(`project_colors re-point failed: ${e.message}`);
      held.add(`${ref.project_id}|${to}`);
      repointed++;
    }
  }
  console.log(`project_colors: ${repointed} re-pointed, ${dropped} dropped (project already held the target)`);

  for (const part of chunks(ids, 100)) {
    const { error: e } = await supabase.from('colors').delete().in('id', part);
    if (e) throw new Error(`color delete failed: ${e.message}`);
  }
  await refreshCounts([...new Set(resolved.map((r) => r.row.brand_id))]);
  console.log(`Retired ${ids.length} rows. Redeploy once this finishes: the prebuild rebuilds /match-data and fails if the match count is not colors x (brands - 1) x 5. Pages pick up the new files within 24 h.`);
}

async function revert(file: string) {
  const b = JSON.parse(fs.readFileSync(file, 'utf8')) as Backup;
  console.log(`${APPLY ? 'MODE: APPLY' : 'MODE: DRY RUN (pass --apply to write)'}; revert of ${file} (${b.created_at})`);
  console.log(`  re-insert ${b.colors.length} colors with their original ids`);
  console.log(`  delete ${b.insertedMatchIds.length} rebuilt match rows, re-insert ${b.deletedMatches.length} original ones`);
  console.log(`  restore ${b.projectColors.length} project_colors refs and ${Object.keys(b.targetAlternates).length} targets' alternate_numbers`);
  if (!APPLY) {
    console.log('\nDry run, nothing written.');
    return;
  }
  const rows = b.colors.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !GENERATED_COLUMNS.includes(k))));
  for (const part of chunks(rows, 200)) {
    const { error } = await supabase.from('colors').upsert(part, { onConflict: 'id' });
    if (error) throw new Error(`color re-insert failed: ${error.message}`);
  }
  for (const part of chunks(b.insertedMatchIds, 200)) {
    const { error } = await supabase.from('cross_brand_matches').delete().in('id', part);
    if (error) throw new Error(`rebuilt match delete failed: ${error.message}`);
  }
  for (const part of chunks(b.deletedMatches, 500)) {
    const { error } = await supabase.from('cross_brand_matches').upsert(part, { onConflict: 'id' });
    if (error) throw new Error(`match re-insert failed: ${error.message}`);
  }
  for (const part of chunks(b.projectColors, 200)) {
    const { error } = await supabase.from('project_colors').upsert(part, { onConflict: 'id' });
    if (error) throw new Error(`project_colors restore failed: ${error.message}`);
  }
  for (const [id, alts] of Object.entries(b.targetAlternates)) {
    const { error } = await supabase.from('colors').update({ alternate_numbers: alts }).eq('id', id);
    if (error) throw new Error(`alternate_numbers restore failed for ${id}: ${error.message}`);
  }
  await refreshCounts([...new Set(b.colors.map((r) => String(r.brand_id)))]);
  console.log('Reverted. Remove the matching entries from src/data/color-redirects.json if the rows should stay live, then redeploy.');
}

(REVERT_FILE ? revert(REVERT_FILE) : retire()).catch((e) => {
  console.error(e);
  process.exit(1);
});
