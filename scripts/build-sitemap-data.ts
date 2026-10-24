import dotenv from "dotenv";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { POPULAR_COLOR_SLUGS, MAJOR_MATCH_BRANDS } from "../src/lib/popular-colors";
import { isMatchIndexable } from "../src/lib/indexing";
import { diffPairs, sitemapPaths, type PairExclusion } from "../src/lib/sitemap-pairs";

dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

const BASE_URL = "https://www.paintcolorhq.com";

// Baseline for the pair diff: the previous local snapshot, else the live
// match sitemap (a fresh Vercel build has no previous snapshot on disk).
async function previousMatches(): Promise<{ source: string; matches: string[] } | null> {
  try {
    const prev = JSON.parse(await readFile("src/generated/sitemap.json", "utf8"));
    if (Array.isArray(prev.matches)) return { source: "previous src/generated/sitemap.json", matches: prev.matches };
  } catch { /* no local snapshot */ }
  try {
    const res = await fetch(`${BASE_URL}/sitemap/match-individual.xml`, { signal: AbortSignal.timeout(10_000) });
    // Zero <loc> means a challenge or error page, not an empty sitemap.
    const matches = res.ok ? sitemapPaths(await res.text(), BASE_URL) : [];
    if (matches.length) return { source: "live /sitemap/match-individual.xml", matches };
  } catch { /* offline */ }
  return null;
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Supabase environment required to build sitemap snapshot");
  const { getAllColorSlugs, getColorBySlug, getCrossBrandMatches, getAllBrands } = await import("../src/lib/queries");
  const previous = await previousMatches();
  const colors = await getAllColorSlugs();
  if (!colors.length) throw new Error("Refusing an empty sitemap catalog");
  // A match page shows both colors, so it changed when either one did.
  const updatedByUrl = new Map(colors.map(c => [`${c.brandSlug}/${c.colorSlug}`, c.contentUpdatedAt]));
  const matches: string[] = [];
  const matchUpdatedAt: Record<string, string> = {};
  const exclusions = new Map<string, PairExclusion>();
  // Sequential sources bound database load. Use the same match resolver and
  // eligibility as the actual page, including missing-target handling.
  for (const { brandSlug, colorSlug } of POPULAR_COLOR_SLUGS) {
    const source = await getColorBySlug(brandSlug, colorSlug);
    if (!source) {
      for (const target of MAJOR_MATCH_BRANDS) if (target !== brandSlug) exclusions.set(`/match/${brandSlug}/${colorSlug}-to-${target}`, "removed");
      continue;
    }
    const candidates = await getCrossBrandMatches(source.id);
    for (const target of MAJOR_MATCH_BRANDS) {
      if (target === brandSlug) continue;
      const best = candidates.find(m => m.match_color.brand.slug === target);
      const url = `/match/${brandSlug}/${source.slug}-to-${target}`;
      if (!best) exclusions.set(url, "removed");
      else if (!isMatchIndexable(source, Number(best.delta_e_score))) exclusions.set(url, "noindexed");
      else {
        matches.push(url);
        const dates = [updatedByUrl.get(`${brandSlug}/${source.slug}`), updatedByUrl.get(`${target}/${best.match_color.slug}`)].filter((d): d is string => Boolean(d));
        if (dates.length) matchUpdatedAt[url] = dates.sort().at(-1)!;
      }
    }
  }
  if (new Set(matches).size !== matches.length) throw new Error("Duplicate match sitemap URL");
  const brands = (await getAllBrands()).map(({ name, slug }) => ({ name, slug }));
  const snapshot = { brands, colors, matches: matches.sort(), matchUpdatedAt };
  await mkdir("src/generated", { recursive: true });
  await writeFile("src/generated/sitemap.json.tmp", JSON.stringify(snapshot));
  await rename("src/generated/sitemap.json.tmp", "src/generated/sitemap.json");
  // The individual match paths alone, so other code (e.g. color-page pair
  // links) can use the exact set the sitemap lists.
  await writeFile("src/generated/match-sitemap-pairs.json.tmp", JSON.stringify(snapshot.matches));
  await rename("src/generated/match-sitemap-pairs.json.tmp", "src/generated/match-sitemap-pairs.json");
  console.log(`Sitemap snapshot: ${colors.length} unique eligible colors, ${matches.length} eligible matches`);
  if (!previous) {
    console.log("Match pair diff: no baseline (no previous snapshot and the live sitemap was unreachable)");
  } else {
    const diff = diffPairs(previous.matches, snapshot.matches, exclusions);
    console.log(`Match pair diff vs ${previous.source} (${previous.matches.length} pairs): ${diff.newlyIndexable.length} newly indexable, ${diff.newlyNoindexed.length} newly noindexed, ${diff.removed.length} removed`);
    for (const url of diff.newlyIndexable) console.log(`  + indexable  ${url}`);
    for (const url of diff.newlyNoindexed) console.log(`  - noindexed  ${url}`);
    for (const url of diff.removed) console.log(`  - removed    ${url}`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
