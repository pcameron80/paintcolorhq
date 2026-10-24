"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { closenessLabel } from "@/lib/closeness";
import { formatLrv, hexToRgbString, lrvSourceLabel, parseColorInput } from "@/lib/color-input";
import { trackToolEngagement } from "@/lib/analytics";
import type { HexNearestBrandResult } from "@/lib/hex-nearest";

interface ApiResult {
  brandName: string;
  brandSlug: string;
  match: {
    name: string;
    colorNumber: string | null;
    hex: string;
    colorSlug: string;
    deltaE: number;
    lrv: number | null;
    lrvSource: "manufacturer" | "computed" | null;
  } | null;
}

function fromApi(results: ApiResult[]): HexNearestBrandResult[] {
  return results.map((r) => ({
    brandName: r.brandName,
    brandSlug: r.brandSlug,
    match: r.match
      ? {
          brandName: r.brandName,
          brandSlug: r.brandSlug,
          id: `${r.brandSlug}/${r.match.colorSlug}`,
          name: r.match.name,
          colorSlug: r.match.colorSlug,
          colorNumber: r.match.colorNumber,
          hex: r.match.hex,
          deltaE: r.match.deltaE,
          lrv: r.match.lrv,
          lrvSource: r.match.lrvSource,
        }
      : null,
  }));
}

export function HexToPaint({
  initialHex,
  initialResults,
  initialError,
}: {
  initialHex: string;
  initialResults: HexNearestBrandResult[];
  initialError?: string | null;
}) {
  const [input, setInput] = useState(initialHex.toUpperCase());
  const [hex, setHex] = useState(initialHex);
  const [results, setResults] = useState(initialResults);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    trackToolEngagement("hex-to-paint-color", "open");
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  async function lookup(next: string) {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hex-nearest?hex=${next.slice(1)}`);
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { results: ApiResult[] };
      if (id !== requestId.current) return; // a newer lookup is in flight
      setHex(next);
      setResults(fromApi(body.results));
      // Shareable URL without a navigation. ?hex= pages are noindex,follow.
      window.history.replaceState(null, "", `?hex=${next.slice(1)}`);
      trackToolEngagement("hex-to-paint-color", "complete", next);
    } catch {
      if (id === requestId.current) setError("Something went wrong looking up that color. Please try again.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseColorInput(input);
    if (!parsed) {
      setError("Enter a hex code like #A8A29A or an RGB value like 168, 162, 154.");
      return;
    }
    trackToolEngagement("hex-to-paint-color", "use", parsed);
    setInput(parsed.toUpperCase());
    void lookup(parsed);
  }

  function pick(value: string) {
    const parsed = parseColorInput(value);
    if (!parsed) return;
    setInput(parsed.toUpperCase());
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void lookup(parsed), 350);
  }

  const found = results.filter((r) => r.match);

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="block text-sm font-semibold text-on-surface mb-1.5">Hex or RGB code</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#A8A29A or 168, 162, 154"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-mono text-base text-on-surface focus:border-primary focus:outline-none"
          />
        </label>
        <div className="flex gap-3">
          <label className="shrink-0">
            <span className="sr-only">Pick a color</span>
            <input
              type="color"
              value={hex}
              onChange={(e) => pick(e.target.value)}
              className="h-[50px] w-[56px] cursor-pointer rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-1"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Matching..." : "Find paint colors"}
          </button>
        </div>
      </form>
      {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}

      <div className="mt-8 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 rounded-xl border border-outline-variant/30" style={{ backgroundColor: hex }} />
        <div>
          <p className="text-sm text-on-surface-variant">Your color</p>
          <p className="font-mono text-lg font-semibold text-on-surface">{hex.toUpperCase()}</p>
          <p className="font-mono text-sm text-on-surface-variant">{hexToRgbString(hex)}</p>
        </div>
      </div>

      <div className={`mt-6 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest transition-opacity ${loading ? "opacity-60" : ""}`} aria-live="polite">
        <div className="hidden sm:grid grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)] gap-4 border-b border-outline-variant/20 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-outline">
          <span>Brand</span>
          <span>Closest current color</span>
          <span>Closeness</span>
          <span className="text-right">LRV</span>
        </div>
        <ul>
          {results.map(({ brandName, brandSlug, match }) => (
            <li key={brandSlug} className="border-b border-outline-variant/10 last:border-b-0">
              {match ? (
                <Link
                  href={`/colors/${match.brandSlug}/${match.colorSlug}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-surface-container-low"
                >
                  <span className="hidden sm:block text-sm font-semibold text-on-surface">{brandName}</span>
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="h-10 w-10 shrink-0 rounded-lg border border-outline-variant/30" style={{ backgroundColor: match.hex }} />
                    <span className="hidden sm:block min-w-0">
                      <span className="block truncate font-medium text-on-surface">{match.name}</span>
                      <span className="block text-xs text-on-surface-variant">
                        {match.colorNumber ? `${match.colorNumber} · ` : ""}{match.hex.toUpperCase()}
                      </span>
                    </span>
                  </span>
                  {/* Mobile: one stacked cell beside the swatch. */}
                  <span className="sm:hidden min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-outline">{brandName}</span>
                    <span className="block truncate font-medium text-on-surface">{match.name}</span>
                    <span className="block text-xs text-on-surface-variant">
                      {match.colorNumber ? `${match.colorNumber} · ` : ""}{closenessLabel(match.deltaE)}
                      {formatLrv(match.lrv) ? ` · LRV ${formatLrv(match.lrv)}` : ""}
                    </span>
                  </span>
                  <span className="hidden sm:block text-sm text-on-surface">{closenessLabel(match.deltaE)}</span>
                  <span className="hidden sm:block text-right text-sm text-on-surface">
                    {formatLrv(match.lrv) ?? "n/a"}
                    {lrvSourceLabel(match.lrv, match.lrvSource) && (
                      <span className="block text-[11px] text-on-surface-variant">{lrvSourceLabel(match.lrv, match.lrvSource)}</span>
                    )}
                  </span>
                </Link>
              ) : (
                <div className="px-5 py-3 text-sm text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{brandName}</span>: no current color found.
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      {found.length > 0 && (
        <p className="mt-3 text-xs text-on-surface-variant">
          Digital matches from the published color values. Screens and paint chips differ, so confirm with a physical sample before you buy.
        </p>
      )}
    </div>
  );
}
