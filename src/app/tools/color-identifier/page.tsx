import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorIdentifier } from "./identifier";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Photo Color Identifier - Find Paint Colors from Photos",
  description:
    "Upload a photo and click any spot to find matching paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more. Free, instant, cross-brand results.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/color-identifier",
  },
};

export default function ColorIdentifierPage() {
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
          <span className="text-gray-900">Photo Color Identifier</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          Photo Color Identifier
        </h1>
        <p className="mt-2 text-gray-600">
          Upload a photo, click any spot, and instantly find the closest
          matching paint colors from all major brands.
        </p>

        <ColorIdentifier />

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
            <p>
              <strong>1. Upload a photo</strong> from your device or snap one
              with your camera. Any image format works.
            </p>
            <p>
              <strong>2. Click a spot</strong> on the image to sample the color.
              The tool reads the exact pixel color at that point.
            </p>
            <p>
              <strong>3. Get matches</strong> instantly. We compare your sampled
              color against 25,000+ paint colors from Sherwin-Williams, Benjamin
              Moore, Behr, PPG, and more using the Delta E 2000 formula for
              perceptually accurate matching.
            </p>
            <p>
              Keep in mind that screen colors differ from physical paint. Always
              verify with a swatch or sample before purchasing.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            How the Photo Color Identifier Works
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              The Photo Color Identifier lets you extract real paint color
              matches from any image on your device. Upload a photo of a room,
              a piece of furniture, a fabric swatch, or anything else that
              caught your eye — then click on the exact spot you want to match.
              The tool reads the precise pixel color at that point and compares
              it against our database of over 25,000 paint colors from 14 major
              brands, including Sherwin-Williams, Benjamin Moore, Behr, Valspar,
              PPG, Dunn-Edwards, and Farrow &amp; Ball.
            </p>
            <p>
              Matching is done using the Delta E 2000 color difference formula,
              which measures how close two colors are the way the human eye
              actually perceives them — not just by raw RGB values. This means
              the top results are genuinely the closest visual matches you can
              buy at the store. Each result links to the full color detail page
              where you can explore undertones, coordinating colors, and
              cross-brand alternatives.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Best Photos for Accurate Color Matching
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              <strong>Use natural light.</strong> Colors shift dramatically
              under artificial lighting. Photograph the surface during daytime
              near a window or outdoors for the most accurate representation.
              Avoid flash, which washes out colors and creates harsh highlights.
            </p>
            <p>
              <strong>Avoid shadows and glare.</strong> Shadows darken colors
              and glossy reflections create bright spots that do not represent
              the true shade. If the surface is shiny, angle your camera
              slightly to eliminate glare while keeping the shot straight-on.
            </p>
            <p>
              <strong>Shoot straight-on at the actual surface.</strong> Take
              photos of the real wall, fabric, or object — not a photo of a
              screen showing the color. Screens add their own color profile and
              backlight, which distorts the result. Get close enough that the
              color fills a large portion of the frame.
            </p>
            <p>
              <strong>Click the most representative area.</strong> When sampling,
              avoid edges, corners, or areas where two colors meet. Click in the
              middle of a uniformly colored section for the most reliable match.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            What to Do After You Find Your Color
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              Once you have identified a paint color you love, the next step is
              to see how it will actually look in your space. Open the{" "}
              <Link
                href="/tools/room-visualizer"
                className="text-blue-700 underline hover:text-blue-900"
              >
                Room Visualizer
              </Link>{" "}
              to preview your matched color on walls, trim, and accent surfaces
              in a realistic room scene. This helps you evaluate the color in
              context before committing to a purchase.
            </p>
            <p>
              If the identifier returned matches from multiple brands, use the{" "}
              <Link
                href="/compare"
                className="text-blue-700 underline hover:text-blue-900"
              >
                Color Comparison tool
              </Link>{" "}
              to see those options side by side. Even colors that look identical
              on screen can have different undertones — one may lean warm while
              another skews cool. Comparing them together makes those
              differences easier to spot.
            </p>
            <p>
              Speaking of undertones, understanding them is key to making
              confident color choices. A gray that looks perfectly neutral in
              one room can read blue or purple in another depending on the
              light. Our guide on{" "}
              <Link
                href="/blog/understanding-paint-color-undertones"
                className="text-blue-700 underline hover:text-blue-900"
              >
                understanding paint color undertones
              </Link>{" "}
              explains how to identify and work with undertones so your final
              pick looks right in every lighting condition. Always order a
              physical sample or peel-and-stick swatch before buying full
              gallons — screens can only get you so close.
            </p>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Find Paint Colors from a Photo",
            description:
              "Upload a photo, click any spot, and instantly find matching paint colors from Sherwin-Williams, Benjamin Moore, Behr, and more.",
            step: [
              {
                "@type": "HowToStep",
                name: "Upload a photo",
                text: "Upload a photo from your device or snap one with your camera. Any image format works.",
              },
              {
                "@type": "HowToStep",
                name: "Click a spot",
                text: "Click a spot on the image to sample the color. The tool reads the exact pixel color at that point.",
              },
              {
                "@type": "HowToStep",
                name: "Get matches",
                text: "Instantly see the closest matching paint colors from 25,000+ colors across 14 major brands, matched using the Delta E 2000 formula.",
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
            name: "Photo Color Identifier",
            description:
              "Upload a photo, click any spot, and instantly find the closest matching paint colors from 14 major brands.",
            url: "https://www.paintcolorhq.com/tools/color-identifier",
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

      <AdSenseScript />
      <Footer />
    </div>
  );
}
