// Pinterest batch — August 2026 comparison pins (campaign: comparison-aug-2026)
// Side-by-side wall-panel comparisons for the Color Comparisons board — the
// searched head-to-heads the blog answers. Restocks the comparison lane
// (0 fresh since June; Wed/Sat slots were riding the re-pin floor).
// All color data DB-verified 2026-07-21; every link checked live same day
// (scheduled deep-dive posts are NOT linked — they 404 until their dates).
import type { PinSpec } from "./batch-may26.ts";
import { buildPrompt, type Swatch } from "./batch-jun-restock.ts";

const C = {
  alabaster: { name: "Alabaster", hex: "#EDEAE0", rgb: "237, 234, 224", lrv: "82.2", undertone: "Neutral" },
  whiteDove: { name: "White Dove", hex: "#F3EFE0", rgb: "243, 239, 224", lrv: "83.2", undertone: "Neutral" },
  reposeGray: { name: "Repose Gray", hex: "#CCC9C0", rgb: "204, 201, 192", lrv: "58.4", undertone: "Neutral" },
  grayOwl: { name: "Gray Owl", hex: "#D4D5CD", rgb: "212, 213, 205", lrv: "66", undertone: "Neutral" },
  classicGray: { name: "Classic Gray", hex: "#E4E1D8", rgb: "228, 225, 216", lrv: "75.3", undertone: "Neutral" },
  accessibleBeige: { name: "Accessible Beige", hex: "#D1C7B8", rgb: "209, 199, 184", lrv: "57.9", undertone: "Neutral" },
  agreeableGray: { name: "Agreeable Gray", hex: "#D1CBC1", rgb: "209, 203, 193", lrv: "60.1", undertone: "Neutral" },
  tricornBlack: { name: "Tricorn Black", hex: "#2F2F30", rgb: "47, 47, 48", lrv: "2.9", undertone: "Neutral" },
  wroughtIron: { name: "Wrought Iron", hex: "#4A4B4C", rgb: "74, 75, 76", lrv: "7", undertone: "Neutral" },
  ironOre: { name: "Iron Ore", hex: "#434341", rgb: "67, 67, 65", lrv: "5.6", undertone: "Neutral" },
  seaSalt: { name: "Sea Salt", hex: "#CDD2CA", rgb: "205, 210, 202", lrv: "63.3", undertone: "Neutral" },
  palladianBlue: { name: "Palladian Blue", hex: "#C2D2CA", rgb: "194, 210, 202", lrv: "61.8", undertone: "Neutral" },
  cavernClay: { name: "Cavern Clay", hex: "#AC6B53", rgb: "172, 107, 83", lrv: "19.9", undertone: "Warm Golden" },
  redendPoint: { name: "Redend Point", hex: "#AE8E7E", rgb: "174, 142, 126", lrv: "29.9", undertone: "Warm Golden" },
  canyonDusk: { name: "Canyon Dusk", hex: "#C19A86", rgb: "193, 154, 134", lrv: "36.2", undertone: "Warm Golden" },
  evergreenFog: { name: "Evergreen Fog", hex: "#95978A", rgb: "149, 151, 138", lrv: "30.4", undertone: "Warm Golden" },
  clarySage: { name: "Clary Sage", hex: "#ACAD97", rgb: "172, 173, 151", lrv: "40.9", undertone: "Neutral" },
  edgecombGray: { name: "Edgecomb Gray", hex: "#DAD4C5", rgb: "218, 212, 197", lrv: "63.1", undertone: "Neutral" },
  manchesterTan: { name: "Manchester Tan", hex: "#DCD3BD", rgb: "220, 211, 189", lrv: "63.2", undertone: "Neutral" },
  shakerBeige: { name: "Shaker Beige", hex: "#D2C3A8", rgb: "210, 195, 168", lrv: "53.5", undertone: "Neutral" },
} satisfies Record<string, Swatch>;

const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=comparison-aug-2026";
const SITE = "https://www.paintcolorhq.com";

