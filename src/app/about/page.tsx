import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About Paint Color HQ - How We Match Colors Across Brands",
  description:
    "Paint Color HQ helps you find, match, and compare paint colors across 14 major brands. Learn how our CIEDE2000 color matching works and why 25,000+ colors are at your fingertips.",
  alternates: { canonical: "https://www.paintcolorhq.com/about" },
  openGraph: {
    title: "About Paint Color HQ - How We Match Colors Across Brands",
    description:
      "Paint Color HQ helps you find, match, and compare paint colors across 14 major brands using CIEDE2000 perceptual color science.",
    type: "website",
    url: "https://www.paintcolorhq.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">About</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">
            About Paint Color HQ
          </h1>

          <div className="mt-8 space-y-8 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                What We Do
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ is a free toolkit that helps homeowners,
                designers, and contractors find the right paint color for any
                project. We catalog over 25,000 colors from 14 major paint
                brands and let you search, compare, match, and visualize them
                all in one place.
              </p>
              <p className="mt-3 leading-relaxed">
                Whether you need to match a Sherwin-Williams color to Benjamin
                Moore, preview a shade on your walls before buying, or figure
                out exactly how many gallons you need, our tools are built to
                save you time and guesswork.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                How Our Color Matching Works
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint brands don&apos;t publish cross-references to each
                other&apos;s colors. We solve that problem using{" "}
                <strong>CIEDE2000</strong>, the industry-standard formula for
                measuring how different two colors appear to the human eye. For
                every color in our database, we compute the perceptual distance
                (called <em>Delta&nbsp;E</em>) to every color from every other
                brand and surface the closest matches.
              </p>
              <p className="mt-3 leading-relaxed">
                A Delta&nbsp;E below 1.0 means the difference is imperceptible
                to most people. Between 1.0 and 3.0, trained eyes might notice.
                Above 3.0, the difference is clearly visible. Every match we
                show includes its Delta&nbsp;E score so you can judge for
                yourself how close it really is.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Brands We Cover
              </h2>
              <p className="mt-3 leading-relaxed">
                Our database includes colors from 14 major paint brands
                available in North America and internationally:
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                {[
                  "Sherwin-Williams",
                  "Benjamin Moore",
                  "Behr",
                  "PPG",
                  "Valspar",
                  "Dunn-Edwards",
                  "Farrow & Ball",
                  "Clark+Kensington",
                  "Glidden",
                  "Olympic",
                  "Dutch Boy",
                ].map((brand) => (
                  <li key={brand} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />
                    {brand}
                  </li>
                ))}
              </ul>
              <p className="mt-3 leading-relaxed">
                We add new brands and update existing color data regularly. If
                you notice a missing color or incorrect data, please{" "}
                <Link
                  href="/contact"
                  className="text-brand-blue underline hover:text-brand-blue-dark"
                >
                  let us know
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Our Tools
              </h2>
              <div className="mt-3 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">
                    <Link
                      href="/search"
                      className="text-brand-blue hover:underline"
                    >
                      Cross-Brand Color Matching
                    </Link>
                  </h3>
                  <p className="mt-1 leading-relaxed">
                    Search for any color and instantly see the closest matches
                    from every other brand, ranked by Delta&nbsp;E accuracy.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    <Link
                      href="/tools/room-visualizer"
                      className="text-brand-blue hover:underline"
                    >
                      Room Color Visualizer
                    </Link>
                  </h3>
                  <p className="mt-1 leading-relaxed">
                    Preview paint colors on walls, accent walls, trim, and
                    floors in a realistic room scene before buying a single
                    sample pot.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    <Link
                      href="/tools/color-identifier"
                      className="text-brand-blue hover:underline"
                    >
                      Photo Color Identifier
                    </Link>
                  </h3>
                  <p className="mt-1 leading-relaxed">
                    Upload any photo, click a spot, and find the closest
                    matching paint colors from every brand in our database.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    <Link
                      href="/tools/palette-generator"
                      className="text-brand-blue hover:underline"
                    >
                      Palette Generator
                    </Link>
                  </h3>
                  <p className="mt-1 leading-relaxed">
                    Pick a starting color and generate coordinated palettes
                    using complementary, analogous, triadic, and split
                    complementary color harmonies — mapped to real paint colors.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    <Link
                      href="/tools/paint-calculator"
                      className="text-brand-blue hover:underline"
                    >
                      Paint Calculator
                    </Link>
                  </h3>
                  <p className="mt-1 leading-relaxed">
                    Enter your room dimensions and get an accurate estimate of
                    how many gallons of paint you need, with adjustments for
                    doors, windows, and coats.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Color Data Accuracy
              </h2>
              <p className="mt-3 leading-relaxed">
                All color data on Paint Color HQ is based on the digital hex and
                RGB values published by each brand. We source this data directly
                from manufacturer color libraries and update it regularly.
              </p>
              <p className="mt-3 leading-relaxed">
                That said, digital color representations are approximations.
                Real paint looks different depending on the finish (matte,
                eggshell, satin, semi-gloss), the lighting in your room, the
                number of coats, and even the color of your primer. We always
                recommend verifying with physical paint samples before making a
                final purchase.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Questions or Feedback?
              </h2>
              <p className="mt-3 leading-relaxed">
                We&apos;re always looking to improve. If you have a question,
                found an issue, or want to suggest a feature, reach out on
                our{" "}
                <Link
                  href="/contact"
                  className="text-brand-blue underline hover:text-brand-blue-dark"
                >
                  contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
