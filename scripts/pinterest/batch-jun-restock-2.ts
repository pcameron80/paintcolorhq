// Pinterest batch — June 2026 restock, part 2 (campaign: restock-jun-2026)
// Continues restock-01..15 with keys restock-16..30. All color data verified
// against the live DB on 2026-05-30; cross-brand picks (Behr/Valspar/PPG/DE)
// swapped to in-DB colors where the first-choice name wasn't carried.
// Reuses buildPrompt() from batch-jun-restock.ts for identical rendering rules.

import type { PinSpec } from "./batch-may26.ts";
import { buildPrompt, type Swatch } from "./batch-jun-restock.ts";

const C = {
  gentlemansGray: { name: "Gentleman's Gray", hex: "#314757", rgb: "49, 71, 87", lrv: "5.8", undertone: "Cool Blue" },
  oysterBay: { name: "Oyster Bay", hex: "#AEB3A9", rgb: "174, 179, 169", lrv: "44.1", undertone: "Warm Golden" },
  swissCoffee: { name: "Swiss Coffee", hex: "#F2F1E5", rgb: "242, 241, 229", lrv: "87.4", undertone: "Neutral" },
  filteredShade: { name: "Filtered Shade", hex: "#CDCBC8", rgb: "205, 203, 200", lrv: "59.9", undertone: "Neutral" },
  oliveSprig: { name: "Olive Sprig", hex: "#ACAF95", rgb: "172, 175, 149", lrv: "41.6", undertone: "Cool Green" },
  kendallCharcoal: { name: "Kendall Charcoal", hex: "#686763", rgb: "104, 103, 99", lrv: "13.5", undertone: "Neutral" },
  bayFog: { name: "Bay Fog", hex: "#9899B0", rgb: "152, 153, 176", lrv: "32.6", undertone: "Cool Violet" },
  gauntletGray: { name: "Gauntlet Gray", hex: "#78736E", rgb: "120, 115, 110", lrv: "17.4", undertone: "Warm Golden" },
  caliente: { name: "Caliente", hex: "#8B2829", rgb: "139, 40, 41", lrv: "7.2", undertone: "Warm" },
  rainwashed: { name: "Rainwashed", hex: "#C2CDC5", rgb: "194, 205, 197", lrv: "59.2", undertone: "Neutral" },
  palladianBlue: { name: "Palladian Blue", hex: "#C2D2CA", rgb: "194, 210, 202", lrv: "61.8", undertone: "Neutral" },
  paleTaupe: { name: "Pale Taupe", hex: "#E3D1C8", rgb: "227, 209, 200", lrv: "66.1", undertone: "Neutral" },
  shakerBeige: { name: "Shaker Beige", hex: "#D2C3A8", rgb: "210, 195, 168", lrv: "53.5", undertone: "Neutral" },
  // supporting + comparison colors (verified in prior batches)
  greekVilla: { name: "Greek Villa", hex: "#F0ECE2", rgb: "240, 236, 226", lrv: "84", undertone: "Neutral" },
  alabaster: { name: "Alabaster", hex: "#EDEAE0", rgb: "237, 234, 224", lrv: "82.2", undertone: "Neutral" },
  haleNavy: { name: "Hale Navy", hex: "#3E4450", rgb: "62, 68, 80", lrv: "7.1", undertone: "Cool Blue" },
  naval: { name: "Naval", hex: "#34405A", rgb: "52, 64, 90", lrv: "4.5", undertone: "Cool Blue" },
  newburyportBlue: { name: "Newburyport Blue", hex: "#475667", rgb: "71, 86, 103", lrv: "9", undertone: "Neutral" },
  evergreenFog: { name: "Evergreen Fog", hex: "#95A18D", rgb: "149, 161, 141", lrv: "30", undertone: "Cool Green" },
  pewterGreen: { name: "Pewter Green", hex: "#5E6259", rgb: "94, 98, 89", lrv: "11.8", undertone: "Warm Golden" },
  saybrookSage: { name: "Saybrook Sage", hex: "#B2BAA4", rgb: "178, 186, 164", lrv: "46.4", undertone: "Cool Green" },
} satisfies Record<string, Swatch>;

const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=restock-jun-2026";
const SITE = "https://www.paintcolorhq.com";

