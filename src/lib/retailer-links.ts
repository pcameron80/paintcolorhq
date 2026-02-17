export interface RetailerLink {
  retailerName: string;
  url: string;
}

type RetailerConfig = {
  name: string;
  url: (brandName: string, colorName: string) => string;
};

const homeDepotSearch = (brand: string, color: string) =>
  `https://www.homedepot.com/s/${encodeURIComponent(`${brand} ${color} paint`)}`;

const lowesSearch = (_brand: string, color: string) =>
  `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`HGTV Sherwin Williams ${color} paint`)}`;

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
    { name: "Benjamin Moore", url: () => "https://www.benjaminmoore.com/en-us/store-locator" },
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
  colorName: string
): RetailerLink[] {
  const configs = BRAND_LINKS[brandSlug];
  if (!configs) return [];

  return configs.map((c) => ({
    retailerName: c.name,
    url: c.url(brandName, colorName),
  }));
}
