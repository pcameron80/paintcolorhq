import type { ReactNode } from "react";

/**
 * Curated, hand-written editorial for high-demand colors — genuine review depth
 * (how the color behaves in real rooms, the comparisons people actually weigh,
 * pairings, and when NOT to use it) that the generated description can't provide.
 *
 * Keyed by "brandSlug/colorSlug". Only the top colors by demand are populated;
 * the long tail keeps the clean generated content (deliberately — bulk-padding
 * 23K programmatic pages is what caused the March 2026 HCU demotion). This is the
 * opposite: unique, curated, opinion-grade copy on the pages that actually rank.
 *
 * All factual claims (LRV, undertone, cross-brand matches) are DB-verified.
 */
export const COLOR_EDITORIAL: Record<string, ReactNode> = {
  "sherwin-williams/agreeable-gray-7029": (
    <>
      <p>
        Agreeable Gray is the color that made &ldquo;greige&rdquo; a household word — a gray with
        just enough warm beige in it to avoid the cold, steely look that dated the all-gray era. At
        LRV 60 it sits right in the middle of the light scale, which is the practical reason it works
        almost everywhere: bright enough to keep a north-facing room from going gloomy, soft enough
        that a sunny south room doesn&apos;t blow it out to near-white.
      </p>
      <p>
        The honest caveat: that same middle-of-the-road quality means Agreeable Gray reads slightly
        different in every house. In strong warm light it leans taupe; under cool LED or heavy north
        light its faint green-violet base can surface. Pair it with a crisp white trim like Pure White
        rather than a creamy one — a too-warm trim makes the walls look dingy by comparison. If you
        want the identical look without a Sherwin-Williams store, Behr Toasty Gray and Benjamin Moore
        Wish are near-identical, and Valspar Heritage Gray is a dead-on hex match at Lowe&apos;s.
      </p>
    </>
  ),
  "sherwin-williams/repose-gray-7015": (
    <>
      <p>
        Repose Gray is the color people land on when Agreeable Gray feels a touch too warm. It&apos;s a
        true light gray (LRV 58) with only a whisper of greige, so it keeps a cooler, cleaner feel
        without tipping into the blue-gray that dominated 2015. The two are the most-compared neutrals
        in the country, and the rule of thumb holds: choose Repose for a calmer, slightly cooler room,
        Agreeable for a warmer, cozier one.
      </p>
      <p>
        Watch the purple. In low or north light, Repose Gray&apos;s violet undertone can show, especially
        next to colors with a green base — so sample it on the actual wall before committing a whole
        floor. It pairs cleanly with both cool and warm whites, which is part of why it&apos;s such a safe
        whole-house pick. The closest cross-brand matches are Benjamin Moore Apparition and PPG
        Swirling Smoke, both near-identical on the wall.
      </p>
    </>
  ),
  "sherwin-williams/accessible-beige-7036": (
    <>
      <p>
        Accessible Beige is the greige for people who actually want to see the beige. At LRV 58 it&apos;s
        the same brightness as Agreeable Gray, but with noticeably more warmth and a faint gray that
        keeps it from going yellow or &ldquo;builder beige.&rdquo; It&apos;s the right call for rooms that run
        cool — north-facing spaces, rooms with a lot of cool-toned stone or tile — where a true gray
        would feel clinical.
      </p>
      <p>
        In very warm afternoon light it can push toward tan, so if you want it to stay neutral, keep the
        trim a clean white and avoid pairing it with strongly yellow woods. It anchors a warm,
        earthy palette beautifully — terracotta, olive, aged brass. The nearest matches in other
        brands are Behr Shoreline Haze and PPG Synchronicity, both near-identical.
      </p>
    </>
  ),
  "sherwin-williams/alabaster-7008": (
    <>
      <p>
        Alabaster is the warm white that quietly took over from the cooler grays. At LRV 82 it&apos;s soft
        and creamy without reading yellow, which is the hard balance most warm whites miss. It works
        three ways at once — walls, trim, and cabinets — which is why whole-house painters reach for
        it: using one white everywhere removes the trim-vs-wall guessing game.
      </p>
      <p>
        Because it&apos;s warm, Alabaster can look slightly creamy next to a stark, cool white (don&apos;t put
        it beside bright-white ceilings or it&apos;ll look dirty by contrast). In north light it reads its
        softest; in warm light it glows. If your walls are a greige like Agreeable Gray, Alabaster is
        the trim white that pairs with it most naturally. Benjamin Moore Dune White is its near-identical
        cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/sea-salt-6204": (
    <>
      <p>
        Sea Salt is the color that won&apos;t hold still — and that&apos;s the appeal. It&apos;s a soft, low-chroma
        green that reads sage in some light, pale gray-blue in others, and almost gray in a dim room.
        At LRV 63 it&apos;s light enough to feel airy, which is why it became the default &ldquo;spa&rdquo; color
        for bathrooms and bedrooms.
      </p>
      <p>
        The flip side of that chameleon quality: you genuinely cannot predict Sea Salt from the chip, so
        a sample is non-negotiable here more than with any neutral. It leans greener in north light and
        bluer under warm bulbs. Pair it with crisp whites and natural wood; it fights cool grays. The
        closest cross-brand match is PPG Bay of Fundy, with Valspar Three Wishes a very close second.
      </p>
    </>
  ),
  "benjamin-moore/hale-navy-hc-154": (
    <>
      <p>
        Hale Navy is the navy that launched a thousand kitchen islands. What sets it apart from a true
        royal navy is a slight gray-green softness — at LRV 7 it&apos;s deep and dramatic, but it never
        reads as a primary-crayon blue, which is exactly why it works on cabinetry, front doors, and
        moody accent walls without feeling juvenile.
      </p>
      <p>
        It needs light to look its best: in a dark north room it can collapse to near-black, so it&apos;s
        strongest where there&apos;s good daylight or where you lean into the drama deliberately. It pairs
        with warm brass, white oak, and creamy whites — high-contrast crisp white can make it look
        harsh. The closest cross-brand equivalent is Sherwin-Williams Naval, with Behr Starless Night
        also near-identical, so the look is easy to get on either side of the BM/SW divide.
      </p>
    </>
  ),
};

export function getColorEditorial(brandSlug: string, colorSlug: string): ReactNode | null {
  return COLOR_EDITORIAL[`${brandSlug}/${colorSlug}`] ?? null;
}
