import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { TrackPage } from "@/components/track-page";
import { getHueBandColors, getAllBrands, type HueBandColor } from "@/lib/queries";
import { HUE_BANDS, HUE_BAND_SLUGS, getHueBand, type HueBand } from "@/lib/hue-bands";
import { parseHueBandSearch, hueBandCanonical, HUE_BAND_PER_PAGE } from "@/lib/hue-band-pagination";
import type { CatalogSearch } from "@/lib/catalog-pagination";

export const revalidate = 2592000; // 30d, same as family and brand pages
export const dynamicParams = false;

// The band read scans a/b-prefiltered rows (see getHueBandColors), so cache the
// computed membership instead of hitting Supabase on every paginated render.
const getBandColors = unstable_cache(
  async (slug: string) => getHueBandColors(slug),
  ["hue-band-colors-v1"],
  { revalidate: 2592000 },
);

interface PageProps {
  params: Promise<{ bandSlug: string }>;
  searchParams: Promise<CatalogSearch>;
}

export function generateStaticParams() {
  return HUE_BAND_SLUGS.map((bandSlug) => ({ bandSlug }));
}

function brandBreakdown(colors: HueBandColor[]) {
  const counts = new Map<string, { name: string; slug: string; count: number }>();
  for (const c of colors) {
    const e = counts.get(c.brand.slug) ?? { name: c.brand.name, slug: c.brand.slug, count: 0 };
    e.count++;
    counts.set(c.brand.slug, e);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function featuredMembers(band: HueBand, colors: HueBandColor[]) {
  const bySlug = new Map(colors.map((c) => [`${c.brand.slug}/${c.slug}`, c]));
  return band.featured.map((f) => bySlug.get(`${f.brand}/${f.slug}`)).filter((c): c is HueBandColor => Boolean(c));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { bandSlug } = await params;
  const band = getHueBand(bandSlug);
  if (!band) return { title: "Not Found" };
  const colors = await getBandColors(bandSlug);
  const brands = brandBreakdown(colors);
  const { page } = parseHueBandSearch(await searchParams);
  const url = hueBandCanonical(bandSlug, page);
  const named = featuredMembers(band, colors).slice(0, 3).map((c) => c.name);
  const title = `${band.name} Paint Colors from Every Brand`;
  const description = `${colors.length.toLocaleString()} ${band.phrase} paint colors from ${brands.length} brands, including ${named.join(", ")}. Hex codes and closest matches in other brands.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: "/og-image.webp", width: 1200, height: 630 }] },
  };
}

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function ColorLink({ c }: { c: HueBandColor }) {
  return (
    <Link href={`/colors/${c.brand.slug}/${c.slug}`} className="text-primary font-semibold hover:underline">
      {c.brand.name} {c.name}
    </Link>
  );
}

function Intro({ band, colors }: { band: HueBand; colors: HueBandColor[] }) {
  const f = featuredMembers(band, colors);
  const pick = (slug: string) => f.find((c) => c.slug === slug);
  const L = (slug: string) => {
    const c = pick(slug);
    return c ? <ColorLink c={c} /> : null;
  };
  if (band.slug === "blue-gray") {
    return (
      <p>
        Blue gray paints are blues with so little chroma that they read as gray until you set them next to a true neutral.
        {" "}Light examples include {L("krypton-6247")} and {L("languid-blue-6226")}.
        {" "}{L("smoky-blue-7604")} and {L("georgian-bay-cc-782")} sit in the middle of the range. {L("gale-force-7605")} and {L("hale-navy-hc-154")} are the dark end.
        {" "}Open any color to see its closest match in the other brands.
      </p>
    );
  }
  if (band.slug === "blue-green") {
    return (
      <p>
        Blue green covers teal, aqua, turquoise and peacock shades: hues between green and true blue with enough chroma to read as colored rather than gray.
        {" "}{L("oceanside-6496")} and {L("aquarium-6767")} are the saturated end,
        {" "}{L("peacock-blue-2049-40")} is a mid-tone, and {L("aegean-teal-2136-40")} and {L("tropical-oasis-csp-710")} are muted, grayed teals.
        {" "}Compare any of them against the same shade in another brand from its color page.
      </p>
    );
  }
  return (
    <p>
      Rust is an orange-brown with a red cast, darker and duller than a true orange.
      {" "}{L("rust-2175-30")} is the namesake. {L("hearty-orange-6622")} is the most saturated of the group named here, {L("copper-mountain-6356")} and {L("cavern-clay-7701")} run browner,
      {" "}and {L("rookwood-terra-cotta-2803")} is the clay-pot end. Pale salmon and peach tones and deep chocolate browns fall outside the band.
    </p>
  );
}

export default async function HueBandPage({ params, searchParams }: PageProps) {
  const { bandSlug } = await params;
  const band = getHueBand(bandSlug);
  if (!band) notFound();

  const [colors, allBrands] = await Promise.all([getBandColors(bandSlug), getAllBrands()]);
  const { page } = parseHueBandSearch(await searchParams);
  const total = colors.length;
  const totalPages = Math.max(1, Math.ceil(total / HUE_BAND_PER_PAGE));
  if (page > totalPages) notFound();

  const pageColors = colors.slice((page - 1) * HUE_BAND_PER_PAGE, page * HUE_BAND_PER_PAGE);
  const brands = brandBreakdown(colors);
  const baseUrl = hueBandCanonical(bandSlug, 1);
  const pageUrl = hueBandCanonical(bandSlug, page);
  const href = (p: number) => `/colors/hue/${bandSlug}${p > 1 ? `?page=${p}` : ""}`;
  const top = brands.slice(0, 3);

  const faq = [
    {
      q: `How many ${band.phrase} paint colors are there?`,
      a: `Paint Color HQ lists ${total.toLocaleString()} ${band.phrase} paint colors across ${brands.length} brands. ${top.map((b) => `${b.name} has the most with ${b.count}`).slice(0, 1)[0]}, followed by ${top.slice(1).map((b) => `${b.name} (${b.count})`).join(" and ")}.`,
    },
    {
      q: `How does Paint Color HQ decide which colors count as ${band.phrase}?`,
      a: `Each color's stored CIELAB values are converted to a hue angle, chroma (how far the color is from neutral gray) and lightness. A color is listed here when its hue angle is between ${band.hue[0]} and ${band.hue[1]} degrees, its chroma is ${band.chroma[1] >= 200 ? `at least ${band.chroma[0]}` : `between ${band.chroma[0]} and ${band.chroma[1]}`}, and its lightness is between ${band.lightness[0]} and ${band.lightness[1]} on the 0 to 100 scale.${band.slug === "blue-gray" ? " Colors that also meet the blue green range are listed on the blue green page instead." : ""} Brand names and marketing labels are not used.`,
    },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <JsonLd data={{
        "@context": "https://schema.org", "@graph": [
          {
            "@type": "CollectionPage", name: `${band.name} Paint Colors`, url: pageUrl,
            description: `${total} ${band.phrase} paint colors from ${brands.length} brands.`,
            mainEntity: {
              "@type": "ItemList", numberOfItems: total,
              itemListElement: pageColors.slice(0, 20).map((c, i) => ({ "@type": "ListItem", position: (page - 1) * HUE_BAND_PER_PAGE + i + 1, name: `${c.brand.name} ${c.name}`, url: `https://www.paintcolorhq.com/colors/${c.brand.slug}/${c.slug}` })),
            },
          },
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
            { "@type": "ListItem", position: 2, name: "Colors", item: "https://www.paintcolorhq.com/colors" },
            { "@type": "ListItem", position: 3, name: `${band.name} Paint Colors`, item: baseUrl },
          ]},
        ],
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <TrackPage eventName="page_view_enriched" params={{ page_type: "hue_band", color_family: bandSlug, result_count: total }} />
      <Header />

      <section className="relative pt-24 px-6 md:px-12 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl shrink-0 shadow-lg" style={{ backgroundColor: band.swatch }} />
          <div>
            <nav className="mb-4 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <Link href="/colors" className="hover:text-primary transition-colors">Colors</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">{band.name}</span>
            </nav>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mb-4">
              {band.name} Paint Colors
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
              {total.toLocaleString()} {band.phrase} paint colors across {brands.length} brands.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-tertiary-fixed py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary h-1 w-12 mb-6" />
          <article className="max-w-4xl text-on-surface-variant leading-relaxed">
            <Intro band={band} colors={colors} />
          </article>
        </div>
      </section>

      <section id="colors" className="py-20 px-6 md:px-12 bg-surface-container-low scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
            All {total.toLocaleString()} {band.phrase} colors
          </h2>
          <p className="text-on-surface-variant mb-10">
            Showing {((page - 1) * HUE_BAND_PER_PAGE + 1).toLocaleString()} to {Math.min(page * HUE_BAND_PER_PAGE, total).toLocaleString()}, sorted by name.
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pageColors.map((c) => (
              <ColorCard key={c.id} name={c.name} hex={c.hex} brandName={c.brand.name} brandSlug={c.brand.slug} colorSlug={c.slug} colorNumber={c.color_number} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="mt-12 flex flex-wrap items-center justify-center gap-2">
              {page > 1 && (
                <Link href={href(page - 1)} rel="prev" className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors">Previous</Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={href(p)} aria-current={p === page ? "page" : undefined}
                  className={`rounded-xl px-4 py-2.5 text-sm font-headline font-bold transition-all ${p === page ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 hover:text-primary"}`}>
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={href(page + 1)} rel="next" className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors">Next</Link>
              )}
            </nav>
          )}
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">{band.name} paint colors by brand</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-on-surface-variant">
            {brands.map((b) => (
              <li key={b.slug}><Link href={`/brands/${b.slug}`} className="hover:text-primary">{b.name}</Link>: {b.count.toLocaleString()} colors</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-on-surface-variant">{allBrands.length} brands are catalogued in total.</p>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">{band.name} paint colors: questions</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <details key={f.q} className="group bg-surface-container-lowest rounded-xl border border-outline-variant/10">
                <summary className="cursor-pointer px-6 py-5 font-headline font-bold text-on-surface hover:text-primary transition-colors">{f.q}</summary>
                <div className="px-6 pb-5 text-on-surface-variant leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">Related color ranges</h2>
          <div className="flex flex-wrap gap-3">
            {HUE_BANDS.filter((b) => b.slug !== bandSlug).map((b) => (
              <Link key={b.slug} href={`/colors/hue/${b.slug}`} className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:shadow-md hover:text-primary">
                <span className="inline-block h-5 w-5 rounded-full" style={{ backgroundColor: b.swatch }} />
                {b.name} paint colors
              </Link>
            ))}
            <Link href="/colors" className="rounded-full bg-surface-container-lowest px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:shadow-md hover:text-primary">All color families</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
