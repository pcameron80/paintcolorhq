# Blog Pipeline Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two DB-backed helper scripts that operationalize the blog pipeline's data-moat (Stage 1 research) and source-grounded link verification (Stage 3), so post accuracy never depends on Philip fact-checking.

**Architecture:** Two concerns, each split into a pure library module (unit-tested with fixtures, no I/O) and a thin runner script (CLI + Supabase calls + file writes). Mirrors the existing `scripts/pinterest/queue.ts` (pure, tested) + `scripts/pinterest-generate.ts` (runner) split. The runbook (process) and `generate-blog-hero.ts` (Stage 5) already exist; this plan adds only the missing scriptable pieces.

**Tech Stack:** TypeScript, tsx, `node:test` (matching `npm run test:pinterest`), dotenv, the existing `src/lib/queries.ts` Supabase query functions.

---

## File Structure

- `scripts/blog/research-colors-lib.ts` — pure: `parseColorRef`, `bestMatchPerBrand`, `formatResearchMarkdown` + types. No I/O.
- `scripts/blog/research-colors.ts` — runner: reads color refs, calls `getColorBySlug` + `getCrossBrandMatches`, writes the research brief.
- `scripts/blog/verify-links-lib.ts` — pure: `extractInternalLinks`, `parseColorHref`, `parseMatchBrands` + types. No I/O.
- `scripts/blog/verify-links.ts` — runner: reads a draft file, gathers known sets (DB + blog-posts.tsx), reports unresolved links, exits non-zero on failure.
- `scripts/blog/research-colors-lib.test.ts`, `scripts/blog/verify-links-lib.test.ts` — unit tests.
- `package.json` — add `research-colors`, `verify-links`, `test:blog` scripts.
- `docs/superpowers/content/blog-pipeline-runbook.md` — update Stage 1/3 notes to reference the now-built scripts.

**Established patterns to follow:**
- Runners load env first: `dotenv.config({ path: path.resolve(__dirname, "../../.env.local") })` BEFORE importing anything that touches Supabase. (queries.ts reads `process.env` at import.)
- `import { getColorBySlug } from "../../src/lib/queries.ts";` (tsx resolves `.ts`).
- Query return types: `getColorBySlug(brandSlug, colorSlug): Promise<ColorWithBrand | null>`; `getCrossBrandMatches(colorId): Promise<CrossBrandMatchWithColor[]>` where each row is `{ id, delta_e_score, match_color: { id, name, slug, hex, brand: { name, slug } } }`.
- In local dev (no `VERCEL_URL`), `getCrossBrandMatches` falls back to the live Supabase query — works from a script.

---

### Task 1: research-colors-lib.ts (pure functions + tests)

**Files:**
- Create: `scripts/blog/research-colors-lib.ts`
- Test: `scripts/blog/research-colors-lib.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// scripts/blog/research-colors-lib.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseColorRef, bestMatchPerBrand, formatResearchMarkdown } from "./research-colors-lib.ts";

test("parseColorRef splits brand and color on the first slash", () => {
  assert.deepEqual(parseColorRef("benjamin-moore/hale-navy-hc-154"), {
    brandSlug: "benjamin-moore",
    colorSlug: "hale-navy-hc-154",
  });
});

test("parseColorRef trims whitespace", () => {
  assert.deepEqual(parseColorRef("  sherwin-williams/naval-6244 "), {
    brandSlug: "sherwin-williams",
    colorSlug: "naval-6244",
  });
});

test("parseColorRef throws on missing slash or empty side", () => {
  assert.throws(() => parseColorRef("nope"));
  assert.throws(() => parseColorRef("brand/"));
  assert.throws(() => parseColorRef("/color"));
});

test("bestMatchPerBrand picks the closest match per other brand and excludes source brand", () => {
  const matches = [
    { delta_e_score: 0.0, match_color: { name: "Self", slug: "self", hex: "#000", brand: { name: "Benjamin Moore", slug: "benjamin-moore" } } },
    { delta_e_score: 3.0, match_color: { name: "Naval", slug: "naval-6244", hex: "#34405A", brand: { name: "Sherwin-Williams", slug: "sherwin-williams" } } },
    { delta_e_score: 2.1, match_color: { name: "Indigo", slug: "indigo", hex: "#35415B", brand: { name: "Sherwin-Williams", slug: "sherwin-williams" } } },
    { delta_e_score: 1.8, match_color: { name: "Composed", slug: "composed", hex: "#333", brand: { name: "Behr", slug: "behr" } } },
  ];
  const rows = bestMatchPerBrand(matches, "benjamin-moore");
  assert.equal(rows.length, 2); // BM excluded, one SW (the 2.1), one Behr
  assert.equal(rows[0].brandName, "Behr"); // sorted by brandName asc
  assert.equal(rows[1].brandName, "Sherwin-Williams");
  assert.equal(rows[1].slug, "indigo"); // 2.1 beat 3.0
  assert.equal(rows[1].deltaE, 2.1);
});

test("formatResearchMarkdown includes topic, color facts, and a match table row", () => {
  const md = formatResearchMarkdown("best blue paint colors", [
    {
      brandName: "Benjamin Moore", brandSlug: "benjamin-moore", name: "Hale Navy", colorSlug: "hale-navy-hc-154",
      colorNumber: "HC-154", hex: "#3B444B", lrv: 8, undertone: "green", family: "blue",
      matches: [{ brandName: "Behr", brandSlug: "behr", name: "Composed", slug: "composed", hex: "#333", deltaE: 1.8 }],
    },
  ]);
  assert.match(md, /best blue paint colors/);
  assert.match(md, /Hale Navy/);
  assert.match(md, /#3B444B/);
  assert.match(md, /LRV.*8/);
  assert.match(md, /Behr.*Composed.*1\.8/s);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test scripts/blog/research-colors-lib.test.ts`
