/**
 * Duplicate-color grouping and canonical-row selection.
 *
 * A duplicate group is 2+ rows in one brand that describe the same paint.
 * The data holds several kinds (counts from the 2026-10-24 audit):
 *
 *   name+hex   Same name and hex. Benjamin Moore dual numbering (1495 next to
 *              CC-550, OC-151 next to PM-2: 39 pairs), Dunn-Edwards Black,
 *              Valspar Encore, and the original Kilz TB-* import repeats.
 *   behr-pad   Behr holds both a padded and an unpadded code for 266 colors
 *              ("PPU18-01" next to "PPU18-1"), same name. Hex can differ by up
 *              to 7.6 dE, so this key does not use hex.
 *   same-code  Same brand and code under two slugs: 43 Behr slug / slug-2
 *              pairs, plus N300-4 open-canyon / canyon-ouvert.
 *   hisp       Behr's 74 Spanish-name "(HISP)" rows, same code and hex as the
 *              English row.
 *   norm-code  Same hex and the same code once the brand's palette normalizer
 *              is applied: Sherwin-Williams 35 / 0035 and 39 / 0039.
 *   bm-ac      Benjamin Moore's retired AC- numbers, joined to the primary row
 *              BM's own site lists them on (data/bm-ac-aliases.json, from
 *              scripts/fetch-bm-aliases.ts). Exact-hex matching maps several
 *              of these to the wrong color, so hex is not used.
 *
 * One row per group survives as canonical. The rest are retired (see
 * scripts/retire-bad-color-rows.ts) and their codes folded into the
 * canonical's alternate_numbers.
 */

import { normalizeBehrCode, SOURCES } from './palette-sources';
import { deltaE2000, hexToRgb, rgbToLab } from './color-utils';

export interface DedupeCandidate {
  slug: string;
  color_number: string | null;
  name?: string | null;
  created_at?: string | null;
  /** set by the palette scan when the brand's live feed lists the code */
  last_seen_live_on?: string | null;
}

export type GroupReason = 'name+hex' | 'behr-pad' | 'same-code' | 'hisp' | 'norm-code' | 'bm-ac';

const HISP_RX = /\s*\(HISP\)\s*$/i;

/** A Spanish-name Behr row: "(HISP)" on the code or the name. */
export function isHisp(c: Pick<DedupeCandidate, 'color_number' | 'name'>): boolean {
  return HISP_RX.test(c.color_number ?? '') || HISP_RX.test(c.name ?? '');
}

export const stripHisp = (code: string): string => code.replace(HISP_RX, '').trim();

const isLive = (c: DedupeCandidate) => c.last_seen_live_on != null && c.last_seen_live_on !== '';

/**
 * Higher score = more canonical, within one brand. Feed presence and HISP are
 * ranked before this score (see pickCanonical); this decides between rows the
 * feed cannot separate.
 *
 * - Benjamin Moore: CC- (Canadian Designer Classics) and AC- (retired
 *   numbers BM now lists only as aliases) always lose; OC-/HC- collection
 *   numbers beat PM- and plain retail numbers. BM's own site makes OC-151
 *   primary with PM-2 as an alias, and people search "Cloud White OC-130".
 * - PPG: modern codes (3-4 digit family + shade, "1066-4") beat legacy
 *   two-digit codes ("18-28").
 * - Behr: the padded code ("PPU18-01") is the one Behr publishes.
 * - Sherwin-Williams: the 4-digit code ("0035") is the one SW publishes.
 * - Everything else: tie at 2, resolved by slug.
 */
export function canonicalScore(brandSlug: string, colorNumber: string | null): number {
  const num = (colorNumber ?? '').trim().toUpperCase();
  if (brandSlug === 'benjamin-moore') {
    if (num.startsWith('CC-') || num.startsWith('AC-')) return 0;
    if (num.startsWith('OC-') || num.startsWith('HC-')) return 3;
    return 2;
  }
  if (brandSlug === 'ppg') {
    return /^\d{3,4}-\d$/.test(num) ? 3 : 2;
  }
  if (brandSlug === 'behr') {
    return num && normalizeBehrCode(num) !== num ? 3 : 2;
  }
  if (brandSlug === 'sherwin-williams') {
    return /^(SW\s*)?\d{4}$/.test(num) ? 3 : 2;
  }
  return 2;
}

