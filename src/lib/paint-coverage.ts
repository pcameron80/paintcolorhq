// Published spread rates, one row per product, each read off the
// manufacturer's own product data sheet (PDS) or technical data sheet (TDS).
//
// Rules for this file:
// - Every number here must come from the linked sheet. No retailer copy, no
//   review sites, no "industry standard" figures.
// - `min` is omitted when the sheet only gives a ceiling ("up to 400").
// - `readDate` is the day the sheet was opened and the number copied. Sheets
//   get revised; re-read them when this date is more than a year old.
// - Behr and Kilz are left out on purpose: their sheets could not be read from
//   the manufacturer's site when this table was built (2026-10-24).

export type CoverageSurface =
  | "walls"
  | "ceiling"
  | "trim"
  | "exterior"
  | "primer";

export interface CoverageProduct {
  id: string;
  brand: "Sherwin-Williams" | "Benjamin Moore" | "Valspar" | "Glidden";
  /** Product line and the sheen the data sheet covers. */
  product: string;
  sheen: string;
  /** What the product is sold for, used to filter the calculator's picker. */
  surfaces: CoverageSurface[];
  /** Square feet per US gallon, one coat, as printed on the data sheet. */
  sqftPerGal: { min?: number; max: number };
  /** The manufacturer's data sheet the numbers were read from. */
  sourceUrl: string;
  /** Sheet type, for the link label. */
  sourceType: "PDS" | "TDS";
  /** ISO date the sheet was read. */
  readDate: string;
}

const READ = "2026-10-24";

