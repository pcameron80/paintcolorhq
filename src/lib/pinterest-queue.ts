/**
 * Pinterest auto-pinner priority queue.
 *
 * Builds an ordered list of seedable items across three tiers:
 *
 *   Tier 1 — colors that have already earned GSC impressions (proven
 *            search demand, ~30 items, ranked by 90-day impressions)
 *   Tier 2 — the 18 inspiration palettes (highly pinnable, full coverage)
 *   Tier 3 — indexable blog posts (43 roundup/how-to/guide posts)
 *
 * The three tiers are interleaved (color → palette → blog → color → ...)
 * so each cron run pulls a balanced mix across boards.
 *
 * No DB-backed dedupe yet — the cron picks items via a date-based offset,
 * walking forward through the queue ~10 items/day. Duplicates can happen
 * if the cron is triggered manually multiple times in a day, which is fine
 * for the demo / standard-access review and rare in actual operation.
 */

import { inspirationPalettes } from "./palettes";
import { getAllPosts } from "./blog-posts";

export type Seed =
  | { type: "color"; brandSlug: string; slug: string }
  | { type: "palette"; slug: string }
  | { type: "blog"; slug: string };

/**
 * Top GSC-impressed colors over the 90-day window we measured. These pages
 * already rank for real searches but are mostly stuck in pos 9-50 with
 * weak CTR — pinning them gives Pinterest's algo a known-relevant target
 * AND surfaces them to a separate audience.
 */
const TIER1_COLORS: Array<{ brandSlug: string; slug: string }> = [
  { brandSlug: "vista-paint", slug: "mystic-fog-c-18" },          // 220 imp
  { brandSlug: "benjamin-moore", slug: "mortar-cc-574" },         // 143 imp
  { brandSlug: "sherwin-williams", slug: "passive-7064" },        // 103 imp
  { brandSlug: "benjamin-moore", slug: "vapor-af-35" },           //  83 imp
  { brandSlug: "dunn-edwards", slug: "faded-gray-dew382" },       //  78 imp
  { brandSlug: "benjamin-moore", slug: "inukshuk-cc-460" },       //  64 imp
  { brandSlug: "benjamin-moore", slug: "silhouette-af-655" },     //  57 imp
  { brandSlug: "hirshfields", slug: "desert-mirage-231" },        //  57 imp
  { brandSlug: "benjamin-moore", slug: "straw-270" },             //  54 imp
  { brandSlug: "behr", slug: "mourning-dove-or-w12" },            //  51 imp
  { brandSlug: "benjamin-moore", slug: "lambskin-1051" },         //  38 imp
  { brandSlug: "benjamin-moore", slug: "tangerine-132" },         //  38 imp
  { brandSlug: "benjamin-moore", slug: "butterscotch-1147" },     //  37 imp
  { brandSlug: "ppg", slug: "scotch-mist-14-07" },                //  34 imp
  { brandSlug: "ral", slug: "pearl-dark-grey-9023" },             //  34 imp
  { brandSlug: "benjamin-moore", slug: "cucumber-562" },          //  25 imp
  { brandSlug: "dunn-edwards", slug: "bachelor-blue-de5878" },    //  21 imp
  { brandSlug: "benjamin-moore", slug: "buttermilk-919" },        //  21 imp
  { brandSlug: "vista-paint", slug: "muted-mulberry-c-1381" },    //  20 imp
  { brandSlug: "benjamin-moore", slug: "downpour-2063-20" },      //  20 imp
  { brandSlug: "dunn-edwards", slug: "early-snow-dew313" },       //  16 imp
  { brandSlug: "valspar", slug: "dress-rehearsal-7001-20" },      //  15 imp
  { brandSlug: "benjamin-moore", slug: "northwood-1000" },        //  15 imp
  { brandSlug: "benjamin-moore", slug: "venetian-1292" },         //  15 imp
  { brandSlug: "dunn-edwards", slug: "galveston-tan-de6101" },    //  14 imp
  { brandSlug: "behr", slug: "warm-onyx-hdc-cl-14a" },            //  13 imp
  { brandSlug: "benjamin-moore", slug: "lido-617" },              //  12 imp
  { brandSlug: "mpc", slug: "black-hole-met-mp19952" },           //  12 imp
  { brandSlug: "benjamin-moore", slug: "sunflower-174" },         //  10 imp
  { brandSlug: "benjamin-moore", slug: "almond-beige-2101-40" },  //   8 imp
];

/**
 * Build the full ordered queue. Interleaves color → palette → blog so
 * each run gets a balanced mix across boards.
 */
export function getQueue(): Seed[] {
  const colors: Seed[] = TIER1_COLORS.map((c) => ({ type: "color", ...c }));
  const palettes: Seed[] = inspirationPalettes.map((p) => ({ type: "palette", slug: p.slug }));
  const blogs: Seed[] = getAllPosts()
    .filter((p) => !p.noindex && p.coverImage)
    .map((p) => ({ type: "blog", slug: p.slug }));

  const interleaved: Seed[] = [];
  const longest = Math.max(colors.length, palettes.length, blogs.length);
  for (let i = 0; i < longest; i++) {
    if (i < colors.length) interleaved.push(colors[i]);
    if (i < palettes.length) interleaved.push(palettes[i]);
    if (i < blogs.length) interleaved.push(blogs[i]);
  }
  return interleaved;
}

/**
 * Pick `count` items starting at a date-derived offset, wrapping at the
 * end of the queue. Each "day" advances by `count` slots, so day 1 takes
 * items [0..count), day 2 takes [count..2*count), and so on.
 */
export function selectForRun(queue: Seed[], count: number, dayOffset: number): Seed[] {
  if (queue.length === 0) return [];
  const start = ((dayOffset * count) % queue.length + queue.length) % queue.length;
  const out: Seed[] = [];
  for (let i = 0; i < count; i++) {
    out.push(queue[(start + i) % queue.length]);
  }
  return out;
}
