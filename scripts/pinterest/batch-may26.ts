// Pinterest batch — May 2026 cohort (campaign: may26-pin-batch)
// Single source of truth for both image generation and publishing.
// Mirrors ~/Brain-Personal/10-projects/paintcolorhq/pinterest-may26-pin-batch.md

export type BoardName =
  | "Color Palettes"
  | "Paint Color Guides"
  | "Paint Colors"
  | "Color Comparisons";

// Pinterest board IDs for the paintcolorhq account (verified via GET /v5/boards).
export const BOARD_IDS: Record<BoardName, string> = {
  "Color Palettes": "1116681738796524225",
  "Paint Color Guides": "1116681738796524227",
  "Paint Colors": "1116681738796524224",
  "Color Comparisons": "1116681738796524226",
};

/** Pin category — each maps 1:1 to a board. */
export type PinType = "swatch" | "palette" | "guide" | "comparison";

export const BOARD_FOR_TYPE: Record<PinType, BoardName> = {
  swatch: "Paint Colors",
  palette: "Color Palettes",
  guide: "Paint Color Guides",
  comparison: "Color Comparisons",
};

/** Inverse of BOARD_FOR_TYPE — derive a curated pin's type from its board. */
export const TYPE_FOR_BOARD: Record<BoardName, PinType> = {
  "Paint Colors": "swatch",
  "Color Palettes": "palette",
  "Paint Color Guides": "guide",
  "Color Comparisons": "comparison",
};

export interface PinSpec {
  /** 1-based position in the batch. */
  id: number;
  /** Stable, globally-unique key across all batches (e.g. "may26-01"). */
  key: string;
  /** Variety axis — color/subject (e.g. "navy", "white", "sage"). */
  theme: string;
  /** Variety axis — scene/room type (e.g. "living-room", "kitchen", "exterior"). */
  format: string;
  /** Human label. */
  name: string;
  /** Image filename inside IMAGE_DIR (matches the existing Desktop PNGs). */
  image: string;
  /** Full Gemini image-generation prompt (with rendering rules folded in). */
  prompt: string;
  /** Pinterest pin title. */
  title: string;
  /** Pinterest pin description. */
  description: string;
  /** UTM-tagged destination link. */
  link: string;
  /** Target board. */
  board: BoardName;
  /** Pin category. Optional on curated literals (derived from board at
   *  aggregation); set explicitly by the swatch/guide programmatic sources. */
  type?: PinType;
  /** When set, publish via Pinterest image_url instead of a local image file. */
  imageUrl?: string;
}

/** Where the generated / source PNGs live. */
export const IMAGE_DIR = "/Users/philipcameron/Desktop/Pinterest pins";

const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=may26-pin-batch";

