import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RoomVisualizer } from "./visualizer";
import { AdSenseScript } from "@/components/adsense-script";

export const metadata: Metadata = {
  title: "Room Color Visualizer - Preview Paint Colors in a Room",
  description:
    "See how paint colors look in a room before you buy. Pick colors for walls, ceiling, accent wall, trim, and floor. Works with all major paint brands.",
  alternates: {
    canonical: "https://www.paintcolorhq.com/tools/room-visualizer",
  },
};

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
          <span className="text-gray-900">Room Visualizer</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">
          Room Color Visualizer
        </h1>
        <p className="mt-2 text-gray-600">
          Preview paint colors on walls, ceiling, trim, and more. Click a region
          or select it below, then pick a color to see it applied instantly.
        </p>

        <RoomVisualizer
          initialColors={
            Object.keys(initialColors).length > 0 ? initialColors : undefined
          }
          colorOptions={
            Object.keys(colorOptions).length > 0 ? colorOptions : undefined
          }
          popColors={popColors.length > 0 ? popColors : undefined}
        />

        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">How to Use</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
            <p>
              <strong>1. Select a region</strong> by clicking directly on the
              room image or using the buttons below it.
            </p>
            <p>
              <strong>2. Pick a color</strong> using the color picker or type a
              hex code. The room updates instantly.
            </p>
            <p>
              <strong>3. Find paint matches</strong> to discover which real paint
              colors from Sherwin-Williams, Benjamin Moore, Behr, and other
              brands are closest to your selection.
            </p>
            <p>
              Screen colors differ from physical paint. Always verify with a
              swatch or sample before purchasing.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            What the Room Visualizer Does
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
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
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Why Preview Before You Paint
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
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
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900">
            Tips for Getting the Most Out of the Visualizer
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              <strong>Start with the wall color.</strong> Walls cover the most
              surface area, so they set the overall tone for the room. Pick your
              wall shade first, then build the rest of the palette around it.
            </p>
            <p>
              <strong>Use contrasting trim.</strong> White or off-white trim
              against colored walls is a timeless combination that makes
              architectural details pop. Try it in the visualizer to see how much
              definition trim color adds.
            </p>
            <p>
              <strong>Experiment with the accent wall.</strong> A single bold wall
              can anchor a space without overwhelming it. The accent wall region
              lets you test dramatic colors in a contained way before committing
              to an entire room.
            </p>
            <p>
              <strong>Convert custom colors to real paint.</strong> Any color you
              pick — even a custom hex — can be matched to a real product from
              major brands using the &quot;Find Paint Match&quot; button. This
              bridges the gap between inspiration and a trip to the store.
            </p>
            <p>
              <strong>Use our other tools alongside the visualizer.</strong> Once
              you have colors you like, open the{" "}
              <Link
                href="/compare"
                className="text-blue-700 underline hover:text-blue-900"
              >
                Color Comparison tool
              </Link>{" "}
              to see them side by side, or try the{" "}
              <Link
                href="/tools/palette-generator"
                className="text-blue-700 underline hover:text-blue-900"
              >
                Palette Generator
              </Link>{" "}
              to build a fully coordinated scheme. If you are unsure whether a
              color runs warm or cool, our guide on{" "}
              <Link
                href="/blog/understanding-paint-color-undertones"
                className="text-blue-700 underline hover:text-blue-900"
              >
                understanding paint color undertones
              </Link>{" "}
              breaks down what to look for.
            </p>
          </div>
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Room Color Visualizer",
            description:
              "Preview paint colors on walls, ceiling, trim, and more in a realistic room scene. Free tool from Paint Color HQ.",
            url: "https://www.paintcolorhq.com/tools/room-visualizer",
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Preview Paint Colors in a Room",
            description:
              "See how paint colors look in a room before you buy. Pick colors for walls, accent wall, trim, and floor.",
            step: [
              {
                "@type": "HowToStep",
                name: "Select a region",
                text: "Click directly on the room image or use the buttons below it to select walls, trim, accent wall, or floor.",
              },
              {
                "@type": "HowToStep",
                name: "Pick a color",
                text: "Use the color picker or type a hex code. The room updates instantly so you can see the result.",
              },
              {
                "@type": "HowToStep",
                name: "Find paint matches",
                text: "Discover which real paint colors from Sherwin-Williams, Benjamin Moore, Behr, and other brands are closest to your selection.",
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
            "@type": "SoftwareApplication",
            name: "Room Color Visualizer",
            applicationCategory: "DesignApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description:
              "See how paint colors look in a room before you buy. Pick colors for walls, ceiling, accent wall, trim, and floor. Works with all major paint brands.",
            url: "https://www.paintcolorhq.com/tools/room-visualizer",
          }),
        }}
      />

      <AdSenseScript />
      <Footer />
    </div>
  );
}
