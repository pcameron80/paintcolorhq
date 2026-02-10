/**
 * Color utility functions for Paint Color HQ.
 * Includes hex/RGB/Lab conversions, Delta E 2000, and LRV calculation.
 */

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// rgbToLab  (sRGB -> XYZ D65 -> CIELAB)
// ---------------------------------------------------------------------------

export function rgbToLab(
  r: number,
  g: number,
  b: number,
): { L: number; a: number; b: number } {
  // 1. Linearize sRGB
  let rLin = r / 255;
  let gLin = g / 255;
  let bLin = b / 255;

  rLin = rLin <= 0.04045 ? rLin / 12.92 : ((rLin + 0.055) / 1.055) ** 2.4;
  gLin = gLin <= 0.04045 ? gLin / 12.92 : ((gLin + 0.055) / 1.055) ** 2.4;
  bLin = bLin <= 0.04045 ? bLin / 12.92 : ((bLin + 0.055) / 1.055) ** 2.4;

  // 2. Linear RGB to XYZ (sRGB matrix, D65 illuminant)
  const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
  const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin;
  const z = 0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin;

  // 3. XYZ to Lab  (D65 reference white)
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

// ---------------------------------------------------------------------------
// deltaE2000  –  CIEDE2000 colour-difference formula
//
// Reference: Sharma, Wu, Dalal (2005)
// "The CIEDE2000 Color-Difference Formula: Implementation Notes,
//  Supplementary Test Data, and Mathematical Observations"
// ---------------------------------------------------------------------------

interface Lab {
  L: number;
  a: number;
  b: number;
}

export function deltaE2000(lab1: Lab, lab2: Lab): number {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  // Weighting factors (all 1 for standard usage)
  const kL = 1;
  const kC = 1;
  const kH = 1;

  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  // Step 1: Calculate C'ab and h'ab for both colours
  const C1ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2ab = Math.sqrt(a2 * a2 + b2 * b2);
  const Cab_mean = (C1ab + C2ab) / 2;

  const Cab_mean_pow7 = Cab_mean ** 7;
  const twentyFive_pow7 = 25 ** 7; // 6103515625
  const G = 0.5 * (1 - Math.sqrt(Cab_mean_pow7 / (Cab_mean_pow7 + twentyFive_pow7)));

  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  // h'  (in degrees, 0-360)
  let h1p = Math.atan2(b1, a1p) * DEG;
  if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) * DEG;
  if (h2p < 0) h2p += 360;

  // Step 2: Calculate deltaL', deltaC', deltaH'
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

  // Step 3: Calculate CIEDE2000 weighting functions
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

  // Step 4: Final calculation
  const lTerm = dLp / (kL * SL);
  const cTerm = dCp / (kC * SC);
  const hTerm = dHp / (kH * SH);

  return Math.sqrt(
    lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + RT * cTerm * hTerm,
  );
}

// ---------------------------------------------------------------------------
// calculateLrv  –  Light Reflectance Value (0-100)
// ---------------------------------------------------------------------------

export function calculateLrv(r: number, g: number, b: number): number {
  return ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * 100;
}

// ---------------------------------------------------------------------------
// Self-test (runs when file is executed directly: `tsx scripts/lib/color-utils.ts`)
// ---------------------------------------------------------------------------

