import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaintCalculator } from "./calculator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { getAmazonSearchUrl } from "@/lib/affiliate";

/** Inline Amazon link for the guide prose — sponsored, opens in a new tab. */
function AmazonLink({ query, children }: { query: string; children: React.ReactNode }) {
  return (
    <a
      href={getAmazonSearchUrl(query)}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      className="text-primary underline hover:text-primary/80"
    >
      {children}
    </a>
  );
}

export const metadata: Metadata = {
  title: "Paint Calculator - How Much Paint Do I Need?",
  description:
    "Calculate paint for Sherwin-Williams, Benjamin Moore, Behr, PPG, and 10 more brands. Enter room dimensions, subtract doors and windows, get gallons needed.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/paint-calculator",
  },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function PaintCalculatorPage() {
  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Calculator — How Much Paint Do I Need?",
        description: "Calculate exactly how many gallons of paint you need. Enter room dimensions (length, width, height), subtract doors and windows, and get coverage based on the industry-standard rate of 350 sq ft per gallon for interior latex paint.",
        url: "https://www.paintcolorhq.com/tools/paint-calculator",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How much area does one gallon of paint cover?", acceptedAnswer: { "@type": "Answer", text: "One gallon of interior latex paint covers approximately 350 square feet on smooth, primed drywall in a single coat. This is the industry-standard rate published by Sherwin-Williams, Benjamin Moore, and Behr, based on ASTM D5150 spread rate testing. Textured surfaces reduce coverage to 280-300 sq ft per gallon." } },
          { "@type": "Question", name: "How many gallons for a 12x12 room?", acceptedAnswer: { "@type": "Answer", text: "A 12x12 ft room with 8 ft ceilings has 384 sq ft of wall area. Subtract 1 door (21 sq ft) and 2 windows (30 sq ft) for 333 sq ft of paintable area. At 2 coats, that is 666 sq ft divided by 350 sq ft/gallon = 2 gallons needed." } },
          { "@type": "Question", name: "How do I calculate paint needed?", acceptedAnswer: { "@type": "Answer", text: "Calculate wall area using 2 x (length + width) x ceiling height. Subtract 21 sq ft per door and 15 sq ft per window. Multiply by number of coats (usually 2). Divide total by 350 sq ft per gallon and round up to the nearest whole gallon." } },
          { "@type": "Question", name: "What supplies do I need to paint a room?", acceptedAnswer: { "@type": "Answer", text: "Beyond the paint, a standard room takes seven things: a 9-inch roller frame with 3/8-inch nap covers (1/2-inch on textured walls), a 2.5-inch angled sash brush for cutting in, a paint tray with one liner per coat, painter's tape for baseboards and casings, a 9x12 canvas drop cloth, a roller extension pole, and spackle with a sanding sponge for prep. Starting from zero, the kit runs roughly $60-90, and everything except the tape, liners, and covers is reusable for years. The paint calculator sizes the tape and drop-cloth quantities to your room's dimensions." } },
          { "@type": "Question", name: "What size roller nap should I use?", acceptedAnswer: { "@type": "Answer", text: "Match the nap to the surface: 3/8-inch for smooth drywall and plaster (the standard interior wall), 1/2-inch for light texture like orange peel, and 3/4-inch for heavy texture like knockdown or masonry. A 1/4-inch nap or foam roller gives the smoothest finish on doors, cabinets, and trim. Choose woven covers over knit — cheap knit covers shed lint into the finish." } },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Paint Calculator", item: "https://www.paintcolorhq.com/tools/paint-calculator" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Paint Calculator
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Calculate exactly how many gallons of paint you need. Enter room
            dimensions (length, width, and ceiling height), subtract doors and
            windows, and get coverage based on the industry-standard rate of{" "}
            <strong className="text-on-surface">350 sq ft per gallon</strong> for interior latex paint.
            Works for any brand — Sherwin-Williams, Benjamin Moore, Behr, and
            more. Your result includes a supplies checklist with quantities
            sized to your room.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <PaintCalculator />
        </div>
      </section>

      {/* The guide behind the tool — supplies, specs, and coverage caveats */}
      <section className="py-16 px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
            What You Actually Need to Paint a Room — Supplies, Specs, and Where the 350 Rule Bends
          </h2>
          <div className="space-y-10 text-on-surface-variant leading-relaxed">
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                The seven supplies that earn their place — and the boxed kits that don&apos;t
              </h3>
              <p>
                The checklist the calculator builds has seven items on it, and each one does a
                job nothing else on the list can: a roller frame with covers lays paint on the
                open wall, an angled sash brush cuts the edges the roller can&apos;t reach, a
                tray holds the working paint, tape protects baseboards and casings, a drop
                cloth catches what falls, an extension pole reaches the ceiling line, and
                spackle with a sanding sponge fixes the wall before any of that starts. Nothing
                on the list is padding, and two of the quantities — tape rolls and drop cloths
                — are computed from your room&apos;s dimensions rather than guessed.
              </p>
              <p className="mt-3">
                What&apos;s deliberately not on the list is the shrink-wrapped &ldquo;room
                painting kit.&rdquo; The price looks right until the knit cover sheds lint into
                your first coat and the plastic tray cracks at the second pour. Buying the
                pieces separately costs roughly $60 to $90 from zero, and the difference shows
                up on the wall: a{" "}
                <AmazonLink query="9 inch paint roller frame woven cover 3/8 nap">
                  woven 9-inch roller cover
                </AmazonLink>{" "}
                holds its fibers, a metal tray outlives the project, and the frame, brush,
                pole, and canvas cloth are one-time buys that survive years of repaints. The
                per-room consumables come down to tape, tray liners, and roller covers —
                everything else amortizes to almost nothing by your second room.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Roller nap, brush angle, tape width — the three specs that decide the finish
              </h3>
              <p>
                Nap is the fiber length on the roller cover, and it should match the surface.
                Use 3/8-inch on smooth drywall and plaster — the standard interior wall — where
                it holds enough paint to cover without stippling the finish. Move up to
                1/2-inch on light texture like orange peel, and 3/4-inch on heavy texture like
                knockdown or masonry, where the longer fibers push paint into the low spots a
                short nap skips over. Going the other way, a 1/4-inch nap or a foam roller
                gives the flattest finish on doors, cabinets, and trim. Longer nap always
                carries more paint, but it leaves more texture behind — pick by surface, not by
                &ldquo;more is better.&rdquo;
              </p>
              <p className="mt-3">
                The brush that matters is a{" "}
                <AmazonLink query="2.5 inch angled sash paint brush">
                  2.5-inch angled sash brush
                </AmazonLink>{" "}
                with synthetic filament (natural bristle goes limp in water-based paint). The
                angle is the point: it lets the bristle tips ride a straight line where wall
                meets ceiling, which is what cutting in is. For tape, 1.88-inch is the width
                that protects a baseboard from roller splatter; the narrower 1.41-inch rolls
                save a little money on door casings. One caveat that saves a repaint: if the
                surface you&apos;re taping was painted less than 30 days ago, use
                delicate-surface tape, because standard tape can lift paint that hasn&apos;t
                fully cured. Pull the tape while the final coat is still slightly wet, at a
                45-degree angle, and the line stays crisp.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Where the 350 sq ft rule bends
              </h3>
              <p>
                The calculator&apos;s coverage rate — 350 sq ft per gallon — is the number
                Sherwin-Williams, Benjamin Moore, and Behr all publish for interior latex on
                smooth, primed drywall. Three situations pull real coverage below it. Texture
                is the first: the same orange peel that wants a longer nap also has more
                surface area, so plan on 280 to 300 sq ft per gallon. New or unprimed drywall
                is the second — the paper face and joint compound drink the first coat, and
                since primer costs less than paint, priming first and then applying two
                topcoats is cheaper than three coats of the good stuff. A drastic color change
                is the third: covering a deep color with a light one, or painting a saturated
                red, orange, or bright yellow, routinely takes a third coat, because deep and
                clear bases carry less of the titanium dioxide that does the hiding. A
                gray-tinted primer under a deep color is the trade secret there — it kills the
                old color in one coat so the finish coats only have to build depth.
              </p>
              <p className="mt-3">
                &ldquo;Paint and primer in one&rdquo; deserves its own sentence: it works when
                you&apos;re repainting a sound, previously painted wall in a similar color, and
                it is not a substitute for real primer on bare drywall, patches, or stains. If
                any of these caveats apply to your room, the coats selector above is the honest
                fix — set it to 3 and let the math absorb the extra coat.
              </p>
            </div>

            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
                Buy every gallon at once, box them, and keep the leftover
              </h3>
              <p>
                Tint is mixed per can, and two gallons of the same color mixed on different
                machines — or the same machine on different days — can land a visible shade
                apart. The fix is old and free: buy all your gallons in one batch, then
                &ldquo;box&rdquo; them by pouring every can into one larger bucket and stirring
                before you start. One uniform color, no mid-wall shift where can two took over
                from can one. It&apos;s also the reason to trust the calculator&apos;s
                round-up rather than buying gallon by gallon as you run short.
              </p>
              <p className="mt-3">
                Work order matters more than technique: spackle and sand first, wipe the dust,
                tape, then cut in one wall with the sash brush and roll that same wall while
                the cut-in edge is still wet. Keeping that wet edge is what prevents the
                picture-frame effect, where brushed edges dry darker than the rolled field.
                Roll in a loose W and fill it in without lifting the roller. When the room is
                done, seal the leftover paint in its can, label it with the room and date, and
                keep it — touch-ups from the original batch disappear; touch-ups from a new can
                often don&apos;t. Before any of this, the finish decision is worth five
                minutes: our{" "}
                <Link href="/blog/paint-sheen-guide" className="text-primary underline hover:text-primary/80">
                  paint sheen guide
                </Link>{" "}
                covers which sheen fits which room, and{" "}
                <Link href="/blog/how-to-test-paint-samples" className="text-primary underline hover:text-primary/80">
                  how to test paint samples
                </Link>{" "}
                covers proving the color itself before you commit to gallons.
              </p>
            </div>

            <p className="text-sm text-outline">
              Some supply links above go to Amazon search results. As an Amazon Associate,
              Paint Color HQ earns from qualifying purchases, at no extra cost to you.
            </p>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Next Steps After Calculating
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              Once you know how much paint to buy, use these free Paint Color
              HQ tools to finalize your project:
            </p>
            <ol className="list-inside list-decimal space-y-3 pl-2">
              <li>
                <strong className="text-on-surface">Preview your color</strong> — open the{" "}
                <Link href="/tools/room-visualizer" className="text-primary underline hover:text-primary/80">
                  Room Visualizer
                </Link>{" "}
                to see your chosen shade on walls before purchasing.
              </li>
              <li>
                <strong className="text-on-surface">Compare shades side by side</strong> — the{" "}
                <Link href="/compare" className="text-primary underline hover:text-primary/80">
                  Color Comparison tool
                </Link>{" "}
                shows colors from Sherwin-Williams, Benjamin Moore, Behr,
                Valspar, PPG, Dunn-Edwards, and Farrow &amp; Ball next to each
                other with Delta E difference scores.
              </li>
              <li>
                <strong className="text-on-surface">Choose the right finish</strong> — read our{" "}
                <Link href="/blog/paint-sheen-guide" className="text-primary underline hover:text-primary/80">
                  paint sheen guide
                </Link>{" "}
                covering flat, eggshell, satin, semi-gloss, and high-gloss —
                with recommendations by room type.
              </li>
              <li>
                <strong className="text-on-surface">Build a full palette</strong> — use the{" "}
                <Link href="/tools/palette-generator" className="text-primary underline hover:text-primary/80">
                  Palette Generator
                </Link>{" "}
                to create coordinating color schemes for your entire home.
              </li>
            </ol>
          </div>

          <div className="mt-12">
            <ToolCrossSell exclude="paint-calculator" />
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
