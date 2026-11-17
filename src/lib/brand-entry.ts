// Entry points at the top of a brand page: opening line, most-viewed colors,
// Colors of the Year, family tiles. Pure functions so they can be tested
// without the database; the page does the fetching.
//
// Content rules (CLAUDE.md): every figure comes from our own data, nothing is
// described as best-selling or popular nationally, and the opening line is a
// fixed frame filled with that brand's numbers, not generated prose.

import mostViewedData from "@/generated/brand-most-viewed.json";
import { COLOR_OF_THE_YEAR, type ColorOfTheYearPick } from "./color-of-the-year";
import { isColorIndexable } from "./indexing";

export const MOST_VIEWED_MIN = 12;
export const MOST_VIEWED_MAX = 24;

/** "3.3", "90", "100": LRV with at most one decimal and no trailing zero. */
export function formatLrv(value: number | string): string {
  return String(Math.round(Number(value) * 10) / 10);
}

export interface FamilyCount { name: string; count: number }

/** Families with at least one color, largest first (ties by name). */
export function rankFamilies(counts: Record<string, number>): FamilyCount[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** "whites", "off-whites", "grays": every family name pluralizes with an s. */
export const familyPlural = (name: string) => `${name}s`;

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Two sentences built only from figures in our data: color count, LRV range,
 * and the three largest families. Returns "" when there is nothing to say.
 */
export function brandLede(input: {
  brandName: string;
  total: number;
  lrv: { min: number; max: number } | null;
  families: FamilyCount[];
}): string {
  const { brandName, total, lrv, families } = input;
  if (total <= 0) return "";
  const first = lrv
    ? `We catalog ${total.toLocaleString("en-US")} ${brandName} colors, with LRV running from ${formatLrv(lrv.min)} to ${formatLrv(lrv.max)}.`
    : `We catalog ${total.toLocaleString("en-US")} ${brandName} colors.`;
  const top = families.slice(0, 3);
  if (top.length === 0) return first;
  const list = joinList(top.map((f) => `${familyPlural(f.name)} (${f.count.toLocaleString("en-US")})`));
  return `${first} The largest families are ${list}.`;
}

interface MostViewedFile {
  windowStart: string;
  windowEnd: string;
  brands: Record<string, { slug: string; views: number }[]>;
}
const mostViewed = mostViewedData as MostViewedFile;

/** Candidate slugs for a brand, best first. Empty when the brand has too little traffic for a section. */
export function mostViewedCandidates(brandSlug: string): string[] {
  return (mostViewed.brands[brandSlug] ?? []).map((r) => r.slug);
}

/** "Oct 20 to Nov 15, 2026" (UTC days from the generated file). */
export function mostViewedWindowLabel(file: Pick<MostViewedFile, "windowStart" | "windowEnd"> = mostViewed): string {
  const fmt = (iso: string, year: boolean) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
  const sameYear = file.windowStart.slice(0, 4) === file.windowEnd.slice(0, 4);
  return `${fmt(file.windowStart, !sameYear)} to ${fmt(file.windowEnd, true)}`;
}

interface ResolvedColor {
  slug: string;
  name: string;
  color_number: string | null;
  lrv: number | string | null;
  undertone: string | null;
  color_family: string | null;
}

/**
 * Keep candidates in rank order, drop any that no longer resolve or whose page
 * is noindex (variants, code-only names), cap at MOST_VIEWED_MAX. Fewer than
 * MOST_VIEWED_MIN survivors means no section rather than a short list.
 */
export function pickMostViewed<T extends ResolvedColor>(candidates: string[], resolved: T[]): T[] {
  const bySlug = new Map(resolved.map((c) => [c.slug, c]));
  const kept: T[] = [];
  for (const slug of candidates) {
    const c = bySlug.get(slug);
    if (c && isColorIndexable(c)) kept.push(c);
    if (kept.length === MOST_VIEWED_MAX) break;
  }
  return kept.length >= MOST_VIEWED_MIN ? kept : [];
}

/** A brand's 2027 and 2026 Colors of the Year, newest first. */
export function brandCotyPicks(brandSlug: string): { year: number; pick: ColorOfTheYearPick }[] {
  return COLOR_OF_THE_YEAR.flatMap((cycle) =>
    cycle.picks.filter((p) => p.brandSlug === brandSlug).map((pick) => ({ year: cycle.year, pick })),
  );
}
