/**
 * Shared rules for manufacturer-published LRVs and colors.lrv_source
 * (migration 017). Used by apply-published-lrv, backfill-lrv-source,
 * apply-lrv-nulls, apply-hex-corrections and import-brand-scan, so every
 * writer agrees on which feed values count as published and on how a DB row
 * is paired with a feed entry.
 *
 * Pure apart from hasLrvSourceColumn and loadBrandRows, which read the DB.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { HEAD_COLOR_PUSH } from '../../src/lib/head-colors';
import { SOURCES } from './palette-sources';

export type LrvSource = 'manufacturer' | 'computed';

/**
 * Feed codes whose LRV disagrees with the manufacturer's own color page.
 * BM's API gives premixed PM- codes their own LRV (PM-1 Super White 89.1)
 * while the color page shows the base color's (87.36). Checked 2026-10-11.
 * Vista's R-line pages print CIELAB L* under the "LRV" label: R132 Tannic Tea
 * (#5A4A43) shows 32.7, where its LRV is about 7. 125 of 132 R rows tripped
 * --max-delta on 2026-10-24.
 */
export const LRV_SKIP_CODES: Record<string, RegExp> = { 'benjamin-moore': /^PM-/, 'vista-paint': /^R\d/ };

/**
 * Highest LRV a computed value may hold. Brilliant whites top out around
 * 92-94 in published data (SW 9500 UltraWhite 93.5); a computed 95+ is
 * almost always an sRGB-white swatch (#ffffff reads 100), not paint.
 */
export const LRV_CEILING = 94.5;

export const roundLrv = (n: number) => Math.round(n * 10) / 10;

export const upperCode = (s: string | null | undefined) => (s ?? '').trim().toUpperCase();

/**
 * The published LRV for one feed entry, rounded to 0.1, or null when the
 * brand's feed value is not a usable LRV: missing, 0 (Sherwin-Williams 6995
 * Superwhite and archived SW colors encode "none" as 0; no paint has an LRV of
 * 0), over 100, or a code in LRV_SKIP_CODES.
 */
export function publishedLrv(brandSlug: string, code: string | null | undefined, lrv: number | null | undefined): number | null {
  if (lrv == null || !Number.isFinite(lrv) || lrv <= 0 || lrv > 100) return null;
  if (LRV_SKIP_CODES[brandSlug]?.test(upperCode(code))) return null;
  return roundLrv(lrv);
}

/**
 * Loose name key: case, punctuation, accents and trademark marks differ
 * between feed and DB without being different colors.
 */
export const nameKey = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®™]|\breg$/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * True when a DB name and a feed name are the same color. A prefix match
 * tolerates names truncated at import ("Almond" for CC-280 Almond Bisque).
 */
export function namesAgree(dbName: string, feedName: string): boolean {
  const [db, feed] = [nameKey(dbName), nameKey(feedName)];
  return !!db && feed.startsWith(db);
}

export interface FeedColor {
  code: string;
  name: string;
  lrv?: number;
}
export interface CodedRow {
  color_number: string | null;
  alternate_numbers: string[] | null;
}

/**
 * Index a brand's feed by normalized code, keeping only entries with a
 * usable published LRV (first entry wins on a repeated code). The returned
 * lookup tries the row's color_number, then each alternate number, all
 * through the brand's normalizeCode from palette-sources.
 */
export function feedLrvIndex<T extends FeedColor>(brandSlug: string, live: T[]) {
  const normalize = SOURCES[brandSlug]?.normalizeCode;
  const key = (s: string | null | undefined) => upperCode(normalize && s ? normalize(s) : s);
  const byCode = new Map<string, T & { published: number }>();
  for (const c of live) {
    const published = publishedLrv(brandSlug, c.code, c.lrv);
    if (published === null || byCode.has(key(c.code))) continue;
    byCode.set(key(c.code), { ...c, published });
  }
  const lookup = (r: CodedRow) =>
    byCode.get(key(r.color_number)) ?? (r.alternate_numbers ?? []).map((a) => byCode.get(key(a))).find(Boolean);
  return { size: byCode.size, key, lookup };
}

/** "brandSlug/colorSlug" keys of the frozen head colors (until 2026-11-27). */
export const HEAD_KEYS: ReadonlySet<string> = new Set(HEAD_COLOR_PUSH);

/** YYYY-MM-DD from a scan dir name like data/brand-scans/2026-10-24, else null. */
export function scanDate(dir: string): string | null {
  const m = dir.replace(/\/+$/, '').match(/(\d{4}-\d{2}-\d{2})$/);
  return m ? m[1] : null;
}

/**
 * Whether migration 017 (colors.lrv_source, colors.lrv_checked_on) is
 * applied. Writers add the columns to their payloads only when it is, so the
 * LRV corrections can run before or after the migration.
 */
export async function hasLrvSourceColumn(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from('colors').select('lrv_source, lrv_checked_on').limit(1);
  if (!error) return true;
  // PostgREST reports an unknown column as 42703 (Postgres) or PGRST204.
  if (error.code === '42703' || error.code === 'PGRST204' || /lrv_source|lrv_checked_on/.test(error.message)) return false;
  throw new Error(`DB read failed: ${error.message}`);
}

/** Every row of one brand, paged, ordered by slug. */
export async function loadBrandRows<T>(supabase: SupabaseClient, brandId: string, fields: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('colors')
      .select(fields)
      .eq('brand_id', brandId)
      .order('slug')
      .range(from, from + 999);
    if (error) throw new Error(`DB read failed: ${error.message}`);
    rows.push(...(data as T[]));
    if (!data || data.length < 1000) return rows;
  }
}
