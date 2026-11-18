// Painting-supply shopping list, sized from the paint calculator's inputs.
//
// Quantities err honest over generous — a drop cloth gets moved along the wall,
// a good woven roller cover survives a whole room — because an inflated list
// reads as affiliate padding and kills trust in the tool. Links are tagged
// Amazon *searches* (via getAmazonSearchUrl), never ASINs: listings churn,
// searches don't, so nothing here can rot into a dead product page.

import { getAmazonSearchUrl } from "./affiliate";

export interface SupplyItem {
  /** Short product name, e.g. "Painter's tape" */
  name: string;
  /** The spec that matters — nap size, width, material — and why */
  detail: string;
  /** Human-readable quantity, e.g. "2 rolls" */
  quantity: string;
  /** Tagged Amazon search URL */
  url: string;
}

export interface SupplyListInput {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  doors: number;
  windows: number;
  coats: number;
  gallons: number;
}

/** One 60-yard roll of painter's tape is 180 linear feet. */
const TAPE_FT_PER_ROLL = 180;

/**
 * Build the supply list for a room. Tape scales with the edges you actually
 * tape (baseboards + ceiling line + door and window casings); everything else
 * is flat because one of it genuinely covers a room-sized job.
 */
export function getSupplyList(input: SupplyListInput): SupplyItem[] {
  const { lengthFt, widthFt, doors, windows, coats } = input;

  const perimeter = 2 * (lengthFt + widthFt);
  // Baseboard run + ceiling line + ~17 ft per door casing + ~13 ft per window
  const tapeFeet = perimeter * 2 + doors * 17 + windows * 13;
  const tapeRolls = Math.max(1, Math.ceil(tapeFeet / TAPE_FT_PER_ROLL));

  // One 9x12 canvas cloth (108 sq ft) gets moved along the working wall;
  // rooms past ~200 sq ft of floor want a second so furniture stays covered.
  const dropCloths = Math.max(1, Math.ceil((lengthFt * widthFt) / 200));

  return [
    {
      name: "Roller frame and covers",
      detail:
        "9-inch frame with woven covers — 3/8-inch nap for smooth drywall, 1/2-inch if your walls have texture",
      quantity: "1 frame, 2 covers",
      url: getAmazonSearchUrl("9 inch paint roller frame woven cover 3/8 nap"),
    },
    {
      name: "Angled sash brush",
      detail:
        "2.5-inch angled — this one brush does the cutting in at ceilings, corners, and trim",
      quantity: "1",
      url: getAmazonSearchUrl("2.5 inch angled sash paint brush"),
    },
    {
      name: "Paint tray and liners",
      detail: "9-inch tray; a fresh liner per coat skips the cleanup",
      quantity: `1 tray, ${coats} ${coats === 1 ? "liner" : "liners"}`,
      url: getAmazonSearchUrl("9 inch paint tray with liners"),
    },
    {
      name: "Painter's tape",
      detail:
        "1.88-inch wide for baseboards, ceiling line, and casings — sized from your room's edges",
      quantity: `${tapeRolls} ${tapeRolls === 1 ? "roll" : "rolls"} (60 yd)`,
      url: getAmazonSearchUrl("painters tape 1.88 inch 60 yard"),
    },
    {
      name: "Canvas drop cloth",
      detail:
        "9x12 canvas — it stays put and lasts years; plastic slides underfoot and tears",
      quantity: `${dropCloths}`,
      url: getAmazonSearchUrl("canvas drop cloth 9x12"),
    },
    {
      name: "Roller extension pole",
      detail:
        "2-to-4-foot twist-lock pole — reaches the ceiling line without a ladder and saves your back on full walls",
      quantity: "1",
      url: getAmazonSearchUrl("paint roller extension pole twist lock"),
    },
    {
      name: "Spackle and sanding sponge",
      detail:
        "Fill nail holes and dings, sand flush once dry — prep is what makes the finish look sprayed-on",
      quantity: "1 each",
      url: getAmazonSearchUrl("lightweight spackle wall repair sanding sponge"),
    },
  ];
}
