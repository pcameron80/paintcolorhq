import { HUE_BANDS } from "@/lib/hue-bands";

// Brands linked from the homepage grid and the shared footer. Order is the
// order users see: the national big-box brands first, then regional and
// specialty catalogs. Every brand page is one click from home and from every
// page's footer, so this list must match the brands the site actually lists.
// Colorhouse is last so it can be dropped in one line if it is delisted.
export const NAV_BRANDS: { name: string; slug: string }[] = [
  { name: "Sherwin-Williams", slug: "sherwin-williams" },
  { name: "Benjamin Moore", slug: "benjamin-moore" },
  { name: "Behr", slug: "behr" },
  { name: "PPG", slug: "ppg" },
  { name: "Valspar", slug: "valspar" },
  { name: "Dunn-Edwards", slug: "dunn-edwards" },
  { name: "Farrow & Ball", slug: "farrow-ball" },
  { name: "Dutch Boy", slug: "dutch-boy" },
  { name: "Kilz", slug: "kilz" },
  { name: "Vista Paint", slug: "vista-paint" },
  { name: "Hirshfield's", slug: "hirshfields" },
  { name: "RAL", slug: "ral" },
  { name: "Colorhouse", slug: "colorhouse" },
];

// Hue pages (/colors/hue/[bandSlug]) sit between the family pages: blue gray,
// blue green and rust. Derived from HUE_BANDS so a new band is linked
// automatically.
export const NAV_HUES: { name: string; href: string }[] = HUE_BANDS.map((b) => ({
  name: b.name,
  href: `/colors/hue/${b.slug}`,
}));
