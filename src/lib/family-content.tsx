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
};

export function getFamilyContent(slug: string): FamilyContent | undefined {
  return content[slug];
}
