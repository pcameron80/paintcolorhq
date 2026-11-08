import sitemapSnapshot from "@/generated/sitemap.json";
import { MAJOR_MATCH_BRANDS } from "./popular-colors";

// The individual /match/[brand]/[color]-to-[target] pages the sitemap lists,
// from the snapshot scripts/build-sitemap-data.ts writes before every dev and
// build (CI uses ci/sitemap.fixture.json). Pages that link match pairs read
// this set so they only link indexable pairs.
// Added 2026-11-08: a URL Inspection sample found 27 of 41 sitemap match
// pages never crawled, and no color or brand page linked any of them.

export interface MatchPair {
  path: string;
  sourceBrand: string;
  colorSlug: string;
  targetBrand: string;
}

function parse(path: string): MatchPair | null {
  const m = path.match(/^\/match\/([^/]+)\/(.+)$/);
  if (!m) return null;
  // Brand slugs contain hyphens, so split on a known target suffix.
  const target = MAJOR_MATCH_BRANDS.find((t) => m[2].endsWith(`-to-${t}`));
  if (!target) return null;
  return { path, sourceBrand: m[1], colorSlug: m[2].slice(0, -`-to-${target}`.length), targetBrand: target };
}

const PAIRS: MatchPair[] = (sitemapSnapshot.matches as string[]).map(parse).filter((p): p is MatchPair => p !== null);

const byColor = new Map<string, MatchPair[]>();
for (const p of PAIRS) {
  const key = `${p.sourceBrand}/${p.colorSlug}`;
  if (!byColor.has(key)) byColor.set(key, []);
  byColor.get(key)!.push(p);
}
// Targets in MAJOR_MATCH_BRANDS order, so every list reads the same way.
const rank = (slug: string) => (MAJOR_MATCH_BRANDS as readonly string[]).indexOf(slug);
for (const list of byColor.values()) list.sort((a, b) => rank(a.targetBrand) - rank(b.targetBrand));

/** Sitemap match pages whose source is this color. */
export function matchPairsForColor(brandSlug: string, colorSlug: string): MatchPair[] {
  return byColor.get(`${brandSlug}/${colorSlug}`) ?? [];
}

/** Sitemap match pages whose source color belongs to this brand, grouped by color. */
export function matchPairsForBrand(brandSlug: string): Map<string, MatchPair[]> {
  const out = new Map<string, MatchPair[]>();
  for (const [key, list] of byColor) {
    if (key.startsWith(`${brandSlug}/`)) out.set(list[0].colorSlug, list);
  }
  return out;
}

const PAIR_PATHS = new Set(PAIRS.map((p) => p.path));

/** True when the sitemap lists this match page. */
export function isSitemapMatchPair(path: string): boolean {
  return PAIR_PATHS.has(path);
}
