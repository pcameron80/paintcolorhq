"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import type { ColorWithBrand } from "@/lib/types";

interface Props {
  sourceBrandSlug: string;
  targetBrandSlug: string;
  sourceBrandName: string;
  targetBrandName: string;
}

/**
 * Above-the-fold "jump to your color" search on brand-pair match listing pages.
 * The listing table only surfaces the top matches; this lets a visitor type
 * their specific source-brand color and go straight to its individual match
 * page (the high-converting page type), instead of scrolling the table.
 * Scopes /api/search results to the source brand client-side.
 */
export function MatchColorSearch({ sourceBrandSlug, targetBrandSlug, sourceBrandName, targetBrandName }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ColorWithBrand[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const scoped: ColorWithBrand[] = (data.results ?? []).filter(
          (c: ColorWithBrand) => c.brand?.slug === sourceBrandSlug
        );
        setResults(scoped.slice(0, 6));
        trackEvent("color_search", {
          search_term: q,
          result_count: String(scoped.length),
          source: "match_listing",
        });
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [sourceBrandSlug]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  function goToMatch(color: ColorWithBrand) {
    router.push(`/match/${sourceBrandSlug}/${color.slug}-to-${targetBrandSlug}`);
  }

  const showPanel = query.length >= 2;

  return (
    <div className="mt-6 max-w-xl">
      <label htmlFor="match-color-search" className="block text-sm font-bold text-on-surface mb-2">
        Find your {sourceBrandName} color → its {targetBrandName} match
      </label>
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          id="match-color-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Type a ${sourceBrandName} color name or number…`}
          className="w-full rounded-xl bg-surface-container-lowest pl-12 pr-4 py-3 text-on-surface shadow-sm border border-outline-variant/15 placeholder:text-outline focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {showPanel && (
        <div className="mt-2 rounded-xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
          {loading && <p className="px-4 py-3 text-sm text-on-surface-variant">Searching…</p>}
          {!loading && results.length > 0 && (
            <ul className="divide-y divide-outline-variant/10">
              {results.map((color) => (
                <li key={color.id}>
                  <button
                    type="button"
                    onClick={() => goToMatch(color)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-container-low group"
                  >
                    <span className="h-8 w-8 rounded-md shrink-0 border border-outline-variant/20" style={{ backgroundColor: color.hex }} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-on-surface group-hover:text-primary transition-colors truncate">{color.name}</span>
                      {color.color_number && <span className="block text-xs text-outline">{color.color_number}</span>}
                    </span>
                    <span className="text-primary text-sm font-bold shrink-0">View match →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-on-surface-variant">
              No {sourceBrandName} colors found for &quot;{query}&quot; — try a different name or number.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
