/**
 * Canonical-row selection for duplicate colors.
 *
 * A "duplicate group" is 2+ rows in the same brand with the same name and the
 * same hex. Two sources of duplicates exist in the data:
 *
 *   1. Dual numbering — the brand genuinely sells one color under multiple
 *      numbering systems. Benjamin Moore lists US retail numbers (1495),
 *      Off-White/Historical collection numbers (OC-130, HC-190), and Canadian
 *      Designer Classics numbers (CC-550) for the same paint. PPG carries
 *      modern 4-digit codes (1066-4) alongside legacy 2-digit codes (18-28).
 *   2. Plain import dupes — identical rows where the importer deduped the
 *      slug with a -2/-3 suffix (all the Kilz TB-* repeats).
 *
 * One row per group survives as canonical; the rest are deleted and their
 * color numbers folded into the canonical row's alternate_numbers.
 */

export interface DedupeCandidate {
  slug: string;
  color_number: string | null;
  created_at?: string | null;
}

/**
 * Higher score = more canonical. Rules per brand:
 *
 * - Benjamin Moore: CC- (Canadian Designer Classics) always loses; OC-/HC-
 *   collection numbers beat plain retail numbers — they're the numbers BM
 *   markets and people search ("Balboa Mist OC-27", "Cloud White OC-130"),
 *   and the numbers our editorial content already links to.
 * - PPG: modern codes (3-4 digit family + shade, "1066-4") beat legacy
 *   two-digit codes ("18-28").
 * - Everything else (and same-number groups): tie at 2, resolved by slug.
 */
export function canonicalScore(
  brandSlug: string,
  colorNumber: string | null,
): number {
  const num = (colorNumber ?? "").toUpperCase();
  if (brandSlug === "benjamin-moore") {
    if (num.startsWith("CC-")) return 0;
    if (num.startsWith("OC-") || num.startsWith("HC-")) return 3;
    return 2;
  }
  if (brandSlug === "ppg") {
    return /^\d{3,4}-\d$/.test(num) ? 3 : 2;
  }
  return 2;
}

export interface DedupeDecision<T extends DedupeCandidate> {
  canonical: T;
  dupes: T[];
  /** Distinct color numbers from the dupes that differ from the canonical's. */
  alternates: string[];
}

/**
 * Pick the canonical row from a duplicate group. Ties on score are broken by
 * shortest slug (the importer suffixes -2/-3 onto repeats, so the base slug
 * is always shortest), then earliest created_at, then lexicographic slug for
 * full determinism.
 */
export function pickCanonical<T extends DedupeCandidate>(
  rows: T[],
  brandSlug: string,
): DedupeDecision<T> {
  if (rows.length < 2) {
    throw new Error(`pickCanonical called with ${rows.length} row(s)`);
  }
  const sorted = [...rows].sort((a, b) => {
    const scoreDiff =
      canonicalScore(brandSlug, b.color_number) -
      canonicalScore(brandSlug, a.color_number);
    if (scoreDiff !== 0) return scoreDiff;
    if (a.slug.length !== b.slug.length) return a.slug.length - b.slug.length;
    const aCreated = a.created_at ?? "";
    const bCreated = b.created_at ?? "";
    if (aCreated !== bCreated) return aCreated < bCreated ? -1 : 1;
    return a.slug < b.slug ? -1 : 1;
  });

  const canonical = sorted[0];
  const dupes = sorted.slice(1);
  const canonicalNum = (canonical.color_number ?? "").toUpperCase();
  const alternates = [
    ...new Set(
      dupes
        .map((d) => (d.color_number ?? "").trim())
        .filter((n) => n && n.toUpperCase() !== canonicalNum),
    ),
  ];

  return { canonical, dupes, alternates };
}

/** Grouping key for duplicate detection: same brand + name + hex. */
export function dupeGroupKey(
  brandKey: string,
  name: string,
  hex: string,
): string {
  return `${brandKey}|${name.trim().toLowerCase()}|${hex.trim().toLowerCase()}`;
}
