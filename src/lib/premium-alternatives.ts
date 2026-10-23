// Premium brands whose brand page leads with a "closest match in other
// brands" table. Farrow & Ball was the top landing page in Plausible
// (2026-10-20 to 23) and produced the most retailer clicks; visitors there
// are looking for the same look from a brand their local store carries.
// Slugs verified against the colors table 2026-10-23.
export const PREMIUM_ALTERNATIVES: Record<string, { targets: string[]; colorSlugs: string[] }> = {
  "farrow-ball": {
    targets: ["sherwin-williams", "benjamin-moore", "behr"],
    colorSlugs: [
      "cornforth-white-228",
      "elephants-breath-229",
      "hague-blue-30",
      "railings-31",
      "pigeon-25",
      "skimming-stone-241",
      "wevet-273",
      "setting-plaster-231",
      "lamp-room-gray-88",
      "ammonite-274",
      "stiffkey-blue-281",
      "school-house-white-291",
      "london-clay-244",
      "studio-green-93",
      "sulking-room-pink-295",
      "card-room-green-79",
    ],
  },
};
