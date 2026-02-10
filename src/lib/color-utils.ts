/**
 * Color science utilities for runtime use (browser/API).
 * Ported from scripts/lib/color-utils.ts.
 */

interface Lab {
  L: number;
  a: number;
  b: number;
}

export type { Lab };

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace(/^#/, "");
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToLab(
  r: number,
  g: number,
  b: number,
): Lab {
  let rLin = r / 255;
  let gLin = g / 255;
  let bLin = b / 255;

  rLin = rLin <= 0.04045 ? rLin / 12.92 : ((rLin + 0.055) / 1.055) ** 2.4;
  gLin = gLin <= 0.04045 ? gLin / 12.92 : ((gLin + 0.055) / 1.055) ** 2.4;
  bLin = bLin <= 0.04045 ? bLin / 12.92 : ((bLin + 0.055) / 1.055) ** 2.4;

  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin;
  const z = 0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin;

  const Xn = 0.95047;
  const Yn = 1.0;
  const Zn = 1.08883;

  const f = (t: number): number =>
    t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116;

  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function deltaE2000(lab1: Lab, lab2: Lab): number {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab_mean = (C1ab + C2ab) / 2;

  const Cab_mean_pow7 = Cab_mean ** 7;
  const twentyFive_pow7 = 25 ** 7;
  const G =
    0.5 * (1 - Math.sqrt(Cab_mean_pow7 / (Cab_mean_pow7 + twentyFive_pow7)));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  let h1p = Math.atan2(b1, a1p) * DEG;
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * DEG;
  if (h2p < 0) h2p += 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * RAD);

  const Lp_mean = (L1 + L2) / 2;
  const Cp_mean = (C1p + C2p) / 2;

  let hp_mean: number;
  if (C1p * C2p === 0) {
    hp_mean = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hp_mean = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hp_mean = (h1p + h2p + 360) / 2;
  } else {
    hp_mean = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((hp_mean - 30) * RAD) +
    0.24 * Math.cos(2 * hp_mean * RAD) +
    0.32 * Math.cos((3 * hp_mean + 6) * RAD) -
    0.20 * Math.cos((4 * hp_mean - 63) * RAD);

  const SL =
    1 +
    (0.015 * (Lp_mean - 50) ** 2) / Math.sqrt(20 + (Lp_mean - 50) ** 2);

  const SC = 1 + 0.045 * Cp_mean;
  const SH = 1 + 0.015 * Cp_mean * T;

  const Cp_mean_pow7 = Cp_mean ** 7;
  const RC = 2 * Math.sqrt(Cp_mean_pow7 / (Cp_mean_pow7 + twentyFive_pow7));

  const dTheta = 30 * Math.exp(-(((hp_mean - 275) / 25) ** 2));
  const RT = -Math.sin(2 * dTheta * RAD) * RC;

  const lTerm = dLp / (kL * SL);
  const cTerm = dCp / (kC * SC);
  const hTerm = dHp / (kH * SH);

  return Math.sqrt(
    lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + RT * cTerm * hTerm,
  );
}
