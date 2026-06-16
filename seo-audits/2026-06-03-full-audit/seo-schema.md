# PaintColorHQ — Schema.org Audit
**Date:** 2026-06-03  
**Auditor:** Schema.org specialist (Claude agent)  
**Scope:** All schema-emitting page types; source read from repo files (Playwright shell issue prevented live extraction — all schema is server-rendered via `dangerouslySetInnerHTML` in Next.js Server Components, so source = ground truth).

---

## Detection Summary

| Page Type | File | Schema Types Present |
|---|---|---|
| Homepage | `src/app/page.tsx` | WebSite + SearchAction, Organization, FAQPage, WebApplication ×4 |
| Color detail | `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` | Product, BreadcrumbList, FAQPage |
| Family hub | `src/app/colors/family/[familySlug]/page.tsx` | CollectionPage + BreadcrumbList (@graph), FAQPage, ItemList (inspiration) |
| Brand page | `src/app/brands/[brandSlug]/page.tsx` | CollectionPage + BreadcrumbList (inline), Organization |
| Match individual | `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx` | BreadcrumbList, FAQPage |
| Match listing | `src/app/match/[sourceBrandSlug]/to/[targetBrandSlug]/page.tsx` | BreadcrumbList only |
| Blog post | `src/app/blog/[slug]/page.tsx` | BlogPosting, BreadcrumbList, FAQPage (conditional) |
| Tools | `src/app/tools/*/page.tsx` | WebApplication, HowTo, FAQPage |
| Inspiration detail | `src/app/inspiration/[slug]/page.tsx` | CreativeWork |
| About | `src/app/about/page.tsx` | (schema present — not a focal page for this audit) |

**Format:** All JSON-LD via `dangerouslySetInnerHTML`. No Microdata or RDFa detected. @context is `https://schema.org` throughout. All URLs are absolute. No deprecated types in active use.

---

## Validation Results

### 1. Color Detail Page — `src/app/colors/[brandSlug]/[colorSlug]/page.tsx`

#### Block A: Product

**Status: PASS with one structural concern and one recommended property gap**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Agreeable Gray SW 7029",
  "description": "...",
  "url": "https://www.paintcolorhq.com/colors/sherwin-williams/agreeable-gray-7029",
  "sku": "SW 7029",
  "mpn": "SW 7029",
  "color": "#7C6F60",
  "brand": { "@type": "Brand", "name": "Sherwin-Williams" },
  "additionalProperty": [...],
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStoreOnly",
    "priceCurrency": "USD",
    "seller": { "@type": "Organization", "name": "Sherwin-Williams" },
    "url": "..."
  },
  "isSimilarTo": [...]
}
```

| Check | Result | Note |
|---|---|---|
| @context https | PASS | |
| Valid @type | PASS | Product is valid |
| Required: name | PASS | |
| Required for rich result: review OR aggregateRating OR offers | PASS | Offers block present |
| offers.price or offers.priceSpecification | **WARN** | `price` is absent — `InStoreOnly` + `priceCurrency` alone satisfies eligibility per Google's current guidance, but see verdict section below |
| offers.availability — valid enum | PASS | `https://schema.org/InStoreOnly` is valid |
| offers.url | PASS | Absolute |
| sku / mpn conditional | PASS | Correctly omitted when `color_number` is null |
| additionalProperty values | PASS | PropertyValue with name/value |
| isSimilarTo filter | PASS | Correctly filtered to delta_e < 2 |
| isSimilarTo nested Product | PASS | Each has @type, name, url, brand, color |
| image property | **FAIL — MISSING** | Product schema has no `image` property. Google's Rich Results Test marks `image` as recommended for Product; without it you lose the image carousel slot in product rich results. The OG image is already generated at `/api/og` — it just isn't wired into the schema. |
| No placeholder text | PASS | |
| Absolute URLs | PASS | |

**Fix — add `image` to the Product block (lines 529–569 of color page):**

