import { type ReactNode } from "react";
import Link from "next/link";

export interface FamilyContent {
  intro: ReactNode;
  guide: ReactNode;
}

const content: Record<string, FamilyContent> = {
  white: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          White is the most popular paint color category — and the hardest to get right. Every white
          has an undertone: warm whites lean cream or yellow, cool whites lean blue or gray, and true
          whites sit in between. The wrong white against your trim, tile, or countertops creates a
          jarring clash that&apos;s hard to pinpoint but easy to feel.
        </p>
        <p>
          Designer favorites like Benjamin Moore White Dove (warm), Sherwin-Williams Pure White (warm),
          and Benjamin Moore Chantilly Lace (true white) dominate for good reason — they&apos;re
          versatile across lighting conditions. Use the undertone filter below to narrow your search
          to warm, cool, or neutral whites.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Choosing the Right White</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Match your white to your fixed elements: warm floors and countertops call for warm whites,
          cool tile and fixtures call for cool whites. Always sample at least three whites on your
          actual walls — colors that look identical on a chip diverge dramatically at scale. Read our{" "}
          <Link href="/blog/best-white-paint-colors-guide" className="text-brand-blue hover:underline">
            definitive white paint guide
          </Link>{" "}
          for detailed breakdowns of every popular white, or use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          see the exact Delta E difference between any two whites.
        </p>
      </div>
    ),
  },

  gray: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Gray dominated home interiors for over a decade, and while the trend has shifted toward
          warmer tones, gray remains one of the most versatile paint color families. The key is
          understanding undertones: grays can lean blue (cool and crisp), green (earthy), purple
          (sophisticated), or brown (the warm &ldquo;greige&rdquo; category that bridges gray and
          beige).
        </p>
        <p>
          The most popular grays today are warm — Sherwin-Williams Agreeable Gray and Benjamin Moore
          Edgecomb Gray lead the pack because their brown undertones prevent the cold, sterile
          feeling that pure grays can create. Filter by undertone below to find grays that match your
          room&apos;s lighting and style.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Why Your Gray Looks Blue</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          The most common gray painting mistake is ignoring undertones. A gray with blue undertones
          will look distinctly blue on a north-facing wall. Read our{" "}
          <Link href="/blog/understanding-paint-color-undertones" className="text-brand-blue hover:underline">
            undertones guide
          </Link>{" "}
          to learn how to spot them before you buy. If you&apos;re choosing between two grays, our{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> shows
          the exact perceptual difference so you can pick with confidence.
        </p>
      </div>
    ),
  },

  blue: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Blue is the most universally liked color and one of the most versatile in home design.
          Light, muted blues create calming bedrooms and spa-like bathrooms. Deep navy tones add drama
          to front doors, kitchen islands, and accent walls. Blue-greens and blue-grays serve as
          sophisticated neutrals that work in virtually any room.
        </p>
        <p>
          Popular picks include Benjamin Moore Hale Navy (deep and rich), Sherwin-Williams Sleepy Blue
          (soft and calming), and Benjamin Moore Quiet Moments (a blue-green-gray chameleon). Navy
          blues have been a top choice for front doors and cabinetry, while muted powder blues are
          trending in bedrooms and nurseries.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Blue by Room</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Blue works differently in every room. Soft blues promote sleep in{" "}
          <Link href="/blog/calming-bedroom-paint-colors" className="text-brand-blue hover:underline">
            bedrooms
          </Link>, spa-inspired blues transform{" "}
          <Link href="/blog/best-bathroom-paint-colors" className="text-brand-blue hover:underline">
            bathrooms
          </Link>, and muted blues boost focus in{" "}
          <Link href="/blog/best-home-office-paint-colors" className="text-brand-blue hover:underline">
            home offices
          </Link>. Use the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link> to
          preview any blue on your walls before committing.
        </p>
      </div>
    ),
  },

  green: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Green is the breakout color trend of 2025–2026. From soft sage kitchens to deep forest
          accent walls, every shade of green is surging in popularity. The movement is driven by
          biophilic design — the idea that incorporating nature into interiors improves well-being.
          Green connects a room to the outdoors without requiring a single plant.
        </p>
        <p>
          Sage and muted greens like Benjamin Moore Saybrook Sage and Sherwin-Williams Softened Green
          work as sophisticated neutrals. Deeper greens like Benjamin Moore Essex Green and
          Sherwin-Williams Pewter Green create dramatic, library-like spaces. Green pairs naturally
          with wood tones, brass hardware, and natural textiles.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Green in Every Room</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Green works everywhere: sage tones for{" "}
          <Link href="/blog/best-kitchen-paint-colors-2025" className="text-brand-blue hover:underline">
            kitchens
          </Link> and{" "}
          <Link href="/blog/best-bathroom-paint-colors" className="text-brand-blue hover:underline">
            bathrooms
          </Link>, muted greens for{" "}
          <Link href="/blog/best-nursery-paint-colors" className="text-brand-blue hover:underline">
            nurseries
          </Link>, and deep forest greens for{" "}
          <Link href="/blog/best-dining-room-paint-colors" className="text-brand-blue hover:underline">
            dining rooms
          </Link>. See our{" "}
          <Link href="/blog/most-popular-paint-colors-2025" className="text-brand-blue hover:underline">
            most popular colors of 2025
          </Link>{" "}
          guide for the full green trend breakdown.
        </p>
      </div>
    ),
  },

  beige: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Beige is back — and it never really left. After a decade of gray dominance, warm beige and
          greige (gray-beige) tones have reclaimed their place as the go-to neutral for whole-home
          color. Modern beiges are more sophisticated than the builder-beige of the 2000s: they&apos;re
          warmer, more nuanced, and often carry subtle gray or taupe undertones that keep them feeling
          current.
        </p>
        <p>
          Sherwin-Williams Accessible Beige and Benjamin Moore Edgecomb Gray (technically a greige)
          are the two most popular warm neutrals in residential design. They work with virtually any
          decor style — from farmhouse to modern — and adapt gracefully to different lighting
          conditions.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Beige vs Greige</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          True beiges have yellow or gold undertones. Greiges add a gray component that modernizes the
          color. If you&apos;re transitioning from gray walls, greige is the easiest bridge — read our{" "}
          <Link href="/blog/warm-vs-cool-paint-colors" className="text-brand-blue hover:underline">
            warm vs cool guide
          </Link>{" "}
          for tips on building a cohesive palette. Use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          put any two beiges side by side and see if the Delta E difference is visible.
        </p>
      </div>
    ),
  },

  red: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Red is the boldest choice on a paint fan deck — and one of the most rewarding when used
          intentionally. A deep, warm red transforms a dining room into a space that feels intimate
          and elegant. On a front door, red is a timeless statement that adds curb appeal to
          virtually any home style. The trick is picking the right red: warm reds with orange or
          brown undertones feel inviting, while cool reds with blue undertones can lean toward
          aggressive or overly bright.
        </p>
        <p>
          Popular warm reds include{" "}
          <Link href="/colors/sherwin-williams/fireworks-6867" className="text-brand-blue hover:underline">
            Sherwin-Williams Fireworks
          </Link>{" "}
          (a rich, classic red),{" "}
          <Link href="/colors/benjamin-moore/caliente-af-290" className="text-brand-blue hover:underline">
            Benjamin Moore Caliente
          </Link>{" "}
          (a designer favorite with warm depth), and{" "}
          <Link href="/colors/behr/red-pepper-ppu2-02" className="text-brand-blue hover:underline">
            Behr Red Pepper
          </Link>{" "}
          (a spicy, earthy red that works beautifully on accent walls). For a softer approach, muted
          reds and burgundies create warmth without overwhelming a room — explore the{" "}
          <Link href="/colors/family/orange" className="text-brand-blue hover:underline">
            orange family
          </Link>{" "}
          for terracotta tones that bridge the gap between red and neutral.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Using Red Effectively</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Red works best in contained spaces — a{" "}
          <Link href="/blog/best-dining-room-paint-colors" className="text-brand-blue hover:underline">
            dining room
          </Link>, powder room, or front door. Full-room red can overwhelm, so consider a single
          accent wall paired with warm neutrals. Test your red in evening light too — reds deepen
          dramatically under warm artificial lighting. Use the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link> to
          preview reds on your walls, or explore our{" "}
          <Link href="/blog/best-exterior-paint-colors" className="text-brand-blue hover:underline">
            exterior colors guide
          </Link>{" "}
          for front door inspiration.
        </p>
      </div>
    ),
  },

  orange: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Orange might be the most underrated color family in home design. While bright, saturated
          oranges are rarely used on walls, muted and earthy oranges — terracotta, burnt sienna,
          clay, and rust — have become some of the most sought-after tones in modern interiors.
          The terracotta trend connects back to natural materials: think adobe walls, clay pots, and
          sun-baked earth. These colors bring warmth and texture to a room without feeling loud.
        </p>
        <p>
          Look at{" "}
          <Link href="/colors/sherwin-williams/cavern-clay-7701" className="text-brand-blue hover:underline">
            Sherwin-Williams Cavern Clay
          </Link>{" "}
          (a dusty terracotta that works as an accent or whole-room color),{" "}
          <Link href="/colors/benjamin-moore/burnt-caramel-2167-10" className="text-brand-blue hover:underline">
            Benjamin Moore Burnt Caramel
          </Link>{" "}
          (rich and warm), and Behr Canyon Dusk (a muted clay that reads as a warm neutral in the
          right light). These muted oranges pair beautifully with cream, sage green, and warm wood
          tones — bridging the{" "}
          <Link href="/colors/family/red" className="text-brand-blue hover:underline">red</Link> and{" "}
          <Link href="/colors/family/brown" className="text-brand-blue hover:underline">brown</Link>{" "}
          families with effortless warmth.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Terracotta and Beyond</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          The key to orange is staying muted. Bright oranges are energizing in small doses — a front
          door, a bookshelf interior — but terracotta and rust tones work as genuine wall colors.
          Pair them with{" "}
          <Link href="/colors/family/green" className="text-brand-blue hover:underline">sage greens</Link>{" "}
          for a natural palette, or with warm whites for a southwestern feel. See how orange tones
          fit into{" "}
          <Link href="/blog/most-popular-paint-colors-2025" className="text-brand-blue hover:underline">
            this year&apos;s top trends
          </Link>, or use the{" "}
          <Link href="/tools/palette-generator" className="text-brand-blue hover:underline">
            palette generator
          </Link>{" "}
          to build a coordinated scheme around your favorite terracotta.
        </p>
      </div>
    ),
  },

  yellow: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Yellow is sunshine on your walls — cheerful, optimistic, and surprisingly tricky to get
          right. The most common mistake is choosing a yellow that looks perfect on a small chip
          but turns neon at wall scale. Saturated yellows amplify dramatically in large quantities,
          which is why the most successful yellows for walls are soft, buttery, or golden — never
          bright or lemony.
        </p>
        <p>
          For kitchens and breakfast nooks,{" "}
          <Link href="/colors/benjamin-moore/hawthorne-yellow-hc-4" className="text-brand-blue hover:underline">
            Benjamin Moore Hawthorne Yellow
          </Link>{" "}
          is a classic buttery choice that feels warm without screaming. Sherwin-Williams Friendly
          Yellow offers a similar soft warmth. For a bold front door or accent wall, deeper golds
          like Benjamin Moore Harvest Bronze add richness without the neon risk. Yellow pairs
          naturally with{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">crisp whites</Link>,{" "}
          <Link href="/colors/family/blue" className="text-brand-blue hover:underline">navy blues</Link>, and
          charcoal gray trim.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Avoiding Yellow Pitfalls</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Always sample yellow in a large swatch — at least two feet square — because it intensifies
          more than any other color at scale. North-facing rooms make yellows look greenish, so lean
          warmer in those spaces. Read our{" "}
          <Link href="/blog/best-paint-colors-north-facing-rooms" className="text-brand-blue hover:underline">
            north-facing room guide
          </Link>{" "}
          for more tips. Use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          check how close two yellows really are, and preview your pick in the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">
            room visualizer
          </Link>{" "}
          before committing.
        </p>
      </div>
    ),
  },

  purple: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Purple occupies a unique space in home design — it can be soothing, dramatic, or playful
          depending on the shade. Light lavenders create dreamy, restful bedrooms. Deep plums and
          eggplant tones add theatrical richness to dining rooms and libraries. And the increasingly
          popular purple-grays serve as sophisticated alternatives to standard gray, adding depth
          without being obviously purple.
        </p>
        <p>
          Benjamin Moore Shadow (a moody, near-black plum) makes a stunning accent wall.
          Sherwin-Williams Potentially Purple is a soft lavender-gray that reads as a refined neutral
          in most lighting. The biggest purple pitfall? Undertones. Many grays and off-whites carry
          hidden purple undertones that only reveal themselves on the wall — check our{" "}
          <Link href="/blog/understanding-paint-color-undertones" className="text-brand-blue hover:underline">
            undertones guide
          </Link>{" "}
          to learn how to spot them before you buy. Purple complements{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">cool grays</Link> and{" "}
          <Link href="/colors/family/pink" className="text-brand-blue hover:underline">dusty pinks</Link>{" "}
          beautifully.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Purple Done Right</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Light purples work best in{" "}
          <Link href="/blog/calming-bedroom-paint-colors" className="text-brand-blue hover:underline">
            bedrooms
          </Link>{" "}
          and{" "}
          <Link href="/blog/best-nursery-paint-colors" className="text-brand-blue hover:underline">
            nurseries
          </Link>{" "}
          where their calming quality shines. Deep plums are perfect for{" "}
          <Link href="/blog/best-dining-room-paint-colors" className="text-brand-blue hover:underline">
            dining rooms
          </Link>{" "}
          that feel intimate. If you&apos;re nervous about committing to purple, start with a
          purple-gray — it adds complexity without risk. Use the{" "}
          <Link href="/tools/palette-generator" className="text-brand-blue hover:underline">
            palette generator
          </Link>{" "}
          to find complementary colors for your purple.
        </p>
      </div>
    ),
  },

  pink: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Pink has undergone a complete transformation in interior design. Forget the bubblegum
          associations — today&apos;s pinks are sophisticated neutrals. Blush pink, dusty rose, and
          mauve have become serious contenders for living rooms, bedrooms, and even kitchens. These
          muted, grayed-down pinks read as warm neutrals on the wall while adding a softness that
          beige and gray simply can&apos;t achieve.
        </p>
        <p>
          Benjamin Moore Pale Oak (a pink-beige that designers can&apos;t stop recommending) barely
          reads as pink but adds warmth that pure whites miss. For something more intentionally pink,{" "}
          <Link href="/colors/sherwin-williams/quaint-coral-6536" className="text-brand-blue hover:underline">
            Sherwin-Williams Quaint Coral
          </Link>{" "}
          offers a dusty rose that&apos;s beautiful in bedrooms. Deeper pinks like Benjamin Moore
          Raspberry Blush make bold accent walls. Pink pairs wonderfully with{" "}
          <Link href="/colors/family/green" className="text-brand-blue hover:underline">sage greens</Link>,{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">warm grays</Link>,
          and natural wood tones.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Pink as a Grown-Up Neutral</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          The secret to using pink in grown-up spaces is saturation: the lower, the better. Blush
          and dusty rose read as warm neutrals rather than &ldquo;pink.&rdquo; They&apos;re
          especially effective in{" "}
          <Link href="/blog/calming-bedroom-paint-colors" className="text-brand-blue hover:underline">
            bedrooms
          </Link>{" "}
          and{" "}
          <Link href="/blog/best-living-room-paint-colors" className="text-brand-blue hover:underline">
            living rooms
          </Link>. Use the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link> to
          see how a blush pink transforms your space, or read our{" "}
          <Link href="/blog/warm-vs-cool-paint-colors" className="text-brand-blue hover:underline">
            warm vs cool guide
          </Link>{" "}
          to understand why pink-toned neutrals feel so inviting.
        </p>
      </div>
    ),
  },

  "off-white": {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Off-white is the answer to the most common paint question: &ldquo;I want white, but not
          too white.&rdquo; Pure white can feel sterile and cold, especially in living spaces.
          Off-whites soften that edge with a whisper of warmth — cream, yellow, pink, or gray — that
          makes a room feel lived-in rather than clinical. The challenge is that off-whites vary
          enormously: some lean warm and creamy, others cool and icy, and the wrong choice clashes
          with your trim, cabinetry, or fixed finishes.
        </p>
        <p>
          The most popular off-whites include{" "}
          <Link href="/colors/benjamin-moore/white-dove-oc-17" className="text-brand-blue hover:underline">
            Benjamin Moore White Dove
          </Link>{" "}
          (warm cream undertone),{" "}
          <Link href="/colors/sherwin-williams/alabaster-7008" className="text-brand-blue hover:underline">
            Sherwin-Williams Alabaster
          </Link>{" "}
          (soft and balanced), and{" "}
          <Link href="/colors/benjamin-moore/simply-white-oc-117" className="text-brand-blue hover:underline">
            Benjamin Moore Simply White
          </Link>{" "}
          (the barely-there warm white). Off-whites sit between the{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">white</Link> and{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beige</Link>{" "}
          families — warmer than a true white, cooler than a true beige, and endlessly versatile.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Finding Your Perfect Off-White</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          The difference between off-whites is subtle on a chip but obvious on a wall. Always compare
          against your trim color — if your trim is a true white, a warm off-white on walls creates
          pleasing contrast. Read our{" "}
          <Link href="/blog/best-white-paint-colors-guide" className="text-brand-blue hover:underline">
            white paint guide
          </Link>{" "}
          for detailed breakdowns of every popular off-white, or use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          see the exact Delta E between two off-whites. Our{" "}
          <Link href="/blog/how-to-test-paint-samples" className="text-brand-blue hover:underline">
            sample testing guide
          </Link>{" "}
          explains why off-whites especially need large-format samples.
        </p>
      </div>
    ),
  },

  black: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Black paint is no longer reserved for edgy lofts. Black accent walls, black-painted trim,
          black kitchen cabinetry, and black front doors have gone fully mainstream — and the results
          are stunning when done right. The key is understanding that not all blacks are the same:
          some lean warm with brown or red undertones, others lean cool with blue or green
          undertones, and the LRV (light reflectance value) determines how much light the surface
          absorbs.
        </p>
        <p>
          <Link href="/colors/sherwin-williams/tricorn-black-6258" className="text-brand-blue hover:underline">
            Sherwin-Williams Tricorn Black
          </Link>{" "}
          is a true, neutral black — the industry standard for doors and trim. Benjamin Moore Black
          is the deepest option in their line. For a softer approach,{" "}
          <Link href="/colors/benjamin-moore/wrought-iron-2124-10" className="text-brand-blue hover:underline">
            Benjamin Moore Wrought Iron
          </Link>{" "}
          is an extremely popular off-black with subtle charcoal warmth that&apos;s more forgiving
          than a jet black. Black pairs with everything — it&apos;s the ultimate anchor for{" "}
          <Link href="/colors/family/white" className="text-brand-blue hover:underline">white</Link>,{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">gray</Link>, and
          any accent color.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Black Paint Strategy</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Black on trim is the biggest design trend of the last few years — it adds definition and
          makes white walls pop. For{" "}
          <Link href="/blog/best-exterior-paint-colors" className="text-brand-blue hover:underline">
            front doors and exteriors
          </Link>, choose a true black with minimal undertone. For accent walls, an off-black like
          Wrought Iron is more forgiving. Keep in mind that flat or matte sheens on black show every
          imperfection — satin or semi-gloss is usually the safer finish. Read our{" "}
          <Link href="/blog/paint-sheen-guide" className="text-brand-blue hover:underline">
            sheen guide
          </Link>{" "}
          for finish recommendations, or use the{" "}
          <Link href="/tools/room-visualizer" className="text-brand-blue hover:underline">room visualizer</Link> to
          see how black changes a room&apos;s feel.
        </p>
      </div>
    ),
  },

  brown: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Brown is having a moment. After years of gray dominance, designers and homeowners are
          turning to rich chocolate browns, warm taupes, and earthy umber tones for a cozier,
          more grounded aesthetic. Brown creates the warmth people wanted from gray but never
          quite achieved — it feels like a wool blanket on a cold day, wrapping a room in comfort
          without sacrificing sophistication.
        </p>
        <p>
          <Link href="/colors/sherwin-williams/grounded-6089" className="text-brand-blue hover:underline">
            Sherwin-Williams Grounded
          </Link>{" "}
          (their 2025 Color of the Year) signals this shift toward earthy warmth.{" "}
          <Link href="/colors/benjamin-moore/cinnamon-slate-2113-40" className="text-brand-blue hover:underline">
            Benjamin Moore Cinnamon Slate
          </Link>{" "}
          (BM&apos;s 2025 Color of the Year) takes a similar approach with a muted, warm brown
          that reads as incredibly refined. For lighter options, Sherwin-Williams Latte works as a
          warm brown neutral throughout a home. Brown connects beautifully to the{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beige</Link>,{" "}
          <Link href="/colors/family/tan" className="text-brand-blue hover:underline">tan</Link>, and{" "}
          <Link href="/colors/family/orange" className="text-brand-blue hover:underline">orange</Link>{" "}
          families.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Brown Is the New Gray</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Warm browns work in every room: lighter taupes for{" "}
          <Link href="/blog/best-living-room-paint-colors" className="text-brand-blue hover:underline">
            living rooms
          </Link>, deeper chocolates for{" "}
          <Link href="/blog/best-dining-room-paint-colors" className="text-brand-blue hover:underline">
            dining rooms
          </Link>, and muted warm browns for{" "}
          <Link href="/blog/best-home-office-paint-colors" className="text-brand-blue hover:underline">
            home offices
          </Link>. See our{" "}
          <Link href="/blog/2025-colors-of-the-year-every-brand-compared" className="text-brand-blue hover:underline">
            2025 Colors of the Year
          </Link>{" "}
          guide for a deeper look at why brown is leading the trend. Use the{" "}
          <Link href="/tools/palette-generator" className="text-brand-blue hover:underline">
            palette generator
          </Link>{" "}
          to build a palette around your favorite brown.
        </p>
      </div>
    ),
  },

  tan: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Tan sits in the warm space between{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beige</Link> and{" "}
          <Link href="/colors/family/brown" className="text-brand-blue hover:underline">brown</Link> —
          yellower and warmer than beige, lighter and sandier than brown. Think sun-bleached leather,
          desert sand, and golden wheat. Tan is the quintessential warm neutral for homeowners who
          want color that feels natural and effortless, with enough pigment to avoid the washed-out
          look that some lighter neutrals create.
        </p>
        <p>
          Sherwin-Williams Whole Wheat is a popular mid-tone tan with golden warmth. Benjamin Moore
          Bridgewater Tan offers a sandy, approachable neutral that works throughout an entire home.
          Behr Sculptor Clay bridges tan and terracotta for a southwestern-inspired palette. Tan
          colors pair beautifully with turquoise accents, warm wood floors, iron hardware, and
          natural stone — making them ideal for rustic, southwestern, and transitional interiors.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Tan for Whole-Home Color</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Tan is one of the safest choices for open floor plans because it flows naturally from room
          to room without feeling monotonous. Its golden warmth flatters both natural and artificial
          light. Read our{" "}
          <Link href="/blog/warm-vs-cool-paint-colors" className="text-brand-blue hover:underline">
            warm vs cool guide
          </Link>{" "}
          to understand where tan sits on the spectrum, and check our{" "}
          <Link href="/blog/understanding-paint-color-undertones" className="text-brand-blue hover:underline">
            undertones guide
          </Link>{" "}
          to make sure your tan doesn&apos;t carry unwanted pink or green undertones. Use the{" "}
          <Link href="/compare" className="text-brand-blue hover:underline">compare tool</Link> to
          see how close your tan options really are.
        </p>
      </div>
    ),
  },

  neutral: {
    intro: (
      <div className="mt-4 space-y-3 text-gray-700 leading-relaxed">
        <p>
          Neutrals are the backbone of interior design — the colors that let everything else in a
          room shine. In our database, the neutral family captures colors that don&apos;t fit neatly
          into a single color family: complex greiges that are equal parts{" "}
          <Link href="/colors/family/gray" className="text-brand-blue hover:underline">gray</Link> and{" "}
          <Link href="/colors/family/beige" className="text-brand-blue hover:underline">beige</Link>,
          warm taupes that bridge{" "}
          <Link href="/colors/family/brown" className="text-brand-blue hover:underline">brown</Link> and{" "}
          gray, and balanced tones that serve as quiet backgrounds for bolder accents.
        </p>
        <p>
          These in-between colors are often the most versatile in your home. Sherwin-Williams
          Agreeable Gray (the single most popular paint color in America) lives in this neutral
          territory — it&apos;s a greige that shifts between gray and beige depending on the light.
          Benjamin Moore Revere Pewter offers similar chameleon-like flexibility. When you&apos;re
          painting an open floor plan, a whole-home neutral from this family keeps rooms connected
          while allowing individual spaces to express personality through accent colors, textiles,
          and art.
        </p>
      </div>
    ),
    guide: (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-semibold text-gray-900">Building a Whole-Home Neutral Palette</h2>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Start with one neutral as your main color, then choose a lighter version for ceilings and
          a brighter white for trim. This creates a cohesive flow throughout your home. Read our{" "}
          <Link href="/blog/most-popular-paint-colors-2025" className="text-brand-blue hover:underline">
            most popular colors guide
          </Link>{" "}
          to see which neutrals designers are specifying most, or use the{" "}
          <Link href="/tools/palette-generator" className="text-brand-blue hover:underline">
            palette generator
          </Link>{" "}
          to build a complete palette around your chosen neutral. Our{" "}
          <Link href="/blog/how-to-find-perfect-color-match-across-brands" className="text-brand-blue hover:underline">
            cross-brand matching guide
          </Link>{" "}
          helps you find the same neutral in a different brand if your preferred brand isn&apos;t
          available locally.
        </p>
      </div>
    ),
  },
};

export function getFamilyContent(slug: string): FamilyContent | undefined {
  return content[slug];
}
