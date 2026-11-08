import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";
import { closenessLabelLower, closenessTier } from "@/lib/closeness";
import { codeSuffix, displayColorNumber, withArticle } from "./text";
import { displayUndertone } from "./undertone-display";
import { UNVERIFIED_BUY_BRANDS } from "./popular-colors";

// Data-derived color-page text only. The templated prose generators that used
// to live here (generateColorDescription, generateEditorialVerdict and their
// per-family pairing/lighting/"skip it if" sentence banks) were removed
// 2026-10-24: none was rendered, and templated prose repeated across 25k pages
// is what the house rule forbids. Do not reintroduce them.

// ---------- Hue name helper ----------

function getHueName(hue: number): string {
  if (hue < 15) return "red";
  if (hue < 40) return "orange";
  if (hue < 70) return "yellow";
  if (hue < 150) return "green";
  if (hue < 200) return "teal";
  if (hue < 260) return "blue";
  if (hue < 290) return "purple";
  if (hue < 330) return "magenta";
  return "red";
}

// Plain-language closeness from Delta E 2000 — NEVER expose the raw number
// (project rule). Same thresholds as the page's match cards.
function closenessPhrase(deltaE: number): string {
  return closenessLabelLower(deltaE);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Data-derived lede rendered below the hero. Composed entirely from the color's
// own values + its single nearest cross-brand match, so it varies per color on
// hex, LRV, undertone, family AND nearest-match identity — unlike the templated
// family-verdict prose it replaces (two same-family colors shared ~70% of that).
// No hand-writing, no LLM: pure data composition.
//
// `legacy` keeps the pre-MP-40 text for the head-color pages, whose body stays
// frozen during their push (head-colors.ts): the fixed "a" article ("is a
// orange paint color"), the raw undertone label, and the "N more equivalents"
// count.
export function generateColorLede(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[],
  { legacy = false }: { legacy?: boolean } = {},
): string {
  if (legacy) return generateLegacyLede(color, matches);
  const code = codeSuffix(color.name, color.color_number ? displayColorNumber(color.brand.slug, color.color_number) : null);
  const family = color.color_family ? color.color_family.toLowerCase() : "paint";
  let lede = `${color.name}${code} is ${withArticle(family)} paint color from ${color.brand.name}.`;

  const specs: string[] = [`a hex value of ${color.hex.toUpperCase()}`];
  if (color.lrv != null) specs.push(`estimated LRV ${Math.round(Number(color.lrv))}`);
  const undertone = displayUndertone(color);
  if (undertone) specs.push(`a ${undertone.toLowerCase()} undertone`);
  lede += ` It has ${joinList(specs)}.`;

  // Name the nearest match a reader can act on: skip brands whose retail
  // availability is unverified, unless nothing else matches.
  const named = matches.filter((m) => !UNVERIFIED_BUY_BRANDS.has(m.match_color.brand.slug));
  const pool = named.length > 0 ? named : matches;
  if (pool.length > 0) {
    const nearest = pool.reduce((a, b) =>
      Number(b.delta_e_score) < Number(a.delta_e_score) ? b : a,
    );
    const nearestScore = Number(nearest.delta_e_score);
    lede += ` Its closest cross-brand match is ${nearest.match_color.name} from ${nearest.match_color.brand.name} (${closenessPhrase(nearestScore)})`;
    // Distinct other brands with something better than a visible difference.
    // This counts brands, not rows: the page carries up to 49 rows per color,
    // and most of those were never close.
    const similarBrands = nearestMatchesPerBrand(matches).filter(
      (m) => closenessTier(Number(m.delta_e_score)) !== "visible-difference",
    ).length;
    if (similarBrands > 0) {
      lede += `, with very similar options from ${similarBrands} other brand${similarBrands === 1 ? "" : "s"}.`;
    } else if (closenessTier(nearestScore) === "visible-difference") {
      lede += `. No brand in our data has a very similar match, so compare a physical sample before buying.`;
    } else {
      lede += `.`;
    }
  }
  return lede;
}

function generateLegacyLede(color: ColorWithBrand, matches: CrossBrandMatchWithColor[]): string {
  const code = color.color_number ? ` ${color.color_number}` : "";
  const family = color.color_family ? color.color_family.toLowerCase() : "paint";
  let lede = `${color.name}${code} is a ${family} paint color from ${color.brand.name}.`;

  const specs: string[] = [`a hex value of ${color.hex.toUpperCase()}`];
  if (color.lrv != null) specs.push(`estimated LRV ${Math.round(Number(color.lrv))}`);
  if (color.undertone) specs.push(`a ${color.undertone.toLowerCase()} undertone`);
  lede += ` It has ${joinList(specs)}.`;

  if (matches.length > 0) {
    const nearest = matches.reduce((a, b) =>
      Number(b.delta_e_score) < Number(a.delta_e_score) ? b : a,
    );
    lede += ` Its closest cross-brand match is ${nearest.match_color.name} from ${nearest.match_color.brand.name} (${closenessPhrase(Number(nearest.delta_e_score))})`;
    const more = matches.length - 1;
    if (more > 0) lede += `, with ${more} more equivalent${more === 1 ? "" : "s"} across other brands`;
    lede += `.`;
  }
  return lede;
}

// One nearest match per target brand, sorted best-first. Powers the
// "[Color] in Every Brand" equivalence matrix (replaces the page's inline
// flatMap/slice(0,8), surfacing every brand instead of a capped 8).
export function nearestMatchesPerBrand(
  matches: CrossBrandMatchWithColor[],
): CrossBrandMatchWithColor[] {
  const best = new Map<string, CrossBrandMatchWithColor>();
  for (const m of matches) {
    const key = m.match_color.brand.slug;
    const cur = best.get(key);
    if (!cur || Number(m.delta_e_score) < Number(cur.delta_e_score)) best.set(key, m);
  }
  return [...best.values()].sort(
    (a, b) => Number(a.delta_e_score) - Number(b.delta_e_score),
  );
}

const TOP_BRANDS_FOR_COMPARE: Array<{ name: string; slug: string }> = [
  { name: "Sherwin-Williams", slug: "sherwin-williams" },
  { name: "Benjamin Moore", slug: "benjamin-moore" },
  { name: "Behr", slug: "behr" },
  { name: "PPG", slug: "ppg" },
];

function generateLegacyMetaDescription(color: ColorWithBrand): string {
  const family = color.color_family || getHueName(hexToHsl(color.hex)[0]);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
  const undertonePart = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";
  const compareTo = TOP_BRANDS_FOR_COMPARE.filter((b) => b.name !== color.brand.name).slice(0, 3).map((b) => b.name);
  const compareList = `${compareTo.join(", ")}, and 10 more`;

  const result = `${color.brand.name} ${color.name}${colorNum} — ${family}${lrvPart}${undertonePart}. Compare matches across ${compareList}.`;

  if (result.length <= 160) return result;
  const trimmed = result.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace > 120 ? lastSpace : 157) + "...";
}

