import Link from "next/link";
import type { FamilyDemandColor } from "@/lib/queries";

/**
 * "Most-searched {family} paint colors" block on family pages. Order comes
 * from the static, dated demand list in src/lib/family-demand.ts; the card
 * data (swatch, name, brand, code, LRV) is live from the database. Cards show
 * data only, no descriptions.
 */
export function FamilyMostSearched({ familyLabel, colors }: { familyLabel: string; colors: FamilyDemandColor[] }) {
  if (colors.length === 0) return null;
  return (
    <section id="most-searched" className="py-16 px-6 md:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-2">
          Most-searched {familyLabel} paint colors
        </h2>
        <p className="text-sm text-on-surface-variant mb-8">Ranked by US monthly searches for each color name, October 2026.</p>
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {colors.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/colors/${c.brand.slug}/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-lowest transition-all hover:shadow-md"
              >
                <span className="block h-24 w-full border-b border-black/5" style={{ backgroundColor: c.hex }} />
                <span className="flex flex-1 flex-col p-4">
                  <span className="text-xs font-bold text-outline">#{i + 1}</span>
                  <span className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors break-words">{c.name}</span>
                  <span className="mt-1 text-xs text-on-surface-variant">{c.brand.name}{c.color_number ? ` · ${c.color_number}` : ""}</span>
                  {c.lrv != null && <span className="mt-1 text-xs text-on-surface-variant">LRV {Number(c.lrv).toFixed(0)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
