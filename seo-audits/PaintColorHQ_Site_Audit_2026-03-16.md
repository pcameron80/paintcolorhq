# PaintColorHQ.com — Representative Site Audit

**Date:** 2026-03-16
**SOP:** Full Audit SOP (gsc-seo-agent skill)
**Pages Audited:** Homepage, Brand (Sherwin-Williams), Color (Agreeable Gray), Tool (Room Visualizer), Blog (Best White Paint Colors Guide)

---

## Site-Wide GSC Overview (Last 90 Days)

| Metric | Value |
|---|---|
| Total clicks (top 25 pages) | ~45 |
| Total impressions (top 25 pages) | ~4,000+ |
| Top page by impressions | /brands/behr (2,034 impressions, 3 clicks, avg pos 43) |
| Top page by clicks | Homepage (12 clicks, 51 impressions, avg pos 32) |
| Indexed pages crawled recently | 4 of 5 sampled pages |

**Site is very early-stage in organic performance.** Most pages rank position 25-50+, getting impressions but almost no clicks. The site needs to break into page 1 (positions 1-10) for core queries before clicks will materialize.

---

## Index Status Summary

| Page | Status | Last Crawl | Canonical Match | Rich Results |
|---|---|---|---|---|
| Homepage | ✅ Indexed | Mar 14 | ✅ Match | None |
| /brands/sherwin-williams | ✅ Indexed | Mar 6 | ✅ Match | None |
| /colors/sherwin-williams/agreeable-gray-7029 | ✅ Indexed | Mar 13 | ✅ Match | ✅ Breadcrumbs |
| /tools/room-visualizer | ✅ Indexed | Feb 12 | ✅ Match | None |
| /blog/best-white-paint-colors-guide | ⚠️ Duplicate | Mar 9 | ❌ MISMATCH | None |

---

## Pillar 1: Technical SEO & GSC Alignment

### [CRITICAL] www vs non-www Canonical Mismatch — Confirmed Active Issue

This is no longer theoretical. GSC Index Inspection confirms:

**Blog post `/blog/best-white-paint-colors-guide`:**
- User canonical: `https://www.paintcolorhq.com/blog/best-white-paint-colors-guide`
- Google's chosen canonical: `https://paintcolorhq.com/blog/best-white-paint-colors-guide` (NO www)
- Verdict: **"Duplicate, Google chose different canonical than user"**

Google is actively ignoring the www canonical and indexing the non-www version instead. This means:
1. The www and non-www versions are BOTH accessible (no proper 301 redirect)
2. Google sees them as duplicates and is choosing one arbitrarily
3. This likely affects ALL pages on the site, not just this blog post
4. Link equity, backlinks, and ranking signals are being SPLIT between two versions

**Fix — enforce a single canonical domain via Vercel/Next.js:**

```typescript
// next.config.ts — add redirect rule
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'paintcolorhq.com' }],
        destination: 'https://www.paintcolorhq.com/:path*',
        permanent: true,
      },
    ];
  },
  // ... existing config
};
```

Or in `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "has": [{ "type": "host", "value": "paintcolorhq.com" }],
      "destination": "https://www.paintcolorhq.com/$1",
      "permanent": true
    }
  ]
}
```

After deploying the redirect, request re-indexing for affected pages in GSC.

### [MEDIUM] Room Visualizer Last Crawled Feb 12 — Stale

The room visualizer was last crawled over a month ago while other pages are crawled every 1-2 weeks. Tool pages may have lower crawl priority. Consider adding more internal links to tool pages from blog posts and color pages to signal importance to Googlebot.

### [LOW] All Pages Crawled as Mobile

All 5 pages were crawled as MOBILE, confirming Google is using mobile-first indexing. No issues — the site is responsive.

---

## Pillar 2: Content Quality & E-E-A-T

### [HIGH] Homepage Ranks Position 32-98 for Core Queries

The homepage appears for queries like "paint color finder," "paint color conversion," "find similar paint colors" — but all at positions 60-98. These are the exact queries PaintColorHQ should own.

