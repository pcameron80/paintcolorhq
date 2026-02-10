import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaintCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Paint Calculator - How Much Paint Do I Need?",
  description:
    "Calculate exactly how many gallons of paint you need. Enter your room dimensions, doors, and windows for a free instant estimate.",
  alternates: {
    canonical: "https://paintcolorhq.com/tools/paint-calculator",
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

        <div className="mt-8">
          <Link
            href="/search"
            className="text-sm font-medium text-blue-600 hover:underline"
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
      </main>

      <Footer />
    </div>
  );
}
