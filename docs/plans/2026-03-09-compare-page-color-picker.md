# Compare Page Color Picker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interactive color search pickers to the compare page so users can select two colors to compare, and add a "Compare" button on color detail pages.

**Architecture:** The compare page stays as a server component for SSR/metadata but delegates all interactivity to a new `CompareClient` client component. The client uses the existing `/api/search` endpoint with debounced input (matching the `HeroSearch` pattern). A "Compare" link on color detail pages navigates to `/compare?color1=<id>`.

**Tech Stack:** React 18, Next.js App Router, TypeScript, Tailwind CSS, existing `/api/search` API

---

### Task 1: Create the CompareClient component

**Files:**
- Create: `src/app/compare/compare-client.tsx`

**Step 1: Create the client component**

This component receives optional pre-fetched colors as props and renders two side-by-side search inputs with dropdown results. Selecting a color updates the URL and displays the comparison.

```tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColorWithBrand } from "@/lib/types";

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
  const router = useRouter();
  const [color1, setColor1] = useState<ColorWithBrand | null>(initialColor1);
  const [color2, setColor2] = useState<ColorWithBrand | null>(initialColor2);

  const updateUrl = useCallback(
    (c1: ColorWithBrand | null, c2: ColorWithBrand | null) => {
      const params = new URLSearchParams();
      if (c1) params.set("color1", c1.id);
      if (c2) params.set("color2", c2.id);
      const qs = params.toString();
      router.push(qs ? `/compare?${qs}` : "/compare", { scroll: false });
    },
    [router]
  );

  function selectColor1(color: ColorWithBrand) {
    setColor1(color);
    updateUrl(color, color2);
  }

  function selectColor2(color: ColorWithBrand) {
    setColor2(color);
    updateUrl(color1, color);
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
          <div className="grid grid-cols-2 gap-8">
            <ColorDetail color={color1} />
            <ColorDetail color={color2} />
          </div>
        </div>
      )}
    </>
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
```

**Step 2: Verify no TypeScript errors**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npx tsc --noEmit --pretty 2>&1 | grep compare`
Expected: No errors related to compare-client.tsx

**Step 3: Commit**

```bash
git add src/app/compare/compare-client.tsx
git commit -m "feat: add CompareClient component with color search pickers"
```

---

### Task 2: Wire CompareClient into the compare page

**Files:**
- Modify: `src/app/compare/page.tsx`

**Step 1: Update the server component to use CompareClient**

Replace the entire page content (lines 24-135) with a server component that pre-fetches colors and delegates to CompareClient:

```tsx
import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getColorById } from "@/lib/queries";
import { CompareClient } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare Paint Colors Side by Side",
  description:
    "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
  alternates: { canonical: "https://www.paintcolorhq.com/compare" },
  openGraph: {
    title: "Compare Paint Colors Side by Side",
    description:
      "Compare any two paint colors side by side with hex codes, RGB values, LRV, and visual swatches.",
    url: "https://www.paintcolorhq.com/compare",
  },
};

interface PageProps {
  searchParams: Promise<{ color1?: string; color2?: string }>;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const { color1: color1Id, color2: color2Id } = await searchParams;

  const [color1, color2] = await Promise.all([
    color1Id ? getColorById(color1Id) : null,
    color2Id ? getColorById(color2Id) : null,
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Compare Paint Colors
        </h1>
        <p className="mt-2 text-gray-600">
          Search for two paint colors to compare them side by side.
        </p>

        <CompareClient initialColor1={color1} initialColor2={color2} />
      </main>

      <Footer />
    </div>
  );
}
```

**Step 2: Verify it builds**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/compare/page.tsx
git commit -m "feat: wire CompareClient into compare page"
```

---

### Task 3: Add "Compare" button on color detail pages

**Files:**
- Modify: `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` (around line 253, after the ShareButton)

**Step 1: Add the Compare link**

After the `<ShareButton>` component (line 253-256), add:

```tsx
<Link
  href={`/compare?color1=${color.id}`}
  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
>
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
  Compare
</Link>
```

This goes right after the ShareButton closing tag and before the retailerLinks.map block.

**Step 2: Verify it builds**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/colors/[brandSlug]/[colorSlug]/page.tsx
git commit -m "feat: add Compare button on color detail pages"
```

---

### Task 4: Manual smoke test

**Step 1: Start the dev server**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npm run dev`

**Step 2: Test the compare page**

1. Navigate to `http://localhost:3000/compare`
2. Verify two search inputs appear side by side
3. Type "navy" in Color 1 — verify dropdown appears with results
4. Click a result — verify it selects and the swatch/name appears
5. Search and select a Color 2
6. Verify the side-by-side comparison appears below
7. Verify the URL updates with query params
8. Copy the URL, open in new tab — verify colors are pre-loaded
9. Click the X button on a selected color — verify it clears

**Step 3: Test the color detail Compare button**

1. Navigate to any color page, e.g. `http://localhost:3000/colors/behr/navy-blue-...`
2. Verify "Compare" button appears in the button row
3. Click it — verify it navigates to `/compare?color1=<id>` with Color 1 pre-filled
4. Search and select Color 2 — verify comparison works

**Step 4: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "fix: compare page adjustments from smoke test"
```
