// Most-searched colors per family, ranked by real US search demand.
//
// Source and date: October 2026 (data pulled 2026-10-11).
//   1. Google Ads US monthly search volume (DataForSEO keywords_data/google_ads/
//      search_volume, location 2840, language en) for "<brand> <color name>",
//      queried for every Sherwin-Williams, Benjamin Moore and Farrow & Ball color
//      in these families, plus Behr for pink, yellow, white and off-white.
//   2. Keyword volumes already collected in reports/competitor-gap-2026-10 and
//      reports/dataforseo-2026-10 (gap_keywords.csv, keyword-map.csv,
//      ranked_keywords_flat.csv), counted only when the query is the brand plus
//      the exact color name. A color's volume is the higher of the two.
//
// Eligibility, checked against the colors table when this file was built:
//   - colors.color_family equals the family and the color is not archived;
//   - the name does not carry another family's color word ("Forest Green" sits
//     in the blue family in the DB but would read wrong on the blue page);
//   - the name is not a bare color word or sheen ("Blue", "Light Green",
//     "Eggshell"), whose volume is generic intent, not demand for the paint;
//   - the brand has only one color with that name, so the volume is not shared;
//   - a CIELAB sanity check so the chip reads as the family: gray C <= 8,
//     neutral C <= 4 or warm hue 25-120 with C <= 10, red C >= 15,
//     yellow C >= 15 with hue 75-100 and LRV >= 40, pink LRV >= 10.
//
// `volume` and `query` are kept for audit only; pages never show them.
// Swatch, name, code and LRV are read from the database at render, and an entry
// that has left the family or been archived is dropped there.
//
// Rebuild: the build scripts and raw volume pulls are in the local, gitignored
// reports/competitor-gap-2026-10/scripts/family-demand/ (DataForSEO spend for
// this pull: $0.54). Do not add beige here while the beige family page test
// runs (until ~2026-11-07).

export const FAMILY_DEMAND_AS_OF = "2026-10";

export interface FamilyDemandEntry {
  brand: string;
  slug: string;
  /** Google US monthly searches for `query`, October 2026. Audit only. */
  volume: number;
  query: string;
}

