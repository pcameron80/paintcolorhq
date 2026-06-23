# Color Page Structured-Depth — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans / subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make color pages read as unique cross-brand references (not near-duplicate templates) by replacing generic templated prose with concise data-derived copy and elevating the cross-brand equivalence data into the page's centerpiece.

**Architecture:** Server component (`page.tsx`) + pure helpers in `src/lib/color-description.ts`. Two new tested pure functions (a data-derived "lede" and a "nearest-match-per-brand" selector) replace/feed the rendered sections. No new data pipeline — reuse `getCrossBrandMatches`. No LLM prose.

**Tech Stack:** Next.js 16 server components, TypeScript, Tailwind 4, `node:test` via `npx tsx --test`.

## Global Constraints

- **No LLM-generated prose.** Composed-from-data only. (March 2026 HCU penalty trap.)
- **Delta E never shown as a raw number** — plain language only ("Nearly identical" <2 / "Very similar" <5 / "Visible difference").
- Keep the existing `shouldIndex` gate in `generateMetadata` untouched.
- Keep the 153 curated "More about" blocks (`color-editorial.tsx`) untouched.
- Match-page route + AnalyticsProvider order gotchas unchanged (not touched here).
- Pre-deploy: `seo-preflight` before any deploy (done by user).

---

### Task 1: `generateColorLede` — data-derived lede (replaces templated editorial verdict)

**Files:**
- Modify: `src/lib/color-description.ts` (add export `generateColorLede`)
- Test: `src/lib/color-description.test.ts` (create)

**Interfaces:**
- Produces: `generateColorLede(color: ColorWithBrand, matches: CrossBrandMatchWithColor[]): string`
- Consumes: existing `closenessLabel` logic (inline), `ColorWithBrand`, `CrossBrandMatchWithColor`.

The lede is composed entirely from the color's own values + its single nearest cross-brand match, so it varies per color on hex, LRV, undertone, family, AND nearest-match identity (two similar grays still differ in nearest-match name/brand). Shape:
> `{Name}{ ' ' + code} is a {family} paint color from {Brand}. It has a hex value of {HEX}{, an LRV of N}{ and a {undertone} undertone}. Its closest cross-brand match is {matchName} from {matchBrand} ({closeness}){, with {N} more equivalents across other brands}.`

Closeness from `delta_e_score`: `<2` → "nearly identical", `<5` → "very similar", else "a visible but close match".

- [ ] **Step 1: Write failing test** in `src/lib/color-description.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateColorLede } from "./color-description.ts";

function color(over = {}) {
  return { name: "Agreeable Gray", color_number: "7029", hex: "#D1CBC1", lrv: 60,
    undertone: "Neutral", color_family: "gray",
    brand: { name: "Sherwin-Williams", slug: "sherwin-williams" }, ...over } as any;
}
function match(name, brand, de) {
  return { id: name, delta_e_score: de,
    match_color: { name, slug: name.toLowerCase().replace(/\s+/g, "-"), hex: "#ccc",
      brand: { name: brand, slug: brand.toLowerCase().replace(/\s+/g, "-") } } } as any;
}

test("lede cites the color's own data and nearest match", () => {
  const led = generateColorLede(color(), [match("Doves Wings", "Dutch Boy", 1.1), match("Wish", "Benjamin Moore", 3)]);
  assert.match(led, /Agreeable Gray/);
  assert.match(led, /#D1CBC1/);
  assert.match(led, /LRV 60/);
  assert.match(led, /Doves Wings/);          // nearest match cited
  assert.match(led, /nearly identical/i);    // delta_e 1.1 → nearly identical
  assert.match(led, /1 more|more equivalents/); // 2 matches → "1 more"
});

test("two different colors produce different ledes", () => {
  const a = generateColorLede(color(), [match("Doves Wings", "Dutch Boy", 1.1)]);
  const b = generateColorLede(color({ name: "Repose Gray", color_number: "7015", hex: "#CCC9C0", lrv: 58 }),
    [match("Classic Silver", "Behr", 2.2)]);
  assert.notEqual(a, b);
});

test("handles missing lrv/undertone and zero matches gracefully", () => {
  const led = generateColorLede(color({ lrv: null, undertone: null }), []);
  assert.match(led, /Agreeable Gray/);
  assert.doesNotMatch(led, /LRV/);
  assert.doesNotMatch(led, /closest cross-brand/); // no match clause when none
});
```

- [ ] **Step 2: Run, verify fail:** `cd <worktree> && npx tsx --test src/lib/color-description.test.ts` → FAIL (generateColorLede not exported).

- [ ] **Step 3: Implement** `generateColorLede` in `color-description.ts` (append near other exports). Compose the sentence per the shape above; guard null lrv/undertone; omit match clause when `matches.length === 0`; pick nearest by min `delta_e_score`.

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit** `feat(color): data-derived lede helper (replaces templated verdict)`.

---

### Task 2: `nearestMatchesPerBrand` — complete, sorted equivalence list

