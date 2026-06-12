/**
 * Filter + normalization rules for importing colors from Behr's live palette
 * dump (window.colorData on behr.com/consumer/colors/paint, saved to
 * data/behr-live-palette.json).
 *
 * The dump is row-arrays with a header row of field names. It contains the
 * full retail palette plus a handful of spray-paint entries and duplicate
 * rows for the classic ready-mix whites — the rules here decide what is a
 * wall-paint color worth importing.
 */

export interface LivePaletteRaw {
  header: string[];
  count: number;
  rows: (string | number | boolean | null)[][];
}

export interface LiveColor {
  id: string; // color number, e.g. "S350-4A", "DC-001", "12"
  name: string; // raw name from Behr, ALL CAPS
  hex: string; // "#A7A07E"
  isLegacy: boolean;
}

/**
 * Behr's spray-paint line: the two "- GLOSS" entries and their flat
 * siblings. These are the only numeric ids that aren't classic ready-mix
 * wall whites (12 Swiss Coffee, 1850 Ultra Pure White, etc.).
 */
const SPRAY_IDS = new Set(['6694', '6695', '6794', '6795']);

export function parseLivePalette(raw: LivePaletteRaw): LiveColor[] {
  const idx = new Map(raw.header.map((k, i) => [k, i]));
  const need = ['id', 'name', 'rgb', 'islegacycolor'];
  for (const k of need) {
    if (!idx.has(k)) throw new Error(`Palette dump missing field: ${k}`);
  }
  const out: LiveColor[] = [];
  const seen = new Set<string>();
  for (const row of raw.rows) {
    const id = String(row[idx.get('id')!] ?? '').trim().toUpperCase();
    if (!id || seen.has(id)) continue; // dump repeats the classic whites
    seen.add(id);
    out.push({
      id,
      name: String(row[idx.get('name')!] ?? '').trim(),
      hex: String(row[idx.get('rgb')!] ?? '').trim().toLowerCase(),
      isLegacy: String(row[idx.get('islegacycolor')!]) === 'true',
    });
  }
  return out;
}

/** True if this palette entry is an importable wall-paint color. */
export function shouldImport(c: LiveColor): boolean {
  if (c.isLegacy) return false;
  if (SPRAY_IDS.has(c.id)) return false;
  if (/\bGLOSS\b/i.test(c.name)) return false;
  if (!/^#[0-9a-f]{6}$/.test(c.hex)) return false;
  if (!c.name) return false;
  return true;
}

const SMALL_WORDS = new Set([
  'a', 'an', 'and', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or',
  'the', 'to', 'with',
]);

/** "PEACH OF MIND" -> "Peach of Mind"; first word always capitalized. */
export function titleCaseName(raw: string): string {
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w)) return w;
      // capitalize first letter and any letter after a hyphen/apostrophe
      // boundary start ("semi-sweet" -> "Semi-Sweet")
      return w.replace(/(^|[-'])([a-z])/g, (_, p, ch) => p + ch.toUpperCase());
    })
    .join(' ');
}

/** Same slug shape the colornerd import produces: name slug + number slug. */
export function makeSlug(name: string, colorNumber: string): string {
  const part = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  return `${part(name)}-${part(colorNumber)}`;
}
