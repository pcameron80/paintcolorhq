import Link from "next/link";
import { findClosestColor } from "@/lib/queries";
import { inspirationPalettes } from "@/lib/palettes";
import type { ColorWithBrand } from "@/lib/types";

interface ResolvedSwatch {
  paletteHex: string;
  match: ColorWithBrand | null;
}

interface ResolvedPalette {
  name: string;
  slug: string;
  swatches: ResolvedSwatch[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function resolvePalette(
  palette: (typeof inspirationPalettes)[number]
): Promise<ResolvedPalette> {
  const swatches = await Promise.all(
    palette.colors.map(async (hex) => ({
      paletteHex: hex,
      match: await findClosestColor(hex),
    }))
  );
  return { name: palette.name, slug: palette.slug, swatches };
}

export async function InspirationSection() {
  const picked = shuffle(inspirationPalettes).slice(0, 6);
  const resolved = await Promise.all(picked.map(resolvePalette));

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Color Inspiration
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Curated palettes to spark your next project — click any palette to explore.
          </p>
        </div>
        <Link
          href="/inspiration"
          className="text-sm font-medium text-brand-blue hover:text-brand-blue-dark"
        >
          View all
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((palette) => (
          <Link
            key={palette.slug}
            href={`/inspiration/${palette.slug}`}
            className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex gap-2">
              {palette.swatches.map((swatch, i) => (
                <div key={i} className="min-w-0 flex-1">
                  <div
                    className="aspect-square w-full rounded-lg border border-gray-200"
                    style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }}
                  />
                  {swatch.match && (
                    <p className="mt-1.5 truncate text-center text-[10px] text-gray-500">
                      {swatch.match.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              {palette.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
