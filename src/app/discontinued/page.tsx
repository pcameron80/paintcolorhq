import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { supabase } from "@/lib/supabase";

export const revalidate = 604800; // 7d — availability set changes rarely (data-pipeline runs only)

const CANONICAL = "https://www.paintcolorhq.com/discontinued";
const PER_PAGE = 60; // house convention for brand/family lists
const JSON_LD_CAP = 100;
const FETCH_BATCH = 1000; // PostgREST row cap per request

type SearchParams = Promise<{ brand?: string; page?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  // Brand and page views are thin slices of the same list; keep them out of the index.
  const hasParams = Object.keys(params).length > 0;
  return {
    title: "Retired and Discontinued Paint Colors: Closest Current Match",
    description:
      "Behr, Sherwin-Williams and Farrow & Ball have retired thousands of paint colors. Most can still be bought by code. Find each one's closest current match.",
    alternates: { canonical: CANONICAL },
    ...(hasParams && { robots: { index: false, follow: true } }),
    openGraph: {
      title: "Retired and Discontinued Paint Colors & Their Closest Matches",
      description:
        "Every retired or discontinued color in our catalog links to its closest current equivalent in each major brand, matched with the CIEDE2000 standard.",
      type: "website",
      url: CANONICAL,
    },
  };
}

// JSON-LD helper — content is server-generated from trusted data only.
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

interface AvailabilityColor {
  id: string;
  name: string;
  hex: string;
  slug: string;
  color_number: string | null;
  availability: "retired" | "discontinued";
  brand: { name: string; slug: string };
}

interface BrandGroup {
  name: string;
  slug: string;
  colors: AvailabilityColor[];
}

interface HubData {
  discontinued: BrandGroup[];
  retired: BrandGroup[];
}

// Retired and discontinued colors stay in the catalog as match SOURCES (see
// migrations 006 and 012). Their detail pages carry the cross-brand matching
// this hub surfaces. Paginated fetch (~2,800 rows, light columns), grouped by
// brand in JS, cached so a searchParams-driven render does not re-query.
const getHubData = unstable_cache(
  async (): Promise<HubData> => {
    const colors: AvailabilityColor[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("colors")
        .select("id, name, hex, slug, color_number, availability, brand:brand_id (name, slug)")
        .in("availability", ["retired", "discontinued"])
        .order("name") // unordered Supabase pagination drops/repeats rows
        .order("id")
        .range(from, from + FETCH_BATCH - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      colors.push(...(data as unknown as AvailabilityColor[]));
      from += data.length;
    }

    const group = (kind: "retired" | "discontinued"): BrandGroup[] => {
      const groups = new Map<string, BrandGroup>();
      for (const color of colors) {
        if (color.availability !== kind) continue;
        let g = groups.get(color.brand.slug);
        if (!g) {
          g = { name: color.brand.name, slug: color.brand.slug, colors: [] };
          groups.set(color.brand.slug, g);
        }
        g.colors.push(color);
      }
      // Largest collection first, then alphabetical.
      return [...groups.values()].sort(
        (a, b) => b.colors.length - a.colors.length || a.name.localeCompare(b.name)
      );
    };

    return { discontinued: group("discontinued"), retired: group("retired") };
  },
  ["discontinued-hub-v1"],
  { revalidate: 604800 }
);

// "A", "A and B", or "A, B and C" — used in the citeable summary.
function joinBrandNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function ColorLink({ color }: { color: AvailabilityColor }) {
  return (
    <Link href={`/colors/${color.brand.slug}/${color.slug}`} className="group flex items-center gap-3 py-1.5">
      <span
        className="h-4 w-4 shrink-0 rounded-full border border-outline-variant/25"
        style={{ backgroundColor: color.hex }}
        aria-hidden="true"
      />
      <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{color.name}</span>
      {color.color_number && <span className="text-xs text-outline">{color.color_number}</span>}
    </Link>
  );
}

function BrandSection({ group, noun }: { group: BrandGroup; noun: "retired" | "discontinued" }) {
  const shown = group.colors.slice(0, PER_PAGE);
  return (
    <div>
      <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{group.name}</h3>
      <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-6">
        {group.colors.length} {noun} {group.colors.length === 1 ? "color" : "colors"}
      </p>
      <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((color) => (
          <ColorLink key={color.id} color={color} />
        ))}
      </div>
      {group.colors.length > shown.length && (
        <Link
          href={`/discontinued?brand=${group.slug}`}
          className="mt-4 inline-block text-sm font-bold text-primary hover:underline underline-offset-4"
        >
          Show all {group.colors.length.toLocaleString("en-US")} {group.name} colors
        </Link>
      )}
    </div>
  );
}

