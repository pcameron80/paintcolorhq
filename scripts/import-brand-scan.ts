/**
 * Import missing colors found by the 2026-06 brand palette drift scan
 * (data/brand-scans/<brand>-missing.json, produced by read-only scan agents
 * from each manufacturer's live palette source).
 *
 * Greenlit brands and their rules live in BRAND_RULES below. Benjamin Moore
 * additionally supports --backfill-aliases, which records unrecorded
 * dual-numbers (e.g. OC-1 for the row stored as 950) into
 * colors.alternate_numbers instead of inserting duplicate rows.
 *
 * Usage:
 *   tsx scripts/import-brand-scan.ts --brand=dutch-boy            # dry run
 *   tsx scripts/import-brand-scan.ts --brand=dutch-boy --apply
 *   tsx scripts/import-brand-scan.ts --brand=benjamin-moore --backfill-aliases [--apply]
 *
 * After applying all brands, recompute matches once:
 *   npm run export-db-colors && npm run compute-matches && npm run seed-matches
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { titleCaseName, makeSlug } from './lib/behr-import-rules';
import { classifyColorFamily, calculateLrv, rgbToLab, hexToRgb } from './lib/color-math';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SCAN_DIR = path.resolve(__dirname, '../data/brand-scans');
const APPLY = process.argv.includes('--apply');
const BACKFILL = process.argv.includes('--backfill-aliases');
const brandArg = process.argv.find((a) => a.startsWith('--brand='))?.split('=')[1];
const BATCH_SIZE = 500;

interface ScanColor {
  code: string;
  name: string;
  hex: string | null;
}

interface BrandRule {
  /** file under data/brand-scans/ holding the missing list */
  file: string;
  /** pull the candidate list out of the parsed file */
  extract: (parsed: unknown) => ScanColor[];
  /** entry-level filter; default keeps everything with a valid hex */
  keep?: (c: ScanColor) => boolean;
}

const BRAND_RULES: Record<string, BrandRule> = {
  'dutch-boy': {
    file: 'dutch-boy-missing.json',
    extract: (p) => p as ScanColor[],
  },
  ppg: {
    file: 'ppg-missing.json',
    extract: (p) => p as ScanColor[],
    // MTL metallics have no published hex; ST-/SOL- are stains, not wall paint.
    keep: (c) => !/^(MTL|ST-|SOL-)/i.test(c.code),
  },
  'dunn-edwards': {
    file: 'dunn-edwards-missing.json',
    extract: (p) => p as ScanColor[],
  },
  'benjamin-moore': {
    file: 'benjamin-moore-missing-classified.json',
    extract: (p) => (p as { truly_missing: ScanColor[] }).truly_missing,
    // ES-* are exterior stains — out of scope for the wall-paint dataset.
    keep: (c) => !/^ES-/i.test(c.code),
  },
};

async function fetchBrand(supabase: SupabaseClient, slug: string) {
  const { data: brand, error } = await supabase
    .from('brands')
    .select('id, slug')
    .eq('slug', slug)
    .single();
  if (error || !brand) {
    console.error(`Failed to fetch brand ${slug}:`, error?.message);
    process.exit(1);
  }
  return brand;
}

