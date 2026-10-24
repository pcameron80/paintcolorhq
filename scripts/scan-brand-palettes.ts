/**
 * Palette drift scan: pull every brand's live palette from the manufacturer
 * and diff it against the colors table. Read-only on both sides — it never
 * writes to the DB. Run it quarterly, and after the fall launch season
 * (late July to mid October), when brands add most of their new colors.
 *
 * Output, in data/brand-scans/<YYYY-MM-DD>/:
 *   <brand>-live.json         normalized live palette { code, name, hex }
 *   <brand>-missing.json      live colors with no DB row (import-brand-scan input)
 *   <brand>-not-live.json     active DB rows absent from the live palette
 *   <brand>-hex-changed.json  same code, swatch moved by CIEDE2000 >= 2 (one entry per DB row)
 *   <brand>-duplicate-codes.json  codes held by 2+ DB rows, each row diffed against the live swatch
 *   summary.json, REPORT.md
 *
 * Usage:
 *   npm run scan-palettes                              # all brands
 *   npm run scan-palettes -- --brand=behr,valspar      # subset
 *   npm run scan-palettes -- --out-dir=/tmp/scan       # write somewhere other than data/brand-scans/<date>
 *   npm run scan-palettes -- --brand=dunn-edwards --reuse-live=data/brand-scans/<date>
 *                       # re-diff a saved <brand>-live.json against the DB without re-crawling the brand site
 *
 * .env.local and data/brand-scans resolve from the working directory (as the
 * apply-* scripts do), so a worktree copy can be run from the main checkout.
 *
 * Next step for a brand with real gaps: review <brand>-missing.json, then
 *   tsx scripts/import-brand-scan.ts --brand=<slug> --scan-dir=data/brand-scans/<date> [--apply]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { diffPalette, type DbColor, type LiveColor, type PaletteDiff } from './lib/palette-diff';
import { SOURCES, NOT_SCANNED } from './lib/palette-sources';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });

const today = new Date().toISOString().slice(0, 10);
const brandArg = process.argv.find((a) => a.startsWith('--brand='))?.split('=')[1];
const outArg = process.argv.find((a) => a.startsWith('--out-dir='))?.split('=')[1];
const reuseArg = process.argv.find((a) => a.startsWith('--reuse-live='))?.split('=')[1];
const REUSE_DIR = reuseArg ? path.resolve(process.cwd(), reuseArg) : null;
const OUT_DIR = outArg ? path.resolve(process.cwd(), outArg) : path.resolve(process.cwd(), 'data/brand-scans', today);

interface BrandResult {
  brand: string;
  source: string;
  status: 'ok' | 'failed' | 'skipped' | 'no-source';
  error?: string;
  diff?: Omit<PaletteDiff, 'missing' | 'notLive' | 'hexChanged' | 'duplicateCodes'> & {
    missing: number;
    likelyRenumbered: number;
    archivedInFeed: number;
    notLive: number;
    hexChanged: number;
    duplicateCodes: number;
    /** duplicate-code groups where at least one row is CIEDE2000 2+ off the live swatch */
    duplicateCodesOff: number;
  };
}

