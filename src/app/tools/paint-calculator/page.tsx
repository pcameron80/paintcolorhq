import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaintCalculator } from "./calculator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const hasParams = Object.keys(sp).length > 0;
  return {
    title: "Paint Calculator - How Much Paint Do I Need?",
    description:
      "Calculate exactly how many gallons of paint you need. Enter room dimensions, subtract doors and windows, and get coverage based on the 350 sq ft/gallon industry standard. Free calculator for Sherwin-Williams, Benjamin Moore, Behr, and all brands.",
    alternates: {
      canonical: "https://www.paintcolorhq.com/tools/paint-calculator",
    },
    ...(hasParams && { robots: { index: false, follow: true } }),
  };
}

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
