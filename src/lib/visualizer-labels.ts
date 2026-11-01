import { presetForHex } from "@/lib/visualizer-presets";

/** The fields of a /api/color-match result the band label needs. */
export interface NamedMatch {
  name: string;
  hex: string;
  brandName: string;
}

// Lower index wins when several catalog brands sell the same hex; brands not
// listed rank after these, then ties break by name so the pick never varies.
const BRAND_ORDER = ["Sherwin-Williams", "Benjamin Moore", "Behr"];

function brandRank(brandName: string): number {
  const i = BRAND_ORDER.indexOf(brandName);
  return i === -1 ? BRAND_ORDER.length : i;
}

const normalize = (hex: string) => hex.replace("#", "").toUpperCase();

/**
 * Credit-band label for a painted surface: "Name (Brand)" when the hex is a
 * built-in preset or exactly equals a catalog color in `matches`, else the hex.
 * Never names a nearest match, since the closest paint is a different paint.
 * A shared hex is still that paint's color, so the preset wins, then the fixed
 * brand order above (the brands most visitors compare), then name.
 */
export function paintLabel(hex: string, matches: NamedMatch[] = []): string {
  const preset = presetForHex(hex.startsWith("#") ? hex : `#${hex}`);
  if (preset) return `${preset.name} (${preset.brand})`;
  const target = normalize(hex);
  const exact = matches
    .filter((m) => normalize(m.hex) === target)
    .sort((a, b) => brandRank(a.brandName) - brandRank(b.brandName) || a.name.localeCompare(b.name));
  return exact.length > 0 ? `${exact[0].name} (${exact[0].brandName})` : `#${target}`;
}
