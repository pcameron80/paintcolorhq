import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getColorsByBrandCount } from "./queries";

// Cached brand color counts for the brand pages. getColorsByBrandCount is an
// uncached head/count query, and every brand-page render (metadata, the grid
// count and the total) called it, roughly 3,000 times a day. Counts only move
// when a data import runs, so a one-day data cache is safe; React cache()
// dedupes the metadata and page calls inside one render.

const DAY = 86400;

const countCached = unstable_cache(
  (brandId: string, family: string, undertone: string) =>
    getColorsByBrandCount(brandId, { family: family || undefined, undertone: undertone || undefined }),
  ["brand-color-count"],
  { revalidate: DAY },
);

/** Cached drop-in for getColorsByBrandCount. */
export const getCachedColorsByBrandCount = cache(
  (brandId: string, options?: { family?: string; undertone?: string }): Promise<number> =>
    countCached(brandId, options?.family ?? "", options?.undertone ?? ""),
);

/**
 * Color count per family for one brand, within the current undertone filter,
 * so the page can hide chips that would lead to an empty (404) listing.
 */
export const getBrandFamilyCounts = cache(
  async (brandId: string, families: readonly string[], undertone = ""): Promise<Record<string, number>> => {
    const counts = await Promise.all(
      families.map((family) => getCachedColorsByBrandCount(brandId, { family, undertone })),
    );
    return Object.fromEntries(families.map((family, i) => [family, counts[i]]));
  },
);

/** Color count per undertone for one brand, within the current family filter. */
export const getBrandUndertoneCounts = cache(
  async (brandId: string, undertones: readonly string[], family = ""): Promise<Record<string, number>> => {
    const counts = await Promise.all(
      undertones.map((undertone) => getCachedColorsByBrandCount(brandId, { family, undertone })),
    );
    return Object.fromEntries(undertones.map((undertone, i) => [undertone, counts[i]]));
  },
);
