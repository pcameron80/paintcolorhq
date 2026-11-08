/**
 * Apply the swatch corrections found by the palette drift scan: rows whose
 * stored hex differs from the manufacturer's published swatch by CIEDE2000
 * >= 2 (data/brand-scans/<date>/<brand>-hex-changed.json).
 *
 * The 2026-10 scan showed these are stale values from the original colornerd
 * import, not reformulations: Behr, Valspar, Vista and Kilz published the
 * same swatches in June. Every match touching those rows was computed from
 * the wrong color.
 *
 * Per row it rewrites everything derived from hex: rgb, Lab, LRV (the
 * manufacturer's published LRV when the feed carries one, otherwise
 * computed), color_family (classify + perceptual refine) and undertone.
 * Name, slug, code and URLs are untouched. A row whose hex no longer equals
 * the scan's dbHex (edited since the scan) is skipped, not overwritten.
 *
 * Usage:
 *   tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/2026-10-11            # dry run
 *   tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/2026-10-11 --apply    # writes, backup first
 *   tsx scripts/apply-hex-corrections.ts --revert=scripts/data/backups/hex-corrections-<ts>.json
 *
 * Afterwards, matches are stale until recomputed:
 *   npm run export-db-colors && npm run compute-matches && npm run seed-matches
 * and content that quotes the old swatches needs checking:
 *   npm run audit-colors -- --changed=scripts/data/backups/hex-corrections-<ts>.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { familyFromHex, calculateLrv, rgbToLab, hexToRgb } from './lib/color-math';
import { undertoneLabel } from './lib/undertone';
import { pool } from './lib/palette-sources';
import type { HexChange } from './lib/palette-diff';

dotenv.config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const APPLY = process.argv.includes('--apply');
const scanDir = arg('scan-dir');
const brandArg = arg('brand');
const revertFile = arg('revert');

const FIELDS = 'id, slug, hex, rgb_r, rgb_g, rgb_b, lab_l, lab_a, lab_b_val, lrv, color_family, undertone' as const;
interface Row {
  id: string;
  slug: string;
  hex: string;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  lrv: number | null;
  color_family: string | null;
  undertone: string | null;
}
type Patch = Omit<Row, 'id' | 'slug'>;

// `key` is "<brand-slug>/<color-slug>": family takes FAMILY_OVERRIDES and the
// brand's rules (Sherwin-Williams teals stay blue), undertone its sourced override.
function corrected(hex: string, liveLrv: number | undefined, key: string): Patch {
  const rgb = hexToRgb(hex)!;
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
  return {
    hex,
    rgb_r: rgb.r,
    rgb_g: rgb.g,
    rgb_b: rgb.b,
    lab_l: lab.l,
    lab_a: lab.a,
    lab_b_val: lab.b_val,
    lrv: liveLrv ?? Math.round(calculateLrv(rgb.r, rgb.g, rgb.b) * 10) / 10,
    color_family: familyFromHex(key, rgb.r, rgb.g, rgb.b),
    undertone: undertoneLabel(hex, lab.a, lab.b_val, key),
  };
}

async function loadRows(supabase: SupabaseClient, brandId: string, slugs: string[]): Promise<Map<string, Row>> {
  const out = new Map<string, Row>();
  for (let i = 0; i < slugs.length; i += 200) {
    const { data, error } = await supabase
      .from('colors')
      .select(FIELDS)
      .eq('brand_id', brandId)
      .in('slug', slugs.slice(i, i + 200));
    if (error) throw new Error(`DB read failed: ${error.message}`);
    for (const r of data as Row[]) out.set(r.slug, r);
  }
  return out;
}

async function writeAll(supabase: SupabaseClient, updates: { id: string; patch: Patch }[]): Promise<number> {
  let done = 0;
  let failed = 0;
  await pool(updates, 8, async (u) => {
    const { error, count } = await supabase.from('colors').update(u.patch, { count: 'exact' }).eq('id', u.id);
    if (error || count !== 1) {
      failed++;
      console.error(`  update failed for ${u.id}: ${error?.message ?? `${count} rows`}`);
      return;
    }
    if (++done % 500 === 0) console.log(`  ${done}/${updates.length}`);
  });
  if (failed) throw new Error(`${failed} updates failed; ${done} applied. Re-run is safe (applied rows are skipped).`);
  return done;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  if (revertFile) {
    const backup = JSON.parse(fs.readFileSync(revertFile, 'utf8')) as Row[];
    const n = await writeAll(
      supabase,
      backup.map(({ id, slug: _slug, ...patch }) => ({ id, patch })),
    );
    console.log(`Reverted ${n} of ${backup.length} rows. Recompute matches afterwards.`);
    return;
  }
  if (!scanDir) {
    console.error('Usage: tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/<date> [--brand=a,b] [--apply]');
    process.exit(1);
  }
  const dir = path.resolve(process.cwd(), scanDir);
  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error || !brands) throw new Error(`Failed to fetch brands: ${error?.message}`);
  const wanted = brandArg ? new Set(brandArg.split(',')) : null;

  const updates: { id: string; patch: Patch }[] = [];
  const backup: Row[] = [];
  for (const b of brands) {
    const file = path.join(dir, `${b.slug}-hex-changed.json`);
    if ((wanted && !wanted.has(b.slug)) || !fs.existsSync(file)) continue;
    const changes = JSON.parse(fs.readFileSync(file, 'utf8')) as HexChange[];
    if (!changes.length) continue;
    if (changes.some((c) => !c.slug)) throw new Error(`${file} predates slug tracking; re-run the scan`);
    const rows = await loadRows(supabase, b.id, changes.map((c) => c.slug));
    const tally = { apply: 0, alreadyCorrect: 0, editedSinceScan: 0, noRow: 0, familyMoves: 0, manufacturerLrv: 0 };
    for (const c of changes) {
      const row = rows.get(c.slug);
      if (!row) { tally.noRow++; continue; }
      const current = row.hex.toLowerCase();
      if (current === c.liveHex) { tally.alreadyCorrect++; continue; }
      if (current !== c.dbHex) { tally.editedSinceScan++; console.warn(`  skip ${b.slug}/${c.slug}: hex is ${current}, scan saw ${c.dbHex}`); continue; }
      const patch = corrected(c.liveHex, c.liveLrv, `${b.slug}/${c.slug}`);
      if (patch.color_family !== row.color_family) tally.familyMoves++;
      if (c.liveLrv != null) tally.manufacturerLrv++;
      const { id, slug, ...old } = row;
      backup.push({ id, slug, ...old });
      updates.push({ id, patch });
      tally.apply++;
    }
    console.log(`[${b.slug}]`, tally);
  }

  console.log(`\nTotal rows to correct: ${updates.length}`);
  if (!APPLY) {
    console.log('Dry run — no DB changes. Re-run with --apply.');
    return;
  }
  const backupDir = path.resolve(__dirname, 'data/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `hex-corrections-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${path.relative(process.cwd(), backupPath)}`);
  const n = await writeAll(supabase, updates);
  console.log(`Updated ${n} rows. Next: npm run export-db-colors && npm run compute-matches && npm run seed-matches`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
