"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import Link from "next/link";
import type { ColorWithBrand } from "@/lib/types";
import { trackCompare, trackEvent } from "@/lib/analytics";
import { TrackedLink } from "@/components/tracked-link";
import { hexToRgb, rgbToLab, deltaE2000, type Lab } from "@/lib/color-utils";
import { closenessLabel } from "@/lib/closeness";

/** The few fields a popular-pair card needs. */
export interface PairColor {
  id: string;
  name: string;
  hex: string;
  brandName: string;
}

interface CompareClientProps {
  initialColor1: ColorWithBrand | null;
  initialColor2: ColorWithBrand | null;
  popularPairs: [PairColor, PairColor][];
}

/** Popular pairs shown under a result; the empty tool shows the full list. */
const PAIRS_UNDER_RESULT = 4;

// Rows of public/match-data/{colorId}.json, built at deploy time, closest first.
interface MatchDataRow {
  match_color: { id: string; brand: { slug: string } };
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
  const inputId = useId();
  const trimmed = query.trim();

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
    const timer = setTimeout(() => search(trimmed), 300);
    return () => clearTimeout(timer);
  }, [trimmed, search]);

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
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={inputId}
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

      {open && (trimmed.length >= 2) && (
        <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && (
            <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              No colors found for &quot;{trimmed}&quot;
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

// The cross-brand match page for a pair exists when one color is the closest
// match in its brand for the other. Returns that page's path, or null.
async function findPairPage(
  a: ColorWithBrand,
  b: ColorWithBrand,
  signal: AbortSignal,
): Promise<string | null> {
  if (a.brand.slug === b.brand.slug) return null;
  for (const [source, target] of [[a, b], [b, a]] as const) {
    try {
      const res = await fetch(`/match-data/${source.id}.json`, { signal });
      if (!res.ok) continue;
      const rows: MatchDataRow[] = await res.json();
      const best = rows.find((r) => r.match_color?.brand?.slug === target.brand.slug);
      if (best?.match_color.id === target.id) {
        return `/match/${source.brand.slug}/${source.slug}-to-${target.brand.slug}`;
      }
    } catch {
      if (signal.aborted) return null;
    }
  }
  return null;
}

const NEXT_STEP_CLASS =
  "rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-900 shadow-sm transition hover:border-brand-blue hover:text-brand-blue";

export function CompareClient({ initialColor1, initialColor2, popularPairs }: CompareClientProps) {
  const [color1, setColor1] = useState<ColorWithBrand | null>(initialColor1);
  const [color2, setColor2] = useState<ColorWithBrand | null>(initialColor2);
  // Id currently picked in each slot. A full-row response is applied only if
  // its slot still holds that id, so a slow fetch never overwrites a newer pick.
  const pickedIds = useRef<[string | null, string | null]>([
    initialColor1?.id ?? null,
    initialColor2?.id ?? null,
  ]);

  // Path of the cross-brand match page for this pair, when there is one.
  const [pairPage, setPairPage] = useState<{ key: string; href: string | null } | null>(null);
  const pairKey = color1 && color2 ? `${color1.id}|${color2.id}` : null;
  useEffect(() => {
    if (!color1 || !color2) return;
    const key = `${color1.id}|${color2.id}`;
    const controller = new AbortController();
    findPairPage(color1, color2, controller.signal).then((href) => {
      if (!controller.signal.aborted) setPairPage({ key, href });
    });
    return () => controller.abort();
    // Ids are enough: the full-row refetch swaps the object, not the color.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color1?.id, color2?.id]);
  const pairHref = pairPage && pairPage.key === pairKey ? pairPage.href : null;

  // Write the URL only once both colors are set, and only when it changes.
  // GA4 enhanced measurement counts each history change as a page_view, so a
  // write on every pick and clear added about 900 phantom pageviews per 14 days.
  function updateUrl(c1: ColorWithBrand | null, c2: ColorWithBrand | null) {
    if (!c1 || !c2) return;
    const qs = new URLSearchParams({ color1: c1.id, color2: c2.id }).toString();
    if (window.location.search === `?${qs}`) return;
    window.history.replaceState(null, "", `/compare?${qs}`);
  }

  // Search rows carry only id, name, slug, hex and brand. Fetch the full row
  // (RGB, LAB, LRV) for the technical values.
  function loadFullRow(slot: 0 | 1, color: ColorWithBrand, apply: (c: ColorWithBrand) => void) {
    pickedIds.current[slot] = color.id;
    fetch(`/api/color/${color.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { color?: ColorWithBrand } | null) => {
        if (data?.color && pickedIds.current[slot] === color.id) apply(data.color);
      })
      .catch(() => {});
  }

  function selectColor1(color: ColorWithBrand) {
    setColor1(color);
    updateUrl(color, color2);
    loadFullRow(0, color, setColor1);
  }

  function selectColor2(color: ColorWithBrand) {
    setColor2(color);
    updateUrl(color1, color);
    loadFullRow(1, color, setColor2);
    if (color1) {
      trackCompare(color1.name, color.name, color1.brand.name, color.brand.name);
    }
  }

  function clearColor1() {
    pickedIds.current[0] = null;
    setColor1(null);
  }

  function clearColor2() {
    pickedIds.current[1] = null;
    setColor2(null);
  }

  function swapColors() {
    if (!color1 || !color2) return;
    trackEvent("cta_click", { cta_label: "compare_swap", color_1: color2.name, color_2: color1.name });
    pickedIds.current = [color2.id, color1.id];
    setColor1(color2);
    setColor2(color1);
    updateUrl(color2, color1);
  }

  const otherPairs = color1 && color2
    ? popularPairs
        .filter(([a, b]) => {
          const ids = new Set([a.id, b.id]);
          return !(ids.has(color1.id) && ids.has(color2.id));
        })
        .slice(0, PAIRS_UNDER_RESULT)
    : popularPairs;

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
        <div className="mt-6">
          {/* The verdict goes straight under the pickers. Below the swatches
              it started more than a full screen down on a phone. */}
          <DeltaEVerdict color1={color1} color2={color2} />

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-8">
            <ColorDetail color={color1} />
            <ColorDetail color={color2} />
          </div>

          <p className="mt-6 text-sm text-gray-600">
            Compare physical samples beside your trim and flooring in daylight and evening light. Screens do not predict the finished paint.
          </p>

          {/* Next-step CTAs */}
          <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TrackedLink
                href={`/tools/room-visualizer?${new URLSearchParams({ walls: color1.hex.replace("#", ""), accent: color2.hex.replace("#", "") })}`}
                className={NEXT_STEP_CLASS}
                eventName="cta_click"
                eventParams={{ cta_label: "compare_see_in_room", color_1: color1.name, color_2: color2.name }}
              >
                See both in a room
              </TrackedLink>
              {pairHref && (
                <TrackedLink
                  href={pairHref}
                  className={NEXT_STEP_CLASS}
                  eventName="cta_click"
                  eventParams={{ cta_label: "compare_pair_page", color_1: color1.name, color_2: color2.name }}
                >
                  See the full match page
                </TrackedLink>
              )}
              <button
                type="button"
                onClick={swapColors}
                className={NEXT_STEP_CLASS}
              >
                Swap the two colors
              </button>
              <TrackedLink
                href={`/colors/${color1.brand.slug}/${color1.slug}`}
                className={NEXT_STEP_CLASS}
                eventName="cta_click"
                eventParams={{ cta_label: "compare_color_1_matches", color_1: color1.name }}
              >
                Find matches for {color1.name}
              </TrackedLink>
              <TrackedLink
                href={`/colors/${color2.brand.slug}/${color2.slug}`}
                className={NEXT_STEP_CLASS}
                eventName="cta_click"
                eventParams={{ cta_label: "compare_color_2_matches", color_2: color2.name }}
              >
                Find matches for {color2.name}
              </TrackedLink>
              <TrackedLink
                href={`/tools/palette-generator?${new URLSearchParams({ hex: color1.hex.replace("#", "") })}`}
                className={NEXT_STEP_CLASS}
                eventName="cta_click"
                eventParams={{ cta_label: "compare_build_palette", color_1: color1.name }}
              >
                Build a palette around {color1.name}
              </TrackedLink>
            </div>
          </div>
        </div>
      )}

      {otherPairs.length > 0 && (
        <div className="mt-12">
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
            {color1 && color2 ? "Other popular comparisons" : "Popular comparisons"}
          </h2>
          <p className="mt-2 mb-6 text-sm text-on-surface-variant">Colors people often decide between. Open one to see the side-by-side verdict.</p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherPairs.map(([a, b]) => (
              <li key={`${a.id}-${b.id}`}>
                <TrackedLink
                  href={`/compare?color1=${a.id}&color2=${b.id}`}
                  className="flex items-center gap-3 rounded-xl border border-outline-variant/30 p-3 hover:shadow-md transition-all"
                  eventName="cta_click"
                  eventParams={{ cta_label: color1 && color2 ? "compare_popular_pair_after_result" : "compare_popular_pair", color_1: a.name, color_2: b.name }}
                >
                  <span className="flex shrink-0">
                    <span className="h-10 w-10 rounded-l-lg border border-black/10" style={{ backgroundColor: a.hex }} />
                    <span className="h-10 w-10 rounded-r-lg border border-l-0 border-black/10" style={{ backgroundColor: b.hex }} />
                  </span>
                  <span className="text-sm leading-tight">
                    <span className="block font-semibold text-on-surface">{a.name} vs {b.name}</span>
                    <span className="block text-xs text-on-surface-variant">{a.brandName === b.brandName ? a.brandName : `${a.brandName} vs ${b.brandName}`}</span>
                  </span>
                </TrackedLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

// A search row has no RGB or LAB until the full row loads, so fall back to the
// hex. Hex converts exactly to the stored RGB and LAB values.
function rgbOf(c: ColorWithBrand): { r: number; g: number; b: number } | null {
  if (c.rgb_r != null && c.rgb_g != null && c.rgb_b != null) {
    return { r: c.rgb_r, g: c.rgb_g, b: c.rgb_b };
  }
  try {
    const rgb = hexToRgb(c.hex);
    return [rgb.r, rgb.g, rgb.b].every(Number.isFinite) ? rgb : null;
  } catch {
    return null;
  }
}

function labOf(c: ColorWithBrand): Lab | null {
  if (c.lab_l != null && c.lab_a != null && c.lab_b_val != null) {
    return { L: c.lab_l, a: c.lab_a, b: c.lab_b_val };
  }
  const rgb = rgbOf(c);
  return rgb ? rgbToLab(rgb.r, rgb.g, rgb.b) : null;
}

function computeDeltaE(c1: ColorWithBrand, c2: ColorWithBrand): number {
  const lab1 = labOf(c1);
  const lab2 = labOf(c2);
  return lab1 && lab2 ? deltaE2000(lab1, lab2) : NaN;
}

function getDeltaEVerdict(de: number): string {
  const label = closenessLabel(de);
  if (label === "Nearly identical") return "Nearly identical in our digital data. Sample both before choosing.";
  if (label === "Very similar") return "Very similar in our digital data. Sample both before choosing.";
  return "Visible difference: these are different colors.";
}

function DeltaEVerdict({
  color1,
  color2,
}: {
  color1: ColorWithBrand;
  color2: ColorWithBrand;
}) {
  const de = computeDeltaE(color1, color2);
  // No verdict beats a wrong one: a NaN would read as "Visible difference".
  if (!Number.isFinite(de)) return null;
  const verdict = getDeltaEVerdict(de);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <span className="flex shrink-0" aria-hidden="true">
        <span className="h-8 w-8 rounded-l-md border border-black/10" style={{ backgroundColor: color1.hex }} />
        <span className="h-8 w-8 rounded-r-md border border-l-0 border-black/10" style={{ backgroundColor: color2.hex }} />
      </span>
      <p className="text-base font-medium text-gray-900" aria-live="polite">
        {verdict}
        <span className="block text-xs font-normal text-gray-500">Measured with the CIEDE2000 color-difference formula.</span>
      </p>
    </div>
  );
}

function ColorDetail({ color }: { color: ColorWithBrand }) {
  const rgb = rgbOf(color);
  return (
    <div>
      <div
        className="aspect-square w-full rounded-2xl border border-gray-200"
        style={{ backgroundColor: color.hex }}
      />
      <div className="mt-4">
        <Link
          href={`/colors/${color.brand.slug}/${color.slug}`}
          className="text-base sm:text-xl font-semibold text-gray-900 break-words hover:text-brand-blue"
        >
          {color.name}
        </Link>
        <p className="text-gray-600">{color.brand.name}{color.color_number && ` · ${color.color_number}`}</p>
      </div>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Technical values</summary><dl className="mt-4 space-y-2 text-xs sm:text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Hex</dt>
          <dd className="font-mono font-medium">{color.hex.toUpperCase()}</dd>
        </div>
        {rgb && (
          <div className="flex justify-between">
            <dt className="text-gray-500">RGB</dt>
            <dd className="font-mono">
              {rgb.r}, {rgb.g}, {rgb.b}
            </dd>
          </div>
        )}
        {/* Hidden until the full row loads; search rows have no LRV. */}
        {color.lrv != null && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Estimated LRV</dt>
            <dd>{Number(color.lrv).toFixed(1)}</dd>
          </div>
        )}
      </dl></details>
    </div>
  );
}
