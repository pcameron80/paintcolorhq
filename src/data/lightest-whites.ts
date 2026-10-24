// The lightest white each brand sells, by Light Reflectance Value (0 to 100).
//
// Published rows carry the manufacturer's own LRV, checked on the brand's site
// or palette feed on the date in `checked`. They can differ from the LRV stored
// on our color pages: most stored LRVs were computed from the hex at import, and
// scripts/apply-published-lrv.ts has only reconciled some brands so far.
//
// Estimated rows are brands we have no usable published LRV for. Their value is
// the LRV computed from the color's hex, so show them marked "est." and keep them
// out of any "brightest white on the market" claim.
//
// The July 2026 table used Behr W-B-500 at 97.3. That row is not in Behr's live
// palette and Behr publishes Ultra Pure White (UPW) at 94, so it was replaced.
// UPW is tied, not alone: Behr's 2026-10-11 feed also lists Stately White BXC-29
// and Blanca Peak HDC-NT-04G at 94. Copy that names UPW says "ties for" or
// "shared by", never "the brightest".

export interface LightestWhite {
  brand: string;
  brandSlug: string;
  name: string;
  code: string;
  /** Color slug on this site: /colors/<brandSlug>/<slug>. */
  slug: string;
  lrv: number;
  /** Where the LRV comes from: the manufacturer's site, or our estimate from the hex. */
  source: string;
  estimated: boolean;
  /** Date the value was last checked against the source, YYYY-MM-DD. */
  checked: string;
}

export const LIGHTEST_WHITES: LightestWhite[] = [
  { brand: "Behr", brandSlug: "behr", name: "Ultra Pure White", code: "UPW", slug: "ultra-pure-white-upw", lrv: 94, source: "behr.com", estimated: false, checked: "2026-10-23" },
  { brand: "Sherwin-Williams", brandSlug: "sherwin-williams", name: "UltraWhite", code: "SW 9500", slug: "ultrawhite-9500", lrv: 93.5, source: "sherwin-williams.com", estimated: false, checked: "2026-10-23" },
  // Our row for DEW380 is still named "White" with an LRV computed from #FFFFFF; Dunn-Edwards sells it as Warm White.
  { brand: "Dunn-Edwards", brandSlug: "dunn-edwards", name: "Warm White", code: "DEW380", slug: "white-dew380", lrv: 93, source: "dunnedwards.com", estimated: false, checked: "2026-10-23" },
  { brand: "Dutch Boy", brandSlug: "dutch-boy", name: "Super White", code: "001W", slug: "super-white-001w", lrv: 92, source: "dutchboy.com", estimated: false, checked: "2026-10-23" },
  { brand: "Benjamin Moore", brandSlug: "benjamin-moore", name: "Chantilly Lace", code: "2121-70", slug: "chantilly-lace-2121-70", lrv: 90, source: "benjaminmoore.com", estimated: false, checked: "2026-10-23" },
  { brand: "Hirshfield's", brandSlug: "hirshfields", name: "Touch of Sun", code: "0852", slug: "touch-of-sun-852", lrv: 90, source: "hirshfields.com", estimated: false, checked: "2026-10-23" },
  { brand: "Vista Paint", brandSlug: "vista-paint", name: "Touch of Sun", code: "0852", slug: "touch-of-sun-c-851", lrv: 90, source: "vistapaint.com", estimated: false, checked: "2026-10-23" },
  { brand: "PPG", brandSlug: "ppg", name: "Soft Candlelight", code: "61YY 89/135", slug: "soft-candlelight-61yy-89-135", lrv: 89, source: "pittsburghpaints.com", estimated: false, checked: "2026-10-24" },
  { brand: "Farrow & Ball", brandSlug: "farrow-ball", name: "All White", code: "2005", slug: "all-white-2005", lrv: 94.2, source: "estimate from hex", estimated: true, checked: "2026-10-23" },
  { brand: "Kilz", brandSlug: "kilz", name: "Ultra Bright White", code: "TB-01", slug: "ultra-bright-white-tb-01", lrv: 93.3, source: "estimate from hex", estimated: true, checked: "2026-10-23" },
  { brand: "Valspar", brandSlug: "valspar", name: "Ultra White", code: "7006-24", slug: "ultra-white-7006-24", lrv: 92.6, source: "estimate from hex", estimated: true, checked: "2026-10-23" },
];