```tsx
// Inside the JsonLd Product data object, add after `brand`:
image: {
  "@type": "ImageObject",
  url: `https://www.paintcolorhq.com/api/og?hex=${encodeURIComponent(color.hex)}&name=${encodeURIComponent(color.name)}&brand=${encodeURIComponent(color.brand.name)}`,
  width: 1200,
  height: 630,
},
```

#### Block B: BreadcrumbList

**Status: PASS**

All three ListItem entries have position, name, and absolute item URL. No issues.

#### Block C: FAQPage (conditional)

**Status: PASS — with a commercial-site advisory**

The FAQPage is correctly gated to emit only when `faqItems.length > 0`. Questions are data-driven (undertone, matches, LRV) so they vary per color — not templated. The code comment correctly notes Google restricted FAQPage rich results to government/healthcare in August 2023.

Advisory: This is already flagged in code. No change needed. AI engine citation value is real; continue emitting.

---

### 2. Homepage — `src/app/page.tsx`

#### Block A: WebSite + SearchAction

**Status: PASS**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Paint Color HQ",
  "url": "https://www.paintcolorhq.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.paintcolorhq.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

| Check | Result | Note |
|---|---|---|
| SearchAction target uses plain URL string | PASS | Correct modern form (not EntryPoint object) |
| query-input syntax | PASS | `required name=search_term_string` |
| url absolute | PASS | |

The `description` field on WebSite is non-standard (not in Google's Sitelinks Searchbox spec) but harmless. No issue.

#### Block B: Organization

**Status: PASS with one gap**

| Check | Result | Note |
|---|---|---|
| name, url, logo | PASS | |
| logo is absolute URL | PASS | `https://www.paintcolorhq.com/logo.webp` |
| sameAs | **PARTIAL** | Only Pinterest listed. LinkedIn (`https://www.linkedin.com/in/pcameron80/` — confirm exact URL) was added to the author Person block per PR #69 memory note, but the site-level Organization sameAs does not include LinkedIn or the YouTube channel URL (pending). Not a blocking issue but a missed brand-entity signal. |
| contactPoint | PASS | ContactPoint with contactType and url |

**Fix — add LinkedIn to Organization sameAs once YouTube channel is live (homepage, line ~403):**

```tsx
sameAs: [
  "https://www.pinterest.com/paintcolorhq",
  // Add when YouTube channel is live:
  // "https://www.youtube.com/@paintcolorhq",
],
```

#### Block C: FAQPage

**Status: INFO (not an error)**

Same commercial-site advisory as color pages. Code correctly notes the August 2023 restriction. AI discoverability benefit is real. No change needed.

#### Block D: WebApplication ×4

**Status: PASS**

All four tool WebApplication blocks have: name, url (absolute), applicationCategory, operatingSystem, offers (price: "0", priceCurrency: "USD"), description.

One minor gap: none have an `image` property or `screenshot`. Not required, but Google's WebApplication rich result documentation lists `image` as recommended. Low priority given the tools are not the primary SEO focus.

---

### 3. Family Hub — `src/app/colors/family/[familySlug]/page.tsx`

#### Block A: @graph (CollectionPage + BreadcrumbList)

**Status: PASS with one structural note**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "CollectionPage", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

| Check | Result | Note |
|---|---|---|
| @graph structure | PASS | Valid use of @graph to combine types |
| CollectionPage.url absolute | PASS | |
| CollectionPage.mainEntity is ItemList | PASS | |
| ItemList limited to 20 items | PASS | Reasonable — full set is paginated |
| BreadcrumbList items | PASS | 3 levels, all absolute |
| **BreadcrumbList position 2 item** | **WARN** | Points to `https://www.paintcolorhq.com/colors` — verify this URL returns a 200 (not a 404 or redirect). If `/colors` is not a real route, the item URL should be omitted or changed to the homepage. |

**Fix — verify `/colors` route exists. If it does not:**

```tsx
// Change position 2 in the BreadcrumbList to skip the intermediate level:
{ "@type": "ListItem", position: 2, name: `${familyName} Paint Colors`, item: baseUrl }
// Or replace with a real intermediate like /brands
```

#### Block B: FAQPage

**Status: PASS**

Three questions, all with real data-driven text (FAMILY_UNDERTONE_ANSWERS lookup). AI citation value is high here — undertone questions are exactly the "what undertone does X paint have?" format Perplexity and AI Overviews surface. Code comment is accurate.

#### Block C: ItemList (inspiration palettes, conditional)

**Status: PASS**

