/**
 * Color math shared by import scripts. These are exact copies of the
 * functions in scripts/import-colors.ts — keep them in sync. (import-colors
 * runs main() at module load, so importing from it directly isn't an option;
 * extracting its internals wholesale is a bigger refactor than this batch
 * needs.) Every derived value in the colors table (family, LRV, Lab) must
 * come from these formulas or cross-brand Delta E ranking drifts.
 */

export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; l: number } {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rr: h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6; break;
      case gg: h = ((bb - rr) / d + 2) / 6; break;
      case bb: h = ((rr - gg) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function classifyColorFamily(r: number, g: number, b: number): string {
  const { h, s, l } = rgbToHsl(r, g, b);

  if (l > 90 && s < 15) return 'white';
  if (l > 85 && s < 20) return 'off-white';
  if (l < 10) return 'black';
  if (s < 15 && l >= 10 && l <= 90) return 'gray';

  if (s >= 10 && s <= 30 && h >= 30 && h <= 55 && l >= 60 && l <= 85) return 'beige';

  if (s >= 15 && s <= 50 && h >= 15 && h <= 45 && l < 60) return 'brown';

  if (s < 20) return 'neutral';

  if (h >= 345 || h < 15) return 'red';
  if (h >= 15 && h < 45) return 'orange';
  if (h >= 45 && h < 70) return 'yellow';
  if (h >= 70 && h < 170) return 'green';
  if (h >= 170 && h < 260) return 'blue';
  if (h >= 260 && h < 290) return 'purple';
  if (h >= 290 && h < 345) return 'pink';

  return 'neutral';
}

export function calculateLrv(r: number, g: number, b: number): number {
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  ) * 100;
}

function gammaDecodeChannel(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  const lr = gammaDecodeChannel(r);
  const lg = gammaDecodeChannel(g);
  const lb = gammaDecodeChannel(b);

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  return { x, y, z };
}

function xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116;

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { l, a, b };
}

export function rgbToLab(
  r: number,
  g: number,
  b: number,
): { l: number; a: number; b_val: number } {
  const xyz = rgbToXyz(r, g, b);
  const lab = xyzToLab(xyz.x, xyz.y, xyz.z);
  return {
    l: Math.round(lab.l * 100) / 100,
    a: Math.round(lab.a * 100) / 100,
    b_val: Math.round(lab.b * 100) / 100,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
