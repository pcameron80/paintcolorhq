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
import "./load-env.ts"; // MUST be first — populates env before queries.ts builds its client.
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { getColorBySlug, getAllBrands, getAllColorFamilies } from "../../src/lib/queries.ts";
import { extractInternalLinks, parseColorHref, parseMatchBrands } from "./verify-links-lib.ts";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function arg(name: string): string | undefined {
  return process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

/** Blog slugs live in JSX (blog-posts.tsx); read them by text, not by importing JSX. */
function blogSlugs(): Set<string> {
  const src = fs.readFileSync(path.resolve(scriptDir, "../../src/lib/blog-posts.tsx"), "utf8");
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
