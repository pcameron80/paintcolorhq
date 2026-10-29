import snapshot from "@/generated/sitemap.json";
export const CATALOG_BRANDS = snapshot.brands;
// The count itself lives in site-facts so copy has one source; the copy-count
// check fails if it ever disagrees with CATALOG_BRANDS.length.
export { BRAND_COUNT } from "./site-facts";
