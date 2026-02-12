import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RoomVisualizer } from "./visualizer";

export const metadata: Metadata = {
  title: "Room Color Visualizer - Preview Paint Colors in a Room",
  description:
    "See how paint colors look in a room before you buy. Pick colors for walls, ceiling, accent wall, trim, and floor. Works with all major paint brands.",
  alternates: {
    canonical: "https://paintcolorhq.com/tools/room-visualizer",
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
      </main>

      <Footer />
    </div>
  );
}
