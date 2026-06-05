// Pinterest batch — June 2026 restock cohort (campaign: restock-jun-2026)
// Second curated batch after may26. All color data verified against the live
// DB (hex / RGB / LRV / undertone) on 2026-05-30; all destination slugs resolve.
//
// Prompts are composed by buildPrompt() so the rendering rules (single combined
// label, no HEX char substitution, preserve LRV decimals, sans-serif) are
// identical across every pin — see reference_gemini-image-rendering-quirks.

import type { PinSpec } from "./batch-may26.ts";

export interface Swatch {
  name: string;
  hex: string;
  rgb: string;
  lrv: string;
  undertone: string;
}

// --- verified color data (DB, 2026-05-30) ---
const C = {
  tricornBlack: { name: "Tricorn Black", hex: "#2F2F30", rgb: "47, 47, 48", lrv: "2.9", undertone: "Neutral" },
  reposeGray: { name: "Repose Gray", hex: "#CCC9C0", rgb: "204, 201, 192", lrv: "58.4", undertone: "Neutral" },
  urbaneBronze: { name: "Urbane Bronze", hex: "#54504A", rgb: "84, 80, 74", lrv: "8.1", undertone: "Warm Golden" },
  pewterGreen: { name: "Pewter Green", hex: "#5E6259", rgb: "94, 98, 89", lrv: "11.8", undertone: "Warm Golden" },
  driftOfMist: { name: "Drift of Mist", hex: "#DCD8D0", rgb: "220, 216, 208", lrv: "68.9", undertone: "Neutral" },
  manchesterTan: { name: "Manchester Tan", hex: "#DCD3BD", rgb: "220, 211, 189", lrv: "63.2", undertone: "Neutral" },
  cavernClay: { name: "Cavern Clay", hex: "#AC6B53", rgb: "172, 107, 83", lrv: "19.9", undertone: "Warm Golden" },
  newburyportBlue: { name: "Newburyport Blue", hex: "#475667", rgb: "71, 86, 103", lrv: "9", undertone: "Neutral" },
  firstLight: { name: "First Light", hex: "#F0E3DF", rgb: "240, 227, 223", lrv: "75.9", undertone: "Neutral" },
  shojiWhite: { name: "Shoji White", hex: "#E6DFD3", rgb: "230, 223, 211", lrv: "74.3", undertone: "Neutral" },
  crackedPepper: { name: "Cracked Pepper", hex: "#4F5152", rgb: "79, 81, 82", lrv: "8.2", undertone: "Neutral" },
  chinesePorcelain: { name: "Chinese Porcelain", hex: "#3A5F7D", rgb: "58, 95, 125", lrv: "10.6", undertone: "Neutral" },
  hawthorneYellow: { name: "Hawthorne Yellow", hex: "#F6E2A5", rgb: "246, 226, 165", lrv: "71.3", undertone: "Neutral" },
  alabaster: { name: "Alabaster", hex: "#EDEAE0", rgb: "237, 234, 224", lrv: "82.2", undertone: "Neutral" },
  greekVilla: { name: "Greek Villa", hex: "#F0ECE2", rgb: "240, 236, 226", lrv: "84", undertone: "Neutral" },
  reverePewter: { name: "Revere Pewter", hex: "#CCC7B9", rgb: "204, 199, 185", lrv: "55.1", undertone: "Neutral" },
  agreeableGray: { name: "Agreeable Gray", hex: "#D1CBC1", rgb: "209, 203, 193", lrv: "60", undertone: "Warm Neutral" },
} satisfies Record<string, Swatch>;

