// Parsing and display helpers shared by the hex-to-paint tool, its API route
// and the LRV finder. Pure: no DB access, safe in client components and tests.

/**
 * Read a hex or RGB color the way people type it and return "#rrggbb", or
 * null when it is not a color.
 *
 * Accepts: "a8a29a", "#A8A29A", "#abc" (CSS shorthand), "rgb(168, 162, 154)",
 * "168,162,154" and "168 162 154". RGB channels must be whole numbers 0-255.
 */
export function parseColorInput(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  const hex = s.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;

  const rgb = s.replace(/^rgba?\s*\(/, "").replace(/\)\s*$/, "");
  const parts = rgb.split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 3) return null;
  const channels = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  if (channels.some((c) => !Number.isInteger(c) || c < 0 || c > 255)) return null;
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** "#a8a29a" -> "rgb(168, 162, 154)" for display next to the hex. */
export function hexToRgbString(hex: string): string {
  const h = hex.replace(/^#/, "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

export type LrvSourceLabel = "manufacturer" | "computed" | null;

/**
 * LRV for display: one decimal, trailing ".0" dropped (92.6, 90, 8.4).
 * Returns null when there is no LRV.
 */
export function formatLrv(lrv: number | string | null | undefined): string | null {
  if (lrv == null) return null;
  const n = Number(lrv);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Short label for where an LRV came from (migration 017 colors.lrv_source).
 * A NULL LRV gets no label whatever lrv_source says (migration 017 NULL
 * contract). An unknown source (column not yet applied) also gets no label,
 * so a published value is never mislabeled as an estimate.
 */
export function lrvSourceLabel(
  lrv: number | string | null | undefined,
  source: LrvSourceLabel | undefined,
): "Published" | "Estimated" | null {
  if (formatLrv(lrv) == null) return null;
  if (source === "manufacturer") return "Published";
  if (source === "computed") return "Estimated";
  return null;
}