/** Meta description for a color page. `perBrand` is nearestMatchesPerBrand()
 *  for the color: it decides which brands are named and how many "more" there
 *  are. The caller applies capMeta() after adding the variant and former-name
 *  suffixes. `legacy` is the head-color text from before MP-40. */
export function generateMetaDescription(
  color: ColorWithBrand,
  perBrand: CrossBrandMatchWithColor[] = [],
  { legacy = false }: { legacy?: boolean } = {},
): string {
  if (legacy) return generateLegacyMetaDescription(color);
  const family = color.color_family || getHueName(hexToHsl(color.hex)[0]);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const code = color.color_number ? displayColorNumber(color.brand.slug, color.color_number) : "";
  const colorNum = codeSuffix(color.name, code) ? ` (${code})` : "";
  const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
  const undertone = displayUndertone(color);
  const undertonePart = undertone ? `, ${undertone.toLowerCase()} undertone` : "";

  // Name up to 3 well-known brands this color has a match in, then count the
  // rest. "and N more" is the distinct other brands with a match minus the
  // ones named, so it is never larger than the list behind it.
  const available = new Set(perBrand.map((m) => m.match_color.brand.slug));
  const named = TOP_BRANDS_FOR_COMPARE
    .filter((b) => b.slug !== color.brand.slug && available.has(b.slug) && !UNVERIFIED_BUY_BRANDS.has(b.slug))
    .slice(0, 3)
    .map((b) => b.name);
  const more = [...available].filter((slug) => slug !== color.brand.slug).length - named.length;
  let compare = "Compare similar colors from other paint brands.";
  if (named.length > 0) {
    const list = more > 0
      ? `${named.join(", ")}, and ${more} more`
      : named.length === 1 ? named[0] : `${named.slice(0, -1).join(", ")}, and ${named[named.length - 1]}`;
    compare = `Compare matches across ${list}.`;
  }
  return `${color.brand.name} ${color.name}${colorNum}: ${family}${lrvPart}${undertonePart}. ${compare}`;
}
