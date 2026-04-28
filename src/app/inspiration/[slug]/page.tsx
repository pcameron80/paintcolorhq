import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrandPicker } from "@/components/brand-picker";
import { AddPaletteToProject } from "@/components/add-palette-to-project";
import { PinterestSaveButton } from "@/components/pinterest-save-button";
import { getPaletteBySlug, assignPaletteRoles, inspirationPalettes } from "@/lib/palettes";
import { getAllBrands, findClosestColor, getBrandBySlug } from "@/lib/queries";
import type { ColorWithBrand } from "@/lib/types";
import { AdSenseScript } from "@/components/adsense-script";

export const revalidate = 3600;

export function generateStaticParams() {
  return inspirationPalettes.map((p) => ({ slug: p.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ brand?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const palette = getPaletteBySlug(slug);
  if (!palette) return { title: "Palette Not Found" };
  const url = `https://www.paintcolorhq.com/inspiration/${slug}`;
  return {
    title: `${palette.name} Color Palette`,
    description: palette.description,
    alternates: { canonical: url },
    openGraph: { title: `${palette.name} Color Palette`, description: palette.description, url },
  };
}

function textColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#161935" : "#ffffff";
}

// JSON-LD helper — content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function InspirationDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { brand: brandSlug } = await searchParams;
  const palette = getPaletteBySlug(slug);
  if (!palette) notFound();

  const brands = await getAllBrands();
  let brandId: string | undefined;
  if (brandSlug) {
    const brand = await getBrandBySlug(brandSlug);
    if (brand) brandId = brand.id;
  }

  const resolved = brandId
    ? await Promise.all(palette.colors.map((hex) => findClosestColor(hex, brandId)))
    : await Promise.all(palette.colors.map((hex) => findClosestColor(hex)));

  const roles = assignPaletteRoles(palette.colors);
  const swatches = palette.colors.map((hex, i) => ({ paletteHex: hex, match: resolved[i], role: roles[i] }));

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
      if (count > maxCount) { maxCount = count; effectiveBrandSlug = bs; }
    }
  }

  const currentPath = brandSlug ? `/inspiration/${slug}?brand=${brandSlug}` : `/inspiration/${slug}`;
  const projectColors = swatches.filter((s) => s.match).map((s) => ({ colorId: s.match!.id, role: s.role.toLowerCase() }));

  // Pinterest pin metadata. Use the matched colors when available (so the
  // pin shows real paint hexes), falling back to palette source hexes.
  const pinSwatchPairs = swatches
    .map((s) => `${(s.match?.hex ?? s.paletteHex).toLowerCase()}:${s.role}`)
    .join(",");
  const pinPaletteParams = new URLSearchParams({
    name: palette.name,
    description: palette.description,
    colors: pinSwatchPairs,
  });
  const palettePinImageUrl = `https://www.paintcolorhq.com/api/pin/palette?${pinPaletteParams.toString()}`;
  const palettePinDescription = `${palette.name} — ${palette.description} 5-color paint palette with cross-brand matches at PaintColorHQ.com #paintpalette #colorpalette #${palette.slug.replace(/-/g, "")}`;

  const vizUrl = (() => {
    const roleToParam: Record<string, string> = { walls: "walls", trim: "trim", accent: "accent" };
    const collected: Record<string, string[]> = {};
    const popHexes: string[] = [];
    for (const s of swatches) {
      if (!s.match) continue;
      const hex = s.match.hex.replace("#", "");
      const role = s.role.toLowerCase();
      if (role === "pop") { popHexes.push(hex); continue; }
      const param = roleToParam[role];
      if (param) { if (!collected[param]) collected[param] = []; collected[param].push(hex); }
    }
    if (Object.keys(collected).length === 0) return null;
    const p = new URLSearchParams();
    for (const [param, hexes] of Object.entries(collected)) p.set(param, hexes.join(","));
    if (popHexes.length > 0) p.set("pop", popHexes.join(","));
    return `/tools/room-visualizer?${p.toString()}`;
  })();

  return (
    <div className="min-h-screen bg-surface">
      {/* Pinterest pin trigger — hidden, picked up by the Save extension */}
      <img
        src={palettePinImageUrl}
        data-pin-media={palettePinImageUrl}
        data-pin-description={palettePinDescription}
        alt={`${palette.name} 5-color paint palette`}
        width={1000}
        height={1500}
        loading="lazy"
        style={{ position: "absolute", left: "-99999px", width: 1, height: 1, opacity: 0 }}
      />
      <Header />

      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CreativeWork",
        name: `${palette.name} Color Palette`, description: palette.description,
        url: `https://www.paintcolorhq.com/inspiration/${slug}`,
        author: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
        hasPart: swatches.filter((s) => s.match).map((s) => ({
          "@type": "DefinedTerm",
          name: s.match!.name,
          inDefinedTermSet: s.match!.brand.name,
          ...(s.match!.color_number ? { termCode: s.match!.color_number } : {}),
          description: `${s.role} color — ${s.match!.name} by ${s.match!.brand.name} (${s.match!.hex.toUpperCase()})`,
        })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Inspiration", item: "https://www.paintcolorhq.com/inspiration" },
          { "@type": "ListItem", position: 3, name: `${palette.name}`, item: `https://www.paintcolorhq.com/inspiration/${slug}` },
        ],
      }} />

      {/* Hero — full-bleed palette strip */}
      <div className="pt-[65px]">
        <div className="h-48 md:h-64" style={{ display: "grid", gridTemplateColumns: `repeat(${swatches.length}, 1fr)` }}>
          {swatches.map((swatch, i) => (
            <div key={i} className="relative" style={{ backgroundColor: swatch.match?.hex ?? swatch.paletteHex }}>
              <span
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ color: textColor(swatch.match?.hex ?? swatch.paletteHex), backgroundColor: textColor(swatch.match?.hex ?? swatch.paletteHex) === "#ffffff" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)" }}
              >
                {swatch.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <nav className="mb-8 text-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2 text-outline">/</span>
          <Link href="/inspiration" className="hover:text-primary transition-colors">Inspiration</Link>
          <span className="mx-2 text-outline">/</span>
          <span className="text-on-surface">{palette.name}</span>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-12">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface mb-4">{palette.name}</h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">{palette.description}</p>
            {effectiveBrandSlug && !brandSlug && (
              <p className="mt-3 text-sm text-outline">
                Showing best-match colors. Most results are from{" "}
                <span className="font-bold text-on-surface-variant">{brands.find((b) => b.slug === effectiveBrandSlug)?.name ?? effectiveBrandSlug}</span>.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BrandPicker brands={brands.map((b) => ({ slug: b.slug, name: b.name }))} currentBrand={brandSlug ?? null} slug={slug} />
            {projectColors.length > 0 && <AddPaletteToProject colors={projectColors} currentPath={currentPath} />}
            <PinterestSaveButton
              pageUrl={`/inspiration/${slug}`}
              mediaUrl={palettePinImageUrl}
              description={palettePinDescription}
            />
            {vizUrl && (
              <Link href={vizUrl} className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20">
                Visualize in Room
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
          {swatches.map((swatch, i) => {
            const displayHex = swatch.match?.hex ?? swatch.paletteHex;
            const href = swatch.match
              ? `/colors/${swatch.match.brand.slug}/${swatch.match.slug}`
              : `/search?q=${encodeURIComponent(swatch.paletteHex)}`;
            return (
              <Link key={i} href={href} className="group overflow-hidden rounded-xl bg-surface-container-lowest border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
                <div className="aspect-[3/4]" style={{ backgroundColor: displayHex }} />
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">{swatch.role}</p>
                  {swatch.match ? (
                    <>
                      <p className="font-headline font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                        <span className="inline-block h-2.5 w-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: swatch.match.hex }} />
                        {swatch.match.name}
                      </p>
                      <p className="text-[10px] text-outline">{swatch.match.brand.name}</p>
                      <div className="h-3" />
                      <p className="font-mono text-[10px] text-outline">{swatch.match.hex.toUpperCase()}</p>
                    </>
                  ) : (
                    <p className="font-mono text-sm text-outline">{swatch.paletteHex.toUpperCase()}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Editorial content */}
      {palette.editorial && (
        <section className="px-6 md:px-12 py-16 bg-surface border-t border-outline-variant/10">
          <div className="max-w-3xl mx-auto">
            {palette.editorial.split("\n\n").map((para, i) => (
              <p key={i} className="text-gray-700 leading-relaxed mt-4 first:mt-0">{para}</p>
            ))}
          </div>
        </section>
      )}

      {/* Related palettes */}
      <section className="px-6 md:px-12 py-20 bg-tertiary-fixed">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">You Might Also Like</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[1, 2, 3].map((offset) => {
              const idx = (inspirationPalettes.findIndex((p) => p.slug === slug) + offset) % inspirationPalettes.length;
              const rp = inspirationPalettes[idx];
              return (
                <Link key={rp.slug} href={`/inspiration/${rp.slug}`} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden hover:shadow-lg transition-all duration-500 group">
                  <div className="h-32" style={{ display: "grid", gridTemplateColumns: `repeat(${rp.colors.length}, 1fr)` }}>
                    {rp.colors.map((hex, i) => <div key={i} style={{ backgroundColor: hex }} />)}
                  </div>
                  <div className="p-5">
                    <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{rp.name}</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">{rp.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-16 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-8">Explore More Tools</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Link href="/tools/palette-generator" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
              <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Palette Generator</p>
              <p className="mt-2 text-sm text-on-surface-variant">Build your own custom color palette</p>
            </Link>
            <Link href="/tools/paint-calculator" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
              <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Paint Calculator</p>
              <p className="mt-2 text-sm text-on-surface-variant">Calculate how much paint you need</p>
            </Link>
            <Link href="/tools/room-visualizer" className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
              <p className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">Room Visualizer</p>
              <p className="mt-2 text-sm text-on-surface-variant">Preview colors in a virtual room</p>
            </Link>
          </div>
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
