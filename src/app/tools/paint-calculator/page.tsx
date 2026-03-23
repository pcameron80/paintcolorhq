import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaintCalculator } from "./calculator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";

export const metadata: Metadata = {
  title: "Paint Calculator - How Much Paint Do I Need?",
  description:
    "Calculate exactly how many gallons of paint you need. Enter room dimensions, subtract doors and windows, and get coverage based on the 350 sq ft/gallon industry standard. Free calculator for Sherwin-Williams, Benjamin Moore, Behr, and all brands.",
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
        "@context": "https://schema.org", "@type": "HowTo",
        name: "How to Calculate How Much Paint You Need",
        description: "Calculate paint needed for a room using wall dimensions, doors, windows, and number of coats.",
        step: [
          { "@type": "HowToStep", name: "Measure your room", text: "Measure the length, width, and height of the room in feet." },
          { "@type": "HowToStep", name: "Calculate wall area", text: "Multiply 2 times (length + width) times height to get total wall area." },
          { "@type": "HowToStep", name: "Subtract doors and windows", text: "Subtract 21 sq ft per door and 15 sq ft per window." },
          { "@type": "HowToStep", name: "Account for coats", text: "Multiply paintable area by number of coats (usually 2)." },
          { "@type": "HowToStep", name: "Calculate gallons", text: "Divide total area by 350 sq ft per gallon and round up." },
        ],
      }} />
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
            more.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <PaintCalculator />
        </div>
      </section>

      {/* How We Calculate */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How We Calculate Paint Coverage
          </h2>
          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4">Coverage Rate</h3>
              <p>
                <strong className="text-on-surface">350 square feet per gallon</strong> — the
                industry-standard rate published by Sherwin-Williams, Benjamin
                Moore, and Behr for a single coat of interior latex paint on
                smooth, primed drywall. This rate is consistent across major
                brands and is based on ASTM D5150 spread rate testing.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4">The Formula in 4 Steps</h3>
              <ol className="list-inside list-decimal space-y-3 pl-2">
                <li>
                  <strong className="text-on-surface">Calculate wall area</strong> = 2 × (length + width) ×
                  ceiling height. Example: a 12 × 12 ft room with 8 ft ceilings =
                  384 sq ft of wall space.
                </li>
                <li>
                  <strong className="text-on-surface">Subtract openings</strong>: each standard door (3 × 7
                  ft) = 21 sq ft; each standard window (3 × 5 ft) = 15 sq ft.
                </li>
                <li>
                  <strong className="text-on-surface">Multiply by coats</strong>: 2 coats is standard for
                  full, even coverage per manufacturer recommendations.
                </li>
                <li>
                  <strong className="text-on-surface">Divide by 350 sq ft/gallon</strong> and round up to the
                  nearest whole gallon.
                </li>
              </ol>
            </div>

            <p>
              <strong className="text-on-surface">Adjustment factors:</strong> Textured surfaces (knockdown,
              orange peel) reduce coverage by 15–20%. Dark-to-light color
              changes require a tinted primer coat first. Porous surfaces like
              new drywall or bare wood may need 2 primer coats before topcoat.
            </p>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How to Use the Paint Calculator
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <ol className="list-inside list-decimal space-y-3 pl-2">
              <li>
                <strong className="text-on-surface">Enter room dimensions</strong> — length, width, and
                ceiling height in feet. The calculator computes total wall area
                using the formula: 2 × (length + width) × height.
              </li>
              <li>
                <strong className="text-on-surface">Enter number of doors and windows</strong> — the
                calculator subtracts 21 sq ft per standard door (3 × 7 ft) and
                15 sq ft per standard window (3 × 5 ft) to get your true
                paintable area.
              </li>
              <li>
                <strong className="text-on-surface">Select number of coats</strong> — 2 coats is
                recommended by Sherwin-Williams, Benjamin Moore, and Behr for
                full, even coverage on most interior projects. Use 1 coat only
                for same-color refreshes.
              </li>
              <li>
                <strong className="text-on-surface">Get your result</strong> — the calculator divides your
                total paintable area by 350 sq ft/gallon and rounds up to the
                nearest whole gallon.
              </li>
            </ol>
            <p>
              <strong className="text-on-surface">Example:</strong> A 12 × 14 ft bedroom with 8 ft
              ceilings, 1 door, and 2 windows = 416 sq ft of walls − 21 − 30 =
              365 sq ft of paintable area. At 2 coats, that is 730 sq ft ÷ 350
              = 2.09 → <strong className="text-on-surface">3 gallons needed</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* How Much Paint Do I Need */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How Much Paint Do I Need?
          </h2>
          <div className="space-y-6 text-on-surface-variant leading-relaxed">
            <p>
              <strong className="text-on-surface">One gallon of interior latex paint covers 350 sq ft</strong>{" "}
              on smooth, primed drywall in a single coat. Here are common room
              sizes and how much paint each requires (2 coats, 1 door, 2
              windows):
            </p>
            <div className="overflow-x-auto bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface">
                    <th className="py-3 pr-4 font-semibold">Room Size</th>
                    <th className="py-3 pr-4 font-semibold">Wall Area</th>
                    <th className="py-3 pr-4 font-semibold">Paintable Area</th>
                    <th className="py-3 pr-4 font-semibold">Gallons (2 coats)</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface-variant">
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4">10 × 10 ft (8 ft ceiling)</td>
                    <td className="py-3 pr-4">320 sq ft</td>
                    <td className="py-3 pr-4">269 sq ft</td>
                    <td className="py-3 pr-4 font-semibold text-on-surface">2 gallons</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4">12 × 12 ft (8 ft ceiling)</td>
                    <td className="py-3 pr-4">384 sq ft</td>
                    <td className="py-3 pr-4">333 sq ft</td>
                    <td className="py-3 pr-4 font-semibold text-on-surface">2 gallons</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4">12 × 14 ft (8 ft ceiling)</td>
                    <td className="py-3 pr-4">416 sq ft</td>
                    <td className="py-3 pr-4">365 sq ft</td>
                    <td className="py-3 pr-4 font-semibold text-on-surface">3 gallons</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10">
                    <td className="py-3 pr-4">14 × 16 ft (8 ft ceiling)</td>
                    <td className="py-3 pr-4">480 sq ft</td>
                    <td className="py-3 pr-4">429 sq ft</td>
                    <td className="py-3 pr-4 font-semibold text-on-surface">3 gallons</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">16 × 20 ft (9 ft ceiling)</td>
                    <td className="py-3 pr-4">648 sq ft</td>
                    <td className="py-3 pr-4">597 sq ft</td>
                    <td className="py-3 pr-4 font-semibold text-on-surface">4 gallons</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong className="text-on-surface">Trim and doors:</strong> 1 quart covers 1–2 standard
              doors or approximately 75 linear feet of baseboard.{" "}
              <strong className="text-on-surface">Ceilings:</strong> 1 gallon covers a ceiling up to 350 sq
              ft (roughly an 18 × 19 ft room). For dramatic color changes
              (dark-to-light or light-to-dark), add a tinted primer coat —
              Sherwin-Williams, Benjamin Moore, and Behr all offer tintable
              primers matched to their color systems.
            </p>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Tips for Accurate Paint Estimates
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <ol className="list-inside list-decimal space-y-3 pl-2">
              <li>
                <strong className="text-on-surface">Measure twice with a tape measure.</strong> Even a 6-inch
                error on one wall compounds to 4 sq ft across a room. Use a
                25-ft tape measure, not visual estimates.
              </li>
              <li>
                <strong className="text-on-surface">Add 15–20% for textured walls.</strong> Knockdown,
                orange peel, and skip-trowel textures increase paint absorption.
                A 350 sq ft/gallon rate drops to roughly 280–300 sq ft/gallon on
                heavy texture.
              </li>
              <li>
                <strong className="text-on-surface">Buy 10% extra for touch-ups.</strong> Keep leftover paint
                from the same batch — paint varies slightly between batches even
                with the same formula code from Sherwin-Williams, Benjamin Moore,
                or Behr.
              </li>
              <li>
                <strong className="text-on-surface">Calculate primer separately.</strong> Primer covers
                200–300 sq ft per gallon depending on surface porosity — 40% less
                coverage than topcoat paint. New drywall and bare wood require 2
                primer coats.
              </li>
              <li>
                <strong className="text-on-surface">Factor in paint type.</strong> Flat/matte finishes spread
                slightly farther than satin or semi-gloss. Sherwin-Williams
                Duration covers up to 400 sq ft/gallon; Benjamin Moore Regal
                Select covers 350–400 sq ft/gallon.
              </li>
            </ol>
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
