/**
 * Blended-hue bands: collections that cut across the 15 color families.
 *
 * Membership is computed from CIELAB values already stored on `colors`
 * (lab_l, lab_a, lab_b_val), so no schema change is needed. A color is
 * converted to LCh (L = lightness, C = chroma = sqrt(a^2 + b^2),
 * h = atan2(b, a) in degrees, 0-360) and tested against the ranges below.
 *
 * Ranges (hue is [min, max), chroma and lightness are inclusive):
 *
 *   blue-gray   h 222-270   C 3-16    L 20-92   (low-chroma blues; the 222-228 overlap with
 *                                                blue-green goes to blue-green)
 *   blue-green  h 185-228   C >= 9    L 25-92   (teal, aqua, turquoise, peacock)
 *   rust        h 38-58     C 30-65   L 30-56   (orange-brown with enough red; terracotta,
 *                                                burnt orange, copper)
 *
 * Chroma 3 is the floor for blue-gray because below it a color reads as a
 * true neutral. The rust lightness cap keeps salmon and peach tones out.
 * Archived colors are excluded by the query, not here.
 */

export interface Lab {
  l: number;
  a: number;
  b: number;
}

export interface HueBand {
  slug: string;
  name: string;
  /** Lowercase noun phrase used in running text. */
  phrase: string;
  /** Swatch for headers and family-page links. */
  swatch: string;
  hue: [number, number];
  chroma: [number, number];
  lightness: [number, number];
  /** Band slugs that win when a color qualifies for both. */
  yieldsTo?: string[];
  /** Colors named in the intro; must be members of the band. */
  featured: { brand: string; slug: string }[];
}

export const HUE_BANDS: HueBand[] = [
  {
    slug: "blue-gray",
    name: "Blue Gray",
    phrase: "blue gray",
    swatch: "#7E93A3",
    hue: [222, 270],
    chroma: [3, 16],
    lightness: [20, 92],
    yieldsTo: ["blue-green"],
    featured: [
      { brand: "sherwin-williams", slug: "krypton-6247" },
      { brand: "sherwin-williams", slug: "languid-blue-6226" },
      { brand: "sherwin-williams", slug: "smoky-blue-7604" },
      { brand: "sherwin-williams", slug: "gale-force-7605" },
      { brand: "benjamin-moore", slug: "georgian-bay-cc-782" },
      { brand: "benjamin-moore", slug: "hale-navy-hc-154" },
    ],
  },
  {
    slug: "blue-green",
    name: "Blue Green",
    phrase: "blue green",
    swatch: "#2E8B8B",
    hue: [185, 228],
    chroma: [9, 200],
    lightness: [25, 92],
    featured: [
      { brand: "sherwin-williams", slug: "oceanside-6496" },
      { brand: "sherwin-williams", slug: "aquarium-6767" },
      { brand: "benjamin-moore", slug: "aegean-teal-2136-40" },
      { brand: "benjamin-moore", slug: "peacock-blue-2049-40" },
      { brand: "benjamin-moore", slug: "tropical-oasis-csp-710" },
    ],
  },
  {
    slug: "rust",
    name: "Rust",
    phrase: "rust",
    swatch: "#B7522E",
    hue: [38, 58],
    chroma: [30, 65],
    lightness: [30, 56],
    featured: [
      { brand: "benjamin-moore", slug: "rust-2175-30" },
      { brand: "sherwin-williams", slug: "cavern-clay-7701" },
      { brand: "sherwin-williams", slug: "hearty-orange-6622" },
      { brand: "sherwin-williams", slug: "copper-mountain-6356" },
      { brand: "sherwin-williams", slug: "rookwood-terra-cotta-2803" },
    ],
  },
];

export const HUE_BAND_SLUGS = HUE_BANDS.map((b) => b.slug);

export function getHueBand(slug: string): HueBand | undefined {
  return HUE_BANDS.find((b) => b.slug === slug);
}

/** Hue bands worth linking from each color family page. */
export const HUE_BANDS_BY_FAMILY: Record<string, string[]> = {
  blue: ["blue-gray", "blue-green"],
  gray: ["blue-gray"],
  green: ["blue-green"],
  orange: ["rust"],
  red: ["rust"],
  brown: ["rust"],
};

export function toLch({ l, a, b }: Lab) {
  const chroma = Math.sqrt(a * a + b * b);
  const hue = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, chroma, hue };
}

function inRanges(band: HueBand, lab: Lab): boolean {
  const { l, chroma, hue } = toLch(lab);
  return (
    hue >= band.hue[0] && hue < band.hue[1] &&
    chroma >= band.chroma[0] && chroma <= band.chroma[1] &&
    l >= band.lightness[0] && l <= band.lightness[1]
  );
}

export function inHueBand(band: HueBand, lab: Lab): boolean {
  if (!inRanges(band, lab)) return false;
  return !(band.yieldsTo ?? []).some((slug) => {
    const other = getHueBand(slug);
    return other ? inRanges(other, lab) : false;
  });
}

/**
 * Loose a/b rectangle around a band's hue wedge, used to narrow the database
 * read before the exact test above. Chroma is capped at 130 for open bands.
 */
export function labPrefilter(band: HueBand) {
  const maxC = Math.min(band.chroma[1], 130);
  let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
  for (let h = band.hue[0]; h <= band.hue[1]; h += 0.5) {
    for (const c of [band.chroma[0], maxC]) {
      const a = c * Math.cos((h * Math.PI) / 180);
      const b = c * Math.sin((h * Math.PI) / 180);
      aMin = Math.min(aMin, a); aMax = Math.max(aMax, a);
      bMin = Math.min(bMin, b); bMax = Math.max(bMax, b);
    }
  }
  const pad = 0.5;
  return { aMin: aMin - pad, aMax: aMax + pad, bMin: bMin - pad, bMax: bMax + pad, lMin: band.lightness[0], lMax: band.lightness[1] };
}
