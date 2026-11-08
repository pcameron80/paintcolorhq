import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BrandColorIndex } from "@/components/brand-color-index";
import { TrackPage } from "@/components/track-page";
import { getBrandBySlug, getAllBrands, getBrandColorIndex } from "@/lib/queries";
import { getBrandContent } from "@/lib/brand-content";

// Every indexable color of one brand by name, A to Z, so each color page is
// two links from its brand page instead of up to 96 pagination pages deep.
// Its own page, not a section of the brand page: on the #339 preview the
// in-page index took Behr's brand page from 27 KB to 199 KB of HTML and its
// Lighthouse mobile LCP from 2.3 s to 3.1 s.

export const revalidate = 2592000; // 30d, like the brand page

// Behr's index takes six paged queries; it changes only on a data import.
const getCachedBrandColorIndex = unstable_cache(
  (brandId: string) => getBrandColorIndex(brandId),
  ["brand-color-index"],
  { revalidate: 86400 },
);

interface PageProps {
  params: Promise<{ brandSlug: string }>;
}

export async function generateStaticParams() {
  const brands = await getAllBrands();
  return brands.map((b) => ({ brandSlug: b.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Brand Not Found" };
  const colors = await getCachedBrandColorIndex(brand.id);
  const count = colors.length.toLocaleString();
  const colorsWord = /\bpaint(s)?\b/i.test(brand.name) ? "Colors" : "Paint Colors";
  const url = `https://www.paintcolorhq.com/brands/${brandSlug}/colors-a-z`;
  const title = `${brand.name} ${colorsWord} A to Z: All ${count} Names`;
  const description = `Every ${brand.name} color by name, A to Z. ${count} colors, each linking to its hex code, LRV, undertone and closest matches in other brands.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // Same rule as the brand page: brands without editorial content stay out of the index.
    ...(!getBrandContent(brandSlug) && { robots: { index: false, follow: true } }),
    openGraph: { title, description, url },
  };
}

export default async function BrandColorsAtoZPage({ params }: PageProps) {
  const { brandSlug } = await params;
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();
  const colors = await getCachedBrandColorIndex(brand.id);
  if (colors.length === 0) notFound();

  return (
    <div className="min-h-screen bg-surface">
      <TrackPage eventName="page_view_enriched" params={{ page_type: "brand_a_z", color_brand: brandSlug }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.paintcolorhq.com" },
          { "@type": "ListItem", position: 2, name: "Brands", item: "https://www.paintcolorhq.com/brands" },
          { "@type": "ListItem", position: 3, name: brand.name, item: `https://www.paintcolorhq.com/brands/${brandSlug}` },
          { "@type": "ListItem", position: 4, name: `${brand.name} Colors A to Z`, item: `https://www.paintcolorhq.com/brands/${brandSlug}/colors-a-z` },
        ],
      }) }} />
      <Header />
      <section className="pt-24 px-6 md:px-12 pb-6">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm text-on-surface-variant mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/brands" className="hover:text-primary transition-colors">Brands</Link>
            <span className="mx-2">/</span>
            <Link href={`/brands/${brandSlug}`} className="hover:text-primary transition-colors">{brand.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">A to Z</span>
          </nav>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface">{brand.name} Colors A to Z</h1>
          <p className="mt-4 text-on-surface-variant max-w-2xl leading-relaxed">
            All {colors.length.toLocaleString()} {brand.name} colors by name. Open any color for its hex code, LRV, undertone and closest matches in other brands, or browse them as swatches on the <Link href={`/brands/${brandSlug}`} className="text-primary underline-offset-4 hover:underline">{brand.name} color chart</Link>.
          </p>
        </div>
      </section>
      <BrandColorIndex brandSlug={brandSlug} colors={colors} />
      <Footer />
    </div>
  );
}
