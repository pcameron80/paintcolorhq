// Names a color was listed under on PaintColorHQ before it was updated to the
// manufacturer's current name (scripts/apply-published-names.ts --renames:
// Benjamin Moore and Behr on 2026-10-11; Sherwin-Williams and PPG drafted
// 2026-10-24 in scripts/lib/approved-renames.ts, applied on or after
// 2026-11-08). An entry only shows once the DB name has changed: while the
// stored name still equals the former name the page renders as before.
// Slugs kept the old name, so these pages are still found by it; the color
// page shows "Previously listed as ..." so the old name stays on the page.
// Spelling fixes and names that were import truncations are not listed, with
// one exception: PPG Safari (now Safari Green), which people search for.
export const FORMER_NAMES: Record<string, string> = {
  "behr/canyon-ouvert-n300-4": "Canyon Ouvert",
  "behr/williamsburg-blue-610c-3": "Williamsburg Blue",
  "benjamin-moore/american-white-2112-70": "American White",
  "benjamin-moore/buttermilk-919": "Buttermilk",
  "benjamin-moore/champion-cobalt-2061-20": "Champion Cobalt",
  "benjamin-moore/ebony-king-2132-20": "Ebony King",
  "benjamin-moore/gypsy-love-2085-30": "Gypsy Love",
  "benjamin-moore/gypsy-pink-2077-20": "Gypsy Pink",
  "benjamin-moore/gypsy-rose-1327": "Gypsy Rose",
  "benjamin-moore/ice-blue-2052-70": "Ice Blue",
  "benjamin-moore/indian-summer-cc-186": "Indian Summer",
  "benjamin-moore/louisiana-cc-124": "Louisiana",
  "benjamin-moore/mexicana-2172-30": "Mexicana",
  "benjamin-moore/moonlight-2020-60": "Moonlight",
  "benjamin-moore/navajo-red-2171-10": "Navajo Red",
  "benjamin-moore/newborn-baby-002": "Newborn Baby",
  "benjamin-moore/nimbus-gray-2131-50": "Nimbus Gray",
  "benjamin-moore/old-navy-2063-10": "Old Navy",
  "benjamin-moore/patriot-blue-2064-20": "Patriot Blue",
  "benjamin-moore/patriot-red-2080-20": "Patriot Red",
  "benjamin-moore/patriotic-white-2135-70": "Patriotic White",
  "benjamin-moore/pernod-316": "Pernod",
  "benjamin-moore/pink-cadillac-2002-70": "Pink Cadillac",
  "benjamin-moore/pink-starburst-2004-40": "Pink Starburst",
  "benjamin-moore/polo-blue-2062-10": "Polo Blue",
  "benjamin-moore/saddle-brown-2164-10": "Saddle Brown",
  "benjamin-moore/sandy-hook-gray-hc-108": "Sandy Hook Gray",
  "benjamin-moore/seminole-brown-1183": "Seminole Brown",
  "benjamin-moore/silver-half-dollar-2121-40": "Silver Half Dollar",
  "benjamin-moore/starburst-orange-2010-30": "Starburst Orange",
  "benjamin-moore/timber-wolf-1600": "Timber Wolf",
  "benjamin-moore/whale-gray-2134-40": "Whale Gray",
  "benjamin-moore/white-cloud-2159-70": "White Cloud",
  "benjamin-moore/white-opulence-879": "White Opulence",
  "benjamin-moore/wildflowers-325": "Wildflowers",
  "ppg/baby-bunting-1243-3": "Baby Bunting",
  "ppg/bare-beige-1067-2": "Bare Beige",
  "ppg/birthday-suit-1071-3": "Birthday Suit",
  "ppg/blue-booties-1241-2": "Blue Booties",
  "ppg/blushing-bride-1182-2": "Blushing Bride",
  "ppg/blushing-senorita-1186-2": "Blushing Senorita",
  "ppg/cherokee-red-13-02": "Cherokee Red",
  "ppg/colonial-aqua-1148-4": "Colonial Aqua",
  "ppg/colonial-white-1097-1": "Colonial White",
  "ppg/cradle-pink-1183-2": "Cradle Pink",
  "ppg/easter-egg-1166-4": "Easter Egg",
  "ppg/elf-shoe-1226-5": "Elf Shoe",
  "ppg/hindu-lotus-1026-6": "Hindu Lotus",
  "ppg/how-handsome-1040-4": "How Handsome",
  "ppg/indian-maize-1214-6": "Indian Maize",
  "ppg/indian-muslin-1075-2": "Indian Muslin",
  "ppg/indian-paintbrush-18-32": "Indian Paintbrush",
  "ppg/ivory-beauty-12-29": "Ivory Beauty",
  "ppg/lady-pink-1187-2": "Lady Pink",
  "ppg/mexican-chile-1186-5": "Mexican Chile",
  "ppg/mexican-jade-17-28": "Mexican Jade",
  "ppg/mexican-moonlight-1065-5": "Mexican Moonlight",
  "ppg/monkey-madness-1020-7": "Monkey Madness",
  "ppg/morning-glow-1216-1": "Morning Glow",
  "ppg/navajo-white-1101-2": "Navajo White",
  "ppg/pink-booties-1182-1": "Pink Booties",
  "ppg/racy-raisin-16-24": "Racy Raisin",
  "ppg/rockabye-baby-1188-1": "Rockabye Baby",
  "ppg/rojo-colonial-13-15": "Rojo Colonial",
  "ppg/safari-1111-3": "Safari",
  "ppg/sailor-boy-1164-4": "Sailor Boy",
  "ppg/sentimental-lady-1159-2": "Sentimental Lady",
  "ppg/sleep-baby-sleep-1161-2": "Sleep Baby Sleep",
  "ppg/summer-tan-1067-4": "Summer Tan",
  "ppg/suntan-1068-4": "Suntan",
  "ppg/tan-your-hide-1091-6": "Tan Your Hide",
  "ppg/tantalizing-tan-1070-3": "Tantalizing Tan",
  "ppg/tropical-tan-1080-5": "Tropical Tan",
  "sherwin-williams/arresting-auburn-6034": "Arresting Auburn",
  "sherwin-williams/biltmore-buff-7691": "Biltmore Buff",
  "sherwin-williams/china-doll-7517": "China Doll",
  "sherwin-williams/less-brown-6040": "Less Brown",
  "sherwin-williams/moroccan-brown-6060": "Moroccan Brown",
  "sherwin-williams/plantation-shutters-7520": "Plantation Shutters",
  "sherwin-williams/rugged-brown-6062": "Rugged Brown",
  "sherwin-williams/suitable-brown-7054": "Suitable Brown",
  "sherwin-williams/well-bred-brown-7027": "Well-Bred Brown",
};

// U+2010/U+2011 count as "-" so SW 7027, stored as "Well‐Bred Brown" until the
// rename is applied, does not show "Previously listed as Well-Bred Brown".
const plainHyphens = (s: string) => s.replace(/[‐‑]/g, "-");

/** The former name to show for a color, or undefined while it still carries that name. */
export function formerNameFor(brandSlug: string, colorSlug: string, currentName: string): string | undefined {
  const former = FORMER_NAMES[`${brandSlug}/${colorSlug}`];
  return former && plainHyphens(former) !== plainHyphens(currentName) ? former : undefined;
}
