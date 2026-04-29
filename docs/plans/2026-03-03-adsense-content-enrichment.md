# AdSense Content Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich thin pages (match, search, compare, inspiration) with unique prose content to pass Google AdSense's "low value content" review.

**Architecture:** Create deterministic template-based content generators (following the existing `color-description.ts` pattern) for match and inspiration pages. Add handwritten static content to single pages (search, compare). All generators use `hashStr`/`pick` for deterministic variety per page.

**Tech Stack:** TypeScript, Next.js 16 server components, existing `hexToHsl` from `src/lib/palettes.ts`

---

### Task 1: Create match-description.ts generator

**Files:**
- Create: `src/lib/match-description.ts`

**Context:** This follows the exact same pattern as `src/lib/color-description.ts`. Study that file first — it uses `hashStr` (djb2 hash) and `pick` (deterministic selection from arrays) to generate varied but reproducible content. The types `ColorWithBrand` and `CrossBrandMatchWithColor` are in `src/lib/types.ts`. The `hexToHsl` function is exported from `src/lib/palettes.ts`. The `deriveProps` function and its helpers in `color-description.ts` are NOT exported — you'll need to either export them or duplicate the ones you need.

**Step 1: Export shared utilities from color-description.ts**

In `src/lib/color-description.ts`, the `hashStr`, `pick`, and `deriveProps` functions (plus the `DerivedProps` type and its dependency types) are private. Export `hashStr` and `pick` so match-description.ts can reuse them. Do NOT export `deriveProps` — it's tightly coupled to color description logic. Instead, match-description will use simpler derived properties directly.

In `src/lib/color-description.ts`, change:
```typescript
function hashStr(str: string): number {
```
to:
```typescript
export function hashStr(str: string): number {
```

And change:
```typescript
function pick<T>(items: T[], hash: number, salt: number): T {
```
to:
```typescript
export function pick<T>(items: T[], hash: number, salt: number): T {
```

**Step 2: Create src/lib/match-description.ts**

Create the file with a `generateMatchDescription` function that takes:
- `sourceColor: ColorWithBrand`
- `targetBrandName: string`
- `bestMatch: CrossBrandMatchWithColor`

And returns a string of ~200 words composed of 5-6 sentences:

1. **Opening** — varies by Delta E quality level
2. **Delta E explanation** — what the score means practically
3. **Undertone/character note** — compares source and match properties
4. **Sampling advice** — always verify with physical samples
5. **Cross-brand context** — why people switch brands

Use template pools with `pick()` for each sentence, keyed by Delta E ranges:
- `< 1`: near-identical
- `< 2`: extremely close
- `< 3`: very close
- `< 5`: close, minor differences
- `>= 5`: noticeable difference

Use `hashStr(sourceColor.hex + targetBrandName)` as the hash for deterministic selection.

Import `hexToHsl` from `src/lib/palettes.ts` to derive basic temperature (warm/cool) from source and match hex values for the comparison sentence.

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to match-description.ts

**Step 4: Commit**

```bash
git add src/lib/match-description.ts src/lib/color-description.ts
git commit -m "feat: add match page content generator for AdSense compliance"
```

---

### Task 2: Integrate match description into match page

**Files:**
- Modify: `src/app/match/[sourceBrandSlug]/[colorSlug]-to-[targetBrandSlug]/page.tsx`

**Context:** The match page currently shows two color swatches side by side, a Delta E score badge, a one-line disclaimer, and optional "Other Close Matches." We need to add the generated description between the Delta E badge and the disclaimer.

**Step 1: Add the description to the match page**

At the top of the file, add the import:
```typescript
import { generateMatchDescription } from "@/lib/match-description";
```

In the component, after the `bestMatch` variable is set (around line 76), generate the description:
```typescript
const matchDescription = bestMatch
  ? generateMatchDescription(sourceColor, targetBrand.name, bestMatch)
  : null;
```

