import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorSwatch } from "@/components/color-swatch";
import { ComplementaryColors } from "@/components/complementary-colors";
import { CuratedPalettes } from "@/components/curated-palettes";
import { SaveToProject } from "@/components/save-to-project";
import { getColorBySlug, getCrossBrandMatches, findClosestColor } from "@/lib/queries";
import { generateColorDescription, generateMetaDescription } from "@/lib/color-description";
import { getUndertoneDotClass } from "@/lib/undertone-utils";

export const revalidate = 3600;

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = s / 100;
  l = l / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

async function resolveHarmonies(hex: string) {
  const [h, s, l] = hexToHsl(hex);

  const rawHarmonies = [
    {
      name: "Complementary",
      description: "Opposite on the color wheel — creates vibrant contrast",
      colors: [
        { hex, label: "Base" },
        { hex: hslToHex(h + 180, s, l), label: "Complement" },
      ],
    },
    {
      name: "Analogous",
      description: "Adjacent colors — creates a harmonious, cohesive feel",
      colors: [
        { hex: hslToHex(h - 30, s, l), label: "Adjacent" },
        { hex, label: "Base" },
        { hex: hslToHex(h + 30, s, l), label: "Adjacent" },
      ],
    },
    {
      name: "Triadic",
      description: "Evenly spaced — balanced and colorful",
      colors: [
        { hex, label: "Base" },
        { hex: hslToHex(h + 120, s, l), label: "Triad" },
        { hex: hslToHex(h + 240, s, l), label: "Triad" },
      ],
    },
    {
      name: "Split Complementary",
      description: "Softer alternative to complementary — less tension, still dynamic",
      colors: [
        { hex, label: "Base" },
        { hex: hslToHex(h + 150, s, l), label: "Split" },
        { hex: hslToHex(h + 210, s, l), label: "Split" },
      ],
    },
  ];

  // Collect all unique hex values to resolve
  const allHexes = new Set<string>();
  for (const harmony of rawHarmonies) {
    for (const c of harmony.colors) {
      allHexes.add(c.hex);
    }
  }

  // Resolve all at once
  const resolved = new Map<string, Awaited<ReturnType<typeof findClosestColor>>>();
  await Promise.all(
    [...allHexes].map(async (h) => {
      resolved.set(h, await findClosestColor(h));
    })
  );

  return rawHarmonies.map((harmony) => ({
    name: harmony.name,
    description: harmony.description,
    colors: harmony.colors.map((c) => {
      const match = resolved.get(c.hex);
      return {
        label: c.label,
        paletteHex: c.hex,
        matchHex: match?.hex ?? c.hex,
        matchName: match?.name ?? null,
        matchBrandSlug: match?.brand.slug ?? null,
        matchColorSlug: match?.slug ?? null,
      };
    }),
  }));
}

interface PageProps {
  params: Promise<{ brandSlug: string; colorSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug, colorSlug } = await params;
  const color = await getColorBySlug(brandSlug, colorSlug);
  if (!color) return { title: "Color Not Found" };

  const url = `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}`;
  return {
    title: `${color.name} by ${color.brand.name} | ${color.hex.toUpperCase()}`,
    description: generateMetaDescription(color),
    alternates: { canonical: url },
    openGraph: {
      title: `${color.name} by ${color.brand.name}`,
      description: `${color.name} (${color.hex.toUpperCase()}) by ${color.brand.name}. Find closest matches from other brands.`,
      url,
    },
  };
}

