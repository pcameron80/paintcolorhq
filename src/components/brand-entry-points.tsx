import Link from "next/link";
import { formatLrv, familyPlural, type FamilyCount } from "@/lib/brand-entry";

// Server-rendered entry points above the A to Z library. No client JS: tiles are
// plain links. Family tiles link to the existing ?family= listing, which
// canonicalizes to the brand page (see catalogCanonical), so they add no new
// indexable URLs.

interface TileColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number: string | null;
  lrv: number | string | null;
}

interface CotyTile {
  year: number;
  name: string;
  code: string;
  colorSlug: string | null;
  hex: string | null;
}

interface Props {
  brandSlug: string;
  brandName: string;
  mostViewed: TileColor[];
  mostViewedWindow: string;
  coty: CotyTile[];
  families: (FamilyCount & { hex: string; border?: boolean })[];
}

export function BrandEntryPoints({ brandSlug, brandName, mostViewed, mostViewedWindow, coty, families }: Props) {
  if (mostViewed.length === 0 && coty.length === 0 && families.length === 0) return null;
  return (
    <section id="start" className="px-6 pb-12 md:px-12 scroll-mt-20">
      <div className="mx-auto max-w-7xl space-y-12">
        {mostViewed.length > 0 && (
          <div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
              Most viewed {brandName} colors on Paint Color HQ
            </h2>
            <p className="mt-1 mb-5 text-sm text-on-surface-variant">
              Ranked by pageviews on this site, {mostViewedWindow}. That is our own traffic, not sales data.
            </p>
            {/* Phones show the first 8 until "Show all" is ticked (CSS only, see globals.css). */}
            <input id="mv-all" type="checkbox" className="mv-toggle sr-only" />
            <ol className="mv-list grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {mostViewed.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/colors/${brandSlug}/${c.slug}`}
                    className="group block overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest hover:shadow-md"
                  >
                    <span className="block h-14 w-full border-b border-black/10" style={{ backgroundColor: c.hex }} />
                    <span className="block p-2.5">
                      <span className="block text-sm font-bold leading-tight text-on-surface group-hover:text-primary">{c.name}</span>
                      <span className="mt-0.5 block text-xs text-on-surface-variant">
                        {c.color_number ? `${c.color_number} · ` : ""}
                        {c.lrv !== null && c.lrv !== undefined ? `LRV ${formatLrv(c.lrv)}` : c.hex.toUpperCase()}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {mostViewed.length > 8 && (
              <label htmlFor="mv-all" className="mt-4 inline-block cursor-pointer rounded-full border border-outline-variant/40 px-5 py-2 text-sm font-bold text-primary hover:bg-surface-container-low md:hidden">
                <span className="mv-more">Show all {mostViewed.length}</span>
                <span className="mv-less">Show fewer</span>
              </label>
            )}
          </div>
        )}

        {coty.length > 0 && (
          <div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
              {brandName} Colors of the Year
            </h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {coty.map((c) => {
                const inner = (
                  <>
                    {c.hex && <span className="h-8 w-8 shrink-0 rounded-md border border-black/10" style={{ backgroundColor: c.hex }} />}
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{c.year}</span>
                      <span className="block text-sm font-bold text-on-surface">{c.name} <span className="font-normal text-on-surface-variant">{c.code}</span></span>
                    </span>
                  </>
                );
                const cls = "flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2";
                return (
                  <li key={`${c.year}-${c.code}`}>
                    {c.colorSlug ? (
                      <Link href={`/colors/${brandSlug}/${c.colorSlug}`} className={`${cls} hover:shadow-md`}>{inner}</Link>
                    ) : (
                      <div className={cls}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm">
              <Link href="/color-of-the-year" className="font-bold text-primary underline-offset-4 hover:underline">
                Every brand&apos;s Color of the Year, matched across brands &rarr;
              </Link>
            </p>
          </div>
        )}

        {families.length > 0 && (
          <div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
              Browse {brandName} colors by family
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {families.map((f) => (
                <li key={f.name}>
                  <Link
                    href={`/brands/${brandSlug}?family=${f.name}#colors`}
                    className="flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 text-sm font-bold text-on-surface hover:text-primary hover:shadow-md"
                  >
                    <span
                      className={`h-5 w-5 shrink-0 rounded-full ${f.border ? "border border-outline-variant/40" : ""}`}
                      style={{ backgroundColor: f.hex }}
                    />
                    <span>
                      {brandName} {familyPlural(f.name)}
                      <span className="ml-1 font-normal text-on-surface-variant">({f.count.toLocaleString("en-US")})</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
