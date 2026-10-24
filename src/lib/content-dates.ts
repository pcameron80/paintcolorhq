// Content dates shared by the sitemap index and its shards, so a shard's
// index lastmod is always computed from the same dates as the URLs inside it.

// Last date the color and match page templates changed visibly on every page
// (2026-10-11: closeness labels #186, retired labels, swatch/LRV corrections).
// A page's lastmod is the later of this and its own data change date. Bump
// these only for a substantive change to every page of that type; a lastmod
// that moves without content changing teaches Google to ignore it.
export const COLOR_TEMPLATE_DATE = "2026-10-11";
export const MATCH_TEMPLATE_DATE = "2026-10-11";

// Last substantive change to the /api docs page (2026-10-11: attribution
// requirement for free API and embed use, #208).
export const API_DOCS_DATE = "2026-10-11";

/** Latest of the given ISO dates or timestamps, as YYYY-MM-DD ("" if none). */
export function latestDate(...dates: (string | null | undefined)[]): string {
  return dates.map((d) => d?.slice(0, 10) ?? "").sort().at(-1) ?? "";
}

export interface SitemapColor {
  brandSlug: string;
  colorSlug: string;
  createdAt?: string | null;
  contentUpdatedAt?: string | null;
}

/** lastmod of one color page. */
export function colorLastmod(c: SitemapColor): string {
  return latestDate(c.createdAt, c.contentUpdatedAt, COLOR_TEMPLATE_DATE);
}

/** lastmod of one individual match page, given the snapshot's per-URL data dates. */
export function matchLastmod(url: string, matchUpdatedAt: Record<string, string>): string {
  return latestDate(matchUpdatedAt[url], MATCH_TEMPLATE_DATE);
}
