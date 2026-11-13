import { presetForHex } from "@/lib/visualizer-presets";

/** The fields of a /api/color-match result the band label needs. */
export interface NamedMatch {
  name: string;
  hex: string;
  brandName: string;
}

const normalize = (hex: string) => hex.replace("#", "").toUpperCase();

/**
 * Credit-band label for a painted surface: "Name (Brand)" when the hex is a
 * built-in preset or exactly one catalog color in `matches`, else the hex.
 * Never names a nearest match, since the closest paint is a different paint.
 * A hex several catalog colors share (about 1,300 of them, most across brands)
 * also stays a hex: the visitor may have picked any of them, and naming the
 * wrong brand would put a false credit on an image people publish.
 */
export function paintLabel(hex: string, matches: NamedMatch[] = []): string {
  const preset = presetForHex(hex.startsWith("#") ? hex : `#${hex}`);
  if (preset) return `${preset.name} (${preset.brand})`;
  const target = normalize(hex);
  const exact = matches.filter((m) => normalize(m.hex) === target);
  return exact.length === 1 ? `${exact[0].name} (${exact[0].brandName})` : `#${target}`;
}
