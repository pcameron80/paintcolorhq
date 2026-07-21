// Pinterest batch — August 2026 room-scene palettes (campaign: roomscene-aug-2026)
// Styled photoreal room scenes (the "palette" lane look — NOT the programmatic
// /api/pin/palette swatch stacks). Reuses buildPrompt() for identical rendering
// rules + the anti-Gemini-quirk guards. All color data DB-verified 2026-07-21.
// Four mains double as the Tier-4 blog deep-dive colors (PR #165) so the pin
// and the post reinforce each other.
import type { PinSpec } from "./batch-may26.ts";
import { buildPrompt, type Swatch } from "./batch-jun-restock.ts";

const C = {
  // mains
  agreeableGray: { name: "Agreeable Gray", hex: "#D1CBC1", rgb: "209, 203, 193", lrv: "60.1", undertone: "Neutral" },
  reposeGray: { name: "Repose Gray", hex: "#CCC9C0", rgb: "204, 201, 192", lrv: "58.4", undertone: "Neutral" },
  naval: { name: "Naval", hex: "#2F3D4C", rgb: "47, 61, 76", lrv: "4.5", undertone: "Neutral" },
  alabaster: { name: "Alabaster", hex: "#EDEAE0", rgb: "237, 234, 224", lrv: "82.2", undertone: "Neutral" },
  clarySage: { name: "Clary Sage", hex: "#ACAD97", rgb: "172, 173, 151", lrv: "40.9", undertone: "Neutral" },
  redendPoint: { name: "Redend Point", hex: "#AE8E7E", rgb: "174, 142, 126", lrv: "29.9", undertone: "Warm Golden" },
  palladianBlue: { name: "Palladian Blue", hex: "#C2D2CA", rgb: "194, 210, 202", lrv: "61.8", undertone: "Neutral" },
  firstLight: { name: "First Light", hex: "#F0E3DF", rgb: "240, 227, 223", lrv: "75.9", undertone: "Neutral" },
  aegeanTeal: { name: "Aegean Teal", hex: "#708A8C", rgb: "112, 138, 140", lrv: "23.5", undertone: "Neutral" },
  wroughtIron: { name: "Wrought Iron", hex: "#4A4B4C", rgb: "74, 75, 76", lrv: "7", undertone: "Neutral" },
  hagueBlue: { name: "Hague Blue", hex: "#3D4E57", rgb: "61, 78, 87", lrv: "7.1", undertone: "Neutral" },
  canyonDusk: { name: "Canyon Dusk", hex: "#C19A86", rgb: "193, 154, 134", lrv: "36.2", undertone: "Warm Golden" },
  // supporting (trim / walls / ceiling)
  pureWhite: { name: "Pure White", hex: "#EDECE6", rgb: "237, 236, 230", lrv: "83.7", undertone: "Neutral" },
  whiteDove: { name: "White Dove", hex: "#F3EFE0", rgb: "243, 239, 224", lrv: "83.2", undertone: "Neutral" },
  greekVilla: { name: "Greek Villa", hex: "#F0ECE2", rgb: "240, 236, 226", lrv: "84", undertone: "Neutral" },
  shojiWhite: { name: "Shoji White", hex: "#E6DFD3", rgb: "230, 223, 211", lrv: "74.3", undertone: "Neutral" },
  driftOfMist: { name: "Drift of Mist", hex: "#DCD8D0", rgb: "220, 216, 208", lrv: "68.9", undertone: "Neutral" },
} satisfies Record<string, Swatch>;

const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=roomscene-aug-2026";
const SITE = "https://www.paintcolorhq.com";

