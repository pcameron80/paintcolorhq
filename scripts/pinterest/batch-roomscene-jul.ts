// Pinterest batch — July 2026 room-scene palettes (campaign: roomscene-jul-2026)
// Styled photoreal room scenes (NOT the programmatic /api/pin/palette swatch
// stacks) — the visual style Philip wants more of (cf. restock-27 "Pale Taupe
// Entryway"). Reuses buildPrompt() for identical rendering rules + the anti-
// Gemini-quirk guards. All color data DB-verified 2026-06-25.
import type { PinSpec } from "./batch-may26.ts";
import { buildPrompt, type Swatch } from "./batch-jun-restock.ts";

const C = {
  // mains
  seaSalt: { name: "Sea Salt", hex: "#CDD2CA", rgb: "205, 210, 202", lrv: "63.3", undertone: "Neutral" },
  evergreenFog: { name: "Evergreen Fog", hex: "#95978A", rgb: "149, 151, 138", lrv: "30.4", undertone: "Warm Golden" },
  urbaneBronze: { name: "Urbane Bronze", hex: "#54504A", rgb: "84, 80, 74", lrv: "8.1", undertone: "Warm Golden" },
  cavernClay: { name: "Cavern Clay", hex: "#AC6B53", rgb: "172, 107, 83", lrv: "19.9", undertone: "Warm Golden" },
  hawthorneYellow: { name: "Hawthorne Yellow", hex: "#F6E2A5", rgb: "246, 226, 165", lrv: "71.3", undertone: "Neutral" },
  haleNavy: { name: "Hale Navy", hex: "#444C57", rgb: "68, 76, 87", lrv: "7.1", undertone: "Neutral" },
  tricornBlack: { name: "Tricorn Black", hex: "#2F2F30", rgb: "47, 47, 48", lrv: "2.9", undertone: "Neutral" },
  reverePewter: { name: "Revere Pewter", hex: "#CCC7B9", rgb: "204, 199, 185", lrv: "55.1", undertone: "Neutral" },
  chinesePorcelain: { name: "Chinese Porcelain", hex: "#3A5F7D", rgb: "58, 95, 125", lrv: "10.6", undertone: "Neutral" },
  whiteDove: { name: "White Dove", hex: "#F3EFE0", rgb: "243, 239, 224", lrv: "83.2", undertone: "Neutral" },
  accessibleBeige: { name: "Accessible Beige", hex: "#D1C7B8", rgb: "209, 199, 184", lrv: "57.9", undertone: "Neutral" },
  crackedPepper: { name: "Cracked Pepper", hex: "#4F5152", rgb: "79, 81, 82", lrv: "8.2", undertone: "Neutral" },
  // supporting (trim / accent)
  pureWhite: { name: "Pure White", hex: "#EDECE6", rgb: "237, 236, 230", lrv: "83.7", undertone: "Neutral" },
  greekVilla: { name: "Greek Villa", hex: "#F0ECE2", rgb: "240, 236, 226", lrv: "84", undertone: "Neutral" },
  alabaster: { name: "Alabaster", hex: "#EDEAE0", rgb: "237, 234, 224", lrv: "82.2", undertone: "Neutral" },
  shojiWhite: { name: "Shoji White", hex: "#E6DFD3", rgb: "230, 223, 211", lrv: "74.3", undertone: "Neutral" },
  driftOfMist: { name: "Drift of Mist", hex: "#DCD8D0", rgb: "220, 216, 208", lrv: "68.9", undertone: "Neutral" },
} satisfies Record<string, Swatch>;

const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=roomscene-jul-2026";
const SITE = "https://www.paintcolorhq.com";

