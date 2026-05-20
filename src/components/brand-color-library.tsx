"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

export function BrandColorLibrary({
  brandSlug,
  brandName,
  families,
  initialColors,
  initialTotalCount,
}: Props) {
  const searchParams = useSearchParams();
  const familyFilter = searchParams.get("family") ?? "";
  const undertoneFilter = searchParams.get("undertone") ?? "";
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const currentPage = Math.max(1, pageParam);

  const hasFilters = !!familyFilter || !!undertoneFilter || currentPage > 1;
  const signature = `${familyFilter}|${undertoneFilter}|${currentPage}`;

  const [fetched, setFetched] = useState<{
    colors: BrandColor[];
    total: number;
    signature: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Mirror the family-color-library pattern: show fetched data only when its
  // signature matches current URL filters, otherwise fall back to the
  // server-rendered canonical (page 1, no filter) data.
  const usingFetched = hasFilters && fetched?.signature === signature;
  const colors = usingFetched ? fetched.colors : initialColors;
  const totalCount = usingFetched ? fetched.total : initialTotalCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hasFilters) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const p = new URLSearchParams();
    if (familyFilter) p.set("family", familyFilter);
    if (undertoneFilter) p.set("undertone", undertoneFilter);
    if (currentPage > 1) p.set("page", String(currentPage));

    let cancelled = false;
    fetch(`/api/brand/${brandSlug}/colors?${p.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.colors)) {
          setFetched({
            colors: data.colors,
            total: data.totalCount ?? 0,
            signature,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [brandSlug, hasFilters, signature, familyFilter, undertoneFilter, currentPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function makeHref(opts: {
    family?: string | null;
    undertone?: string | null;
    page?: number;
  }) {
    const p = new URLSearchParams();
    const f = opts.family !== undefined ? opts.family : familyFilter;
    const u = opts.undertone !== undefined ? opts.undertone : undertoneFilter;
    const pg = opts.page !== undefined ? opts.page : currentPage;
    if (f) p.set("family", f);
    if (u) p.set("undertone", u);
    if (pg && pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/brands/${brandSlug}${qs ? `?${qs}` : ""}`;
  }

  const pages: (number | "ellipsis")[] = [];
  if (totalPages > 1) {
    const addPage = (n: number) => {
      if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
    };
    addPage(1);
    if (currentPage > 3) pages.push("ellipsis");
    addPage(currentPage - 1);
    addPage(currentPage);
    addPage(currentPage + 1);
    if (currentPage < totalPages - 2) pages.push("ellipsis");
    addPage(totalPages);
  }

  // Pagination ≥ page 3 gets rel="nofollow" (same M4 rule as before the
  // refactor). Brand pages 2+ are noindex; deep pagination just burns
  // crawl budget. Sitemap covers color discovery.
  const nofollowProps = (target: number) =>
    target >= 3 ? { rel: "nofollow" as const } : {};

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            {brandName} Color Library
          </h2>
          <p className="text-outline mt-2">
            {totalCount.toLocaleString()} colors
            {familyFilter ? ` in ${familyFilter}` : ""}
            {undertoneFilter ? ` · ${undertoneFilter} undertone` : ""}.
          </p>
        </div>
      </div>

      {/* Family filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={makeHref({ family: null, page: 1 })}
          className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${!familyFilter ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
        >
          All
        </Link>
        {families.map((f) => (
          <Link
            key={f.name}
            href={makeHref({ family: f.name, page: 1 })}
            className={`rounded-full px-4 py-2 text-sm font-headline font-bold capitalize transition-all flex items-center gap-2 ${familyFilter === f.name ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
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
        <Link
          href={makeHref({ undertone: null, page: 1 })}
          className={`rounded-full px-4 py-2 text-sm transition-all ${!undertoneFilter ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-secondary"}`}
        >
          All Undertones
        </Link>
        {(["warm", "cool", "neutral"] as const).map((tone) => (
          <Link
            key={tone}
            href={makeHref({ undertone: tone, page: 1 })}
            className={`rounded-full px-4 py-2 text-sm capitalize transition-all flex items-center gap-2 ${undertoneFilter === tone ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-secondary"}`}
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
      <div
        className={`grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        {colors.map((color) => (
          <ColorCard
            key={color.id}
            name={color.name}
            hex={color.hex}
            brandName={brandName}
            brandSlug={brandSlug}
            colorSlug={color.slug}
            colorNumber={color.color_number}
          />
        ))}
      </div>

      {colors.length === 0 && !loading && (
        <p className="mt-12 text-center text-on-surface-variant">
          No colors found{familyFilter ? ` in the ${familyFilter} family` : ""}.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={makeHref({ page: currentPage - 1 })}
              {...nofollowProps(currentPage - 1)}
              className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors"
            >
              Previous
            </Link>
          )}
          {pages.map((page, i) =>
            page === "ellipsis" ? (
              <span key={`e${i}`} className="px-2 text-outline">
                ...
              </span>
            ) : (
              <Link
                key={page}
                href={makeHref({ page })}
                {...nofollowProps(page)}
                className={`rounded-xl px-4 py-2.5 text-sm font-headline font-bold transition-all ${page === currentPage ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 hover:text-primary"}`}
              >
                {page}
              </Link>
            ),
          )}
          {currentPage < totalPages && (
            <Link
              href={makeHref({ page: currentPage + 1 })}
              {...nofollowProps(currentPage + 1)}
              className="rounded-xl bg-surface-container-lowest px-5 py-2.5 text-sm font-headline font-bold text-on-surface-variant border border-outline-variant/15 hover:text-primary transition-colors"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