Expected: FAIL — `Cannot find module './research-colors-lib.ts'`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/blog/research-colors-lib.ts
/** Pure helpers for the blog research step. No I/O — unit-tested with fixtures. */

export interface ColorRef {
  brandSlug: string;
  colorSlug: string;
}

/** Parse "benjamin-moore/hale-navy-hc-154" → {brandSlug, colorSlug}.
 *  Brand and color slugs never contain "/", so split on the first slash. */
export function parseColorRef(raw: string): ColorRef {
  const trimmed = raw.trim();
  const i = trimmed.indexOf("/");
  if (i <= 0 || i === trimmed.length - 1) {
    throw new Error(`Invalid color ref "${raw}" — expected "brand-slug/color-slug"`);
  }
  return { brandSlug: trimmed.slice(0, i), colorSlug: trimmed.slice(i + 1) };
}

export interface MatchRow {
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  hex: string;
  deltaE: number;
}

interface RawMatch {
  delta_e_score: number;
  match_color: { name: string; slug: string; hex: string; brand: { name: string; slug: string } } | null;
}

/** From a color's cross-brand matches, pick the single closest match in each OTHER
 *  brand (excludes the source brand). Returns sorted by brand name ascending. */
export function bestMatchPerBrand(matches: RawMatch[], sourceBrandSlug: string): MatchRow[] {
  const best = new Map<string, MatchRow>();
  for (const m of matches) {
    const mc = m.match_color;
    if (!mc?.brand || mc.brand.slug === sourceBrandSlug) continue;
    const existing = best.get(mc.brand.slug);
    if (!existing || m.delta_e_score < existing.deltaE) {
      best.set(mc.brand.slug, {
        brandName: mc.brand.name,
        brandSlug: mc.brand.slug,
        name: mc.name,
        slug: mc.slug,
        hex: mc.hex,
        deltaE: m.delta_e_score,
      });
    }
  }
  return [...best.values()].sort((a, b) => a.brandName.localeCompare(b.brandName));
}

export interface ResearchColor {
  brandName: string;
  brandSlug: string;
  name: string;
  colorSlug: string;
  colorNumber: string | null;
  hex: string;
  lrv: number | null;
  undertone: string | null;
  family: string | null;
  matches: MatchRow[];
}

/** Render the verified research brief as markdown — the ground truth for drafting
 *  (Stage 1) and fact-verification (Stage 3). */