export const COVERAGE_PRODUCTS: CoverageProduct[] = [
  // --- Sherwin-Williams (PDS at sherwin-williams.com/document/PDS) ---
  {
    id: "sw-emerald-interior",
    brand: "Sherwin-Williams",
    product: "Emerald Interior Acrylic Latex",
    sheen: "Matte",
    surfaces: ["walls", "ceiling"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777358153/",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "sw-duration-home",
    brand: "Sherwin-Williams",
    product: "Duration Home Interior Acrylic Latex",
    sheen: "Flat",
    surfaces: ["walls", "ceiling"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777252956/",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "sw-superpaint-interior",
    brand: "Sherwin-Williams",
    product: "SuperPaint Interior Acrylic Latex",
    sheen: "Velvet",
    surfaces: ["walls"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777255353/",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "sw-cashmere",
    brand: "Sherwin-Williams",
    product: "Cashmere Interior Acrylic Latex",
    sheen: "Flat Enamel",
    surfaces: ["walls", "ceiling"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777207536/",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "sw-emerald-urethane",
    brand: "Sherwin-Williams",
    product: "Emerald Urethane Trim Enamel",
    sheen: "Gloss",
    surfaces: ["trim"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777952986/",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "sw-duration-exterior",
    brand: "Sherwin-Williams",
    product: "Duration Exterior Acrylic Latex",
    sheen: "Satin",
    surfaces: ["exterior"],
    sqftPerGal: { min: 250, max: 300 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777132685/",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "sw-superpaint-exterior",
    brand: "Sherwin-Williams",
    product: "SuperPaint Exterior Acrylic Latex",
    sheen: "Flat",
    surfaces: ["exterior"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl: "https://www.sherwin-williams.com/document/PDS/en/035777800591/",
    sourceType: "PDS",
    readDate: READ,
  },

  // --- Benjamin Moore (TDS at media.benjaminmoore.com) ---
  {
    id: "bm-regal-select",
    brand: "Benjamin Moore",
    product: "Regal Select Interior",
    sheen: "Satin/Pearl",
    surfaces: ["walls"],
    sqftPerGal: { min: 400, max: 450 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0550/N550_TDS_US.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-aura-interior",
    brand: "Benjamin Moore",
    product: "Aura Interior",
    sheen: "Eggshell",
    surfaces: ["walls"],
    sqftPerGal: { min: 350, max: 400 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0524/N524_TDS_US_OKF.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-ben",
    brand: "Benjamin Moore",
    product: "ben Interior",
    sheen: "Eggshell",
    surfaces: ["walls"],
    sqftPerGal: { min: 400, max: 450 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0626/N626_TDS_US.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-waterborne-ceiling",
    brand: "Benjamin Moore",
    product: "Waterborne Ceiling Paint",
    sheen: "Ultra Flat",
    surfaces: ["ceiling"],
    sqftPerGal: { min: 400, max: 450 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0508/N508_TDS_US.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-advance",
    brand: "Benjamin Moore",
    product: "ADVANCE Waterborne Interior Alkyd",
    sheen: "Semi-Gloss",
    surfaces: ["trim"],
    sqftPerGal: { min: 400, max: 500 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0793/20190124%20793%20TDS%20US%20OKF.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-fresh-start",
    brand: "Benjamin Moore",
    product: "Fresh Start Multi-Purpose Latex Primer",
    sheen: "Primer",
    surfaces: ["primer"],
    sqftPerGal: { min: 400, max: 450 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0023/N023_TDS_US.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-aura-exterior",
    brand: "Benjamin Moore",
    product: "Aura Exterior",
    sheen: "Satin",
    surfaces: ["exterior"],
    sqftPerGal: { min: 250, max: 350 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0631/N631_TDS_US.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "bm-regal-select-exterior",
    brand: "Benjamin Moore",
    product: "Regal Select Exterior High Build",
    sheen: "Low Lustre",
    surfaces: ["exterior"],
    sqftPerGal: { min: 250, max: 350 },
    sourceUrl:
      "https://media.benjaminmoore.com/WebServices/prod/assets/production/datasheets/TDS_0401/N401_TDS_US.pdf",
    sourceType: "TDS",
    readDate: READ,
  },

  // --- Valspar (PDS at paintdocs.com, linked from valspar.com) ---
  {
    id: "valspar-signature",
    brand: "Valspar",
    product: "Signature Interior Paint + Primer",
    sheen: "Eggshell",
    surfaces: ["walls"],
    sqftPerGal: { max: 400 },
    sourceUrl:
      "https://paintdocs.com/docs/webPDF.jsp?SITEID=VALCONS&lang=2&doctype=PDS&prodno=042397610141",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "valspar-ultra",
    brand: "Valspar",
    product: "Ultra Interior Paint + Primer",
    sheen: "Eggshell",
    surfaces: ["walls"],
    sqftPerGal: { max: 400 },
    sourceUrl:
      "https://paintdocs.com/docs/webPDF.jsp?SITEID=VALCONS&lang=2&doctype=PDS&prodno=042397612688",
    sourceType: "PDS",
    readDate: READ,
  },
  {
    id: "valspar-duramax",
    brand: "Valspar",
    product: "Duramax Exterior Paint + Primer",
    sheen: "Satin",
    surfaces: ["exterior"],
    sqftPerGal: { min: 300, max: 400 },
    sourceUrl:
      "https://paintdocs.com/docs/webPDF.jsp?SITEID=VALCONS&lang=2&doctype=PDS&prodno=042397589140",
    sourceType: "PDS",
    readDate: READ,
  },

  // --- Glidden (PPG technical data bulletins) ---
  {
    id: "glidden-diamond",
    brand: "Glidden",
    product: "Diamond Interior Paint + Primer",
    sheen: "Flat",
    surfaces: ["walls", "ceiling"],
    sqftPerGal: { max: 400 },
    sourceUrl:
      "https://buyat.ppg.com/rep_pafpainttools_files/PPG%20Diamond/TDB/PPG53-110.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
  {
    id: "glidden-premium",
    brand: "Glidden",
    product: "Premium Interior Paint + Primer",
    sheen: "Semi-Gloss",
    surfaces: ["walls", "trim"],
    sqftPerGal: { max: 400 },
    sourceUrl: "https://buyat.ppg.com/rep_pafpainttools_files/GLIDDEN/GLN6411N.pdf",
    sourceType: "TDS",
    readDate: READ,
  },
];

/**
 * The rate the calculator plans with for a product: the low end of the
 * printed range, or the ceiling when the sheet only gives "up to" a number.
 * Planning at the low end means the estimate errs toward one can too many,
 * not one too few.
 */
export function planningRate(p: CoverageProduct): number {
  return p.sqftPerGal.min ?? p.sqftPerGal.max;
}

/** "350 to 400" or "up to 400", for tables and the picker. */
export function formatRange(p: CoverageProduct): string {
  const { min, max } = p.sqftPerGal;
  return min !== undefined ? `${min} to ${max}` : `up to ${max}`;
}

/**
 * Generic planning rates used when no product is picked. Each is the low end
 * that most of the sheets above print for that kind of paint, not a claim
 * about any one brand.
 */
export const GENERIC_RATE = {
  interior: 350,
  exterior: 250,
  primer: 400,
} as const;
