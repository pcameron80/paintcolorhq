import { parseCatalogSearch, catalogCanonical, type CatalogSearch } from "@/lib/catalog-pagination";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorCard } from "@/components/color-card";
import { BrandColorLibrary } from "@/components/brand-color-library";
import { getBrandBySlug, getColorsBySlugList, getColorsByBrand, getColorsByBrandCount, getAllBrands, getCrossBrandMatches } from "@/lib/queries";
import { PREMIUM_ALTERNATIVES } from "@/lib/premium-alternatives";
import { closenessLabel } from "@/lib/closeness";
import { getBrandContent } from "@/lib/brand-content";
import { BRAND_ORG_DATA } from "@/lib/brand-org-data";
import { POPULAR_COLOR_SLUGS, MAJOR_MATCH_BRANDS } from "@/lib/popular-colors";
import { AdSenseScript } from "@/components/adsense-script";
import { TrackPage } from "@/components/track-page";
import { ColorLinkEnhancer } from "@/components/color-link-enhancer";
import { getPostsByBrand } from "@/lib/blog-posts";
import Image from "next/image";

export const revalidate = 2592000; // 30d — static color/match/brand data; redeploys pick up data changes

export async function generateStaticParams() {
  const brands = await getAllBrands();
  return brands.map((b) => ({ brandSlug: b.slug }));
}

interface PageProps {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<CatalogSearch>;
}

const BRAND_TITLE_TEST = new Set(["sherwin-williams", "benjamin-moore"]);

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Brand Not Found" };
  // Live count, not the stored brand.color_count (which is stale — undercounts
  // the actual indexable color pages; the grid, sitemap, and schema all use the
  // live count, so display + title must too).
  const count = (await getColorsByBrandCount(brand.id)).toLocaleString();
  const state = parseCatalogSearch(await searchParams);
  const url = catalogCanonical(brandSlug, state);
  // Lead with "[Brand] Color Chart" + "all [count] colors" — the two big
  // under-captured Bing queries (the page already ranks pos 3-8 for them).
  // De-double "Paint" when the brand name already contains it.
  const brandHasPaintWord = /\bpaint(s)?\b/i.test(brand.name);
  const colorsWordCap = brandHasPaintWord ? "Colors" : "Paint Colors";
  // Title test started 2026-10-11 on the two biggest Bing brand pages. Bing
  // ranks them ~3 for "[brand] paint colors" / "[brand] colors" but only
  // 0.4-0.7% click, while "color chart" queries click 2-3%. Test arm leads
  // with "Paint Colors" and keeps "Color Chart"; it drops the site-name suffix
  // to stay under ~60 chars. Baseline: scripts/seo/snapshots/bing-2026-10-11-
  // brands-baseline.json. Read both engines from 2026-10-25.
  const inTitleTest = BRAND_TITLE_TEST.has(brandSlug);
  const title = inTitleTest
    ? `${brand.name} ${colorsWordCap}: Full Color Chart (All ${count})`
    : `${brand.name} Color Chart: All ${count} ${colorsWordCap}`;
  // Pick 3 well-known compare brands different from the source.
  const compareTo = ["Sherwin-Williams", "Benjamin Moore", "Behr", "PPG"]
    .filter((b) => b !== brand.name)
    .slice(0, 3);
  const colorsWord = brandHasPaintWord ? "colors" : "paint colors";
  const description = inTitleTest
    ? `Every ${brand.name} color on one page, A to Z, with hex code, LRV and undertone. Open any color for its closest ${compareTo.join(", ").replace(/, ([^,]*)$/, " and $1")} match.`
    : `The complete ${brand.name} color chart — all ${count} ${colorsWord} with hex codes, LRV & undertones, plus matches to ${compareTo.join(", ")} & more.`;
  const brandContent = getBrandContent(brandSlug);
  const shouldNoindex = !brandContent;
  return {
    title: inTitleTest ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    ...(shouldNoindex && { robots: { index: false, follow: true } }),
    openGraph: { title, description, url, images: [{ url: "/og-image.webp", width: 1200, height: 630 }] },
  };
}

