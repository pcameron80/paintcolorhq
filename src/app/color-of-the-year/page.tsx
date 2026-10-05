import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { SamplizeOffer } from "@/components/samplize-offer";
import { getColorsBySlugList, getCrossBrandMatches } from "@/lib/queries";
import { nearestMatchesPerBrand } from "@/lib/color-description";
import { hexToRgb, rgbToLab, deltaE2000 } from "@/lib/color-utils";
import { COLOR_OF_THE_YEAR, CURRENT_COTY, type ColorOfTheYearPick } from "@/lib/color-of-the-year";
import type { ColorWithBrand, CrossBrandMatchWithColor } from "@/lib/types";

export const revalidate = 604800; // 7d — picks change once a year; redeploy on a new announcement

const URL = "https://www.paintcolorhq.com/color-of-the-year";
const YEAR = CURRENT_COTY.year;

export const metadata: Metadata = {
  title: { absolute: `${YEAR} Paint Colors of the Year, Matched Across Brands | Paint Color HQ` },
  description: `Every ${YEAR} paint Color of the Year (Sherwin-Williams Celery, Valspar Cottage Door, Glidden Artifact and more) with its closest match from each other brand.`,
  alternates: { canonical: URL },
  openGraph: {
    title: `${YEAR} Paint Colors of the Year, Matched Across Brands`,
    description: `Each brand's ${YEAR} Color of the Year with the closest equivalent from every other brand we track.`,
    type: "article",
    url: URL,
  },
};

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function matchLabel(score: number): string {
  if (score < 1) return "Very close digital match";
  if (score < 2) return "Close digital match";
  if (score < 5) return "Similar";
  return "Visible difference";
}

