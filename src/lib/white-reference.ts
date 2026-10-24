// White-reference correction for the photo color identifier.
//
// A visitor can click something in the photo that is white in real life (trim,
// a ceiling, a sheet of paper). Whatever tint that spot has in the photo is
// the color cast added by the camera's white balance and the room's bulbs, so
// removing it from every later sample gets the sample closer to the paint.
//
// The correction is a per-channel gain in linear RGB (a von Kries style
// adjustment). Each channel is scaled so the reference becomes a neutral gray
// at its own luminance. It removes the cast only: it does not brighten or
// darken the photo, because a white in a photo is rarely pure white and
// scaling it up to #FFFFFF would wash out every sample. It is an
// approximation, and the UI says so.

export type Gain = readonly [number, number, number];

// A reference this dark carries too little signal to estimate a cast from,
// and the gains it produces amplify noise.
const MIN_REFERENCE_LUMINANCE = 0.05;
// Gains above this mean the "white" spot was strongly colored (a red wall,
// not trim). Refuse it rather than swing every sample. 4 still accepts white
// trim under a warm incandescent bulb (#FFC080 needs a blue gain of about 2.8).
const MAX_GAIN = 4;

export function srgbToLinear(channel255: number): number {
  const c = channel255 / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(linear: number): number {
  const c = Math.min(1, Math.max(0, linear));
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export type WhiteGainResult =
  | { ok: true; gain: Gain }
  | { ok: false; reason: "invalid" | "too-dark" | "too-colorful" };

/** Per-channel gains that turn `referenceHex` into a neutral gray at the same luminance. */
export function whiteGainFromReference(referenceHex: string): WhiteGainResult {
  const rgb = parseHex(referenceHex);
  if (!rgb) return { ok: false, reason: "invalid" };
  const lin = rgb.map(srgbToLinear) as [number, number, number];
  const luminance = 0.2126729 * lin[0] + 0.7151522 * lin[1] + 0.072175 * lin[2];
  if (luminance < MIN_REFERENCE_LUMINANCE || lin.some((c) => c <= 0)) {
    return { ok: false, reason: "too-dark" };
  }
  const gain = lin.map((c) => luminance / c) as [number, number, number];
  if (gain.some((g) => g > MAX_GAIN || g < 1 / MAX_GAIN)) {
    return { ok: false, reason: "too-colorful" };
  }
  return { ok: true, gain };
}

/** Apply a white-reference gain to a sampled hex. Returns lowercase #rrggbb. */
export function applyWhiteGain(hex: string, gain: Gain): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const out = rgb.map((c, i) => linearToSrgb(srgbToLinear(c) * gain[i]));
  return `#${out.map(toHex).join("")}`;
}
