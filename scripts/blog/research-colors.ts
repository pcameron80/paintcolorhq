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
import "./load-env.ts"; // MUST be first — populates env before queries.ts builds its client.
import * as path from "path";
import * as fs from "fs";
import { getColorBySlug, getCrossBrandMatches } from "../../src/lib/queries.ts";
import {
  parseColorRef,
  bestMatchPerBrand,
  formatResearchMarkdown,
  type ResearchColor,
} from "./research-colors-lib.ts";

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
