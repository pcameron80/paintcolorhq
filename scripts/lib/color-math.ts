/**
 * Color math shared by import scripts. scripts/import-colors.ts imports its
 * family classifier from here; its LRV and Lab functions are still exact
 * copies of the ones below, so keep those in sync. Every derived value in
 * the colors table (family, LRV, Lab) must come from these formulas or
 * cross-brand Delta E ranking drifts.
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

export function classifyColorFamily(r: number, g: number, b: number, opts: RefineOptions = {}): string {
  return refineColorFamily(classifyColorFamilyHsl(r, g, b), r, g, b, opts);
}

function classifyColorFamilyHsl(r: number, g: number, b: number): string {
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

const HUE_FAMILIES = new Set(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']);

function lchHueFamily(h: number, c: number): string {
  if (h < 20 || h >= 345) return c >= 30 ? 'red' : 'pink';
  if (h < 60) return 'orange';
  if (h < 100) return 'yellow';
  if (h < 200) return 'green';
  if (h < 295) return 'blue';
  if (h < 330) return 'purple';
  return 'pink';
}

/**
 * Hue family for a color re-filed by a chroma escape (rules b, c, f, h below).
 * Escaped colors are muted (mostly C* 9-30), and at that chroma CIELAB puts
 * plums and aubergines at hue 330-355 and dark wines at 355-20, where
 * lchHueFamily would call both pink. The 2026-11 data audit found 111 of 622
 * colored gray/neutral rows in that band: about 45 purple names (Concord
 * Grape, Oriental Eggplant), about 25 wines (Divine Wine, Deep Garnet), 9 pinks.
 */
function mutedHueFamily(h: number, c: number, l: number): string {
  if (c >= 30) return lchHueFamily(h, c);
  if (h >= 330 && h < 355) return l >= 72 ? 'pink' : 'purple';
  if (h >= 355 || h < 20) return l >= 45 ? 'pink' : 'red';
  return lchHueFamily(h, c);
}

const ACHROMATIC_FAMILIES = new Set(['gray', 'neutral', 'white', 'off-white']);

/**
 * Brands that publish teals (LCh hue under 185) under Blue. Sherwin-Williams'
 * own colorFamilyNames list Cooled Blue 6759, Rivulet 6760, Thermal Spring
 * 6761 and Poseidon 6762 as Blue (checked 2026-10-31), so rule (i) leaves its
 * blues alone. PPG (Algolia color_family "Greens") and Benjamin Moore
 * (breadcrumb "Green") file the same hues as green.
 */
export const TEALS_STAY_BLUE_BRANDS: ReadonlySet<string> = new Set(['sherwin-williams']);

/**
 * Sourced per-color family overrides, keyed "<brand-slug>/<color-slug>". The
 * refine rules cannot see these; add one only with a manufacturer source.
 * Applied by familyForRow(), which refine-color-families.ts uses.
 */
export const FAMILY_OVERRIDES: Readonly<Record<string, string>> = {
  // SW serves both under /red-paint-colors/ (canonical URL, checked
  // 2026-10-31). Its API lists only "Designer Color Collection", so refine
  // re-files them by LCh hue (23.7 and 28.2), which lchHueFamily calls orange.
  'sherwin-williams/beetroot-9695': 'red',
  'sherwin-williams/wild-poppy-9694': 'red',
  // BM's breadcrumb files Maritime Blue 667 (LCh hue 184.4) under Blue.
  'benjamin-moore/maritime-blue-667': 'blue',
};

export interface RefineOptions {
  /** Brand slug, for brand-specific rules (TEALS_STAY_BLUE_BRANDS). */
  brand?: string;
}

/** CIELAB lightness, chroma and LCh hue (degrees, 0-360) for an sRGB color. */
export function rgbToLch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const lab = rgbToLab(r, g, b);
  const c = Math.hypot(lab.a, lab.b_val);
  let h = (Math.atan2(lab.b_val, lab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: lab.l, c, h };
}

