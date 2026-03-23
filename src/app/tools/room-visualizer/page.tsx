import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RoomVisualizer } from "./visualizer";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";

export const metadata: Metadata = {
  title: "Room Color Visualizer - Preview Paint Colors in a Room",
  description:
    "See how paint colors look in a room before you buy. Pick colors for walls, ceiling, accent wall, trim, and floor. Works with all major paint brands.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/room-visualizer",
  },
};

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RoomVisualizerPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Build initial colors from URL params (e.g. ?walls=D6D0C4,E5DDD0&trim=FFFFFF&accent=5B7FA5)
  const paramMap: Record<string, string> = {
    walls: "walls",
    trim: "trim",
    accent: "accentWall",
    floor: "floor",
  };
  const hexRe = /^[0-9a-fA-F]{6}$/;
  const initialColors: Record<string, string> = {};
  const colorOptions: Record<string, string[]> = {};
  for (const [param, region] of Object.entries(paramMap)) {
    const val = sp[param];
    if (typeof val !== "string") continue;
    const parts = val.split(",").filter((h) => hexRe.test(h));
    if (parts.length > 0) {
      initialColors[region] = `#${parts[0]}`;
    }
    if (parts.length > 1) {
      colorOptions[region] = parts.map((h) => `#${h}`);
    }
  }
  // Parse pop colors separately (shown on walls + accent wall)
  const popRaw = sp.pop;
  const popColors =
    typeof popRaw === "string"
      ? popRaw.split(",").filter((h) => hexRe.test(h)).map((h) => `#${h}`)
      : [];

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "Room Color Visualizer",
        description: "Preview paint colors on walls, ceiling, trim, and more in a realistic room scene. Free tool from Paint Color HQ.",
        url: "https://www.paintcolorhq.com/tools/room-visualizer",
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "HowTo",
        name: "Preview Paint Colors in a Room",
        description: "See how paint colors look in a room before you buy. Pick colors for walls, accent wall, trim, and floor.",
        step: [
          { "@type": "HowToStep", name: "Select a region", text: "Click directly on the room image or use the buttons below it to select walls, trim, accent wall, or floor." },
          { "@type": "HowToStep", name: "Pick a color", text: "Use the color picker or type a hex code. The room updates instantly so you can see the result." },
          { "@type": "HowToStep", name: "Find paint matches", text: "Discover which real paint colors from Sherwin-Williams, Benjamin Moore, Behr, and other brands are closest to your selection." },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What is a room color visualizer?", acceptedAnswer: { "@type": "Answer", text: "A room color visualizer is a free online tool that lets you preview paint colors on walls, ceiling, trim, accent wall, and floor in a realistic room scene before you buy paint. Paint Color HQ's visualizer updates instantly as you pick colors and supports all major paint brands." } },
          { "@type": "Question", name: "Can I match visualizer colors to real paint?", acceptedAnswer: { "@type": "Answer", text: "Yes. After choosing a color in the visualizer, use the \"Find Paint Match\" feature to see which real-world paints from 14 major brands — including Sherwin-Williams, Benjamin Moore, Behr, Valspar, and PPG — are the closest match. Every suggestion links to its full color detail page." } },
          { "@type": "Question", name: "Is the room visualizer free?", acceptedAnswer: { "@type": "Answer", text: "Yes. The Paint Color HQ Room Visualizer is completely free with no sign-up required. You can preview unlimited color combinations on walls, trim, accent walls, and floors." } },
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "Room Visualizer", item: "https://www.paintcolorhq.com/tools/room-visualizer" },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-4">
            Room Color Visualizer
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Preview paint colors on walls, ceiling, trim, and more. Click a region
            or select it below, then pick a color to see it applied instantly.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16">
        <div className="max-w-7xl mx-auto">
          <RoomVisualizer
            initialColors={
              Object.keys(initialColors).length > 0 ? initialColors : undefined
            }
            colorOptions={
              Object.keys(colorOptions).length > 0 ? colorOptions : undefined
            }
            popColors={popColors.length > 0 ? popColors : undefined}
          />
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            How to Use
          </h2>
          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8">
              <ol className="list-inside list-decimal space-y-4">
                <li>
                  <strong className="text-on-surface">Select a region</strong> by clicking directly on the
                  room image or using the buttons below it.
                </li>
                <li>
                  <strong className="text-on-surface">Pick a color</strong> using the color picker or type a
                  hex code. The room updates instantly.
                </li>
                <li>
                  <strong className="text-on-surface">Find paint matches</strong> to discover which real paint
                  colors from Sherwin-Williams, Benjamin Moore, Behr, and other
                  brands are closest to your selection.
                </li>
              </ol>
            </div>
            <p className="text-xs text-outline">
              Screen colors differ from physical paint. Always verify with a
              swatch or sample before purchasing.
            </p>
          </div>
        </div>
      </section>

      {/* What the Visualizer Does */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            What the Room Visualizer Does
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              The Paint Color HQ Room Visualizer lets you preview paint colors on
              every surface in a room before you commit to a single can of paint.
              Click on any region — walls, ceiling, trim, accent wall, or floor —
              to select it, then choose a color from the picker or type in a
              specific hex code. The room updates instantly so you can experiment
              freely without any waiting.
            </p>
            <p>
              Once you find a color you love, use the &quot;Find Paint
              Match&quot; feature to see which real-world paints from 14 major
              brands — including Sherwin-Williams, Benjamin Moore, Behr, Valspar,
              PPG, Dunn-Edwards, and Farrow &amp; Ball — are the closest match.
              Every suggestion links to its full color detail page so you can
              explore undertones, coordinating colors, and cross-brand
              alternatives.
            </p>
          </div>
        </div>
      </section>

      {/* Why Preview */}
      <section className="py-20 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Why Preview Before You Paint
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              Paint always looks different on a full wall than it does on a tiny
              swatch card at the store. Lighting conditions, room dimensions, and
              the colors surrounding a surface all change how a shade is
              perceived. A warm beige can read pink under cool fluorescent light,
              and a soft gray can shift blue next to certain wood tones.
              Previewing colors in a room context helps you catch these surprises
              before they become expensive mistakes.
            </p>
            <p>
              Testing digitally also saves real money. Instead of buying three or
              four sample pots at $5 to $8 each, you can narrow your choices down
              to a single front-runner in minutes. This is especially valuable
              when you are planning a whole-room color scheme with coordinated
              walls, trim, and an accent wall — getting that balance right on
              screen first means fewer trips back to the paint counter.
            </p>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-10">
            Tips for Getting the Most Out of the Visualizer
          </h2>
          <div className="space-y-4 text-on-surface-variant leading-relaxed">
            <p>
              <strong className="text-on-surface">Start with the wall color.</strong> Walls cover the most
              surface area, so they set the overall tone for the room. Pick your
              wall shade first, then build the rest of the palette around it.
            </p>
            <p>
              <strong className="text-on-surface">Use contrasting trim.</strong> White or off-white trim
              against colored walls is a timeless combination that makes
              architectural details pop. Try it in the visualizer to see how much
              definition trim color adds.
            </p>
            <p>
              <strong className="text-on-surface">Experiment with the accent wall.</strong> A single bold wall
              can anchor a space without overwhelming it. The accent wall region
              lets you test dramatic colors in a contained way before committing
              to an entire room.
            </p>
            <p>
              <strong className="text-on-surface">Convert custom colors to real paint.</strong> Any color you
              pick — even a custom hex — can be matched to a real product from
              major brands using the &quot;Find Paint Match&quot; button. This
              bridges the gap between inspiration and a trip to the store.
            </p>
            <p>
              <strong className="text-on-surface">Use our other tools alongside the visualizer.</strong> Once
              you have colors you like, open the{" "}
              <Link href="/compare" className="text-primary underline hover:text-primary/80">
                Color Comparison tool
              </Link>{" "}
              to see them side by side, or try the{" "}
              <Link href="/tools/palette-generator" className="text-primary underline hover:text-primary/80">
                Palette Generator
              </Link>{" "}
              to build a fully coordinated scheme. If you are unsure whether a
              color runs warm or cool, our guide on{" "}
              <Link href="/blog/understanding-paint-color-undertones" className="text-primary underline hover:text-primary/80">
                understanding paint color undertones
              </Link>{" "}
              breaks down what to look for.
            </p>
          </div>

          <div className="mt-12">
            <ToolCrossSell exclude="room-visualizer" />
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
