/**
 * Undertone classification (mirrors src/lib/color-description.ts). Shared by
 * populate-undertones.ts and apply-hex-corrections.ts so a corrected hex gets
 * exactly the undertone a fresh populate run would give it.
 */

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

export type RawUndertone = "golden" | "pink" | "green" | "blue" | "violet" | "balanced";

export function computeUndertone(
  hex: string,
  labA: number | null,
  labB: number | null,
): RawUndertone {
  const [h, s] = hexToHsl(hex);
  const isAchromatic = s < 8;

  if (isAchromatic) {
    if (labA != null && labB != null) {
      if (labB > 3) return "golden";
      if (labA > 2) return "pink";
      if (labB < -2) return "blue";
      if (labA < -2) return "green";
      return "balanced";
    }
    return "balanced";
  }

  if (labA != null && labB != null) {
    if (labA > 8 && labB > 8) return "golden";
    if (labA > 8 && labB <= 8) return "pink";
    if (labA < -5 && labB > 5) return "green";
    if (labA < -5 && labB < -5) return "blue";
    if (labA > 3 && labB < -3) return "violet";
    return "balanced";
  }

  if (h >= 20 && h < 70) return "golden";
  if (h >= 330 || h < 20) return "pink";
  if (h >= 70 && h < 160) return "green";
  if (h >= 200 && h < 270) return "blue";
  if (h >= 270 && h < 330) return "violet";
  return "balanced";
}

export const LABEL_MAP: Record<RawUndertone, string> = {
  golden: "Warm (Golden)",
  pink: "Warm (Pink)",
  blue: "Cool (Blue)",
  green: "Cool (Green)",
  violet: "Cool (Violet)",
  balanced: "Neutral",
};

/** Stored label for a color, e.g. "Warm (Golden)". */
export function undertoneLabel(hex: string, labA: number | null, labB: number | null): string {
  return LABEL_MAP[computeUndertone(hex, labA, labB)];
}