export function buildPrompt(scene: string, swatches: Swatch[]): string {
  const list = swatches
    .map((s) => `${s.name} (HEX ${s.hex}, RGB ${s.rgb}, LRV ${s.lrv}, Undertone ${s.undertone})`)
    .join(", ");
  return (
    `Vertical 2:3 pin. ${scene} ` +
    `${swatches.length} color ${swatches.length === 1 ? "swatch overlays" : "swatches overlay"} the bottom-left corner: ${list} — ` +
    `render EXACTLY ONE swatch label per color, no more, no less. Each label is a single rectangular block containing all of that color's data combined into one box: name (bold), HEX, RGB, LRV, and Undertone all in the same block. ` +
    `CRITICAL: do not render Undertone in a separate label from the HEX/RGB/LRV data — all five fields belong in ONE label per color. ` +
    `Use clean sans-serif text (Inter or Helvetica), no decorative styling. ` +
    `Render HEX codes as exact alphanumeric strings — do not substitute D for O, B for 8, or R for K. ` +
    `Preserve decimal points in LRV values (e.g. 7.1, not 71).`
  );
}

const UTM = "?utm_source=Pinterest&utm_medium=organic&utm_campaign=restock-jun-2026";
const SITE = "https://www.paintcolorhq.com";

export const BATCH: PinSpec[] = [
  {
    id: 1, key: "restock-01", theme: "black", format: "home-office",
    name: "Tricorn Black Home Office",
    image: "Tricorn Black Home Office.png",
    prompt: buildPrompt(
      "A modern home office. The wall behind the desk is painted Tricorn Black (deep near-black). The ceiling, door, and window trim are painted Alabaster. A white oak desk with slim black legs sits against the black wall, a brass desk lamp, a leather chair, open black metal shelving with books and ceramics, a potted snake plant. Bright daylight from a window on the right.",
      [C.tricornBlack, C.alabaster],
    ),
    title: "Tricorn Black Home Office — SW 6258 Near-Black Accent Wall",
    description:
      "Sherwin-Williams Tricorn Black SW 6258 (LRV 2.9) on a home-office accent wall with Alabaster trim, white oak, and brass. The truest near-black SW makes — no blue or green cast — so it reads as a crisp, confident backdrop for shelving and art. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/tricorn-black-6258${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 2, key: "restock-02", theme: "greige", format: "living-room",
    name: "Repose Gray Living Room",
    image: "Repose Gray Living Room.png",
    prompt: buildPrompt(
      "A bright transitional living room. The walls are painted Repose Gray (soft warm greige). The trim, ceiling, and built-ins are painted Alabaster. A cream linen sofa, walnut coffee table, woven jute rug, brass floor lamp, and a large window with linen drapes. Soft natural daylight.",
      [C.reposeGray, C.alabaster],
    ),
    title: "Repose Gray Living Room — SW 7015 Warm Greige Paint Color",
    description:
      "Sherwin-Williams Repose Gray SW 7015 (LRV 58.4) is the warm greige that stays neutral without going cold — a reliable whole-room wall color in north- and south-facing light alike. Paired with Alabaster trim, walnut, and cream linen. Find these colors and where to buy them at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/repose-gray-7015${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 3, key: "restock-03", theme: "bronze", format: "dining-room",
    name: "Urbane Bronze Dining Room",
    image: "Urbane Bronze Dining Room.png",
    prompt: buildPrompt(
      "A moody dining room color-drenched in Urbane Bronze — the walls, trim, and ceiling are all painted Urbane Bronze (warm deep brown-gray). The adjacent ceiling line and a single doorway reveal Greek Villa as the bright contrast. A walnut pedestal table, cream linen chairs, a brass linear chandelier, and two lit taper candles. Warm evening light.",
      [C.urbaneBronze, C.greekVilla],
    ),
    title: "Urbane Bronze Dining Room — SW 7048 Color-Drenched",
    description:
      "Sherwin-Williams Urbane Bronze SW 7048 (LRV 8.1) — the 2021 Color of the Year — color-drenched across a dining room's walls, trim, and ceiling for an enveloping, intimate effect. Its warm golden undertone keeps the deep brown-gray from feeling cold. Greek Villa as the bright relief. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/urbane-bronze-7048${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 4, key: "restock-04", theme: "green", format: "kitchen",
    name: "Pewter Green Kitchen",
    image: "Pewter Green Kitchen.png",
    prompt: buildPrompt(
      "A transitional kitchen. The lower shaker cabinets and island are painted Pewter Green (deep muted green). The upper cabinets and walls are painted Alabaster. Honed white marble countertop, unlacquered brass hardware and faucet, white oak floors, two brass pendant lights over the island. Bright morning light.",
      [C.pewterGreen, C.alabaster],
    ),
    title: "Pewter Green Kitchen Cabinets — SW 6208 Deep Green",
    description:
      "Sherwin-Williams Pewter Green SW 6208 (LRV 11.8) on lower cabinets and island with Alabaster uppers, honed marble, and unlacquered brass. A deep green with a warm golden undertone that reads sophisticated rather than cold — the two-tone kitchen that ages well. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/pewter-green-6208${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 5, key: "restock-05", theme: "soft-gray", format: "bathroom",
    name: "Drift of Mist Bathroom",
    image: "Drift of Mist Bathroom.png",
    prompt: buildPrompt(
      "An airy bathroom. The walls are painted Drift of Mist (soft pale gray). The trim, ceiling, and vanity are painted Greek Villa. White subway tile shower, polished nickel fixtures, a round mirror, a marble-topped vanity, and eucalyptus in a glass vase. Bright even daylight.",
      [C.driftOfMist, C.greekVilla],
    ),
    title: "Drift of Mist Bathroom — SW 9166 Soft Gray Paint Color",
    description:
      "Sherwin-Williams Drift of Mist SW 9166 (LRV 68.9) is the barely-there soft gray that keeps a bathroom feeling clean and light without going stark white. Paired with Greek Villa trim, white tile, and polished nickel. Reads neutral in the bright, even light of a windowed bath. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/drift-of-mist-9166${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 6, key: "restock-06", theme: "tan", format: "bedroom",
    name: "Manchester Tan Bedroom",
    image: "Manchester Tan Bedroom.png",
    prompt: buildPrompt(
      "A calm bedroom. The walls are painted Manchester Tan (warm light tan). The trim, ceiling, and headboard wall niche are painted Alabaster. An upholstered linen bed, white oak nightstands, brass sconces, a wool flatweave rug, and soft morning light from a left-side window.",
      [C.manchesterTan, C.alabaster],
    ),
    title: "Manchester Tan Bedroom — BM HC-81 Warm Neutral",
    description:
      "Benjamin Moore Manchester Tan HC-81 (LRV 63.2) is the warm light tan that makes a bedroom feel restful and grounded — soft enough for walls, warm enough to flatter both linen and wood. Paired with Alabaster trim and brass. Find these colors and where to buy them at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/manchester-tan-hc-81${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 7, key: "restock-07", theme: "terracotta", format: "sunroom",
    name: "Cavern Clay Sunroom",
    image: "Cavern Clay Sunroom.png",
    prompt: buildPrompt(
      "A boho sunroom. The walls are painted Cavern Clay (warm terracotta). The trim and ceiling are painted Greek Villa. A rattan lounge chair, ivory bouclé cushions, a low travertine table, trailing pothos and a fiddle-leaf fig, a jute rug, and abundant natural light through tall windows.",
      [C.cavernClay, C.greekVilla],
    ),
    title: "Cavern Clay Sunroom — SW 7701 Terracotta Paint Color",
    description:
      "Sherwin-Williams Cavern Clay SW 7701 (LRV 19.9) — a warm, earthy terracotta with a golden undertone — wraps a sunroom in southwestern warmth without reading orange. Paired with Greek Villa trim, rattan, travertine, and greenery. Best in the strong natural light it was made for. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/cavern-clay-7701${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 8, key: "restock-08", theme: "blue", format: "library",
    name: "Newburyport Blue Library",
    image: "Newburyport Blue Library.png",
    prompt: buildPrompt(
      "A cozy library reading nook color-drenched in Newburyport Blue — the walls and floor-to-ceiling built-in bookshelves are all painted Newburyport Blue (deep slate blue). The crown molding and window trim are painted Greek Villa. A leather wingback chair, a brass library lamp, a stack of books, and warm lamplight in the evening.",
      [C.newburyportBlue, C.greekVilla],
    ),
    title: "Newburyport Blue Library — BM HC-155 Deep Slate Blue",
    description:
      "Benjamin Moore Newburyport Blue HC-155 (LRV 9) color-drenched across a reading nook's walls and built-in shelving creates an enveloping, library-quiet feel. A deep slate blue that anchors a room without the heaviness of black. Greek Villa trim keeps the edges crisp. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/newburyport-blue-hc-155${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 9, key: "restock-09", theme: "blush", format: "nursery",
    name: "First Light Nursery",
    image: "First Light Nursery.png",
    prompt: buildPrompt(
      "A serene nursery. The walls are painted First Light (soft blush). The trim, ceiling, and crib wall are painted Greek Villa. A blonde-wood crib, an ivory bouclé glider, a jute rug, a brass mobile, and a single eucalyptus garland above the crib. Soft morning light from a left-side window.",
      [C.firstLight, C.greekVilla],
    ),
    title: "First Light Nursery — BM 2102-70 Soft Blush Paint Color",
    description:
      "Benjamin Moore First Light 2102-70 (LRV 75.9) — the 2020 Color of the Year — is the soft, barely-there blush that suits a gender-neutral nursery and grows with the room from baby to big-kid. Paired with Greek Villa trim, blonde wood, and brass. Find these colors and where to buy them at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/first-light-2102-70${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 10, key: "restock-10", theme: "white", format: "color-drench",
    name: "Shoji White Entry Drench",
    image: "Shoji White Entry Drench.png",
    prompt: buildPrompt(
      "A welcoming entry hall color-drenched in Shoji White — the walls, trim, ceiling, and a built-in bench are all painted Shoji White (warm soft white). The single front door is painted Urbane Bronze as the one dark contrast. Unlacquered brass hooks, a woven basket, a runner rug, and bright daylight through a sidelight window.",
      [C.shojiWhite, C.urbaneBronze],
    ),
    title: "Shoji White Entryway — SW 7042 Warm White, Color-Drenched",
    description:
      "Sherwin-Williams Shoji White SW 7042 (LRV 74.3) color-drenched across an entry's walls, trim, and ceiling gives a soft, seamless warmth that a stark white can't. A single Urbane Bronze door adds the contrast. The warm-white that doesn't go yellow or pink in changing light. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/sherwin-williams/shoji-white-7042${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 11, key: "restock-11", theme: "black", format: "exterior",
    name: "Cracked Pepper Exterior",
    image: "Cracked Pepper Exterior.png",
    prompt: buildPrompt(
      "A modern farmhouse exterior. The board-and-batten siding is painted Alabaster. The front door, window sashes, and light fixtures are painted Cracked Pepper (soft black). A covered porch with a white oak ceiling, two black-framed lanterns, a terracotta planter with boxwood, and late-afternoon golden light.",
      [C.crackedPepper, C.alabaster],
    ),
    title: "Cracked Pepper Exterior — Behr Soft Black Trim & Door",
    description:
      "Behr Cracked Pepper PPU18-01 (LRV 8.2) on the door, window sashes, and fixtures of an Alabaster modern-farmhouse exterior — a soft black that's deep enough to frame the house without the harshness of true black. Behr's most popular black-neutral. Discover it and find where to buy it at PaintColorHQ.",
    link: `${SITE}/colors/behr/cracked-pepper-ppu18-01${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 12, key: "restock-12", theme: "blue", format: "powder-room",
    name: "Chinese Porcelain Powder Room",
    image: "Chinese Porcelain Powder Room.png",
    prompt: buildPrompt(
      "A dramatic powder room color-drenched in Chinese Porcelain — the walls and ceiling are painted Chinese Porcelain (deep porcelain blue). The trim and wainscot cap are painted Greek Villa. A floating walnut vanity, an unlacquered brass faucet and sconces, a round brass mirror, and warm focused lighting.",
      [C.chinesePorcelain, C.greekVilla],
    ),
    title: "Chinese Porcelain Powder Room — PPG 1160-6 Deep Blue",
    description:
      "PPG Chinese Porcelain 1160-6 (LRV 10.6) — the 2020 PPG Color of the Year — color-drenched in a small powder room is the classic place to be bold: a deep porcelain blue that turns a windowless half-bath into the most memorable room in the house. Greek Villa trim, walnut, and brass. Cross-brand matches at PaintColorHQ.",
    link: `${SITE}/colors/ppg/chinese-porcelain-1160-6${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 13, key: "restock-13", theme: "yellow", format: "breakfast-nook",
    name: "Hawthorne Yellow Breakfast Nook",
    image: "Hawthorne Yellow Breakfast Nook.png",
    prompt: buildPrompt(
      "A cheerful breakfast nook. The walls are painted Hawthorne Yellow (warm buttery yellow). The trim, built-in bench, and ceiling are painted Alabaster. A round white oak table, a cushioned banquette with striped pillows, a brass pendant, a vase of fresh greens, and bright morning sun through a bay window.",
      [C.hawthorneYellow, C.alabaster],
    ),
    title: "Hawthorne Yellow Breakfast Nook — BM HC-4 Warm Yellow",
    description:
      "Benjamin Moore Hawthorne Yellow HC-4 (LRV 71.3) is the warm, buttery yellow that makes a breakfast nook feel sunny even on gray mornings — historic and cheerful without going neon. Paired with Alabaster trim, white oak, and brass. Find these colors and where to buy them at PaintColorHQ.",
    link: `${SITE}/colors/benjamin-moore/hawthorne-yellow-hc-4${UTM}`,
    board: "Color Palettes",
  },
  {
    id: 14, key: "restock-14", theme: "white", format: "comparison",
    name: "Best Warm Whites Compared",
    image: "Best Warm Whites Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even north-facing daylight, each painted a different warm white and clearly distinct from its neighbors. Left panel Alabaster, center panel Greek Villa, right panel Shoji White. A thin white oak shelf runs across all three with a single ceramic vase.",
      [C.alabaster, C.greekVilla, C.shojiWhite],
    ),
    title: "Best Warm White Paint Colors — Alabaster vs Greek Villa vs Shoji White",
    description:
      "The three most-specified Sherwin-Williams warm whites side-by-side: Alabaster (LRV 82.2, soft warm white), Greek Villa (LRV 84, the brightest), and Shoji White (LRV 74.3, the warmest, with the most depth). Choose by how much warmth and softness you want. Full white paint guide at PaintColorHQ.",
    link: `${SITE}/blog/best-white-paint-colors-guide${UTM}`,
    board: "Color Comparisons",
  },
  {
    id: 15, key: "restock-15", theme: "greige", format: "comparison",
    name: "Best Greiges Compared",
    image: "Best Greiges Compared.png",
    prompt: buildPrompt(
      "Three vertical wall panels side-by-side under soft, even daylight, each painted a different greige and clearly distinct from its neighbors. Left panel Agreeable Gray, center panel Repose Gray, right panel Revere Pewter. A thin white oak shelf runs across all three with a small stack of books.",
      [C.agreeableGray, C.reposeGray, C.reverePewter],
    ),
    title: "Best Greige Paint Colors — Agreeable Gray vs Repose Gray vs Revere Pewter",
    description:
      "The three most-searched greiges compared: Sherwin-Williams Agreeable Gray (LRV 60, the balanced standard), Repose Gray (LRV 58.4, a touch cooler), and Benjamin Moore Revere Pewter (LRV 55.1, the warmest and deepest). The whole-house neutrals designers reach for. Browse the full gray & greige collection and find where to buy at PaintColorHQ.",
    link: `${SITE}/colors/family/gray${UTM}`,
    board: "Color Comparisons",
  },
];
