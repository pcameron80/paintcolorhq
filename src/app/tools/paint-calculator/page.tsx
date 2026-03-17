import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaintCalculator } from "./calculator";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Paint Calculator - How Much Paint Do I Need?",
  description:
    "Calculate exactly how many gallons of paint you need. Enter your room dimensions, doors, and windows for a free instant estimate.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/paint-calculator",
  },
};

export default function PaintCalculatorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/tools" className="hover:text-gray-900">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Paint Calculator</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          Paint Calculator
        </h1>
        <p className="mt-2 text-gray-600">
          Find out exactly how many gallons of paint you need for your room.
        </p>

        <PaintCalculator />

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            How We Calculate Paint Coverage
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-700">
            <p>
              Our calculator uses the standard paint coverage rate of{" "}
              <strong>350 square feet per gallon</strong>, which is the industry
              average for a single coat of interior latex paint on a smooth
              surface.
            </p>
            <p>The formula is straightforward:</p>
            <ol className="list-inside list-decimal space-y-2 pl-2">
              <li>
                <strong>Wall area</strong> = 2 &times; (length + width) &times;
                height
              </li>
              <li>
                <strong>Subtract openings</strong>: each standard door is ~21 sq
                ft, each window is ~15 sq ft
              </li>
              <li>
                <strong>Multiply by coats</strong>: most jobs need 2 coats for
                even coverage
              </li>
              <li>
                <strong>Divide by 350</strong> sq ft/gallon and round up
              </li>
            </ol>
            <p>
              <strong>Tips:</strong> Textured walls, porous surfaces, and dark-to-light
              color changes may require extra paint. We recommend buying an extra
              quart for touch-ups down the road.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            How the Paint Calculator Works
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              Our paint calculator takes the guesswork out of buying the right
              amount of paint. Start by entering your room dimensions — length,
              width, and ceiling height — to calculate the total wall area. Then
              subtract the areas you will not be painting by entering the number
              of doors and windows in the room. The calculator automatically
              deducts approximately 21 square feet per standard door and 15
              square feet per average window, giving you the true paintable
              surface area.
            </p>
            <p>
              Next, select how many coats you plan to apply. Two coats is the
              standard recommendation for most interior projects, but a single
              coat may be enough if you are refreshing with the same color. The
              calculator multiplies your paintable area by the number of coats,
              divides by the industry-standard coverage rate of 350 square feet
              per gallon, and rounds up to the nearest whole gallon so you always
              have enough on hand.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            How Much Paint Do I Need?
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              As a general rule of thumb, one gallon of interior latex paint
              covers roughly 350 to 400 square feet on a smooth, primed surface
              in a single coat. For a typical 12-by-12-foot bedroom with 8-foot
              ceilings, that works out to about 384 square feet of wall space
              before subtracting openings — so one gallon will handle the first
              coat, and you will need a second gallon for coat number two.
            </p>
            <p>
              Most paint projects require two coats for even, consistent
              coverage. If you are making a dramatic color change — going from
              dark to light or light to dark — you may need a tinted primer plus
              two topcoats. Ceilings typically need just one gallon for an
              average room since the coverage rate is similar but the area is
              smaller than the combined wall space. For trim and doors, a quart
              usually covers one to two standard doors or 50 to 75 linear feet
              of baseboard.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Tips for Accurate Paint Estimates
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              <strong>Measure twice.</strong> Even small measurement errors
              compound quickly across four walls. Use a tape measure rather than
              estimating, and double-check your numbers before entering them into
              the calculator.
            </p>
            <p>
              <strong>Account for wall texture.</strong> Textured surfaces like
              knockdown, orange peel, or brick absorb significantly more paint
              than smooth drywall. If your walls have heavy texture, increase
              your estimate by 15 to 20 percent.
            </p>
            <p>
              <strong>Buy 10 percent extra for touch-ups.</strong> You will
              almost always need to touch up scuffs, nail holes, or missed spots
              after the main job is done. Having leftover paint from the same
              batch ensures a perfect color match — paint can vary slightly
              between batches even with the same formula.
            </p>
            <p>
              <strong>Primer needs a separate calculation.</strong> If you are
              applying primer before your topcoat, calculate primer coverage
              separately. Primer typically covers 200 to 300 square feet per
              gallon depending on the surface porosity, which is less than
              standard paint.
            </p>
            <p>
              Once you know how much paint you need, use our{" "}
              <Link
                href="/tools/room-visualizer"
                className="text-blue-700 underline hover:text-blue-900"
              >
                Room Visualizer
              </Link>{" "}
              to preview your chosen color on walls before you buy. If you are
              still deciding between shades, the{" "}
              <Link
                href="/compare"
                className="text-blue-700 underline hover:text-blue-900"
              >
                Color Comparison tool
              </Link>{" "}
              lets you see them side by side. And for guidance on choosing the
              right finish for each surface, check out our{" "}
              <Link
                href="/blog/paint-sheen-guide"
                className="text-blue-700 underline hover:text-blue-900"
              >
                complete paint sheen guide
              </Link>
              .
            </p>
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/search"
            className="text-sm font-medium text-brand-blue hover:underline"
          >
            Now find the perfect color &rarr;
          </Link>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: "How to Calculate How Much Paint You Need",
              description:
                "Calculate paint needed for a room using wall dimensions, doors, windows, and number of coats.",
              step: [
                {
                  "@type": "HowToStep",
                  name: "Measure your room",
                  text: "Measure the length, width, and height of the room in feet.",
                },
                {
                  "@type": "HowToStep",
                  name: "Calculate wall area",
                  text: "Multiply 2 times (length + width) times height to get total wall area.",
                },
                {
                  "@type": "HowToStep",
                  name: "Subtract doors and windows",
                  text: "Subtract 21 sq ft per door and 15 sq ft per window.",
                },
                {
                  "@type": "HowToStep",
                  name: "Account for coats",
                  text: "Multiply paintable area by number of coats (usually 2).",
                },
                {
                  "@type": "HowToStep",
                  name: "Calculate gallons",
                  text: "Divide total area by 350 sq ft per gallon and round up.",
                },
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Paint Calculator",
              description:
                "Calculate exactly how many gallons of paint you need for any room. Enter dimensions and get accurate coverage estimates.",
              url: "https://www.paintcolorhq.com/tools/paint-calculator",
              applicationCategory: "DesignApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
