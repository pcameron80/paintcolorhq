// Brand Color of the Year picks, keyed by announcement cycle. Each entry is
// verified against the brand's own announcement before it is added, and
// colorSlug must resolve in our catalog. A pick that is not in our data yet
// (a brand-new color with no published values) keeps colorSlug null and
// renders without matches rather than borrowing a same-named older color.
//
// Update each fall: add the new year, keep the previous year as the archive.
// Edit this file the same day a brand announces and bump COTY_HUB_DATES.updated
// with it. That date drives the hub's dateModified, its visible "Updated" line
// and its sitemap lastmod, so it moves only when the picks change.

export interface ColorOfTheYearPick {
  brandSlug: string;
  brandName: string;
  name: string;
  code: string;
  colorSlug: string | null;
  announced?: string; // ISO date, only when confirmed from the announcement itself
  sourceUrl: string;
  note?: string;
}

export interface ColorOfTheYearCycle {
  year: number;
  picks: ColorOfTheYearPick[];
  pending: { brandName: string; expected: string }[];
}

export const COTY_HUB_DATES = {
  published: "2026-10-05",
  updated: "2026-10-31",
} as const;

export const COLOR_OF_THE_YEAR: ColorOfTheYearCycle[] = [
  {
    year: 2027,
    picks: [
      {
        brandSlug: "sherwin-williams",
        brandName: "Sherwin-Williams",
        name: "Celery",
        code: "SW 6421",
        colorSlug: "celery-6421",
        announced: "2026-09-15",
        sourceUrl: "https://www.sherwin-williams.com/en-us/color/color-of-the-year/2027",
        note: "Shared with HGTV Home by Sherwin-Williams (HGSW6421).",
      },
      {
        brandSlug: "benjamin-moore",
        brandName: "Benjamin Moore",
        name: "Webster Green",
        code: "HC-130",
        colorSlug: "webster-green-hc-130",
        announced: "2026-10-14",
        sourceUrl: "https://www.benjaminmoore.com/en-us/press/benjamin-moore-announces-color-of-the-year-2027",
      },
      {
        brandSlug: "ppg",
        brandName: "Glidden / Pittsburgh Paints",
        name: "Artifact",
        code: "PPG10-16",
        colorSlug: "artifact-10-16",
        announced: "2026-09-14",
        sourceUrl: "https://www.glidden.com/2027-color-of-the-year",
        note: "PPG named a separate global pick, Country Soil (PPG15-30), for markets outside the US. It is not sold here, so we do not list it.",
      },
      {
        brandSlug: "behr",
        brandName: "Behr",
        name: "Grounded",
        code: "T27-01",
        colorSlug: "grounded-t27-01",
        announced: "2026-08-26",
        sourceUrl: "https://corporate.behr.com/news/behr-paint-company-announces-2027-color-of-the-year-grounded",
        note: "Not the same color as Behr's older Grounded (240D-5), an orange.",
      },
      {
        brandSlug: "dutch-boy",
        brandName: "Dutch Boy",
        name: "Deep Rooted",
        code: "311-7DB",
        colorSlug: "deep-rooted-311-7db",
        announced: "2026-08-25",
        sourceUrl: "https://www.prnewswire.com/news-releases/dutch-boy-paints-2027-color-of-the-year-deep-rooted-invites-homeowners-to-feel-grounded-in-possibility-302858602.html",
      },
      {
        brandSlug: "valspar",
        brandName: "Valspar",
        name: "Cottage Door",
        code: "8004-38E",
        colorSlug: "cottage-door-8004-38e",
        sourceUrl: "https://www.valspar.com/en/colors/color-of-the-year",
      },
      {
        brandSlug: "dunn-edwards",
        brandName: "Dunn-Edwards",
        name: "French Press Coffee",
        code: "DEBN07",
        colorSlug: "french-press-coffee-debn07",
        sourceUrl: "https://www.dunnedwards.com/colors/color-of-the-year/",
      },
    ],
    pending: [{ brandName: "Pantone", expected: "early December 2026" }],
  },
  {
    year: 2026,
    picks: [
      { brandSlug: "sherwin-williams", brandName: "Sherwin-Williams", name: "Universal Khaki", code: "SW 6150", colorSlug: "universal-khaki-6150", announced: "2025-09-24", sourceUrl: "https://www.sherwin-williams.com/en-us/color/color-of-the-year/2026" },
      { brandSlug: "benjamin-moore", brandName: "Benjamin Moore", name: "Silhouette", code: "AF-655", colorSlug: "silhouette-af-655", announced: "2025-10-16", sourceUrl: "https://www.paint.org/coatingstech-magazine/articles/industry-colors-of-the-year-2026/" },
      { brandSlug: "behr", brandName: "Behr", name: "Hidden Gem", code: "N430-6A", colorSlug: "hidden-gem-n430-6a", sourceUrl: "https://corporate.behr.com/news/behr-paint-company-announces-2026-color-of-the-year-hidden-gem-a-smoky-jade-that-embodies-understated-elegance-and-timeless-sophistication" },
      { brandSlug: "valspar", brandName: "Valspar", name: "Warm Eucalyptus", code: "8004-28F", colorSlug: "warm-eucalyptus-8004-28f", sourceUrl: "https://www.paint.org/coatingstech-magazine/articles/industry-colors-of-the-year-2026/" },
      { brandSlug: "ppg", brandName: "Glidden / Pittsburgh Paints", name: "Warm Mahogany", code: "PPG1060-7", colorSlug: "warm-mahogany-1060-7", sourceUrl: "https://www.paint.org/coatingstech-magazine/articles/industry-colors-of-the-year-2026/" },
      { brandSlug: "ppg", brandName: "PPG", name: "Secret Safari", code: "PPG1110-4", colorSlug: "secret-safari-1110-4", sourceUrl: "https://investor.ppg.com/news/news-details/2025/PPG-announces-Secret-Safari-as-2026-Color-of-the-Year/default.aspx" },
      { brandSlug: "dutch-boy", brandName: "Dutch Boy", name: "Melodious Ivory", code: "313-2DB", colorSlug: "melodious-ivory-313-2db", sourceUrl: "https://www.paint.org/coatingstech-magazine/articles/industry-colors-of-the-year-2026/" },
      { brandSlug: "dunn-edwards", brandName: "Dunn-Edwards", name: "Midnight Garden", code: "DE5657", colorSlug: "midnight-garden-de5657", sourceUrl: "https://www.paint.org/coatingstech-magazine/articles/industry-colors-of-the-year-2026/" },
    ],
    pending: [],
  },
];

export const CURRENT_COTY = COLOR_OF_THE_YEAR[0];

// Brands we track that share a parent company. Two of them listing the same
// color values is a shared formula, not two companies landing on one color.
const PARENT_COMPANY: Record<string, string> = {
  "sherwin-williams": "Sherwin-Williams",
  "dutch-boy": "Sherwin-Williams",
  valspar: "Sherwin-Williams",
  behr: "Masco",
  kilz: "Masco",
};

/** The parent company two brands share, or null when they are separate companies. */
export function sharedParentCompany(brandSlugA: string, brandSlugB: string): string | null {
  const a = PARENT_COMPANY[brandSlugA];
  return a && a === PARENT_COMPANY[brandSlugB] ? a : null;
}

// "brandSlug/colorSlug" → { year, brandName } for the color-page badge.
export const COTY_BY_COLOR: Record<string, { year: number; brandName: string }> = Object.fromEntries(
  COLOR_OF_THE_YEAR.flatMap((cycle) =>
    cycle.picks
      .filter((p) => p.colorSlug)
      .map((p) => [`${p.brandSlug}/${p.colorSlug}`, { year: cycle.year, brandName: p.brandName }]),
  ),
);
