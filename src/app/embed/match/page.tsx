import type { Metadata } from "next";
import { MatchWidget } from "./match-widget";
import { getBrandBySlug } from "@/lib/queries";
import { resolveEmbedBrand, type EmbedBrand } from "@/lib/embed-brand";

// The widget is iframe content, not a destination page: keep it out of the index.
// (The /embed landing page is the indexable surface.) frame-ancestors is loosened
// to `*` for /embed/* in next.config.ts so other sites can embed this.
// The canonical stays on the bare URL even with ?brand=.
export const metadata: Metadata = {
  title: "Cross-brand paint color matcher",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.paintcolorhq.com/embed/match" },
};

// Optional ?brand=<slug> preset. Unknown slugs (or a lookup failure) fall back
// to the default widget.
async function lookupBrand(raw: string | string[] | undefined): Promise<EmbedBrand | null> {
  const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
  if (!slug || !/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  try {
    const b = await getBrandBySlug(slug);
    return b ? resolveEmbedBrand(slug, [{ slug: b.slug, name: b.name }]) : null;
  } catch {
    return null;
  }
}

export default async function EmbedMatchPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string | string[] }>;
}) {
  const { brand } = await searchParams;
  const preset = await lookupBrand(brand);
  return (
    <main id="main-content" className="h-screen w-screen overflow-hidden bg-white">
      <MatchWidget brand={preset} />
    </main>
  );
}
