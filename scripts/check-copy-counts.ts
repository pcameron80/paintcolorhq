/**
 * Fails when copy in src/ quotes a brand count that disagrees with
 * BRAND_COUNT in src/lib/site-facts.ts, or when BRAND_COUNT disagrees with
 * the brands in the catalog snapshot (src/generated/sitemap.json).
 *
 *   npm run check:copy-counts
 *
 * The same check runs inside `npm run test:seo` (src/lib/copy-counts.test.ts),
 * so the seo-preflight gate covers it. Rules: scripts/lib/copy-counts.ts.
 */
import { BRAND_COUNT } from "../src/lib/site-facts";
import { checkCopyCounts } from "./lib/copy-counts";

const errors = checkCopyCounts(process.cwd(), BRAND_COUNT);
if (errors.length) {
  console.error(`check-copy-counts: ${errors.length} problem(s)\n` + errors.map((e) => "  " + e).join("\n"));
  process.exit(1);
}
console.log(`check-copy-counts: OK (BRAND_COUNT = ${BRAND_COUNT})`);
