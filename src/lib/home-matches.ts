// Real cross-brand matches shown on the home page (hero and "How a match works").
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
    { name: "Sea Salt", brand: "Sherwin-Williams", code: "SW 6204", hex: "#CDD2CA", href: "/colors/sherwin-williams/sea-salt-6204" },
    [
      { name: "Gray Cashmere", brand: "Benjamin Moore", code: "2138-60", hex: "#D0D6CE", href: "/colors/benjamin-moore/gray-cashmere-2138-60" },
      { name: "Silver Setting", brand: "Behr", code: "PWL-89", hex: "#CACEC7", href: "/colors/behr/silver-setting-pwl-89" },
      { name: "Bay Of Fundy", brand: "PPG", code: "10-07", hex: "#CDD2C9", href: "/colors/ppg/bay-of-fundy-10-07" },
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
    { name: "Accessible Beige", brand: "Sherwin-Williams", code: "SW 7036", hex: "#D1C7B8", href: "/colors/sherwin-williams/accessible-beige-7036" },
    [
      { name: "Shoreline Haze", brand: "Behr", code: "MQ6-31", hex: "#D0C7B8", href: "/colors/behr/shoreline-haze-mq6-31" },
      { name: "Smokey Taupe", brand: "Benjamin Moore", code: "983", hex: "#CEC5B6", href: "/colors/benjamin-moore/smokey-taupe-983" },
      { name: "Synchronicity", brand: "PPG", code: "1021-2", hex: "#CFC5B6", href: "/colors/ppg/synchronicity-1021-2" },
    ],
  ),
];