// Perceptual correction applied on top of any family source (the HSL
// classifier above, or a brand API's own family list). HSL saturation is
// inflated for very light and very dark colors, so on its own it filed
// creamy whites (Swiss Coffee, Alabaster) under yellow/orange, near-blacks
// (Tricorn Black) under gray, tans (Shakespeare Tan) under orange and muted
// greens (Palace Green) under gray. CIELAB lightness and chroma are closer
// to what a person sees.
//
// History: the 2026-10-05 family audit set the white/off-white cutoffs. The
// 2026-10-24 rewrite (MP-27) added black, chroma escapes for achromatic
// labels, tans and khakis to beige/brown, pale tints to pink/beige, and
// raised the warm off-white cutoff from C<10 to C<14. Pinned examples live
// in color-math.test.ts; change a threshold and they tell you who moved.
//
// "tan" is never produced here: it stays a name-only family.
export function refineColorFamily(family: string, r: number, g: number, b: number, opts: RefineOptions = {}): string {
  const { l, c, h } = rgbToLch(r, g, b);
  // Warm creams (LCh hue 55-115) tolerate more chroma before they stop
  // reading as white than cool tints do.
  const warm = h >= 55 && h < 115;
  let f = family;

  // (a) Near-blacks: dark and close to neutral, whatever the source said.
  if (l < 25 && c < 5) return 'black';

  // (b, c, f) Chroma escapes. A label that says "no hue" on a color that
  // visibly has one is re-filed by LCh hue, then still passes through the
  // hue-family rules below, so a muted warm gray can land in beige or brown.
  //
  // (h) 2026-11 audit: a gray or neutral outside the warm-gray band (LCh hue
  // 20-110) is colored at ISCC-NBS "moderate" chroma (C* 15+), or when dark
  // and saturated for its lightness (L* < 50, C* 9+, C*/L* 0.3+): Newburyport
  // Blue HC-155, Clary Sage PPU11-07, Plum Royale 2070-20. Warm grays keep
  // their label, so greiges and taupes stay neutral. Hale Navy HC-154
  // (C*/L* 0.24) is below the cutoff and keeps its label.
  const coloredGray =
    (f === 'gray' || f === 'neutral') &&
    !(h >= 20 && h < 110) &&
    (c >= 15 || (l < 50 && c >= 9 && c / l >= 0.3));
  const escape =
    (f === 'black' && c >= 10) ||
    (f === 'gray' && c >= 18) ||
    (ACHROMATIC_FAMILIES.has(f) && c >= 20) ||
    coloredGray;
  if (escape) f = mutedHueFamily(h, c, l);

  if (HUE_FAMILIES.has(f)) {
    // (d) Very light, low-chroma colors read as white or off-white.
    if (l >= 88 && c < (warm ? 14 : 6)) {
      return l >= 92 && c <= (warm ? 8 : 4) ? 'white' : 'off-white';
    }
    // (g) Pale, barely tinted reds, oranges and pinks: beige or off-white on
    // the yellow side, pink on the red and mauve side (Rose Glow, LCh hue
    // ~340, must not land in beige).
    if ((f === 'red' || f === 'orange' || f === 'pink') && l >= 80 && c < 12) {
      if (warm) return l >= 88 ? 'off-white' : 'beige';
      // Orange-labeled colors at hue 35-55 are peach-beiges (Abalone Shell,
      // Wisp of Mauve), not pinks; pink is kept for red/pink labels and for
      // the true red and mauve hues.
      if (f === 'orange' && h >= 35 && h < 55) return l >= 88 ? 'off-white' : 'beige';
      if (h < 55 || h >= 300) return 'pink';
    }
    // (e) Tans and khakis: warm and muted reads as beige when light and
    // brown when dark, not as orange. Source-labeled yellows are left alone:
    // in the 2026-10-24 dry run the muted ones were mostly pale lime, sage
    // and butter creams (Lime Chiffon, Tempered Sage), not tans. A yellow
    // that only got its hue from a chroma escape above is a muted warm gray,
    // so it does take this rule.
    //
    // Peach carve-out (2026-11 audit): light, clearly tinted oranges at hue
    // 55-70 are peaches and apricots (BM Fresh Peach 060, Valspar New Peach
    // 2008-6B), not tans; BM, SW and Valspar file them under orange. Darker
    // or duller colors at the same hue (Fox Hedge Tan, Cavern Clay) still go
    // to beige or brown.
    const peach = f === 'orange' && h >= 55 && h < 70 && c >= 18 && l >= 75;
    if ((f === 'orange' || (f === 'yellow' && escape)) && warm && c < 25 && !peach) {
      return l >= 60 ? 'beige' : 'brown';
    }
    // (j) Light reds are pink (basic color terms; BM tags Bed of Roses 1318
    // and Supple Pink 2007-50 "Color Family = Pink"). Corals at hue 30-35
    // stay red pending a product decision: BM tags some of them orange.
    if (f === 'red' && l >= 72 && (h < 30 || h >= 340)) return 'pink';
  }

  if (f === 'blue' && c >= 15 && h >= 295 && h < 345) return 'purple';
  // (i) Teal-greens: HSL starts blue at hue 170, so spring greens and teals
  // with LCh hue under 185 landed in blue (BM Erin Green 608, PPG Capri Teal).
  // Teals at 185-200 stay blue, and so do brands in TEALS_STAY_BLUE_BRANDS.
  if (f === 'blue' && c > 10 && h < 185 && !(opts.brand && TEALS_STAY_BLUE_BRANDS.has(opts.brand))) {
    return 'green';
  }
  return f;
}

/**
 * Family for a stored row: a sourced FAMILY_OVERRIDES entry when one exists,
 * otherwise refineColorFamily with the row's brand taken from the key.
 */
export function familyForRow(key: string, family: string, r: number, g: number, b: number): string {
  return FAMILY_OVERRIDES[key] ?? refineColorFamily(family, r, g, b, { brand: key.split('/')[0] });
}

/**
 * Family for a row whose family is derived from its hex alone (a hex
 * correction or a new row from a palette scan): a sourced FAMILY_OVERRIDES
 * entry, else the HSL classifier refined with the brand's rules. Without the
 * brand, rule (i) files Sherwin-Williams teals green, and refine-color-families
 * never moves a green back, so TEALS_STAY_BLUE_BRANDS would erode one hex
 * correction at a time.
 */
export function familyFromHex(key: string, r: number, g: number, b: number): string {
  return FAMILY_OVERRIDES[key] ?? classifyColorFamily(r, g, b, { brand: key.split('/')[0] });
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
