"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ColorCard } from "./color-card";

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface FamilyColor {
  id: string;
  name: string;
  slug: string;
  hex: string;
  color_number?: string | null;
  brand: { name: string; slug: string };
}

interface Props {
  familySlug: string;
  familyName: string;
  brands: Brand[];
  initialColors: FamilyColor[];
  initialTotalCount: number;
}

const UNDERTONE_COLORS: Record<string, string> = {
  warm: "#E8B87D",
  cool: "#7DA8CC",
  neutral: "#B8B4AC",
};

const PER_PAGE = 60;

export function FamilyColorLibrary({
  familySlug,
  familyName,
  brands,
  initialColors,
  initialTotalCount,
}: Props) {
  const searchParams = useSearchParams();
  const brandFilter = searchParams.get("brand") ?? "";
  const undertoneFilter = searchParams.get("undertone") ?? "";
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10) || 1;
  const currentPage = Math.max(1, pageParam);

  const hasFilters = !!brandFilter || !!undertoneFilter || currentPage > 1;
  const signature = `${brandFilter}|${undertoneFilter}|${currentPage}`;

  const [fetched, setFetched] = useState<{
    colors: FamilyColor[];
    total: number;
    signature: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Display the fetched data only when its signature matches the current
  // URL filters; otherwise fall back to the server-rendered initial data.
  // This avoids syncing initial-state into local state via useEffect (which
  // would cascade unnecessary re-renders).
  const usingFetched = hasFilters && fetched?.signature === signature;
  const colors = usingFetched ? fetched.colors : initialColors;
  const totalCount = usingFetched ? fetched.total : initialTotalCount;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  // setLoading + setFetched here reflect real async side-effects (kicking off
  // a fetch and reflecting its lifecycle), not derived state syncing.
  // The react-hooks/set-state-in-effect rule treats all in-effect updates
  // as suspect, so we suppress for this specific block.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hasFilters) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const p = new URLSearchParams();
    if (brandFilter) p.set("brand", brandFilter);
    if (undertoneFilter) p.set("undertone", undertoneFilter);
    if (currentPage > 1) p.set("page", String(currentPage));

    let cancelled = false;
    fetch(`/api/family/${familySlug}/colors?${p.toString()}`)
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
  }, [familySlug, hasFilters, signature, brandFilter, undertoneFilter, currentPage]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function makeHref(opts: {
    brand?: string | null;
    undertone?: string | null;
    page?: number;
  }) {
    const p = new URLSearchParams();
    const b = opts.brand !== undefined ? opts.brand : brandFilter;
    const u = opts.undertone !== undefined ? opts.undertone : undertoneFilter;
    const pg = opts.page !== undefined ? opts.page : currentPage;
    if (b) p.set("brand", b);
    if (u) p.set("undertone", u);
    if (pg && pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/colors/family/${familySlug}${qs ? `?${qs}` : ""}`;
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

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            {familyName} Color Library
          </h2>
          <p className="text-outline mt-2">
            {totalCount.toLocaleString()} colors
            {brandFilter ? ` from ${brandFilter}` : ""}
            {undertoneFilter ? ` · ${undertoneFilter} undertone` : ""}.
          </p>
        </div>
      </div>

      {/* Brand filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={makeHref({ brand: null, page: 1 })}
          className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${!brandFilter ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
        >
          All Brands
        </Link>
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={makeHref({ brand: b.slug, page: 1 })}
            className={`rounded-full px-4 py-2 text-sm font-headline font-bold transition-all ${brandFilter === b.slug ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"}`}
          >
            {b.name}
          </Link>
        ))}
      </div>

      {/* Undertone filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <Link
          href={makeHref({ undertone: null, page: 1 })}
          className={`rounded-full px-4 py-2 text-sm transition-all flex items-center gap-2 ${!undertoneFilter ? "bg-secondary text-on-secondary font-bold" : "bg-surface-container-lowest text-on-surface-variant hover:text-secondary"}`}
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
            brandName={color.brand.name}
            brandSlug={color.brand.slug}
            colorSlug={color.slug}
            colorNumber={color.color_number}
          />
        ))}
      </div>

      {colors.length === 0 && !loading && (
        <p className="mt-12 text-center text-on-surface-variant">
          No {familyName.toLowerCase()} colors found
          {brandFilter ? ` from this brand` : ""}.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={makeHref({ page: currentPage - 1 })}
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
                className={`rounded-xl px-4 py-2.5 text-sm font-headline font-bold transition-all ${page === currentPage ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 hover:text-primary"}`}
              >
                {page}
              </Link>
            ),
          )}
          {currentPage < totalPages && (
            <Link
              href={makeHref({ page: currentPage + 1 })}
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
