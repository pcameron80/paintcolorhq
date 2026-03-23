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
    <>
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-on-surface-variant">
          Curated palettes to spark your next project — click any palette to explore.
        </p>
        <Link
          href="/inspiration"
          className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
        >
          View all <span>&rarr;</span>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resolved.map((palette) => (
          <Link
            key={palette.slug}
            href={`/inspiration/${palette.slug}`}
            className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500 group"
          >
            <div className={`grid h-48 rounded-lg overflow-hidden mb-6`} style={{ gridTemplateColumns: `repeat(${palette.swatches.length}, 1fr)` }}>
              {palette.swatches.map((swatch, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }}
                />
              ))}
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-1 group-hover:text-primary transition-colors">
              {palette.name}
            </h3>
            <p className="text-xs text-outline tracking-wider uppercase">
              {palette.swatches.length} Swatches
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
