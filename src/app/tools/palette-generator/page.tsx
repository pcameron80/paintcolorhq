import { Suspense } from "react";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaletteGenerator } from "./generator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";

interface PageProps { searchParams: Promise<Record<string, string | string[] | undefined>>; }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const hasParams = Object.keys(sp).length > 0;
  return {
    title: "Paint Color Palette Generator - Build a Coordinated Color Scheme",
    description:
      "Pick a starting color and instantly generate coordinated paint palettes with Walls, Trim, Accent, and Pop roles. Matched to real colors from 14 brands.",
    alternates: {
      canonical: "https://www.paintcolorhq.com/tools/palette-generator",
    },
    ...(hasParams && { robots: { index: false, follow: true } }),
  };
}

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function PaletteGeneratorPage() {
  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "HowTo",
        name: "How to Generate a Paint Color Palette",
        description: "Pick a starting color and generate coordinated paint palettes with walls, trim, accent, and pop roles.",
        step: [
          { "@type": "HowToStep", name: "Pick a color", text: "Use the color picker or type a hex code to choose your starting color. Optionally select a brand to filter results." },
          { "@type": "HowToStep", name: "Choose a scheme", text: "Five coordinated palettes appear instantly, each with Walls, Trim, Accent, and Pop roles matched to real paint colors." },
          { "@type": "HowToStep", name: "Save or visualize", text: "Open any palette in the Room Visualizer to preview on walls, or save it to a project for later reference." },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Paint Palette Generator",
        description: "Build coordinated paint palettes from any starting color. Generates complementary, analogous, and triadic schemes matched to real paint colors.",
        url: "https://www.paintcolorhq.com/tools/palette-generator",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What color harmony types does the palette generator use?", acceptedAnswer: { "@type": "Answer", text: "The palette generator creates five schemes based on proven color harmony principles: complementary (opposite colors on the wheel), analogous (adjacent colors), triadic (three evenly spaced colors), split-complementary (base color plus two colors adjacent to its complement), and monochromatic (shades of a single hue)." } },
          { "@type": "Question", name: "Are the palette colors matched to real paint?", acceptedAnswer: { "@type": "Answer", text: "Yes. Every color in every palette is matched to a real paint color you can buy from our database of over 25,000 colors across 14 major brands including Sherwin-Williams, Benjamin Moore, Behr, Valspar, and PPG. You can also filter results to a single brand." } },
          { "@type": "Question", name: "What are the palette roles?", acceptedAnswer: { "@type": "Answer", text: "Each palette assigns colors to four room roles: Walls (the main color covering the most area), Trim (baseboards, crown molding, door frames), Accent (a feature wall or large furniture piece), and Pop (used sparingly on throw pillows, art, or statement pieces for energy)." } },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Palette Generator", item: "https://www.paintcolorhq.com/tools/palette-generator" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Paint Color Palette Generator
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Pick a color and generate coordinated paint palettes matched to real
            colors.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <Suspense>
            <PaletteGenerator />
          </Suspense>
        </div>
      </section>

      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="mt-12">
            <ToolCrossSell exclude="palette-generator" />
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
