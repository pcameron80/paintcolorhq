import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getColorById } from "@/lib/queries";
import { CompareClient } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Paint Colors Side by Side",
  description:
    "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
  alternates: { canonical: "https://www.paintcolorhq.com/compare" },
  openGraph: {
    title: "Compare Paint Colors Side by Side",
    description:
      "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
    url: "https://www.paintcolorhq.com/compare",
  },
};

interface PageProps {
  searchParams: Promise<{ color1?: string; color2?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;

  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Paint Color Comparison Tool",
    description:
      "Compare any two paint colors side by side with hex codes, RGB values, LRV, and Delta E similarity scores.",
    url: "https://www.paintcolorhq.com/compare",
    applicationCategory: "DesignApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: {
      "@type": "Organization",
      name: "PaintColorHQ",
      url: "https://www.paintcolorhq.com",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.paintcolorhq.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compare Paint Colors",
        item: "https://www.paintcolorhq.com/compare",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Compare Paint Colors
        </h1>
        <p className="mt-2 text-gray-600">
          Search for two paint colors to compare them side by side.
        </p>

        <CompareClient initialColor1={color1} initialColor2={color2} />

        {/* Educational content for SEO */}
        <section className="mt-16 border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            How to Compare Paint Colors
          </h2>
          <div className="mt-6 space-y-6 text-gray-700 leading-relaxed">
            <p>
              Choosing the right paint color often comes down to subtle
              differences. Two colors that look identical on a screen can appear
              noticeably different once they are on a wall, depending on the
              room&apos;s lighting, surrounding furnishings, and the paint
              finish. Our comparison tool helps you evaluate colors before buying
              samples by showing Delta E color-difference scores, hex and RGB
              values, and Light Reflectance Values (LRV) side by side.
            </p>

            <h3 className="text-lg font-semibold text-gray-900">
              What Is Delta E?
            </h3>
            <p>
              Delta E (CIE2000) is the industry-standard metric for measuring
              how different two colors appear to the human eye. A Delta E below
              1 means the colors are virtually identical. Between 1 and 2, only
              a trained eye would notice a difference side by side. From 2 to 5,
              differences become apparent in certain lighting. Above 5, most
              people will see a clear difference, and above 10 the colors are
              plainly different.
            </p>

            <h3 className="text-lg font-semibold text-gray-900">
              Understanding Light Reflectance Value (LRV)
            </h3>
            <p>
              LRV measures the percentage of visible light a paint color
              reflects. It ranges from 0 (absolute black, absorbs all light) to
              100 (pure white, reflects all light). Colors with an LRV above 50
              are generally considered light, while those below 50 are
              considered dark. LRV matters because it affects how bright or
              moody a room feels and how much artificial lighting you will need.
            </p>

            <h3 className="text-lg font-semibold text-gray-900">
              When to Use This Tool
            </h3>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Cross-brand matching:</strong> Found a Sherwin-Williams
                color you love but want to buy from Benjamin Moore? Compare
                them here to see exactly how close the match is.
              </li>
              <li>
                <strong>Coordinating colors:</strong> Placing two potential wall
                and trim colors side by side lets you judge contrast and
                harmony before buying samples.
              </li>
              <li>
                <strong>Verifying digital vs. physical:</strong> If you found a
                color online, compare its hex value against the manufacturer&apos;s
                listed color to check for discrepancies.
              </li>
              <li>
                <strong>Touch-up decisions:</strong> Compare the color you
                already have on the wall with a potential match to see if a
                touch-up will blend in or look patchy.
              </li>
            </ul>

            <p className="text-sm text-gray-500">
              Always confirm your final choice with physical paint samples.
              Screens cannot perfectly reproduce paint finishes, sheen levels,
              or how colors interact with natural and artificial lighting in
              your specific space.
            </p>
          </div>
        </section>
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