if (require.main === module) {
  console.log("Running color-utils self-tests...\n");
  let passed = 0;
  let failed = 0;

  const assertClose = (label: string, actual: number, expected: number, tolerance: number) => {
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
      console.log(`  PASS  ${label}: ${actual.toFixed(4)} (expected ~${expected}, diff=${diff.toFixed(6)})`);
      passed++;
    } else {
      console.log(`  FAIL  ${label}: ${actual.toFixed(4)} (expected ~${expected}, diff=${diff.toFixed(6)})`);
      failed++;
    }
  }

  // --- hexToRgb ---
  const rgb = hexToRgb("#FF8000");
  console.log("hexToRgb('#FF8000'):", rgb);
  if (rgb.r === 255 && rgb.g === 128 && rgb.b === 0) {
    console.log("  PASS  hexToRgb"); passed++;
  } else {
    console.log("  FAIL  hexToRgb"); failed++;
  }

  const rgb2 = hexToRgb("00FF00");
  if (rgb2.r === 0 && rgb2.g === 255 && rgb2.b === 0) {
    console.log("  PASS  hexToRgb without #"); passed++;
  } else {
    console.log("  FAIL  hexToRgb without #"); failed++;
  }

  // --- rgbToLab ---
  // White (255,255,255) should be approximately L=100, a=0, b=0
  const labWhite = rgbToLab(255, 255, 255);
  console.log("\nrgbToLab(255,255,255):", labWhite);
  assertClose("White L", labWhite.L, 100, 0.1);
  assertClose("White a", labWhite.a, 0, 0.5);
  assertClose("White b", labWhite.b, 0, 0.5);

  // Black (0,0,0) should be approximately L=0, a=0, b=0
  const labBlack = rgbToLab(0, 0, 0);
  console.log("\nrgbToLab(0,0,0):", labBlack);
  assertClose("Black L", labBlack.L, 0, 0.1);

  // --- deltaE2000 ---
  console.log("\nDelta E 2000 tests:");

  // Test: Identical colours => 0
  const de_identical = deltaE2000(
    { L: 50, a: 2.6772, b: -79.7751 },
    { L: 50, a: 2.6772, b: -79.7751 },
  );
  assertClose("Identical colours", de_identical, 0, 0.0001);

  // Test: White vs Black should be large (>50)
  const de_wb = deltaE2000(
    { L: 100, a: 0, b: 0 },
    { L: 0, a: 0, b: 0 },
  );
  console.log(`  White vs Black dE = ${de_wb.toFixed(4)}`);
  if (de_wb > 50) {
    console.log("  PASS  White vs Black > 50"); passed++;
  } else {
    console.log("  FAIL  White vs Black > 50"); failed++;
  }

  // All 34 Sharma et al. test pairs (from official supplementary data)
  // Reference: Sharma, Wu, Dalal (2005), Table 1
  const sharmaPairs: { l1: Lab; l2: Lab; expected: number }[] = [
    { l1: { L: 50, a: 2.6772, b: -79.7751 }, l2: { L: 50, a: 0, b: -82.7485 }, expected: 2.0425 },
    { l1: { L: 50, a: 3.1571, b: -77.2803 }, l2: { L: 50, a: 0, b: -82.7485 }, expected: 2.8615 },
    { l1: { L: 50, a: 2.8361, b: -74.0200 }, l2: { L: 50, a: 0, b: -82.7485 }, expected: 3.4412 },
    { l1: { L: 50, a: -1.3802, b: -84.2814 }, l2: { L: 50, a: 0, b: -82.7485 }, expected: 1.0000 },
    { l1: { L: 50, a: -1.1848, b: -84.8006 }, l2: { L: 50, a: 0, b: -82.7485 }, expected: 1.0000 },
    { l1: { L: 50, a: -0.9009, b: -85.5211 }, l2: { L: 50, a: 0, b: -82.7485 }, expected: 1.0000 },
    { l1: { L: 50, a: 0, b: 0 }, l2: { L: 50, a: -1, b: 2 }, expected: 2.3669 },
    { l1: { L: 50, a: -1, b: 2 }, l2: { L: 50, a: 0, b: 0 }, expected: 2.3669 },
    { l1: { L: 50, a: 2.49, b: -0.001 }, l2: { L: 50, a: -2.49, b: 0.0009 }, expected: 7.1792 },
    { l1: { L: 50, a: 2.49, b: -0.001 }, l2: { L: 50, a: -2.49, b: 0.001 }, expected: 7.1792 },
    { l1: { L: 50, a: 2.49, b: -0.001 }, l2: { L: 50, a: -2.49, b: 0.0011 }, expected: 7.2195 },
    { l1: { L: 50, a: 2.49, b: -0.001 }, l2: { L: 50, a: -2.49, b: 0.0012 }, expected: 7.2195 },
    { l1: { L: 50, a: -0.001, b: 2.49 }, l2: { L: 50, a: 0.0009, b: -2.49 }, expected: 4.8045 },
    { l1: { L: 50, a: -0.001, b: 2.49 }, l2: { L: 50, a: 0.001, b: -2.49 }, expected: 4.8045 },
    { l1: { L: 50, a: -0.001, b: 2.49 }, l2: { L: 50, a: 0.0011, b: -2.49 }, expected: 4.7461 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 50, a: 0, b: -2.5 }, expected: 4.3065 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 73, a: 25, b: -18 }, expected: 27.1492 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 61, a: -5, b: 29 }, expected: 22.8977 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 56, a: -27, b: -3 }, expected: 31.9030 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 58, a: 24, b: 15 }, expected: 19.4535 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 50, a: 3.1736, b: 0.5854 }, expected: 1.0000 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 50, a: 3.2972, b: 0 }, expected: 1.0000 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 50, a: 1.8634, b: 0.5757 }, expected: 1.0000 },
    { l1: { L: 50, a: 2.5, b: 0 }, l2: { L: 50, a: 3.2592, b: 0.335 }, expected: 1.0000 },
    { l1: { L: 60.2574, a: -34.0099, b: 36.2677 }, l2: { L: 60.4626, a: -34.1751, b: 39.4387 }, expected: 1.2644 },
    { l1: { L: 63.0109, a: -31.0961, b: -5.8663 }, l2: { L: 62.8187, a: -29.7946, b: -4.0864 }, expected: 1.2630 },
    { l1: { L: 61.2901, a: 3.7196, b: -5.3901 }, l2: { L: 61.4292, a: 2.248, b: -4.962 }, expected: 1.8731 },
    { l1: { L: 35.0831, a: -44.1164, b: 3.7933 }, l2: { L: 35.0232, a: -40.0716, b: 1.5901 }, expected: 1.8645 },
    { l1: { L: 22.7233, a: 20.0904, b: -46.694 }, l2: { L: 23.0331, a: 14.973, b: -42.5619 }, expected: 2.0373 },
    { l1: { L: 36.4612, a: 47.858, b: 18.3852 }, l2: { L: 36.2715, a: 50.5065, b: 21.2231 }, expected: 1.4146 },
    { l1: { L: 90.8027, a: -2.0831, b: 1.441 }, l2: { L: 91.1528, a: -1.6435, b: 0.0447 }, expected: 1.4441 },
    { l1: { L: 90.9257, a: -0.5406, b: -0.9208 }, l2: { L: 88.6381, a: -0.8985, b: -0.7239 }, expected: 1.5381 },
    { l1: { L: 6.7747, a: -0.2908, b: -2.4247 }, l2: { L: 5.8714, a: -0.0985, b: -2.2286 }, expected: 0.6377 },
    { l1: { L: 2.0776, a: 0.0795, b: -1.135 }, l2: { L: 0.9033, a: -0.0636, b: -0.5514 }, expected: 0.9082 },
  ];

  for (let i = 0; i < sharmaPairs.length; i++) {
    const { l1, l2, expected } = sharmaPairs[i];
    const actual = deltaE2000(l1, l2);
    assertClose(`Sharma pair ${i + 1}`, actual, expected, 0.001);
  }

  // --- calculateLrv ---
  console.log("\nLRV tests:");
  assertClose("LRV white", calculateLrv(255, 255, 255), 100, 0.1);
  assertClose("LRV black", calculateLrv(0, 0, 0), 0, 0.001);
  // Mid gray (128,128,128) ~= 50.2
  assertClose("LRV mid gray", calculateLrv(128, 128, 128), 50.196, 0.1);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
