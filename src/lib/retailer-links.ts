import {
  VALSPAR_OVERRIDES, VALSPAR_NOT_FOUND,
  PPG_OVERRIDES, PPG_NOT_FOUND,
  SHERWIN_WILLIAMS_OVERRIDES, SHERWIN_WILLIAMS_NOT_FOUND,
} from "./retailer-overrides";

export interface RetailerLink {
  retailerName: string;
  url: string;
}

interface ColorInfo {
  brandName: string;
  colorName: string;
  colorNumber?: string;
  colorFamily?: string;
}

type RetailerConfig = {
  name: string;
  url: (info: ColorInfo) => string;
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Map our color families to PPG's plural URL segments (default guesses)
const PPG_FAMILY_MAP: Record<string, string> = {
  red: "reds", orange: "oranges", yellow: "yellows", green: "greens",
  blue: "blues", purple: "purples", pink: "pinks", brown: "browns",
  gray: "grays", beige: "beiges", neutral: "neutrals",
  white: "whites", "off-white": "whites", black: "blacks",
};

// Map our color families to Valspar's website categories (default guesses)
const VALSPAR_FAMILY_MAP: Record<string, string> = {
  red: "red", orange: "orange", yellow: "yellow", green: "green",
  blue: "blue", purple: "purple", pink: "pink",
  beige: "brown", brown: "brown", gray: "gray", neutral: "neutral",
  white: "white", "off-white": "white", black: "black",
};

// Map our color families to SW's 8 website categories (default guesses)
const SW_FAMILY_MAP: Record<string, string> = {
  red: "red", orange: "orange", yellow: "yellow", green: "green",
  blue: "blue", purple: "purple", pink: "red",
  beige: "yellow", brown: "orange", gray: "neutral", neutral: "neutral",
  white: "white-and-pastel", "off-white": "white-and-pastel", black: "neutral",
};

const BRAND_LINKS: Record<string, RetailerConfig[]> = {
  behr: [
    { name: "Behr", url: (i) =>
      `https://www.behr.com/consumer/ColorDetailView/${i.colorNumber ?? ""}` },
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`Behr ${i.colorName} paint`)}` },
  ],
  ppg: [
    { name: "PPG Paints", url: (i) => {
      const num = i.colorNumber ?? "";
      if (PPG_NOT_FOUND.has(num)) return "";
      const family = PPG_OVERRIDES[num] ?? PPG_FAMILY_MAP[i.colorFamily ?? "neutral"] ?? "neutrals";
      return `https://www.ppgpaints.com/color/color-families/${family}/${slugify(i.colorName)}`;
    }},
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`PPG ${i.colorName} paint`)}` },
  ],
  glidden: [
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`Glidden ${i.colorName} paint`)}` },
  ],
  valspar: [
    { name: "Valspar", url: (i) => {
      const num = i.colorNumber ?? "";
      if (VALSPAR_NOT_FOUND.has(num)) return "";
      const family = VALSPAR_OVERRIDES[num] ?? VALSPAR_FAMILY_MAP[i.colorFamily ?? "neutral"] ?? "neutral";
      const slug = `${slugify(i.colorName)}-${num.toLowerCase()}`;
      return `https://www.valspar.com/en/colors/browse-colors/lowes/${family}/${slug}`;
    }},
    { name: "Lowe's", url: (i) =>
      `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`Valspar ${i.colorName} paint`)}` },
  ],
  "sherwin-williams": [
    { name: "Sherwin-Williams", url: (i) => {
      const num = i.colorNumber ?? "";
      if (SHERWIN_WILLIAMS_NOT_FOUND.has(num)) return "";
      const family = SHERWIN_WILLIAMS_OVERRIDES[num] ?? SW_FAMILY_MAP[i.colorFamily ?? "neutral"] ?? "neutral";
      const slug = slugify(i.colorName);
      return `https://www.sherwin-williams.com/en-us/color/color-family/${family}-paint-colors/SW${num}-${slug}`;
    }},
  ],
  "benjamin-moore": [
    { name: "Benjamin Moore", url: (i) => {
      const num = (i.colorNumber ?? "").toLowerCase();
      const slug = slugify(i.colorName);
      return `https://www.benjaminmoore.com/en-us/paint-colors/color/${num}/${slug}`;
    }},
  ],
  "farrow-ball": [
    { name: "Farrow & Ball", url: () => "https://www.farrow-ball.com" },
  ],
  "dunn-edwards": [
    { name: "Dunn-Edwards", url: () => "https://www.dunnedwards.com/colors" },
  ],
};

export function getRetailerLinks(
  brandSlug: string,
  brandName: string,
  colorName: string,
  colorNumber?: string,
  colorFamily?: string
): RetailerLink[] {
  const configs = BRAND_LINKS[brandSlug];
  if (!configs) return [];

  const info: ColorInfo = { brandName, colorName, colorNumber, colorFamily };
  return configs
    .map((c) => ({
      retailerName: c.name,
      url: c.url(info),
    }))
    .filter((link) => link.url !== "");
}
