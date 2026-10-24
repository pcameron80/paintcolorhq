// Shared input validation for the public image endpoints (/api/og, /api/pin,
// /api/pin/palette, /api/pin/blog). They render under PaintColorHQ branding and
// are cached for 30 days, so unchecked params mean arbitrary text, colors or
// remote images served as ours for a month. Edge-safe: no Node APIs.

const HEX6_RE = /^[0-9a-fA-F]{6}$/;

/** Returns "#RRGGBB" for a 6-digit hex with or without "#", else null. */
export function normalizeHex(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().replace(/^#/, "");
  return HEX6_RE.test(v) ? `#${v.toUpperCase()}` : null;
}

/** Trims and caps a text param, adding an ellipsis when it was cut. */
export function capText(raw: string | null | undefined, max: number): string {
  if (typeof raw !== "string") return "";
  const v = raw.trim();
  if (v.length <= max) return v;
  return v.slice(0, max - 1).trimEnd() + "…";
}