async function loadDbColors(supabase: SupabaseClient, brandId: string): Promise<DbColor[]> {
  const rows: DbColor[] = [];
  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('colors')
      .select('color_number, alternate_numbers, name, hex, slug, is_archived')
      .eq('brand_id', brandId)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`DB read failed: ${error.message}`);
    rows.push(...(data as DbColor[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

const write = (file: string, data: unknown) =>
  fs.writeFileSync(path.join(OUT_DIR, file), JSON.stringify(data, null, 1));

async function scanBrand(supabase: SupabaseClient, brand: { id: string; slug: string }): Promise<BrandResult> {
  if (NOT_SCANNED[brand.slug]) {
    return { brand: brand.slug, source: NOT_SCANNED[brand.slug], status: 'skipped' };
  }
  const src = SOURCES[brand.slug];
  if (!src) {
    return { brand: brand.slug, source: '—', status: 'no-source', error: 'No fetcher in scripts/lib/palette-sources.ts' };
  }
  try {
    const saved = REUSE_DIR ? path.join(REUSE_DIR, `${brand.slug}-live.json`) : null;
    const fetchLive = saved && fs.existsSync(saved)
      ? async () => JSON.parse(fs.readFileSync(saved, 'utf8')) as LiveColor[]
      : src.fetch;
    const [live, db] = await Promise.all([fetchLive(), loadDbColors(supabase, brand.id)]);
    const d = diffPalette(live, db, { normalizeCode: src.normalizeCode, keep: src.keep });
    write(`${brand.slug}-live.json`, live);
    write(`${brand.slug}-missing.json`, d.missing);
    write(`${brand.slug}-not-live.json`, d.notLive);
    write(`${brand.slug}-hex-changed.json`, d.hexChanged);
    write(`${brand.slug}-duplicate-codes.json`, d.duplicateCodes);
    return {
      brand: brand.slug,
      source: src.source,
      status: 'ok',
      diff: {
        liveCount: d.liveCount,
        dbCount: d.dbCount,
        matched: d.matched,
        filtered: d.filtered,
        missing: d.missing.length,
        likelyRenumbered: d.missing.filter((m) => m.dbCodeForName).length,
        archivedInFeed: d.missing.filter((m) => m.archived).length,
        notLive: d.notLive.length,
        hexChanged: d.hexChanged.length,
        duplicateCodes: d.duplicateCodes.length,
        duplicateCodesOff: d.duplicateCodes.filter((g) => g.rows.some((r) => (r.deltaE ?? 0) >= 2)).length,
      },
    };
  } catch (err) {
    return { brand: brand.slug, source: src.source, status: 'failed', error: (err as Error).message };
  }
}

function report(results: BrandResult[]): string {
  const lines = [
    `# Palette drift scan — ${today}`,
    '',
    '"Missing" = in the live palette, no DB row by code or alternate number.',
    '"Renumbered?" = missing, but the same name exists in the DB under another code.',
    '"Not live" = active DB rows the brand no longer lists (candidates for is_archived, never deletion).',
    '',
    '"Duplicate codes" = codes held by 2+ DB rows; "off" counts groups with a row CIEDE2000 2+ from the live swatch.',
    '',
    '| Brand | Live | DB | Matched | Missing | Renumbered? | Archived in feed | Not live | Hex changed | Duplicate codes (off) | Status |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
  ];
  for (const r of results) {
    const d = r.diff;
    lines.push(
      d
        ? `| ${r.brand} | ${d.liveCount} | ${d.dbCount} | ${d.matched} | ${d.missing} | ${d.likelyRenumbered} | ${d.archivedInFeed} | ${d.notLive} | ${d.hexChanged} | ${d.duplicateCodes ?? 0} (${d.duplicateCodesOff ?? 0}) | ok |`
        : `| ${r.brand} | | | | | | | | | | ${r.status}${r.error ? `: ${r.error}` : ''} |`,
    );
  }
  lines.push('', '## Sources', '');
  for (const r of results) lines.push(`- **${r.brand}**: ${r.source}`);
  return lines.join('\n') + '\n';
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const { data: brands, error } = await supabase.from('brands').select('id, slug').order('slug');
  if (error || !brands) {
    console.error('Failed to fetch brands:', error?.message);
    process.exit(1);
  }
  const wanted = brandArg ? new Set(brandArg.split(',')) : null;
  const targets = brands.filter((b) => !wanted || wanted.has(b.slug));
  if (wanted) {
    const unknown = [...wanted].filter((w) => !brands.some((b) => b.slug === w));
    if (unknown.length) console.warn(`Unknown brand slug(s): ${unknown.join(', ')}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Sequential on purpose: these are the brands' production sites.
  const results: BrandResult[] = [];
  for (const b of targets) {
    process.stdout.write(`${b.slug} … `);
    const r = await scanBrand(supabase, b);
    console.log(
      r.diff
        ? `live ${r.diff.liveCount}, missing ${r.diff.missing} (${r.diff.likelyRenumbered} renumbered?), not live ${r.diff.notLive}, hex changed ${r.diff.hexChanged}, duplicate codes ${r.diff.duplicateCodes} (${r.diff.duplicateCodesOff} off)`
        : `${r.status}${r.error ? ` — ${r.error}` : ''}`,
    );
    results.push(r);
  }

  // A --brand subset run merges into the same day's summary rather than replacing it.
  const summaryFile = path.join(OUT_DIR, 'summary.json');
  const prior: BrandResult[] = fs.existsSync(summaryFile)
    ? (JSON.parse(fs.readFileSync(summaryFile, 'utf8')) as { results: BrandResult[] }).results
    : [];
  const merged = [...prior.filter((p) => !results.some((r) => r.brand === p.brand)), ...results].sort((a, b) =>
    a.brand.localeCompare(b.brand),
  );
  write('summary.json', { scannedAt: today, results: merged });
  fs.writeFileSync(path.join(OUT_DIR, 'REPORT.md'), report(merged));
  console.log(`\nReport: ${path.relative(process.cwd(), path.join(OUT_DIR, 'REPORT.md'))}`);
  if (results.some((r) => r.status === 'failed')) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
