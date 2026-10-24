import {
  SHERWIN_WILLIAMS_OVERRIDES, SHERWIN_WILLIAMS_NOT_FOUND,
  DUNN_EDWARDS_NOT_FOUND,
  KILZ_NOT_FOUND,
  RAL_NOT_FOUND,
} from "./retailer-overrides";
// Per-color official pages, built from each brand's own sitemap by
// scripts/generate-official-color-urls.ts and keyed by our color_number.
import PPG_URLS from "./official-urls/ppg.json";
import VALSPAR_URLS from "./official-urls/valspar.json";
import DUTCH_BOY_URLS from "./official-urls/dutch-boy.json";
import VISTA_URLS from "./official-urls/vista-paint.json";

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

/**
 * Brand-site slug for a color name: accents folded ("Crème" -> "creme") and
 * apostrophes dropped rather than hyphenated ("Elephant's Breath" ->
 * "elephants-breath"). Used for Farrow & Ball URLs and by the sitemap generator.
 */
export function nameSlug(name: string): string {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Looks a color up in a generated official-URL map; "" when it has no page. */
function fromMap(map: Record<string, string>, base: string, colorNumber?: string): string {
  const path = colorNumber ? map[colorNumber] : undefined;
  return path ? `${base}${path}` : "";
}

// Map our color families to SW's website categories. SW serves a color under
// any of its live family segments, so this only has to name a live one. SW
// retired "white-and-pastel" for "white" (SW7008 Alabaster 404s under the old
// segment, verified 2026-10-24), which broke every white and off-white link.
const SW_FAMILY_MAP: Record<string, string> = {
  red: "red", orange: "orange", yellow: "yellow", green: "green",
  blue: "blue", purple: "purple", pink: "red",
  beige: "yellow", brown: "orange", gray: "neutral", neutral: "neutral",
  white: "white", "off-white": "white", black: "neutral",
};

const BRAND_LINKS: Record<string, RetailerConfig[]> = {
  behr: [
    { name: "Behr", url: (i) =>
      `https://www.behr.com/consumer/ColorDetailView/${i.colorNumber ?? ""}` },
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`Behr ${i.colorName} paint`)}` },
  ],
  ppg: [
    // Every ppgpaints.com color URL now lands on a "PPG Paints is now Pittsburgh
    // Paints" interstitial; the color pages moved to pittsburghpaints.com.
    { name: "PPG Paints", url: (i) =>
      fromMap(PPG_URLS, "https://www.pittsburghpaints.com/ppg-colors/", i.colorNumber) },
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`PPG ${i.colorName} paint`)}` },
  ],
  glidden: [
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`Glidden ${i.colorName} paint`)}` },
  ],
  valspar: [
    { name: "Valspar", url: (i) =>
      fromMap(VALSPAR_URLS, "https://www.valspar.com/en/colors/browse-colors/", i.colorNumber) },
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
    // BM is sold through Ace Hardware (a monetizable affiliate channel), so the
    // color page promotes "Buy at Ace Hardware" and demotes the BM .com page to
    // the "View official color" reference link — same pattern as Behr→Home Depot
    // and Valspar→Lowe's. Earns once NEXT_PUBLIC_ACE_AFFILIATE_PREFIX is set.
    { name: "Ace Hardware", url: (i) =>
      `https://www.acehardware.com/search?query=${encodeURIComponent(`Benjamin Moore ${i.colorName} paint`)}` },
  ],
  "farrow-ball": [
    // Every color has its own page on the US store (all 167 checked against
    // its sitemap 2026-10-24), e.g. /us/paint/elephants-breath.
    { name: "Farrow & Ball", url: (i) =>
      `https://www.farrow-ball.com/us/paint/${nameSlug(i.colorName)}` },
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
  // No colorhouse entry: colorhousepaint.store 301s every color to an
  // unrelated gambling site (verified 2026-10-23). With no link here the
  // Colorhouse color pages fall back to the Amazon samples CTA.
  "dutch-boy": [
    { name: "Dutch Boy", url: (i) =>
      fromMap(DUTCH_BOY_URLS, "https://www.dutchboy.com/en/colors/color-library/paint/", i.colorNumber) },
    { name: "Menards", url: (i) =>
      `https://www.menards.com/main/search.html?search=${encodeURIComponent(`Dutch Boy ${i.colorName} paint`)}` },
  ],
  "vista-paint": [
    { name: "Vista Paint", url: (i) =>
      fromMap(VISTA_URLS, "https://www.vistapaint.com/colors/", i.colorNumber) },
  ],
  hirshfields: [
    // Hirshfield's has no per-color pages (none in its sitemap), so this is its
    // color library; /color/ redirected to a "Color Basics" article.
    { name: "Hirshfield's", url: () => "https://www.hirshfields.com/color-inspiration/browse-our-colors/" },
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

/**
 * Retailers we can monetize through an affiliate program (the big-box
 * marketplaces). The color page uses this to pick which retailer becomes the
 * single "buy" CTA; the brand's own $0 .com is demoted to a small reference link.
 */
export const AFFILIATE_RETAILERS = new Set(["Home Depot", "Lowe's", "Ace Hardware"]);

/** Brand slugs with retailer links (scripts/check-retailer-links.ts --sample). */
export const RETAILER_LINK_BRANDS = Object.keys(BRAND_LINKS);

export function isAffiliateRetailer(retailerName: string): boolean {
  return AFFILIATE_RETAILERS.has(retailerName);
}

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
  // Return every available link in config order (the brand's own .com is listed
  // first). The color page owns presentation: for brands stocked at an affiliate
  // big-box it promotes Home Depot / Lowe's to the single buy CTA and demotes the
  // brand's own page to a "View official color" reference link (see
  // isAffiliateRetailer). Brands with no marketplace keep their .com as the buy CTA;
  // Amazon is their monetizable fallback (added separately in getSampleLinks).
  return configs
    .map((c) => ({ retailerName: c.name, url: c.url(info) }))
    .filter((link) => link.url !== "");
}
