import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PaletteGenerator } from "./generator";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";

export const metadata: Metadata = {
  title: "Paint Color Palette Generator - Build a Coordinated Color Scheme",
  description:
    "Pick a starting color and instantly generate coordinated paint palettes with Walls, Trim, Accent, and Pop roles. Matched to real colors from 14 brands.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/palette-generator",
  },
};

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

      {/* How It Works */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How It Works
          </h2>
          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <ol className="list-inside list-decimal space-y-4">
                <li>
                  <strong className="text-on-surface">Pick a starting color</strong> — use the color picker or
                  type a hex code. Optionally filter results to a single brand.
                </li>
                <li>
                  <strong className="text-on-surface">Choose a scheme</strong> — five coordinated palettes
                  appear instantly, each with Walls, Trim, Accent, and Pop roles
                  matched to real paint colors.
                </li>
                <li>
                  <strong className="text-on-surface">Save or visualize</strong> — open any palette in the
                  Room Visualizer to preview it on walls, or save it to a project
                  for later.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* How the Generator Works */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How the Palette Generator Works
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              The Palette Generator builds coordinated color schemes from any
              starting color you choose. Pick a color using the color picker or
              type in a hex code, and the tool instantly generates five distinct
              palettes based on proven color harmony principles —
              complementary, analogous, triadic, split-complementary, and
              monochromatic. Each palette assigns colors to specific room roles:
              Walls, Trim, Accent, and Pop.
            </p>
            <p>
              What makes this tool different from generic color wheel generators
              is that every color in every palette is matched to a real paint
              color you can actually buy. Instead of showing you a theoretical
              teal that does not exist on any brand&apos;s fan deck, the
              generator finds the closest available paint from our database of
              over 25,000 colors across 14 major brands including
              Sherwin-Williams, Benjamin Moore, Behr, Valspar, and PPG. You can
              also filter results to a single brand if you prefer to stay within
              one product line.
            </p>
          </div>
        </div>
      </section>

      {/* Color Harmony Types */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Color Harmony Types Explained
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              <strong className="text-on-surface">Complementary</strong> pairs colors from opposite sides of
              the color wheel — like blue and orange or green and red. This
              creates high contrast and visual energy. Use complementary schemes
              when you want a bold accent wall that stands out against the main
              wall color.
            </p>
            <p>
              <strong className="text-on-surface">Analogous</strong> groups colors that sit next to each
              other on the wheel — like blue, blue-green, and green. These
              schemes feel harmonious and calm, making them ideal for bedrooms
              and living rooms where you want a cohesive, relaxed atmosphere.
            </p>
            <p>
              <strong className="text-on-surface">Triadic</strong> uses three colors evenly spaced around
              the wheel. This provides a balanced but vibrant palette with more
              variety than analogous schemes. Triadic palettes work well in
              playrooms, creative spaces, or anywhere you want personality
              without chaos.
            </p>
            <p>
              <strong className="text-on-surface">Split-complementary</strong> takes a base color and pairs
              it with the two colors adjacent to its complement. You get the
              contrast of a complementary scheme but with more nuance and less
              tension — a good choice when you want visual interest without the
              boldness of direct opposites.
            </p>
            <p>
              <strong className="text-on-surface">Monochromatic</strong> uses different shades, tints, and
              tones of a single hue. This is the safest approach for creating a
              sophisticated, layered look. Monochromatic palettes are especially
              effective in small spaces where too many colors can feel cluttered.
            </p>
          </div>
        </div>
      </section>

      {/* Building a Room Palette */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Building a Room Palette
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              A well-designed room palette follows the Walls + Trim + Accent +
              Pop structure that the generator builds for you. The wall color
              covers the most surface area and sets the overall mood — keep it
              relatively neutral or soft. Trim color (baseboards, crown
              molding, door frames) should contrast enough to define
              architectural details, which is why white or off-white trim
              remains the most popular choice. The accent color goes on a
              feature wall, large furniture piece, or built-in shelving to add
              depth. The pop color is used sparingly — on throw pillows, art, or
              a single statement piece — to inject energy and personality.
            </p>
            <p>
              Once you have generated a palette you like, click &quot;Open in
              Room Visualizer&quot; to see all four colors applied to a room
              scene at once. This is the fastest way to evaluate whether the
              balance feels right before you visit the paint store. You can also
              use the{" "}
              <Link href="/compare" className="text-primary underline hover:text-primary/80">
                Color Comparison tool
              </Link>{" "}
              to examine individual colors from the palette side by side.
            </p>
            <p>
              For a deeper understanding of how these harmony principles apply
              to real rooms, read our guide on{" "}
              <Link href="/blog/color-theory-for-home-decorators" className="text-primary underline hover:text-primary/80">
                color theory for home decorators
              </Link>
              . And when you are ready to see your palette in action, the{" "}
              <Link href="/tools/room-visualizer" className="text-primary underline hover:text-primary/80">
                Room Visualizer
              </Link>{" "}
              lets you preview every color on walls, trim, accent wall, and
              floor in a single view.
            </p>
          </div>

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
