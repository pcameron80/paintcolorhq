import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdSenseScript } from "@/components/adsense-script";
import { supabase } from "@/lib/supabase";

export const revalidate = 604800; // 7d — archived set changes rarely (data-pipeline runs only)

export const metadata: Metadata = {
  title: "Discontinued Paint Colors: Find the Closest Current Match",
  description:
    "Your paint color was discontinued? Find the closest current match. Browse retired Sherwin-Williams and Farrow & Ball colors, each mapped to a modern equivalent.",
  alternates: { canonical: "https://www.paintcolorhq.com/discontinued" },
  openGraph: {
    title: "Discontinued Paint Colors & Their Closest Current Matches",
    description:
      "Every discontinued color in our catalog links to its closest current equivalent in each major brand, matched with the CIEDE2000 standard.",
    type: "website",
    url: "https://www.paintcolorhq.com/discontinued",
  },
};

// JSON-LD helper — content is server-generated from trusted data only.
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

interface ArchivedColor {
  id: string;
  name: string;
  hex: string;
  slug: string;
  color_number: string | null;
  brand: { name: string; slug: string };
}

interface BrandGroup {
  name: string;
  slug: string;
  colors: ArchivedColor[];
}

// Archived colors stay in the catalog as match SOURCES (see migration 006) —
// their detail pages carry full cross-brand matching, which is the utility
// this hub surfaces. One ordered query, ~243 rows, grouped by brand in JS.
async function getArchivedColorsByBrand(): Promise<BrandGroup[]> {
  const { data, error } = await supabase
    .from("colors")
    .select("id, name, hex, slug, color_number, brand:brand_id (name, slug)")
    .eq("is_archived", true)
    .order("name"); // unordered Supabase pagination drops/repeats rows

  if (error) throw error;

  const colors = (data ?? []) as unknown as ArchivedColor[];
  const groups = new Map<string, BrandGroup>();
  for (const color of colors) {
    const key = color.brand.slug;
    let group = groups.get(key);
    if (!group) {
      group = { name: color.brand.name, slug: color.brand.slug, colors: [] };
      groups.set(key, group);
    }
    group.colors.push(color);
  }

  // Largest collection first, then alphabetical.
  return [...groups.values()].sort(
    (a, b) => b.colors.length - a.colors.length || a.name.localeCompare(b.name)
  );
}