function isLight(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function distance(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return deltaE2000(rgbToLab(ra.r, ra.g, ra.b), rgbToLab(rb.r, rb.g, rb.b));
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

interface ResolvedPick {
  pick: ColorOfTheYearPick;
  color: ColorWithBrand | null;
  matches: CrossBrandMatchWithColor[];
}

async function resolvePicks(picks: ColorOfTheYearPick[], withMatches: boolean): Promise<ResolvedPick[]> {
  return Promise.all(
    picks.map(async (pick) => {
      if (!pick.colorSlug) return { pick, color: null, matches: [] };
      const [color] = await getColorsBySlugList(pick.brandSlug, [pick.colorSlug]);
      if (!color || !withMatches) return { pick, color: color ?? null, matches: [] };
      const matches = nearestMatchesPerBrand(await getCrossBrandMatches(color.id));
      return { pick, color, matches };
    }),
  );
}

export default async function ColorOfTheYearPage() {
  const [current, ...archive] = COLOR_OF_THE_YEAR;
  const picks = await resolvePicks(current.picks, true);
  const archived = await Promise.all(archive.map(async (cycle) => ({ cycle, picks: await resolvePicks(cycle.picks, false) })));

  const inData = picks.filter((p): p is ResolvedPick & { color: ColorWithBrand } => p.color !== null);
  const lrvs = inData.map((p) => Number(p.color.lrv)).filter((n) => Number.isFinite(n));
  const darkCount = lrvs.filter((n) => n < 30).length;

  // Closest pair among this year's picks: the data point people ask about
  // ("did two brands pick the same color?").
  let closest: { a: ResolvedPick; b: ResolvedPick; d: number } | null = null;
  for (let i = 0; i < inData.length; i++) {
    for (let j = i + 1; j < inData.length; j++) {
      const d = distance(inData[i].color.hex, inData[j].color.hex);
      if (!closest || d < closest.d) closest = { a: inData[i], b: inData[j], d };
    }
  }

  // Picks whose closest cross-brand match has identical digital values.
  const twins = inData
    .map((p) => ({ p, best: p.matches[0] }))
    .filter((x) => x.best && Number(x.best.delta_e_score) < 0.5);

  const pickNames = current.picks.map((p) => `${p.brandName} ${p.name}`);
  const faqs = [
    {
      q: `What are the ${YEAR} paint colors of the year?`,
      a: `As of this update: ${pickNames.join("; ")}. ${current.pending.map((p) => `${p.brandName} is expected ${p.expected}`).join(". ")}.`,
    },
    {
      q: "Can I get a Color of the Year in a different paint brand?",
      a: "Usually, yes. Each pick on this page lists the closest color from every other brand we track, with a plain-language label for how close it is. A paint store can also color-match a physical chip. Treat any substitute as a starting point and compare physical samples in your own room before buying, because sheen and lighting change how a color reads.",
    },
    {
      q: "Are the matches exact?",
      a: "They are the closest matches in our digital color data, calculated with the CIEDE2000 color-difference formula. Paint finish, lighting, substrate and tinting can change the result, so this is not a touch-up guarantee.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${YEAR} Paint Colors of the Year, Matched Across Brands`,
          url: URL,
          dateModified: new Date().toISOString().slice(0, 10),
          author: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
          publisher: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: current.picks.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${p.brandName} ${p.name} ${p.code}`,
              ...(p.colorSlug && { url: `https://www.paintcolorhq.com/colors/${p.brandSlug}/${p.colorSlug}` }),
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
            { "@type": "ListItem", position: 2, name: "Color of the Year", item: URL },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />

      <main className="flex-1">
        <section className="px-6 pt-24 pb-12 md:px-12">
          <div className="mx-auto max-w-5xl">
            <nav className="mb-6 text-sm text-on-surface-variant">
              <Link href="/" className="transition-colors hover:text-primary">Home</Link>
              <span className="mx-2 text-outline">/</span>
              <span className="text-on-surface">Color of the Year</span>
            </nav>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Updated as brands announce</span>
            <h1 className="mt-2 mb-6 font-headline text-5xl font-extrabold leading-[0.95] tracking-tighter text-on-surface md:text-6xl">
              {YEAR} paint colors of the year, matched across brands
            </h1>
            <p className="max-w-3xl text-lg leading-relaxed text-on-surface-variant">
              Every brand&apos;s pick, with the closest color from each other brand we track. Useful when you like
              a Color of the Year but your local store sells a different brand.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-hidden="true">
              {picks.map(({ pick, color }) => (
                <a key={pick.brandSlug} href={`#${pick.brandSlug}`} className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
                  {color ? (
                    <div className="h-24 sm:h-32" style={{ backgroundColor: color.hex }} />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-[repeating-linear-gradient(45deg,var(--surface-container)_0_8px,var(--surface-container-lowest)_8px_16px)] text-xs text-outline sm:h-32">
                      No data yet
                    </div>
                  )}
                  <span className="block truncate px-2 pt-1.5 text-xs font-bold text-on-surface">{pick.name}</span>
                  <span className="block truncate px-2 pb-1.5 text-[11px] text-on-surface-variant">{pick.brandName}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Citeable summary, every number computed from the data below */}
        <section className="bg-surface-container-low px-6 py-12 md:px-12">
          <div className="mx-auto max-w-4xl space-y-4 leading-relaxed text-on-surface-variant">
            <p>
              <strong className="text-on-surface">Short version:</strong> {current.picks.length} brands have named a {YEAR} Color of the Year so far.
              {lrvs.length > 0 && <> {darkCount} of the {lrvs.length} picks in our data have an estimated LRV under 30, so this year leans toward deeper, muted shades.</>}
              {current.pending.length > 0 && <> Still to come: {current.pending.map((p) => `${p.brandName}, expected ${p.expected}`).join("; ")}.</>}
            </p>
            {closest && closest.d < 10 && (
              <p>
                <strong className="text-on-surface">Two brands landed close together.</strong> {closest.a.pick.brandName} {closest.a.pick.name} and {closest.b.pick.brandName} {closest.b.pick.name} are the
                nearest pair among this year&apos;s picks{closest.d < 5 ? ", similar enough in our data that one could stand in for the other." : ". They are still visibly different side by side, so they are not substitutes for each other."}
              </p>
            )}
            {twins.map(({ p, best }) => (
              <p key={p.pick.brandSlug}>
                <strong className="text-on-surface">{p.pick.brandName} {p.pick.name} has a twin.</strong> Its color values in our data are the same as{" "}
                <Link href={`/colors/${best.match_color.brand.slug}/${best.match_color.slug}`} className="text-primary underline-offset-4 hover:underline">
                  {best.match_color.brand.name} {best.match_color.name}
                </Link>
                , an existing color.
              </p>
            ))}
          </div>
        </section>

        {picks.map(({ pick, color, matches }, idx) => (
          <section key={pick.brandSlug} id={pick.brandSlug} className={`scroll-mt-20 px-6 py-14 md:px-12 ${idx % 2 ? "bg-surface-container-low" : ""}`}>
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div>
                <div
                  className={`flex aspect-[4/3] flex-col justify-end rounded-2xl p-6 ${color ? (isLight(color.hex) ? "text-on-surface" : "text-white") : "bg-surface-container text-on-surface"}`}
                  style={color ? { backgroundColor: color.hex } : undefined}
                >
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">{pick.brandName} · {YEAR}</span>
                  <h2 className="font-headline text-3xl font-extrabold tracking-tight">{pick.name}</h2>
                  <span className="text-sm opacity-80">{pick.code}{color ? ` · ${color.hex.toUpperCase()}` : ""}</span>
                </div>
                <dl className="mt-4 space-y-1 text-sm text-on-surface-variant">
                  {color?.lrv != null && (
                    <div className="flex justify-between"><dt>Estimated LRV</dt><dd className="font-medium text-on-surface">{Math.round(Number(color.lrv))}</dd></div>
                  )}
                  {pick.announced && (
                    <div className="flex justify-between"><dt>Announced</dt><dd className="font-medium text-on-surface">{formatDate(pick.announced)}</dd></div>
                  )}
                </dl>
                {pick.note && <p className="mt-3 text-sm text-on-surface-variant">{pick.note}</p>}
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {color && (
                    <Link href={`/colors/${pick.brandSlug}/${pick.colorSlug}`} className="rounded-lg bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-container">
                      Full color details
                    </Link>
                  )}
                  <a href={pick.sourceUrl} rel="noopener" target="_blank" className="rounded-lg px-4 py-2 font-medium text-primary ring-1 ring-outline-variant hover:bg-surface-container">
                    {pick.brandName.split(" /")[0]}&apos;s announcement
                  </a>
                </div>
              </div>

              <div>
                {matches.length > 0 ? (
                  <>
                    <h3 className="mb-3 font-headline text-lg font-bold text-on-surface">Closest {pick.name} match in each brand</h3>
                    <ul className="divide-y divide-outline-variant/30 rounded-xl bg-surface-container-lowest">
                      {matches.map((m) => (
                        <li key={m.match_color.brand.slug}>
                          <Link href={`/colors/${m.match_color.brand.slug}/${m.match_color.slug}`} className="group flex items-center gap-3 px-4 py-2.5">
                            <span className="h-8 w-8 shrink-0 rounded-md border border-outline-variant/25" style={{ backgroundColor: m.match_color.hex }} aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-on-surface group-hover:text-primary">{m.match_color.name}</span>
                              <span className="block text-xs text-on-surface-variant">{m.match_color.brand.name}</span>
                            </span>
                            <span className="shrink-0 text-right text-xs text-on-surface-variant">{matchLabel(Number(m.delta_e_score))}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="rounded-xl bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
                    We list cross-brand matches once a color is in our data. We don&apos;t estimate values for a brand-new color from photos or press images.
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}

        <section className="px-6 py-14 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 font-headline text-3xl font-bold tracking-tight text-on-surface">Before you commit to a trend color</h2>
            <p className="mb-4 leading-relaxed text-on-surface-variant">
              {darkCount * 2 > lrvs.length ? "Most of this year's picks are deep and muted. " : ""}Deep colors show more variation between sheens and under warm versus cool bulbs than light neutrals do, so a match that looks close on screen can drift on a wall. Paint a large sample on two walls and check it morning and evening before buying gallons.
            </p>
            <p className="leading-relaxed text-on-surface-variant">
              Our matches compare digital color values with the CIEDE2000 formula; the{" "}
              <Link href="/methodology" className="text-primary underline-offset-4 hover:underline">methodology page</Link>{" "}
              explains what each label means. To test two colors against each other directly, use the{" "}
              <Link href="/compare" className="text-primary underline-offset-4 hover:underline">compare tool</Link>.
            </p>
            <div className="mt-8">
              <SamplizeOffer sid="color-of-the-year" intro="Want to see a trend color on your wall first?" />
            </div>
          </div>
        </section>

        {archived.map(({ cycle, picks: past }) => (
          <section key={cycle.year} className="bg-surface-container-low px-6 py-14 md:px-12">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 font-headline text-3xl font-bold tracking-tight text-on-surface">{cycle.year} colors of the year</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {past.map(({ pick, color }) => {
                  const body = (
                    <>
                      <div className="h-20 rounded-t-xl" style={{ backgroundColor: color?.hex ?? "var(--surface-container)" }} />
                      <div className="p-3">
                        <span className="block text-sm font-bold text-on-surface">{pick.name}</span>
                        <span className="block text-xs text-on-surface-variant">{pick.brandName} · {pick.code}</span>
                      </div>
                    </>
                  );
                  return color ? (
                    <Link key={pick.brandSlug} href={`/colors/${pick.brandSlug}/${pick.colorSlug}`} className="rounded-xl bg-surface-container-lowest transition-shadow hover:shadow-md">{body}</Link>
                  ) : (
                    <div key={pick.brandSlug} className="rounded-xl bg-surface-container-lowest">{body}</div>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        <section className="px-6 py-14 md:px-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-8 font-headline text-3xl font-bold tracking-tight text-on-surface">Frequently asked questions</h2>
            <div className="space-y-8">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="mb-2 font-headline text-lg font-bold text-on-surface">{f.q}</h3>
                  <p className="leading-relaxed text-on-surface-variant">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