export const BATCH: PinSpec[] = [
  {
    id: 1, key: "roomscene-aug-01", theme: "greige", format: "family-room",
    name: "Agreeable Gray Family Room",
    image: "Agreeable Gray Family Room.png",
    prompt: buildPrompt(
      "A relaxed open family room. The walls are painted Agreeable Gray (a soft warm greige). The trim, ceiling, and built-in media cabinetry are painted Pure White. A deep linen sectional, a round walnut coffee table, a woven wool rug, and a large window with sheer drapes. Soft bright afternoon daylight.",
      [C.agreeableGray, C.pureWhite],
    ),
    title: "Agreeable Gray Family Room — Sherwin-Williams Warm Greige",
    description:
      "Sherwin-Williams Agreeable Gray 7029 (LRV 60.1) is the most-searched greige in America — warm, balanced, and easy across a whole family room against Pure White trim. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/agreeable-gray-7029${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 2, key: "roomscene-aug-02", theme: "gray", format: "staircase-hall",
    name: "Repose Gray Staircase Hall",
    image: "Repose Gray Staircase Hall.png",
    prompt: buildPrompt(
      "A bright two-story staircase hall. The walls are painted Repose Gray (a clean light gray). The stair risers, spindles, trim, and doors are painted Alabaster. Oak treads and a slim oak handrail, a runner up the stairs, framed art along the wall, and a tall window at the landing. Airy natural daylight.",
      [C.reposeGray, C.alabaster],
    ),
    title: "Repose Gray Staircase Hall — Sherwin-Williams Light Gray",
    description:
      "Sherwin-Williams Repose Gray 7015 (LRV 58.4) keeps a tall staircase hall light and clean — a balanced gray that never turns blue, with Alabaster trim and oak treads. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/repose-gray-7015${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 3, key: "roomscene-aug-03", theme: "navy", format: "home-office",
    name: "Naval Home Office",
    image: "Naval Home Office.png",
    prompt: buildPrompt(
      "A focused home office with built-in bookshelves and walls painted Naval (a deep saturated navy). The ceiling, window trim, and desk return are painted Pure White. A white oak desk, a caned chair, a brass task lamp, books and ceramics on the navy shelves. Crisp morning daylight from a side window.",
      [C.naval, C.pureWhite],
    ),
    title: "Naval Home Office — Sherwin-Williams Deep Navy Built-Ins",
    description:
      "Sherwin-Williams Naval 6244 (LRV 4.5) turns office built-ins into a statement — a rich, true navy that reads focused and calm against Pure White and warm oak. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/naval-6244${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 4, key: "roomscene-aug-04", theme: "white", format: "attic-bedroom",
    name: "Alabaster Attic Bedroom",
    image: "Alabaster Attic Bedroom.png",
    prompt: buildPrompt(
      "A cozy attic bedroom with sloped ceilings. The walls and angled ceiling are painted Alabaster (a soft warm white). The window trim and low bookcase are painted Drift of Mist (a soft greige-gray). A low platform bed with cream and oatmeal linen bedding, a small skylight, a woven bench, and a jute rug. Gentle warm morning light.",
      [C.alabaster, C.driftOfMist],
    ),
    title: "Alabaster Attic Bedroom — Sherwin-Williams Soft Warm White",
    description:
      "Sherwin-Williams Alabaster 7008 (LRV 82.2) wraps a sloped attic bedroom in one soft warm white — calm, never stark, grounded by Drift of Mist accents and natural linen. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/alabaster-7008${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 5, key: "roomscene-aug-05", theme: "blue-green", format: "laundry-room",
    name: "Palladian Blue Laundry Room",
    image: "Palladian Blue Laundry Room.png",
    prompt: buildPrompt(
      "A cheerful small laundry room. The upper walls are painted Palladian Blue (a soft airy blue-green). The lower cabinets, shelving, and trim are painted White Dove. A white farmhouse utility sink, brass hardware, a drying rod with hanging linen, woven baskets on open shelves, and patterned cement-look floor tile. Bright clean daylight.",
      [C.palladianBlue, C.whiteDove],
    ),
    title: "Palladian Blue Laundry Room — Benjamin Moore Airy Blue-Green",
    description:
      "Benjamin Moore Palladian Blue HC-144 (LRV 61.8) makes laundry day lighter — a soft spa blue-green that lifts a small workroom against White Dove cabinets and brass. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/palladian-blue-hc-144${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 6, key: "roomscene-aug-06", theme: "pink", format: "nursery",
    name: "First Light Nursery",
    image: "First Light Nursery.png",
    prompt: buildPrompt(
      "A serene nursery. The walls are painted First Light (a barely-there soft blush pink). The crib, wainscot, and trim are painted White Dove. A natural rattan rocker, a sheepskin rug over oak floors, linen curtains, and a small shelf with soft toys. Diffused gentle daylight.",
      [C.firstLight, C.whiteDove],
    ),
    title: "First Light Nursery — Benjamin Moore Soft Blush Pink",
    description:
      "Benjamin Moore First Light 2102-70 (LRV 75.9) — the 2020 Color of the Year, a whisper of blush that keeps a nursery calm and warm with White Dove trim and rattan. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/first-light-2102-70${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 7, key: "roomscene-aug-07", theme: "teal", format: "home-bar",
    name: "Aegean Teal Home Bar",
    image: "Aegean Teal Home Bar.png",
    prompt: buildPrompt(
      "A sophisticated built-in home bar nook. The bar cabinetry and shelving are painted Aegean Teal (a muted blue-green teal). The surrounding walls and trim are painted White Dove. A marble counter, brass rail and hardware, glassware on the teal shelves, and a small pendant light. Warm intimate evening light.",
      [C.aegeanTeal, C.whiteDove],
    ),
    title: "Aegean Teal Home Bar — Benjamin Moore Muted Teal Cabinets",
    description:
      "Benjamin Moore Aegean Teal 2136-40 (LRV 23.5) — the 2021 Color of the Year on home-bar cabinetry, a muted teal that feels collected with marble, brass, and White Dove walls. Discover it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/aegean-teal-2136-40${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 8, key: "roomscene-aug-08", theme: "black", format: "front-door",
    name: "Wrought Iron Front Door",
    image: "Wrought Iron Front Door.png",
    prompt: buildPrompt(
      "A welcoming craftsman front porch. The front door is painted Wrought Iron (a soft near-black charcoal). The siding, porch posts, and trim are painted White Dove. Brass door hardware, a woven doormat, two potted boxwoods, and a porch light. Bright friendly midday light.",
      [C.wroughtIron, C.whiteDove],
    ),
    title: "Wrought Iron Front Door — Benjamin Moore Soft Near-Black",
    description:
      "Benjamin Moore Wrought Iron 2124-10 (LRV 7) is the most-loved front-door near-black — softer than true black, timeless against White Dove siding and brass. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/wrought-iron-2124-10${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 9, key: "roomscene-aug-09", theme: "blue", format: "library",
    name: "Hague Blue Library Wall",
    image: "Hague Blue Library Wall.png",
    prompt: buildPrompt(
      "A dramatic library wall with floor-to-ceiling bookshelves painted Hague Blue (a deep inky blue-green). The ceiling and adjacent walls are painted Alabaster. A rolling oak ladder, rows of books, a leather reading chair with a plaid throw, and a brass floor lamp. Moody warm lamplight with a soft window glow.",
      [C.hagueBlue, C.alabaster],
    ),
    title: "Hague Blue Library Wall — Farrow & Ball Deep Inky Blue",
    description:
      "Farrow & Ball Hague Blue No. 30 (LRV 7.1) on floor-to-ceiling shelves is the classic English library move — deep, inky, and rich beside Alabaster and old brass. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/farrow-ball/hague-blue-30${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 10, key: "roomscene-aug-10", theme: "terracotta", format: "bedroom",
    name: "Canyon Dusk Bedroom",
    image: "Canyon Dusk Bedroom.png",
    prompt: buildPrompt(
      "A warm earthy bedroom. The walls are painted Canyon Dusk (a soft muted terracotta). The trim, ceiling, and closet doors are painted Greek Villa. A cane bed with rust and cream bedding, a wool area rug, terracotta pots with dried grasses, and linen curtains. Golden late-day light.",
      [C.canyonDusk, C.greekVilla],
    ),
    title: "Canyon Dusk Bedroom — Behr Soft Muted Terracotta",
    description:
      "Behr Canyon Dusk S210-4 (LRV 36.2) — the 2021 Color of the Year, a soft desert terracotta that makes a bedroom feel warm and settled with Greek Villa trim and cane. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/behr/canyon-dusk-s210-4${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 11, key: "roomscene-aug-11", theme: "sage", format: "kitchen",
    name: "Clary Sage Kitchen Cabinets",
    image: "Clary Sage Kitchen Cabinets.png",
    prompt: buildPrompt(
      "A fresh cottage kitchen with shaker cabinets painted Clary Sage (a soft gray-green sage). The walls, open shelf, and trim are painted Pure White. Butcher-block counters, a white apron sink, aged-brass hardware, a vase of garden herbs, and a window with cafe curtains. Soft bright morning light.",
      [C.clarySage, C.pureWhite],
    ),
    title: "Clary Sage Kitchen Cabinets — Sherwin-Williams Soft Sage",
    description:
      "Sherwin-Williams Clary Sage 6178 (LRV 40.9) on shaker cabinets is the cottage-kitchen sage — gentle gray-green against Pure White walls, butcher block, and brass. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/clary-sage-6178${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 12, key: "roomscene-aug-12", theme: "clay", format: "powder-room",
    name: "Redend Point Powder Room",
    image: "Redend Point Powder Room.png",
    prompt: buildPrompt(
      "A warm intimate powder room color-drenched in Redend Point (a soft blush-clay) on walls and ceiling. The vanity and trim are painted Shoji White. An oval brass mirror, a stone vessel sink, a brass sconce, and a small dried-flower stem in a bud vase. Cozy warm light.",
      [C.redendPoint, C.shojiWhite],
    ),
    title: "Redend Point Powder Room — Sherwin-Williams Blush Clay",
    description:
      "Sherwin-Williams Redend Point 9081 (LRV 29.9) — the 2023 Color of the Year, a blush-clay that turns a powder room warm and enveloping with Shoji White and stone. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/redend-point-9081${UTM}`,
    board: "Color Palettes",
  },
];