export const BATCH: PinSpec[] = [
  {
    id: 1, key: "roomscene-01", theme: "green", format: "bathroom",
    name: "Sea Salt Spa Bathroom",
    image: "Sea Salt Spa Bathroom.png",
    prompt: buildPrompt(
      "A calm spa-like bathroom. The walls are painted Sea Salt (a soft, hushed green-gray). The trim, shaker vanity, and beadboard wainscot are painted Pure White. Brushed-nickel fixtures, a framed mirror, a folded white linen towel, and a small potted eucalyptus. Soft natural daylight from a frosted window.",
      [C.seaSalt, C.pureWhite],
    ),
    title: "Sea Salt Spa Bathroom — Sherwin-Williams Soft Green",
    description:
      "Sherwin-Williams Sea Salt 6204 (LRV 63.3) is the spa-bathroom favorite — a soft green-gray that reads serene and clean against Pure White trim and nickel fixtures. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/sea-salt-6204${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 2, key: "roomscene-02", theme: "sage", format: "bedroom",
    name: "Evergreen Fog Bedroom",
    image: "Evergreen Fog Bedroom.png",
    prompt: buildPrompt(
      "A restful bedroom with a deep sage feature wall painted Evergreen Fog. The remaining walls, trim, and ceiling are painted White Dove. A natural oak bed, white linen bedding, a woven jute rug, and a brass picture light over the headboard. Warm late-afternoon daylight.",
      [C.evergreenFog, C.whiteDove],
    ),
    title: "Evergreen Fog Bedroom — Sherwin-Williams Sage",
    description:
      "Sherwin-Williams Evergreen Fog 9130 (LRV 30.4) — the 2022 Color of the Year, a sophisticated gray-sage that grounds a bedroom without going dark. Paired with White Dove trim and warm oak. See it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/evergreen-fog-9130${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 3, key: "roomscene-03", theme: "brown", format: "study",
    name: "Urbane Bronze Study",
    image: "Urbane Bronze Study.png",
    prompt: buildPrompt(
      "A moody home study. The walls and built-in bookshelves are color-drenched in Urbane Bronze (a deep warm bronze-brown). The ceiling and crown are painted Shoji White. A walnut desk, a leather chair, brass library lamp, and stacked books. Low warm lamplight, evening mood.",
      [C.urbaneBronze, C.shojiWhite],
    ),
    title: "Urbane Bronze Study — Sherwin-Williams Warm Bronze",
    description:
      "Sherwin-Williams Urbane Bronze 7048 (LRV 8.1) color-drenched on walls and built-ins makes a study feel like a private library — a deep warm bronze that pairs with walnut, brass, and Shoji White ceilings. Discover it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/urbane-bronze-7048${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 4, key: "roomscene-04", theme: "terracotta", format: "dining-nook",
    name: "Cavern Clay Dining Nook",
    image: "Cavern Clay Dining Nook.png",
    prompt: buildPrompt(
      "A sunny southwestern dining nook with an accent wall painted Cavern Clay (a warm terracotta). The adjoining walls and trim are painted Greek Villa. A round oak table, woven rattan chairs, a stoneware vase, and a hanging pendant. Bright warm midday light.",
      [C.cavernClay, C.greekVilla],
    ),
    title: "Cavern Clay Dining Nook — Sherwin-Williams Terracotta",
    description:
      "Sherwin-Williams Cavern Clay 7701 (LRV 19.9) brings warm, earthy terracotta to a dining nook — a 1970s-inspired clay that glows against Greek Villa and natural rattan. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/cavern-clay-7701${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 5, key: "roomscene-05", theme: "yellow", format: "breakfast-nook",
    name: "Hawthorne Yellow Breakfast Nook",
    image: "Hawthorne Yellow Breakfast Nook.png",
    prompt: buildPrompt(
      "A cheerful breakfast nook with walls painted Hawthorne Yellow (a soft buttery yellow). The wainscot and trim are painted White Dove. A white bistro table, ladder-back chairs, a vase of fresh flowers, and a window with linen cafe curtains. Bright cheerful morning light.",
      [C.hawthorneYellow, C.whiteDove],
    ),
    title: "Hawthorne Yellow Breakfast Nook — Benjamin Moore Soft Yellow",
    description:
      "Benjamin Moore Hawthorne Yellow HC-4 (LRV 71.3) is the classic warm-but-not-acidic yellow for a breakfast nook — cheerful in morning light, grounded by White Dove trim. Discover it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/hawthorne-yellow-hc-4${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 6, key: "roomscene-06", theme: "navy", format: "dining-room",
    name: "Hale Navy Dining Room",
    image: "Hale Navy Dining Room.png",
    prompt: buildPrompt(
      "An elegant formal dining room with walls painted Hale Navy (a deep, slightly muted navy). The wainscot, trim, and ceiling are painted White Dove. A dark wood table, upholstered linen chairs, a brass chandelier, and a gilt mirror. Soft evening light from sconces.",
      [C.haleNavy, C.whiteDove],
    ),
    title: "Hale Navy Dining Room — Benjamin Moore Deep Navy",
    description:
      "Benjamin Moore Hale Navy HC-154 (LRV 7.1) is the dinner-party navy — deep and timeless, dramatic above White Dove wainscot with brass and warm wood. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/hale-navy-hc-154${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 7, key: "roomscene-07", theme: "black", format: "kitchen",
    name: "Tricorn Black Kitchen Island",
    image: "Tricorn Black Kitchen Island.png",
    prompt: buildPrompt(
      "A modern farmhouse kitchen with a bold island painted Tricorn Black (a true near-black). The perimeter cabinets and trim are painted Pure White. White marble counters, brass hardware and faucet, white oak floors, and pendant lights over the island. Bright clean daylight.",
      [C.tricornBlack, C.pureWhite],
    ),
    title: "Tricorn Black Kitchen Island — Sherwin-Williams True Black",
    description:
      "Sherwin-Williams Tricorn Black 6258 (LRV 2.9) is the go-to true black for a statement kitchen island — crisp against Pure White perimeter cabinets, brass, and white oak. Discover it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/tricorn-black-6258${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 8, key: "roomscene-08", theme: "greige", format: "entryway",
    name: "Revere Pewter Entryway",
    image: "Revere Pewter Entryway.png",
    prompt: buildPrompt(
      "A welcoming entryway with walls painted Revere Pewter (a warm greige). The trim, doors, and a console-height bench are painted White Dove. A round mirror, a slim wood console with a brass lamp, a woven runner, and hooks with a linen tote. Bright daylight from a sidelight.",
      [C.reverePewter, C.whiteDove],
    ),
    title: "Revere Pewter Entryway — Benjamin Moore Warm Greige",
    description:
      "Benjamin Moore Revere Pewter HC-172 (LRV 55.1) is the most-loved warm greige for an entryway — flattering in any light, easy with White Dove trim and wood floors. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/revere-pewter-hc-172${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 9, key: "roomscene-09", theme: "blue", format: "powder-room",
    name: "Chinese Porcelain Powder Room",
    image: "Chinese Porcelain Powder Room.png",
    prompt: buildPrompt(
      "A jewel-box powder room color-drenched in Chinese Porcelain (a deep classic blue) on walls and ceiling. The vanity and trim are painted Alabaster. A brass faucet and sconces, a round mirror, a marble counter, and a small framed print. Warm intimate lighting.",
      [C.chinesePorcelain, C.alabaster],
    ),
    title: "Chinese Porcelain Powder Room — PPG Deep Blue",
    description:
      "PPG Chinese Porcelain 1160-6 (LRV 10.6) — PPG's 2020 Color of the Year, a deep classic blue that turns a powder room into a jewel box with brass and Alabaster trim. Discover it at PaintColorHQ.",
    link: `${SITE}/colors/ppg/chinese-porcelain-1160-6${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 10, key: "roomscene-10", theme: "white", format: "kitchen",
    name: "White Dove Kitchen",
    image: "White Dove Kitchen.png",
    prompt: buildPrompt(
      "A bright all-white kitchen with shaker cabinets and trim painted White Dove (a soft warm white). Honed white-and-gray marble counters, a white oak island top, brushed-brass hardware, and a window over the sink. Abundant natural daylight, airy and clean.",
      [C.whiteDove, C.driftOfMist],
    ),
    title: "White Dove Kitchen — Benjamin Moore Warm White",
    description:
      "Benjamin Moore White Dove OC-17 (LRV 83.2) is the most trusted soft warm white for kitchen cabinets — never stark, never yellow, beautiful with marble, brass, and oak. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/white-dove-oc-17${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 11, key: "roomscene-11", theme: "greige", format: "living-room",
    name: "Accessible Beige Living Room",
    image: "Accessible Beige Living Room.png",
    prompt: buildPrompt(
      "A warm, inviting living room with walls painted Accessible Beige (a warm greige). The trim, fireplace surround, and ceiling are painted Pure White. A linen sofa, a walnut coffee table, a jute rug, and a brass floor lamp. Soft warm afternoon light.",
      [C.accessibleBeige, C.pureWhite],
    ),
    title: "Accessible Beige Living Room — Sherwin-Williams Warm Greige",
    description:
      "Sherwin-Williams Accessible Beige 7036 (LRV 57.9) is the all-around warm greige for a living room — cozy without going dark, flattering against Pure White trim, linen, and walnut. Discover it at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/accessible-beige-7036${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 12, key: "roomscene-12", theme: "charcoal", format: "mudroom",
    name: "Cracked Pepper Mudroom",
    image: "Cracked Pepper Mudroom.png",
    prompt: buildPrompt(
      "An organized mudroom with built-in lockers and bench painted Cracked Pepper (a soft charcoal). The walls, shiplap, and trim are painted Pure White. Brass hooks, woven baskets, a runner over slate-look tile, and a window. Bright clean daylight.",
      [C.crackedPepper, C.pureWhite],
    ),
    title: "Cracked Pepper Mudroom — Behr Soft Charcoal",
    description:
      "Behr Cracked Pepper PPU18-01 (LRV 8.2) is the soft-charcoal that makes mudroom lockers feel intentional — deep but not flat, sharp against Pure White shiplap and brass hooks. Find it and where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/behr/cracked-pepper-ppu18-01${UTM}`,
    board: "Color Palettes",
  },
];
