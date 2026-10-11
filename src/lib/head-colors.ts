// Head-color push, 2026-10-11.
//
// The 13 highest-volume color names (22k-74k monthly searches each). Google
// was ranking our blog posts for these names and never the color pages, so
// on 2026-10-11 we made the color page the target: posts that mention a head
// color now link its first mention to the color page, the single-color deep
// dives add an early "full color data" link, and each page below gained a
// per-color data block in src/lib/color-editorial.tsx. Measure from 2026-11-08.
//
// TITLE TEST: these pages' body content changed mid-test (the color-page
// title split test in src/lib/title-test.ts started 2026-10-06). Exclude every
// entry below from the title-test readout, in both arms, or the content change
// will be read as a title effect.
//
// Keys are "brandSlug/colorSlug", the same format title-test.ts hashes.
export const HEAD_COLOR_PUSH_DATE = "2026-10-11";

export const HEAD_COLOR_PUSH: readonly string[] = [
  "sherwin-williams/alabaster-7008",
  "sherwin-williams/agreeable-gray-7029",
  "benjamin-moore/white-dove-oc-17",
  "sherwin-williams/accessible-beige-7036",
  "benjamin-moore/swiss-coffee-oc-45",
  "benjamin-moore/pale-oak-oc-20",
  "sherwin-williams/iron-ore-7069",
  "sherwin-williams/greek-villa-7551",
  "sherwin-williams/shoji-white-7042",
  "benjamin-moore/chantilly-lace-2121-70",
  "sherwin-williams/natural-linen-9109",
  "sherwin-williams/sea-salt-6204",
  "sherwin-williams/urbane-bronze-7048",
];