export function formatResearchMarkdown(topic: string, colors: ResearchColor[], generatedOn?: string): string {
  const lines: string[] = [];
  lines.push(`# Research: ${topic}`);
  lines.push("");
  lines.push(
    `> Verified from the PaintColorHQ database${generatedOn ? ` on ${generatedOn}` : ""}. ` +
      `Every hex, LRV, undertone, and cross-brand match below is first-party data. ` +
      `Cite these values exactly; do not invent or round them.`,
  );
  lines.push("");
  for (const c of colors) {
    const num = c.colorNumber ? ` (${c.colorNumber})` : "";
    lines.push(`## ${c.name} — ${c.brandName}${num}`);
    lines.push(
      `- Hex: ${c.hex} | LRV: ${c.lrv ?? "n/a"} | Undertone: ${c.undertone ?? "n/a"} | Family: ${c.family ?? "n/a"}`,
    );
    lines.push(`- URL: /colors/${c.brandSlug}/${c.colorSlug}`);
    if (c.matches.length > 0) {
      lines.push("");
      lines.push("| Closest match in | Color | Hex | Delta E |");
      lines.push("|---|---|---|---|");
      for (const m of c.matches) {
        lines.push(`| ${m.brandName} | ${m.name} | ${m.hex} | ${m.deltaE.toFixed(1)} |`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test scripts/blog/research-colors-lib.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog/research-colors-lib.ts scripts/blog/research-colors-lib.test.ts
git commit -m "feat(blog-pipeline): research-colors pure lib + tests"
```

---

### Task 2: research-colors.ts runner

**Files:**
- Create: `scripts/blog/research-colors.ts`
- Modify: `package.json` (scripts block)

- [ ] **Step 1: Add the npm scripts**

In `package.json` `"scripts"`, add these three entries (alongside the existing ones):

```json
    "research-colors": "tsx scripts/blog/research-colors.ts",
    "verify-links": "tsx scripts/blog/verify-links.ts",
    "test:blog": "node --import tsx --test scripts/blog/*.test.ts"
```

- [ ] **Step 2: Write the runner**

```ts
// scripts/blog/research-colors.ts
/**
 * Stage 1 of the blog pipeline: build a verified color research brief from the DB.
 *
 * Reads color refs ("brand-slug/color-slug", comma- or newline-separated) from
 * --colors=... or a --file=, fetches exact hex/LRV/undertone/family for each and
 * the closest cross-brand match per brand, and writes a markdown brief that the
 * writer drafts from (Stage 1) and the verifier checks against (Stage 3).
 *
 * Usage:
 *   npx tsx scripts/blog/research-colors.ts --topic="best blue paint colors" \
 *     --colors="benjamin-moore/hale-navy-hc-154,sherwin-williams/naval-6244" \
 *     --out=docs/superpowers/content/research/best-blue.md
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

// Import AFTER dotenv so queries.ts sees the env.
const { getColorBySlug, getCrossBrandMatches } = await import("../../src/lib/queries.ts");
const { parseColorRef, bestMatchPerBrand, formatResearchMarkdown } = await import("./research-colors-lib.ts");
type ResearchColor = import("./research-colors-lib.ts").ResearchColor;

function arg(name: string): string | undefined {
  return process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

async function main() {
  const topic = arg("topic") ?? "untitled";
  const colorsArg = arg("colors");
  const fileArg = arg("file");
  const out = arg("out");

  let refsRaw: string[] = [];
  if (colorsArg) refsRaw = colorsArg.split(",");
  else if (fileArg) refsRaw = fs.readFileSync(path.resolve(fileArg), "utf8").split(/[\n,]/);
  refsRaw = refsRaw.map((r) => r.trim()).filter(Boolean);

  if (refsRaw.length === 0) {
    console.error("No colors given. Use --colors=brand/slug,brand/slug or --file=refs.txt");
    process.exit(1);
  }

  const colors: ResearchColor[] = [];
  for (const raw of refsRaw) {
    const { brandSlug, colorSlug } = parseColorRef(raw);
    const c = await getColorBySlug(brandSlug, colorSlug);
    if (!c) {
      console.error(`⚠️  NOT FOUND in DB: ${raw} — fix the slug before drafting`);
      continue;
    }
    const matches = await getCrossBrandMatches(c.id);
    colors.push({
      brandName: c.brand.name,
      brandSlug: c.brand.slug,
      name: c.name,
      colorSlug: c.slug,
      colorNumber: c.color_number,
      hex: c.hex,
      lrv: c.lrv,
      undertone: c.undertone,
      family: c.color_family,
      matches: bestMatchPerBrand(matches as never, c.brand.slug),
    });
    console.log(`✓ ${c.brand.name} ${c.name} (${matches.length} matches)`);
  }

  const md = formatResearchMarkdown(topic, colors, new Date().toISOString().slice(0, 10));
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(path.resolve(out), md);
    console.log(`\nWrote ${colors.length} colors → ${out}`);
  } else {
    console.log("\n" + md);
  }
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 3: Smoke-test against the live DB**

Run:
```bash
npx tsx scripts/blog/research-colors.ts --topic="smoke test" \
  --colors="benjamin-moore/hale-navy-hc-154,sherwin-williams/naval-6244"
```
Expected: two `✓` lines, then markdown with both colors, real hex/LRV, and a cross-brand match table per color. If a slug prints `⚠️ NOT FOUND`, that is the script working — it means the ref was wrong.

- [ ] **Step 4: Commit**

```bash
git add scripts/blog/research-colors.ts package.json
git commit -m "feat(blog-pipeline): research-colors runner + npm scripts"
```

---

### Task 3: verify-links-lib.ts (pure functions + tests)

**Files:**
- Create: `scripts/blog/verify-links-lib.ts`
- Test: `scripts/blog/verify-links-lib.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// scripts/blog/verify-links-lib.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractInternalLinks, parseColorHref, parseMatchBrands } from "./verify-links-lib.ts";

const SAMPLE = `
  <Swatch href="/colors/benjamin-moore/hale-navy-hc-154" />
  <Link href="/colors/benjamin-moore/hale-navy-hc-154">dupe</Link>
  <a href="https://example.com">external excluded</a>
  See our [undertones guide](/blog/understanding-paint-color-undertones).
  <Link href="/match/benjamin-moore/to/sherwin-williams">matches</Link>
  <Link href="/colors/family/blue">blues</Link>
  <Link href="/brands/behr">behr</Link>
  <Link href="/compare">compare</Link>
`;

test("extractInternalLinks finds internal links, dedupes, excludes external", () => {
  const links = extractInternalLinks(SAMPLE);
  const hrefs = links.map((l) => l.href);
  assert.ok(!hrefs.some((h) => h.startsWith("http")));
  assert.equal(hrefs.filter((h) => h === "/colors/benjamin-moore/hale-navy-hc-154").length, 1); // deduped
  assert.ok(hrefs.includes("/blog/understanding-paint-color-undertones"));
  assert.ok(hrefs.includes("/match/benjamin-moore/to/sherwin-williams"));
});

test("extractInternalLinks classifies link kinds", () => {
  const byHref = new Map(extractInternalLinks(SAMPLE).map((l) => [l.href, l.kind]));
  assert.equal(byHref.get("/colors/benjamin-moore/hale-navy-hc-154"), "color");
  assert.equal(byHref.get("/colors/family/blue"), "family");
  assert.equal(byHref.get("/match/benjamin-moore/to/sherwin-williams"), "match");
  assert.equal(byHref.get("/blog/understanding-paint-color-undertones"), "blog");
  assert.equal(byHref.get("/brands/behr"), "brand");
  assert.equal(byHref.get("/compare"), "compare");
});

test("parseColorHref extracts brand+color, rejects family and non-color", () => {
  assert.deepEqual(parseColorHref("/colors/benjamin-moore/hale-navy-hc-154"), {
    brandSlug: "benjamin-moore",
    colorSlug: "hale-navy-hc-154",
  });
  assert.equal(parseColorHref("/colors/family/blue"), null);
  assert.equal(parseColorHref("/blog/x"), null);
  assert.equal(parseColorHref("/colors/behr"), null);
});

test("parseMatchBrands handles both match route shapes", () => {
  assert.deepEqual(parseMatchBrands("/match/benjamin-moore/to/sherwin-williams"), ["benjamin-moore", "sherwin-williams"]);
  assert.deepEqual(parseMatchBrands("/match/benjamin-moore/hale-navy-to-sherwin-williams"), ["benjamin-moore"]);
  assert.deepEqual(parseMatchBrands("/blog/x"), []);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test scripts/blog/verify-links-lib.test.ts`
Expected: FAIL — `Cannot find module './verify-links-lib.ts'`.

- [ ] **Step 3: Write the implementation**

```ts
// scripts/blog/verify-links-lib.ts
/** Pure helpers for blog link verification. No I/O — unit-tested with fixtures. */

export type LinkKind = "color" | "family" | "match" | "blog" | "brand" | "compare" | "tool" | "other";

export interface InternalLink {
  href: string;
  kind: LinkKind;
}

export interface ColorRef {
  brandSlug: string;
  colorSlug: string;
}

function classify(href: string): LinkKind {
  if (href.startsWith("/colors/family/")) return "family";
  if (href.startsWith("/colors/")) return "color";
  if (href.startsWith("/match/")) return "match";
  if (href.startsWith("/blog/")) return "blog";
  if (href.startsWith("/brands/")) return "brand";
  if (href === "/compare") return "compare";
  if (href.startsWith("/tools/")) return "tool";
  return "other";
}

/** Extract internal links (href starts with "/") from JSX or markdown text.
 *  Matches href="/..." (and single quotes) and markdown ](/...). Dedupes by href. */
export function extractInternalLinks(text: string): InternalLink[] {
  const hrefs = new Set<string>();
  const attr = /href=["'](\/[^"'\s>]*)["']/g;
  const md = /\]\((\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = attr.exec(text))) hrefs.add(m[1]);
  while ((m = md.exec(text))) hrefs.add(m[1]);
  return [...hrefs].map((href) => ({ href, kind: classify(href) }));
}

/** "/colors/benjamin-moore/hale-navy-hc-154" → {brandSlug, colorSlug}.
 *  Returns null for family hubs and any non-color-detail href. */
export function parseColorHref(href: string): ColorRef | null {
  const m = href.match(/^\/colors\/([^/]+)\/([^/]+)\/?$/);
  if (!m || m[1] === "family") return null;
  return { brandSlug: m[1], colorSlug: m[2] };
}

/** Brand slugs referenced by a /match route, for existence checking.
 *  "/match/a/to/b" → [a, b]; "/match/a/<matchSlug>" → [a]. */
export function parseMatchBrands(href: string): string[] {
  const parts = href.split("/").filter(Boolean);
  if (parts[0] !== "match" || !parts[1]) return [];
  const brands = [parts[1]];
  if (parts[2] === "to" && parts[3]) brands.push(parts[3]);
  return brands;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test scripts/blog/verify-links-lib.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/blog/verify-links-lib.ts scripts/blog/verify-links-lib.test.ts
git commit -m "feat(blog-pipeline): verify-links pure lib + tests"
```

---

### Task 4: verify-links.ts runner

**Files:**
- Create: `scripts/blog/verify-links.ts`

- [ ] **Step 1: Write the runner**

```ts
// scripts/blog/verify-links.ts
/**
 * Stage 3 of the blog pipeline: verify every DB-backed internal link in a draft
 * actually resolves, so a typo'd slug can't ship a 404.
 *
 * Checks color links (getColorBySlug), family hubs, brand pages, and /match brands
 * against the live DB + the blog slugs in blog-posts.tsx. Static/tool/compare links
 * are listed but not fetched. Exits non-zero if any DB-backed link is unresolved.
 *
 * Usage:
 *   npx tsx scripts/blog/verify-links.ts --file=docs/superpowers/content/drafts/best-valspar.tsx
 */
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const { getColorBySlug, getAllBrands, getAllColorFamilies } = await import("../../src/lib/queries.ts");
const { extractInternalLinks, parseColorHref, parseMatchBrands } = await import("./verify-links-lib.ts");

function arg(name: string): string | undefined {
  return process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

/** Blog slugs live in JSX (blog-posts.tsx); read them by text, not by importing JSX. */
function blogSlugs(): Set<string> {
  const src = fs.readFileSync(path.resolve(__dirname, "../../src/lib/blog-posts.tsx"), "utf8");
  const out = new Set<string>();
  const re = /slug:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) out.add(m[1]);
  return out;
}

async function main() {
  const file = arg("file");
  if (!file) {
    console.error("Usage: --file=path/to/draft.tsx");
    process.exit(1);
  }
  const text = fs.readFileSync(path.resolve(file), "utf8");
  const links = extractInternalLinks(text);

  const [brands, families] = await Promise.all([getAllBrands(), getAllColorFamilies()]);
  const brandSet = new Set(brands.map((b) => b.slug));
  const familySet = new Set(families.map((f) => f.slug));
  const blogSet = blogSlugs();

  const failures: string[] = [];
  let checked = 0;
  let skipped = 0;

  for (const link of links) {
    if (link.kind === "color") {
      const ref = parseColorHref(link.href);
      if (!ref) { failures.push(`${link.href} — malformed color URL`); continue; }
      checked++;
      const c = await getColorBySlug(ref.brandSlug, ref.colorSlug);
      if (!c) failures.push(`${link.href} — color slug not in DB`);
    } else if (link.kind === "family") {
      checked++;
      const slug = link.href.replace("/colors/family/", "").replace(/\/$/, "");
      if (!familySet.has(slug)) failures.push(`${link.href} — family slug not found`);
    } else if (link.kind === "brand") {
      checked++;
      const slug = link.href.replace("/brands/", "").replace(/\/$/, "");
      if (!brandSet.has(slug)) failures.push(`${link.href} — brand slug not found`);
    } else if (link.kind === "blog") {
      checked++;
      const slug = link.href.replace("/blog/", "").replace(/\/$/, "");
      if (!blogSet.has(slug)) failures.push(`${link.href} — blog slug not found (post not yet inserted?)`);
    } else if (link.kind === "match") {
      checked++;
      for (const b of parseMatchBrands(link.href)) {
        if (!brandSet.has(b)) failures.push(`${link.href} — match brand "${b}" not found`);
      }
    } else {
      skipped++; // compare / tool / other — static routes, not DB-backed
    }
  }

  console.log(`Links: ${links.length} | checked: ${checked} | skipped (static): ${skipped}`);
  if (failures.length) {
    console.error(`\n❌ ${failures.length} unresolved link(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log("✅ All DB-backed internal links resolve.");
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 2: Smoke-test against the shipped blue post**

The blue post (`best-blue-paint-colors`) is already inserted with ~15 color links, so a copy of its source is a real fixture. Run it against the whole blog-posts.tsx file:
```bash
npx tsx scripts/blog/verify-links.ts --file=src/lib/blog-posts.tsx
```
Expected: a `Links:` summary line, then `✅ All DB-backed internal links resolve.` (every live post's links should resolve). If any fail, that is a real pre-existing broken link worth reporting to Philip — do not "fix" the verifier to hide it.

- [ ] **Step 3: Commit**

```bash
git add scripts/blog/verify-links.ts
git commit -m "feat(blog-pipeline): verify-links runner"
```

---

### Task 5: Wire scripts into the runbook + final test run

**Files:**
- Modify: `docs/superpowers/content/blog-pipeline-runbook.md`

- [ ] **Step 1: Run the full blog test suite**

Run: `npm run test:blog`
Expected: 9 tests pass (5 research + 4 links), 0 fail.

- [ ] **Step 2: Update the runbook Stage 1 + Stage 3 notes**

In `docs/superpowers/content/blog-pipeline-runbook.md`, update the "DB pull" bullet under Stage 1 to reference the built script, and the link-check bullet under Stage 3:

- Stage 1, replace the "DB pull (the moat)" bullet's last sentence with: `Run \`npm run research-colors -- --topic="..." --colors="brand/slug,..." --out=docs/superpowers/content/research/<topic>.md\` to produce the verified color table the writer drafts from.`
- Stage 3, replace the "Every internal link resolves" bullet with: `Run \`npm run verify-links -- --file=<draft path>\` — it confirms every color/family/brand/match link resolves against the DB and exits non-zero on any 404 risk.`
- In "Automation notes", change the `research-colors.ts` line from "build it when first useful" to "built — `npm run research-colors` / `npm run verify-links`; tested via `npm run test:blog`."

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/content/blog-pipeline-runbook.md
git commit -m "docs(blog-pipeline): wire research-colors + verify-links into runbook"
```

---

## Self-Review

**1. Spec coverage** (vs runbook + locked decisions in `project_pchq-blog-creation-pipeline-next`):
- Stage 1 DB research (moat: hex/LRV/undertone + cross-brand matches) → Tasks 1–2 ✓
- Stage 3 source-grounded verification, accuracy not dependent on Philip → research brief (ground truth) + verify-links (link 404 gate) Tasks 1–4 ✓
- Stage 5 images → already shipped (`generate-blog-hero.ts`), out of scope here ✓
- Drafting / voice QA / seo-preflight / PR gate → existing skills (content-writer, seo-preflight, gh), no new code needed ✓
- Never auto-publish → unchanged; these are research/verify tools, not publishers ✓

**2. Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**3. Type consistency:** `ColorRef`, `MatchRow`, `ResearchColor` defined in Task 1 and reused in Task 2. `InternalLink`, `LinkKind`, `parseColorHref`/`parseMatchBrands` defined in Task 3 and reused in Task 4. `getColorBySlug`/`getCrossBrandMatches`/`getAllBrands`/`getAllColorFamilies` signatures match `src/lib/queries.ts`. ✓

**Note on TDD scope:** Pure functions are unit-tested with fixtures (no live DB in tests — fast, deterministic). The runners hit the live Supabase, so they are validated by smoke-runs (Tasks 2 & 4) rather than unit tests, matching the repo's existing `test:pinterest` pattern.
