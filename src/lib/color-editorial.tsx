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
  "sherwin-williams/snowbound-7004": (
    <>
      <p>
        Snowbound is the off-white for people who find Pure White a touch too plain and Alabaster a
        touch too creamy. At LRV 82 it&apos;s bright, but a faint greige in the base gives it a soft,
        slightly sophisticated edge — it reads as a &ldquo;designed&rdquo; white rather than a builder white.
      </p>
      <p>
        That subtle gray is the thing to watch: against a stark white it can look faintly dirty, and in
        cool north light the greige can surface more than you expect, so pair it with warmer companions.
        It&apos;s a strong whole-house white and a clean trim partner for greige walls. PPG Silver Feather
        is its near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/greek-villa-7551": (
    <>
      <p>
        Greek Villa is the warmest of Sherwin-Williams&apos; popular whites — a soft, creamy white at LRV 84
        that&apos;s a half-step warmer than Alabaster without tipping into yellow. It&apos;s the right call when
        you want a white that feels cozy and a little old-world rather than crisp and modern.
      </p>
      <p>
        Its warmth means it glows in lamplight but can look slightly creamy beside cooler whites, so
        commit to the warm direction throughout. It&apos;s a favorite for trim, millwork, and whole rooms in
        traditional homes. Dutch Boy Child of Heaven and Behr Salt Crystal are both near-identical matches.
      </p>
    </>
  ),
  "sherwin-williams/extra-white-7006": (
    <>
      <p>
        Extra White is Sherwin-Williams&apos; crisp, bright white with a slight cool edge — at LRV 86 it&apos;s
        about as clean as their whites get. It&apos;s the pick for contemporary spaces and for trim where you
        want a sharp, modern line rather than a soft, creamy one.
      </p>
      <p>
        Because it leans cool, it can read slightly blue-gray in north light and will make any warm white
        nearby look dingy, so don&apos;t mix it with creamier whites. It&apos;s excellent against warm wood and
        deep colors, where its crispness adds contrast. Benjamin Moore White Christmas is its
        near-identical cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/cloud-white-oc-130": (
    <>
      <p>
        Cloud White is Benjamin Moore&apos;s soft, creamy white for trim, millwork, and cabinetry — warmer
        than Chantilly Lace, a classic that predates the current bright-white era. At LRV 85 it&apos;s bright
        but gentle, the kind of white that reads timeless on detailed trim and traditional cabinets.
      </p>
      <p>
        Its warmth is the point, but it means it can look creamy beside a stark white ceiling, so keep
        the whites consistent. It&apos;s a natural trim partner for warm greiges and creamy walls. Behr Swiss
        Coffee is its near-identical match, which makes the look easy to get at Home Depot.
      </p>
    </>
  ),
  "benjamin-moore/classic-gray-1548": (
    <>
      <p>
        Classic Gray is barely a gray at all — a light, warm almost-white at LRV 75 that reads as the
        softest possible neutral. People reach for it when even a light greige like Edgecomb Gray feels
        too committal: it gives walls a faint warmth and depth without looking like a color at all.
      </p>
      <p>
        In bright rooms it can read nearly white; in softer light its gentle warmth shows. It&apos;s a
        beautiful whole-house choice for people who want &ldquo;not quite white&rdquo; and nothing more. Its
        Sherwin-Williams match Heron Plume is near-identical.
      </p>
    </>
  ),
  "benjamin-moore/stonington-gray-hc-170": (
    <>
      <p>
        Stonington Gray is the classic mid-light gray with a cool blue base — at LRV 60 it&apos;s the
        even-keeled, slightly architectural gray that anchored the gray era and still works for clean,
        calm rooms. It&apos;s a true gray, not a greige, so it won&apos;t bring warmth to a room.
      </p>
      <p>
        That cool base is the consideration: in north light it leans bluer, so it&apos;s strongest in rooms
        with warm or ample light, or where you want a crisp, cool feel deliberately. It pairs cleanly
        with white trim and cool-toned finishes. Behr Road Runner and Sherwin-Williams Sweater Weather
        are both close cross-brand matches.
      </p>
    </>
  ),
  "benjamin-moore/balboa-mist-oc-27": (
    <>
      <p>
        Balboa Mist is the cooler, grayer member of Benjamin Moore&apos;s greige family — at LRV 66 it&apos;s a
        light, soft greige that leans gray rather than beige, which makes it the pick when Revere Pewter
        feels too warm or too deep. It&apos;s a quiet, elegant neutral that reads almost like a warm gray.
      </p>
      <p>
        Its faint warmth keeps it from going cold, but in some light a subtle violet base can surface, so
        sample before a whole-house commit. It&apos;s lovely in bedrooms and living rooms with soft light.
        Behr Ginger Sugar is a dead-on hex match, and Sherwin-Williams Winter Walk is very close.
      </p>
    </>
  ),
  "benjamin-moore/wrought-iron-2124-10": (
    <>
      <p>
        Wrought Iron is the soft near-black designers reach for instead of a true black — a deep charcoal
        at LRV 7 with a gentle warmth that keeps it from feeling stark. It&apos;s the choice for doors, trim,
        and cabinetry when you want depth and drama without the hard edge of a pure black.
      </p>
      <p>
        In bright light its soft charcoal character shows; in shadow it reads essentially black. It pairs
        beautifully with warm whites, brass, and natural wood. Behr Timber Brown is its closest
        cross-brand match.
      </p>
    </>
  ),
  "behr/swiss-coffee-12": (
    <>
      <p>
        Swiss Coffee is Behr&apos;s warm, creamy white and one of the most-bought whites at Home Depot — a
        soft white at LRV 84 with a gentle cream cast that flatters trim, walls, and cabinets without
        reading yellow. It&apos;s the warm-white default for people who find bright whites cold.
      </p>
      <p>
        As with any creamy white, it can look slightly soft beside a stark bright white, so keep the
        whites consistent through a space. It pairs naturally with warm woods and greige walls. It&apos;s a
        near-identical match for Benjamin Moore Cloud White, so it&apos;s the easy way to get that classic
        creamy white at Home Depot prices.
      </p>
    </>
  ),
  "behr/cracked-pepper-ppu18-01": (
    <>
      <p>
        Cracked Pepper is Behr&apos;s soft black — a 2022 Color of the Year that reads as a deep, slightly
        warm near-black at LRV 8 rather than a flat true black. It&apos;s the accessible choice for doors,
        accent walls, and cabinetry at Home Depot, with enough softness to feel modern rather than severe.
      </p>
      <p>
        Like any near-black it needs light to show its character and will read essentially black in
        shadow. It pairs well with warm whites, wood, and brass. Its closest cross-brand match is
        Benjamin Moore Cheating Heart, with Sherwin-Williams Peppercorn in the same family.
      </p>
    </>
  ),
  "behr/silver-drop-790c-2": (
    <>
      <p>
        Silver Drop is one of Behr&apos;s most popular light neutrals — a soft greige-white at LRV 70 that
        sits between a warm white and a light greige. It&apos;s bright enough to keep a room open but warm
        enough to feel soft, which makes it a low-risk whole-house pick for Home Depot shoppers.
      </p>
      <p>
        Its light, gentle character means it can read nearly white in bright rooms and show a faint
        greige in softer light. It&apos;s forgiving across most lighting and pairs with both warm and cool
        accents. Benjamin Moore Woodland White is a close cross-brand match.
      </p>
    </>
  ),
  "behr/ultra-pure-white-w-b-500": (
    <>
      <p>
        Ultra Pure White is Behr&apos;s brightest, cleanest white — at LRV 97 it&apos;s a true, crisp white with
        no obvious undertone, and it doubles as Behr&apos;s tint base, so it&apos;s everywhere at Home Depot. It&apos;s
        the pick for a sharp, modern, gallery-clean look on walls, trim, and ceilings.
      </p>
      <p>
        That brightness is its strength and its caution: in low light it can feel stark or slightly cool,
        and it makes any warmer white nearby look dingy. It&apos;s stunning in bright rooms and as crisp trim
        against deep colors. Benjamin Moore Chantilly Lace is its closest cross-brand equivalent.
      </p>
    </>
  ),
  "ppg/vining-ivy-1148-6": (
    <>
      <p>
        Vining Ivy is PPG&apos;s 2023 Color of the Year — a rich blue-green teal at LRV 15 that lands between
        deep teal and emerald depending on the light. It&apos;s a confident, saturated color, best used as a
        statement: an accent wall, a vanity, built-ins, or a powder room you want to feel jewel-box rich.
      </p>
      <p>
        As a saturated mid-dark color it amplifies lighting — warmer bulbs deepen it, cool daylight
        sharpens its green, so sample it where it&apos;s going. It pairs beautifully with brass, warm wood,
        and creamy whites. Behr Myth and Benjamin Moore Fair Isle Blue are its closest cross-brand matches.
      </p>
    </>
  ),
  "valspar/heritage-gray-7007-24": (
    <>
      <p>
        Heritage Gray is, for practical purposes, Agreeable Gray at Lowe&apos;s. It shares the same hex and
        the same LRV 60, and scores a CIEDE2000 difference of essentially zero against Sherwin-Williams&apos;
        most popular color — a dead-on match. If you love Agreeable Gray but buy paint at Lowe&apos;s, this is
        the color to ask for by name.
      </p>
      <p>
        Everything true of Agreeable Gray applies: a warm greige that holds steady across mixed light,
        pairs with a crisp white trim, and can show a faint green-violet base in cool north light. The
        practical win is purely about where you shop — same look, Valspar can. Behr Toasty Gray and
        Benjamin Moore Wish are the equivalents at their stores.
      </p>
    </>
  ),
  "sherwin-williams/evergreen-fog-9130": (
    <>
      <p>
        Evergreen Fog is the color that signaled the shift away from gray — a soft, complex
        sage that sits between green, gray, and blue, which is exactly why Sherwin-Williams named it a
        Color of the Year. At LRV 30 it&apos;s a true mid-tone with real presence: enough depth to feel
        intentional on cabinetry, an accent wall, or a whole moody room, without going dark.
      </p>
      <p>
        Its complexity is the thing to respect — it reads greener in some light and grayer in others,
        so sample it where it&apos;s going. It pairs beautifully with warm whites, brass, and natural wood.
        Behr Hunters Hollow is a near-identical cross-brand match, with Benjamin Moore Storm Cloud Gray
        close behind.
      </p>
    </>
  ),
  "benjamin-moore/october-mist-cc-550": (
    <>
      <p>
        October Mist is Benjamin Moore&apos;s gently grayed sage — a 2022 Color of the Year that reads as a
        calm, dusty green at LRV 47. It&apos;s soft enough to use across a whole room yet has enough body to
        feel like a real color rather than a tinted neutral, which is the balance that made it a
        designer favorite for bedrooms and quiet living spaces.
      </p>
      <p>
        It leans muted rather than vivid, so it plays well with creamy whites, warm wood, and other
        earthy tones. In cool light its gray side shows; in warm light the green warms up. Its
        near-identical Sherwin-Williams match is Softened Green.
      </p>
    </>
  ),
  "benjamin-moore/saybrook-sage-hc-114": (
    <>
      <p>
        Saybrook Sage is the classic, slightly deeper sage — a mid-tone muted green at LRV 46 with a
        timeless, almost colonial quality. Where October Mist is misty and soft, Saybrook Sage is a
        touch richer and more grounded, which makes it a strong exterior color as well as an interior
        one.
      </p>
      <p>
        Its muted depth reads as a sophisticated neutral-green rather than a statement, and it pairs
        naturally with warm whites and stone. Behr Environmental is a near-identical match; Sherwin-Williams
        Cascade Green is in the same family.
      </p>
    </>
  ),
  "benjamin-moore/quiet-moments-1563": (
    <>
      <p>
        Quiet Moments is one of the great chameleons — a soft blue-green-gray at LRV 62 that reads more
        blue in some rooms, more green in others, and almost gray in low light. That shape-shifting
        quality is the whole appeal: it brings color to a space while staying calm and livable, which is
        why it&apos;s a perennial favorite for bathrooms and bedrooms.
      </p>
      <p>
        Because it moves so much with light, it&apos;s a color you genuinely cannot judge from the chip —
        sample it where it&apos;s going. It pairs with crisp whites and warm wood. Its near-identical
        Sherwin-Williams match is Sea Spray, and Behr Shy Green is close.
      </p>
    </>
  ),
  "sherwin-williams/oyster-bay-6206": (
    <>
      <p>
        Oyster Bay is Sea Salt&apos;s deeper, more saturated sibling — a green-gray at LRV 44 with more body
        and a slightly bluer cast. It&apos;s the choice when Sea Salt feels too pale to register, giving a
        room a soft, sea-glass color that still behaves like a sophisticated neutral.
      </p>
      <p>
        Like all of this family it shifts between green and gray-blue with the light, so sample before
        committing. It&apos;s lovely in kitchens, bathrooms, and studies, and pairs with white trim and warm
        metals. Benjamin Moore Sea Haze is its closest cross-brand match.
      </p>
    </>
  ),
  "ppg/olive-sprig-1125-4": (
    <>
      <p>
        Olive Sprig is PPG&apos;s soft sage Color of the Year — a gentle, grayed green at LRV 42 in the same
        family as Evergreen Fog and October Mist. It rode the sage-green wave for good reason: it&apos;s
        restful and organic, equally at home in a bedroom, a kitchen island, or a built-in.
      </p>
      <p>
        As a muted mid-tone it reads as a calm color rather than a bold one, and it pairs naturally with
        warm whites and wood. Benjamin Moore Estate Sale is a near-identical match, with Sherwin-Williams
        Clary Sage close behind.
      </p>
    </>
  ),
  "sherwin-williams/gauntlet-gray-7019": (
    <>
      <p>
        Gauntlet Gray is the deep, confident gray people reach for when a light gray feels like nothing.
        At LRV 17 it&apos;s a true mid-dark — a warm-leaning charcoal-gray with enough depth for exteriors,
        cabinetry, and dramatic accent walls, but not so dark it reads black.
      </p>
      <p>
        It&apos;s a popular exterior body color precisely because it holds its character in full sun without
        washing out. Indoors it needs decent light to avoid going heavy. It pairs with crisp white trim
        and black hardware for a modern look. Behr Unpredictable Hue is a near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/dorian-gray-7017": (
    <>
      <p>
        Dorian Gray is the mid-tone greige in Sherwin-Williams&apos; gray family — at LRV 39 it&apos;s
        noticeably deeper than Repose or Agreeable, with a warm griege base that keeps it from feeling
        cold. It&apos;s the choice for rooms that want real contrast and a grounded, slightly dramatic
        neutral rather than a pale wash.
      </p>
      <p>
        In bright rooms it reads as a rich greige; in dim light it can go quite dark, so check it in
        your own space. It anchors a room well against white trim and works on exteriors too. Behr
        Moleskin is a near-identical match.
      </p>
    </>
  ),
  "sherwin-williams/drift-of-mist-9166": (
    <>
      <p>
        Drift of Mist is a light, soft greige at LRV 69 — brighter and airier than Agreeable Gray, with
        a gentle warmth that keeps it from going cold. It&apos;s the pick for people who want a barely-there
        neutral that still has a little color to it, especially in rooms that need to feel open.
      </p>
      <p>
        Its lightness makes it forgiving across lighting, though a faint violet base can show in cool
        light. It pairs with both warm and cool whites. Its closest cross-brand match is Behr Silver
        Drop, and it&apos;s very close to Benjamin Moore Balboa Mist.
      </p>
    </>
  ),
  "sherwin-williams/eider-white-7014": (
    <>
      <p>
        Eider White straddles the line between a light greige and an off-white — at LRV 73 it&apos;s soft
        and pale, reading nearly white in bright light and showing a gentle greige warmth in shadow.
        It&apos;s the choice when a true white feels too clinical but a greige feels too committal.
      </p>
      <p>
        That in-between quality makes it a flexible whole-house color, though its subtle warmth means it
        can look slightly soft beside a stark white. It pairs with warm whites and natural materials.
        Benjamin Moore White Winged Dove is its near-identical match.
      </p>
    </>
  ),
  "benjamin-moore/kendall-charcoal-hc-166": (
    <>
      <p>
        Kendall Charcoal is the rich, slightly warm charcoal that gives a room depth without the
        finality of black. At LRV 14 it&apos;s a true dark, but its warmth keeps it from feeling cold or
        severe, which is why it&apos;s a favorite for exteriors, cabinetry, libraries, and accent walls.
      </p>
      <p>
        In good light its warm charcoal character shows; in shadow it deepens toward near-black. It pairs
        with warm whites, brass, and wood. Its near-identical Sherwin-Williams match is Storm Warning,
        with Behr Mined Coal close behind.
      </p>
    </>
  ),
  "benjamin-moore/coventry-gray-hc-169": (
    <>
      <p>
        Coventry Gray is a classic mid-tone gray with a soft blue base — at LRV 49 it&apos;s a clean,
        even-handed gray that gives a room definition without the warmth of a greige. It&apos;s the choice
        for a crisp, traditional gray that still feels current.
      </p>
      <p>
        Its cool blue base reads more strongly in north light, so it&apos;s happiest with warm or ample
        light, or where you want that crisp quality on purpose. It pairs cleanly with white trim and
        cool-toned finishes. Sherwin-Williams Argos is a close cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/collingwood-859": (
    <>
      <p>
        Collingwood is one of Benjamin Moore&apos;s most popular soft greiges — a light, gentle gray-beige
        at LRV 63 with a barely-there violet warmth that keeps it soft and livable. It&apos;s the easygoing,
        can&apos;t-go-wrong neutral for people who find Revere Pewter too deep or too green.
      </p>
      <p>
        Its lightness makes it forgiving in most rooms, though the faint violet base can surface in cool
        light. It pairs with warm and cool whites alike. It&apos;s a near-exact match for Sherwin-Williams
        Gossamer Veil, and very close to Behr Toasty Gray.
      </p>
    </>
  ),
  "behr/toasty-gray-n320-2": (
    <>
      <p>
        Toasty Gray is Behr&apos;s warm greige — and the color most people land on when they want Sherwin-Williams
        Agreeable Gray at Home Depot. At LRV 61 it&apos;s a near-identical stand-in for Agreeable Gray
        (a barely-perceptible difference on the wall), which makes it the practical pick if Behr is the
        brand your store carries.
      </p>
      <p>
        Everything true of a warm greige applies: it holds steady across mixed light, pairs with a crisp
        white trim, and can show a faint cool undertone in heavy north light. Within Behr it&apos;s a
        flexible whole-house neutral; its closest Benjamin Moore relative is Night Mist.
      </p>
    </>
  ),
  "sherwin-williams/shoji-white-7042": (
    <>
      <p>
        Shoji White is one of Sherwin-Williams&apos; most-used warm off-whites — at LRV 74 it&apos;s the
        in-between people reach for when a true white feels too cold and a greige feels too gray. It has
        a soft, warm linen quality that flatters cabinetry, trim, and whole rooms, and it&apos;s a natural
        partner for the warm-greige walls that replaced the gray era.
      </p>
      <p>
        Because it&apos;s warm, it can read slightly creamy beside a stark white, so keep the whites in a
        room consistent. It&apos;s most forgiving in soft, natural light. Behr Crisp Linen is a
        near-identical cross-brand match, with Benjamin Moore Etiquette close behind.
      </p>
    </>
  ),
  "sherwin-williams/modern-gray-7632": (
    <>
      <p>
        Modern Gray is a light, warm greige at LRV 62 with a subtle taupe-mauve base — the warmest of
        Sherwin-Williams&apos; popular light neutrals. It&apos;s the choice when Agreeable Gray feels too cool
        or too gray; it brings genuine warmth to a room without going full beige.
      </p>
      <p>
        That faint violet-taupe undertone is the thing to sample for — in some light it can lean
        slightly pink, so keep its companions warm. It&apos;s lovely in bedrooms and living rooms with soft
        light. Behr Mineral is a near-identical match, with Benjamin Moore Rocking Chair close behind.
      </p>
    </>
  ),
  "sherwin-williams/useful-gray-7050": (
    <>
      <p>
        Useful Gray lives up to its name — a flexible warm greige at LRV 59 that sits comfortably between
        gray and beige. It&apos;s a close cousin of Benjamin Moore Revere Pewter (a near-identical match),
        which makes it the SW pick for that same grounded, organic greige look.
      </p>
      <p>
        Its balance is the appeal: enough warmth to feel inviting, enough gray to stay current, and a
        light-mid LRV that works in most rooms. Like its greige siblings it can show a faint green base
        in cool light. Behr Coliseum Marble is also a close cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/anew-gray-7030": (
    <>
      <p>
        Anew Gray is a mid-tone greige at LRV 47 — deeper and warmer than Agreeable Gray, with enough
        body to give a room real definition. It&apos;s the choice when you want a greige that reads as an
        actual color rather than a pale backdrop, especially in well-lit rooms.
      </p>
      <p>
        At this depth it can go noticeably darker in low light, so check it in your own space before a
        whole-house commit. It pairs well with white trim and warm wood. Behr Grey Mist and Benjamin
        Moore Silver Fox are its closest cross-brand matches.
      </p>
    </>
  ),
  "sherwin-williams/amazing-gray-7044": (
    <>
      <p>
        Amazing Gray is a mid-tone greige at LRV 47 in the same depth range as Anew Gray, with a warm,
        slightly earthy base. It&apos;s a strong choice for open-plan spaces that want a grounded neutral
        with presence — deep enough to anchor a room, warm enough to stay welcoming.
      </p>
      <p>
        As with any mid-tone greige, it darkens in low light and shows its warmth in bright light, so
        sample in place. It pairs with crisp white trim and natural materials. Behr Grey Mist and
        Benjamin Moore Silver Fox are its closest matches.
      </p>
    </>
  ),
  "benjamin-moore/natural-linen-966": (
    <>
      <p>
        Natural Linen is a warm, soft greige-tan at LRV 60 — the kind of light earth-tone that reads
        cozy and organic without going yellow. It&apos;s a versatile whole-house neutral for people who
        lean warm, sitting a touch more beige than the popular gray-greiges.
      </p>
      <p>
        Its warmth makes it forgiving in north-facing rooms where cooler neutrals can feel flat, but it
        can look creamy beside a stark white. It pairs naturally with wood and warm whites. Its
        near-identical Sherwin-Williams match is Wool Skein.
      </p>
    </>
  ),
  "sherwin-williams/white-heron-7627": (
    <>
      <p>
        White Heron is a soft, clean white at LRV 76 with just a whisper of warmth — crisp enough to feel
        fresh, soft enough to avoid the chill of a true cool white. It&apos;s a flexible choice for trim,
        walls, and cabinets, especially in rooms that get good light.
      </p>
      <p>
        Its gentle warmth keeps it livable, but like any soft white it can look faintly creamy beside a
        bright white, so keep the whites consistent. Behr Cinnamon Cake is a near-identical match, with
        Benjamin Moore Etiquette close behind.
      </p>
    </>
  ),
  "sherwin-williams/sleepy-blue-6225": (
    <>
      <p>
        Sleepy Blue is the soft, calming powder blue-gray its name promises — at LRV 58 it&apos;s light and
        restful, the kind of gentle blue that works beautifully in bedrooms, nurseries, and bathrooms
        without feeling juvenile. It&apos;s a muted, grayed blue rather than a bright one.
      </p>
      <p>
        Because it&apos;s soft and grayed, it reads as a serene near-neutral, though it can lean cooler in
        north light. It pairs with crisp whites and natural wood. Behr High Speed Access and Benjamin
        Moore Smoke are its closest cross-brand matches.
      </p>
    </>
  ),
  "sherwin-williams/rainwashed-6211": (
    <>
      <p>
        Rainwashed is Sherwin-Williams&apos; soft spa blue-green — a cousin of Sea Salt, a touch bluer and
        at a similar LRV 59. It has the same chameleon quality, shifting between pale aqua, soft green,
        and gray depending on the light, which is why it&apos;s a perennial favorite for bathrooms and
        coastal-feeling rooms.
      </p>
      <p>
        That shape-shifting means you can&apos;t judge it from the chip — sample it where it&apos;s going. It
        pairs with crisp whites and warm wood and fights cool grays. Benjamin Moore Silver Marlin and
        Behr Frosted Jade are its closest cross-brand matches.
      </p>
    </>
  ),
  "benjamin-moore/van-deusen-blue-hc-156": (
    <>
      <p>
        Van Deusen Blue is a deep, historic navy with a slate-gray softness — at LRV 10 it&apos;s dark and
        dramatic, but its grayed base keeps it from reading as a bright or primary blue. It&apos;s a
        sophisticated choice for cabinetry, libraries, and statement walls in traditional homes.
      </p>
      <p>
        Like any deep blue it needs light to keep from collapsing toward black, and it looks richest
        with warm whites, brass, and wood. It sits in the same deep-blue family as Hale Navy but reads a
        touch grayer. Behr Harbour is its closest cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/newburyport-blue-hc-155": (
    <>
      <p>
        Newburyport Blue is the navy that sits right beside Hale Navy in Benjamin Moore&apos;s Historical
        Collection — at LRV 9 it&apos;s a rich, classic navy with a slightly cooler, bluer character than
        Hale Navy&apos;s gray-green softness. It&apos;s the pick when you want a navy that reads a little more
        true-blue.
      </p>
      <p>
        As a deep color it&apos;s best with good light or used deliberately for drama on doors, islands, and
        built-ins. It pairs with crisp and warm whites alike. Behr Harbour is a near-identical
        cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/distance-6243": (
    <>
      <p>
        Distance is a deep, moody blue-gray slate at LRV 15 — darker and grayer than a true navy, which
        gives it a sophisticated, almost stormy quality. It&apos;s a strong choice for an accent wall,
        cabinetry, or a study you want to feel enveloping and a little dramatic.
      </p>
      <p>
        At this depth it shifts noticeably with light — bluer in daylight, grayer and darker in shadow —
        so sample it in place. It pairs with warm metals and crisp whites. Behr Hypnotic is a very close
        cross-brand match, with Benjamin Moore Thousand Oceans very similar.
      </p>
    </>
  ),
  "sherwin-williams/sea-serpent-7615": (
    <>
      <p>
        Sea Serpent is a deep, complex teal that lives between blue and green — at LRV 7 it&apos;s rich and
        saturated, the kind of jewel tone that turns a powder room, a built-in, or an accent wall into a
        focal point. It reads more blue in some light, more green in others.
      </p>
      <p>
        As a deep, saturated color it amplifies lighting and needs some daylight to show its depth
        rather than going near-black. It looks striking with brass, warm wood, and creamy whites. Behr
        Orion Gray and Benjamin Moore Blue Note are its closest cross-brand matches.
      </p>
    </>
  ),
  "sherwin-williams/rosemary-6187": (
    <>
      <p>
        Rosemary is a deep, earthy green at LRV 14 — a grayed, herbal green with real depth that brings
        a grounded, natural drama to a room. It&apos;s the choice for a moody green on cabinetry, a library,
        or an accent wall, in the family of the deep-sage trend but darker and more saturated.
      </p>
      <p>
        At this depth it needs light to read as green rather than near-black, and it pairs beautifully
        with warm whites, brass, and natural wood. Benjamin Moore Rainy Afternoon and Behr Gray Owl are
        its closest cross-brand matches.
      </p>
    </>
  ),
  "sherwin-williams/urbane-bronze-7048": (
    <>
      <p>
        A 2021 Color of the Year, Urbane Bronze is the warm, earthy near-black that anchored the move
        toward cozy-dark interiors. At LRV 8 it&apos;s deep, but it&apos;s a bronze-charcoal — a gray with real
        brown warmth — rather than a flat black, which is why it feels enveloping instead of severe on
        accent walls, fireplaces, cabinetry, and front doors.
      </p>
      <p>
        It comes alive against warm whites, wood, and brass, and reads richest where there&apos;s some light
        to bring out the bronze; in shadow it goes nearly black. Its near-identical cross-brand match is
        Benjamin Moore Dragon&apos;s Breath, with Behr Underground close behind.
      </p>
    </>
  ),
  "sherwin-williams/redend-point-9081": (
    <>
      <p>
        Redend Point — a 2023 Color of the Year — captured the shift toward warm, earthy color. At LRV 30
        it&apos;s a soft clay-rose: a blush-beige with terracotta warmth that reads sophisticated rather than
        pink, and brings a grounded, organic glow to a room without the weight of a true terracotta.
      </p>
      <p>
        It&apos;s lovely on bedroom and living-room walls and in spaces that get warm afternoon light, where
        its rosy warmth deepens. Pair it with creamy whites, natural wood, and unlacquered brass. Behr
        Caramel Cream is its closest cross-brand match, with Benjamin Moore Gaucho Brown very similar.
      </p>
    </>
  ),
  "benjamin-moore/aegean-teal-2136-40": (
    <>
      <p>
        Benjamin Moore&apos;s 2021 Color of the Year, Aegean Teal is a mid-tone blue-green with a grayed,
        earthy quality — at LRV 24 it has enough depth to feel immersive without going dark. It&apos;s the
        teal that works as a whole-room color rather than just an accent, which is what set it apart from
        brighter teals.
      </p>
      <p>
        It leans more green or more blue depending on the light, so sample it in place. It pairs
        beautifully with warm whites, wood, and brass for a layered, natural look. Behr Polaris Blue is a
        near-identical cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/metropolitan-af-690-2": (
    <>
      <p>
        Metropolitan, Benjamin Moore&apos;s 2019 Color of the Year, is a calm, balanced mid gray at LRV 51 —
        a true gray with a soft, slightly warm steadiness that never reads cold or stark. It&apos;s the
        &ldquo;perfect neutral gray&rdquo; the gray era was always chasing: enough presence to feel intentional,
        enough restraint to disappear behind your furnishings.
      </p>
      <p>
        It holds its character well across lighting, which is part of why it became a go-to for whole
        rooms and even exteriors. It pairs cleanly with white trim and both warm and cool accents. Behr
        Keystone Gray is a near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/watery-6478": (
    <>
      <p>
        Watery is exactly what the name suggests — a soft, airy blue with a green whisper, like sea glass
        at LRV 57. It&apos;s light enough to feel calm and spacious, which made it a staple for bathrooms,
        bedrooms, and laundry rooms where you want a touch of color without commitment.
      </p>
      <p>
        Like all soft blue-greens it shifts with the light, reading more blue in cool daylight and softer
        under warm bulbs, so sample where it&apos;s going. It pairs with crisp whites and natural wood. Behr
        Meteor Shower and Benjamin Moore Heavenly Blue are its closest cross-brand matches.
      </p>
    </>
  ),
  "sherwin-williams/tradewind-6218": (
    <>
      <p>
        Tradewind is a serene, light blue-gray at LRV 61 — barely-there blue with enough gray to behave
        like a soft neutral. It&apos;s the choice for a tranquil, coastal-leaning room that still feels
        grown-up, popular in bedrooms and bathrooms for its spa-like calm.
      </p>
      <p>
        Its gentle, grayed quality keeps it from reading juvenile, though it can lean cooler in north
        light. It pairs with crisp whites and pale wood. Behr Silver Bullet is a near-identical match,
        with Benjamin Moore Brittany Blue close behind.
      </p>
    </>
  ),
  "benjamin-moore/wythe-blue-hc-143": (
    <>
      <p>
        Wythe Blue is a historic mid-tone blue-green at LRV 49 — a muted, slightly dusty aqua with a
        vintage character that reads more sophisticated than a bright aqua. It has enough body to make a
        statement on cabinetry, a kitchen, or a whole room without going dark.
      </p>
      <p>
        It swings between blue and green with the light, so it&apos;s worth sampling in place. It pairs
        beautifully with warm whites, brass, and natural wood for a classic, collected look. Behr Urban
        Putty is its closest cross-brand match, with Sherwin-Williams Hazel close.
      </p>
    </>
  ),
  "sherwin-williams/passive-7064": (
    <>
      <p>
        Passive is the cool counterpart to the warm greiges — a light, true gray at LRV 60 with a clean
        blue base and none of the beige that defines Agreeable or Repose. It&apos;s the pick for a crisp,
        modern, cool-gray room, especially where you want gray to read as gray rather than greige.
      </p>
      <p>
        That cool base is the consideration: in north light it can lean slightly blue, so it&apos;s strongest
        with warm or ample light, or where you want that crisp quality on purpose. Behr Mexican Silver is
        a near-identical match, with Benjamin Moore Perspective very close.
      </p>
    </>
  ),
  "sherwin-williams/network-gray-7073": (
    <>
      <p>
        Network Gray is a mid-tone gray with a warm, slightly green-brown base at LRV 37 — deep enough to
        give a room contrast and definition, warm enough to avoid feeling cold. It&apos;s a popular exterior
        body color and a strong interior choice for accent walls and rooms with good light.
      </p>
      <p>
        At this depth it reads darker in low light, so check it in your own space. It pairs with white
        trim and black accents for a grounded, modern look. Behr Silent Film and Benjamin Moore Delray
        Gray are its closest cross-brand matches.
      </p>
    </>
  ),
  "benjamin-moore/abalone-2108-60": (
    <>
      <p>
        Abalone is a soft, warm greige-taupe at LRV 63 with a faint violet-gray shimmer that gives it a
        quiet elegance. It&apos;s a light, livable neutral for people who want something a little more
        nuanced than a plain greige — gentle enough for bedrooms, refined enough for a whole house.
      </p>
      <p>
        Its subtle violet base can surface in cool light, so it&apos;s worth sampling against your trim. It
        pairs with both warm and cool whites. Its near-identical Sherwin-Williams match is Grey Heron,
        with Behr Toasty Gray close behind.
      </p>
    </>
  ),
  "sherwin-williams/aesthetic-white-7035": (
    <>
      <p>
        Aesthetic White is a soft, warm off-white at LRV 73 — gentler than a true white, with a subtle
        greige warmth that keeps it from feeling stark. It&apos;s a flexible whole-house choice for people
        who want a barely-there warm neutral on walls and a soft white on trim.
      </p>
      <p>
        Its warmth means it can look slightly soft beside a bright white, so keep the whites consistent.
        It&apos;s most flattering in soft, natural light. Behr Cotton Knit is a near-identical match, with
        Benjamin Moore Etiquette close behind.
      </p>
    </>
  ),
  "benjamin-moore/wickham-gray-hc-171": (
    <>
      <p>
        Wickham Gray is a light, cool gray with a faint green base at LRV 68 — airy and fresh, the kind
        of pale gray that keeps a room feeling open and crisp. It&apos;s a favorite for modern spaces and for
        making small or low-light rooms feel larger and cleaner.
      </p>
      <p>
        Its cool, slightly green base reads more strongly in north light, so it&apos;s happiest with warm or
        balanced light. It pairs with cool whites and stays quietly in the background. Behr Ground Fog is
        a near-identical match, with Sherwin-Williams Opaline close.
      </p>
    </>
  ),
  "sherwin-williams/cyberspace-7076": (
    <>
      <p>
        Cyberspace is a deep blue-black at LRV 6 — a near-black with a distinct cool, slate-blue
        character that separates it from a true neutral black. It&apos;s the dramatic choice for cabinetry,
        accent walls, and exteriors when you want depth with a hint of blue rather than warm or pure
        black.
      </p>
      <p>
        Like any near-black it reads essentially black in low light and shows its blue depth where
        there&apos;s daylight. It pairs crisply with cool whites and chrome, or warms up with brass. Its
        near-identical cross-brand match is Benjamin Moore Black Horizon.
      </p>
    </>
  ),
  "benjamin-moore/chelsea-gray-hc-168": (
    <>
      <p>
        Chelsea Gray is a deep, confident mid-dark gray at LRV 23 — a true gray with enough depth to read
        almost charcoal, which made it a defining color of the modern gray-cabinet and gray-exterior
        look. It gives a kitchen island or a built-in real weight without going to black.
      </p>
      <p>
        It needs good light to avoid reading flat-dark, and it looks sharp against crisp white trim and
        marble. In softer light its depth deepens. Behr Pier is a near-identical cross-brand match, with
        Sherwin-Williams Classic French Gray close behind.
      </p>
    </>
  ),
  "sherwin-williams/cavern-clay-7701": (
    <>
      <p>
        Sherwin-Williams&apos; 2019 Color of the Year, Cavern Clay is the warm terracotta that helped bring
        earthy, sun-baked color back into style. At LRV 20 it&apos;s a rich, grounded clay — orange-brown
        with a weathered, Southwestern warmth — that feels organic rather than loud, especially on an
        accent wall, a powder room, or built-ins.
      </p>
      <p>
        As a deep warm tone it glows under warm light and deepens in shadow. It pairs naturally with
        creamy whites, rattan, leather, and greenery. Benjamin Moore Audubon Russet is its
        near-identical cross-brand match, with Behr Orange Flambe very close.
      </p>
    </>
  ),
  "benjamin-moore/caliente-af-290": (
    <>
      <p>
        Caliente, Benjamin Moore&apos;s 2018 Color of the Year, is a bold, vibrant red with real depth — at
        LRV 7 it&apos;s saturated and dramatic without tipping orange or pink. It&apos;s a statement color: a
        front door, a dining room, an accent wall, or cabinetry where you want energy and confidence.
      </p>
      <p>
        Reds intensify under warm light and can read slightly different across the day, so sample before
        committing a whole room. It pairs strikingly with crisp whites, warm wood, and black. Behr New
        Brick is a near-identical cross-brand match.
      </p>
    </>
  ),
  "benjamin-moore/hawthorne-yellow-hc-4": (
    <>
      <p>
        Hawthorne Yellow is the soft, golden yellow people reach for when they want warmth and cheer
        without a high-energy primary. At LRV 71 it&apos;s light and buttery — sunny in a north-facing room
        but never acidic — which is why it&apos;s a long-running favorite for kitchens, entries, and
        traditional spaces.
      </p>
      <p>
        Yellows read more golden under warm bulbs and truer in daylight; the higher LRV keeps it gentle
        rather than vivid. It pairs with crisp whites and warm wood. Its near-identical Sherwin-Williams
        match is Optimistic Yellow, with Behr Wickerware close behind.
      </p>
    </>
  ),
  "benjamin-moore/shadow-2117-30": (
    <>
      <p>
        Shadow, Benjamin Moore&apos;s 2017 Color of the Year, is a deep, smoky amethyst — a purple with so
        much gray and depth (LRV 8) that it reads as a sophisticated near-neutral rather than a bold
        violet. It brings drama and a velvety quality to bedrooms, dining rooms, and accent walls.
      </p>
      <p>
        Purple is the most lighting-sensitive family in paint: Shadow can pull more mauve under warm
        bulbs and more blue-violet in daylight, so sampling at several times of day is essential. It
        pairs with brass, deep wood, and soft whites. Behr Extravagance and Sherwin-Williams Quixotic
        Plum are its closest cross-brand matches.
      </p>
    </>
  ),
  "benjamin-moore/first-light-2102-70": (
    <>
      <p>
        First Light, Benjamin Moore&apos;s 2020 Color of the Year, is a soft, barely-there blush — a pink so
        gentle (LRV 76) that it reads almost as a warm neutral. It signaled the move toward warmer,
        softer palettes and works as a whole-room color in bedrooms and nurseries without reading sweet
        or childish.
      </p>
      <p>
        Its faint pink warmth can surface more against cool whites, so keep companions warm. It&apos;s most
        flattering in soft natural light. Behr Victorian Pearl is its closest cross-brand match, with
        Sherwin-Williams Intimate White very similar.
      </p>
    </>
  ),
  "sherwin-williams/pier-7545": (
    <>
      <p>
        Pier is a deep, sophisticated brown at LRV 9 — a rich, slightly cool-leaning chocolate that
        reads modern rather than dated, which is the trick most dark browns miss. It&apos;s a confident
        choice for cabinetry, an accent wall, or an exterior body where you want warmth and depth without
        going to black.
      </p>
      <p>
        As a deep tone it needs some light to show its brown character and reads nearly black in shadow.
        It pairs beautifully with warm whites, brass, and natural materials. Behr Melted Chocolate is its
        closest cross-brand match, with Benjamin Moore Char Brown very similar.
      </p>
    </>
  ),
  "benjamin-moore/manchester-tan-hc-81": (
    <>
      <p>
        Manchester Tan is the classic warm tan — a soft, light beige at LRV 63 with a gentle greige
        balance that keeps it from going yellow. It&apos;s the timeless &ldquo;warm neutral&rdquo; for traditional
        homes, the tan equivalent of a safe, can&apos;t-go-wrong greige.
      </p>
      <p>
        Its warmth makes it forgiving in cooler rooms, though in strong warm light it can edge toward
        gold. It pairs with both warm and cool whites and most wood tones. Its near-identical
        Sherwin-Williams match is Warm Oats, with Behr Natural Almond close behind.
      </p>
    </>
  ),
  "sherwin-williams/pewter-green-6208": (
    <>
      <p>
        Pewter Green is the deep, muted green that became a go-to for moody kitchen cabinets and
        built-ins. At LRV 12 it&apos;s a rich gray-green with real depth — saturated enough to feel like a
        statement, grayed enough to behave like a sophisticated neutral rather than a bold green.
      </p>
      <p>
        It reads greener in good light and nearly charcoal in shadow, so it&apos;s strongest where there&apos;s
        daylight or where you want the drama. It pairs beautifully with brass, warm wood, and creamy
        whites. Behr Pastoral is its closest cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/clary-sage-6178": (
    <>
      <p>
        Clary Sage is a muted, mid-tone sage green at LRV 41 — a soft, grayed herbal green that sits in
        the same family as the popular sages but with a touch more gray, which keeps it calm and
        livable. It works as a whole-room color in bedrooms, kitchens, and studies.
      </p>
      <p>
        Its grayed quality means it reads as a gentle, earthy neutral-green rather than a vivid one, and
        it pairs naturally with warm whites and wood. It shifts a little greener or grayer with the
        light. Benjamin Moore Nature and Behr Dill Seed are its closest cross-brand matches.
      </p>
    </>
  ),
  "sherwin-williams/dried-thyme-6186": (
    <>
      <p>
        Dried Thyme is a deep, earthy herb-green at LRV 21 — richer and darker than the soft sages, with
        a grounded, slightly olive character. It&apos;s the choice for a moody but natural green on
        cabinetry, an accent wall, or an exterior, in the deep-green family with Pewter Green but warmer
        and more olive.
      </p>
      <p>
        At this depth it needs light to read clearly as green rather than near-brown, and it pairs
        beautifully with creamy whites, brass, and wood. Behr Cactus Garden is its closest cross-brand
        match.
      </p>
    </>
  ),
  "sherwin-williams/light-french-gray-55": (
    <>
      <p>
        Light French Gray is a cool, sophisticated mid-light gray at LRV 53 — a true gray with a soft
        blue base and none of the greige warmth, which gives it a crisp, slightly European elegance. It&apos;s
        the choice for a clean, cool gray that still has enough depth to register on a wall.
      </p>
      <p>
        That cool blue base reads more strongly in north light, so it&apos;s happiest with warm or balanced
        light, or where you want the crispness on purpose. It pairs with cool whites and stone. It&apos;s a
        dead-on match for Benjamin Moore Smoke, and very close to Behr Gull Gray.
      </p>
    </>
  ),
  "sherwin-williams/kilim-beige-6106": (
    <>
      <p>
        Kilim Beige is a warm, classic tan-beige at LRV 57 — a soft earth tone with a gentle pink-tan
        warmth that defined the warm-neutral look before the greige era. It&apos;s making a comeback as warm
        tones return, working as a cozy whole-house color in traditional and transitional homes.
      </p>
      <p>
        Its warmth can edge slightly peachy in strong warm light, so keep companions warm and sample in
        place. It pairs with creamy whites and wood. Benjamin Moore Adobe Beige is its near-identical
        cross-brand match, with Behr Riviera Retreat close behind.
      </p>
    </>
  ),
  "benjamin-moore/shaker-beige-hc-45": (
    <>
      <p>
        Shaker Beige is a warm, classic beige at LRV 54 — a soft, slightly golden tan with a timeless,
        traditional quality. It&apos;s the kind of warm neutral that anchored countless living rooms before
        gray took over, and it&apos;s a reliable choice for homes that lean warm and classic.
      </p>
      <p>
        In strong warm light it can read more golden, so it&apos;s worth sampling against your trim and
        floors. It pairs with creamy whites and wood tones. Behr Coco is a near-identical cross-brand
        match, with Sherwin-Williams Sand Beach close behind.
      </p>
    </>
  ),
  "sherwin-williams/roycroft-copper-red-2839": (
    <>
      <p>
        Roycroft Copper Red is a deep, brick-toned red with an Arts &amp; Crafts heritage — at LRV 7 it&apos;s a
        rich, earthy red-brown rather than a bright red, which gives it a warm, grounded, almost leather
        quality. It&apos;s a sophisticated statement color for dining rooms, studies, and front doors.
      </p>
      <p>
        Its depth and brick undertone keep it from feeling loud, and it reads richest with some light. It
        pairs with warm whites, wood, and brass for a classic, collected look. Benjamin Moore Rustique is
        its closest cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/creamy-7012": (
    <>
      <p>
        Creamy is exactly what it sounds like — a soft, warm white at LRV 81 with a gentle cream tone
        that reads cozy and inviting rather than stark. It&apos;s a go-to for trim, cabinets, and whole rooms
        in homes that lean warm and traditional, the antidote to the cool, gallery-clean whites.
      </p>
      <p>
        Its warmth glows under lamplight but can look soft beside a bright white, so keep the whites
        consistent. It pairs naturally with wood, warm greiges, and brass. Benjamin Moore Collector&apos;s
        Item is a near-identical cross-brand match, with Behr Ivory Palace close behind.
      </p>
    </>
  ),
  "sherwin-williams/origami-white-7636": (
    <>
      <p>
        Origami White is a soft, light off-white at LRV 76 with a barely-there greige warmth — clean
        enough to feel fresh, soft enough to avoid the chill of a true white. It&apos;s a flexible whole-house
        choice that works on walls and trim alike, especially in rooms with good light.
      </p>
      <p>
        Its faint warmth keeps it livable but can show slightly beside a stark white. It&apos;s a
        near-identical match for Benjamin Moore Classic Gray, which makes it a familiar soft neutral by
        another name; Behr Weathered White is also very close.
      </p>
    </>
  ),
  "sherwin-williams/nuance-7049": (
    <>
      <p>
        Nuance is a soft, warm light greige-white at LRV 74 — the subtle in-between for people who find a
        true white too plain and a greige too gray. It reads as a gentle, barely-there warm neutral that
        keeps a room feeling soft and open.
      </p>
      <p>
        Like any light warm neutral it can look faintly creamy next to a stark white, so keep companions
        warm. It&apos;s forgiving across most lighting. Benjamin Moore Classic Gray is its near-identical
        cross-brand match, with Behr Coconut Ice close behind.
      </p>
    </>
  ),
  "sherwin-williams/perfect-greige-6073": (
    <>
      <p>
        Perfect Greige is a mid-tone greige at LRV 42 with a distinct taupe base — deeper and a touch
        more purple-brown than the lighter greiges, which gives a room real warmth and grounding. It&apos;s
        the choice when you want a greige with genuine presence rather than a pale wash.
      </p>
      <p>
        That taupe-violet base can surface in cool light, so sample it against your trim. It anchors a
        room well against white trim and pairs with warm wood. Benjamin Moore Evening Gown is its
        near-identical match, with Behr Perfect Taupe close behind.
      </p>
    </>
  ),
  "sherwin-williams/colonnade-gray-7641": (
    <>
      <p>
        Colonnade Gray is a warm, mid-light greige at LRV 53 — a balanced gray-beige with a soft, neutral
        warmth that makes it a reliable whole-house color. It sits comfortably between the lighter
        greiges and the deeper ones, giving a room gentle definition without going dark.
      </p>
      <p>
        It&apos;s forgiving across lighting, though it can show a faint green base in cool light. It pairs
        with white trim and most wood tones. Behr Armadillo is a near-identical cross-brand match, with
        Benjamin Moore Cumulus Cloud close behind.
      </p>
    </>
  ),
  "sherwin-williams/big-chill-7648": (
    <>
      <p>
        Big Chill is a light, cool gray at LRV 62 — a clean true gray with a soft blue base and none of
        the greige warmth, ideal for a crisp, contemporary room. It&apos;s the choice when you want gray to
        read as a fresh, airy gray rather than a warm greige.
      </p>
      <p>
        Its cool base reads stronger in north light, so it&apos;s happiest with warm or balanced light. It
        pairs with cool whites and modern finishes. Behr Mexican Silver is a near-identical cross-brand
        match, with Benjamin Moore Barren Plain close behind.
      </p>
    </>
  ),
  "sherwin-williams/inkwell-6992": (
    <>
      <p>
        Inkwell is a soft, deep near-black at LRV 4 with a subtle blue-gray base that keeps it from
        reading as a flat true black. It&apos;s the dramatic choice for doors, trim, cabinetry, and accent
        walls when you want depth with a hint of cool character rather than a stark black.
      </p>
      <p>
        Like any near-black it reads essentially black in shadow and shows its blue depth in good light.
        It pairs crisply with cool whites or warms up with brass and wood. Behr Spade Black is its
        closest cross-brand match, with Benjamin Moore After Midnight close.
      </p>
    </>
  ),
  "sherwin-williams/caviar-6990": (
    <>
      <p>
        Caviar is a true, deep black at LRV 3 — a clean, neutral black without an obvious blue or brown
        cast, which makes it the choice for sharp, graphic trim, doors, and cabinetry. Where Inkwell
        leans cool, Caviar is about as dark and pure as Sherwin-Williams&apos; line goes.
      </p>
      <p>
        On trim against light walls it reads crisp; on a whole surface it&apos;s a soft, deep black rather
        than a void. It pairs with anything. Its near-identical cross-brand match is Benjamin Moore Black.
      </p>
    </>
  ),
  "sherwin-williams/indigo-batik-7602": (
    <>
      <p>
        Indigo Batik is a deep, denim-toned blue at LRV 8 — a rich indigo with a slightly grayed,
        washed-denim quality that feels more relaxed than a formal navy. It&apos;s a strong choice for
        cabinetry, islands, and accent walls where you want depth with a softer, lived-in character.
      </p>
      <p>
        As a deep blue it needs light to keep from going near-black, and it looks great with warm whites,
        wood, and brass. Benjamin Moore Hudson Bay is its near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/retreat-6207": (
    <>
      <p>
        Retreat is a deep, muted green-gray at LRV 21 — a grayed forest green with real depth that&apos;s
        become popular for moody cabinetry, libraries, and accent walls. It&apos;s in the deep-green family
        with Pewter Green but reads a touch cooler and grayer.
      </p>
      <p>
        At this depth it needs light to read clearly as green rather than near-charcoal, and it pairs
        beautifully with brass, warm wood, and creamy whites. Behr Cedar Forest is its closest
        cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/softened-green-6177": (
    <>
      <p>
        Softened Green is a gentle, mid-tone sage at LRV 49 — a calm, grayed green that reads as a restful
        near-neutral rather than a vivid color. It&apos;s a close cousin of the popular Benjamin Moore October
        Mist, making it the SW pick for that soft, dusty-sage look.
      </p>
      <p>
        Its muted quality means it plays well with creamy whites and warm wood, shifting a little greener
        or grayer with the light. Benjamin Moore Tree Moss is its near-identical cross-brand match.
      </p>
    </>
  ),
  "sherwin-williams/black-fox-7020": (
    <>
      <p>
        Black Fox is a warm, deep charcoal-brown at LRV 7 — a near-black with a distinct brown warmth
        that sits between a true charcoal and Urbane Bronze. It&apos;s a sophisticated choice for exteriors,
        cabinetry, and accent walls where you want depth with an earthy, warm character.
      </p>
      <p>
        In good light its warm brown-charcoal shows; in shadow it deepens toward black. It pairs with
        warm whites, wood, and brass. Benjamin Moore Midsummer Night is its closest cross-brand match,
        with Behr Espresso Beans close behind.
      </p>
    </>
  ),
  "sherwin-williams/peppercorn-7674": (
    <>
      <p>
        Peppercorn is a deep, true charcoal-gray at LRV 4 — a clean, slightly soft dark gray that reads
        as a sophisticated near-black without a strong blue or brown cast. It&apos;s a versatile choice for
        trim, doors, cabinetry, and exterior accents when you want charcoal rather than full black.
      </p>
      <p>
        It holds its neutral character well across lighting, deepening toward black in shadow. It pairs
        with crisp whites for contrast or warm metals for softness. It&apos;s a dead-on match for Benjamin
        Moore Gray, with Behr Maximum Gray very close.
      </p>
    </>
  ),
  "benjamin-moore/boothbay-gray-hc-165": (
    <>
      <p>
        Boothbay Gray is a mid-tone blue-gray at LRV 44 — a soft, coastal gray with a clear blue cast
        that gives a room a calm, nautical character. It has enough depth to register as a color while
        still behaving like a serene neutral, popular for exteriors, shutters, and tranquil interiors.
      </p>
      <p>
        Its blue base reads stronger in cool light, so it&apos;s strongest with warm or balanced light, or
        where you want the coastal feel deliberately. It pairs with crisp whites and natural materials.
        Sherwin-Williams Mineral Deposit is its closest cross-brand match.
      </p>
    </>
  ),
};

export function getColorEditorial(brandSlug: string, colorSlug: string): ReactNode | null {
  return COLOR_EDITORIAL[`${brandSlug}/${colorSlug}`] ?? null;
}