async function fetchExisting(supabase: SupabaseClient, brandId: string) {
  const numbers = new Map<string, string>(); // normalized number -> slug (for reporting)
  const slugs = new Set<string>();
  const aliasRows = new Map<string, { id: string; alternate_numbers: string[] | null }>();
  let offset = 0;
  const PAGE = 1000;
  for (;;) {
    const { data: page, error } = await supabase
      .from('colors')
      .select('id, color_number, slug, alternate_numbers')
      .eq('brand_id', brandId)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) {
      console.error('Failed to fetch existing colors:', error.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    for (const c of page) {
      const num = c.color_number ? String(c.color_number).toUpperCase().trim() : null;
      if (num) {
        numbers.set(num, c.slug);
        aliasRows.set(num, { id: c.id, alternate_numbers: c.alternate_numbers });
      }
      for (const alt of c.alternate_numbers ?? []) {
        numbers.set(String(alt).toUpperCase().trim(), c.slug);
      }
      slugs.add(c.slug);
    }
    offset += page.length;
    if (page.length < PAGE) break;
  }
  return { numbers, slugs, aliasRows };
}

async function importBrand(supabase: SupabaseClient, slug: string) {
  const rule = BRAND_RULES[slug];
  if (!rule) {
    console.error(`No import rule for brand '${slug}'. Known: ${Object.keys(BRAND_RULES).join(', ')}`);
    process.exit(1);
  }
  const file = path.join(SCAN_DIR, rule.file);
  if (!fs.existsSync(file)) {
    console.error(`Scan file not found: ${file}`);
    process.exit(1);
  }
  const candidates = rule.extract(JSON.parse(fs.readFileSync(file, 'utf8')));
  const brand = await fetchBrand(supabase, slug);
  const { numbers, slugs } = await fetchExisting(supabase, brand.id);

  const rows = [];
  const skipped: Record<string, number> = { rule: 0, badHex: 0, existing: 0, slugCollision: 0, dupInFile: 0 };
  const seenCodes = new Set<string>();
  const collisions: string[] = [];

  for (const c of candidates) {
    const code = c.code.toUpperCase().trim();
    if (seenCodes.has(code)) { skipped.dupInFile++; continue; }
    seenCodes.add(code);
    if (rule.keep && !rule.keep(c)) { skipped.rule++; continue; }
    const rgb = c.hex ? hexToRgb(c.hex) : null;
    if (!rgb) { skipped.badHex++; continue; }
    if (numbers.has(code)) { skipped.existing++; continue; }
    const name = titleCaseName(c.name);
    const colorSlug = makeSlug(name, code);
    if (slugs.has(colorSlug)) { skipped.slugCollision++; collisions.push(colorSlug); continue; }
    slugs.add(colorSlug);
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    rows.push({
      brand_id: brand.id,
      name,
      slug: colorSlug,
      color_number: c.code.trim(), // preserve original casing/format (e.g. "50BB 13/104")
      hex: c.hex!.toLowerCase(),
      rgb_r: rgb.r,
      rgb_g: rgb.g,
      rgb_b: rgb.b,
      lab_l: lab.l,
      lab_a: lab.a,
      lab_b_val: lab.b_val,
      lrv: Math.round(calculateLrv(rgb.r, rgb.g, rgb.b) * 10) / 10,
      color_family: classifyColorFamily(rgb.r, rgb.g, rgb.b),
    });
  }

  console.log(`[${slug}] candidates: ${candidates.length}, to import: ${rows.length}, skipped:`, skipped);
  if (collisions.length) console.log(`  slug collisions (not imported):`, collisions.slice(0, 10));
  const plan = path.join(SCAN_DIR, `${slug}-import-plan.json`);
  fs.writeFileSync(plan, JSON.stringify(rows, null, 1));
  console.log(`  plan: ${plan}`);

  if (!APPLY) return;

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('colors').insert(batch);
    if (error) {
      console.error(`Insert failed at batch ${i} (${inserted} already in):`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  ${inserted}/${rows.length} inserted`);
  }

  const { count } = await supabase
    .from('colors')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id);
  if (count !== null) {
    await supabase.from('brands').update({ color_count: count }).eq('id', brand.id);
    console.log(`  brands.color_count updated: ${count}`);
  }
}

async function backfillBmAliases(supabase: SupabaseClient) {
  const file = path.join(SCAN_DIR, 'benjamin-moore-missing-classified.json');
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    dual_numbered_unrecorded: { code: string; name: string; db_number: string }[];
  };
  const entries = parsed.dual_numbered_unrecorded;
  const brand = await fetchBrand(supabase, 'benjamin-moore');
  const { aliasRows } = await fetchExisting(supabase, brand.id);

  let toUpdate = 0;
  let alreadyRecorded = 0;
  let noRow = 0;
  const updates: { id: string; alternate_numbers: string[]; code: string; db_number: string }[] = [];
  for (const e of entries) {
    const row = aliasRows.get(e.db_number.toUpperCase().trim());
    if (!row) { noRow++; console.warn(`  no DB row for ${e.db_number} (alias ${e.code})`); continue; }
    const existing = (row.alternate_numbers ?? []).map((a) => a.toUpperCase());
    if (existing.includes(e.code.toUpperCase())) { alreadyRecorded++; continue; }
    updates.push({
      id: row.id,
      alternate_numbers: [...(row.alternate_numbers ?? []), e.code],
      code: e.code,
      db_number: e.db_number,
    });
    toUpdate++;
  }
  console.log(`[benjamin-moore aliases] entries: ${entries.length}, to update: ${toUpdate}, already recorded: ${alreadyRecorded}, missing row: ${noRow}`);
  const plan = path.join(SCAN_DIR, 'benjamin-moore-alias-plan.json');
  fs.writeFileSync(plan, JSON.stringify(updates, null, 1));
  console.log(`  plan: ${plan}`);

  if (!APPLY) return;

  let done = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from('colors')
      .update({ alternate_numbers: u.alternate_numbers })
      .eq('id', u.id);
    if (error) {
      console.error(`Alias update failed for ${u.db_number} <- ${u.code}:`, error.message);
      process.exit(1);
    }
    done++;
    if (done % 25 === 0 || done === updates.length) console.log(`  ${done}/${updates.length} updated`);
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  if (!brandArg) {
    console.error('Usage: tsx scripts/import-brand-scan.ts --brand=<slug> [--apply] [--backfill-aliases]');
    process.exit(1);
  }
  if (BACKFILL) {
    if (brandArg !== 'benjamin-moore') {
      console.error('--backfill-aliases is only defined for benjamin-moore');
      process.exit(1);
    }
    await backfillBmAliases(supabase);
  } else {
    await importBrand(supabase, brandArg);
  }
  if (!APPLY) console.log('\nDry run — no DB changes. Re-run with --apply.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
