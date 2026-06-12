/**
 * Reconcile Hirshfields and Vista Paint DB rows against their live palettes
 * (data/brand-scans/<brand>-live.json from the 2026-06 drift scan).
 *
 * Both brands renamed colors upstream (same supplier wave); Vista also
 * renumbered its entire book (legacy C-470 -> live 0471, K-book scattered
 * into the 7000/8000 series), and our Hirshfields historic rows carry
 * name-based pseudo-codes instead of the real H0001-H0149 numbers.
 *
 * What this does per matched row: color_number -> live code (legacy code
 * preserved in alternate_numbers when it was a real code), name -> live
 * name (fixes renames, typos, mojibake). Slugs are NOT touched — URLs are
 * stable, page copy just shows the current code/name.
 * Unmatched live colors are imported as new rows; unmatched DB rows are
 * reported (likely discontinued) but left alone.
 *
 * Usage:
 *   tsx scripts/reconcile-regional.ts --brand=hirshfields [--apply]
 *   tsx scripts/reconcile-regional.ts --brand=vista-paint [--apply]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { classifyColorFamily, calculateLrv, rgbToLab, hexToRgb } from './lib/color-math';
import { makeSlug } from './lib/behr-import-rules';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SCAN_DIR = path.resolve(__dirname, '../data/brand-scans');
const APPLY = process.argv.includes('--apply');
const brandArg = process.argv.find((a) => a.startsWith('--brand='))?.split('=')[1];

interface LiveColor { code: string; name: string; hex: string }
interface DbRow {
  id: string;
  name: string;
  slug: string;
  color_number: string | null;
  hex: string;
  alternate_numbers: string[] | null;
}

const normName = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');

/** true when the DB code is a real manufacturer code worth preserving */
const isRealCode = (code: string | null, brand: string) => {
  if (!code) return false;
  if (brand === 'hirshfields' && code.startsWith('historic-')) return false;
  return true;
};

