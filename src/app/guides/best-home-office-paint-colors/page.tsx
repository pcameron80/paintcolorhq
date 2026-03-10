import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { getGuideColors } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Best Home Office Paint Colors for Focus & Productivity (2026)",
  description:
    "Boost focus and reduce fatigue with the right home office paint color. Data-backed color picks from Sherwin-Williams, Benjamin Moore, Behr, and more.",
  alternates: {
    canonical:
      "https://www.paintcolorhq.com/guides/best-home-office-paint-colors",
  },
  openGraph: {
    title: "Best Home Office Paint Colors for Focus & Productivity (2026)",
    description:
      "Boost focus and reduce fatigue with the right home office paint color. Data-backed color picks from Sherwin-Williams, Benjamin Moore, Behr, and more.",
    type: "article",
    url: "https://www.paintcolorhq.com/guides/best-home-office-paint-colors",
  },
};

const brandSlugs = [
  "sherwin-williams",
  "benjamin-moore",
  "behr",
  "valspar",
  "ppg",
];

export default async function HomeOfficePaintColorsGuidePage() {
  const [focusBlues, lowFatigueGreens, warmNeutrals] = await Promise.all([
    getGuideColors({
      colorFamilies: ["blue"],
      lrvMin: 45,
      lrvMax: 70,
      undertones: ["cool", "neutral"],
      brandSlugs,
      limit: 8,
    }),
    getGuideColors({
      colorFamilies: ["green"],
      lrvMin: 40,
      lrvMax: 65,
      brandSlugs,
      limit: 8,
    }),
    getGuideColors({
      colorFamilies: ["gray", "beige", "off-white"],
      lrvMin: 55,
      lrvMax: 75,
      undertones: ["warm", "neutral"],
      brandSlugs,
      limit: 8,
    }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Best Home Office Paint Colors for Focus & Productivity",
    description:
      "Boost focus and reduce fatigue with the right home office paint color. Data-backed color picks from Sherwin-Williams, Benjamin Moore, Behr, and more.",
    datePublished: "2026-03-10",
    url: "https://www.paintcolorhq.com/guides/best-home-office-paint-colors",
    author: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://www.paintcolorhq.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Paint Color HQ",
      url: "https://www.paintcolorhq.com",
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
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
            <span className="text-gray-900">Home Office Paint Colors</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Best Home Office Paint Colors for Focus &amp; Productivity
          </h1>

          {/* Intro */}
          <p className="mt-6 text-gray-700 leading-relaxed">
            The right home office color can measurably improve focus and reduce
            eye fatigue. Cool, muted tones promote concentration, while overly
            warm or dark colors can make you drowsy. Aim for colors with LRV
            50&ndash;70 &mdash; bright enough to feel energizing, muted enough
            to avoid distraction.
          </p>

          {/* The Science of Color & Productivity */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              The Science of Color &amp; Productivity
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700 leading-relaxed">
              <li>
                <strong>Blue</strong> promotes concentration and mental clarity
                &mdash; ideal for focused work
              </li>
              <li>
                <strong>Green</strong> reduces eye fatigue &mdash; best for long
                screen hours
              </li>
              <li>
                <strong>Warm neutrals</strong> feel inviting for hybrid
                office/meeting spaces
              </li>
              <li>
                <strong>Avoid:</strong> bright yellow (anxiety-inducing over
                time), red (too stimulating), dark colors (drowsiness)
              </li>
              <li>
                <strong>LRV 50&ndash;70</strong> reduces eye strain from
                contrast between walls and screen
              </li>
            </ul>
          </section>

          {/* Focus Blues */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">Focus Blues</h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              Soft blues are the top choice for offices that require deep focus
              &mdash; think accounting, writing, or programming.
            </p>
            {focusBlues.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {focusBlues.map((color) => (
                  <ColorCard
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    brandName={color.brand.name}
                    brandSlug={color.brand.slug}
                    colorSlug={color.slug}
                    colorNumber={color.color_number}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-gray-500">
                No matching colors found. Check back soon as we expand our
                database.
              </p>
            )}
          </section>

          {/* Low-Fatigue Greens */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Low-Fatigue Greens
            </h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              If you stare at a screen all day, green is your best friend. It
              is the color the human eye processes most easily, reducing strain.
            </p>
            {lowFatigueGreens.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {lowFatigueGreens.map((color) => (
                  <ColorCard
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    brandName={color.brand.name}
                    brandSlug={color.brand.slug}
                    colorSlug={color.slug}
                    colorNumber={color.color_number}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-gray-500">
                No matching colors found. Check back soon as we expand our
                database.
              </p>
            )}
          </section>

          {/* Warm Neutrals for Video Calls */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Warm Neutrals for Video Calls
            </h2>
            <p className="mt-2 text-gray-700 leading-relaxed">
              If your office doubles as a video call backdrop, warm neutrals
              look professional on camera without washing you out.
            </p>
            {warmNeutrals.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {warmNeutrals.map((color) => (
                  <ColorCard
                    key={color.id}
                    name={color.name}
                    hex={color.hex}
                    brandName={color.brand.name}
                    brandSlug={color.brand.slug}
                    colorSlug={color.slug}
                    colorNumber={color.color_number}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-gray-500">
                No matching colors found. Check back soon as we expand our
                database.
              </p>
            )}
          </section>

          {/* Video Call Tip */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900">
              Video Call Tip
            </h2>
            <p className="mt-4 text-gray-700 leading-relaxed">
              Colors with LRV 55&ndash;70 and warm undertones photograph best
              on webcams. Avoid pure white walls (glare) and dark colors
              (you&apos;ll look washed out). Soft greige and warm gray are the
              sweet spot.
            </p>
          </section>

          {/* CTA */}
          <section className="mt-16">
            <Link
              href="/tools/room-visualizer"
              className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Visualize your home office
            </Link>
          </section>

          {/* Related Guides */}
          <section className="mt-16 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Related Guides
            </h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/guides/best-paint-colors-north-facing-rooms"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Paint Colors for North-Facing Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-paint-colors-east-facing-rooms"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Paint Colors for East-Facing Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/best-nursery-paint-colors"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Best Nursery Paint Colors
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/paint-sheen-guide"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Paint Sheen Guide
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
