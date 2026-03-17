import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "About Paint Color HQ | Our Color Science Methodology",
  description:
    "Learn how Paint Color HQ uses CIEDE2000 color science to match 25,000+ colors across 14 brands. Independent, data-driven paint color tools.",
  alternates: { canonical: "https://www.paintcolorhq.com/about" },
  openGraph: {
    title: "About Paint Color HQ | Our Color Science Methodology",
    description:
      "Learn how Paint Color HQ uses CIEDE2000 color science to match 25,000+ colors across 14 brands. Independent, data-driven paint color tools.",
    type: "website",
    url: "https://www.paintcolorhq.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Paint Color HQ",
            url: "https://www.paintcolorhq.com",
            logo: "https://www.paintcolorhq.com/logo.webp",
            description:
              "Paint Color HQ is an independent paint color discovery and cross-brand matching platform. We use CIEDE2000 color science to help homeowners and professionals choose paint colors with confidence.",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              url: "https://www.paintcolorhq.com/contact",
            },
            sameAs: [],
            knowsAbout: [
              "Paint color matching",
              "CIEDE2000 color difference",
              "Cross-brand paint color comparison",
              "Color science",
              "Interior paint selection",
            ],
          }),
        }}
      />

      {/* AboutPage WebPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Paint Color HQ",
            description:
              "Learn how Paint Color HQ uses CIEDE2000 color science to match 25,000+ paint colors across 14 brands.",
            url: "https://www.paintcolorhq.com/about",
            mainEntity: {
              "@type": "Organization",
              name: "Paint Color HQ",
              url: "https://www.paintcolorhq.com",
            },
          }),
        }}
      />

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

          <div className="mt-8 space-y-10 text-gray-700">
            {/* Section 1: What is Paint Color HQ? */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                What is Paint Color HQ?
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ is a paint color discovery and cross-brand
                matching platform. We catalog{" "}
                <strong>over 25,000 colors across 14 major paint brands</strong>{" "}
                and provide free tools that help homeowners, interior designers,
                and painting professionals choose paint colors with confidence.
              </p>
              <p className="mt-3 leading-relaxed">
                Our mission is straightforward: eliminate the guesswork from
                choosing paint colors. Instead of buying dozens of sample pots or
                wondering whether a Sherwin-Williams shade has a Benjamin Moore
                equivalent, you can find answers instantly with data you can
                trust.
              </p>

              <div className="mt-5">
                <h3 className="text-base font-medium text-gray-900">
                  Free Tools
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Every tool on Paint Color HQ is free to use, with no account
                  required.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/tools/room-visualizer"
                    className="group rounded-lg border border-gray-200 p-3 transition hover:border-brand-blue hover:shadow-sm"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-brand-blue">
                      Room Visualizer
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Preview colors on walls, trim, and floors in a realistic
                      room scene.
                    </p>
                  </Link>
                  <Link
                    href="/tools/color-identifier"
                    className="group rounded-lg border border-gray-200 p-3 transition hover:border-brand-blue hover:shadow-sm"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-brand-blue">
                      Color Identifier
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload a photo, click any spot, and find matching paint
                      colors.
                    </p>
                  </Link>
                  <Link
                    href="/tools/palette-generator"
                    className="group rounded-lg border border-gray-200 p-3 transition hover:border-brand-blue hover:shadow-sm"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-brand-blue">
                      Palette Generator
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Build coordinated palettes using color harmony rules mapped
                      to real paints.
                    </p>
                  </Link>
                  <Link
                    href="/tools/paint-calculator"
                    className="group rounded-lg border border-gray-200 p-3 transition hover:border-brand-blue hover:shadow-sm"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-brand-blue">
                      Paint Calculator
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Estimate gallons needed based on room dimensions, doors,
                      and windows.
                    </p>
                  </Link>
                  <Link
                    href="/compare"
                    className="group rounded-lg border border-gray-200 p-3 transition hover:border-brand-blue hover:shadow-sm"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-brand-blue">
                      Compare Tool
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Place two or more colors side by side with Delta E scores.
                    </p>
                  </Link>
                  <Link
                    href="/search"
                    className="group rounded-lg border border-gray-200 p-3 transition hover:border-brand-blue hover:shadow-sm"
                  >
                    <span className="font-medium text-gray-900 group-hover:text-brand-blue">
                      Color Search
                    </span>
                    <p className="mt-1 text-sm text-gray-500">
                      Search by name, code, hex value, or browse by color family
                      and brand.
                    </p>
                  </Link>
                </div>
              </div>
            </section>

            {/* Section 2: Our Color Science Methodology */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Our Color Science Methodology
              </h2>
              <p className="mt-3 leading-relaxed">
                Color matching on Paint Color HQ is powered by{" "}
                <strong>CIEDE2000</strong>, the latest international standard for
                measuring perceptual color difference. Unlike older formulas
                (CIE76, CIE94), CIEDE2000 accounts for how the human eye
                actually perceives differences in lightness, chroma, and hue,
                making it the most accurate method available for comparing paint
                colors digitally.
              </p>
              <p className="mt-3 leading-relaxed">
                For every color in our database, we compute the perceptual
                distance — called <strong>Delta E</strong> — to every color from
                every other brand. This score tells you exactly how close two
                colors are to the human eye:
              </p>

              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-900">
                        Delta E Range
                      </th>
                      <th className="px-4 py-2.5 text-left font-semibold text-gray-900">
                        What It Means
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        &lt; 1.0
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        Virtually identical — the difference is imperceptible to
                        most people
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        1.0 &ndash; 2.0
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        Very close — most people cannot tell them apart
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        2.0 &ndash; 3.0
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        Close — a slight difference may be visible when placed
                        side by side
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        3.0 &ndash; 5.0
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        Noticeable difference — clearly distinguishable to most
                        observers
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="mt-6 text-base font-medium text-gray-900">
                Color Data We Provide
              </h3>
              <p className="mt-2 leading-relaxed">
                Every color page on Paint Color HQ includes:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-blue" />
                  <span>
                    <strong>Hex and RGB values</strong> — the exact digital color
                    representation
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-blue" />
                  <span>
                    <strong>LRV (Light Reflectance Value)</strong> — how much
                    light a color reflects, useful for choosing colors for
                    different room sizes and lighting conditions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-blue" />
                  <span>
                    <strong>Undertone classification</strong> — whether a color
                    reads warm, cool, or neutral, which affects how it pairs with
                    other elements in your space
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-blue" />
                  <span>
                    <strong>Cross-brand matches</strong> — the closest equivalent
                    colors from every other brand, ranked by Delta E accuracy
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3: How We're Different */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                How We&apos;re Different
              </h2>
              <p className="mt-3 leading-relaxed">
                Paint Color HQ is not a paint store. We don&apos;t sell paint,
                and we&apos;re not affiliated with any paint manufacturer.
                We&apos;re an{" "}
                <strong>independent reference tool</strong> built to help you
                make informed decisions about paint colors before you visit the
                store.
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-blue">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Cross-Brand Matching
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      Paint brands don&apos;t publish cross-references to each
                      other&apos;s colors. We compute matches across all 14
                      brands using CIEDE2000, so you can find an equivalent color
                      no matter which brand your local store carries.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-blue">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Data-Driven, Not Opinion-Based
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      Every color recommendation on this site is backed by color
                      science. When we say two colors are close, we show you the
                      Delta E score to prove it. No subjective &ldquo;these look
                      similar&rdquo; guesses.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-blue">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Completely Free
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      All tools, color data, and matching results are free to use
                      with no account or sign-up required. We believe paint color
                      information should be accessible to everyone.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-brand-blue">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Accuracy Transparency
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      All color data is based on digital hex and RGB values
                      published by each manufacturer. We update our database
                      regularly and always recommend verifying with physical
                      paint samples, because real paint looks different depending
                      on finish, lighting, coats, and primer.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Brands We Cover */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
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
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
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

            {/* Section 5: Contact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900">
                Contact Us
              </h2>
              <p className="mt-3 leading-relaxed">
                Have a question, found inaccurate data, or want to suggest a
                feature? We&apos;d like to hear from you.
              </p>
              <p className="mt-3 leading-relaxed">
                Visit our{" "}
                <Link
                  href="/contact"
                  className="text-brand-blue underline hover:text-brand-blue-dark"
                >
                  contact page
                </Link>{" "}
                for general inquiries, corrections, and feedback.
              </p>
            </section>
          </div>
        </div>
      </main>
      <AdSenseScript />
      <Footer />
    </div>
  );
}
