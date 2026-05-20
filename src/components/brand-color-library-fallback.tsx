import Link from "next/link";
import { ColorCard } from "./color-card";

interface BrandColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number?: string | null;
}

interface FamilyOption {
  name: string;
  hex: string;
  border?: boolean;
}

interface Props {
  brandSlug: string;
  brandName: string;
  families: FamilyOption[];
  initialColors: BrandColor[];
  initialTotalCount: number;
}

const UNDERTONE_COLORS: Record<string, string> = {
  warm: "#E8B87D",
  cool: "#7DA8CC",
  neutral: "#B8B4AC",
};

const PER_PAGE = 60;

// Server-rendered fallback for BrandColorLibrary. Renders the unfiltered
// page-1 state with non-interactive (Link-only) filter pills. This is
// what Googlebot sees — the color grid and filter links must be present
// here so the canonical /brands/[brandSlug] URL serves complete content
// without waiting for client hydration.
export function BrandColorLibraryFallback({
  brandSlug,
  brandName,
  families,
  initialColors,
  initialTotalCount,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(initialTotalCount / PER_PAGE));

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            {brandName} Color Library
          </h2>
          <p className="text-outline mt-2">
            {initialTotalCount.toLocaleString()} colors.
          </p>
        </div>
      </div>

      {/* Family filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="rounded-full px-4 py-2 text-sm font-headline font-bold bg-primary text-on-primary">
          All
        </span>
        {families.map((f) => (
          <Link
            key={f.name}
            href={`/brands/${brandSlug}?family=${f.name}`}
            className="rounded-full px-4 py-2 text-sm font-headline font-bold capitalize bg-surface-container-lowest text-on-surface-variant hover:text-primary transition-all flex items-center gap-2"
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 ${f.border ? "border border-outline-variant/30" : ""}`}
              style={{ backgroundColor: f.hex }}
            />
            {f.name}
          </Link>
        ))}
      </div>

      {/* Undertone filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <span className="rounded-full px-4 py-2 text-sm bg-secondary text-on-secondary font-bold">
          All Undertones
        </span>
        {(["warm", "cool", "neutral"] as const).map((tone) => (
          <Link
            key={tone}
            href={`/brands/${brandSlug}?undertone=${tone}`}
            className="rounded-full px-4 py-2 text-sm capitalize bg-surface-container-lowest text-on-surface-variant hover:text-secondary transition-all flex items-center gap-2"
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full shrink-0"
              style={{ backgroundColor: UNDERTONE_COLORS[tone] }}
            />
            {tone}
          </Link>
        ))}
      </div>

      {/* Color grid */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {initialColors.map((color) => (
          <ColorCard
            key={color.id}
            name={color.name}
            hex={color.hex}
            brandName={brandName}
            brandSlug={brandSlug}
            colorSlug={color.slug}
            colorNumber={color.color_number ?? null}
          />
        ))}
      </div>

      {/* Basic pagination — page 2 link if more colors exist */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2">
          <Link
            href={`/brands/${brandSlug}?page=2`}
            className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors"
          >
            Next
          </Link>
        </nav>
      )}
    </>
  );
}