Then render it after the Delta E badge div (after the `<div className="mt-8 rounded-lg bg-blue-50...">` block, before the disclaimer `<p>` tag). Add:
```tsx
{matchDescription && (
  <div className="mt-8">
    <p className="text-base leading-relaxed text-gray-700">
      {matchDescription}
    </p>
  </div>
)}
```

Also update the `generateMetadata` function to use a richer description. Replace the current description string with something that references the match quality. After the `if (!sourceColor || !targetBrand)` guard, add:
```typescript
const allMatches = await getCrossBrandMatches(sourceColor.id);
const bestMatchForMeta = allMatches.find(
  (m) => m.match_color.brand.slug === parsed.targetBrandSlug
);
const deltaENote = bestMatchForMeta
  ? Number(bestMatchForMeta.delta_e_score) < 2
    ? "near-identical match"
    : Number(bestMatchForMeta.delta_e_score) < 5
      ? "close match"
      : "closest available match"
  : "match";
```

Then use it in the metadata:
```typescript
description: `${sourceColor.brand.name} ${sourceColor.name} (${sourceColor.hex.toUpperCase()}) to ${targetBrand.name}: ${deltaENote}. Compare hex, undertone, and LRV. Always verify with physical samples.`,
```

**Step 2: Verify the build compiles**

Run: `npx next build` (or `npx tsc --noEmit` for faster check)
Expected: No type errors

**Step 3: Commit**

```bash
git add src/app/match/
git commit -m "feat: add generated prose to match pages"
```

---

### Task 3: Enrich the search page with static content

**Files:**
- Modify: `src/app/search/page.tsx`

**Context:** Currently this page has just `<h1>Search Paint Colors</h1>` and `<p>Find colors by name, number, or hex code.</p>` followed by the `<SearchResults />` client component. We need to add ~300 words of educational content below the search results.

**Step 1: Add educational content section**

After the `</Suspense>` closing tag and before the `</main>` tag, add a content section:

```tsx
{/* Educational content for SEO */}
<section className="mt-16 border-t border-gray-200 pt-12">
  <h2 className="text-2xl font-bold text-gray-900">
    How to Search for Paint Colors
  </h2>
  <div className="mt-6 space-y-6 text-base leading-relaxed text-gray-700">
    <p>
      Paint Color HQ indexes over 25,000 paint colors from 14 major
      brands including Sherwin-Williams, Benjamin Moore, Behr, Farrow
      &amp; Ball, and more. You can search in several ways to find
      exactly the color you need.
    </p>
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="font-semibold text-gray-900">Search by Name</h3>
        <p className="mt-2 text-sm text-gray-600">
          Type the color name directly, like &ldquo;Agreeable
          Gray&rdquo; or &ldquo;Hale Navy.&rdquo; Partial names work
          too — searching &ldquo;sage&rdquo; returns all sage-toned
          colors across every brand.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">
          Search by Color Number
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Every paint brand assigns a unique code to each color. Search
          &ldquo;SW 7029&rdquo; or &ldquo;OC-17&rdquo; to jump straight
          to that specific color.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">
          Search by Hex Code
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Found a color online and have the hex code? Search
          &ldquo;#D6D0C4&rdquo; to find the closest real paint colors
          that match that digital value.
        </p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">Browse by Category</h3>
        <p className="mt-2 text-sm text-gray-600">
          Prefer to explore? Browse all colors by{" "}
          <Link
            href="/brands"
            className="text-brand-blue hover:underline"
          >
            brand
          </Link>{" "}
          or{" "}
          <Link
            href="/colors"
            className="text-brand-blue hover:underline"
          >
            color family
          </Link>
          , or use the{" "}
          <Link
            href="/tools/color-identifier"
            className="text-brand-blue hover:underline"
          >
            Photo Color Identifier
          </Link>{" "}
          to match a color from any image.
        </p>
      </div>
    </div>
    <p>
      Each color page includes hex, RGB, and LRV values, undertone
      analysis, cross-brand matches from all 14 brands, color harmonies,
      curated room palettes, and links to buy from verified retailers.
    </p>
  </div>
</section>
```

