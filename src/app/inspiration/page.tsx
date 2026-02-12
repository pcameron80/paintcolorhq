import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { inspirationPalettes } from "@/lib/palettes";
import { findClosestColor } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Color Inspiration | Paint Color HQ",
  description:
    "Browse 18 curated color palettes for every style — modern farmhouse, coastal retreat, moody library, and more. Each palette maps to real paint colors.",
  alternates: { canonical: "https://www.paintcolorhq.com/inspiration" },
  openGraph: {
    title: "Color Inspiration | Paint Color HQ",
    description:
      "Browse curated color palettes for every style — modern farmhouse, coastal retreat, moody library, and more.",
    url: "https://www.paintcolorhq.com/inspiration",
  },
};

interface ResolvedSwatch {
  paletteHex: string;
  match: ColorWithBrand | null;
}

interface ResolvedPalette {
  name: string;
  slug: string;
  description: string;
  swatches: ResolvedSwatch[];
}

async function resolveAll(): Promise<ResolvedPalette[]> {
  // Collect all unique hex values
  const allHexes = new Set<string>();
  for (const p of inspirationPalettes) {
    for (const hex of p.colors) allHexes.add(hex);
  }

  // Resolve all at once
  const hexList = [...allHexes];
  const results = await Promise.all(hexList.map((hex) => findClosestColor(hex)));
  const resolved = new Map<string, ColorWithBrand | null>();
  hexList.forEach((hex, i) => resolved.set(hex, results[i]));

  return inspirationPalettes.map((p) => ({
    name: p.name,
    slug: p.slug,
    description: p.description,
    swatches: p.colors.map((hex) => ({
      paletteHex: hex,
      match: resolved.get(hex) ?? null,
    })),
  }));
}

export default async function InspirationPage() {
  const palettes = await resolveAll();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Inspiration</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">Color Inspiration</h1>
        <p className="mt-2 text-gray-600">
          Curated palettes to spark your next project — click any palette to explore and customize by brand.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {palettes.map((palette) => (
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
                      style={{
                        backgroundColor:
                          swatch.match?.hex ?? swatch.paletteHex,
                      }}
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
              <p className="mt-1 text-xs text-gray-500">
                {palette.description}
              </p>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