export const BATCH: PinSpec[] = [
  {
    id: 16, key: "restock-16", theme: "navy", format: "wet-bar",
    name: "Gentleman's Gray Wet Bar",
    image: "Gentlemans Gray Wet Bar.png",
    prompt: buildPrompt(
      "A moody home wet bar color-drenched in Gentleman's Gray — the cabinetry, walls, and open shelving are all painted Gentleman's Gray (deep teal-navy). The crown molding and counter backsplash trim are painted Greek Villa. Honed marble counter, unlacquered brass bar faucet and hardware, amber glassware and decanters on the brass shelving, warm focused lighting.",
      [C.gentlemansGray, C.greekVilla],
    ),
    title: "Gentleman's Gray Wet Bar — BM 2062-20 Deep Teal-Navy",
    description:
      "Benjamin Moore Gentleman's Gray 2062-20 (LRV 5.8) color-drenched on a home wet bar — a deep teal-navy that turns a small alcove into a jewel box. Honed marble, unlacquered brass, and amber glass do the rest. Greek Villa keeps the trim crisp. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/gentlemans-gray-2062-20${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 17, key: "restock-17", theme: "sage", format: "primary-bath",
    name: "Oyster Bay Primary Bath",
    image: "Oyster Bay Primary Bath.png",
    prompt: buildPrompt(
      "A spa-like primary bathroom. The walls are painted Oyster Bay (soft sage-green-gray). The trim, ceiling, and freestanding-tub millwork are painted Greek Villa. A freestanding soaking tub, polished nickel floor-mount filler, white oak vanity, marble-look floor tile, and eucalyptus in a stoneware vase. Soft even daylight.",
      [C.oysterBay, C.greekVilla],
    ),
    title: "Oyster Bay Primary Bath — SW 6206 Spa Sage-Green",
    description:
      "Sherwin-Williams Oyster Bay SW 6206 (LRV 44.1) is the soft sage-green-gray that gives a primary bath a calm, spa-like feel — green enough to soothe, gray enough to stay sophisticated. Paired with Greek Villa trim, white oak, and polished nickel. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/oyster-bay-6206${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 18, key: "restock-18", theme: "warm-white", format: "great-room",
    name: "Swiss Coffee Great Room",
    image: "Swiss Coffee Great Room.png",
    prompt: buildPrompt(
      "A bright open-plan great room. The walls and ceiling are painted Swiss Coffee (creamy warm white). The steel-framed windows and a slim fireplace surround are painted Kendall Charcoal as the dark contrast. A large sectional in oatmeal linen, a walnut coffee table, a jute rug, and abundant daylight from tall windows.",
      [C.swissCoffee, C.kendallCharcoal],
    ),
    title: "Swiss Coffee Great Room — Behr's Warm White Open-Plan",
    description:
      "Behr Swiss Coffee W-B-700 (LRV 87.4) is the creamy warm white that keeps a big open-plan great room bright without the glare of a stark white. Kendall Charcoal on the steel windows and fireplace adds the contrast. The most-loved Behr white for a reason. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/behr/swiss-coffee-w-b-700${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 19, key: "restock-19", theme: "soft-gray", format: "laundry-room",
    name: "Filtered Shade Laundry Room",
    image: "Filtered Shade Laundry Room.png",
    prompt: buildPrompt(
      "A bright laundry room. The walls are painted Filtered Shade (soft neutral gray). The shaker cabinets and trim are painted Swiss Coffee. A white quartz folding counter, brushed nickel hardware, a woven basket, a patterned cement floor tile, and a window over the sink with natural light.",
      [C.filteredShade, C.swissCoffee],
    ),
    title: "Filtered Shade Laundry Room — Valspar Soft Gray",
    description:
      "Valspar Filtered Shade 4003-1B (LRV 59.9) is the clean, soft neutral gray that keeps a laundry room feeling crisp and bright — no blue or green cast to fight the cabinets. Paired with Swiss Coffee cabinetry, quartz, and patterned cement tile. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/valspar/filtered-shade-4003-1b${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 20, key: "restock-20", theme: "green", format: "playroom",
    name: "Olive Sprig Playroom",
    image: "Olive Sprig Playroom.png",
    prompt: buildPrompt(
      "A cheerful kids' playroom. The walls are painted Olive Sprig (muted sage green). The trim, built-in toy shelving, and window seat are painted Greek Villa. A natural-wood play table, woven storage baskets, a soft wool rug, a few potted plants on a high shelf, and bright daylight.",
      [C.oliveSprig, C.greekVilla],
    ),
    title: "Olive Sprig Playroom — PPG Muted Sage Green",
    description:
      "PPG Olive Sprig 1125-4 (LRV 41.6) is a muted sage green that makes a kids' playroom feel calm and grown-up rather than primary-color loud — a color the room won't outgrow. Paired with Greek Villa built-ins, natural wood, and woven storage. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/ppg/olive-sprig-1125-4${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 21, key: "restock-21", theme: "charcoal", format: "fireplace",
    name: "Kendall Charcoal Fireplace Wall",
    image: "Kendall Charcoal Fireplace Wall.png",
    prompt: buildPrompt(
      "A living room with a floor-to-ceiling fireplace feature wall painted Kendall Charcoal (warm deep charcoal). The surrounding walls, trim, and ceiling are painted Greek Villa. A white oak mantel, a pair of cream bouclé chairs, a jute rug, brass picture light over framed art, and warm evening lamplight.",
      [C.kendallCharcoal, C.greekVilla],
    ),
    title: "Kendall Charcoal Fireplace Wall — BM HC-166 Warm Charcoal",
    description:
      "Benjamin Moore Kendall Charcoal HC-166 (LRV 13.5) on a fireplace feature wall — a warm deep charcoal that anchors a living room without the flatness of black. Greek Villa on the surrounding walls lets it stand out. White oak, bouclé, and brass complete it. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/kendall-charcoal-hc-166${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 22, key: "restock-22", theme: "blue-gray", format: "craft-room",
    name: "Bay Fog Craft Room",
    image: "Bay Fog Craft Room.png",
    prompt: buildPrompt(
      "A tidy craft room. The walls are painted Bay Fog (soft blue-violet gray). The built-in cabinets, pegboard frame, and trim are painted Swiss Coffee. A white quartz worktable, open shelving with labeled jars and rolls of ribbon, a rattan stool, and bright north-facing daylight.",
      [C.bayFog, C.swissCoffee],
    ),
    title: "Bay Fog Craft Room — Dunn-Edwards Soft Blue-Gray",
    description:
      "Dunn-Edwards Bay Fog DE5934 (LRV 32.6) is a soft blue-violet gray that makes a craft room feel focused and calm — a quiet backdrop that lets colorful supplies pop. Paired with Swiss Coffee cabinetry and quartz. Cross-brand matches across 14 brands at PaintColorHQ.",
    link: `${SITE}/colors/dunn-edwards/bay-fog-de5934${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 23, key: "restock-23", theme: "dark-gray", format: "media-room",
    name: "Gauntlet Gray Media Room",
    image: "Gauntlet Gray Media Room.png",
    prompt: buildPrompt(
      "A cozy media room. The walls and ceiling are painted Gauntlet Gray (deep warm gray). The trim and a built-in media console are painted Greek Villa. A deep charcoal sectional, a wool flatweave rug, brass sconces dimmed low, blackout linen drapes, and warm low lighting.",
      [C.gauntletGray, C.greekVilla],
    ),
    title: "Gauntlet Gray Media Room — SW 7019 Deep Warm Gray",
    description:
      "Sherwin-Williams Gauntlet Gray SW 7019 (LRV 17.4) wraps a media room in a deep warm gray that cuts screen glare and feels enveloping without going full black. Greek Villa trim keeps the edges defined. Charcoal seating and dimmed brass complete the cocoon. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/gauntlet-gray-7019${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 24, key: "restock-24", theme: "red", format: "front-door",
    name: "Caliente Front Door",
    image: "Caliente Front Door.png",
    prompt: buildPrompt(
      "A welcoming home entrance. The front door is painted Caliente (bold lipstick red). The siding and trim around the door are painted Alabaster. A brass door knocker and handle, two black planters with topiaries flanking the door, a slate stoop, and bright midday light.",
      [C.caliente, C.alabaster],
    ),
    title: "Caliente Front Door — Benjamin Moore AF-290 Bold Red",
    description:
      "Benjamin Moore Caliente AF-290 (LRV 7.2) — the 2018 Color of the Year — is the confident lipstick red that makes a front door the focal point of the whole facade. Set against Alabaster siding with brass hardware and topiaries. See cross-brand red matches at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/caliente-af-290${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 25, key: "restock-25", theme: "blue-green", format: "screened-porch",
    name: "Rainwashed Screened Porch",
    image: "Rainwashed Screened Porch.png",
    prompt: buildPrompt(
      "A relaxed screened porch. The walls and tongue-and-groove ceiling are painted Rainwashed (soft blue-green). The trim and screen frames are painted Greek Villa. White wicker seating with cream cushions, a jute rug, a ceiling fan, potted ferns, and dappled afternoon light through the screens.",
      [C.rainwashed, C.greekVilla],
    ),
    title: "Rainwashed Screened Porch — SW 6211 Soft Blue-Green",
    description:
      "Sherwin-Williams Rainwashed SW 6211 (LRV 59.2) on a screened-porch ceiling and walls — a soft blue-green that reads like sea glass and extends the calm of the indoors outside. A traditional painted T&G ceiling color. Greek Villa trim, white wicker, and ferns finish it. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/rainwashed-6211${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 26, key: "restock-26", theme: "soft-blue-green", format: "guest-bedroom",
    name: "Palladian Blue Guest Bedroom",
    image: "Palladian Blue Guest Bedroom.png",
    prompt: buildPrompt(
      "A serene guest bedroom. The walls are painted Palladian Blue (soft blue-green). The trim, ceiling, and a paneled headboard wall are painted Greek Villa. A linen upholstered bed, white oak nightstands, brass sconces, a wool rug, and soft morning light from a window with linen curtains.",
      [C.palladianBlue, C.greekVilla],
    ),
    title: "Palladian Blue Guest Bedroom — BM HC-144 Soft Blue-Green",
    description:
      "Benjamin Moore Palladian Blue HC-144 (LRV 61.8) is the soft blue-green that shifts gently between blue and green with the light — a restful, welcoming guest-bedroom color. Paired with Greek Villa trim, linen, white oak, and brass. Full cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/palladian-blue-hc-144${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 27, key: "restock-27", theme: "taupe", format: "entryway",
    name: "Pale Taupe Entryway",
    image: "Pale Taupe Entryway.png",
    prompt: buildPrompt(
      "A warm welcoming entryway. The walls are painted Pale Taupe (warm light taupe). The trim, wainscot, and a console-height bench are painted Alabaster. A round antique-brass mirror, a slim walnut console, a woven runner over wood floors, and a brass picture light. Bright daylight from a sidelight.",
      [C.paleTaupe, C.alabaster],
    ),
    title: "Pale Taupe Entryway — PPG Warm Greige-Taupe",
    description:
      "PPG Pale Taupe 1073-3 (LRV 66.1) gives an entryway an immediate warmth — a soft greige-taupe that flatters wood floors and brass and sets a welcoming first impression. Paired with Alabaster trim and walnut. Cross-brand matches across 14 brands at PaintColorHQ.",
    link: `${SITE}/colors/ppg/pale-taupe-1073-3${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 28, key: "restock-28", theme: "beige", format: "hallway",
    name: "Shaker Beige Hallway",
    image: "Shaker Beige Hallway.png",
    prompt: buildPrompt(
      "A bright connecting hallway. The walls are painted Shaker Beige (warm classic beige). The trim, doors, and wainscot are painted Alabaster. A runner rug over white oak floors, a row of framed black-and-white photos, a brass sconce, and natural light spilling in from a doorway at the end.",
      [C.shakerBeige, C.alabaster],
    ),
    title: "Shaker Beige Hallway — BM HC-45 Warm Classic Beige",
    description:
      "Benjamin Moore Shaker Beige HC-45 (LRV 53.5) is the warm classic beige that makes a windowless hallway feel sunlit and inviting rather than dim. Paired with Alabaster trim and doors, white oak floors, and a gallery of framed photos. Full cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/shaker-beige-hc-45${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 29, key: "restock-29", theme: "navy", format: "comparison",
    name: "Best Navy Paint Colors Compared",
    image: "Best Navy Paint Colors Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even daylight, each painted a different navy and clearly distinct from its neighbors. Left panel Hale Navy, center panel Naval, right panel Newburyport Blue. A thin white oak shelf runs across all three with a single brass candlestick.",
      [C.haleNavy, C.naval, C.newburyportBlue],
    ),
    title: "Best Navy Paint Colors — Hale Navy vs Naval vs Newburyport Blue",
    description:
      "The three most-specified navies compared: Benjamin Moore Hale Navy HC-154 (LRV 7.1, the warm standard), Sherwin-Williams Naval SW 6244 (LRV 4.5, the deepest), and Benjamin Moore Newburyport Blue HC-155 (LRV 9, a touch more slate). Choose by depth and undertone. Full blue paint guide at PaintColorHQ.",
    link: `${SITE}/blog/best-blue-paint-colors${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 30, key: "restock-30", theme: "green", format: "comparison",
    name: "Best Green Paint Colors Compared",
    image: "Best Green Paint Colors Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even daylight, each painted a different green and clearly distinct from its neighbors. Left panel Evergreen Fog, center panel Pewter Green, right panel Saybrook Sage. A thin white oak shelf runs across all three with a small potted fern.",
      [C.evergreenFog, C.pewterGreen, C.saybrookSage],
    ),
    title: "Best Green Paint Colors — Evergreen Fog vs Pewter Green vs Saybrook Sage",
    description:
      "Three designer greens compared: Sherwin-Williams Evergreen Fog SW 9130 (LRV 30, soft gray-sage), Pewter Green SW 6208 (LRV 11.8, deep and moody), and Benjamin Moore Saybrook Sage HC-114 (LRV 46.4, the lightest). From whole-room calm to a dramatic island. Browse the full green collection at PaintColorHQ.",
    link: `${SITE}/colors/family/green${UTM}`,
    board: "Color Comparisons",
  },
];
