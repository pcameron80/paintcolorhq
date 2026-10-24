import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { ToolCrossSell } from "@/components/tool-cross-sell";
import { TrackToolOpen } from "@/components/track-tool-open";
import { getAllColorFamilies } from "@/lib/queries";
import { formatLrv, lrvSourceLabel } from "@/lib/color-input";
import {
  findColorsByLrv,
  parseLrvFilters,
  LRV_FINDER_BRANDS,
  LRV_FINDER_LIMIT,
  type LrvFilters,
} from "@/lib/lrv-finder";

const PAGE_URL = "https://www.paintcolorhq.com/tools/lrv-finder";
const TITLE = "LRV Finder: Paint Colors by Light Reflectance Value";
const DESCRIPTION =
  "Find Sherwin-Williams, Benjamin Moore, Behr and Dutch Boy paint colors by LRV. Filter by range, brand and color family, from the brightest whites to the deepest darks.";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function flatten(params: Record<string, string | string[] | undefined>): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(params)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  // Filtered views are not separate pages: noindex,follow, canonical to the tool.
  const hasParams = Object.keys(params).length > 0;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: PAGE_URL },
    ...(hasParams && { robots: { index: false, follow: true } }),
    openGraph: { title: TITLE, description: DESCRIPTION, url: PAGE_URL },
  };
}

// Preset ranges, linked under the form. Bands follow the ones the color pages
// use to describe a color (70+ light, 50-70 mid-light, 25-50 mid-depth).
const PRESETS: { label: string; min: number; max: number; sort?: "low" }[] = [
  { label: "Brightest whites (85+)", min: 85, max: 100 },
  { label: "Light (70 to 85)", min: 70, max: 85 },
  { label: "Mid-light (50 to 70)", min: 50, max: 70 },
  { label: "Mid-depth (25 to 50)", min: 25, max: 50 },
  { label: "Darkest (under 10)", min: 0, max: 10, sort: "low" },
];

function presetHref(p: (typeof PRESETS)[number], f: LrvFilters): string {
  const q = new URLSearchParams();
  if (f.brand) q.set("brand", f.brand);
  if (f.family) q.set("family", f.family);
  q.set("min", String(p.min));
  q.set("max", String(p.max));
  if (p.sort) q.set("sort", p.sort);
  if (f.publishedOnly) q.set("published", "1");
  return `/tools/lrv-finder?${q.toString()}`;
}

const FAQ = [
  {
    q: "What is LRV in paint?",
    a: "LRV, or light reflectance value, is the percentage of visible light a paint color reflects, on a scale from 0 for absolute black to 100 for a perfect white. A color with an LRV of 60 reflects about 60 percent of the light that reaches it. Most paint makers list it on their color pages.",
  },
  {
    q: "What is a good LRV for a ceiling?",
    a: "Most ceiling whites have an LRV in the high 80s or low 90s, because a high LRV bounces light back into the room and makes it feel taller. Set the range to 85 and up to see the brightest whites each brand sells.",
  },
  {
    q: "What LRV makes a room feel brighter?",
    a: "Colors above about 70 reflect enough light to brighten a north-facing room, a hallway or a small space. Between 50 and 70 is a mid-light range that works in most rooms. Below 25, a color absorbs most of the light and reads dark, which suits accent walls and rooms with plenty of daylight.",
  },
  {
    q: "Where do these LRV values come from?",
    a: "Values marked Published match the LRV the manufacturer lists for that color. Values marked Estimated are calculated from the color's hex value and can differ from the manufacturer's figure. The finder covers current Sherwin-Williams, Benjamin Moore, Behr and Dutch Boy colors.",
  },
  {
    q: "Why does LRV matter for trim and walls?",
    a: "The gap in LRV between two colors decides how much one stands out against the other. Trim whites paired with popular wall colors usually sit 9 to 28 points above the wall. Use the finder to shortlist a trim white in the right range, then compare the two colors side by side.",
  },
];

