type Retailer = {
  name: string;
  searchUrl: (brandName: string, colorName: string) => string;
};

const HOME_DEPOT: Retailer = {
  name: "Home Depot",
  searchUrl: (brand, color) =>
    `https://www.homedepot.com/s/${encodeURIComponent(`${brand} ${color} paint`)}`,
};

const LOWES: Retailer = {
  name: "Lowe's",
  searchUrl: (brand, color) =>
    `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`${brand} ${color} paint`)}`,
};

const BRAND_RETAILERS: Record<string, Retailer[]> = {
  behr: [HOME_DEPOT],
  ppg: [HOME_DEPOT],
  glidden: [HOME_DEPOT],
  "sherwin-williams": [LOWES],
  valspar: [LOWES],
};

// Brands with their own retail/dealer sites
const BRAND_WEBSITES: Record<string, { name: string; url: string }> = {
  "benjamin-moore": { name: "Benjamin Moore", url: "https://www.benjaminmoore.com/en-us/paint-colors/color-a-room" },
  "farrow-ball": { name: "Farrow & Ball", url: "https://www.farrow-ball.com" },
  "dunn-edwards": { name: "Dunn-Edwards", url: "https://www.dunnedwards.com/colors" },
};

export interface RetailerLink {
  retailerName: string;
  url: string;
}

export function getRetailerLinks(
  brandSlug: string,
  brandName: string,
  colorName: string
): RetailerLink[] {
  const retailers = BRAND_RETAILERS[brandSlug];
  if (retailers) {
    return retailers.map((r) => ({
      retailerName: r.name,
      url: r.searchUrl(brandName, colorName),
    }));
  }

  const website = BRAND_WEBSITES[brandSlug];
  if (website) {
    return [{ retailerName: website.name, url: website.url }];
  }

  return [];
}