export const BATCH: PinSpec[] = [
  {
    id: 1,
    key: "may26-01",
    theme: "navy",
    format: "living-room",
    name: "Hale Navy Living Room",
    image: "Hale Navy Living Room.png",
    prompt:
      "Vertical 2:3 pin showing a mid-century modern living room. The accent wall behind the sofa is painted Hale Navy. The ceiling, door trim, and window casing are White Dove. The adjacent side wall (visible at the left edge near the window) is painted Edgecomb Gray. Furnishings: brass floor lamp, walnut credenza, cream linen sofa, woven jute rug, hanging brass pendant. Natural light from a left-side window. Three color swatches overlay the bottom-left corner: Hale Navy (HEX #3E4450, RGB 62, 68, 80, LRV 7.1, Undertone Cool), White Dove (HEX #EDE6D3, RGB 237, 230, 211, LRV 83, Undertone Warm), Edgecomb Gray (HEX #D3CBBA, RGB 211, 203, 186, LRV 66, Undertone Warm Neutral) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Hale Navy Living Room — Benjamin Moore HC-154 Paint Color Palette",
    description:
      "Mid-century modern living room with Benjamin Moore Hale Navy HC-154 walls (LRV 7.1, deep navy), White Dove trim, and Edgecomb Gray adjacent walls. Brass hardware, walnut credenza, cream linen — the most-searched modern navy with two warm neutrals that complete the palette. See it in a real room and find where to buy it at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/best-blue-paint-colors" + UTM,
    board: "Color Palettes",
  },
  {
    id: 2,
    key: "may26-02",
    theme: "warm-gray",
    format: "kitchen",
    name: "Agreeable Gray Open-Plan Kitchen",
    image: "Agreeable Gray Open-Plan Kitchen.png",
    prompt:
      "Vertical 2:3 pin showing an open-plan kitchen-dining room. The walls are painted Agreeable Gray. The upper and lower shaker cabinets are painted Pure White. The island base is painted Iron Ore (the dark contrast against the Pure White cabinets is the focal point). Butcher-block island countertop, brass pendant lights, white oak floors, ceramic vase with eucalyptus. Three color swatches overlay the bottom-left corner: Agreeable Gray (HEX #D1CBC1, RGB 209, 203, 193, LRV 60, Undertone Warm Neutral), Iron Ore (HEX #43484C, RGB 67, 72, 76, LRV 6, Undertone Cool), Pure White (HEX #F3EEE0, RGB 243, 238, 224, LRV 83.7, Undertone Warm) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Agreeable Gray Kitchen Palette — SW 7029 with Iron Ore Accent",
    description:
      "Sherwin-Williams Agreeable Gray SW 7029 (LRV 60) is the most-searched warm gray in residential paint. Paired with Iron Ore on the island and Pure White cabinets — a designer-tested whole-house palette that holds up under both warm-bulb evening light and cool-LED daylight. See cross-brand equivalents at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/colors/sherwin-williams/agreeable-gray-7029" + UTM,
    board: "Color Palettes",
  },
  {
    id: 3,
    key: "may26-03",
    theme: "soft-black",
    format: "exterior",
    name: "Iron Ore Front Door",
    image: "Iron Ore Front Door.png",
    prompt:
      "Vertical 2:3 pin showing a residential house exterior. The siding around the entry is painted Alabaster. The front door is painted Iron Ore. Brass mailbox mounted next to the door, terracotta planter with native succulents on the porch, exposed white oak porch beam overhead, late-afternoon golden hour light raking across the siding. Two color swatches overlay the bottom-left corner: Iron Ore (HEX #43484C, RGB 67, 72, 76, LRV 6, Undertone Cool), Alabaster (HEX #ECE3D7, RGB 236, 227, 215, LRV 82, Undertone Warm) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Iron Ore Front Door — SW 7069 Soft Black Paint Color",
    description:
      "Sherwin-Williams Iron Ore SW 7069 is the off-black favorite for modern farmhouse and craftsman front doors. LRV 6 — deep enough to anchor the exterior without going pure black. Paired with Alabaster siding for the cleanest contrast. See the full PaintColorHQ guide to Iron Ore including 14-brand cross-matches.",
    link: "https://www.paintcolorhq.com/colors/sherwin-williams/iron-ore-7069" + UTM,
    board: "Color Palettes",
  },
  {
    id: 4,
    key: "may26-04",
    theme: "white",
    format: "comparison",
    name: "Best Whites Side-by-Side",
    image: "Best Whites Side-by-Side.png",
    prompt:
      "Vertical 2:3 pin showing three vertical wall panels side-by-side under soft north-facing daylight, each panel painted a different white and labeled. Three color swatches overlay the bottom-left corner: Chantilly Lace (HEX #F5F1EB, RGB 245, 241, 235, LRV 92.3, Undertone Neutral), Pure White (HEX #F3EEE0, RGB 243, 238, 224, LRV 83.7, Undertone Warm), White Dove (HEX #EDE6D3, RGB 237, 230, 211, LRV 83, Undertone Warm) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), brand, HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all six fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 92.3, not 923).",
    title: "Best White Paint Colors Compared — Chantilly Lace vs Pure White vs White Dove",
    description:
      "The three most-specified residential whites compared side-by-side: Benjamin Moore Chantilly Lace (LRV 92.3, true white), Sherwin-Williams Pure White (LRV 83.7, warm), Benjamin Moore White Dove (LRV 83, warmest of the three). Choose by undertone — full guide and where to buy at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/best-white-paint-colors-guide" + UTM,
    board: "Color Comparisons",
  },
  {
    id: 5,
    key: "may26-05",
    theme: "sage",
    format: "bathroom",
    name: "Sage Bathroom",
    image: "Sage Bathroom.png",
    prompt:
      "Vertical 2:3 pin showing a small bathroom. The walls are painted Evergreen Fog. The ceiling, door trim, and crown molding are painted Pure White. The floating vanity cabinet is painted Saybrook Sage (a lighter sage that contrasts gently against the deeper Evergreen Fog walls). White subway tile shower with unlacquered brass shower fixture, round rattan-framed mirror, eucalyptus stems in a stoneware vase on the vanity. Three color swatches overlay the bottom-left corner: Evergreen Fog (HEX #95A18D, RGB 149, 161, 141, LRV 30, Undertone Cool Green), Pure White (HEX #F3EEE0, RGB 243, 238, 224, LRV 83.7, Undertone Warm), Saybrook Sage (HEX #B2BAA4, RGB 178, 186, 164, LRV 46.4, Undertone Cool Green) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Sage Bathroom Palette — Evergreen Fog with White Subway Tile",
    description:
      "Sherwin-Williams Evergreen Fog SW 9130 in a small bathroom with white subway tile, unlacquered brass fixtures, and white oak vanity. LRV 30 — deep enough to feel intentional in a windowless room, soft enough to stay calming. Saybrook Sage and Pure White complete the palette. Full sage paint guide at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/best-bathroom-paint-colors" + UTM,
    board: "Color Palettes",
  },
  {
    id: 6,
    key: "may26-06",
    theme: "navy",
    format: "kitchen",
    name: "Naval Kitchen Cabinets",
    image: "Naval Kitchen Cabinets.png",
    prompt:
      "Vertical 2:3 pin showing a transitional kitchen. The lower shaker cabinets are painted Naval. The upper cabinets and main kitchen walls are painted Pure White. Visible through a wide cased opening to the adjacent dining area, the dining-room wall is painted Accessible Beige (warm neutral contrast against the cool Pure White kitchen). Honed white marble countertop with light gray veining, brass cabinet hardware, three brass-shaded pendant lights over the island. Three color swatches overlay the bottom-left corner: Naval (HEX #34405A, RGB 52, 64, 90, LRV 4.5, Undertone Cool Blue), Pure White (HEX #F3EEE0, RGB 243, 238, 224, LRV 83.7, Undertone Warm), Accessible Beige (HEX #D1C4A9, RGB 209, 196, 169, LRV 57.9, Undertone Warm Neutral) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Naval Kitchen Cabinets — SW 6244 Navy with White Marble",
    description:
      "Sherwin-Williams Naval SW 6244 (LRV 4.5, deep cool navy) on lower cabinets with Pure White uppers, honed marble counters, and unlacquered brass hardware. The two-tone cabinet trend that's stayed in style for a decade. Accessible Beige as the adjacent dining wall keeps the palette warm. See Naval in real rooms and find where to buy it at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/best-sherwin-williams-kitchen-colors" + UTM,
    board: "Color Palettes",
  },
  {
    id: 7,
    key: "may26-07",
    theme: "pink",
    format: "nursery",
    name: "Pink Hydrangea Nursery",
    image: "Pink Hydrangea Nursery.png",
    prompt:
      "Vertical 2:3 pin showing a gender-neutral nursery. The three main walls are painted Pink Hydrangea. The ceiling, door trim, and window casing are painted Simply White. The accent wall behind the crib is painted Saybrook Sage (sage-green contrast that anchors the pink without competing). Blonde-wood crib placed against the Saybrook Sage accent wall, white rattan rocking chair, ivory wool flatweave rug, brass mobile hanging over the crib, single eucalyptus garland above the crib. Soft morning light from a left-side window. Three color swatches overlay the bottom-left corner: Pink Hydrangea (HEX #FEB6D4, RGB 254, 182, 212, LRV 62, Undertone Warm Pink), Simply White (HEX #F1EDE3, RGB 241, 237, 227, LRV 92.5, Undertone Warm), Saybrook Sage (HEX #B2BAA4, RGB 178, 186, 164, LRV 46.4, Undertone Cool Green) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Pink Hydrangea Nursery — Soft Pink Paint Color Palette",
    description:
      "Behr Pink Hydrangea 160A-3 (LRV 62, warm soft pink) in a gender-neutral nursery with blonde wood, white rattan, ivory wool, and brass accents. Sage green accent wall (Saybrook Sage) adds contrast that keeps the pink from reading too sweet. Pinks transition through life stages — perfect for nursery-to-toddler-to-guest-room. Full nursery paint guide at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/best-nursery-paint-colors" + UTM,
    board: "Color Palettes",
  },
  {
    id: 8,
    key: "may26-08",
    theme: "plum-brown",
    format: "dining-room",
    name: "Cinnamon Slate Dining Room",
    image: "Cinnamon Slate Dining Room.png",
    prompt:
      "Vertical 2:3 pin showing a moody dining room. The main dining-room walls are painted Cinnamon Slate. The ceiling, crown molding, baseboard, and door trim are painted Chantilly Lace. Visible through a cased doorway opening to an adjacent powder room, the powder-room wall is painted Hale Navy (the navy reads as a deeper architectural accent through the doorway). Brass linear chandelier over a walnut pedestal dining table, six cream-linen upholstered dining chairs, two brass candlesticks on the table, single arched gold-framed mirror on the focal Cinnamon Slate wall. Evening light, candles lit. Three color swatches overlay the bottom-left corner: Cinnamon Slate (HEX #7B5B4C, RGB 123, 91, 76, LRV 14, Undertone Warm Plum-Brown), Chantilly Lace (HEX #F5F1EB, RGB 245, 241, 235, LRV 92.3, Undertone Neutral), Hale Navy (HEX #3E4450, RGB 62, 68, 80, LRV 7.1, Undertone Cool Blue) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Cinnamon Slate Dining Room — Benjamin Moore 2025 Color of the Year",
    description:
      "Benjamin Moore Cinnamon Slate 2113-40 (LRV 14, heathered plum-brown) — the 2025 Color of the Year — in a moody candlelit dining room with walnut, cream linen, and brass. Chantilly Lace on the trim keeps the contrast crisp. Hale Navy as a powder-room accent extends the palette. Full 2025 Color of the Year comparison at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/2025-colors-of-the-year-every-brand-compared" + UTM,
    board: "Color Palettes",
  },
  {
    id: 9,
    key: "may26-09",
    theme: "green",
    format: "color-drench",
    name: "Hidden Gem Mudroom (Color-Drenched)",
    image: "Hidden Gem Mudroom (Color-Drenched).png",
    prompt:
      "Vertical 2:3 pin showing a small mudroom color-drenched in Hidden Gem — the walls, lower cabinets, open shelving, and ceiling are all painted Hidden Gem (single-color drench creates an enveloping monochrome effect). The exterior door visible at one end of the mudroom is painted White Dove (the warm-white door functions as the single bright contrast against the all-over Hidden Gem drench). Unlacquered brass coat hooks mounted on the wall, three woven baskets on open shelves, a white oak bench with a cream wool throw, terracotta hexagonal floor tile. Two color swatches overlay the bottom-left corner: Hidden Gem (HEX #596D69, RGB 89, 109, 105, LRV 14.1, Undertone Cool Green), White Dove (HEX #EDE6D3, RGB 237, 230, 211, LRV 83, Undertone Warm) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Hidden Gem Mudroom — Behr 2026 Color of the Year, Color-Drenched",
    description:
      "Behr Hidden Gem N430-6A (LRV 14.1, smoky jade green) — the 2026 Color of the Year — color-drenched across walls, cabinets, and ceiling in a small mudroom. The green undertone neutralizes the harsh cast of cool LED bulbs in a way no navy can. Brass hooks, terracotta tile, white oak bench complete the palette. Full 2026 Color of the Year guide at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/blog/2026-colors-of-the-year-every-brand-compared" + UTM,
    board: "Color Palettes",
  },
  {
    id: 10,
    key: "may26-10",
    theme: "blue-green",
    format: "kitchen",
    name: "Sea Salt Cottage Kitchen",
    image: "Sea Salt Cottage Kitchen.png",
    prompt:
      "Vertical 2:3 pin showing a cottage-style kitchen. The walls are painted Sea Salt. The upper shaker cabinets are painted Pure White. The island base is painted Iron Ore (deep cool contrast that anchors the soft Sea Salt walls and Pure White uppers). White quartz countertop with subtle gray veining, brass cup pulls and knobs on the cabinetry, two glass-shaded brass pendants hanging over the Iron Ore island, an open shelf with cream stoneware. Bright morning light. Three color swatches overlay the bottom-left corner: Sea Salt (HEX #CBD1C2, RGB 203, 209, 194, LRV 63.3, Undertone Cool Blue-Green), Pure White (HEX #F3EEE0, RGB 243, 238, 224, LRV 83.7, Undertone Warm), Iron Ore (HEX #43484C, RGB 67, 72, 76, LRV 6, Undertone Cool) — render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. Use clean sans-serif text (Inter or Helvetica), no decorative styling. Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. Preserve decimal points in LRV values (e.g. 7.1, not 71).",
    title: "Sea Salt Kitchen Palette — SW 6204 with Pure White Cabinets",
    description:
      "Sherwin-Williams Sea Salt SW 6204 (LRV 63.3) is the rare blue-green that reads as either pale blue or pale green depending on the light — perfect for a cottage kitchen with white shaker cabinets and brass cup pulls. Iron Ore on the island base adds anchoring depth. One of SW's top-selling colors for a decade. Cross-brand matches at PaintColorHQ.",
    link: "https://www.paintcolorhq.com/colors/sherwin-williams/sea-salt-6204" + UTM,
    board: "Color Palettes",
  },
];
