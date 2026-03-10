import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Paint Sheen Guide: Flat vs Eggshell vs Satin vs Semi-Gloss",
  description:
    "Compare paint sheens side by side. Learn which finish works best for every room — from flat for ceilings to semi-gloss for kitchens and bathrooms.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/guides/paint-sheen-guide",
  },
  openGraph: {
    title: "Paint Sheen Guide: Flat vs Eggshell vs Satin vs Semi-Gloss",
    description:
      "Compare paint sheens side by side. Learn which finish works best for every room — from flat for ceilings to semi-gloss for kitchens and bathrooms.",
    type: "article",
    url: "https://www.paintcolorhq.com/guides/paint-sheen-guide",
  },
};

const sheens = [
  {
    name: "Flat / Matte",
    lightReflection: "0–5%",
    durability: "Low",
    washability: "Poor",
    bestFor: "Ceilings, low-traffic rooms",
    hidesImperfections: "Excellent",
  },
  {
    name: "Eggshell",
    lightReflection: "10–15%",
    durability: "Medium",
    washability: "Fair",
    bestFor: "Living rooms, bedrooms",
    hidesImperfections: "Good",
  },
  {
    name: "Satin",
    lightReflection: "25–30%",
    durability: "Medium-High",
    washability: "Good",
    bestFor: "Hallways, kids' rooms",
    hidesImperfections: "Fair",
  },
  {
    name: "Semi-Gloss",
    lightReflection: "35–50%",
    durability: "High",
    washability: "Very Good",
    bestFor: "Kitchens, bathrooms",
    hidesImperfections: "Poor",
  },
  {
    name: "High-Gloss",
    lightReflection: "70%+",
    durability: "Very High",
    washability: "Excellent",
    bestFor: "Trim, doors, cabinets",
    hidesImperfections: "Very Poor",
  },
];

