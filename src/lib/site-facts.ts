// Site-wide catalog facts that copy and metadata quote as numbers. Change a
// count here, never in a page: scripts/check-copy-counts.ts fails when a
// hard-coded brand count in src/ disagrees with BRAND_COUNT, and it checks
// BRAND_COUNT against the brands in src/generated/sitemap.json.
// This file stays dependency-free so client components can import it without
// pulling the catalog snapshot into their bundle.

/** Number of paint brands in the catalog. */
export const BRAND_COUNT = 13;

/**
 * How many brands remain after naming `named` of them, for copy such as
 * "Sherwin-Williams, Benjamin Moore, Behr & N more brands" (moreBrands(3)).
 */
export function moreBrands(named: number): number {
  return BRAND_COUNT - named;
}