**Files:**
- Modify: `src/lib/color-description.ts` (add export `nearestMatchesPerBrand`)
- Test: `src/lib/color-description.test.ts` (extend)

**Interfaces:**
- Produces: `nearestMatchesPerBrand(matches: CrossBrandMatchWithColor[]): CrossBrandMatchWithColor[]` — one nearest match per target brand, sorted ascending by `delta_e_score` (best first). Replaces the page's inline `Object.values(matchesByBrand).flatMap(bm => bm.slice(0,1)).slice(0,8)`.

- [ ] **Step 1: Failing test:**

```ts
import { nearestMatchesPerBrand } from "./color-description.ts";
test("nearestMatchesPerBrand: one per brand, sorted best-first", () => {
  const ms = [match("A", "Behr", 4), match("B", "Behr", 2), match("C", "PPG", 1), match("D", "Valspar", 6)];
  const r = nearestMatchesPerBrand(ms as any);
  assert.deepEqual(r.map((m) => m.match_color.name), ["C", "B", "D"]); // PPG(1), Behr(2 best of Behr), Valspar(6)
});
```

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** (group by `match_color.brand.slug`, keep min delta_e each, sort ascending).
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** `feat(color): nearestMatchesPerBrand selector`.

---

### Task 3: Wire lede + matrix into the page; trim generic prose

**Files:**
- Modify: `src/app/colors/[brandSlug]/[colorSlug]/page.tsx`

**Steps:**
- [ ] **Step 1:** Import `generateColorLede, nearestMatchesPerBrand`; compute `const colorLede = generateColorLede(color, matches);` and `const brandMatrix = nearestMatchesPerBrand(matches);` in the component body (near existing `editorialVerdict`).
- [ ] **Step 2:** Replace the editorial-verdict `<p>{editorialVerdict}</p>` (≈line 373) with `<p ...>{colorLede}</p>`. Remove the now-unused `editorialVerdict` computation.
- [ ] **Step 3:** Remove the generic Technical-Profile `description` paragraph (≈line 402, `generateColorDescription`) — the spec table + lede + matrix carry it. Remove the now-unused `description`/`generateColorDescription` import if unreferenced elsewhere.
- [ ] **Step 4:** In the matches block (≈481–503): change heading to `{color.name} in Every Brand`, subtitle to "The closest equivalent to {name} in each major paint brand. Plain-language closeness; always verify with a physical sample."; render `brandMatrix` (all, not slice 8); keep the existing card markup + closeness label.
- [ ] **Step 5: Build:** `cd <worktree> && npm run build` → succeeds (or `npx tsc --noEmit` for type check if full build too slow). Then `npm run lint`.
- [ ] **Step 6: Visual verify:** start `npm run dev` on the worktree, curl `/colors/sherwin-williams/agreeable-gray-7029` and `/colors/dunn-edwards/bay-fog-de5934`; confirm lede renders, matrix shows multiple brands, no generic family-verdict paragraph. Re-run the 68%-overlap diff → expect < 40%.
- [ ] **Step 7: Commit** `feat(color): data-led lede + full cross-brand matrix; trim generic prose`.

---

### Task 4: Side-by-side hero compare (top match)

**Files:**
- Modify: `src/app/colors/[brandSlug]/[colorSlug]/page.tsx`

- [ ] **Step 1:** Above the matrix grid, when `brandMatrix.length > 0`, render an inline side-by-side: two large swatches (source `color.hex` + `brandMatrix[0].match_color.hex`), each labeled name/brand, with the closeness label centered between them. Tailwind only; no new file.
- [ ] **Step 2: Build + lint** (as Task 3 Step 5).
- [ ] **Step 3: Visual verify** the compare block renders on both canary URLs.
- [ ] **Step 4: Commit** `feat(color): side-by-side hero compare with nearest match`.

---

### Task 5: Verify, push, PR (NO deploy)

- [ ] **Step 1:** Full `npm run build` green; `npm run lint` clean.
- [ ] **Step 2:** Run `seo-preflight` per repo gate; address any blockers.
- [ ] **Step 3:** Push `colors-structured-depth`; open PR describing the change + the canary-validation next step. **Do not merge/deploy** (user does preview check).

## Self-Review

- **Spec coverage:** lede+trim (Task 1,3) = spec §5 trim-hard + §approach; matrix (Task 2,3) = §1 centerpiece; side-by-side (Task 4) = §2; rendered palette/collection-context (§3/§4) — already present on page (`PairingSelector`, `ComplementaryColors`, `CuratedPalettes`, same-brand `similarColors`, `moreFromFamily`); **deviation:** not adding a separate lighter/darker block this pass (existing same-brand section covers collection context) — keeps scope tight and build low-risk; revisit if canary needs more. Validation gate (spec) = Task 5 + user's GSC indexing requests.
- **Placeholder scan:** none.
- **Type consistency:** `generateColorLede(color, matches)` and `nearestMatchesPerBrand(matches)` used consistently in Task 3.
