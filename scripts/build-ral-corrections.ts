/**
 * Build the RAL correction inputs from scripts/data/ral-classic-reference.json
 * (2026-11 data audit, finding feed-ral-hex). Reads the colors table; writes
 * files only, never the DB:
 *
 *   <out>/ral-hex-changed.json  rows whose decision is "apply" (see
 *       scripts/lib/ral-corrections.ts), in the format apply-hex-corrections.ts
 *       reads. liveLrv is RAL's published LRV (else Y from RAL's Lab).
 *   <out>/ral-live.json         every non-effect code with RAL's name, swatch
 *       hex and LRV, in the format apply-published-lrv.ts reads. That script
 *       skips the rows in ral-hex-changed.json, so it fixes LRV on the rows
 *       whose hex is held or already close.
 *   <out>/ral-review.json       held rows (effect codes, gamut holds) with
 *       their distances, for a hand check.
 *
 * Usage:
 *   npx tsx scripts/build-ral-corrections.ts --out=data/brand-scans/ral-2026-11
 *   npx tsx scripts/apply-hex-corrections.ts --scan-dir=data/brand-scans/ral-2026-11 --brand=ral          # dry run
 *   npx tsx scripts/apply-published-lrv.ts --scan-dir=data/brand-scans/ral-2026-11 --brand=ral --min-diff=1  # dry run
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { decideRal, ralLrv, type RalAction, type RalReference } from './lib/ral-corrections';
import type { HexChange } from './lib/palette-diff';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const out = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length);
const REF_FILE = path.resolve(__dirname, 'data/ral-classic-reference.json');

async function main() {
  if (!out) {
    console.error('Usage: npx tsx scripts/build-ral-corrections.ts --out=data/brand-scans/ral-2026-11');
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const refs = (JSON.parse(fs.readFileSync(REF_FILE, 'utf8')) as { colors: RalReference[] }).colors;
  const byCode = new Map(refs.map((r) => [r.code, r]));

  const { data: brand, error: brandErr } = await supabase.from('brands').select('id').eq('slug', 'ral').single();
  if (brandErr || !brand) throw new Error(`brand ral: ${brandErr?.message}`);
  const { data, error } = await supabase.from('colors').select('slug, name, color_number, hex, lrv').eq('brand_id', brand.id).order('slug');
  if (error) throw new Error(error.message);

  const changed: HexChange[] = [];
  const review: object[] = [];
  const tally: Record<RalAction | 'no-reference', number> = { apply: 0, ok: 0, 'hold-gamut': 0, effect: 0, 'no-reference': 0 };
  for (const r of data as { slug: string; name: string; color_number: string; hex: string; lrv: number | null }[]) {
    const ref = byCode.get((r.color_number ?? '').trim());
    if (!ref) { tally['no-reference']++; console.warn(`  no reference for ${r.slug} (${r.color_number})`); continue; }
    const d = decideRal(r.hex, ref);
    tally[d.action]++;
    const round = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100);
    if (d.action === 'apply') {
      changed.push({ slug: r.slug, code: ref.code, name: r.name, dbHex: r.hex.toLowerCase(), liveHex: ref.siteHex, deltaE: round(d.dSite)!, ...(d.lrv != null ? { liveLrv: d.lrv } : {}) });
    } else if (d.action !== 'ok') {
      review.push({ slug: r.slug, code: ref.code, action: d.action, storedHex: r.hex, siteHex: ref.siteHex, dSite: round(d.dSite), dStoredLab: round(d.dStoredLab), dSiteLab: round(d.dSiteLab), storedLrv: r.lrv, ralLrv: d.lrv });
    }
  }
  const live = refs.filter((r) => !r.effect).map((r) => ({ code: r.code, name: r.name, hex: r.siteHex, ...(ralLrv(r) != null ? { lrv: ralLrv(r) } : {}) }));

  const dir = path.resolve(process.cwd(), out);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ral-hex-changed.json'), JSON.stringify(changed, null, 1));
  fs.writeFileSync(path.join(dir, 'ral-live.json'), JSON.stringify(live, null, 1));
  fs.writeFileSync(path.join(dir, 'ral-review.json'), JSON.stringify(review, null, 1));
  console.log(tally);
  console.log(`Wrote ${changed.length} hex corrections, ${live.length} LRV entries and ${review.length} rows to review in ${path.relative(process.cwd(), dir)}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
