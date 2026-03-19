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

const COLOR_FAMILIES = [
  { slug: "white", label: "White" },
  { slug: "off-white", label: "Off-White" },
  { slug: "gray", label: "Gray" },
  { slug: "beige", label: "Beige" },
  { slug: "blue", label: "Blue" },
  { slug: "green", label: "Green" },
  { slug: "red", label: "Red" },
  { slug: "yellow", label: "Yellow" },
  { slug: "brown", label: "Brown" },
  { slug: "black", label: "Black" },
];

function BrowseSection() {
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Browse by Brand</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {TOP_BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700">Browse by Color Family</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {COLOR_FAMILIES.map((family) => (
            <Link
              key={family.slug}
              href={`/colors/family/${family.slug}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {family.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function PopularSearches({
  onSelect,
}: {
  onSelect: (term: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700">Popular Searches</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSelect(term)}
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-colors cursor-pointer"
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
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      const items = data.results ?? [];
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search API debounce: 300ms
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Tracking debounce: 1.5s of inactivity
  useEffect(() => {
    if (trackingTimerRef.current) {
      clearTimeout(trackingTimerRef.current);
    }

    if (query.length >= 2) {
      trackingTimerRef.current = setTimeout(() => {
        // Fire tracking with current results count
        // We read results from the DOM-visible state at tracking time
        trackColorSearch(query, results.length);
      }, 1500);
    }

    return () => {
      if (trackingTimerRef.current) {
        clearTimeout(trackingTimerRef.current);
      }
    };
    // Include results.length so tracking fires with accurate count after search completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fire tracking when results arrive (if tracking timer already elapsed, this is a no-op;
  // if still pending, the timer will fire with the updated count)
  const latestResultsRef = useRef(results.length);
  latestResultsRef.current = results.length;

  const handlePopularSearchSelect = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const showEmptyState = !loading && !hasSearched && query.length < 2;
  const showNoResults = !loading && hasSearched && results.length === 0 && query.length >= 2;
  const showResults = !loading && results.length > 0;

  return (
    <div className="mt-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try 'Agreeable Gray', 'SW 7029', or '#D6D0C4'..."
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg text-gray-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        autoFocus
      />

      {loading && (
        <p className="mt-6 text-center text-gray-500">Searching...</p>
      )}

      {showResults && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-gray-500">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
        <div className="mt-8 space-y-6">
          <PopularSearches onSelect={handlePopularSearchSelect} />
          <BrowseSection />
        </div>
      )}

      {showNoResults && (
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <p className="text-gray-700">
              No colors found for &quot;{query}&quot;
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Check your spelling, or try searching by color number (e.g. &quot;SW
              7029&quot;) or hex code (e.g. &quot;#D6D0C4&quot;).
            </p>
          </div>
          <PopularSearches onSelect={handlePopularSearchSelect} />
          <BrowseSection />
        </div>
      )}
    </div>
  );
}
