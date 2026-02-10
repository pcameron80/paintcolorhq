import Link from "next/link";
import { findClosestColor } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";

interface Palette {
  name: string;
  colors: string[];
}

const palettes: Palette[] = [
  { name: "Modern Farmhouse", colors: ["#d6d0c4", "#f0ece2", "#4a4a48", "#7a8c6e", "#b8a99a"] },
  { name: "Coastal Retreat", colors: ["#d5e1df", "#f5f0e8", "#2b4c6f", "#c4a87c", "#87b5b0"] },
  { name: "Moody Library", colors: ["#2f4538", "#f2ead3", "#6b2737", "#b8963e", "#4a3728"] },
  { name: "Scandinavian Minimal", colors: ["#f4f1ec", "#ffffff", "#b0b8b4", "#d4c1a8", "#e8e3db"] },
  { name: "Bold & Eclectic", colors: ["#e8c547", "#f7f3ea", "#2d5a7b", "#c1533c", "#6b4e8a"] },
  { name: "Earthy Organic", colors: ["#c4a882", "#efe8dd", "#6b4e37", "#8a9a5b", "#d4b896"] },
  { name: "Soft Romantic", colors: ["#e8d5d0", "#faf6f3", "#9b7e8a", "#c4956a", "#d4a5b0"] },
  { name: "Urban Industrial", colors: ["#6d6e70", "#e8e4de", "#3c3c3c", "#b87333", "#a09e9a"] },
  { name: "Mediterranean Sun", colors: ["#f5e6d3", "#fefcf7", "#c75c2a", "#2e6b8a", "#e4b87c"] },
  { name: "Classic Traditional", colors: ["#2b3a52", "#f2ece0", "#8b2232", "#c5a55a", "#5c6e82"] },
  { name: "Desert Sunset", colors: ["#e0c4a8", "#f7ede0", "#c75b3f", "#8b6b4a", "#d4956e"] },
  { name: "Woodland Cabin", colors: ["#5c6b4e", "#e8dfd0", "#8b6b4a", "#3c4a32", "#c4b090"] },
  { name: "Ocean Breeze", colors: ["#6a9fb5", "#f0f4f3", "#2c5f7c", "#d4c5a9", "#8cbcc8"] },
  { name: "Midnight Luxe", colors: ["#1e2a3a", "#e8e0d0", "#7a5c3e", "#c5a55a", "#3a4a5c"] },
  { name: "Spring Garden", colors: ["#a8c5a0", "#f5f2eb", "#e8a87c", "#5c8a5e", "#d4d0b8"] },
  { name: "French Country", colors: ["#d5c8b8", "#f8f4ef", "#7a8c9a", "#b8a070", "#9c8070"] },
  { name: "Tropical Escape", colors: ["#2e8b6e", "#f5efe5", "#e8a030", "#1a6b5a", "#c4d4b8"] },
  { name: "Vintage Charm", colors: ["#c8b8a0", "#f2ece2", "#8b6b6b", "#a09060", "#d8c8b8"] },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface ResolvedSwatch {
  paletteHex: string;
  match: ColorWithBrand | null;
}

interface ResolvedPalette {
  name: string;
  swatches: ResolvedSwatch[];
}

async function resolvePalette(palette: Palette): Promise<ResolvedPalette> {
  const swatches = await Promise.all(
    palette.colors.map(async (hex) => ({
      paletteHex: hex,
      match: await findClosestColor(hex),
    }))
  );
  return { name: palette.name, swatches };
}

export async function InspirationSection() {
  const picked = shuffle(palettes).slice(0, 6);
  const resolved = await Promise.all(picked.map(resolvePalette));

  return (
    <section className="mt-16">
      <h2 className="text-lg font-semibold text-gray-900">
        Color Inspiration
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Curated palettes to spark your next project — click any color to explore.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((palette) => (
          <div
            key={palette.name}
            className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex gap-1.5">
              {palette.swatches.map((swatch, i) => {
                const href = swatch.match
                  ? `/colors/${swatch.match.brand.slug}/${swatch.match.slug}`
                  : `/search?q=${encodeURIComponent(swatch.paletteHex)}`;
                return (
                  <Link
                    key={i}
                    href={href}
                    className="block flex-1 overflow-hidden rounded-lg first:rounded-l-xl last:rounded-r-xl"
                  >
                    <div
                      className="aspect-[3/4] w-full transition-opacity hover:opacity-80"
                      style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }}
                    />
                  </Link>
                );
              })}
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {palette.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