export interface DedupeDecision<T extends DedupeCandidate> {
  canonical: T;
  dupes: T[];
  /** Distinct color numbers from the dupes that differ from the canonical's. */
  alternates: string[];
  /** The canonical is not in the live feed but a dupe is. --apply refuses these. */
  liveConflict: boolean;
}

/**
 * Pick the canonical row from a duplicate group, in order:
 *   1. in the brand's live feed (last_seen_live_on set)
 *   2. not a "(HISP)" Spanish-name row
 *   3. canonicalScore (brand numbering rules)
 *   4. shortest slug (the importer suffixes -2/-3 onto repeats)
 *   5. earliest created_at, then lexicographic slug, for full determinism
 */
export function pickCanonical<T extends DedupeCandidate>(rows: T[], brandSlug: string): DedupeDecision<T> {
  if (rows.length < 2) {
    throw new Error(`pickCanonical called with ${rows.length} row(s)`);
  }
  const sorted = [...rows].sort((a, b) => {
    const live = Number(isLive(b)) - Number(isLive(a));
    if (live !== 0) return live;
    const hisp = Number(isHisp(a)) - Number(isHisp(b));
    if (hisp !== 0) return hisp;
    const scoreDiff = canonicalScore(brandSlug, b.color_number) - canonicalScore(brandSlug, a.color_number);
    if (scoreDiff !== 0) return scoreDiff;
    if (a.slug.length !== b.slug.length) return a.slug.length - b.slug.length;
    const aCreated = a.created_at ?? '';
    const bCreated = b.created_at ?? '';
    if (aCreated !== bCreated) return aCreated < bCreated ? -1 : 1;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });

  const canonical = sorted[0];
  const dupes = sorted.slice(1);
  const canonicalNum = (canonical.color_number ?? '').trim().toUpperCase();
  const alternates = [
    ...new Set(
      dupes
        .map((d) => stripHisp((d.color_number ?? '').trim()))
        .filter((n) => n && n.toUpperCase() !== canonicalNum),
    ),
  ];
  const liveConflict = !isLive(canonical) && dupes.some(isLive);

  return { canonical, dupes, alternates, liveConflict };
}

/** Grouping key for the original duplicate rule: same brand + name + hex. */
export function dupeGroupKey(brandKey: string, name: string, hex: string): string {
  return `${brandKey}|${name.trim().toLowerCase()}|${hex.trim().toLowerCase()}`;
}

export interface GroupableRow extends DedupeCandidate {
  id: string;
  brand_id: string;
  name: string;
  hex: string;
}

/** One AC- alias: the AC code and the BM number(s) BM lists it on. */
export interface AcAlias {
  code: string;
  primary: { number: string };
  candidates?: { number: string; name?: string; hex?: string }[];
}

function hexDeltaE(a: string, b: string): number {
  const lab = (hex: string) => {
    const { r, g, b: bl } = hexToRgb(hex);
    return rgbToLab(r, g, bl);
  };
  return deltaE2000(lab(a), lab(b));
}

/** "AC-adia" (an old import's mangling of "Acadia") -> "acadia" */
const acNameWord = (name: string) => name.trim().toLowerCase().replace(/^ac-/, 'ac').split(/\s+/)[0] ?? '';

/**
 * Which held row an AC- code folds into. BM lists some AC- codes on more than
 * one color (AC-40 on 968 Dune White and OC-37 Glacier White; AC-36 on 1544
 * Waynesboro Taupe and HC-87 Ashley Gray). In order:
 *   0. never a CC-/AC- row while another candidate is held;
 *   1. the candidate whose name starts with our AC- row's name, which the
 *      old import cut to its first word ("Glacier" for Glacier White);
 *   2. the candidate whose stored hex is closest to the AC- row's hex;
 *   3. BM numbering rules (OC-/HC- first).
 * Candidates we do not hold are skipped.
 */
