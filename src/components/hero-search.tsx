"use client";

import { useState, useEffect, useCallback } from "react";
import { ColorCard } from "@/components/color-card";
import { trackEvent } from "@/lib/analytics";
import type { ColorWithBrand } from "@/lib/types";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ColorWithBrand[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const searchResults = data.results ?? [];
      setResults(searchResults);

      // Track hero search
      trackEvent("color_search", {
        search_term: q,
        result_count: String(searchResults.length),
        source: "homepage_hero",
      });
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

  const hasResults = loading || results.length > 0 || (query.length >= 2 && !loading);

  return (
    <>
      <div className="w-full">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by color name, number, or hex code..."
            className="w-full rounded-xl bg-surface-container-lowest pl-12 pr-4 py-4 text-lg text-on-surface shadow-lg border border-outline-variant/15 placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <p className="mt-3 text-sm text-on-surface-variant">
          Try &quot;Agreeable Gray&quot;, &quot;SW 7029&quot;, or &quot;#D1CBC1&quot;
        </p>
      </div>

      {hasResults && (
        <div className="mt-8">
          {loading && (
            <p className="text-center text-on-surface-variant">Searching...</p>
          )}

          {!loading && results.length > 0 && (
            <div>
              <p className="mb-4 text-sm text-on-surface-variant">
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

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-center text-on-surface-variant">
              No colors found for &quot;{query}&quot;
            </p>
          )}
        </div>
      )}
    </>
  );
}