// "A", "A and B", or "A, B and C" — used in the citeable summary.
function joinBrandNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default async function DiscontinuedPage() {
  const groups = await getArchivedColorsByBrand();
  const total = groups.reduce((sum, g) => sum + g.colors.length, 0);
  const brandList = joinBrandNames(groups.map((g) => g.name));

  const faqs = [
    {
      q: "Can I still buy a discontinued paint color?",
      a: "Often, yes. Discontinuation removes a color from the current fan deck, but the formula usually still exists. Many paint stores can custom-mix a retired color from its stored recipe, or color-match a physical sample you bring in. Where that is not possible, the closest current color — shown on each color's page here — is the practical substitute.",
    },
    {
      q: "How do I find the closest match to a discontinued color?",
      a: "Find the color in the list on this page and open it. Its detail page lists the closest current color in every major brand, matched with the CIEDE2000 standard and labeled in plain language — near-identical, very similar, or same family — so you can see how close each option really is.",
    },
    {
      q: "Why do paint brands discontinue colors?",
      a: "Palettes are refreshed on a cycle, fan decks hold a limited number of colors, and formula or pigment changes can retire a recipe. Some colors were only part of a limited or historic collection to begin with. A discontinued color is usually still recoverable through a custom mix or a close current match.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Discontinued Paint Colors",
          description:
            "Discontinued paint colors from major brands, each linked to its closest current cross-brand match.",
          url: "https://www.paintcolorhq.com/discontinued",
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
            { "@type": "ListItem", position: 2, name: "Discontinued Colors", item: "https://www.paintcolorhq.com/discontinued" },
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
              <span className="text-on-surface">Discontinued Colors</span>
            </nav>
            <span className="text-primary font-bold text-xs uppercase tracking-widest">Reference</span>
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
              Discontinued paint colors
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed max-w-2xl">
              A color you chose gets pulled from the fan deck and suddenly the store can&apos;t mix it. This page tracks the {total} discontinued colors in our catalog and links each one to its closest current equivalent in every major brand.
            </p>
          </div>
        </section>

        {/* Citeable summary */}
        <section className="px-6 md:px-12 py-12 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <p className="text-base text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Short version:</strong> Paint Color HQ tracks {total} discontinued paint colors — retired shades from {brandList} that no longer appear in current fan decks but that people still search for by name. If a color you chose has been pulled, you have options. A paint store can often custom-mix it from the original formula, and every discontinued color on this page links to its closest current match in each major brand, calculated with the{" "}
              <Link href="/methodology" className="text-primary hover:underline underline-offset-4">CIEDE2000 color-difference standard</Link>. Find your color in the list below to open its matches.
            </p>
          </div>
        </section>

        {/* Why brands discontinue colors */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">Why paint brands discontinue colors</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Discontinuation is routine, not a sign that anything was wrong with the color. Brands revise their palettes on a schedule to reflect changing tastes, and a fan deck holds a finite number of chips — adding new colors means retiring older ones. Formula and colorant changes force it too: when a pigment is reformulated or a raw material is no longer available, the recipe behind a color can shift, and a brand may retire the old name rather than ship a chip that no longer matches its own standard.
            </p>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Some colors were only ever part of a limited or historic collection that rotates out by design. Farrow &amp; Ball, for example, keeps selected retired colors in a named archive rather than removing them entirely, so a color can leave the main card and still have a documented recipe.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              None of this means a discontinued color is gone for good. The recipe usually still exists, and a close current match almost always does too.
            </p>
          </div>
        </section>

        {/* What a discontinued color still gives you */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">What a discontinued color still gives you</h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Every color in our catalog — active or retired — carries a hex code, an RGB triplet, and pre-computed cross-brand matches. A discontinued color keeps all of that. Its detail page is still a working bridge: it shows the closest current color in each of the 13 brands we track, so you are not limited to the brand that dropped it. If your discontinued Sherwin-Williams color has a near-identical current color at Benjamin Moore or Behr, the page will show it.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              Match closeness is labeled in plain language — near-identical, very similar, or same family — rather than a raw score, so you can judge at a glance which options are true swaps and which are only in the same neighborhood.
            </p>
          </div>
        </section>

        {/* What to do */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-6">What to do if your color was discontinued</h2>
            <ol className="space-y-6 text-on-surface-variant leading-relaxed">
              <li>
                <strong className="text-on-surface">1. Open your color below.</strong> Each discontinued color has a full detail page showing its closest current match in every major brand, ranked from near-identical down to same-family.
              </li>
              <li>
                <strong className="text-on-surface">2. Take it to a paint store.</strong> Bring the match, or the original color name and number, to a paint counter. Most stores can custom-mix from a stored formula, or scan a physical sample — an old chip, a lid, a cut-out from the wall — and mix to it.
              </li>
              <li>
                <strong className="text-on-surface">3. Confirm with a physical sample.</strong> A close match on screen can read differently on a wall once sheen, lighting, and the coat underneath come into play. Paint a sample in the actual room and check it at a few times of day. The{" "}
                <Link href="/methodology" className="text-primary hover:underline underline-offset-4">methodology page</Link>{" "}
                explains what the match labels mean and where they have limits.
              </li>
            </ol>
          </div>
        </section>

        {/* The list */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-2">Browse discontinued colors</h2>
            <p className="text-on-surface-variant leading-relaxed mb-10">
              Grouped by brand. Open any color to see its closest current match in every brand we track.
            </p>

            <div className="space-y-14">
              {groups.map((group) => (
                <div key={group.slug}>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
                    {group.name}
                  </h3>
                  <p className="text-[11px] uppercase tracking-widest text-outline font-bold mb-6">
                    {group.colors.length} discontinued {group.colors.length === 1 ? "color" : "colors"}
                  </p>
                  <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                    {group.colors.map((color) => (
                      <Link
                        key={color.id}
                        href={`/colors/${group.slug}/${color.slug}`}
                        className="group flex items-center gap-3 py-1.5"
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-outline-variant/25"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden="true"
                        />
                        <span className="text-sm text-on-surface group-hover:text-primary transition-colors">
                          {color.name}
                        </span>
                        {color.color_number && (
                          <span className="text-xs text-outline">{color.color_number}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
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
      </main>

      <AdSenseScript />
      <Footer />
    </div>
  );
}
