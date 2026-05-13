// Curated list of popular paint color slugs across major brands. Used by:
// - src/app/colors/[brandSlug]/[colorSlug]/page.tsx — generateStaticParams,
//   so these slugs are pre-rendered at build time.
// - src/app/api/sitemap/[id]/route.ts — match-individual shard, so the
//   cross-brand match pages for these colors are discoverable in the
//   sitemap.
//
// Slug source: src/lib/brand-content.tsx + src/lib/family-content.tsx
// (only slugs in active code, so they're known to match the database).
// Each slug is verified against the DB at color page build time so a
// stale entry doesn't break the build — see generateStaticParams in
// the color detail page.
export const POPULAR_COLOR_SLUGS: Array<{
  brandSlug: string;
  colorSlug: string;
}> = [
  // Sherwin-Williams
  { brandSlug: "sherwin-williams", colorSlug: "agreeable-gray-7029" },
  { brandSlug: "sherwin-williams", colorSlug: "alabaster-7008" },
  { brandSlug: "sherwin-williams", colorSlug: "naval-6244" },
  { brandSlug: "sherwin-williams", colorSlug: "pure-white-7005" },
  { brandSlug: "sherwin-williams", colorSlug: "repose-gray-7015" },
  { brandSlug: "sherwin-williams", colorSlug: "cavern-clay-7701" },
  { brandSlug: "sherwin-williams", colorSlug: "fireworks-6867" },
  { brandSlug: "sherwin-williams", colorSlug: "grounded-6089" },
  { brandSlug: "sherwin-williams", colorSlug: "quaint-coral-6536" },
  { brandSlug: "sherwin-williams", colorSlug: "tricorn-black-6258" },
  // Benjamin Moore
  { brandSlug: "benjamin-moore", colorSlug: "chantilly-lace-oc-65" },
  { brandSlug: "benjamin-moore", colorSlug: "edgecomb-gray-hc-173" },
  { brandSlug: "benjamin-moore", colorSlug: "hale-navy-hc-154" },
  { brandSlug: "benjamin-moore", colorSlug: "revere-pewter-hc-172" },
  { brandSlug: "benjamin-moore", colorSlug: "simply-white-oc-117" },
  { brandSlug: "benjamin-moore", colorSlug: "white-dove-oc-17" },
  { brandSlug: "benjamin-moore", colorSlug: "burnt-caramel-2167-10" },
  { brandSlug: "benjamin-moore", colorSlug: "caliente-af-290" },
  { brandSlug: "benjamin-moore", colorSlug: "cinnamon-slate-2113-40" },
  { brandSlug: "benjamin-moore", colorSlug: "hawthorne-yellow-hc-4" },
  { brandSlug: "benjamin-moore", colorSlug: "wrought-iron-2124-10" },
  // Behr
  { brandSlug: "behr", colorSlug: "cameo-white-w-d-200" },
  { brandSlug: "behr", colorSlug: "dolphin-fin-790c-3" },
  { brandSlug: "behr", colorSlug: "silver-drop-790c-2" },
  { brandSlug: "behr", colorSlug: "ultra-pure-white-1850" },
  { brandSlug: "behr", colorSlug: "whisper-white-w-d-300" },
  { brandSlug: "behr", colorSlug: "red-pepper-ppu2-02" },
  // Dunn-Edwards
  { brandSlug: "dunn-edwards", colorSlug: "bone-china-dew339" },
  { brandSlug: "dunn-edwards", colorSlug: "cold-water-de6316" },
  { brandSlug: "dunn-edwards", colorSlug: "cottage-white-dew318" },
  { brandSlug: "dunn-edwards", colorSlug: "foggy-day-de6226" },
  { brandSlug: "dunn-edwards", colorSlug: "swiss-coffee-dew341" },
  // Farrow & Ball
  { brandSlug: "farrow-ball", colorSlug: "ammonite-274" },
  { brandSlug: "farrow-ball", colorSlug: "cornforth-white-228" },
  { brandSlug: "farrow-ball", colorSlug: "elephants-breath-229" },
  { brandSlug: "farrow-ball", colorSlug: "hague-blue-30" },
  { brandSlug: "farrow-ball", colorSlug: "stiffkey-blue-281" },
  // PPG
  { brandSlug: "ppg", colorSlug: "delicate-white-1001-1" },
  { brandSlug: "ppg", colorSlug: "gypsum-1006-1" },
  { brandSlug: "ppg", colorSlug: "olive-sprig-1125-4" },
  { brandSlug: "ppg", colorSlug: "stonehenge-greige-1024-5" },
  { brandSlug: "ppg", colorSlug: "swirling-smoke-1007-2" },
  // Valspar
  { brandSlug: "valspar", colorSlug: "gravity-4005-1b" },
  { brandSlug: "valspar", colorSlug: "gray-silt-6002-1c" },
  { brandSlug: "valspar", colorSlug: "notre-dame-5006-1b" },
  { brandSlug: "valspar", colorSlug: "safari-beige-6006-2b" },
  { brandSlug: "valspar", colorSlug: "warm-eucalyptus-8004-28f" },
];

// Major brands used as target brands when generating cross-brand match
// URLs for the sitemap. Matches the same MAJOR_MATCH_BRANDS list used
// elsewhere for brand-to-brand listing pages.
export const MAJOR_MATCH_BRANDS = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "ppg",
  "valspar",
];