export default async function ColorPage({ params }: PageProps) {
  const { brandSlug, colorSlug } = await params;
  const color = await getColorBySlug(brandSlug, colorSlug);
  if (!color) notFound();

  const matches = await getCrossBrandMatches(color.id);
  const description = generateColorDescription(color, matches);

  // Resolve color harmonies to real paint colors
  const harmonies = await resolveHarmonies(color.hex);

  // Group matches by brand
  const matchesByBrand = matches.reduce(
    (acc, match) => {
      const brandName = match.match_color.brand.name;
      if (!acc[brandName]) acc[brandName] = [];
      acc[brandName].push(match);
      return acc;
    },
    {} as Record<string, typeof matches>
  );

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
          <Link
            href={`/brands/${color.brand.slug}`}
            className="hover:text-gray-900"
          >
            {color.brand.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{color.name}</span>
        </nav>

        {/* Color Hero */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div
            className="aspect-square w-full rounded-2xl border border-gray-200"
            style={{ backgroundColor: color.hex }}
          />

          <div>
            <h1 className="text-3xl font-bold text-gray-900">{color.name}</h1>
            <p className="mt-1 text-lg text-gray-600">{color.brand.name}</p>
            {color.color_number && (
              <p className="mt-1 text-sm text-gray-500">{color.color_number}</p>
            )}

            <div className="mt-4">
              <SaveToProject
                colorId={color.id}
                currentPath={`/colors/${brandSlug}/${colorSlug}`}
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Hex
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                  {color.hex.toUpperCase()}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase text-gray-500">
                  RGB
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
                  {color.rgb_r}, {color.rgb_g}, {color.rgb_b}
                </p>
              </div>
              {color.lrv != null && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    LRV
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {Number(color.lrv).toFixed(1)}
                  </p>
                </div>
              )}
              {color.color_family && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Color Family
                  </p>
                  <Link
                    href={`/colors/family/${color.color_family}`}
                    className="mt-1 block text-lg font-semibold capitalize text-blue-600 hover:underline"
                  >
                    {color.color_family}
                  </Link>
                </div>
              )}
              {color.undertone && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase text-gray-500">
                    Undertone
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${getUndertoneDotClass(color.undertone)}`}
                    />
                    {color.undertone}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Color Description */}
        <p className="mt-8 text-base leading-relaxed text-gray-700">
          {description}
        </p>

        {/* Complementary Colors */}
        <ComplementaryColors hex={color.hex} harmonies={harmonies} />

        {/* Curated Room Palettes */}
        <CuratedPalettes hex={color.hex} brandId={color.brand_id} currentPath={`/colors/${brandSlug}/${colorSlug}`} />

        {/* Cross-Brand Matches */}
        {Object.keys(matchesByBrand).length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900">
              Closest Matches from Other Brands
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Closest digital match based on color values. Pigments and finishes
              differ between brands — always verify with physical samples.
            </p>

            <div className="mt-8 space-y-8">
              {Object.entries(matchesByBrand).map(([brandName, brandMatches]) => (
                <div key={brandName}>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {brandName}
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {brandMatches.slice(0, 3).map((match) => (
                      <Link
                        key={match.id}
                        href={`/colors/${match.match_color.brand.slug}/${match.match_color.slug}`}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                      >
                        <ColorSwatch hex={match.match_color.hex} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">
                            {match.match_color.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {match.match_color.hex.toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Delta E: {Number(match.delta_e_score).toFixed(2)}
                            {Number(match.delta_e_score) < 2
                              ? " (very close)"
                              : Number(match.delta_e_score) < 5
                                ? " (close)"
                                : " (noticeable difference)"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: `${color.name} Paint Color`,
              description,
              url: `https://www.paintcolorhq.com/colors/${brandSlug}/${colorSlug}`,
              breadcrumb: {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
                  { "@type": "ListItem", position: 2, name: color.brand.name, item: `https://www.paintcolorhq.com/brands/${brandSlug}` },
                  { "@type": "ListItem", position: 3, name: color.name },
                ],
              },
              about: {
                "@type": "Thing",
                name: `${color.name}${color.color_number ? ` (${color.color_number})` : ""}`,
                description,
                brand: {
                  "@type": "Brand",
                  name: color.brand.name,
                },
                identifier: color.color_number ?? undefined,
                color: color.hex,
              },
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