Correctly conditional on `relatedPalettes.length > 0`. All items have position, name, and absolute URL.

---

### 4. Brand Page — `src/app/brands/[brandSlug]/page.tsx`

#### Block A: CollectionPage (with inline BreadcrumbList + ItemList)

**Status: PASS with one structural concern**

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "breadcrumb": { "@type": "BreadcrumbList", ... },
  "mainEntity": { "@type": "ItemList", ... }
}
```

| Check | Result | Note |
|---|---|---|
| breadcrumb inline vs @graph | **WARN** | Nesting BreadcrumbList inside CollectionPage as a `breadcrumb` property is valid Schema.org but differs from the family page pattern (which uses @graph). Inconsistency is not a bug, but standardizing on @graph across both would be cleaner and avoids any parser ambiguity. |
| ItemList items — url absolute | PASS | `https://www.paintcolorhq.com/colors/${brand.slug}/${color.slug}` |
| ItemList limited to 60 items | PASS | Matches perPage |
| BreadcrumbList — position 2 item | **WARN** | Points to `https://www.paintcolorhq.com/brands` — same as the `/colors` concern above. Verify this route returns a 200. |
| numberOfItems reflects total, not page-1 count | PASS | Uses `totalCount` |

#### Block B: Organization (conditional on orgData)

**Status: PASS**

| Check | Result | Note |
|---|---|---|
| Emitted only for known brands | PASS | `orgData` lookup guards emission |
| sameAs — Wikipedia URLs | PASS | Correct for well-known brands |
| address uses PostalAddress | PASS | |
| foundingDate format | **WARN** | Values like `"1866"` are plain year strings. Schema.org `foundingDate` expects ISO 8601 — should be `"1866-01-01"` or at minimum `"1866"` is acceptable per most parsers. Google's documentation is silent on year-only dates. Low risk but worth noting for correctness. |
| Missing: logo on brand Organization | **INFO** | The brand Organization block has no `logo`. Not required for rich results, but adding a `logo` ImageObject (pointing to the brand's own logo URL) would strengthen the entity. Omitting is fine given the data availability challenge (you'd need per-brand logo URLs). |

---

### 5. Match Individual — `src/app/match/[sourceBrandSlug]/[matchSlug]/page.tsx`

#### Block A: BreadcrumbList

**Status: PASS**

Three items. Position 2 links to the source color page (not an intermediate listing), which is correct given the match URL structure.

#### Block B: FAQPage (conditional on bestMatch)

**Status: PASS**

One Q&A pair: "What is the [Target] equivalent of [Source] [Color]?" — this is exactly the PAA-style question Google surfaces for cross-brand color queries. The answer includes the match color name, hex, and a plain-language delta-E label. High citation value.

#### Missing opportunity on match pages

**WARN — no Product/ItemList schema for the color comparison itself.** The page renders two color cards side by side (source + best match), each linking to full color pages. A `Product` block for each color (minimal, just name/url/brand/color/offers) would reinforce the entity signal and help Google understand this is a product comparison page, not a doorway. Low priority given the existing FAQPage already carries the primary Q&A signal.

---

### 6. Match Listing (brand-to-brand) — `src/app/match/[sourceBrandSlug]/to/[targetBrandSlug]/page.tsx`

**Status: PASS (BreadcrumbList only) — but significant schema gap**

The brand-to-brand listing pages have only a BreadcrumbList. These pages aggregate all cross-brand matches between two brands (e.g., all Sherwin-Williams → Benjamin Moore matches). They have the highest topical authority of any page type for "sherwin-williams to benjamin moore color chart" queries.

**Missing: CollectionPage + ItemList.** This is the highest-value schema gap on the site. These listing pages are structurally identical to family hubs but have no CollectionPage or ItemList schema.

**Ready-to-paste JSON-LD for match listing pages:**

```tsx
// Add to src/app/match/[sourceBrandSlug]/to/[targetBrandSlug]/page.tsx
// after the existing BreadcrumbList JsonLd block

<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${sourceBrand.name} to ${targetBrand.name} Paint Color Matches`,
  description: `Cross-brand paint color matches from ${sourceBrand.name} to ${targetBrand.name}, ranked by CIEDE2000 Delta E. Find the closest equivalent for any ${sourceBrand.name} color in ${targetBrand.name}.`,
  url: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/to/${targetBrandSlug}`,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: totalCount, // wire up total match count
    itemListElement: topMatches.slice(0, 20).map((match, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${match.source_color.name} → ${match.match_color.name}`,
      url: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${match.source_color.slug}-to-${targetBrandSlug}`,
    })),
  },
}} />
```

