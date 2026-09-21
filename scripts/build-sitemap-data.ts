import dotenv from "dotenv";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { POPULAR_COLOR_SLUGS, MAJOR_MATCH_BRANDS } from "../src/lib/popular-colors";
import { isMatchIndexable } from "../src/lib/indexing";

dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Supabase environment required to build sitemap snapshot");
  const { getAllColorSlugs, getColorBySlug, getCrossBrandMatches, getAllBrands } = await import("../src/lib/queries");
  const colors = await getAllColorSlugs();
  if (!colors.length) throw new Error("Refusing an empty sitemap catalog");
  const matches: string[] = [];
  // Sequential sources bound database load. Use the same match resolver and
  // eligibility as the actual page, including missing-target handling.
  for (const { brandSlug, colorSlug } of POPULAR_COLOR_SLUGS) {
    const source = await getColorBySlug(brandSlug, colorSlug);
    if (!source) continue;
    const candidates = await getCrossBrandMatches(source.id);
    for (const target of MAJOR_MATCH_BRANDS) {
      if (target === brandSlug) continue;
      const best = candidates.find(m => m.match_color.brand.slug === target);
      if (best && isMatchIndexable(source, Number(best.delta_e_score))) matches.push(`/match/${brandSlug}/${source.slug}-to-${target}`);
    }
  }
  if (new Set(matches).size !== matches.length) throw new Error("Duplicate match sitemap URL");
  const brands = (await getAllBrands()).map(({ name, slug }) => ({ name, slug }));
  const snapshot = { brands, colors, matches: matches.sort() };
  await mkdir("src/generated", { recursive: true });
  await writeFile("src/generated/sitemap.json.tmp", JSON.stringify(snapshot));
  await rename("src/generated/sitemap.json.tmp", "src/generated/sitemap.json");
  console.log(`Sitemap snapshot: ${colors.length} unique eligible colors, ${matches.length} eligible matches`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