**Current homepage queries (all zero clicks):**
| Query | Impressions | Position |
|---|---|---|
| paint color formula converter | 2 | 71 |
| find paint color | 1 | 94 |
| find similar paint colors | 1 | 98 |
| paint color finder | 1 | 98 |
| paint color conversion | 1 | 97 |
| hex to benjamin moore | 1 | 62 |

**Fix:** The homepage H1 ("Your Paint Color Inspiration Starts Here") doesn't contain any of these queries. It needs to target "match paint colors across brands" or "paint color converter" explicitly. The homepage content is feature-description-heavy but keyword-light.

### [HIGH] Brand Pages Getting Impressions but Not Clicks

The Sherwin-Williams brand page has 678 impressions but only 2 clicks (0.3% CTR, avg position 46). The Behr brand page has 2,034 impressions with 3 clicks (0.1% CTR, avg position 43). These pages are being shown to users but ranking too low to get clicks.

**Top queries for /brands/sherwin-williams:**
| Query | Impressions | Position |
|---|---|---|
| all sherwin williams colors | 20 | 45 |
| all sherwin williams paint colors | 19 | 41 |
| beeswax sherwin williams | 9 | 58 |

**Fix:** The brand page title should target "all Sherwin-Williams paint colors" since that's what Google is matching it to. Current title is likely generic. Consider adding a meta description explicitly saying "Browse all 1,527 Sherwin-Williams paint colors."

### [HIGH] Blog Post Has Best Quick-Win Potential

`/blog/how-to-find-perfect-color-match-across-brands` — 79 impressions, 2 clicks, avg position 19. This is a page 2 result that could break into page 1 with content and title optimization. This is the highest-leverage single fix on the site.

### [MEDIUM] E-E-A-T Signals Weak Across All Pages

- Author bylines are "Paint Color HQ Staff" everywhere — no person or credentials
- No "About our methodology" callout on any page
- The CIEDE2000 color science differentiator is mentioned but not prominently featured
- No user counts, testimonials, or social proof anywhere

---

## Pillar 3: On-Page SEO Optimization

### [HIGH] Homepage Title and H1 Need Keyword Optimization

**Current visible H1:** "Your Paint Color Inspiration Starts Here" (zero target keywords)
**Current hidden sr-only H1:** "Match Paint Colors Across 14 Brands..." (keywords hidden)

**Fix:** Single visible H1 with keywords:
```
Match Paint Colors Across 14 Brands
```

### [HIGH] Color Page (Agreeable Gray) — Missing Key On-Page Elements

The Agreeable Gray page is a high-value page (most popular SW color) but:
- No FAQ section despite being a heavily searched color
- No "where to buy" or pricing information
- No comparison with close alternatives in a structured way (the "Similar Colors" section exists but lacks context)

**Fix — add FAQ schema targeting common queries:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What undertone does Agreeable Gray have?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Agreeable Gray SW 7029 has a warm, balanced neutral undertone with a slight greige (gray-beige) lean. It does not pull strongly blue, green, or purple like many other grays."
      }
    },
    {
      "@type": "Question",
      "name": "What is the Benjamin Moore equivalent of Agreeable Gray?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The closest Benjamin Moore match is Wish AF-680 with a Delta E of 0.91 (virtually identical). London Fog 1541 (Delta E 0.94) and Collingwood 859 (Delta E 1.05) are also very close matches."
      }
    }
  ]
}
```

### [MEDIUM] Room Visualizer Page — Very Thin Content

The room visualizer page has only ~80 words of text content. For an interactive tool page, this is expected, but it means Google has almost nothing to rank the page for. The "How to Use" section is brief.

**Fix:** Add a 300-word section below the tool explaining what the room visualizer does, who it's for, and linking to related tools and blog posts. This gives Google text to index while keeping the tool experience clean.

### [MEDIUM] Blog Post (White Paint Guide) — Good Content, Needs Internal Link Compliance Check

The white paint guide is well-structured with 8+ named colors, color family links, and tool links. However, verify it meets the full PaintColorHQ content requirements checklist (min 5 colors ✅, min 2 families, min 1 brand, min 2 tools, min 1 blog cross-link).

---

## Pillar 4: Structured Data & Rich Results

### [HIGH] Only Color Pages Have Rich Results — Massive Gap

Of the 5 pages audited, only the Agreeable Gray color page has rich results (Breadcrumbs). This means:

| Page Type | Schema Present | Rich Results |
|---|---|---|
| Homepage | WebSite + SearchAction | None detected |
| Brand page | None detected | None |
| Color page | BreadcrumbList (+ likely Product-like) | ✅ Breadcrumbs |
| Tool page | None detected | None |
| Blog post | BlogPosting | None detected |

**Fix — add schema to every page type:**

**Homepage:** Add `Organization` JSON-LD (already recommended in previous audit)

**Brand pages:** Add `CollectionPage` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Sherwin-Williams Paint Colors",
  "description": "Browse all 1,527 Sherwin-Williams paint colors with cross-brand matching, undertone tags, and LRV values.",
  "url": "https://www.paintcolorhq.com/brands/sherwin-williams",
  "numberOfItems": 1527
}
```

