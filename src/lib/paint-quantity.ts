// Pure paint-quantity math shared by the calculator (client) and the
// "Gallons by room size" table (server), so the two can never disagree.

export const DOOR_SQFT = 21; // a standard interior door opening, one side
export const WINDOW_SQFT = 15; // an average window opening
/** One face of a standard interior door, with edges. Doors mode paints both. */
export const DOOR_FACE_SQFT = 20;
/** A typical cabinet door, one side. */
export const CABINET_DOOR_SQFT = 4;
/** A typical drawer front, face only. */
export const DRAWER_FRONT_SQFT = 2;

/**
 * Parse a form field into a number clamped to [min, max]. Blank, negative,
 * NaN and Infinity all come back as 0 (or `min` when it is above 0), so a
 * typo can never turn into a 10,000-gallon estimate.
 */
export function parseClamped(value: string, min: number, max: number): number {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return Math.max(0, min);
  return Math.min(max, Math.max(min, n));
}

/** Whole-number variant for counts (doors, windows, coats). */
export function parseCount(value: string, min: number, max: number): number {
  return Math.floor(parseClamped(value, min, max));
}

export interface WallInput {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
  doors: number;
  windows: number;
}

export interface WallArea {
  wallArea: number;
  doorArea: number;
  windowArea: number;
  paintableArea: number;
}

export function wallArea(input: WallInput): WallArea {
  const wall = 2 * (input.lengthFt + input.widthFt) * input.heightFt;
  const doorArea = input.doors * DOOR_SQFT;
  const windowArea = input.windows * WINDOW_SQFT;
  return {
    wallArea: wall,
    doorArea,
    windowArea,
    paintableArea: Math.max(0, wall - doorArea - windowArea),
  };
}

/** Gallons before rounding: area times coats over the spread rate. */
export function rawGallons(area: number, coats: number, sqftPerGal: number): number {
  if (area <= 0 || coats <= 0 || sqftPerGal <= 0) return 0;
  return (area * coats) / sqftPerGal;
}

/**
 * Round up to whole gallons. The small epsilon stops float noise
 * (e.g. 2.0000000001) from adding a phantom gallon.
 */
export function wholeGallons(raw: number): number {
  if (raw <= 0) return 0;
  return Math.ceil(raw - 1e-9);
}

/**
 * The cheapest sensible can mix: whole gallons plus up to two quarts. Three
 * quarts cost about what a gallon does, so a remainder over half a gallon
 * rounds up to another gallon instead.
 */
export function gallonsAndQuarts(raw: number): { gallons: number; quarts: number } {
  if (raw <= 0) return { gallons: 0, quarts: 0 };
  const gallons = Math.floor(raw + 1e-9);
  const quarts = Math.ceil((raw - gallons) * 4 - 1e-9);
  if (quarts <= 0) return { gallons, quarts: 0 };
  if (quarts >= 3) return { gallons: gallons + 1, quarts: 0 };
  return { gallons, quarts };
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** "1 gallon + 1 quart", "2 gallons", "2 quarts". */
export function formatCans({ gallons, quarts }: { gallons: number; quarts: number }): string {
  const parts: string[] = [];
  if (gallons > 0) parts.push(`${gallons} ${plural(gallons, "gallon", "gallons")}`);
  if (quarts > 0) parts.push(`${quarts} ${plural(quarts, "quart", "quarts")}`);
  return parts.join(" + ") || "0 gallons";
}

export interface RoomRow {
  label: string;
  lengthFt: number;
  widthFt: number;
  paintableArea: number;
  wallGallons: number;
  ceilingGallons: number;
}

/** Room sizes for the server-rendered "Gallons by room size" table. */
export const ROOM_SIZES: Array<[number, number]> = [
  [10, 10],
  [10, 12],
  [12, 12],
  [12, 14],
  [14, 16],
  [16, 20],
];

/**
 * The table's assumptions are fixed and printed next to it: 8 ft ceilings,
 * one door, two windows, two coats on the walls, one coat on the ceiling.
 */
export function roomSizeTable(sqftPerGal: number, ceilingSqftPerGal: number): RoomRow[] {
  return ROOM_SIZES.map(([l, w]) => {
    const { paintableArea } = wallArea({ lengthFt: l, widthFt: w, heightFt: 8, doors: 1, windows: 2 });
    return {
      label: `${l} x ${w} ft`,
      lengthFt: l,
      widthFt: w,
      paintableArea,
      wallGallons: wholeGallons(rawGallons(paintableArea, 2, sqftPerGal)),
      ceilingGallons: wholeGallons(rawGallons(l * w, 1, ceilingSqftPerGal)),
    };
  });
}