export default function PaintSheenGuidePage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "Paint Sheen Guide: Which Finish Is Right for Your Room?",
    description:
      "Compare paint sheens side by side. Learn which finish works best for every room — from flat for ceilings to semi-gloss for kitchens and bathrooms.",
    datePublished: "2026-03-10",
    publisher: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://www.paintcolorhq.com",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* Article JSON-LD — static content only, no user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/guides" className="hover:text-gray-700">
              Guides
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Paint Sheen Guide</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl font-bold text-gray-900">
            Paint Sheen Guide: Which Finish Is Right for Your Room?
          </h1>

          {/* Intro */}
          <div className="mt-6 text-gray-700 leading-relaxed">
            <p>
              Paint sheen affects how a color looks, how durable it is, and how
              it handles moisture. The wrong sheen can make a beautiful color
              look flat or overly shiny. Here&apos;s what you need to know to
              choose the right finish for every surface in your home.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mt-12 overflow-x-auto">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900">
                      Sheen
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Light Reflection
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Durability
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Washability
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Best For
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">
                      Hides Imperfections?
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sheens.map((sheen, i) => (
                    <tr
                      key={sheen.name}
                      className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
                    >
                      <td className="sticky left-0 bg-inherit px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {sheen.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sheen.lightReflection}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sheen.durability}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sheen.washability}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sheen.bestFor}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {sheen.hidesImperfections}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Sheen Sections */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Flat / Matte
            </h2>
            <div className="mt-4 text-gray-700 leading-relaxed space-y-3">
              <p>
                Flat paint has zero shine and absorbs light rather than
                reflecting it. This makes it the best choice for hiding wall
                imperfections like minor dents, patches, and uneven textures.
                However, flat finishes mark easily and are difficult to clean
                without damaging the surface. Because flat sheens absorb light,
                colors will appear slightly darker on the wall than the swatch
                suggests.
              </p>
              <p>
                <strong>Best for:</strong> Ceilings, low-traffic rooms, formal
                dining rooms, and adult bedrooms.
              </p>
              <p>
                <strong>Avoid in:</strong> Kitchens, bathrooms, kids&apos;
                rooms, and anywhere that gets touched or splashed frequently.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Eggshell</h2>
            <div className="mt-4 text-gray-700 leading-relaxed space-y-3">
              <p>
                Eggshell has a subtle warmth and a slight sheen — think of the
                soft luster on the surface of an actual egg. It&apos;s the most
                popular wall finish in the United States because it strikes the
                right balance between aesthetics and practicality. You can wipe
                it down with a damp cloth without leaving marks, and it still
                does a reasonable job hiding minor wall imperfections.
              </p>
              <p>
                <strong>Best for:</strong> Living rooms, bedrooms, home offices,
                and most general-purpose rooms.
              </p>
              <p>
                <strong>Avoid in:</strong> High-moisture areas like bathrooms, or
                surfaces that need frequent scrubbing.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Satin</h2>
            <div className="mt-4 text-gray-700 leading-relaxed space-y-3">
              <p>
                Satin has a velvety sheen that&apos;s noticeably smoother than
                eggshell. It&apos;s highly durable, resists staining, and cleans
                up easily with soap and water. Colors appear slightly richer in
                satin because the finish reflects enough light to bring out
                depth and saturation without looking glossy.
              </p>
              <p>
                <strong>Best for:</strong> Kids&apos; rooms, hallways, family
                rooms, laundry rooms, and any wall that gets touched a lot.
              </p>
              <p>
                <strong>Avoid in:</strong> Ceilings or large walls with visible
                imperfections, since the sheen will highlight them.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Semi-Gloss</h2>
            <div className="mt-4 text-gray-700 leading-relaxed space-y-3">
              <p>
                Semi-gloss is reflective, moisture-resistant, and easy to scrub
                clean. It&apos;s the go-to sheen for any surface exposed to
                steam, grease, or frequent cleaning. The higher reflectivity
                makes colors look brighter and more vivid, which works well on
                trim and accent surfaces.
              </p>
              <p>
                <strong>Best for:</strong> Kitchens, bathrooms, trim, window
                frames, and door casings.
              </p>
              <p>
                <strong>Avoid in:</strong> Large wall areas, especially if the
                walls have imperfections — semi-gloss will magnify every bump
                and patch.
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">High-Gloss</h2>
            <div className="mt-4 text-gray-700 leading-relaxed space-y-3">
              <p>
                High-gloss delivers a mirror-like finish that is extremely
                durable and stain-resistant. It creates a dramatic, lacquered
                look that draws the eye. However, it shows every wall
                imperfection, brush stroke, and speck of dust, so surface
                preparation needs to be flawless.
              </p>
              <p>
                <strong>Best for:</strong> Trim, doors, cabinets, furniture, and
                accent features where you want a bold, polished look.
              </p>
              <p>
                <strong>Avoid in:</strong> Walls and ceilings — the extreme
                reflectivity reveals imperfections and creates distracting glare.
              </p>
            </div>
          </section>

          {/* How Sheen Affects Color */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              How Sheen Affects Color
            </h2>
            <div className="mt-4 text-gray-700 leading-relaxed space-y-3">
              <p>
                Higher sheens reflect more light, which makes colors appear
                lighter and more saturated on the wall. The same paint color in
                flat versus semi-gloss can look noticeably different — flat will
                read darker and more muted, while semi-gloss will look brighter
                and more vivid.
              </p>
              <p>
                This is why it&apos;s important to always test samples in the
                actual sheen you plan to use, not just the color. A swatch card
                at the store is usually printed in a single finish and
                won&apos;t show you how the sheen changes the color&apos;s
                appearance under your room&apos;s specific lighting.
              </p>
            </div>
          </section>

          {/* Quick Decision Guide */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Quick Decision Guide
            </h2>
            <ul className="mt-4 space-y-2 text-gray-700 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                <span>
                  <strong>Ceilings</strong> &rarr; Flat
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                <span>
                  <strong>Bedrooms &amp; Living Rooms</strong> &rarr; Eggshell
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                <span>
                  <strong>Kids&apos; Rooms &amp; Hallways</strong> &rarr; Satin
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                <span>
                  <strong>Kitchens &amp; Bathrooms</strong> &rarr; Semi-Gloss
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                <span>
                  <strong>Trim, Doors &amp; Cabinets</strong> &rarr; Semi-Gloss
                  or High-Gloss
                </span>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <div className="mt-16 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Ready to start your project?
            </h2>
            <p className="mt-2 text-gray-600">
              Once you&apos;ve picked your sheen, figure out exactly how much
              paint to buy.
            </p>
            <Link
              href="/tools/paint-calculator"
              className="mt-4 inline-block rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-dark"
            >
              Calculate How Much Paint You Need
            </Link>
          </div>

          {/* Related Guides */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Related Guides
            </h2>
            <div className="mt-4 space-y-3">
              <Link
                href="/guides/best-paint-colors-east-facing-rooms"
                className="block text-brand-blue hover:underline"
              >
                Best Paint Colors for East-Facing Rooms
              </Link>
              <Link
                href="/faq"
                className="block text-brand-blue hover:underline"
              >
                Frequently Asked Questions About Paint Colors
              </Link>
              <Link
                href="/tools/room-visualizer"
                className="block text-brand-blue hover:underline"
              >
                Room Color Visualizer
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
