export type CatalogSearch = Record<string, string | string[] | undefined>;
export function parseCatalogSearch(search: CatalogSearch) {
  const first = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
  const raw = first(search.page) ?? "1";
  const page = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) > 0 ? Number(raw) : 1;
  return { page, family: first(search.family) ?? "", undertone: first(search.undertone) ?? "" };
}
export function catalogCanonical(brandSlug: string, state: ReturnType<typeof parseCatalogSearch>) {
  return `https://www.paintcolorhq.com/brands/${brandSlug}${!state.family && !state.undertone && state.page > 1 ? `?page=${state.page}` : ""}`;
}
