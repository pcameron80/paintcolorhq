import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { getColorById } from "@/lib/queries";
import { CompareClient } from "./compare-client";

interface PageProps { searchParams: Promise<{ color1?: string; color2?: string }>; }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { color1, color2 } = await searchParams;
  const hasParams = !!color1 || !!color2;
  return {
    title: "Compare Paint Colors Side by Side",
    description: "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
    alternates: { canonical: "https://www.paintcolorhq.com/compare" },
    ...(hasParams && { robots: { index: false, follow: true } }),
    openGraph: { title: "Compare Paint Colors Side by Side", description: "Compare any two paint colors side by side.", url: "https://www.paintcolorhq.com/compare" },
  };
}

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

      <AdSenseScript />
      <Footer />
    </div>
  );
}
