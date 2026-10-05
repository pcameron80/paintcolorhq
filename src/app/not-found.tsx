import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSearch } from "@/components/hero-search";
import { getAllBrands } from "@/lib/queries";
import type { Brand } from "@/lib/types";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

// The "chip" motif mirrors a paint fan deck: the missing page is the one blank
// chip in an otherwise real strip. #404040 is a real hex, so the joke is honest.
const CHIPS = [
  { hex: "#E8E2D7", label: "Found" },
  { hex: "#B4C5FF", label: "Found" },
  { hex: null, label: "Missing" },
  { hex: "#8EA68B", label: "Found" },
];

const QUICK_LINKS = [
  { href: "/compare", title: "Compare two colors", body: "See how close any two paints really are." },
  { href: "/tools/color-identifier", title: "Identify a color from a photo", body: "Upload a picture, get the nearest paints." },
  { href: "/colors", title: "Browse every color family", body: "Whites, grays, greens, blues and more." },
  { href: "/blog", title: "Read the color guides", body: "Shortlists by room, brand and undertone." },
];

async function loadBrands(): Promise<Brand[]> {
  // A 404 must never fail because the database is unreachable.
  try {
    return await getAllBrands();
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const brands = await loadBrands();

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-end gap-2 sm:gap-3" aria-hidden="true">
            {CHIPS.map((chip) => (
              <div
                key={chip.hex ?? "missing"}
                className={`flex w-16 flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm sm:w-24 ${chip.hex ? "" : "-translate-y-3 rotate-3 shadow-lg ring-1 ring-outline-variant"}`}
              >
                {chip.hex ? (
                  <div className="h-20 sm:h-28" style={{ backgroundColor: chip.hex }} />
                ) : (
                  <div className="flex h-20 items-center justify-center bg-[repeating-linear-gradient(45deg,var(--surface-container)_0_8px,var(--surface-container-lowest)_8px_16px)] sm:h-28">
                    <span className="font-headline text-2xl font-extrabold text-outline sm:text-3xl">?</span>
                  </div>
                )}
                <span className="truncate px-1.5 py-1.5 text-left text-[10px] font-medium text-on-surface-variant sm:text-xs">
                  {chip.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-10 font-mono text-sm text-outline">Error 404 · #404040</p>
          <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-tighter text-on-surface sm:text-5xl">
            This shade isn&apos;t in our deck
          </h1>
          <p className="mt-4 max-w-xl text-lg text-on-surface-variant">
            The page may have moved, or the color was renamed or discontinued by its maker. Search the catalog
            by name, number or hex code to find it or its closest match.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <HeroSearch />
        </div>

        <section className="mt-16">
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Or start somewhere useful</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl bg-surface-container-lowest p-5 transition-shadow hover:shadow-md"
              >
                <span className="font-headline text-base font-bold text-on-surface group-hover:text-primary">
                  {link.title}
                </span>
                <span className="mt-1 block text-sm text-on-surface-variant">{link.body}</span>
              </Link>
            ))}
          </div>
        </section>

        {brands.length > 0 && (
          <section className="mt-16">
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">Browse by brand</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/brands/${brand.slug}`}
                  className="rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface ring-1 ring-outline-variant/40 transition-colors hover:bg-primary hover:text-on-primary"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