**Tool pages:** Add `WebApplication` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Room Color Visualizer",
  "description": "Preview paint colors on walls, ceiling, trim, and more in a realistic room scene. Free tool from Paint Color HQ.",
  "url": "https://www.paintcolorhq.com/tools/room-visualizer",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

**Blog posts:** Add `BreadcrumbList` schema (blog template fix — applies to all posts):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.paintcolorhq.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.paintcolorhq.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "{{post.title}}" }
  ]
}
```

---

## Pillar 5: Spam Policy & Reputation Safeguards

### [LOW] No Issues Detected

- All pages serve original, on-brand content
- No external outbound links on any audited page
- No sponsored content or affiliate links
- AdSense loads `afterInteractive` (correct for CWV)
- No thin/doorway pages detected

---

## Priority Summary

| # | Priority | Issue | Scope | Impact |
|---|---|---|---|---|
| 1 | **[CRITICAL]** | www vs non-www canonical mismatch CONFIRMED — Google choosing different canonical | All pages | Splitting ranking signals across two domains |
| 2 | **[HIGH]** | Homepage H1 has zero target keywords | Homepage | Can't rank for core queries (position 60-98) |
| 3 | **[HIGH]** | Brand pages ranking pos 40-46 with high impressions, near-zero clicks | Brand pages | 2,700+ impressions wasted monthly |
| 4 | **[HIGH]** | Blog "color match across brands" is a quick win at position 19 | 1 blog post | Could break page 1 with title/content optimization |
| 5 | **[HIGH]** | Schema missing on homepage, brand, tool, and blog page types | Template-level | Missing rich results across entire site |
| 6 | **[HIGH]** | E-E-A-T signals weak across all pages | Site-wide | No author credentials, no methodology prominence |
| 7 | **[MEDIUM]** | Room visualizer stale crawl + thin content | Tool pages | Low crawl priority, nothing for Google to rank |
| 8 | **[MEDIUM]** | Color pages missing FAQ schema for high-value colors | Color pages | Missing People Also Ask / FAQ rich results |
| 9 | **[LOW]** | No spam or reputation issues | Site-wide | Clean |

---

## Strategic Observations

1. **The site is early-stage but Google is paying attention.** You have 4,000+ impressions across hundreds of queries. Google is testing your pages in results — they're just not ranking high enough yet to get clicks.

2. **Fix #1 (canonical) is the foundation.** Every other optimization is undermined if link equity is split between www and non-www. This should be deployed before anything else.

3. **Template-level fixes have the highest ROI.** Adding BreadcrumbList schema to the blog template fixes all 27 posts. Adding CollectionPage schema to the brand template fixes all 14 brand pages. One PR can fix hundreds of pages.

4. **The "color match across brands" blog post at position 19 is your best quick win.** Optimize its title, add more internal links to it, and it could hit page 1 within weeks.

5. **Individual color pages are your long-tail play.** Some are already ranking position 3-11 (Hirshfield's Seal Blue at 3.6, Dunn-Edwards Apple Martini at 4.7). As Google indexes more of your 25,000+ color pages, these will compound.