export const BATCH: PinSpec[] = [
  {
    id: 1, key: "comparison-aug-01", theme: "white", format: "comparison",
    name: "Alabaster vs White Dove",
    image: "Alabaster vs White Dove.png",
    prompt: buildPrompt(
      "Two vertical wall panels side-by-side under soft, even north-facing daylight, each painted a different soft warm white and clearly distinct from its neighbor. Left panel Alabaster (slightly deeper, creamier), right panel White Dove (slightly brighter, cleaner). A thin white oak shelf runs across both with a single ceramic vase.",
      [C.alabaster, C.whiteDove],
    ),
    title: "Alabaster vs White Dove — The Two Most Famous Whites Compared",
    description:
      "Alabaster (SW 7008, LRV 82.2) and White Dove (BM OC-17, LRV 83.2) get called twins — they are not. We measured them at a Delta E of 2.27: similar, but a visible difference on a wall. Alabaster runs a touch deeper and creamier; White Dove brighter and cleaner. Full measured comparison of 15 famous whites at PaintColorHQ.",
    link: `${SITE}/blog/famous-white-paints-compared${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 2, key: "comparison-aug-02", theme: "gray", format: "comparison",
    name: "Best True Grays Compared",
    image: "Best True Grays Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even daylight, each painted a different light true gray and clearly distinct from its neighbors. Left panel Repose Gray (the deepest of the three), center panel Gray Owl (cooler, airier), right panel Classic Gray (the lightest, almost off-white). A thin white oak shelf runs across all three with a small stack of books.",
      [C.reposeGray, C.grayOwl, C.classicGray],
    ),
    title: "Best True Gray Paint Colors — Repose Gray vs Gray Owl vs Classic Gray",
    description:
      "Three benchmark true grays, light to lightest: Sherwin-Williams Repose Gray (LRV 58.4, the balanced standard), Benjamin Moore Gray Owl (LRV 66, cooler and airier), and Benjamin Moore Classic Gray (LRV 75.3, so light it borders off-white). Clean grays, no greige warmth. Full true-gray guide at PaintColorHQ.",
    link: `${SITE}/blog/best-gray-paint-colors${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 3, key: "comparison-aug-03", theme: "greige", format: "comparison",
    name: "Accessible Beige vs Agreeable Gray",
    image: "Accessible Beige vs Agreeable Gray.png",
    prompt: buildPrompt(
      "Two vertical wall panels side-by-side under soft, even daylight, each painted a different warm neutral and clearly distinct from its neighbor. Left panel Accessible Beige (warmer, beige-leaning), right panel Agreeable Gray (lighter, gray-leaning greige). A thin walnut shelf runs across both with a small ceramic bowl.",
      [C.accessibleBeige, C.agreeableGray],
    ),
    title: "Accessible Beige vs Agreeable Gray — Which Side of the Greige Line?",
    description:
      "The fan-deck twins that split at the beige-greige line: Sherwin-Williams Accessible Beige (LRV 57.9) leans warm and beige; Agreeable Gray (LRV 60.1) is a touch lighter and reads as a true greige. Pick Accessible Beige for cozier, Agreeable Gray for lighter and cooler. Full greige field guide at PaintColorHQ.",
    link: `${SITE}/blog/best-greige-paint-colors${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 4, key: "comparison-aug-04", theme: "black", format: "comparison",
    name: "Best Near-Blacks Compared",
    image: "Best Near-Blacks Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even daylight, each painted a different near-black and clearly distinct from its neighbors. Left panel Tricorn Black (the truest black), center panel Iron Ore (soft charcoal-black), right panel Wrought Iron (the softest, faintly gray). A thin white oak shelf runs across all three with a single brass candlestick.",
      [C.tricornBlack, C.ironOre, C.wroughtIron],
    ),
    title: "Best Black Paint Colors — Tricorn Black vs Iron Ore vs Wrought Iron",
    description:
      "The three blacks designers actually use, hardest to softest: Sherwin-Williams Tricorn Black (LRV 2.9, the truest black), Iron Ore (LRV 5.6, a softened charcoal-black), and Benjamin Moore Wrought Iron (LRV 7, the gentlest — barely black at all). Doors, islands, accent walls. Browse every black at PaintColorHQ.",
    link: `${SITE}/colors/family/black${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 5, key: "comparison-aug-05", theme: "blue-green", format: "comparison",
    name: "Sea Salt vs Palladian Blue",
    image: "Sea Salt vs Palladian Blue.png",
    prompt: buildPrompt(
      "Two vertical wall panels side-by-side under soft, even daylight, each painted a different pale coastal color and clearly distinct from its neighbor. Left panel Sea Salt (a soft green-gray), right panel Palladian Blue (a slightly bluer, cooler blue-green). A thin white oak shelf runs across both with a small glass bud vase.",
      [C.seaSalt, C.palladianBlue],
    ),
    title: "Sea Salt vs Palladian Blue — Coastal Cousins, Not Twins",
    description:
      "Sherwin-Williams Sea Salt (LRV 63.3) and Benjamin Moore Palladian Blue (LRV 61.8) are the two most-loved coastal chameleons — close cousins, not the same color. Sea Salt leans green-gray; Palladian Blue reads a shade bluer and cooler. See both against every green at PaintColorHQ.",
    link: `${SITE}/colors/family/green${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 6, key: "comparison-aug-06", theme: "terracotta", format: "comparison",
    name: "Terracotta Colors of the Year Compared",
    image: "Terracotta Colors of the Year Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under warm, even daylight, each painted a different earthy terracotta and clearly distinct from its neighbors. Left panel Cavern Clay (the deepest, most orange), center panel Redend Point (muted blush-clay), right panel Canyon Dusk (the lightest, softest dusty terracotta). A thin walnut shelf runs across all three with a small terracotta pot.",
      [C.cavernClay, C.redendPoint, C.canyonDusk],
    ),
    title: "Terracotta Compared — Cavern Clay vs Redend Point vs Canyon Dusk",
    description:
      "Three Color-of-the-Year terracottas, deepest to softest: Sherwin-Williams Cavern Clay (LRV 19.9, bold desert orange), Redend Point (LRV 29.9, muted blush-clay), and Behr Canyon Dusk (LRV 36.2, the gentlest dusty clay). The warm earthy range at a glance. Browse every terracotta and clay at PaintColorHQ.",
    link: `${SITE}/colors/family/orange${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 7, key: "comparison-aug-07", theme: "sage", format: "comparison",
    name: "Evergreen Fog vs Clary Sage",
    image: "Evergreen Fog vs Clary Sage.png",
    prompt: buildPrompt(
      "Two vertical wall panels side-by-side under soft, even daylight, each painted a different sage green and clearly distinct from its neighbor. Left panel Evergreen Fog (deeper gray-sage), right panel Clary Sage (lighter, fresher gray-green). A thin white oak shelf runs across both with a small vase of dried eucalyptus.",
      [C.evergreenFog, C.clarySage],
    ),
    title: "Evergreen Fog vs Clary Sage — Two Sages, Two Moods",
    description:
      "Two Sherwin-Williams sages a full step apart: Evergreen Fog (LRV 30.4, the deep sophisticated gray-sage) and Clary Sage (LRV 40.9, the lighter cottage gray-green). Evergreen Fog grounds a room; Clary Sage freshens it. Every sage compared in the full guide at PaintColorHQ.",
    link: `${SITE}/blog/best-sage-green-paint-colors${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 8, key: "comparison-aug-08", theme: "beige", format: "comparison",
    name: "Benjamin Moore Warm Neutrals Compared",
    image: "Benjamin Moore Warm Neutrals Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even daylight, each painted a different warm Benjamin Moore neutral and clearly distinct from its neighbors. Left panel Edgecomb Gray (the grayest, lightest greige), center panel Manchester Tan (a soft khaki-tan), right panel Shaker Beige (the deepest, warmest classic beige). A thin white oak shelf runs across all three with a folded linen throw.",
      [C.edgecombGray, C.manchesterTan, C.shakerBeige],
    ),
    title: "BM Warm Neutrals — Edgecomb Gray vs Manchester Tan vs Shaker Beige",
    description:
      "Benjamin Moore's three go-to warm neutrals compared: Edgecomb Gray (LRV 63.1, the lightest and grayest), Manchester Tan (LRV 63.2, a soft khaki that reads calmer), and Shaker Beige (LRV 53.5, the deepest classic beige). Same family, three temperatures. Browse every beige at PaintColorHQ.",
    link: `${SITE}/colors/family/beige${UTM}`,
    board: "Color Comparisons",
  },
];
