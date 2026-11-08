// Best match per brand, picked from a list already sorted by Delta E.
//
// The site tools used to show the overall top 10, which is usually several
// near-duplicates from the two or three biggest catalogs. Sherwin-Williams was
// missing from that list in 26 of 50 test colors, 16 times with a candidate
// rated Very similar or better. These helpers keep the overall list as it is
// and add the closest color from each brand alongside it.

// The three brands the tools always show a row for, in display order.
export const BIG_THREE_BRANDS = [
  { slug: "sherwin-williams", name: "Sherwin-Williams" },
  { slug: "benjamin-moore", name: "Benjamin Moore" },
  { slug: "behr", name: "Behr" },
] as const;

export const BIG_THREE_SLUGS: readonly string[] = BIG_THREE_BRANDS.map((b) => b.slug);

interface BrandScored {
  brandSlug: string;
  deltaE: number;
}

/**
 * The first (closest) entry per brand, in Delta E order. `sorted` must already
 * be sorted ascending by deltaE; ties keep their input order.
 */
export function pickBestPerBrand<T extends BrandScored>(sorted: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const m of sorted) {
    if (seen.has(m.brandSlug)) continue;
    seen.add(m.brandSlug);
    out.push(m);
  }
  return out;
}

/** Big-three slugs with no entry in `best`. */
export function missingBigThree(best: readonly BrandScored[]): string[] {
  const present = new Set(best.map((m) => m.brandSlug));
  return BIG_THREE_SLUGS.filter((s) => !present.has(s));
}

/**
 * The big-three rows in display order (Sherwin-Williams, Benjamin Moore, Behr),
 * skipping any brand with no match.
 */
export function bigThreeRows<T extends BrandScored>(best: readonly T[]): T[] {
  const bySlug = new Map(best.map((m) => [m.brandSlug, m]));
  return BIG_THREE_SLUGS.map((s) => bySlug.get(s)).filter((m): m is T => m != null);
}
