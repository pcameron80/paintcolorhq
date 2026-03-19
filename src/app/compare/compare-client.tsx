"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { ColorWithBrand } from "@/lib/types";
import { trackCompare } from "@/lib/analytics";
import { rgbToLab, deltaE2000 } from "@/lib/color-utils";

interface CompareClientProps {
  initialColor1: ColorWithBrand | null;
  initialColor2: ColorWithBrand | null;
}

function ColorSearchInput({
  label,
  selected,
  onSelect,
  onClear,
}: {
  label: string;
  selected: ColorWithBrand | null;
  onSelect: (color: ColorWithBrand) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ColorWithBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selected) {
    return (
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 shrink-0 rounded-lg border border-gray-200"
              style={{ backgroundColor: selected.hex }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{selected.name}</p>
              <p className="text-sm text-gray-500">
                {selected.brand.name}
                {selected.color_number && ` - ${selected.color_number}`}
              </p>
            </div>
            <button
              onClick={onClear}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Clear selection"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="Search by name, number, or hex..."
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
      />

      {open && (query.length >= 2) && (
        <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && (
            <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              No colors found for &quot;{query}&quot;
            </p>
          )}
          {!loading && results.map((color) => (
            <button
              key={color.id}
              onClick={() => {
                onSelect(color);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
            >
              <div
                className="h-8 w-8 shrink-0 rounded border border-gray-200"
                style={{ backgroundColor: color.hex }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{color.name}</p>
                <p className="text-xs text-gray-500">
                  {color.brand.name}
                  {color.color_number && ` - ${color.color_number}`}
                  {" "}&middot; {color.hex.toUpperCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CompareClient({ initialColor1, initialColor2 }: CompareClientProps) {
  const [color1, setColor1] = useState<ColorWithBrand | null>(initialColor1);
  const [color2, setColor2] = useState<ColorWithBrand | null>(initialColor2);

  function updateUrl(c1: ColorWithBrand | null, c2: ColorWithBrand | null) {
    const params = new URLSearchParams();
    if (c1) params.set("color1", c1.id);
    if (c2) params.set("color2", c2.id);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/compare?${qs}` : "/compare");
  }

  function selectColor1(color: ColorWithBrand) {
    setColor1(color);
    updateUrl(color, color2);
  }

  function selectColor2(color: ColorWithBrand) {
    setColor2(color);
    updateUrl(color1, color);
    if (color1) {
      trackCompare(color1.name, color.name, color1.brand.name, color.brand.name);
    }
  }

  function clearColor1() {
    setColor1(null);
    updateUrl(null, color2);
  }

  function clearColor2() {
    setColor2(null);
    updateUrl(color1, null);
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ColorSearchInput
          label="Color 1"
          selected={color1}
          onSelect={selectColor1}
          onClear={clearColor1}
        />
        <ColorSearchInput
          label="Color 2"
          selected={color2}
          onSelect={selectColor2}
          onClear={clearColor2}
        />
      </div>

      {color1 && color2 && (
        <div className="mt-10">
          {/* Delta E similarity verdict */}
          <DeltaEVerdict color1={color1} color2={color2} />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <ColorDetail color={color1} />
            <ColorDetail color={color2} />
          </div>

          {/* Next-step CTAs */}
          <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href={`/colors/${color1.brand.slug}/${color1.slug}`}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm transition hover:border-brand-blue hover:text-brand-blue"
              >
                Find matches for {color1.name}
              </Link>
              <Link
                href={`/colors/${color2.brand.slug}/${color2.slug}`}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm transition hover:border-brand-blue hover:text-brand-blue"
              >
                Find matches for {color2.name}
              </Link>
              <Link
                href="/tools/room-visualizer"
                className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm transition hover:border-brand-blue hover:text-brand-blue"
              >
                Try Room Visualizer
              </Link>
              <Link
                href="/tools/palette-generator"
                className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm transition hover:border-brand-blue hover:text-brand-blue"
              >
                Build a Palette
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function computeDeltaE(c1: ColorWithBrand, c2: ColorWithBrand): number {
  const lab1 =
    c1.lab_l != null && c1.lab_a != null && c1.lab_b_val != null
      ? { L: c1.lab_l, a: c1.lab_a, b: c1.lab_b_val }
      : rgbToLab(c1.rgb_r, c1.rgb_g, c1.rgb_b);
  const lab2 =
    c2.lab_l != null && c2.lab_a != null && c2.lab_b_val != null
      ? { L: c2.lab_l, a: c2.lab_a, b: c2.lab_b_val }
      : rgbToLab(c2.rgb_r, c2.rgb_g, c2.rgb_b);
  return deltaE2000(lab1, lab2);
}

function getDeltaEVerdict(de: number): string {
  if (de < 1) return "These colors are virtually identical";
  if (de < 2) return "Very close — barely distinguishable side by side";
  if (de < 5)
    return "Similar but you may notice a difference in certain lighting";
  if (de < 10) return "Noticeably different — test with physical samples";
  return "Very different colors";
}

function DeltaEVerdict({
  color1,
  color2,
}: {
  color1: ColorWithBrand;
  color2: ColorWithBrand;
}) {
  const de = computeDeltaE(color1, color2);
  const verdict = getDeltaEVerdict(de);

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
      <p className="text-lg font-medium text-gray-900">{verdict}</p>
      <p className="mt-1 text-sm text-gray-500">
        Delta E (CIE2000): {de.toFixed(2)}
      </p>
    </div>
  );
}

function ColorDetail({ color }: { color: ColorWithBrand }) {
  return (
    <div>
      <div
        className="aspect-square w-full rounded-2xl border border-gray-200"
        style={{ backgroundColor: color.hex }}
      />
      <div className="mt-4">
        <Link
          href={`/colors/${color.brand.slug}/${color.slug}`}
          className="text-xl font-semibold text-gray-900 hover:text-brand-blue"
        >
          {color.name}
        </Link>
        <p className="text-gray-600">{color.brand.name}</p>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Hex</dt>
          <dd className="font-mono font-medium">{color.hex.toUpperCase()}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">RGB</dt>
          <dd className="font-mono">
            {color.rgb_r}, {color.rgb_g}, {color.rgb_b}
          </dd>
        </div>
        {color.lrv != null && (
          <div className="flex justify-between">
            <dt className="text-gray-500">LRV</dt>
            <dd>{Number(color.lrv).toFixed(1)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
