import { parseCatalogSearch, type CatalogSearch } from "./catalog-pagination";

export const HUE_BAND_PER_PAGE = 60;

export function parseHueBandSearch(search: CatalogSearch) {
  return { page: parseCatalogSearch(search).page };
}

export function hueBandCanonical(bandSlug: string, page: number) {
  return `https://www.paintcolorhq.com/colors/hue/${bandSlug}${page > 1 ? `?page=${page}` : ""}`;
}