export function resolveAcTarget<T extends { hex: string; color_number: string | null; name: string }>(
  acRow: T,
  alias: AcAlias,
  heldByCode: Map<string, T>,
): T | undefined {
  const cands = alias.candidates?.length ? alias.candidates : [{ number: alias.primary.number }];
  const held = cands
    .map((c) => ({ c, r: heldByCode.get(c.number.toUpperCase()) }))
    .filter((x): x is { c: (typeof cands)[number] & { name?: string }; r: T } => !!x.r);
  if (held.length <= 1) return held[0]?.r;
  const word = acNameWord(acRow.name);
  const nameHit = (x: (typeof held)[number]) =>
    word.length > 2 && ((x.c.name ?? x.r.name).toLowerCase().startsWith(word) ? 1 : 0);
  return held
    .map((x) => ({ ...x, hit: Number(nameHit(x)), d: hexDeltaE(acRow.hex, x.r.hex) }))
    .sort(
      (x, y) =>
        // A CC-/AC- row is never a fold target while a primary number is held.
        Number(canonicalScore('benjamin-moore', y.r.color_number) > 0) -
          Number(canonicalScore('benjamin-moore', x.r.color_number) > 0) ||
        y.hit - x.hit ||
        Math.round(x.d * 100) - Math.round(y.d * 100) ||
        canonicalScore('benjamin-moore', y.r.color_number) - canonicalScore('benjamin-moore', x.r.color_number),
    )[0].r;
}

export interface DuplicateGroup<T extends GroupableRow> {
  brandSlug: string;
  rows: T[];
  reasons: GroupReason[];
}

/**
 * Every grouping key a row contributes. Rows sharing any key end up in one
 * group (union-find), so a Behr pair caught by both behr-pad and name+hex is
 * one group, not two.
 */
export function groupKeys(row: GroupableRow, brandSlug: string): [GroupReason, string][] {
  const b = row.brand_id;
  const code = (row.color_number ?? '').trim().toUpperCase();
  const name = row.name.trim().toLowerCase();
  const hex = row.hex.trim().toLowerCase();
  const keys: [GroupReason, string][] = [['name+hex', `nh|${dupeGroupKey(b, row.name, row.hex)}`]];
  if (!code) return keys;
  keys.push(['same-code', `sc|${b}|${code}`]);
  if (brandSlug === 'behr') {
    keys.push(['behr-pad', `bp|${b}|${normalizeBehrCode(stripHisp(code))}|${name}`]);
    keys.push(['hisp', `hx|${b}|${stripHisp(code)}|${hex}`]);
  }
  const norm = SOURCES[brandSlug]?.normalizeCode;
  if (norm && brandSlug !== 'behr') {
    keys.push(['norm-code', `nc|${b}|${norm(code).toUpperCase()}|${hex}`]);
  }
  return keys;
}

/**
 * Build duplicate groups from every grouping rule plus the BM AC- alias seeds.
 * Returns groups of 2+ rows, with the rules that joined them.
 */
