"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ColorCard } from "@/components/color-card";
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

  const hasResults = loading || results.length > 0 || (query.length >= 2 && !loading);

  return (
    <>
      <section className="relative h-[480px] w-full overflow-hidden">
        <Image
          src="/hero.webp"
          alt="Beautifully painted room interior"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Find Your Perfect Paint Color Match
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            Browse 25,000+ paint colors across top brands. Find the closest
            equivalent in Sherwin-Williams, Benjamin Moore, Behr, and more.
          </p>
          <div className="mx-auto mt-10 w-full max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by color name, number, or hex code..."
              className="w-full rounded-lg border border-white/30 bg-white/95 px-4 py-3 text-lg text-gray-900 shadow-lg backdrop-blur placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </section>

      {hasResults && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading && (
            <p className="text-center text-gray-500">Searching...</p>
          )}

          {!loading && results.length > 0 && (
            <div>
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
            <p className="text-center text-gray-500">
              No colors found for &quot;{query}&quot;
            </p>
          )}
        </div>
      )}
    </>
  );
}
