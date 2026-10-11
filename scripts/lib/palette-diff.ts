/**
 * Diff a brand's live palette (as published by the manufacturer) against the
 * colors we hold in the DB. Pure functions — no I/O — so the rules are
 * testable and the scan script stays a thin fetch-and-report shell.
 *
 * A live color counts as present when its normalized code matches a DB row's
 * color_number OR any of its alternate_numbers. Everything else lands in one
 * of the report buckets below; nothing here decides what gets imported.
 */

import { hexToRgb, rgbToLab, deltaE2000 } from './color-utils';

export interface LiveColor {
  code: string;
  name: string;
  hex: string | null;
  /** manufacturer marks it discontinued but still lists it */
  archived?: boolean;
  /** manufacturer-published LRV, when the source carries one */
  lrv?: number;
}

export interface DbColor {
  color_number: string | null;
  alternate_numbers: string[] | null;
  name: string;
  hex: string;
  slug: string;
  is_archived: boolean | null;
}

export interface MissingColor extends LiveColor {
  /** same name already in the DB under a different code — likely renumbered, not new */
  dbCodeForName?: string;
}

export interface HexChange {
  /** DB row the change applies to */
  slug: string;
  code: string;
  name: string;
  dbHex: string;
  liveHex: string;
  deltaE: number;
  liveLrv?: number;
}

export interface PaletteDiff {
  liveCount: number;
  dbCount: number;
  matched: number;
  /** live colors with no DB row by code */
  missing: MissingColor[];
  /** active DB rows whose code is absent from the live palette (possibly discontinued) */
  notLive: { code: string; name: string; slug: string }[];
  /** same code, swatch moved by at least HEX_CHANGE_THRESHOLD (CIEDE2000) */
  hexChanged: HexChange[];
  /** live entries dropped by the brand's keep() rule or with no usable hex */
  filtered: number;
}

/** Below this the swatch change is rounding noise between sources, not a reformulation. */
export const HEX_CHANGE_THRESHOLD = 2;

export const normCode = (code: string): string =>
  code.trim().toUpperCase().replace(/\s+/g, ' ');

export const normName = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function normHex(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const h = hex.trim().replace(/^#/, '').toLowerCase();
  return /^[0-9a-f]{6}$/.test(h) ? `#${h}` : null;
}

function deltaE(hexA: string, hexB: string): number {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const la = rgbToLab(a.r, a.g, a.b);
  const lb = rgbToLab(b.r, b.g, b.b);
  return deltaE2000(la, lb);
}

export interface DiffOptions {
  /**
   * Map a code onto one canonical form. Applied to live codes AND DB
   * color_number/alternate_numbers, so DB rows stored in an older convention
   * ("SW 6980", "1" vs the feed's "0001") still match.
   */
  normalizeCode?: (code: string) => string;
  /** drop live entries that are out of scope (stains, metallics, spray) */
  keep?: (c: LiveColor) => boolean;
}

export function diffPalette(
  live: LiveColor[],
  db: DbColor[],
  opts: DiffOptions = {},
): PaletteDiff {
  const toKey = (code: string) => normCode(opts.normalizeCode ? opts.normalizeCode(code) : code);

  const byCode = new Map<string, DbColor>();
  const byName = new Map<string, DbColor>();
  for (const row of db) {
    if (row.color_number) byCode.set(toKey(row.color_number), row);
    for (const alt of row.alternate_numbers ?? []) {
      const k = toKey(alt);
      if (!byCode.has(k)) byCode.set(k, row);
    }
    const n = normName(row.name);
    if (n && !byName.has(n)) byName.set(n, row);
  }

  // A row can be reachable through its own code AND an alias (BM Black is
  // HC-190 with premix alias PM-9, and the feed lists both with different
  // swatches). Only the row's own code may speak for its hex.
  const allLiveKeys = new Set(live.filter((c) => c.code?.trim()).map((c) => toKey(c.code)));

  const liveKeys = new Set<string>();
  const missing: MissingColor[] = [];
  const hexChanged: HexChange[] = [];
  let matched = 0;
  let filtered = 0;

  for (const c of live) {
    const hex = normHex(c.hex);
    if (!c.code?.trim() || (opts.keep && !opts.keep(c))) {
      filtered++;
      continue;
    }
    const key = toKey(c.code);
    if (liveKeys.has(key)) continue; // feeds repeat rows (Behr's classic whites)
    liveKeys.add(key);

    const row = byCode.get(key);
    if (row) {
      matched++;
      const dbHex = normHex(row.hex);
      const viaAlias = !!row.color_number && toKey(row.color_number) !== key;
      const ownCodeLive = viaAlias && allLiveKeys.has(toKey(row.color_number!));
      if (hex && dbHex && hex !== dbHex && !ownCodeLive) {
        const d = deltaE(hex, dbHex);
        if (d >= HEX_CHANGE_THRESHOLD) {
          hexChanged.push({
            slug: row.slug,
            code: c.code,
            name: c.name,
            dbHex,
            liveHex: hex,
            deltaE: Math.round(d * 10) / 10,
            ...(c.lrv != null ? { liveLrv: c.lrv } : {}),
          });
        }
      }
      continue;
    }
    if (!hex) {
      filtered++;
      continue;
    }
    const sameName = byName.get(normName(c.name));
    missing.push({
      code: c.code.trim(),
      name: c.name.trim(),
      hex,
      ...(c.archived ? { archived: true } : {}),
      ...(sameName?.color_number ? { dbCodeForName: sameName.color_number } : {}),
    });
  }

  const notLive = db
    .filter((row) => !row.is_archived && row.color_number)
    .filter((row) => {
      const codes = [row.color_number!, ...(row.alternate_numbers ?? [])].map(toKey);
      return !codes.some((k) => liveKeys.has(k));
    })
    .map((row) => ({ code: row.color_number!, name: row.name, slug: row.slug }));

  return {
    liveCount: live.length,
    dbCount: db.length,
    matched,
    missing,
    notLive,
    hexChanged: hexChanged.sort((a, b) => b.deltaE - a.deltaE),
    filtered,
  };
}
