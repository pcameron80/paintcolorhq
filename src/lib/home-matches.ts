// Real cross-brand matches shown on the home page (hero and "How a match works"). None of these colors is on the head-colors list (src/lib/head-colors.ts), which is frozen in a search test.
// Source: the live match lists on each color page, read 2026-11-18. Names, brands,
// hex values and URLs are the site's own data. The closeness wording is computed
// here with the same CIEDE2000 function and closenessLabel() the color pages use,
// never typed by hand, so it cannot drift from the labels shown on those pages.
import { closenessLabel, type ClosenessLabel } from "@/lib/closeness";
import { deltaE2000, hexToRgb, rgbToLab } from "@/lib/color-utils";

export interface HomeColor {
  name: string;
  brand: string;
  code: string;
  hex: string;
  href: string;
}

export interface HomeMatch extends HomeColor {
  label: ClosenessLabel;
}

export interface HomeMatchSet {
  source: HomeColor;
  matches: HomeMatch[];
}

function lab(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

function build(source: HomeColor, matches: HomeColor[]): HomeMatchSet {
  return {
    source,
    matches: matches.map((m) => ({ ...m, label: closenessLabel(deltaE2000(lab(source.hex), lab(m.hex))) })),
  };
}

export const HOME_MATCH_SETS: HomeMatchSet[] = [
  build(
    { name: "Rainwashed", brand: "Sherwin-Williams", code: "SW 6211", hex: "#C2CDC5", href: "/colors/sherwin-williams/rainwashed-6211" },
    [
      { name: "Silver Marlin", brand: "Benjamin Moore", code: "2139-50", hex: "#C1C9C2", href: "/colors/benjamin-moore/silver-marlin-2139-50" },
      { name: "Mountain Falls", brand: "Behr", code: "N420-2", hex: "#BDCAC0", href: "/colors/behr/mountain-falls-n420-2" },
      { name: "White Clover", brand: "PPG", code: "10-31", hex: "#C4D1C6", href: "/colors/ppg/white-clover-10-31" },
    ],
  ),
  build(
    { name: "Hale Navy", brand: "Benjamin Moore", code: "HC-154", hex: "#444C57", href: "/colors/benjamin-moore/hale-navy-hc-154" },
    [
      { name: "Sea Mariner", brand: "Sherwin-Williams", code: "SW 9640", hex: "#434A54", href: "/colors/sherwin-williams/sea-mariner-9640" },
      { name: "Dark Night", brand: "Behr", code: "PPF-58", hex: "#404B57", href: "/colors/behr/dark-night-ppf-58" },
      { name: "Cavalry", brand: "PPG", code: "1041-7", hex: "#3F4C5A", href: "/colors/ppg/cavalry-1041-7" },
    ],
  ),
  build(
    { name: "Revere Pewter", brand: "Benjamin Moore", code: "HC-172", hex: "#CCC7B9", href: "/colors/benjamin-moore/revere-pewter-hc-172" },
    [
      { name: "Simple Stone", brand: "Sherwin-Williams", code: "SW 9521", hex: "#CDC7B7", href: "/colors/sherwin-williams/simple-stone-9521" },
      { name: "Coliseum Marble", brand: "Behr", code: "PPU8-16", hex: "#CEC7B8", href: "/colors/behr/coliseum-marble-ppu8-16" },
      { name: "Ostrich Feather", brand: "PPG", code: "14-32", hex: "#CEC7B8", href: "/colors/ppg/ostrich-feather-14-32" },
    ],
  ),
];
