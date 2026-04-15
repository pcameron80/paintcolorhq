import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getAllColorFamilies } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse Paint Colors by Color Family",
  description:
    "Browse paint colors organized by color family - whites, grays, blues, greens, and more from all major brands.",
  alternates: { canonical: "https://www.paintcolorhq.com/colors" },
  openGraph: {
    title: "Browse Paint Colors by Color Family",
    description: "Browse paint colors organized by color family - whites, grays, blues, greens, and more from all major brands.",
    url: "https://www.paintcolorhq.com/colors",
  },
};

const familyColors: Record<string, { hex: string; border?: boolean }> = {
  red: { hex: "#DC2626" }, orange: { hex: "#EA580C" }, yellow: { hex: "#EAB308" },
  green: { hex: "#16A34A" }, blue: { hex: "#2563EB" }, purple: { hex: "#9333EA" },
  pink: { hex: "#EC4899" }, white: { hex: "#FFFFFF", border: true },
  "off-white": { hex: "#F5F0E8", border: true }, black: { hex: "#1F2937" },
  gray: { hex: "#9CA3AF" }, brown: { hex: "#8B6914" }, beige: { hex: "#D4C5A9" },
  tan: { hex: "#C4A882" }, neutral: { hex: "#B8B0A0" },
};

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export default async function ColorsPage() {
  const families = await getAllColorFamilies();

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 px-6 md:px-12 py-20">
        <div className="max-w-7xl mx-auto">
          <nav className="mb-8 text-sm text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2 text-outline">/</span>
            <span className="text-on-surface">Colors</span>
          </nav>
          <span className="text-primary font-bold text-xs uppercase tracking-widest">The Archive</span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface leading-[0.9] mt-2 mb-6">
            Browse by<br />Color Family
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Explore 25,000+ paint colors organized by color family across 14 brands.
          </p>
        </div>
      </section>

      {/* Color Family Grid */}
      <section className="px-6 md:px-12 py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {families.map((family) => {
              const fc = familyColors[family.slug] ?? { hex: "#9CA3AF" };
              const light = isLightColor(fc.hex);

              return (
                <Link
                  key={family.id}
                  href={`/colors/family/${family.slug}`}
                  className="group overflow-hidden rounded-xl hover:shadow-lg transition-all duration-500 hover:-translate-y-1"
                >
                  <div
                    className={`relative h-40 flex flex-col justify-end p-5 ${fc.border ? "border border-outline-variant/20" : ""}`}
                    style={{ backgroundColor: fc.hex }}
                  >
                    <h2 className={`font-headline text-xl font-extrabold ${light ? "text-on-surface" : "text-on-primary"} drop-shadow-sm`}>
                      {family.name}
                    </h2>
                  </div>
                  <div className="bg-surface-container-lowest p-4">
                    <p className="text-xs text-outline tracking-wider uppercase">
                      {family.slug}
                    </p>
                    <span className="mt-2 text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Explore <span>&rarr;</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 md:px-12 bg-surface">
        <div className="max-w-3xl mx-auto text-on-surface-variant leading-relaxed">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-6">How these families are grouped</h2>
          <p className="mb-4">Paint brands don&apos;t agree on color categorization. Sherwin-Williams might file a warm gray under &ldquo;Neutral&rdquo; while Benjamin Moore puts a similar undertone in &ldquo;Gray.&rdquo; This catalog groups by visual family regardless of each brand&apos;s own classification, so cross-brand matches make sense.</p>
          <p className="mb-4"><strong>White and off-white</strong> are split because they behave differently on a wall. A true white (LRV 85+) reflects nearly all light and works as trim or ceiling. An off-white (LRV 70–85) has enough pigment to read as a wall color without washing out under warm bulbs.</p>
          <p className="mb-4"><strong>Beige and tan</strong> overlap, but beige generally leans cooler and grayer; tan leans warmer and yellower. The distinction matters for pairing — beige walls work with cool-tone tile and stainless; tan walls pair better with warm woods and brass.</p>
          <p><strong>Neutral</strong> covers colors that don&apos;t commit to a warm or cool undertone — the &ldquo;greige&rdquo; category brands now market heavily. These shift through the day as lighting changes, which is why they&apos;re popular in rooms with mixed light sources.</p>
        </div>
      </section>

      {/* Browse by Brand CTA */}
      <section className="py-20 px-6 md:px-12 bg-surface">
        <div className="max-w-5xl mx-auto bg-surface-container-low rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 border border-outline-variant/15">
          <div className="md:w-2/3">
            <h2 className="font-headline text-3xl font-bold mb-4 text-on-surface">Prefer to browse by brand?</h2>
            <p className="text-on-surface-variant mb-6">
              Explore colors from Sherwin-Williams, Benjamin Moore, Behr, and 11 more paint manufacturers.
            </p>
            <Link
              href="/brands"
              className="inline-block bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm shadow-lg shadow-primary/20"
            >
              Browse All Brands
            </Link>
          </div>
          <div className="md:w-1/3 flex justify-center gap-3">
            {["#DC2626", "#2563EB", "#16A34A", "#9333EA"].map((hex) => (
              <div key={hex} className="w-12 h-12 rounded-lg shadow-md" style={{ backgroundColor: hex }} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
