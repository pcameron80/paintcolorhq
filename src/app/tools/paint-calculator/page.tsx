import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaintCalculator } from "./calculator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { getAmazonSearchUrl } from "@/lib/affiliate";
import { ogDefaults } from "@/lib/og";
import { COVERAGE_PRODUCTS, GENERIC_RATE, formatRange, type CoverageSurface } from "@/lib/paint-coverage";
import { roomSizeTable } from "@/lib/paint-quantity";

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

const TITLE = "Paint Calculator: Gallons Needed and Coverage per Gallon";
const DESCRIPTION =
  "Work out how many gallons of paint a room, ceiling, door set, cabinets or house needs, using spread rates from Sherwin-Williams, Benjamin Moore, Valspar and Glidden data sheets.";
const URL = "https://www.paintcolorhq.com/tools/paint-calculator";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: { ...ogDefaults, title: TITLE, description: DESCRIPTION, url: URL },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const SURFACE_LABEL: Record<CoverageSurface, string> = {
  walls: "Walls",
  ceiling: "Ceilings",
  trim: "Trim, doors, cabinets",
  exterior: "Exterior",
  primer: "Primer",
};

function formatReadDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const COVERAGE_ANSWER =
  "One gallon of interior wall paint covers about 350 to 450 square feet in one coat on smooth, primed drywall, going by the manufacturer data sheets below. Exterior paint covers less, about 250 to 400 square feet, because siding is rougher and more porous. Most walls take two coats, so one gallon finishes roughly half that area.";

const ROOM_ROWS = roomSizeTable(GENERIC_RATE.interior, GENERIC_RATE.interior);

const FAQS: Array<{ q: string; a: string }> = [
  { q: "How much does a gallon of paint cover?", a: COVERAGE_ANSWER },
  {
    q: "How many gallons for a 12x12 room?",
    a: "A 12x12 ft room with 8 ft ceilings has 384 sq ft of wall. Take off one door (21 sq ft) and two windows (30 sq ft) and 333 sq ft is left to paint. Two coats is 666 sq ft, which at 350 sq ft per gallon is 1.90 gallons, so buy 2 gallons.",
  },
  {
    q: "How do I calculate how much paint I need?",
    a: "Multiply 2 x (length + width) x ceiling height for the wall area. Subtract about 21 sq ft per door and 15 sq ft per window. Multiply by the number of coats, divide by the spread rate on your paint's data sheet (350 sq ft per gallon if you don't know it yet), and round up to whole gallons.",
  },
  {
    q: "How much paint do I need for a ceiling?",
    a: "Multiply the room's length by its width for the ceiling area, then divide by the spread rate. A 12x14 ft ceiling is 168 sq ft, so one coat at 350 sq ft per gallon is 0.48 gallons: buy 1 gallon, or 2 quarts if the paint is sold in quarts.",
  },
  {
    q: "What supplies do I need to paint a room?",
    a: "Beyond the paint, a standard room takes seven things: a 9-inch roller frame with 3/8-inch nap covers (1/2-inch on textured walls), a 2.5-inch angled sash brush for cutting in, a paint tray with one liner per coat, painter's tape for baseboards and casings, a 9x12 canvas drop cloth, a roller extension pole, and spackle with a sanding sponge for prep. Starting from zero, the kit runs roughly $60-90, and everything except the tape, liners, and covers is reusable for years. The paint calculator sizes the tape and drop-cloth quantities to your room's dimensions.",
  },
  {
    q: "What size roller nap should I use?",
    a: "Match the nap to the surface: 3/8-inch for smooth drywall and plaster (the standard interior wall), 1/2-inch for light texture like orange peel, and 3/4-inch for heavy texture like knockdown or masonry. A 1/4-inch nap or foam roller gives the smoothest finish on doors, cabinets, and trim. Choose woven covers over knit, because cheap knit covers shed lint into the finish.",
  },
];

const linkClass = "text-primary underline hover:text-primary/80";

export default function PaintCalculatorPage() {
  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Calculator",
        description: "Estimate how many gallons of paint you need for walls, a ceiling, doors, cabinets or an exterior. Subtracts doors and windows and uses spread rates from manufacturer data sheets.",
        url: "https://www.paintcolorhq.com/tools/paint-calculator",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
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
            Work out how many gallons of paint you need for a room, a ceiling,
            doors, cabinets or the outside of a house. Enter the dimensions,
            subtract doors and windows, and pick your paint to use the spread
            rate from its own data sheet, or plan with{" "}
            <strong className="text-on-surface">350 sq ft per gallon</strong> if
            you haven&apos;t chosen one yet. Room estimates include a supplies
            checklist sized to your room.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <PaintCalculator />
        </div>
      </section>

      {/* Coverage per gallon, cited row by row */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
            How much does a gallon of paint cover?
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-6">{COVERAGE_ANSWER}</p>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Published coverage per gallon by product</caption>
              <thead className="bg-surface-container-low text-on-surface">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Paint</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Use</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Sq ft per gallon</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                {COVERAGE_PRODUCTS.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-on-surface">{p.brand} {p.product}</span>
                      <span className="block text-xs">{p.sheen}</span>
                    </td>
                    <td className="px-4 py-3">{p.surfaces.map((s) => SURFACE_LABEL[s]).join(", ")}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatRange(p)}</td>
                    <td className="px-4 py-3">
                      <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        {p.brand} {p.sourceType}
                      </a>
                      <span className="block text-xs">read {formatReadDate(p.readDate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-outline">
            One coat on a smooth, primed surface, as printed on each manufacturer&apos;s
            data sheet. &ldquo;Up to&rdquo; means the sheet gives only a ceiling. The
            calculator plans with the low end of each range so the estimate errs
            toward enough paint.
          </p>
        </div>
      </section>

      {/* Gallons by room size */}
      <section className="py-16 px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
            Gallons by room size
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-6">
            Worked out with the calculator&apos;s own math for 8 ft ceilings, one door and
            two windows, two coats on the walls and one on the ceiling, at{" "}
            {GENERIC_RATE.interior} sq ft per gallon.
          </p>
          <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full min-w-[420px] text-left text-sm">
              <caption className="sr-only">Gallons of paint by room size</caption>
              <thead className="bg-surface-container-low text-on-surface">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Room</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Wall area to paint</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Walls, 2 coats</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ceiling, 1 coat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                {ROOM_ROWS.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-4 py-3 font-medium text-on-surface">{r.label}</th>
                    <td className="px-4 py-3">{r.paintableArea} sq ft</td>
                    <td className="px-4 py-3">{r.wallGallons} {r.wallGallons === 1 ? "gallon" : "gallons"}</td>
                    <td className="px-4 py-3">{r.ceilingGallons} {r.ceilingGallons === 1 ? "gallon" : "gallons"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                The calculator&apos;s default rate, 350 sq ft per gallon, is the low end of what
                the interior wall paints in the table above print for one coat on smooth, primed
                drywall; some sheets go as high as 450. Three situations pull real coverage below
                the printed number. Texture
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

      {/* Visible FAQ: the same questions and answers as the FAQPage JSON-LD */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">
            Paint calculator FAQ
          </h2>
          <dl className="space-y-6 text-on-surface-variant leading-relaxed">
            {FAQS.map((f) => (
              <div key={f.q}>
                <dt className="font-headline text-lg font-bold text-on-surface">{f.q}</dt>
                <dd className="mt-2">{f.a}</dd>
              </div>
            ))}
          </dl>
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
                other with a plain-language verdict on how close they are.
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