export function findDuplicateGroups<T extends GroupableRow>(
  rows: T[],
  brandSlugById: Map<string, string>,
  acAliases: AcAlias[] = [],
): { groups: DuplicateGroup<T>[]; acUnresolved: string[] } {
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  // Remember which rule joined each pair of roots; attach to the final group.
  const reasonsByIndex = new Map<number, Set<GroupReason>>();
  const union = (i: number, j: number, reason: GroupReason) => {
    for (const k of [i, j]) {
      if (!reasonsByIndex.has(k)) reasonsByIndex.set(k, new Set());
      reasonsByIndex.get(k)!.add(reason);
    }
    const a = find(i);
    const c = find(j);
    if (a !== c) parent[c] = a;
  };

  // A Behr slug / slug-2 pair with one code also shares the behr-pad key, and
  // a same-code pair with one hex shares the hisp key. Credit those keys only
  // when they did their own job, so the tally reports each kind once.
  const codeOf = (i: number) => (rows[i].color_number ?? '').trim().toUpperCase();
  const credits = (reason: GroupReason, i: number, j: number) => {
    if (reason === 'behr-pad' || reason === 'norm-code') return codeOf(i) !== codeOf(j);
    if (reason === 'hisp') return isHisp(rows[i]) !== isHisp(rows[j]);
    return true;
  };
  const firstByKey = new Map<string, number>();
  rows.forEach((row, i) => {
    const brandSlug = brandSlugById.get(row.brand_id) ?? '?';
    for (const [reason, key] of groupKeys(row, brandSlug)) {
      const first = firstByKey.get(key);
      if (first === undefined) firstByKey.set(key, i);
      else if (credits(reason, first, i)) union(first, i, reason);
      else union(first, i, 'same-code');
    }
  });

  const acUnresolved: string[] = [];
  if (acAliases.length) {
    const indexOf = new Map<T, number>(rows.map((r, i) => [r, i]));
    const bmByCode = new Map<string, T>();
    rows.forEach((row) => {
      if (brandSlugById.get(row.brand_id) !== 'benjamin-moore') return;
      const code = (row.color_number ?? '').trim().toUpperCase();
      if (code && !bmByCode.has(code)) bmByCode.set(code, row);
    });
    for (const a of acAliases) {
      const acRow = bmByCode.get(a.code.toUpperCase());
      if (!acRow) continue; // no AC row held for this code
      const target = resolveAcTarget(acRow, a, bmByCode);
      if (!target) {
        const listed = (a.candidates ?? [a.primary]).map((c) => c.number).join(', ');
        acUnresolved.push(`${a.code}: no row holds ${listed}`);
        continue;
      }
      union(indexOf.get(target)!, indexOf.get(acRow)!, 'bm-ac');
    }
  }

  const members = new Map<number, number[]>();
  rows.forEach((_, i) => {
    const r = find(i);
    members.set(r, [...(members.get(r) ?? []), i]);
  });
  const groups: DuplicateGroup<T>[] = [];
  for (const idxs of members.values()) {
    if (idxs.length < 2) continue;
    const reasons = new Set<GroupReason>();
    for (const i of idxs) for (const r of reasonsByIndex.get(i) ?? []) reasons.add(r);
    groups.push({
      brandSlug: brandSlugById.get(rows[idxs[0]].brand_id) ?? '?',
      rows: idxs.map((i) => rows[i]),
      reasons: [...reasons].sort(),
    });
  }
  return { groups, acUnresolved };
}

/**
 * The primary reason a group is reported under, for the summary tally:
 * the most specific rule that joined it.
 */
export function primaryReason(reasons: GroupReason[]): GroupReason {
  const order: GroupReason[] = ['bm-ac', 'hisp', 'behr-pad', 'norm-code', 'same-code', 'name+hex'];
  return order.find((r) => reasons.includes(r)) ?? reasons[0];
}

/**
 * Merge new redirects into the existing map without dropping any entry.
 * - An existing entry pointing at a row being retired is re-pointed at that
 *   row's canonical, so no redirect chains form.
 * - A new key that already exists with a different target keeps the existing
 *   target and is reported as a conflict.
 */
export function mergeRedirects(
  existing: Record<string, string>,
  additions: Record<string, string>,
): { merged: Record<string, string>; added: string[]; repointed: string[]; conflicts: string[] } {
  const merged: Record<string, string> = { ...existing };
  const added: string[] = [];
  const repointed: string[] = [];
  const conflicts: string[] = [];
  for (const [from, to] of Object.entries(additions)) {
    if (from in merged) {
      if (merged[from] !== to) conflicts.push(`${from}: keeps ${merged[from]}, plan wanted ${to}`);
      continue;
    }
    merged[from] = to;
    added.push(from);
  }
  for (const [from, to] of Object.entries(merged)) {
    const next = additions[to];
    if (next && next !== to && from !== to) {
      merged[from] = next;
      repointed.push(`${from}: ${to} -> ${next}`);
    }
  }
  return { merged, added, repointed, conflicts };
}
