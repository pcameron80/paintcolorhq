// Color families where the manufacturer's own family differs from the one our
// classifier assigns from the hex. Keyed "brandSlug/colorSlug". The color page
// shows the manufacturer's family (lede, meta, FAQ, family row and links) on
// non-head pages; the stored color_family is left alone.
//
// Families are the ones named in the MP-40 brief (2026-11-03), matched to the
// three Sherwin-Williams rows that carry those names:
//   Westhaven (SW 9675, #2A4442): Green; we store "neutral".
//   Peacock Plume (SW 20, #739694): Blue; we store "gray".
//   Merlot (SW 2704, #51323B): Purple; we store "pink".
// Add an entry only after reading the manufacturer's page for that color.
export const MANUFACTURER_FAMILY: Readonly<Record<string, string>> = {
  "sherwin-williams/westhaven-9675": "green",
  "sherwin-williams/peacock-plume-20": "blue",
  "sherwin-williams/merlot-2704": "purple",
};

/** The color with its manufacturer family applied, when one is on record. */
export function withManufacturerFamily<T extends { color_family: string | null }>(
  color: T,
  brandSlug: string,
  colorSlug: string,
): T {
  const family = MANUFACTURER_FAMILY[`${brandSlug}/${colorSlug}`];
  return family && color.color_family !== family ? { ...color, color_family: family } : color;
}
