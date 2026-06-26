import {
  VALSPAR_OVERRIDES, VALSPAR_NOT_FOUND,
  PPG_OVERRIDES, PPG_NOT_FOUND,
  SHERWIN_WILLIAMS_OVERRIDES, SHERWIN_WILLIAMS_NOT_FOUND,
  DUNN_EDWARDS_NOT_FOUND,
  KILZ_NOT_FOUND,
  RAL_NOT_FOUND,
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
    { name: "Dunn-Edwards", url: (i) => {
      const num = i.colorNumber ?? "";
      if (!num || DUNN_EDWARDS_NOT_FOUND.has(num)) return "";
      return `https://www.dunnedwards.com/colors/browser/${num.toLowerCase()}/`;
    }},
  ],
  kilz: [
    { name: "Kilz", url: (i) => {
      const num = i.colorNumber ?? "";
      if (!num || KILZ_NOT_FOUND.has(num)) return "";
      const slug = slugify(i.colorName);
      return `https://www.kilz.com/color/${slug}-${num}`;
    }},
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`Kilz ${i.colorName} paint`)}` },
  ],
  colorhouse: [
    { name: "Colorhouse", url: (i) => {
      // "Stone .07" -> "stone-07"
      const slug = i.colorName.toLowerCase().replace(/\s*\./g, "-").replace(/\s+/g, "-");
      return `https://www.colorhousepaint.store/colors/${slug}/`;
    }},
  ],
  "dutch-boy": [
    { name: "Dutch Boy", url: () => "https://www.dutchboy.com/en/colors/color-library/paint" },
    { name: "Menards", url: (i) =>
      `https://www.menards.com/main/search.html?search=${encodeURIComponent(`Dutch Boy ${i.colorName} paint`)}` },
  ],
  "vista-paint": [
    { name: "Vista Paint", url: () => "https://www.vistapaint.com/colors/" },
  ],
  hirshfields: [
    { name: "Hirshfield's", url: () => "https://www.hirshfields.com/color/" },
  ],
  ral: [
    { name: "RAL Color Chart", url: (i) => {
      const num = i.colorNumber ?? "";
      if (!num || RAL_NOT_FOUND.has(num)) return "";
      const slug = slugify(i.colorName);
      return `https://www.ralcolorchart.com/ral-classic/ral-${num}-${slug}`;
    }},
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
  const links = configs
    .map((c) => ({
      retailerName: c.name,
      url: c.url(info),
    }))
    .filter((link) => link.url !== "");

  // Rank the monetizable big-box marketplaces (Home Depot / Lowe's) ahead of the
  // manufacturer's own $0 .com so the hero "Get this color" button monetizes the
  // dominant buy-intent click. Keep the brand's own page as a DEMOTED secondary
  // option — some buyers want the official manufacturer page — so we sort, not
  // drop. Brands sold only at their own stores (SW, BM, Dunn-Edwards, Farrow &
  // Ball, etc.) have no marketplace, so their .com simply stays first; Amazon is
  // their monetizable fallback (added separately in getSampleLinks). Sort by
  // "is a monetizable retailer," not by the affiliate flag (the flag is false
  // until the Vercel env prefixes are set, but the hero should already point at
  // the big-box retailer so it earns the day the IDs go in). Stable: preserves
  // each group's original order.
  const MONETIZABLE_RETAILERS = new Set(["Home Depot", "Lowe's"]);
  return links
    .map((link, i) => ({ link, i }))
    .sort(
      (a, b) =>
        (MONETIZABLE_RETAILERS.has(b.link.retailerName) ? 1 : 0) -
          (MONETIZABLE_RETAILERS.has(a.link.retailerName) ? 1 : 0) || a.i - b.i,
    )
    .map((x) => x.link);
}
