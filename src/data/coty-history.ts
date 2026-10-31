// Earlier Color of the Year picks for the three brands with the longest
// published-LRV record in our data, used by the palette statistics study
// (scripts/study-palette-stats.ts) to track how light or dark the picks run.
// 2026 and later live in src/lib/color-of-the-year.ts; this file only holds
// 2022 to 2025 and does not feed the /color-of-the-year hub.
//
// Each pick was checked against the brand's own announcement or archive, or a
// trade report of it, on 2026-10-31. Sherwin-Williams named a nine-color
// "Color Capsule" for 2025 instead of one color, so it has no 2025 row.

export interface CotyHistoryPick {
  year: number;
  brandSlug: string;
  brandName: string;
  name: string;
  code: string;
  colorSlug: string;
  sourceUrl: string;
}

export const COTY_HISTORY: CotyHistoryPick[] = [
  { year: 2022, brandSlug: "benjamin-moore", brandName: "Benjamin Moore", name: "October Mist", code: "1495", colorSlug: "october-mist-1495", sourceUrl: "https://www.benjaminmoore.com/en-us/press/october-mist-2022-color-of-the-year" },
  { year: 2023, brandSlug: "benjamin-moore", brandName: "Benjamin Moore", name: "Raspberry Blush", code: "2008-30", colorSlug: "raspberry-blush-2008-30", sourceUrl: "https://www.benjaminmoore.com/en-us/press/raspberry-blush-2023-color-of-the-year" },
  { year: 2024, brandSlug: "benjamin-moore", brandName: "Benjamin Moore", name: "Blue Nova", code: "825", colorSlug: "blue-nova-825", sourceUrl: "https://www.benjaminmoore.com/en-us/paint-colors/color-of-the-year-2024" },
  { year: 2025, brandSlug: "benjamin-moore", brandName: "Benjamin Moore", name: "Cinnamon Slate", code: "2113-40", colorSlug: "cinnamon-slate-2113-40", sourceUrl: "https://www.benjaminmoore.com/en-us/color-overview/color-palettes/how-we-choose-color-of-the-year" },
  { year: 2022, brandSlug: "behr", brandName: "Behr", name: "Breezeway", code: "MQ3-21", colorSlug: "breezeway-mq3-21", sourceUrl: "https://www.builderonline.com/design/interior-finish/behr-paint-unveils-breezeway-as-its-2022-color-of-the-year_o" },
  { year: 2023, brandSlug: "behr", brandName: "Behr", name: "Blank Canvas", code: "DC-003", colorSlug: "blank-canvas-dc-003", sourceUrl: "https://corporate.homedepot.com/news/products/behr-announces-2023-color-year-blank-canvas" },
  { year: 2024, brandSlug: "behr", brandName: "Behr", name: "Cracked Pepper", code: "PPU18-01", colorSlug: "cracked-pepper-ppu18-01", sourceUrl: "https://www.behr.com/colorfullybehr/behr-announces-2024-color-of-the-year-cracked-pepper/" },
  { year: 2025, brandSlug: "behr", brandName: "Behr", name: "Rumors", code: "MQ1-15", colorSlug: "rumors-mq1-15", sourceUrl: "https://www.apartmenttherapy.com/behr-2025-color-of-the-year-37419283" },
  { year: 2022, brandSlug: "sherwin-williams", brandName: "Sherwin-Williams", name: "Evergreen Fog", code: "SW 9130", colorSlug: "evergreen-fog-9130", sourceUrl: "https://www.sherwin-williams.com/en-us/color/color-of-the-year" },
  { year: 2023, brandSlug: "sherwin-williams", brandName: "Sherwin-Williams", name: "Redend Point", code: "SW 9081", colorSlug: "redend-point-9081", sourceUrl: "https://www.sherwin-williams.com/en-us/color/color-of-the-year" },
  { year: 2024, brandSlug: "sherwin-williams", brandName: "Sherwin-Williams", name: "Upward", code: "SW 6239", colorSlug: "upward-6239", sourceUrl: "https://www.sherwin-williams.com/en-us/color/color-of-the-year" },
];