Make sure `Link` is imported at the top (it should already be via SearchResults, but check — the current file imports from `next/link`? No — check the current imports. The search page does NOT import Link. Add it:

```typescript
import Link from "next/link";
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/search/page.tsx
git commit -m "feat: add educational content to search page for AdSense"
```

---

### Task 4: Enrich the compare page

**Files:**
- Modify: `src/app/compare/page.tsx`

**Context:** The compare page shows two colors side by side when URL parameters are provided, or a single sentence pointing to search when empty. We need to: (1) replace the empty state with ~250 words of educational content, and (2) add a dynamic comparison paragraph when colors are loaded.

**Step 1: Replace empty state with educational content**

Replace the current empty state block (the `<div className="mt-12 text-center">...</div>`) with:

```tsx
<div className="mt-12">
  <div className="mx-auto max-w-2xl space-y-6 text-base leading-relaxed text-gray-700">
    <p>
      Comparing paint colors side by side is one of the most
      effective ways to spot subtle differences that are invisible
      on their own. Even colors that look identical in a fan deck
      can reveal different undertones, brightness levels, and
      warmth when placed next to each other.
    </p>
    <h2 className="text-xl font-bold text-gray-900">
      What to Look For When Comparing
    </h2>
    <ul className="list-disc space-y-3 pl-5 text-sm text-gray-600">
      <li>
        <strong>LRV (Light Reflectance Value)</strong> — ranges
        from 0 (pure black) to 100 (pure white). A difference of
        5 or more is noticeable on a wall. Higher LRV colors make
        rooms feel larger and brighter.
      </li>
      <li>
        <strong>Undertone</strong> — two grays can look completely
        different if one leans blue and the other leans green.
        Comparing reveals these hidden tones.
      </li>
      <li>
        <strong>Hex and RGB values</strong> — the digital
        fingerprint of each color. Small differences in these
        numbers can translate to visible differences on a painted
        surface.
      </li>
    </ul>
    <p className="text-sm text-gray-600">
      To get started,{" "}
      <Link
        href="/search"
        className="text-brand-blue hover:underline"
      >
        search for a color
      </Link>{" "}
      and use the compare button on any color page. You can also
      upload a photo with the{" "}
      <Link
        href="/tools/color-identifier"
        className="text-brand-blue hover:underline"
      >
        Color Identifier
      </Link>{" "}
      to find the closest paint match, then compare it against
      alternatives.
    </p>
  </div>
</div>
```

**Step 2: Add dynamic comparison paragraph when colors are loaded**

When both colors are present, add a comparison paragraph after the data grid. After the closing `</div>` of the grid (`grid grid-cols-2 gap-8`), add:

```tsx
{/* Dynamic comparison */}
<div className="mt-8 rounded-lg bg-gray-50 p-6">
  <p className="text-base leading-relaxed text-gray-700">
    {color1.name} ({color1.hex.toUpperCase()}) by{" "}
    {color1.brand.name}
    {color1.lrv != null && color2.lrv != null ? (
      <>
        {" "}has an LRV of {Number(color1.lrv).toFixed(1)},{" "}
        {Number(color1.lrv) > Number(color2.lrv)
          ? "higher"
          : Number(color1.lrv) < Number(color2.lrv)
            ? "lower"
            : "identical"}{" "}
        than {color2.name}&apos;s{" "}
        {Number(color2.lrv).toFixed(1)}
        {Math.abs(Number(color1.lrv) - Number(color2.lrv)) > 10
          ? ". This is a significant difference that will be clearly visible on a wall"
          : Math.abs(
                Number(color1.lrv) - Number(color2.lrv)
              ) > 3
            ? ". This difference is noticeable, especially in side-by-side samples"
            : ". These colors reflect a similar amount of light and will read close in brightness"}
        .
      </>
    ) : (
      <> and {color2.name} ({color2.hex.toUpperCase()}) by{" "}
        {color2.brand.name} are shown above with their technical
        values for easy comparison.</>
    )}{" "}
    Always compare with physical paint samples under the
    lighting conditions in your actual room before making a
    final decision.
  </p>
</div>
```

**Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/compare/page.tsx
git commit -m "feat: add educational content to compare page for AdSense"
```

---

### Task 5: Create palette-description.ts generator

**Files:**
- Create: `src/lib/palette-description.ts`

**Context:** Inspiration palettes are defined in `src/lib/palettes.ts` as `InspirationPalette` objects with `name`, `slug`, `description` (short ~10 word string), and `colors` (array of 5 hex strings). We need a generator that takes a palette and produces ~150-200 words of descriptive content.

The function `assignPaletteRoles` in `src/lib/palettes.ts` assigns roles (Walls, Trim, Accent, Pop) to each color. Use this to generate role-specific guidance.

**Step 1: Create the generator**

Create `src/lib/palette-description.ts` that exports `generatePaletteDescription(palette: InspirationPalette): string`.

The function should:
1. Import `hexToHsl` from `./palettes` and `hashStr`, `pick` from `./color-description`
2. Analyze the palette colors to determine:
   - Overall temperature (warm/cool/mixed) based on average hue
   - Lightness range (light-dominant, balanced, dark-dominant)
   - Contrast level (high if max-min lightness > 40, moderate if > 20, low otherwise)
3. Generate 4-5 sentences using template pools:
   - **Mood sentence** — what atmosphere this palette creates, keyed by temperature + contrast
   - **Room suggestion** — where this palette works, keyed by lightness + contrast
   - **Role guidance** — how to use walls/trim/accent/pop, keyed by palette structure
   - **Design style** — which interior styles it complements, keyed by temperature
   - **Tip** — practical advice for using a 5-color palette

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/palette-description.ts
git commit -m "feat: add palette description generator for inspiration pages"
```

---

### Task 6: Integrate palette description into inspiration detail page

**Files:**
- Modify: `src/app/inspiration/[slug]/page.tsx`

**Context:** The inspiration detail page currently shows `<p className="mt-2 text-gray-600">{palette.description}</p>` which is the short ~10 word description from the palette definition. We need to keep the short description but add the generated long description below it.

**Step 1: Add the generated description**

Add the import at the top:
```typescript
import { generatePaletteDescription } from "@/lib/palette-description";
```

In the component, after the palette is loaded (after `if (!palette) notFound();`), generate the description:
```typescript
const paletteDescription = generatePaletteDescription(palette);
```

In the JSX, find the existing `<p className="mt-2 text-gray-600">{palette.description}</p>` and add the longer description below it:
```tsx
<p className="mt-2 text-gray-600">{palette.description}</p>
<p className="mt-3 text-sm leading-relaxed text-gray-600">
  {paletteDescription}
</p>
```

Also update `generateMetadata` to include the richer description in the meta tag. Change:
```typescript
description: palette.description,
```
to:
```typescript
description: `${palette.description} ${generatePaletteDescription(palette).slice(0, 120)}...`,
```

**Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/inspiration/
git commit -m "feat: add expanded descriptions to inspiration palette pages"
```

---

### Task 7: Final verification — full build

**Files:** None (verification only)

**Step 1: Run full Next.js build**

Run: `npm run build`
Expected: Build succeeds with no errors. Check that the match, search, compare, and inspiration pages compile without issues.

**Step 2: Run linter**

Run: `npm run lint`
Expected: No lint errors in modified files.

**Step 3: Visual spot-check (optional)**

Run: `npm run dev`
Visit in browser:
- `/match/sherwin-williams/agreeable-gray-7029-to-benjamin-moore` — should show ~200 word description
- `/search` — should show educational section below search box
- `/compare` — empty state should show educational content
- `/inspiration/modern-farmhouse` — should show expanded description

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address build/lint issues from content enrichment"
```