// JSON-LD helper — content is server-generated from trusted database values only
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const perPage = 60;
  const { page, family, undertone } = parseCatalogSearch(await searchParams);

  // Render the requested page on the server. Database fetches remain cached;
  // distinct HTML and canonical URLs make the whole catalog discoverable.
  const popularSlugsForBrand = POPULAR_COLOR_SLUGS
    .filter((p) => p.brandSlug === brandSlug)
    .map((p) => p.colorSlug);

  const [colors, filteredCount, totalCount, popularColors, allBrands] = await Promise.all([
    getColorsByBrand(brand.id, { limit: perPage, offset: (page - 1) * perPage, family, undertone }),
    getColorsByBrandCount(brand.id, { family, undertone }),
    getColorsByBrandCount(brand.id),
    // Single batched query replaces N parallel getColorBySlug round-trips
    // (audit perf finding from H2.2 PR #54). Up to 11 fewer DB hits per
    // brand-page render.
    getColorsBySlugList(brandSlug, popularSlugsForBrand),
    getAllBrands(),
  ]);

  if (page > Math.max(1, Math.ceil(filteredCount / perPage))) notFound();

  // Premium brands: each well-known color with its nearest match in the
  // brands most US stores carry. Page 1 only, unfiltered.
  const premium = page === 1 && !family && !undertone ? PREMIUM_ALTERNATIVES[brandSlug] : undefined;
  const alternatives = premium
    ? await (async () => {
        const order = new Map(premium.colorSlugs.map((s, i) => [s, i]));
        const sourceColors = (await getColorsBySlugList(brandSlug, premium.colorSlugs))
          .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
        return Promise.all(sourceColors.map(async (c) => {
          const matches = await getCrossBrandMatches(c.id);
          const byTarget = premium.targets.map((t) => matches
            .filter((m) => m.match_color.brand.slug === t)
            .sort((a, b) => Number(a.delta_e_score) - Number(b.delta_e_score))[0]);
          return { color: c, byTarget };
        }));
      })()
    : [];
  const alternativeTargets = premium
    ? premium.targets.map((slug) => allBrands.find((b) => b.slug === slug)?.name ?? slug)
    : [];

  // Cross-brand match targets: drive off MAJOR_MATCH_BRANDS (the canonical list
  // the /match routes + sitemap use) so every brand-pair listing has an internal
  // link. A stale hardcoded list previously orphaned dunn-edwards & farrow-ball.
  // Names resolved from the DB so display strings stay correct (e.g. "Farrow & Ball").
  const matchTargets = MAJOR_MATCH_BRANDS
    .filter((slug) => slug !== brandSlug)
    .map((slug) => allBrands.find((b) => b.slug === slug))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))
    .map((b) => ({ slug: b.slug, name: b.name }));

  const families: { name: string; hex: string; border?: boolean }[] = [
    { name: "white", hex: "#FFFFFF", border: true },
    { name: "off-white", hex: "#F5F0E8", border: true },
    { name: "gray", hex: "#9CA3AF" },
    { name: "beige", hex: "#D4C5A9" },
    { name: "neutral", hex: "#C7C1B7" },
    { name: "brown", hex: "#8B6914" },
    { name: "tan", hex: "#D2B48C" },
    { name: "red", hex: "#DC2626" },
    { name: "orange", hex: "#EA580C" },
    { name: "yellow", hex: "#EAB308" },
    { name: "green", hex: "#16A34A" },
    { name: "blue", hex: "#2563EB" },
    { name: "purple", hex: "#9333EA" },
    { name: "pink", hex: "#EC4899" },
    { name: "black", hex: "#1F2937" },
  ];

  const brandContent = getBrandContent(brand.slug);
  const subtitle = brandContent?.subtitle ?? `Browse every ${brand.name} color with undertone tags, LRV values, and cross-brand matches`;

  // Data-grounded FAQ (rendered visibly below + as FAQPage schema). Brand pages
  // are the biggest impression earner; visible FAQ adds SERP/AI surface. Answers
  // vary per brand (count, most-searched colors, match targets) so they aren't
  // templated. Rendered in the DOM because JSON-LD-only FAQ gets ignored.
  const matchTargetNames = matchTargets.slice(0, 3).map((t) => t.name);
  const brandFaqs: { q: string; a: string }[] = [
    {
      q: `How many ${brand.name} paint colors are there?`,
      a: `${brand.name} has ${totalCount.toLocaleString()} paint colors catalogued on Paint Color HQ, each with its exact hex code, RGB values, LRV (light reflectance value), and undertone. You can filter the full ${brand.name} color chart by color family or undertone, and open any color to see its closest cross-brand matches — the equivalent shade in Sherwin-Williams, Benjamin Moore, Behr, and other catalogued brands.`,
    },
    ...(popularColors.length >= 3
      ? [{
          q: `What are the most popular ${brand.name} paint colors?`,
          a: `Selected ${brand.name} colors on Paint Color HQ include ${popularColors.slice(0, 3).map((c) => c.name).join(", ")}. Each links to a detail page with its hex code, LRV, undertone, and the closest matching shades in other brands, so you can compare them side by side before you buy.`,
        }]
      : []),
    ...(matchTargetNames.length >= 2
      ? [{
          q: `Can I match ${brand.name} colors to other brands?`,
          a: `Yes — every ${brand.name} color has its closest equivalents in ${matchTargetNames.join(", ")}, and ${allBrands.length} brands in total, computed with the CIEDE2000 color-difference formula. That's the ISO standard for how similar two colors look to the human eye, rather than matching by name or code, so it's the reliable way to get a ${brand.name} look in whatever brand your local store carries.`,
        }]
      : []),
  ];
  const orgData = BRAND_ORG_DATA[brand.slug];

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "brand", color_brand: brandSlug }} />
      <Header />

      {/* Brand Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <Link href="/brands" className="hover:text-primary transition-colors">Brands</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">{brand.name}</span>
          </nav>

          <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-4 block">
            {totalCount.toLocaleString()} Colors
            {orgData?.foundingDate && ` \u00B7 Est. ${orgData.foundingDate}`}
            {orgData?.headquarters && ` \u00B7 ${orgData.headquarters}`}
          </span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mb-8">
            {brand.name} Color Chart
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">{subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#colors" className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-base shadow-lg shadow-primary/20">
              Explore Colors
            </Link>
            {orgData?.url && (
              <a href={orgData.url} target="_blank" rel="noopener noreferrer" className="text-primary font-headline font-bold text-base flex items-center gap-2 px-8 py-4 hover:underline underline-offset-4">
                Visit {brand.name} <span>&rarr;</span>
              </a>
            )}
          </div>
          {matchTargets.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-on-surface-variant mr-1">Match {brand.name} to:</span>
              {matchTargets.map((t) => (
                <Link key={t.slug} href={`/match/${brandSlug}/to/${t.slug}`} className="rounded-full border border-outline-variant/40 px-3 py-1.5 font-semibold text-primary hover:bg-surface-container-low">
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {alternatives.length > 0 && (
        <section id="alternatives" className="pb-20 px-6 md:px-12 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
              Popular {brand.name} colors in other brands
            </h2>
            <p className="mt-2 mb-8 text-on-surface-variant max-w-3xl leading-relaxed">
              The closest digital match to each color in {alternativeTargets.join(", ").replace(/, ([^,]*)$/, " and $1")}. Matches are calculated from color data, so confirm with a physical sample before you buy.
            </p>
            {/* Below md each row stacks: the source color, then its three
                matches side by side, each with a brand label in place of the
                hidden header. md and up is the original 640px table. */}
            <div className="rounded-xl border border-outline-variant/20 md:overflow-x-auto">
              <table className="block w-full text-sm md:table md:min-w-[640px]">
                <thead className="hidden bg-surface-container-low text-left md:table-header-group">
                  <tr>
                    <th className="p-3 font-headline">{brand.name}</th>
                    {alternativeTargets.map((name) => <th key={name} className="p-3 font-headline">{name}</th>)}
                  </tr>
                </thead>
                <tbody className="block md:table-row-group">
                  {alternatives.map(({ color: c, byTarget }) => (
                    <tr key={c.id} className="block border-t border-outline-variant/15 first:border-t-0 md:table-row md:first:border-t">
                      <td className="block p-3 pb-1 md:table-cell md:pb-3">
                        <Link href={`/colors/${brandSlug}/${c.slug}`} className="flex items-center gap-3 font-bold text-on-surface hover:text-primary">
                          <span className="h-8 w-8 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: c.hex }} />
                          {c.name}
                        </Link>
                      </td>
                      {byTarget.map((m, i) => (
                        <td key={premium!.targets[i]} className="inline-block w-1/3 p-3 align-top md:table-cell md:w-auto md:align-middle">
                          <span className="mb-1.5 block text-[11px] font-semibold leading-tight text-on-surface-variant md:hidden">{alternativeTargets[i]}</span>
                          {m ? (
                            <Link href={`/colors/${m.match_color.brand.slug}/${m.match_color.slug}`} className="flex flex-col items-start gap-1.5 hover:text-primary md:flex-row md:items-center md:gap-3">
                              <span className="h-8 w-8 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: m.match_color.hex }} />
                              <span>
                                <span className="block font-semibold text-on-surface">{m.match_color.name}</span>
                                <span className="block text-xs text-on-surface-variant">{closenessLabel(Number(m.delta_e_score))}</span>
                              </span>
                            </Link>
                          ) : <span className="text-on-surface-variant">No close match</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section id="colors" className="py-24 px-6 md:px-12 bg-surface-container-low scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
              All {totalCount.toLocaleString()} {brand.name} Colors
            </h2>
            <p className="mt-2 text-on-surface-variant max-w-2xl leading-relaxed">
              The complete {brand.name} color chart — every shade with its hex code, LRV, and undertone. Filter by family or search, and open any color for its cross-brand matches.
            </p>
          </div>
          <BrandColorLibrary
            brandSlug={brandSlug} brandName={brand.name} families={families}
            initialColors={colors} initialTotalCount={filteredCount}
            currentPage={page} familyFilter={family} undertoneFilter={undertone}
          />
        </div>
      </section>

      {/* Editorial Content */}
      {brandContent?.intro && (
        <section className="bg-tertiary-fixed py-20 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">About {brand.name}</h2>
              <div className="bg-primary h-1 w-12 mt-4" />
            </div>
            <article id="brand-intro" className="max-w-4xl text-on-surface-variant leading-relaxed">
              {brandContent.intro}
            </article>
            <ColorLinkEnhancer containerRef="brand-intro" />
          </div>
        </section>
      )}

      {/* Related Blog Posts */}
      {(() => {
        const brandPosts = getPostsByBrand(brand.name, 3);
        if (brandPosts.length === 0) return null;
        return (
          <section className="py-20 px-6 md:px-12 bg-surface">
            <div className="max-w-7xl mx-auto">
              <div className="mb-12 flex justify-between items-end">
                <div>
                  <span className="text-primary font-bold text-xs uppercase tracking-widest">Insights</span>
                  <h2 className="font-headline text-3xl font-bold mt-2 text-on-surface">{brand.name} in The Color Journal</h2>
                </div>
                <Link href="/blog" className="text-primary font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  All articles <span>&rarr;</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {brandPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group cursor-pointer">
                    <div className="aspect-[16/10] overflow-hidden rounded-lg mb-6">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          width={600}
                          height={375}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: post.coverColor }} />
                      )}
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-3 leading-tight group-hover:text-primary transition-colors text-on-surface">
                      {post.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Popular Colors — featured above the paginated grid on page 1.
          Promotes the curated POPULAR_COLOR_SLUGS subset with explicit
          brand-page link signal, not just generateStaticParams pre-render. */}
      {popularColors.length > 0 && (
        <section className="py-16 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">
              Most Popular {brand.name} Colors
            </h2>
            <p className="text-on-surface-variant mb-8">
              The {popularColors.length} {brand.name} colors most-searched on Paint Color HQ — verified bestsellers based on cross-brand match volume.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {popularColors.map((c) => (
                <ColorCard key={c.id} name={c.name} hex={c.hex} brandName={brand.name} brandSlug={brandSlug} colorSlug={c.slug} colorNumber={c.color_number} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Crawlable server-rendered color library */}


      {/* Popular Colors / Brand Details */}
      {brandContent?.details && (
        <section className="py-16 px-6 md:px-12 bg-tertiary-fixed">
          <div className="max-w-7xl mx-auto">
            <article id="brand-details" className="max-w-4xl text-on-surface-variant">
              {brandContent.details}
            </article>
            <ColorLinkEnhancer containerRef="brand-details" />
          </div>
        </section>
      )}

      {/* Cross-Brand Matching */}
      {(() => {
        const targets = matchTargets;
        if (targets.length === 0) return null;
        return (
          <section className="py-20 px-6 md:px-12 bg-surface">
            <div className="max-w-7xl mx-auto">
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Cross-Brand Matching</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Find equivalent colors from {brand.name} in other major paint brands.</p>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {targets.map((target) => (
                  <Link key={target.slug} href={`/match/${brandSlug}/to/${target.slug}`}
                    className="group bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 hover:shadow-lg transition-all duration-500">
                    <h3 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{brand.name} to {target.name}</h3>
                    <p className="mt-2 text-sm text-on-surface-variant">View equivalent colors</p>
                    <span className="mt-4 text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">Explore <span>&rarr;</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* FAQ — rendered visibly (JSON-LD-only FAQ gets ignored) + FAQPage schema below */}
      {brandFaqs.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 md:px-12 py-16">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-8">{brand.name} colors — frequently asked</h2>
          <div className="space-y-3">
            {brandFaqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-headline font-bold text-on-surface">
                  {f.q}
                  <span className="text-outline transition-transform group-open:rotate-180">&#9662;</span>
                </summary>
                <p className="mt-3 text-on-surface-variant leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        name: `${brand.name} Color Chart`,
        description: `The complete ${brand.name} color chart — all ${totalCount.toLocaleString()} ${brand.name} colors with hex codes, RGB values, LRV, and cross-brand matches.`,
        url: `https://www.paintcolorhq.com/brands/${brand.slug}`,
        breadcrumb: { "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Brands", item: "https://www.paintcolorhq.com/brands" },
          { "@type": "ListItem", position: 3, name: brand.name, item: `https://www.paintcolorhq.com/brands/${brand.slug}` },
        ]},
        mainEntity: { "@type": "ItemList", numberOfItems: totalCount,
          itemListElement: colors.map((color, i) => ({ "@type": "ListItem", position: i + 1, url: `https://www.paintcolorhq.com/colors/${brand.slug}/${color.slug}`, name: color.name })),
        },
      }} />
      {orgData && <JsonLd data={{
        "@context": "https://schema.org", "@type": "Organization", name: brand.name,
        ...(orgData.url && { url: orgData.url }),
        ...(orgData.foundingDate && { foundingDate: orgData.foundingDate }),
        ...(orgData.headquarters && { address: { "@type": "PostalAddress", addressLocality: orgData.headquarters } }),
        ...(orgData.sameAs && orgData.sameAs.length > 0 && { sameAs: orgData.sameAs }),
      }} />}
      {brandFaqs.length > 0 && <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: brandFaqs.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }} />}

      <AdSenseScript />
      <Footer />
    </div>
  );
}