// JSON-LD helper - all content is server-generated from trusted static values
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default async function LrvFinderPage({ searchParams }: Props) {
  const params = flatten(await searchParams);
  const families = await getAllColorFamilies();
  const filters = parseLrvFilters(params, families.map((f) => f.slug));
  const { colors, total, sourceKnown } = await findColorsByLrv(filters);
  const familyName = new Map(families.map((f) => [f.slug, f.name]));

  const selectClass =
    "w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none";

  return (
    <div className="min-h-screen bg-surface">
      <TrackToolOpen tool="lrv-finder" />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "WebApplication",
        name: "LRV Finder",
        description: "Find paint colors from Sherwin-Williams, Benjamin Moore, Behr and Dutch Boy by light reflectance value, brand and color family.",
        url: PAGE_URL,
        applicationCategory: "DesignApplication", operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }} />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Tools", item: "https://www.paintcolorhq.com/tools" },
          { "@type": "ListItem", position: 3, name: "LRV Finder", item: PAGE_URL },
        ],
      }} />

      <Header />

      <section className="relative pt-24 px-4 sm:px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          <span className="text-primary font-bold text-xs uppercase tracking-widest">Tool</span>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.95] mt-2 mb-4">
            LRV Finder
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Find paint colors by light reflectance value. Set a range, pick a brand or color family,
            and see current Sherwin-Williams, Benjamin Moore, Behr and Dutch Boy colors ranked by LRV,
            each marked with where its value comes from.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 md:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
          <form method="get" action="/tools/lrv-finder" className="grid grid-cols-2 gap-3 md:grid-cols-6 md:items-end rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4">
            <label className="col-span-1">
              <span className="block text-xs font-semibold text-on-surface mb-1">Min LRV</span>
              <input type="number" name="min" min={0} max={100} step={1} defaultValue={filters.min} inputMode="numeric" className={selectClass} />
            </label>
            <label className="col-span-1">
              <span className="block text-xs font-semibold text-on-surface mb-1">Max LRV</span>
              <input type="number" name="max" min={0} max={100} step={1} defaultValue={filters.max} inputMode="numeric" className={selectClass} />
            </label>
            <label className="col-span-2 md:col-span-1">
              <span className="block text-xs font-semibold text-on-surface mb-1">Brand</span>
              <select name="brand" defaultValue={filters.brand ?? ""} className={selectClass}>
                <option value="">All four brands</option>
                {LRV_FINDER_BRANDS.map((b) => (
                  <option key={b.slug} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="col-span-1">
              <span className="block text-xs font-semibold text-on-surface mb-1">Family</span>
              <select name="family" defaultValue={filters.family ?? ""} className={selectClass}>
                <option value="">All families</option>
                {families.map((f) => (
                  <option key={f.slug} value={f.slug}>{f.name}</option>
                ))}
              </select>
            </label>
            <label className="col-span-1">
              <span className="block text-xs font-semibold text-on-surface mb-1">Sort</span>
              <select name="sort" defaultValue={filters.sort} className={selectClass}>
                <option value="high">Highest LRV first</option>
                <option value="low">Lowest LRV first</option>
              </select>
            </label>
            <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
              {sourceKnown && (
                <label className="flex items-center gap-2 text-sm text-on-surface">
                  <input type="checkbox" name="published" value="1" defaultChecked={filters.publishedOnly} className="h-4 w-4" />
                  Published values only
                </label>
              )}
              <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90">
                Show colors
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Link
                key={p.label}
                href={presetHref(p, filters)}
                className="rounded-full border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                {p.label}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-sm text-on-surface-variant" aria-live="polite">
            {total === 0
              ? "No current colors match these filters. Widen the LRV range or clear the family."
              : `${total.toLocaleString("en-US")} current colors with an LRV from ${formatLrv(filters.min)} to ${formatLrv(filters.max)}${filters.family ? ` in the ${familyName.get(filters.family) ?? filters.family} family` : ""}. ${total > LRV_FINDER_LIMIT ? `Showing the ${filters.sort === "low" ? "lowest" : "highest"} ${LRV_FINDER_LIMIT}.` : ""}`}
          </p>

          {colors.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {colors.map((c) => {
                const source = lrvSourceLabel(c.lrv, c.lrvSource);
                return (
                  <li key={c.id}>
                    <Link
                      href={`/colors/${c.brandSlug}/${c.slug}`}
                      className="flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 transition-shadow hover:shadow-md"
                    >
                      <span className="h-14 w-14 shrink-0 rounded-lg border border-outline-variant/30" style={{ backgroundColor: c.hex }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-on-surface">{c.name}</span>
                        <span className="block truncate text-xs text-on-surface-variant">
                          {c.brandName}{c.colorNumber ? ` ${c.colorNumber}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-headline text-xl font-bold text-on-surface">{formatLrv(c.lrv)}</span>
                        <span className="block text-[11px] text-on-surface-variant">{source ? `LRV, ${source.toLowerCase()}` : "LRV"}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 md:px-12 bg-surface-container-low/40">
        <div className="max-w-3xl mx-auto space-y-10 text-on-surface-variant leading-relaxed">
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-4">
              Using LRV to choose paint
            </h2>
            <p>
              LRV is the quickest single number for how light a color will feel on the wall. A white
              ceiling in the high 80s or low 90s reflects most of the light that reaches it, a mid-tone
              wall around 50 to 60 keeps a room bright without glare, and a deep color under 10 absorbs
              nearly everything. Our{" "}
              <Link href="/blog/ceiling-paint-color" className="text-primary underline hover:text-primary/80">ceiling paint color guide</Link>{" "}
              lists the common ceiling whites by LRV, and the{" "}
              <Link href="/blog/how-to-choose-trim-color" className="text-primary underline hover:text-primary/80">trim color guide</Link>{" "}
              explains how the LRV gap between wall and trim sets the contrast.
            </p>
            <p className="mt-3">
              LRV does not capture undertone. Two whites at the same LRV can lean warm or cool, so open a
              color&apos;s page to see its undertone and its closest matches in other brands, or put two
              candidates side by side in the{" "}
              <Link href="/compare" className="text-primary underline hover:text-primary/80">compare tool</Link>.
              If you are starting from a screen color rather than a paint, the{" "}
              <Link href="/tools/hex-to-paint-color" className="text-primary underline hover:text-primary/80">hex to paint color tool</Link>{" "}
              finds the nearest paint in each brand first. Brand-by-brand LRV figures are in our{" "}
              <Link href="/paint-color-statistics" className="text-primary underline hover:text-primary/80">paint color statistics</Link>.
            </p>
          </div>

          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight mb-6">
              Questions
            </h2>
            <div className="space-y-6">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{f.q}</h3>
                  <p>{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          <ToolCrossSell exclude="lrv-finder" />
        </div>
      </section>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
