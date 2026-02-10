"use client";

import { useState, useEffect, useCallback } from "react";
import { ColorCard } from "@/components/color-card";
import type { ColorWithBrand } from "@/lib/types";

export function SearchResults() {
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
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`
      );
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

  return (
    <div className="mt-6">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try 'Agreeable Gray', 'SW 7029', or '#D6D0C4'..."
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        autoFocus
      />

      {loading && (
        <p className="mt-6 text-center text-gray-500">Searching...</p>
      )}

      {!loading && results.length > 0 && (
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

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="mt-12 text-center text-gray-500">
          No colors found for &quot;{query}&quot;
        </p>
      )}
    </div>
  );
}
