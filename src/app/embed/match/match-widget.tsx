"use client";

import { useEffect, useState, useCallback } from "react";
import { closenessLabel } from "@/lib/closeness";

const SITE = "https://www.paintcolorhq.com";
const UTM = "utm_source=embed&utm_medium=widget&utm_campaign=match";

interface ApiMatch {
  name: string;
  hex: string;
  brandName: string;
  brandSlug: string;
  colorSlug: string;
  colorNumber: string | null;
  deltaE: number;
}

// Plain-language closeness — never expose the raw Delta E number (site convention).
function closeness(deltaE: number): { label: string; cls: string } {
  const label = closenessLabel(deltaE);
  const cls =
    label === "Nearly identical"
      ? "bg-emerald-100 text-emerald-800"
      : label === "Very similar"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return { label, cls };
}

function normalizeHex(input: string): string | null {
  const v = input.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : null;
}

export function MatchWidget() {
  const [hex, setHex] = useState("#a8a29a");
  const [text, setText] = useState("A8A29A");
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const lookup = useCallback(async (h: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/color-match?hex=${encodeURIComponent(h)}`);
      if (!res.ok) throw new Error();
      const data: { matches: ApiMatch[] } = await res.json();
      // Dedupe to the single closest match per brand (the cross-brand spread is
      // the point), then show the top few. API returns sorted by Delta E asc.
      const seen = new Set<string>();
      const perBrand = data.matches.filter((m) => {
        if (seen.has(m.brandSlug)) return false;
        seen.add(m.brandSlug);
        return true;
      });
      setMatches(perBrand.slice(0, 6));
    } catch {
      setError(true);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial lookup + whenever the chosen hex changes. Debounced: the native color
  // picker fires continuously while dragging, so wait until the user settles —
  // one API call per chosen color, not dozens of cache-miss calls per drag.
  useEffect(() => {
    const t = setTimeout(() => lookup(hex), 250);
    return () => clearTimeout(t);
  }, [hex, lookup]);

  // Best-effort, once per load: tell the site which external page embedded this
  // widget (Stream A distribution signal — see /api/embed-event). Fully isolated
  // in try/catch so it can never affect rendering. Skips our own preview iframe.
  useEffect(() => {
    try {
      if (window.parent === window) return; // not embedded in another page
      const ancestor = (window.location as unknown as { ancestorOrigins?: DOMStringList })
        .ancestorOrigins?.[0];
      const source = ancestor || document.referrer;
      if (!source) return;
      const parent = new URL(source);
      if (parent.hostname.endsWith("paintcolorhq.com")) return; // our own /embed preview
      // Full embedding page URL when the parent's referrer policy exposes it
      // (attribution checks need the page, not just the site). Most browsers
      // send only the origin cross-origin, so `host` stays the fallback.
      let page: string | undefined;
      try {
        const ref = document.referrer ? new URL(document.referrer) : null;
        if (ref && ref.origin === parent.origin) page = ref.origin + ref.pathname;
      } catch {
        // no page URL
      }
      const payload = JSON.stringify(page ? { host: parent.origin, page } : { host: parent.origin });
      navigator.sendBeacon?.("/api/embed-event", new Blob([payload], { type: "application/json" }));
    } catch {
      // ignore — telemetry is best-effort
    }
  }, []);

  const onText = (v: string) => {
    setText(v);
    const n = normalizeHex(v);
    if (n) setHex(n);
  };

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col bg-white p-4 font-sans text-gray-900">
      <div className="mb-3">
        <p className="text-sm font-bold tracking-tight text-gray-900">Find this paint color in another brand</p>
        <p className="text-xs text-gray-500">Pick a color to see the closest matches from 13 brands&apos; catalogs.</p>
      </div>

      {/* Input row */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="color"
          aria-label="Pick a color"
          value={hex}
          onChange={(e) => { setHex(e.target.value); setText(e.target.value.replace("#", "").toUpperCase()); }}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-gray-200 bg-white p-0.5"
        />
        <div className="flex flex-1 items-center rounded-md border border-gray-200 px-2">
          <span className="text-sm text-gray-400">#</span>
          <input
            type="text"
            inputMode="text"
            maxLength={7}
            aria-label="Hex code"
            value={text}
            onChange={(e) => onText(e.target.value)}
            className="w-full bg-transparent px-1 py-2 text-sm uppercase tracking-wide outline-none"
            placeholder="A8A29A"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="py-6 text-center text-xs text-gray-400">Matching…</p>}
        {error && !loading && <p className="py-6 text-center text-xs text-rose-500">Couldn&apos;t load matches — try another color.</p>}
        {!loading && !error && matches.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400">No close matches found for that color.</p>
        )}
        {!loading && !error && (
          <ul className="space-y-1.5">
            {matches.map((m) => {
              const c = closeness(m.deltaE);
              return (
                <li key={`${m.brandSlug}/${m.colorSlug}`}>
                  <a
                    href={`${SITE}/colors/${m.brandSlug}/${m.colorSlug}?${UTM}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-gray-100 p-2 transition-colors hover:border-gray-300 hover:bg-gray-50"
                  >
                    <span className="h-9 w-9 shrink-0 rounded-md border border-black/5" style={{ backgroundColor: m.hex }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">{m.name}</span>
                      <span className="block truncate text-[11px] uppercase tracking-wide text-gray-400">
                        {m.brandName}{m.colorNumber ? ` · ${m.colorNumber}` : ""}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.cls}`}>{c.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Attribution — drives the click back to the full site */}
      <div className="mt-3 border-t border-gray-100 pt-2 text-center">
        <a
          href={`${SITE}/?${UTM}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-700"
        >
          Cross-brand matching by <span className="font-bold text-gray-600">PaintColorHQ</span> →
        </a>
      </div>
    </div>
  );
}
