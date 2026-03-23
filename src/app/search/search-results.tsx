"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ColorCard } from "@/components/color-card";
import type { ColorWithBrand } from "@/lib/types";
import { trackColorSearch } from "@/lib/analytics";

const POPULAR_SEARCHES = [
  "Agreeable Gray",
  "Simply White",
  "Hale Navy",
  "Accessible Beige",
  "Alabaster",
  "Revere Pewter",
  "Classic Gray",
  "Iron Ore",
  "Repose Gray",
  "Naval",
];

const TOP_BRANDS = [
  { slug: "sherwin-williams", name: "Sherwin-Williams" },
  { slug: "benjamin-moore", name: "Benjamin Moore" },
  { slug: "behr", name: "Behr" },
  { slug: "valspar", name: "Valspar" },
  { slug: "ppg", name: "PPG" },
];

const COLOR_FAMILIES: { slug: string; label: string; hex: string; border?: boolean }[] = [
  { slug: "white", label: "White", hex: "#FFFFFF", border: true },
  { slug: "off-white", label: "Off-White", hex: "#F5F0E8", border: true },
  { slug: "gray", label: "Gray", hex: "#9CA3AF" },
  { slug: "beige", label: "Beige", hex: "#D4C5A9" },
  { slug: "blue", label: "Blue", hex: "#2563EB" },
  { slug: "green", label: "Green", hex: "#16A34A" },
  { slug: "red", label: "Red", hex: "#DC2626" },
  { slug: "yellow", label: "Yellow", hex: "#EAB308" },
  { slug: "brown", label: "Brown", hex: "#8B6914" },
  { slug: "black", label: "Black", hex: "#1F2937" },
];

function BrowseSection() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-headline font-bold text-on-surface mb-4">Browse by Brand</h3>
        <div className="flex flex-wrap gap-2">
          {TOP_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-headline font-bold text-on-surface-variant hover:text-primary transition-all"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-headline font-bold text-on-surface mb-4">Browse by Color Family</h3>
        <div className="flex flex-wrap gap-2">
          {COLOR_FAMILIES.map((family) => (
            <Link
              key={family.slug}
              href={`/colors/family/${family.slug}`}
              className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-all"
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 ${family.border ? "border border-outline-variant/30" : ""}`}
                style={{ backgroundColor: family.hex }}
              />
              {family.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function PopularSearches({ onSelect }: { onSelect: (term: string) => void }) {
  return (
    <div>
      <h3 className="font-headline font-bold text-on-surface mb-4">Popular Searches</h3>
      <div className="flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSelect(term)}
            className="rounded-full bg-primary-fixed px-4 py-2 text-sm font-headline font-bold text-primary hover:bg-primary-fixed-dim transition-colors cursor-pointer"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchResults() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<ColorWithBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const trackingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (trackingTimerRef.current) clearTimeout(trackingTimerRef.current);
    if (query.length >= 2) {
      trackingTimerRef.current = setTimeout(() => {
        trackColorSearch(query, results.length);
      }, 1500);
    }
    return () => { if (trackingTimerRef.current) clearTimeout(trackingTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const latestResultsRef = useRef(results.length);
  latestResultsRef.current = results.length;

  const handlePopularSearchSelect = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const showEmptyState = !loading && !hasSearched && query.length < 2;
  const showNoResults = !loading && hasSearched && results.length === 0 && query.length >= 2;
  const showResults = !loading && results.length > 0;

  return (
    <div>
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try 'Agreeable Gray', 'SW 7029', or '#D6D0C4'..."
          className="w-full rounded-xl bg-surface-container-lowest pl-14 pr-6 py-5 text-lg text-on-surface shadow-lg border border-outline-variant/15 placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          autoFocus
        />
      </div>

      {loading && (
        <p className="mt-8 text-center text-on-surface-variant">Searching...</p>
      )}

      {showResults && (
        <div className="mt-10">
          <p className="mb-6 text-sm text-on-surface-variant">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((color) => (
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
        </div>
      )}

      {showEmptyState && (
        <div className="mt-12 space-y-10">
          <PopularSearches onSelect={handlePopularSearchSelect} />
          <BrowseSection />
        </div>
      )}

      {showNoResults && (
        <div className="mt-12 space-y-10">
          <div className="text-center bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-10">
            <p className="font-headline font-bold text-on-surface text-lg">
              No colors found for &quot;{query}&quot;
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Check your spelling, or try searching by color number (e.g. &quot;SW 7029&quot;) or hex code (e.g. &quot;#D6D0C4&quot;).
            </p>
          </div>
          <PopularSearches onSelect={handlePopularSearchSelect} />
          <BrowseSection />
        </div>
      )}
    </div>
  );
}
