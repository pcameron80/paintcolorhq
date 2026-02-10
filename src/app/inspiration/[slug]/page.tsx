import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrandPicker } from "@/components/brand-picker";
import { AddPaletteToProject } from "@/components/add-palette-to-project";
import { getPaletteBySlug, assignPaletteRoles } from "@/lib/palettes";
import { getAllBrands, findClosestColor, getBrandBySlug } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ brand?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const palette = getPaletteBySlug(slug);
  if (!palette) return { title: "Palette Not Found" };

  const url = `https://paintcolorhq.com/inspiration/${slug}`;
  return {
    title: `${palette.name} Color Palette | Paint Color HQ`,
    description: palette.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${palette.name} Color Palette`,
      description: palette.description,
      url,
    },
  };
}

function textColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#111827" : "#ffffff";
}

export default async function InspirationDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { brand: brandSlug } = await searchParams;
  const palette = getPaletteBySlug(slug);
  if (!palette) notFound();

  const brands = await getAllBrands();

  // Determine brand filter
  let brandId: string | undefined;
  if (brandSlug) {
    const brand = await getBrandBySlug(brandSlug);
    if (brand) brandId = brand.id;
  }

  // Resolve all 5 colors — either filtered to brand or best match
  let resolved: (ColorWithBrand | null)[];
  if (brandId) {
    resolved = await Promise.all(
      palette.colors.map((hex) => findClosestColor(hex, brandId))
    );
  } else {
    // Best match: resolve across all brands
    resolved = await Promise.all(
      palette.colors.map((hex) => findClosestColor(hex))
    );
  }

  // Build display data — assign roles ensuring all 4 are represented
  const roles = assignPaletteRoles(palette.colors);
  const swatches = palette.colors.map((hex, i) => ({
    paletteHex: hex,
    match: resolved[i],
    role: roles[i],
  }));

  // Determine which brand was auto-selected (most frequent brand in results)
  let effectiveBrandSlug = brandSlug ?? null;
  if (!brandSlug) {
    const brandCounts = new Map<string, number>();
    for (const s of swatches) {
      if (s.match) {
        const bs = s.match.brand.slug;
        brandCounts.set(bs, (brandCounts.get(bs) ?? 0) + 1);
      }
    }
    let maxCount = 0;
    for (const [bs, count] of brandCounts) {
      if (count > maxCount) {
        maxCount = count;
        effectiveBrandSlug = bs;
      }
    }
  }

  const currentPath = brandSlug
    ? `/inspiration/${slug}?brand=${brandSlug}`
    : `/inspiration/${slug}`;

  // Build colors for AddPaletteToProject
  const projectColors = swatches
    .filter((s) => s.match)
    .map((s) => ({
      colorId: s.match!.id,
      role: s.role.toLowerCase(),
    }));

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/inspiration" className="hover:text-gray-900">
            Inspiration
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{palette.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{palette.name}</h1>
            <p className="mt-2 text-gray-600">{palette.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <BrandPicker
              brands={brands.map((b) => ({ slug: b.slug, name: b.name }))}
              currentBrand={brandSlug ?? null}
              slug={slug}
            />
            {projectColors.length > 0 && (
              <AddPaletteToProject
                colors={projectColors}
                currentPath={currentPath}
              />
            )}
          </div>
        </div>

        {effectiveBrandSlug && !brandSlug && (
          <p className="mt-3 text-sm text-gray-500">
            Showing best-match colors. Most results are from{" "}
            <span className="font-medium text-gray-700">
              {brands.find((b) => b.slug === effectiveBrandSlug)?.name ?? effectiveBrandSlug}
            </span>
            .
          </p>
        )}

        {/* Color swatches */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {swatches.map((swatch, i) => {
            const displayHex = swatch.match?.hex ?? swatch.paletteHex;
            const href = swatch.match
              ? `/colors/${swatch.match.brand.slug}/${swatch.match.slug}`
              : `/search?q=${encodeURIComponent(swatch.paletteHex)}`;

            return (
              <Link
                key={i}
                href={href}
                className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-lg"
              >
                <div
                  className="flex aspect-[3/4] items-end p-3"
                  style={{ backgroundColor: displayHex }}
                >
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase opacity-80"
                    style={{
                      color: textColor(displayHex),
                      backgroundColor:
                        textColor(displayHex) === "#ffffff"
                          ? "rgba(0,0,0,0.2)"
                          : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {swatch.role}
                  </span>
                </div>
                <div className="p-3">
                  {swatch.match ? (
                    <>
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {swatch.match.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {swatch.match.brand.name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">
                        {swatch.match.hex.toUpperCase()}
                      </p>
                    </>
                  ) : (
                    <p className="font-mono text-sm text-gray-400">
                      {swatch.paletteHex.toUpperCase()}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