async function fetchRows(supabase: SupabaseClient, brandId: string): Promise<DbRow[]> {
  const rows: DbRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('colors')
      .select('id, name, slug, color_number, hex, alternate_numbers')
      .eq('brand_id', brandId)
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (error) { console.error('fetch failed:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    rows.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }
  return rows;
}

function hexDist(a: string, b: string): number {
  const ra = hexToRgb(a); const rb = hexToRgb(b);
  if (!ra || !rb) return 999;
  return Math.max(Math.abs(ra.r - rb.r), Math.abs(ra.g - rb.g), Math.abs(ra.b - rb.b));
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) { console.error('Missing Supabase env'); process.exit(1); }
  const supabase = createClient(supabaseUrl, serviceKey);

  if (brandArg !== 'hirshfields' && brandArg !== 'vista-paint') {
    console.error('Usage: --brand=hirshfields|vista-paint [--apply]');
    process.exit(1);
  }
  const brandSlug = brandArg;
  const live: LiveColor[] = JSON.parse(
    fs.readFileSync(path.join(SCAN_DIR, `${brandSlug}-live.json`), 'utf8'),
  );
  // dedupe live by code (Vista has 2 duplicate pages)
  const liveByCode = new Map<string, LiveColor>();
  for (const c of live) {
    const code = c.code.trim();
    if (!liveByCode.has(code.toUpperCase())) liveByCode.set(code.toUpperCase(), { ...c, code });
  }

  const { data: brand } = await supabase.from('brands').select('id').eq('slug', brandSlug).single();
  if (!brand) { console.error('brand not found'); process.exit(1); }
  const rows = await fetchRows(supabase, brand.id);
  console.log(`[${brandSlug}] live unique: ${liveByCode.size}, db rows: ${rows.length}`);

  const matchedLive = new Set<string>(); // live code (upper)
  const matchedDb = new Set<string>(); // row id
  const pairs: { row: DbRow; live: LiveColor; via: string }[] = [];

  const tryPair = (row: DbRow, lv: LiveColor, via: string, maxHexDist: number) => {
    const key = lv.code.toUpperCase();
    if (matchedDb.has(row.id) || matchedLive.has(key)) return false;
    if (hexDist(row.hex, lv.hex) > maxHexDist) return false;
    matchedDb.add(row.id);
    matchedLive.add(key);
    pairs.push({ row, live: lv, via });
    return true;
  };

  if (brandSlug === 'hirshfields') {
    // Numeric rows: Sku-keyed, live zero-pads ('0138' = DB '138')
    const liveByNum = new Map<string, LiveColor>();
    for (const lv of liveByCode.values()) {
      if (/^\d+$/.test(lv.code)) liveByNum.set(String(parseInt(lv.code, 10)), lv);
    }
    for (const row of rows) {
      const num = row.color_number ?? '';
      if (/^\d+$/.test(num)) {
        const lv = liveByNum.get(String(parseInt(num, 10)));
        // generous hex tolerance: codes are authoritative for this brand
        if (lv) tryPair(row, lv, 'sku', 999);
      }
    }
  } else {
    // Vista: legacy C-book formula — live code = C-number + 1, zero-padded 4
    for (const row of rows) {
      const m = /^C-(\d+)$/.exec(row.color_number ?? '');
      if (!m) continue;
      const lv = liveByCode.get(String(parseInt(m[1], 10) + 1).padStart(4, '0'));
      if (lv) tryPair(row, lv, 'c-formula', 6);
    }
  }

  // Name match for the rest
  const liveByName = new Map<string, LiveColor[]>();
  for (const lv of liveByCode.values()) {
    if (matchedLive.has(lv.code.toUpperCase())) continue;
    const k = normName(lv.name);
    liveByName.set(k, [...(liveByName.get(k) ?? []), lv]);
  }
  for (const row of rows) {
    if (matchedDb.has(row.id)) continue;
    const cands = liveByName.get(normName(row.name)) ?? [];
    const open = cands.filter((c) => !matchedLive.has(c.code.toUpperCase()));
    if (open.length === 1) tryPair(row, open[0], 'name', 24);
  }

  // Hex-exact match for renamed/typo'd rows
  const liveByHex = new Map<string, LiveColor[]>();
  for (const lv of liveByCode.values()) {
    if (matchedLive.has(lv.code.toUpperCase())) continue;
    const k = lv.hex.toLowerCase();
    liveByHex.set(k, [...(liveByHex.get(k) ?? []), lv]);
  }
  for (const row of rows) {
    if (matchedDb.has(row.id)) continue;
    const open = (liveByHex.get(row.hex.toLowerCase()) ?? []).filter(
      (c) => !matchedLive.has(c.code.toUpperCase()),
    );
    if (open.length === 1) tryPair(row, open[0], 'hex', 0);
  }

  // Nearest-hex fuzzy pass: catches typo'd/mojibake/renamed rows whose hex
  // shifted slightly between the colornerd-era data and the live site.
  // Greedy by ascending distance, threshold 10/channel.
  {
    const openRows = rows.filter((r) => !matchedDb.has(r.id));
    const openLive = [...liveByCode.values()].filter((lv) => !matchedLive.has(lv.code.toUpperCase()));
    const cand: { d: number; row: DbRow; lv: LiveColor }[] = [];
    for (const row of openRows) {
      for (const lv of openLive) {
        const d = hexDist(row.hex, lv.hex);
        if (d <= 10) cand.push({ d, row, lv });
      }
    }
    cand.sort((a, b) => a.d - b.d);
    for (const { row, lv } of cand) tryPair(row, lv, 'near-hex', 10);
  }

  // Build updates (only where something actually changes)
  const updates: { id: string; slug: string; via: string; set: Record<string, unknown>; from: string; to: string }[] = [];
  for (const { row, live: lv, via } of pairs) {
    const set: Record<string, unknown> = {};
    if ((row.color_number ?? '') !== lv.code) {
      set.color_number = lv.code;
      if (isRealCode(row.color_number, brandSlug)) {
        const alts = new Set((row.alternate_numbers ?? []).map((a) => a.toUpperCase()));
        if (!alts.has((row.color_number as string).toUpperCase())) {
          set.alternate_numbers = [...(row.alternate_numbers ?? []), row.color_number];
        }
      }
    }
    if (row.name !== lv.name) set.name = lv.name;
    if (Object.keys(set).length > 0) {
      updates.push({ id: row.id, slug: row.slug, via, set, from: `${row.color_number} ${row.name}`, to: `${lv.code} ${lv.name}` });
    }
  }

  const unmatchedDb = rows.filter((r) => !matchedDb.has(r.id));
  const unmatchedLive = [...liveByCode.values()].filter((lv) => !matchedLive.has(lv.code.toUpperCase()));
  // Vista's vp-* codes are junk/duplicate site pages, not real book colors
  const toImport = unmatchedLive.filter((lv) => !/^vp-/i.test(lv.code) && hexToRgb(lv.hex));

  console.log(`matched: ${pairs.length} (${['sku', 'c-formula', 'name', 'hex', 'near-hex'].map((v) => `${v}:${pairs.filter((p) => p.via === v).length}`).join(' ')})`);
  console.log(`updates needed: ${updates.length}`);
  console.log(`unmatched DB rows (left alone, likely discontinued): ${unmatchedDb.length}`);
  console.log(`unmatched live -> to import: ${toImport.length} (excluded vp-*/bad-hex: ${unmatchedLive.length - toImport.length})`);

  const report = {
    updates: updates.map((u) => ({ slug: u.slug, via: u.via, from: u.from, to: u.to })),
    unmatched_db: unmatchedDb.map((r) => ({ code: r.color_number, name: r.name, slug: r.slug })),
    to_import: toImport,
  };
  const reportFile = path.join(SCAN_DIR, `${brandSlug}-reconcile-plan.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 1));
  console.log(`plan: ${reportFile}`);

  if (!APPLY) { console.log('\nDry run — no DB changes. Re-run with --apply.'); return; }

  let done = 0;
  for (const u of updates) {
    const { error } = await supabase.from('colors').update(u.set).eq('id', u.id);
    if (error) { console.error(`update failed for ${u.slug}:`, error.message); process.exit(1); }
    done++;
    if (done % 200 === 0 || done === updates.length) console.log(`  ${done}/${updates.length} updated`);
  }

  // Import unmatched live colors
  const existingSlugs = new Set(rows.map((r) => r.slug));
  const inserts = [];
  for (const lv of toImport) {
    const rgb = hexToRgb(lv.hex)!;
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    const slug = makeSlug(lv.name, lv.code);
    if (existingSlugs.has(slug)) { console.warn(`  slug collision, skipped: ${slug}`); continue; }
    existingSlugs.add(slug);
    inserts.push({
      brand_id: brand.id,
      name: lv.name,
      slug,
      color_number: lv.code,
      hex: lv.hex.toLowerCase(),
      rgb_r: rgb.r, rgb_g: rgb.g, rgb_b: rgb.b,
      lab_l: lab.l, lab_a: lab.a, lab_b_val: lab.b_val,
      lrv: Math.round(calculateLrv(rgb.r, rgb.g, rgb.b) * 10) / 10,
      color_family: classifyColorFamily(rgb.r, rgb.g, rgb.b),
      is_archived: false,
    });
  }
  for (let i = 0; i < inserts.length; i += 500) {
    const batch = inserts.slice(i, i + 500);
    const { error } = await supabase.from('colors').insert(batch);
    if (error) { console.error(`insert failed at ${i}:`, error.message); process.exit(1); }
  }
  console.log(`  inserted ${inserts.length} new colors`);

  const { count } = await supabase.from('colors').select('*', { count: 'exact', head: true }).eq('brand_id', brand.id);
  if (count !== null) {
    await supabase.from('brands').update({ color_count: count }).eq('id', brand.id);
    console.log(`  brands.color_count updated: ${count}`);
  }
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
