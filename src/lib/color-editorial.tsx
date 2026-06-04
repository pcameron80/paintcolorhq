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
  "sherwin-williams/pure-white-7005": (
    <>
      <p>
        Pure White is the trim-and-ceiling default for a reason: at LRV 84 it&apos;s bright and clean
        without the blue-white glare of a stark white, and without enough warmth to clash with either
        cool or warm wall colors. That neutrality is the whole point — it&apos;s the white you reach for
        when you don&apos;t want the trim to make a statement, just frame the room.
      </p>
      <p>
        It also works as a wall color in well-lit rooms, where it reads as a soft, livable white rather
        than a gallery white. In low light it can flatten slightly, so it&apos;s happiest with good
        daylight. It pairs cleanly with almost any greige or gray, which is why it&apos;s the standard trim
        partner for Agreeable Gray. PPG Commercial White is an exact cross-brand match, and Dunn-Edwards
        Frostbite is nearly identical.
      </p>
    </>
  ),
  "sherwin-williams/naval-6244": (
    <>
      <p>
        Naval is the deep, classic navy behind a huge share of the internet&apos;s moody dining rooms,
        front doors, and kitchen islands. At LRV 5 it&apos;s genuinely dark, but it&apos;s a true navy — not a
        black-blue and not a bright royal — which is what keeps it timeless rather than trendy.
      </p>
      <p>
        Like any very dark color it eats light, so it&apos;s best where there&apos;s daylight to give it depth,
        or used deliberately for drama on cabinetry and built-ins. It looks expensive with brass,
        natural wood, and warm whites; against a stark white it can feel a bit harsh. The closest
        cross-brand equivalent is Benjamin Moore North Sea — near-identical — so the look crosses the
        BM/SW line easily.
      </p>
    </>
  ),
  "sherwin-williams/tricorn-black-6258": (
    <>
      <p>
        Tricorn Black is a true, neutral black — no blue, no brown, no green cast — which is exactly why
        it&apos;s the go-to for trim, doors, window sashes, and cabinetry. At LRV 3 it&apos;s about as dark as
        architectural paint gets, and its neutrality means it won&apos;t fight whatever undertone your walls
        carry.
      </p>
      <p>
        Used on trim against a light wall it reads crisp and graphic; on a whole wall or exterior it
        reads as a soft, deep black rather than a flat void. If you want a black with a little more
        warmth and softness, Iron Ore is the charcoal alternative. Valspar Tomcat is Tricorn&apos;s
        near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/iron-ore-7069": (
    <>
      <p>
        Iron Ore is the warm charcoal that reads almost-black indoors and softer outside — the
        in-between people choose when true black feels too severe. At LRV 6 it has real depth, but its
        warm gray base keeps it from the hard edge of a pure black, which is why it&apos;s a favorite for
        exterior bodies, front doors, and moody cabinetry.
      </p>
      <p>
        In bright light its brown-gray warmth shows; in shadow it deepens toward black. It pairs
        naturally with warm whites, wood tones, and black hardware. Behr Broadway and PPG Onyx are its
        closest cross-brand matches, both very close on the wall.
      </p>
    </>
  ),
  "sherwin-williams/worldly-gray-7043": (
    <>
      <p>
        Worldly Gray splits the difference between Sherwin-Williams&apos; two famous greiges: a touch warmer
        and softer than Agreeable Gray, a touch grayer than Accessible Beige. At LRV 57 it&apos;s a
        mid-light neutral that leans gentle and earthy rather than crisp.
      </p>
      <p>
        It&apos;s a strong choice for open-plan spaces where you want warmth without committing to beige,
        and it&apos;s forgiving across mixed lighting. Like its greige siblings it can show a faint green or
        violet base in cool north light, so sample before a whole-house commit. Behr Wheat Bread is a
        near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/mindful-gray-7016": (
    <>
      <p>
        Mindful Gray is the deeper sibling of Repose Gray — same family, dropped into mid-tone territory
        at LRV 48. That extra depth is the appeal: it gives a room real contrast and definition where a
        lighter gray would wash out, without going to a heavy charcoal.
      </p>
      <p>
        It works well on accent walls, lower cabinetry, and rooms with strong natural light that can
        carry a mid-tone. In dim rooms it can read darker and cooler than expected, so check it in your
        own light. PPG Ghost Writer is an exact match; Benjamin Moore Thunder is a very close second.
      </p>
    </>
  ),
  "benjamin-moore/white-dove-oc-17": (
    <>
      <p>
        White Dove is the most popular Benjamin Moore color, full stop — a soft warm white at LRV 83
        that has become the default for trim, cabinets, and whole rooms. What makes it the safe pick is
        restraint: it&apos;s warm enough to feel inviting but not so creamy that it reads yellow, so it
        flatters both warm and cool palettes.
      </p>
      <p>
        It&apos;s especially loved on kitchen cabinets, where a brighter white can look cold and a creamier
        one can look dated. The one thing to watch: against a pure bright white it will look noticeably
        soft, so commit to the warm-white direction throughout rather than mixing. In north light it
        reads its cleanest; in warm light it gently glows.
      </p>
    </>
  ),
  "benjamin-moore/revere-pewter-hc-172": (
    <>
      <p>
        Revere Pewter is the greige that launched the entire category — the color most people picture
        when they say &ldquo;warm gray.&rdquo; At LRV 55 it&apos;s a mid-light greige with a gentle green-gray
        base that makes it read grounded and organic rather than cold.
      </p>
      <p>
        It&apos;s a touch deeper than the Sherwin-Williams greiges, so it gives a room a bit more presence —
        excellent in open-plan main floors and rooms with good light. In dim or very warm light its
        green undertone can surface, which is the main thing to sample for. Its closest Behr match is
        Coliseum Marble and its Sherwin-Williams match is Simple Stone, both very close on the wall.
      </p>
    </>
  ),
  "benjamin-moore/chantilly-lace-2121-70": (
    <>
      <p>
        Chantilly Lace is the modern bright white — at LRV 90 it&apos;s about as clean and crisp as paint
        gets, with no obvious warm or cool cast. It&apos;s the white behind the contemporary, gallery-clean
        look: white walls, white trim, lots of light.
      </p>
      <p>
        That brightness is its strength and its caution: in a low-light room it can read slightly cool
        or clinical, and it makes any warmer white nearby look dingy, so don&apos;t mix it with creamier
        whites. It&apos;s stunning in bright, airy rooms and as a crisp trim against deep colors like Hale
        Navy. Behr Snow Fall is its near-identical cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/simply-white-2143-70": (
    <>
      <p>
        Simply White is the warm counterpart to Chantilly Lace — nearly as bright (LRV 90) but with a
        soft warm tint that keeps it from feeling stark. Benjamin Moore named it a Color of the Year for
        good reason: it&apos;s a crowd-pleaser that reads clean in most rooms without the chill of a true
        cool white.
      </p>
      <p>
        In strong warm light it can edge slightly yellow, so it&apos;s happiest in rooms with balanced or
        cooler daylight. It&apos;s a versatile all-rounder for walls and trim together. Behr Palais White is
        its closest cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/edgecomb-gray-hc-173": (
    <>
      <p>
        Edgecomb Gray is the easygoing greige — lighter and softer than Revere Pewter (LRV 63), with
        enough warmth to feel cozy but enough gray to stay current. It&apos;s the &ldquo;can&apos;t go wrong&rdquo;
        neutral for people who find Revere Pewter a touch dark or Agreeable Gray a touch flat.
      </p>
      <p>
        Its lightness makes it forgiving in rooms that don&apos;t get much sun, where deeper greiges can go
        muddy. It pairs with both warm and cool whites and most wood tones. Behr Stonewashed is a
        near-identical match, and Sherwin-Williams Dumpling is very close.
      </p>
    </>
  ),
  "benjamin-moore/pale-oak-oc-20": (
    <>
      <p>
        Pale Oak is the warmest and softest of Benjamin Moore&apos;s popular greiges — a light
        oatmeal-taupe at LRV 69 with a barely-there pink-beige softness that reads almost white in
        bright light and gently warm in shadow. It&apos;s the choice when you want warmth without any
        yellow.
      </p>
      <p>
        That subtle warmth is also the catch: next to a cool gray or a stark white it can look slightly
        pink, so keep its companions warm. It&apos;s lovely in bedrooms and living rooms that get soft
        light, and it makes a gentle whole-house neutral. Check its closest cross-brand matches on its
        color page.
      </p>
    </>
  ),
  "benjamin-moore/palladian-blue-hc-144": (
    <>
      <p>
        Palladian Blue is the soft, restful blue-green that became a designer staple for bathrooms,
        bedrooms, and powder rooms. At LRV 62 it&apos;s light and calm, and like the best blue-greens it
        shifts with the room — more blue in cool light, more sea-glass green in warm light.
      </p>
      <p>
        It reads almost like a tinted neutral, which is why it works on whole rooms rather than just
        accents. Because it moves with the light, sample it where it&apos;s going — a north bath and a
        sunny bedroom will look like two different colors. It pairs beautifully with crisp whites and
        warm wood. Behr Frosted Jade is its closest match, with Sherwin-Williams Waterscape close behind.
      </p>
    </>
  ),
  "benjamin-moore/gray-owl-2137-60": (
    <>
      <p>
        Gray Owl is the cool, airy gray for people who want an actual gray — not a greige. At LRV 66
        it&apos;s light and open, with a faint green-blue base that keeps it fresh rather than steely. It&apos;s
        a favorite for modern, calm rooms and for making small spaces feel larger.
      </p>
      <p>
        The cool base is the thing to respect: in north light it can lean slightly blue or green, so
        it&apos;s strongest in rooms with warm or balanced light, or where you want that crisp, cool
        quality on purpose. It pairs with cool whites and stays out of the way of bold furnishings.
        Sherwin-Williams Silverpointe is a near-identical match; Behr Ashen Tan is close.
      </p>
    </>
  ),
};

export function getColorEditorial(brandSlug: string, colorSlug: string): ReactNode | null {
  return COLOR_EDITORIAL[`${brandSlug}/${colorSlug}`] ?? null;
}