export default async function DiscontinuedPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { discontinued, retired } = await getHubData();

  const allGroups = [...discontinued, ...retired];
  const discontinuedTotal = discontinued.reduce((sum, g) => sum + g.colors.length, 0);
  const retiredTotal = retired.reduce((sum, g) => sum + g.colors.length, 0);
  const total = discontinuedTotal + retiredTotal;
  const brandNames = [...new Set([...retired, ...discontinued].map((g) => g.name))];
  const brandList = joinBrandNames(brandNames);

  // Brand view: one brand's colors (discontinued first), 60 per page.
  const brandSlug = params.brand;
  const brandColors = brandSlug
    ? [
        ...(discontinued.find((g) => g.slug === brandSlug)?.colors ?? []),
        ...(retired.find((g) => g.slug === brandSlug)?.colors ?? []),
      ]
    : null;
  if (brandSlug && brandColors && brandColors.length === 0) notFound();
  const brandName = brandSlug ? allGroups.find((g) => g.slug === brandSlug)?.name ?? brandSlug : null;
  const pageCount = brandColors ? Math.max(1, Math.ceil(brandColors.length / PER_PAGE)) : 1;
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), pageCount);
  const pageHref = (n: number) => `/discontinued?brand=${brandSlug}${n > 1 ? `&page=${n}` : ""}`;

  // Structured data lists at most JSON_LD_CAP entries, discontinued first.
  const listed = [
    ...discontinued.flatMap((g) => g.colors),
    ...retired.flatMap((g) => g.colors),
  ].slice(0, JSON_LD_CAP);

  const faqs = [
    {
      q: "Can I still buy a retired paint color?",
      a: "Usually, yes. A retired color is one the brand has removed from its current palette, but it can still be bought or mixed from its code. Behr colors can be ordered at The Home Depot, Sherwin-Williams still sells its archived colors as paint and Color to Go samples, and Farrow & Ball makes its Archive colors to order. Each color's page here states how it is sold.",
    },
    {
      q: "What is the difference between retired and discontinued?",
      a: "Retired means the brand has taken the color out of its current palette but it can still be bought by code, so we keep it in match lists and label it. Discontinued means it can no longer be bought, so we leave it out of match lists and point to the closest current colors from other brands instead.",
    },
    {
      q: "How do I find the closest match to a retired or discontinued color?",
      a: "Find the color in the list on this page and open it. Its detail page lists the closest current color in every major brand, matched with the CIEDE2000 standard and labeled in plain language: nearly identical, very similar, or visible difference. That shows how close each option really is.",
    },
    {
      q: "Why do paint brands retire colors?",
      a: "Palettes are refreshed on a cycle, fan decks hold a limited number of colors, and formula or pigment changes can retire a recipe. Some colors were only part of a limited or historic collection to begin with. A retired color is usually still recoverable by its code, and a close current match almost always exists.",
    },
  ];

  const pageTitle = brandName ? `${brandName} retired and discontinued colors` : "Retired and discontinued paint colors";

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Retired and Discontinued Paint Colors",
          description:
            "Retired and discontinued paint colors from major brands, each linked to its closest current cross-brand match.",
          url: CANONICAL,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: listed.length,
            itemListElement: listed.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${c.name}${c.color_number ? ` ${c.color_number}` : ""} (${c.brand.name})`,
              url: `https://www.paintcolorhq.com/colors/${c.brand.slug}/${c.slug}`,
            })),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
            { "@type": "ListItem", position: 2, name: "Retired and Discontinued Colors", item: CANONICAL },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-24 px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <nav className="mb-6 text-sm text-on-surface-variant">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span className="mx-2 text-outline">/</span>
              {brandName ? (
                <>
                  <Link href="/discontinued" className="hover:text-primary transition-colors">Retired and Discontinued Colors</Link>
                  <span className="mx-2 text-outline">/</span>
                  <span className="text-on-surface">{brandName}</span>
                </>
              ) : (
                <span className="text-on-surface">Retired and Discontinued Colors</span>
              )}
            </nav>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Reference</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
              {pageTitle}
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
              Brands pull colors from their fan decks every year, and the color on your walls may be one of them. This page tracks {total.toLocaleString("en-US")} retired and discontinued colors from {brandList}. Retired colors can usually still be bought by code, and each one links to its closest current matches in every major brand.
            </p>
          </div>
        </section>

        {!brandName && (
          <>
            {/* Citeable summary */}
            <section className="px-6 md:px-12 py-12 bg-surface-container-low">
              <div className="max-w-4xl mx-auto">
                <p className="text-base text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface">Short version:</strong> Paint Color HQ tracks {retiredTotal.toLocaleString("en-US")} retired paint colors{discontinuedTotal > 0 ? ` and ${discontinuedTotal.toLocaleString("en-US")} discontinued colors` : ""} from {brandList}. A retired color has left the brand&apos;s current palette but can still be bought or mixed by its code. A discontinued color can no longer be bought. Every color on this page links to its closest current match in each major brand, calculated with the{" "}
                  <Link href="/methodology" className="text-primary hover:underline underline-offset-4">CIEDE2000 color-difference standard</Link>. Find your color in the list below to open its matches.
                </p>
              </div>
            </section>

            {/* Why brands retire colors */}
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Why paint brands retire colors</h2>
                <p className="text-on-surface-variant leading-relaxed mb-4">
                  Retirement is routine, not a sign that anything was wrong with the color. Brands revise their palettes on a schedule to reflect changing tastes, and a fan deck holds a finite number of chips, so adding new colors means retiring older ones. Formula and colorant changes force it too: when a pigment is reformulated or a raw material is no longer available, the recipe behind a color can shift, and a brand may retire the old name rather than ship a chip that no longer matches its own standard.
                </p>
                <p className="text-on-surface-variant leading-relaxed mb-4">
                  Some colors were only ever part of a limited or historic collection that rotates out by design. Farrow &amp; Ball, for example, keeps selected retired colors in a named Archive and makes them to order rather than removing them entirely.
                </p>
                <p className="text-on-surface-variant leading-relaxed">
                  A retired color is not gone for good. It can usually still be bought by its code, and a close current match almost always exists too.
                </p>
              </div>
            </section>

            {/* What a retired color still gives you */}
            <section className="px-6 md:px-12 py-16 bg-surface-container-low">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">What a retired color still gives you</h2>
                <p className="text-on-surface-variant leading-relaxed mb-4">
                  Every color in our catalog, current or retired, carries a hex code, an RGB triplet, and pre-computed cross-brand matches. A retired color keeps all of that. Its detail page is still a working bridge: it shows the closest current color in each of the 13 brands we track, so you are not limited to the brand that dropped it. If your retired Sherwin-Williams color has a nearly identical current color at Benjamin Moore or Behr, the page will show it.
                </p>
                <p className="text-on-surface-variant leading-relaxed">
                  Match closeness is labeled in plain language (nearly identical, very similar, or visible difference) rather than a raw score, so you can judge at a glance which options are the best swaps and which differ visibly.
                </p>
              </div>
            </section>

            {/* What to do */}
            <section className="px-6 md:px-12 py-16">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">What to do if your color was retired</h2>
                <ol className="space-y-6 text-on-surface-variant leading-relaxed">
                  <li>
                    <strong className="text-on-surface">1. Open your color below.</strong> Each color has a full detail page showing how the brand still sells it, if it does, and its closest current match in every major brand, ranked from nearly identical down to visible difference.
                  </li>
                  <li>
                    <strong className="text-on-surface">2. Take it to a paint store.</strong> Bring the match, or the original color name and number, to a paint counter. Most stores can mix from a stored formula, or scan a physical sample (an old chip, a lid, a cut-out from the wall) and mix to it.
                  </li>
                  <li>
                    <strong className="text-on-surface">3. Confirm with a physical sample.</strong> A nearly identical or very similar result on screen can read differently on a wall once sheen, lighting, and the coat underneath come into play. Paint a sample in the actual room and check it at a few times of day. The{" "}
                    <Link href="/methodology" className="text-primary hover:underline underline-offset-4">methodology page</Link>{" "}
                    explains what the match labels mean and where they have limits.
                  </li>
                </ol>
              </div>
            </section>
          </>
        )}

        {/* The lists */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-5xl mx-auto">
            {brandColors ? (
              <>
                <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
                  All {brandColors.length} {brandName} colors
                </h2>
                <p className="text-on-surface-variant leading-relaxed mb-10">
                  Page {page} of {pageCount}. Open any color to see its closest current match in every brand we track.
                </p>
                <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                  {brandColors.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((color) => (
                    <div key={color.id}>
                      <ColorLink color={color} />
                      {color.availability === "discontinued" && (
                        <span className="ml-7 text-[10px] font-bold uppercase tracking-widest text-outline">Discontinued</span>
                      )}
                    </div>
                  ))}
                </div>
                <nav aria-label="Pagination" className="mt-10 flex items-center justify-between text-sm font-bold">
                  {page > 1 ? (
                    <Link href={pageHref(page - 1)} rel="prev" className="text-primary hover:underline underline-offset-4">Previous page</Link>
                  ) : (
                    <span />
                  )}
                  {page < pageCount ? (
                    <Link href={pageHref(page + 1)} rel="next" className="text-primary hover:underline underline-offset-4">Next page</Link>
                  ) : (
                    <span />
                  )}
                </nav>
                <p className="mt-8 text-sm">
                  <Link href="/discontinued" className="text-primary hover:underline underline-offset-4">Back to all brands</Link>
                </p>
              </>
            ) : (
              <div className="space-y-20">
                {discontinued.length > 0 && (
                  <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Discontinued colors</h2>
                    <p className="text-on-surface-variant leading-relaxed mb-10">
                      The brand no longer sells these. Open any color to see the closest current colors from other brands.
                    </p>
                    <div className="space-y-14">
                      {discontinued.map((group) => (
                        <BrandSection key={group.slug} group={group} noun="discontinued" />
                      ))}
                    </div>
                  </div>
                )}
                {retired.length > 0 && (
                  <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Retired colors you can still buy</h2>
                    <p className="text-on-surface-variant leading-relaxed mb-10">
                      Grouped by brand. The brand has retired these from its current palette, but they can still be bought by code. Open any color to see how, and its closest current matches.
                    </p>
                    <div className="space-y-14">
                      {retired.map((group) => (
                        <BrandSection key={group.slug} group={group} noun="retired" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        {!brandName && (
          <section className="px-6 md:px-12 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-8">Frequently asked questions</h2>
              <div className="space-y-8">
                {faqs.map((f) => (
                  <div key={f.q}>
                    <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{f.q}</h3>
                    <p className="text-on-surface-variant leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
