export interface RetailerLink {
  retailerName: string;
  url: string;
}

type RetailerConfig = {
  name: string;
  url: (brandName: string, colorName: string, colorNumber?: string) => string;
};

const homeDepotSearch: RetailerConfig["url"] = (brand, color) =>
  `https://www.homedepot.com/s/${encodeURIComponent(`${brand} ${color} paint`)}`;

const lowesSearch: RetailerConfig["url"] = (_brand, color) =>
  `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`HGTV Sherwin Williams ${color} paint`)}`;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const BRAND_LINKS: Record<string, RetailerConfig[]> = {
  behr: [
    { name: "Home Depot", url: homeDepotSearch },
  ],
  ppg: [
    { name: "Home Depot", url: homeDepotSearch },
  ],
  glidden: [
    { name: "Home Depot", url: homeDepotSearch },
  ],
  valspar: [
    { name: "Lowe's", url: (_brand, color) =>
      `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`Valspar ${color} paint`)}` },
  ],
  "sherwin-williams": [
    { name: "Sherwin-Williams", url: () => "https://www.sherwin-williams.com/store-locator" },
    { name: "Lowe's", url: lowesSearch },
  ],
  "benjamin-moore": [
    { name: "Benjamin Moore", url: (_brand, color, colorNumber) => {
      const num = (colorNumber ?? "").toLowerCase();
      const slug = slugify(color);
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
  colorNumber?: string
): RetailerLink[] {
  const configs = BRAND_LINKS[brandSlug];
  if (!configs) return [];

  return configs.map((c) => ({
    retailerName: c.name,
    url: c.url(brandName, colorName, colorNumber),
  }));
}
