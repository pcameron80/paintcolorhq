import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getColorById } from "@/lib/queries";
import { CompareClient } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Paint Colors Side by Side",
  description: "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
  alternates: { canonical: "https://www.paintcolorhq.com/compare" },
  openGraph: { title: "Compare Paint Colors Side by Side", description: "Compare any two paint colors side by side.", url: "https://www.paintcolorhq.com/compare" },
};

interface PageProps { searchParams: Promise<{ color1?: string; color2?: string }>; }

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;
  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Color Comparison Tool",
        description: "Compare any two paint colors side by side with hex codes, RGB values, LRV, and Delta E similarity scores.",
        url: "https://www.paintcolorhq.com/compare",
        applicationCategory: "DesignApplication", operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "PaintColorHQ", url: "https://www.paintcolorhq.com" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Compare Paint Colors", item: "https://www.paintcolorhq.com/compare" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Compare Colors
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Search for two paint colors to compare them side by side with Delta E similarity scores.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <CompareClient initialColor1={color1} initialColor2={color2} />
        </div>
      </section>

      {/* Educational content */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How to Compare Paint Colors
          </h2>
          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <p>
              Choosing the right paint color often comes down to subtle differences. Two colors that look identical on a screen can appear noticeably different on a wall. Our comparison tool helps you evaluate colors before buying samples by showing Delta E color-difference scores, hex and RGB values, and Light Reflectance Values (LRV) side by side.
            </p>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4">What Is Delta E?</h3>
              <p>
                Delta E (CIE2000) is the industry-standard metric for measuring how different two colors appear to the human eye. Below 1 means virtually identical. Between 1 and 2, only a trained eye would notice. From 2 to 5, differences become apparent. Above 5, most people see a clear difference.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4">Understanding LRV</h3>
              <p>
                LRV measures the percentage of visible light a paint color reflects, from 0 (absolute black) to 100 (pure white). Colors above 50 are generally light, below 50 are dark. LRV affects how bright or moody a room feels.
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <h3 className="font-headline text-xl font-bold text-on-surface mb-4">When to Use This Tool</h3>
              <ul className="list-none space-y-4 mt-4">
                <li className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-on-surface">Cross-brand matching:</strong> Compare a Sherwin-Williams color with its Benjamin Moore equivalent to see how close the match really is.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-on-surface">Coordinating colors:</strong> Place wall and trim colors side by side to judge contrast and harmony.</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <span><strong className="text-on-surface">Touch-up decisions:</strong> Compare an existing wall color with a potential match to see if it will blend.</span>
                </li>
              </ul>
            </div>

            <p className="text-xs text-outline">
              Always confirm with physical paint samples. Screens cannot perfectly reproduce paint finishes or how colors interact with lighting in your space.
            </p>
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
