import type { ColorWithBrand, CrossBrandMatchWithColor } from "./types";
import { hexToHsl } from "./palettes";
import { closenessLabelLower } from "@/lib/closeness";
import { withArticle } from "./text";

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
// `legacy` keeps the old fixed "a" article ("is a orange paint color") for the
// head-color pages, whose body stays frozen during their push (head-colors.ts).
export function generateColorLede(
  color: ColorWithBrand,
  matches: CrossBrandMatchWithColor[],
  { legacy = false }: { legacy?: boolean } = {},
): string {
  const code = color.color_number ? ` ${color.color_number}` : "";
  const family = color.color_family ? color.color_family.toLowerCase() : "paint";
  const familyPhrase = legacy ? `a ${family}` : withArticle(family);
  let lede = `${color.name}${code} is ${familyPhrase} paint color from ${color.brand.name}.`;

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

const TOP_BRANDS_FOR_COMPARE = ["Sherwin-Williams", "Benjamin Moore", "Behr", "PPG"];

export function generateMetaDescription(color: ColorWithBrand): string {
  const family = color.color_family || getHueName(hexToHsl(color.hex)[0]);
  const lrv = color.lrv != null ? Math.round(Number(color.lrv)) : null;
  const colorNum = color.color_number ? ` (${color.color_number})` : "";
  const lrvPart = lrv != null ? `, LRV ${lrv}` : "";
  const undertonePart = color.undertone ? `, ${color.undertone.toLowerCase()} undertone` : "";

  // Pick 3 well-known brands different from the source for the cross-brand
  // comparison list. With 13 brands total, "and 10 more" is correct whether
  // the source is one of the top 4 or not.
  const compareTo = TOP_BRANDS_FOR_COMPARE.filter((b) => b !== color.brand.name).slice(0, 3);
  const compareList = `${compareTo.join(", ")}, and 10 more`;

  const result = `${color.brand.name} ${color.name}${colorNum} — ${family}${lrvPart}${undertonePart}. Compare matches across ${compareList}.`;

  if (result.length <= 160) return result;
  const trimmed = result.slice(0, 157);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace > 120 ? lastSpace : 157) + "...";
}