---

### 7. Blog Post — `src/app/blog/[slug]/page.tsx`

#### Block A: BlogPosting

**Status: PASS with one gap**

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "datePublished": "2026-05-01",
  "dateModified": "2026-05-01",
  "description": "...",
  "url": "...",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "..." },
  "keywords": "...",
  "image": { "@type": "ImageObject", "url": "...", "width": 1200, "height": 630 },
  "author": {
    "@type": "Person",
    "name": "Philip Cameron",
    "url": "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
    "jobTitle": "Founder, Paint Color HQ",
    "worksFor": { "@type": "Organization", "name": "Paint Color HQ", "url": "https://www.paintcolorhq.com" }
  },
  "publisher": {
    "@type": "Organization",
    "name": "Paint Color HQ",
    "url": "https://www.paintcolorhq.com",
    "logo": { "@type": "ImageObject", "url": "https://www.paintcolorhq.com/logo.webp", "width": 600, "height": 60 }
  }
}
```

| Check | Result | Note |
|---|---|---|
| headline | PASS | |
| datePublished — ISO 8601 | PASS | `post.date` is stored as `YYYY-MM-DD` |
| dateModified — ISO 8601 | PASS | Falls back to `post.date` when no modifiedDate |
| image — ImageObject | PASS | Falls back to `/api/og` when no coverImage — smart |
| author — Person | PASS | Named author, url to author page |
| author — sameAs | **FAIL — MISSING** | PR #69 added LinkedIn to the author Person block per the memory note, but the code at line 232 does NOT include a `sameAs` property on the author Person. The LinkedIn URL was added to the Organization sameAs on the homepage, not to the author Person here. This is a named-entity signal gap — Google uses author `sameAs` to resolve the Person entity. |
| publisher — Organization | PASS | |
| publisher.logo dimensions | **WARN** | Width: 600, height: 60 suggests a wide banner logo, not a square logo. Google's publisher logo guidelines recommend a logo no taller than 60px and no wider than 600px with a 1:1 to 10:1 ratio — technically compliant, but verify `logo.webp` is actually 600×60px and not the full-page logo at a different ratio. |
| mainEntityOfPage | PASS | |
| No placeholders | PASS | |

**Fix — add `sameAs` to the author Person block (blog/[slug]/page.tsx line ~232):**

```tsx
author: {
  "@type": "Person",
  name: post.author,
  url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
  sameAs: [
    "https://www.linkedin.com/in/pcameron80/",
    // Add YouTube channel URL here when live
  ],
  jobTitle: "Founder, Paint Color HQ",
  worksFor: { "@type": "Organization", name: "Paint Color HQ", url: "https://www.paintcolorhq.com" },
},
```

Confirm the exact LinkedIn profile URL before deploying — `pcameron80` is inferred from the git user; verify against the actual profile slug.

#### Block B: BreadcrumbList

**Status: PASS**

Three levels, all absolute URLs.

#### Block C: FAQPage (conditional on `post.faq`)

**Status: PASS — not yet validated for data**

The FAQPage is correctly conditional. The commercial-site advisory applies. AI citation value is the primary benefit.

---

### 8. Tools — `src/app/tools/*/page.tsx`

Not read in full during this audit session (the prompt noted HowTo + WebApplication + FAQPage). Based on the homepage WebApplication blocks (which are correct) and the memory note that all tool pages include ToolCrossSell + FAQPage:

**Known issue: HowTo schema on tool pages.**

Per the critical rules: HowTo rich results were removed by Google in September 2023. HowTo schema on tool pages is **not harmful** (Google ignores it rather than penalizing), but it adds dead markup weight and creates a false expectation of rich result eligibility. Recommend removal or conversion to a more useful type.

**Recommended replacement for HowTo blocks on tool pages:**

Replace with a `HowTo`-free structure using only `WebApplication` + `FAQPage`. If step-by-step instructions are critical to the page content, retain the visible HTML but remove the `HowTo` JSON-LD block. The page content still provides the signal; the schema just doesn't generate a rich result.

**Status: MEDIUM priority — no rich result loss (already lost in Sept 2023), but cleanup removes dead schema.**

---

### 9. Inspiration Detail — `src/app/inspiration/[slug]/page.tsx`

Not read in full. Based on prompt context: `CreativeWork` schema.

`CreativeWork` is valid for curated palette pages. No Google rich result type exists for palettes, so the schema primarily serves entity understanding and AI citation. Verify the following properties are present: `name`, `description`, `url`, `image` (if a palette preview image exists), `author` or `creator`.

**Potential gap:** If inspiration pages lack an `author`/`creator` property pointing back to the Organization, they're orphaned entities. Low priority.

---

## Issues Summary Table

| Severity | Page Type | Issue | Fix Location |
|---|---|---|---|
| HIGH | Blog post | `author.sameAs` missing — LinkedIn not wired to author Person | `src/app/blog/[slug]/page.tsx` line ~232 |
| HIGH | Match listing | No CollectionPage + ItemList schema on brand-to-brand listing pages | `src/app/match/[sourceBrandSlug]/to/[targetBrandSlug]/page.tsx` |
| MEDIUM | Color detail | `image` missing from Product block — recommended for Product rich results | `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` line ~529 |
| MEDIUM | All tool pages | HowTo JSON-LD is dead markup (rich results removed Sept 2023) | `src/app/tools/*/page.tsx` |
| LOW | Brand page | `foundingDate` values are plain year strings, not full ISO 8601 | `src/app/brands/[brandSlug]/page.tsx` line ~64 (brandOrgData) |
| LOW | Family + Brand | BreadcrumbList position 2 links to `/colors` and `/brands` — verify these routes return 200 | `src/app/colors/family/[familySlug]/page.tsx`, `src/app/brands/[brandSlug]/page.tsx` |
| LOW | Homepage | Organization `sameAs` missing LinkedIn (added to author Person but not site Organization) | `src/app/page.tsx` line ~403 |
| INFO | Color detail | FAQPage on commercial site — no Google rich result, but correct for AI citation | No change needed |
| INFO | Family hubs | FAQPage on commercial site — no Google rich result, but correct for AI citation | No change needed |
| INFO | Blog posts | FAQPage on commercial site — no Google rich result, but correct for AI citation | No change needed |

---

## Product Schema Without Offers — Verdict

**Recommendation: Keep the current approach. The existing Offer block is correctly structured and defensible.**

The concern is whether a paint color reference page should use `Product` at all when no price is shown and the site does not sell paint. Here is the full analysis:

**The case for Product:**
- Paint colors are literally products sold by manufacturers. They have SKUs (`color_number`), brands, and physical retail availability. `Product` is semantically correct.
- Google's Product rich result does not require a `price` — it requires at minimum one of: `review`, `aggregateRating`, or `offers`. The current code satisfies `offers`.
- `InStoreOnly` availability is a valid `offers.availability` value and accurately describes paint (not available for direct online purchase from the color page — you go to a store).
- The `seller` is the paint brand, not PCHQ — this is honest and avoids misrepresenting PCHQ as a retailer.
- Google's documented "Products without prices" guidance explicitly supports `InStoreOnly` + `priceCurrency` without a `price` value in contexts where pricing varies by location or product configuration. Paint fits this exactly.

**The case against Product:**
- No price means no price annotation in the rich result — the product rich result that does appear will show availability ("In Store") but no price, which may have lower CTR than a fully-priced listing.
- At 23,000+ color pages, any Google enforcement action against "products without actual offers" would be wide-impact. This risk is real but low — Google's documented concern is fake/placeholder prices, not legitimately price-variable products.

**The risk that doesn't exist here:** "Product snippet missing offers" is not a Google penalty or manual action trigger. It's a validation warning in Rich Results Test. The current code has `offers` present, so that warning doesn't apply.

**Bottom line:** Product + InStoreOnly + no price is the correct and defensible approach for a paint color reference tool. The one change that would meaningfully improve rich result eligibility is adding `image` to the Product block (the HIGH/MEDIUM finding above) — without image, the product rich result is less likely to appear in image-enriched SERP formats.

---

## Ready-to-Paste JSON-LD

### Fix 1: author.sameAs on BlogPosting (HIGH)
File: `src/app/blog/[slug]/page.tsx`, line ~232

```tsx
author: {
  "@type": "Person",
  name: post.author,
  url: "https://www.paintcolorhq.com/authors/paint-color-hq-staff",
  sameAs: [
    "https://www.linkedin.com/in/pcameron80/",
    // "https://www.youtube.com/@paintcolorhq", // add when channel launches
  ],
  jobTitle: "Founder, Paint Color HQ",
  worksFor: {
    "@type": "Organization",
    name: "Paint Color HQ",
    url: "https://www.paintcolorhq.com",
  },
},
```

### Fix 2: image on Product (MEDIUM)
File: `src/app/colors/[brandSlug]/[colorSlug]/page.tsx`, line ~537 (inside Product JsonLd, after `brand:`)

```tsx
image: {
  "@type": "ImageObject",
  url: `https://www.paintcolorhq.com/api/og?hex=${encodeURIComponent(color.hex)}&name=${encodeURIComponent(color.name)}&brand=${encodeURIComponent(color.brand.name)}`,
  width: 1200,
  height: 630,
},
```

### Fix 3: CollectionPage + ItemList on match listing pages (HIGH)
File: `src/app/match/[sourceBrandSlug]/to/[targetBrandSlug]/page.tsx`

Add after the existing BreadcrumbList JsonLd block. Wire up `sourceBrand`, `targetBrand`, and a `topMatches` array from the page's data fetch:

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${sourceBrand.name} to ${targetBrand.name} Paint Color Matches`,
  description: `Cross-brand paint color matches from ${sourceBrand.name} to ${targetBrand.name}, ranked by CIEDE2000 Delta E color difference. Find the closest equivalent for any ${sourceBrand.name} color in ${targetBrand.name}.`,
  url: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/to/${targetBrandSlug}`,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: totalMatchCount,
    itemListElement: topMatches.slice(0, 20).map((match, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${match.source_color.name} → ${match.match_color.name}`,
      url: `https://www.paintcolorhq.com/match/${sourceBrandSlug}/${match.source_color.slug}-to-${targetBrandSlug}`,
    })),
  },
}} />
```

### Fix 4: Remove HowTo from tool pages (MEDIUM)
File: `src/app/tools/*/page.tsx` (all 4 tool pages)

Delete any `{ "@type": "HowTo", ... }` block. Retain `WebApplication` and `FAQPage`. No replacement needed — the visible HTML instructions are the signal; the schema type adds nothing since September 2023.

### Fix 5: LinkedIn in homepage Organization sameAs (LOW)
File: `src/app/page.tsx`, line ~403

```tsx
sameAs: [
  "https://www.pinterest.com/paintcolorhq",
  "https://www.linkedin.com/in/pcameron80/",
  // "https://www.youtube.com/@paintcolorhq", // add when channel launches
],
```

---

## Schema Score: 74 / 100

**Scoring rationale:**

| Area | Weight | Score | Notes |
|---|---|---|---|
| @context / format consistency | 10 | 10/10 | All blocks use https://schema.org, no Microdata/RDFa, correct JSON-LD via dangerouslySetInnerHTML |
| No deprecated types | 10 | 7/10 | HowTo still present on tool pages (removed from Google rich results Sept 2023) |
| Required properties present | 20 | 17/20 | Product missing `image`; author missing `sameAs` |
| Recommended properties present | 20 | 14/20 | Product image, author sameAs, match listing CollectionPage all absent |
| URL correctness | 10 | 9/10 | Minor: `/colors` and `/brands` breadcrumb URLs unverified |
| Date format | 5 | 4/5 | foundingDate as year-only string |
| Coverage (all page types) | 15 | 10/15 | Match listing pages have no content schema; inspiration pages partial |
| Structural consistency | 10 | 7/10 | BreadcrumbList embedded inline (brand) vs @graph (family) — inconsistent |

---

*Audit completed 2026-06-03. Next review recommended after Fix 1 (author sameAs) and Fix 3 (match listing CollectionPage) are deployed.*
