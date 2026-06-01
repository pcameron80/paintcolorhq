/** Pure helpers for blog link verification. No I/O — unit-tested with fixtures. */

export type LinkKind = "color" | "family" | "match" | "blog" | "brand" | "compare" | "tool" | "other";

export interface InternalLink {
  href: string;
  kind: LinkKind;
}

export interface ColorRef {
  brandSlug: string;
  colorSlug: string;
}

function classify(href: string): LinkKind {
  if (href.startsWith("/colors/family/")) return "family";
  if (href.startsWith("/colors/")) return "color";
  if (href.startsWith("/match/")) return "match";
  if (href.startsWith("/blog/")) return "blog";
  if (href.startsWith("/brands/")) return "brand";
  if (href === "/compare") return "compare";
  if (href.startsWith("/tools/")) return "tool";
  return "other";
}

/** Extract internal links (href starts with "/") from JSX or markdown text.
 *  Matches href="/..." (and single quotes) and markdown ](/...). Dedupes by href. */
export function extractInternalLinks(text: string): InternalLink[] {
  const hrefs = new Set<string>();
  const attr = /href=["'](\/[^"'\s>]*)["']/g;
  const md = /\]\((\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = attr.exec(text))) hrefs.add(m[1]);
  while ((m = md.exec(text))) hrefs.add(m[1]);
  return [...hrefs].map((href) => ({ href, kind: classify(href) }));
}

/** "/colors/benjamin-moore/hale-navy-hc-154" → {brandSlug, colorSlug}.
 *  Returns null for family hubs and any non-color-detail href. */
export function parseColorHref(href: string): ColorRef | null {
  const m = href.match(/^\/colors\/([^/]+)\/([^/]+)\/?$/);
  if (!m || m[1] === "family") return null;
  return { brandSlug: m[1], colorSlug: m[2] };
}

/** Brand slugs referenced by a /match route, for existence checking.
 *  "/match/a/to/b" → [a, b]; "/match/a/<matchSlug>" → [a]. */
export function parseMatchBrands(href: string): string[] {
  const parts = href.split("/").filter(Boolean);
  if (parts[0] !== "match" || !parts[1]) return [];
  const brands = [parts[1]];
  if (parts[2] === "to" && parts[3]) brands.push(parts[3]);
  return brands;
}
