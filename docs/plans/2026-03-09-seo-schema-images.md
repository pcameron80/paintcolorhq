# SEO Schema & Image Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve brand page structured data (CollectionPage + ItemList) and add real images to color detail pages for Google Image search indexing.

**Architecture:** Two independent changes: (1) Replace Organization JSON-LD with CollectionPage/ItemList on brand pages, (2) Replace the CSS div swatch on color detail pages with an img tag using the existing /api/og endpoint, and add image to the JSON-LD.

**Tech Stack:** Next.js App Router, JSON-LD structured data, existing /api/og image endpoint

---

### Task 1: Update brand page JSON-LD to CollectionPage + ItemList

**Files:**
- Modify: `src/app/brands/[brandSlug]/page.tsx` (lines 233-244)

**Step 1: Replace the JSON-LD block**

Replace the existing Organization schema JSON-LD with a CollectionPage schema that includes:
- @type: CollectionPage
- name, description, url matching the page metadata
- BreadcrumbList (Home > Brands > Brand Name)
- mainEntity as ItemList with numberOfItems = totalCount
- itemListElement: map over the `colors` array on the current page, each as a ListItem with position, url, and name

Note: The JSON-LD uses `JSON.stringify()` which safely escapes all values. The data comes from the database (brand names, slugs, color names) which is trusted internal data. This is the standard Next.js pattern for structured data already used throughout this codebase.

**Step 2: Verify it builds**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npx tsc --noEmit --pretty 2>&1 | grep -i error | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/brands/[brandSlug]/page.tsx
git commit -m "feat: upgrade brand page schema from Organization to CollectionPage with ItemList"
```

---

### Task 2: Add image tag to color detail page hero swatch

**Files:**
- Modify: `src/app/colors/[brandSlug]/[colorSlug]/page.tsx` (lines 226-230 and around line 449)

**Step 1: Replace the CSS div swatch with an img tag**

Replace the plain div swatch with a container that has background-color as placeholder plus an img tag on top:
- Container: relative, aspect-square, overflow-hidden, rounded-2xl, border, background-color as placeholder
- img: src pointing to /api/og endpoint with hex/name/brand params, descriptive alt text like "Color Name Color Number by Brand Name paint color swatch", width 1200 height 630, loading eager, absolute positioned to fill container with object-cover

**Step 2: Add image field to the JSON-LD**

Add an `image` property to the existing WebPage JSON-LD (before the `about` field), pointing to the full OG image URL at www.paintcolorhq.com/api/og with the same hex/name/brand params.

Note: The JSON-LD values come from trusted database fields (color name, brand name, hex codes) and are safely serialized via JSON.stringify(). This is the same pattern already used on this page.

**Step 3: Verify it builds**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npx tsc --noEmit --pretty 2>&1 | grep -i error | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/colors/[brandSlug]/[colorSlug]/page.tsx
git commit -m "feat: add OG image to color page hero swatch for image search indexing"
```

---

### Task 3: Smoke test

**Step 1: Start dev server**

Run: `cd /Users/philipcameron/Documents/GitHub/paintcolorhq && npm run dev`

**Step 2: Test brand page schema**

1. Navigate to http://localhost:3000/brands/behr
2. View page source, find the JSON-LD script
3. Verify it shows @type: CollectionPage with mainEntity @type: ItemList
4. Verify numberOfItems matches the total count
5. Verify itemListElement contains ListItems with URLs and names

**Step 3: Test color page image**

1. Navigate to any color page
2. Verify the hero swatch shows the OG image (with color name and brand text overlaid)
3. Right-click the image — verify alt text contains color name and brand
4. View page source — verify JSON-LD has image field with the OG URL

**Step 4: Commit if adjustments needed**

```bash
git add -A
git commit -m "fix: adjustments from smoke test"
```