export const FAMILY_DEMAND: Record<string, FamilyDemandEntry[]> = {
  "blue": [
    { brand: "sherwin-williams", slug: "in-the-navy-9178", volume: 9900, query: "sherwin williams in the navy" },
    { brand: "sherwin-williams", slug: "naval-6244", volume: 9900, query: "sherwin williams naval" },
    { brand: "sherwin-williams", slug: "indigo-batik-7602", volume: 2900, query: "sherwin williams indigo batik" },
    { brand: "benjamin-moore", slug: "breath-of-fresh-air-806", volume: 2400, query: "benjamin moore breath of fresh air" },
    { brand: "sherwin-williams", slug: "cascades-7623", volume: 2400, query: "sherwin williams cascades" },
    { brand: "sherwin-williams", slug: "salty-dog-9177", volume: 2400, query: "sherwin williams salty dog" },
    { brand: "sherwin-williams", slug: "dark-night-6237", volume: 1900, query: "sherwin williams dark night" },
    { brand: "sherwin-williams", slug: "moonmist-9144", volume: 1900, query: "sherwin williams moonmist" },
    { brand: "benjamin-moore", slug: "van-deusen-blue-hc-156", volume: 1600, query: "benjamin moore van deusen blue" },
    { brand: "sherwin-williams", slug: "atmospheric-6505", volume: 1300, query: "sherwin williams atmospheric" },
    { brand: "sherwin-williams", slug: "blue-peacock-64", volume: 1300, query: "sherwin williams blue peacock" },
    { brand: "sherwin-williams", slug: "favorite-jeans-9147", volume: 1300, query: "sherwin williams favorite jeans" },
    { brand: "sherwin-williams", slug: "rainstorm-6230", volume: 1300, query: "sherwin williams rainstorm" },
    { brand: "benjamin-moore", slug: "icy-blue-2057-70", volume: 1000, query: "benjamin moore icy blue" },
    { brand: "benjamin-moore", slug: "november-skies-2128-50", volume: 1000, query: "benjamin moore november skies" },
    { brand: "sherwin-williams", slug: "french-moire-9056", volume: 1000, query: "sherwin williams french moire" },
  ],
  "pink": [
    { brand: "sherwin-williams", slug: "exuberant-pink-6840", volume: 260, query: "sherwin williams exuberant pink" },
    { brand: "benjamin-moore", slug: "pink-peony-2078-70", volume: 210, query: "benjamin moore pink peony" },
    { brand: "sherwin-williams", slug: "lighthearted-pink-6568", volume: 210, query: "sherwin williams lighthearted pink" },
    { brand: "sherwin-williams", slug: "teaberry-6561", volume: 170, query: "sherwin williams teaberry" },
    { brand: "benjamin-moore", slug: "hot-lips-2077-30", volume: 140, query: "benjamin moore hot lips" },
    { brand: "benjamin-moore", slug: "peony-2079-30", volume: 140, query: "benjamin moore peony" },
    { brand: "benjamin-moore", slug: "razzle-dazzle-1348", volume: 110, query: "benjamin moore razzle dazzle" },
    { brand: "sherwin-williams", slug: "dragon-fruit-6855", volume: 110, query: "sherwin williams dragon fruit" },
    { brand: "benjamin-moore", slug: "hidden-sanctuary-1375", volume: 90, query: "benjamin moore hidden sanctuary" },
    { brand: "behr", slug: "diva-glam-p120-6", volume: 70, query: "behr diva glam" },
    { brand: "behr", slug: "pink-posies-m130-1", volume: 70, query: "behr pink posies" },
    { brand: "benjamin-moore", slug: "nursery-pink-2076-70", volume: 70, query: "benjamin moore nursery pink" },
    { brand: "behr", slug: "beauty-queen-p120-5", volume: 50, query: "behr beauty queen" },
    { brand: "behr", slug: "little-princess-p130-3", volume: 50, query: "behr little princess" },
    { brand: "benjamin-moore", slug: "vintage-claret-1364", volume: 50, query: "benjamin moore vintage claret" },
    { brand: "farrow-ball", slug: "rangwali-296", volume: 50, query: "farrow and ball rangwali" },
  ],
  "yellow": [
    { brand: "benjamin-moore", slug: "hawthorne-yellow-hc-4", volume: 1300, query: "benjamin moore hawthorne yellow" },
    { brand: "benjamin-moore", slug: "weston-flax-hc-5", volume: 720, query: "benjamin moore weston flax" },
    { brand: "benjamin-moore", slug: "pale-moon-289", volume: 480, query: "benjamin moore pale moon" },
    { brand: "sherwin-williams", slug: "pineapple-cream-1668", volume: 260, query: "sherwin williams pineapple cream" },
    { brand: "benjamin-moore", slug: "man-on-the-moon-oc-106", volume: 210, query: "benjamin moore man on the moon" },
    { brand: "farrow-ball", slug: "dayroom-yellow-233", volume: 210, query: "farrow and ball dayroom yellow" },
    { brand: "sherwin-williams", slug: "daybreak-6700", volume: 210, query: "sherwin williams daybreak" },
    { brand: "sherwin-williams", slug: "hearts-of-palm-6415", volume: 210, query: "sherwin williams hearts of palm" },
    { brand: "sherwin-williams", slug: "lemongrass-7732", volume: 210, query: "sherwin williams lemongrass" },
    { brand: "benjamin-moore", slug: "cashmere-930", volume: 170, query: "benjamin moore cashmere" },
    { brand: "sherwin-williams", slug: "lemon-twist-6909", volume: 170, query: "sherwin williams lemon twist" },
    { brand: "sherwin-williams", slug: "lily-6693", volume: 170, query: "sherwin williams lily" },
    { brand: "sherwin-williams", slug: "rice-paddy-6414", volume: 170, query: "sherwin williams rice paddy" },
    { brand: "benjamin-moore", slug: "abingdon-putty-hc-99", volume: 140, query: "benjamin moore abingdon putty" },
    { brand: "farrow-ball", slug: "pale-hound-71", volume: 140, query: "farrow and ball pale hound" },
    { brand: "sherwin-williams", slug: "fun-yellow-6908", volume: 140, query: "sherwin williams fun yellow" },
  ],
  "neutral": [
    { brand: "sherwin-williams", slug: "taupe-of-the-morning-9590", volume: 3600, query: "taupe of the morning sherwin williams" },
    { brand: "sherwin-williams", slug: "mushroom-9587", volume: 2400, query: "sherwin williams mushroom" },
    { brand: "sherwin-williams", slug: "white-sesame-9586", volume: 2400, query: "white sesame sherwin williams" },
    { brand: "benjamin-moore", slug: "wenge-af-180", volume: 1600, query: "benjamin moore wenge" },
    { brand: "sherwin-williams", slug: "sanctuary-9583", volume: 1600, query: "sherwin williams sanctuary" },
    { brand: "sherwin-williams", slug: "white-sand-9582", volume: 1600, query: "sherwin williams white sand" },
    { brand: "sherwin-williams", slug: "white-snow-9541", volume: 1600, query: "sherwin williams white snow paint" },
    { brand: "farrow-ball", slug: "peignoir-286", volume: 1000, query: "farrow and ball peignoir" },
    { brand: "benjamin-moore", slug: "batik-af-610", volume: 880, query: "benjamin moore batik" },
    { brand: "sherwin-williams", slug: "dew-drop-9641", volume: 880, query: "dew drop sherwin williams" },
    { brand: "sherwin-williams", slug: "sunbleached-9585", volume: 880, query: "sherwin williams sunbleached" },
    { brand: "sherwin-williams", slug: "utterly-beige-6080", volume: 880, query: "sherwin williams utterly beige" },
    { brand: "benjamin-moore", slug: "morning-dew-1493", volume: 720, query: "benjamin moore morning dew" },
    { brand: "sherwin-williams", slug: "artistic-taupe-6030", volume: 720, query: "sherwin williams artistic taupe" },
    { brand: "sherwin-williams", slug: "cheviot-9503", volume: 720, query: "cheviot sherwin williams" },
    { brand: "sherwin-williams", slug: "clove-9605", volume: 720, query: "sherwin williams clove" },
  ],
  "gray": [
    { brand: "sherwin-williams", slug: "agreeable-gray-7029", volume: 60500, query: "sherwin williams paint color agreeable gray" },
    { brand: "sherwin-williams", slug: "iron-ore-7069", volume: 40500, query: "sherwin williams iron ore" },
    { brand: "sherwin-williams", slug: "sea-salt-6204", volume: 40500, query: "sherwin williams sea salt" },
    { brand: "sherwin-williams", slug: "evergreen-fog-9130", volume: 27100, query: "sherwin williams evergreen fog paint" },
    { brand: "sherwin-williams", slug: "repose-gray-7015", volume: 18100, query: "sherwin williams repose gray" },
    { brand: "sherwin-williams", slug: "drift-of-mist-9166", volume: 14800, query: "sherwin williams drift of mist" },
    { brand: "benjamin-moore", slug: "gray-owl-2137-60", volume: 12100, query: "benjamin moore gray owl" },
    { brand: "sherwin-williams", slug: "peppercorn-7674", volume: 12100, query: "sherwin williams peppercorn" },
    { brand: "sherwin-williams", slug: "oyster-bay-6206", volume: 9900, query: "sherwin williams oyster bay" },
    { brand: "benjamin-moore", slug: "silhouette-af-655", volume: 8100, query: "benjamin moore silhouette" },
    { brand: "sherwin-williams", slug: "rainwashed-6211", volume: 8100, query: "sherwin williams rainwashed" },
    { brand: "sherwin-williams", slug: "retreat-6207", volume: 8100, query: "sherwin williams retreat" },
    { brand: "benjamin-moore", slug: "boothbay-gray-hc-165", volume: 6600, query: "benjamin moore boothbay gray" },
    { brand: "sherwin-williams", slug: "anew-gray-7030", volume: 6600, query: "sherwin williams anew gray" },
    { brand: "sherwin-williams", slug: "light-french-gray-55", volume: 6600, query: "sherwin williams light french gray" },
    { brand: "sherwin-williams", slug: "mindful-gray-7016", volume: 6600, query: "sherwin williams mindful gray" },
  ],
  "red": [
    { brand: "behr", slug: "rumors-mq1-15", volume: 1600, query: "rumors behr" },
    { brand: "sherwin-williams", slug: "hushed-auburn-9080", volume: 1600, query: "hushed auburn sherwin williams" },
    { brand: "benjamin-moore", slug: "caliente-af-290", volume: 1000, query: "benjamin moore caliente" },
    { brand: "benjamin-moore", slug: "cottage-red-hc-184", volume: 1000, query: "benjamin moore cottage red" },
    { brand: "sherwin-williams", slug: "burgundy-6300", volume: 1000, query: "sherwin-williams burgundy paint" },
    { brand: "sherwin-williams", slug: "reddened-earth-6053", volume: 1000, query: "sherwin williams reddened earth" },
    { brand: "benjamin-moore", slug: "heritage-red-hc-181", volume: 880, query: "benjamin moore heritage red" },
    { brand: "benjamin-moore", slug: "new-london-burgundy-hc-61", volume: 880, query: "benjamin moore new london burgundy" },
    { brand: "farrow-ball", slug: "red-earth-64", volume: 880, query: "farrow and ball red earth" },
    { brand: "sherwin-williams", slug: "canyon-clay-6054", volume: 880, query: "sherwin williams canyon clay" },
    { brand: "sherwin-williams", slug: "cordovan-6027", volume: 880, query: "sherwin williams cordovan" },
    { brand: "sherwin-williams", slug: "rookwood-red-2802", volume: 880, query: "sherwin williams rookwood red" },
    { brand: "benjamin-moore", slug: "bewitched-csp-450", volume: 720, query: "benjamin moore bewitched" },
    { brand: "sherwin-williams", slug: "polished-mahogany-2838", volume: 720, query: "sherwin williams polished mahogany" },
    { brand: "sherwin-williams", slug: "red-barn-7591", volume: 720, query: "sherwin williams red barn" },
    { brand: "benjamin-moore", slug: "baked-terra-cotta-1202", volume: 590, query: "benjamin moore baked terra cotta" },
  ],
  "green": [
    { brand: "sherwin-williams", slug: "tidewater-6477", volume: 1900, query: "sherwin williams tidewater" },
    { brand: "benjamin-moore", slug: "hunter-green-2041-10", volume: 1600, query: "benjamin moore hunter green" },
    { brand: "sherwin-williams", slug: "hunt-club-6468", volume: 1300, query: "sherwin williams hunt club" },
    { brand: "benjamin-moore", slug: "silken-pine-2144-50", volume: 590, query: "benjamin moore silken pine" },
    { brand: "benjamin-moore", slug: "hancock-green-hc-117", volume: 480, query: "benjamin moore hancock green" },
    { brand: "sherwin-williams", slug: "bonsai-tint-6436", volume: 480, query: "sherwin williams bonsai tint" },
    { brand: "benjamin-moore", slug: "seafoam-green-2039-60", volume: 390, query: "benjamin moore seafoam green" },
    { brand: "sherwin-williams", slug: "gratifying-green-6435", volume: 390, query: "sherwin williams gratifying green" },
    { brand: "sherwin-williams", slug: "haven-6437", volume: 390, query: "sherwin williams haven" },
    { brand: "sherwin-williams", slug: "inverness-6433", volume: 390, query: "sherwin williams inverness" },
    { brand: "benjamin-moore", slug: "bud-green-2033-50", volume: 320, query: "benjamin moore bud green" },
    { brand: "benjamin-moore", slug: "budding-green-csp-790", volume: 320, query: "benjamin moore budding green" },
    { brand: "benjamin-moore", slug: "herb-garden-434", volume: 320, query: "benjamin moore herb garden" },
    { brand: "benjamin-moore", slug: "windsor-green-cw-505", volume: 320, query: "benjamin moore windsor green" },
    { brand: "farrow-ball", slug: "arsenic-214", volume: 320, query: "farrow and ball arsenic" },
    { brand: "sherwin-williams", slug: "aloe-6464", volume: 320, query: "sherwin williams aloe" },
  ],
  "white": [
    { brand: "sherwin-williams", slug: "alabaster-7008", volume: 74000, query: "sherwin williams alabaster" },
    { brand: "benjamin-moore", slug: "white-dove-oc-17", volume: 49500, query: "benjamin moore white dove" },
    { brand: "benjamin-moore", slug: "swiss-coffee-oc-45", volume: 40500, query: "benjamin moore swiss coffee" },
    { brand: "sherwin-williams", slug: "greek-villa-7551", volume: 40500, query: "sherwin williams greek villa" },
    { brand: "benjamin-moore", slug: "chantilly-lace-2121-70", volume: 27100, query: "benjamin moore chantilly lace" },
    { brand: "sherwin-williams", slug: "creamy-7012", volume: 12100, query: "sherwin williams creamy" },
    { brand: "benjamin-moore", slug: "cloud-white-oc-130", volume: 9900, query: "benjamin moore cloud white" },
    { brand: "benjamin-moore", slug: "simply-white-2143-70", volume: 9900, query: "simply white paint color benjamin moore" },
    { brand: "sherwin-williams", slug: "dover-white-6385", volume: 9900, query: "sherwin williams dover white" },
    { brand: "sherwin-williams", slug: "extra-white-7006", volume: 8100, query: "sherwin williams extra white" },
    { brand: "benjamin-moore", slug: "alabaster-876", volume: 5400, query: "benjamin moore alabaster" },
    { brand: "behr", slug: "blank-canvas-dc-003", volume: 3600, query: "behr blank canvas" },
    { brand: "sherwin-williams", slug: "westhighland-white-7566", volume: 3600, query: "sherwin williams westhighland white" },
    { brand: "sherwin-williams", slug: "high-reflective-white-7757", volume: 2900, query: "sherwin williams high reflective white paint" },
    { brand: "farrow-ball", slug: "pointing-2003", volume: 2400, query: "farrow and ball pointing" },
    { brand: "sherwin-williams", slug: "marshmallow-7001", volume: 2400, query: "sherwin williams marshmallow" },
  ],
  "off-white": [
    { brand: "sherwin-williams", slug: "shoji-white-7042", volume: 27100, query: "sherwin williams shoji white" },
    { brand: "sherwin-williams", slug: "pure-white-7005", volume: 22200, query: "sherwin williams pure white" },
    { brand: "benjamin-moore", slug: "classic-gray-1548", volume: 18100, query: "benjamin moore classic gray" },
    { brand: "sherwin-williams", slug: "snowbound-7004", volume: 18100, query: "sherwin williams snowbound" },
    { brand: "sherwin-williams", slug: "aesthetic-white-7035", volume: 9900, query: "sherwin williams aesthetic white" },
    { brand: "sherwin-williams", slug: "white-duck-7010", volume: 9900, query: "sherwin williams white duck" },
    { brand: "sherwin-williams", slug: "natural-choice-7011", volume: 8100, query: "sherwin williams natural choice" },
    { brand: "benjamin-moore", slug: "ballet-white-oc-9", volume: 6600, query: "benjamin moore ballet white" },
    { brand: "benjamin-moore", slug: "linen-white-912", volume: 6600, query: "benjamin moore linen white" },
    { brand: "sherwin-williams", slug: "eider-white-7014", volume: 5400, query: "sherwin williams eider white" },
    { brand: "sherwin-williams", slug: "origami-white-7636", volume: 5400, query: "sherwin williams origami white" },
    { brand: "sherwin-williams", slug: "oyster-white-7637", volume: 5400, query: "sherwin williams oyster white" },
    { brand: "sherwin-williams", slug: "pearly-white-7009", volume: 5400, query: "sherwin williams pearly white" },
    { brand: "sherwin-williams", slug: "intimate-white-6322", volume: 4400, query: "sherwin williams intimate white" },
    { brand: "benjamin-moore", slug: "first-light-2102-70", volume: 3600, query: "benjamin moore first light" },
    { brand: "benjamin-moore", slug: "navajo-white-947", volume: 3600, query: "navajo white paint by benjamin moore" },
  ],
};
