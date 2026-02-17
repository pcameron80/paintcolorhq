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

const BRAND_LINKS: Record<string, RetailerConfig[]> = {
  behr: [
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`${i.brandName} ${i.colorName} paint`)}` },
  ],
  ppg: [
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`${i.brandName} ${i.colorName} paint`)}` },
  ],
  glidden: [
    { name: "Home Depot", url: (i) =>
      `https://www.homedepot.com/s/${encodeURIComponent(`${i.brandName} ${i.colorName} paint`)}` },
  ],
  valspar: [
    { name: "Lowe's", url: (i) =>
      `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`Valspar ${i.colorName} paint`)}` },
  ],
  "sherwin-williams": [
    { name: "Sherwin-Williams", url: (i) => {
      const num = i.colorNumber ?? "";
      const slug = slugify(i.colorName);
      const family = (i.colorFamily ?? "neutral") + "-paint-colors";
      return `https://www.sherwin-williams.com/en-us/color/color-family/${family}/SW${num}-${slug}`;
    }},
    { name: "Lowe's", url: (i) =>
      `https://www.lowes.com/search?searchTerm=${encodeURIComponent(`HGTV Sherwin Williams ${i.colorName} paint`)}` },
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
  return configs.map((c) => ({
    retailerName: c.name,
    url: c.url(info),
  }));
}
