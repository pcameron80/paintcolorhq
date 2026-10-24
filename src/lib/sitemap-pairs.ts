// Diff of the individual match pages in the sitemap between two snapshot
// builds. A reseed can quietly move a pair past the indexing threshold; the
// build prints this so the change is seen rather than discovered in GSC.

/** Why a candidate pair is not in the sitemap. */
export type PairExclusion = "noindexed" | "removed";

export interface PairDiff {
  /** In the new sitemap, not in the previous one. */
  newlyIndexable: string[];
  /** In the previous sitemap; the pair still resolves but now fails isMatchIndexable. */
  newlyNoindexed: string[];
  /** In the previous sitemap; the source color or its best match in that brand no longer exists. */
  removed: string[];
}

export function diffPairs(previous: readonly string[], current: readonly string[], exclusions: ReadonlyMap<string, PairExclusion>): PairDiff {
  const prev = new Set(previous);
  const curr = new Set(current);
  const dropped = [...prev].filter((u) => !curr.has(u)).sort();
  return {
    newlyIndexable: [...curr].filter((u) => !prev.has(u)).sort(),
    newlyNoindexed: dropped.filter((u) => exclusions.get(u) === "noindexed"),
    // A dropped URL the build never generated (its source left the popular
    // list or changed slug) also counts as removed.
    removed: dropped.filter((u) => exclusions.get(u) !== "noindexed"),
  };
}

/** Pulls the <loc> paths out of a urlset sitemap. */
export function sitemapPaths(xml: string, baseUrl: string): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const loc = m[1].trim().replace(/&amp;/g, "&");
    return loc.startsWith(baseUrl) ? loc.slice(baseUrl.length) : loc;
  });
}
