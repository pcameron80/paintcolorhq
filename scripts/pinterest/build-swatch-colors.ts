// One-time generator → swatch-colors.json (the swatch lane's color data).
// PRIORITY seeds from pinterest-queue.ts TIER1_COLORS (GSC-impressed) + popular
// colors already verified in the curated batches. Misses are skipped.
// Re-run after editing PRIORITY; commit the regenerated JSON.
//
//   npx tsx scripts/pinterest/build-swatch-colors.ts
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as dotenv from "dotenv";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const PRIORITY: Array<{ brandSlug: string; slug: string }> = [
  // --- Tier 1: GSC-impressed colors (from pinterest-queue.ts) ---
  { brandSlug: "vista-paint", slug: "mystic-fog-c-18" },
  { brandSlug: "benjamin-moore", slug: "mortar-cc-574" },
  { brandSlug: "sherwin-williams", slug: "passive-7064" },
  { brandSlug: "benjamin-moore", slug: "vapor-af-35" },
  { brandSlug: "dunn-edwards", slug: "faded-gray-dew382" },
  { brandSlug: "benjamin-moore", slug: "inukshuk-cc-460" },
  { brandSlug: "benjamin-moore", slug: "silhouette-af-655" },
  { brandSlug: "hirshfields", slug: "desert-mirage-231" },
  { brandSlug: "benjamin-moore", slug: "straw-270" },
  { brandSlug: "behr", slug: "mourning-dove-or-w12" },
  { brandSlug: "benjamin-moore", slug: "lambskin-1051" },
  { brandSlug: "benjamin-moore", slug: "tangerine-132" },
  { brandSlug: "benjamin-moore", slug: "butterscotch-1147" },
  { brandSlug: "ppg", slug: "scotch-mist-14-07" },
  { brandSlug: "ral", slug: "pearl-dark-grey-9023" },
  { brandSlug: "benjamin-moore", slug: "cucumber-562" },
  { brandSlug: "dunn-edwards", slug: "bachelor-blue-de5878" },
  { brandSlug: "benjamin-moore", slug: "buttermilk-919" },
  { brandSlug: "vista-paint", slug: "muted-mulberry-c-1381" },
  { brandSlug: "benjamin-moore", slug: "downpour-2063-20" },
  { brandSlug: "dunn-edwards", slug: "early-snow-dew313" },
  { brandSlug: "valspar", slug: "dress-rehearsal-7001-20" },
  { brandSlug: "benjamin-moore", slug: "northwood-1000" },
  { brandSlug: "benjamin-moore", slug: "venetian-1292" },
  { brandSlug: "dunn-edwards", slug: "galveston-tan-de6101" },
  { brandSlug: "behr", slug: "warm-onyx-hdc-cl-14a" },
  { brandSlug: "benjamin-moore", slug: "lido-617" },
  { brandSlug: "mpc", slug: "black-hole-met-mp19952" },
  { brandSlug: "benjamin-moore", slug: "sunflower-174" },
  { brandSlug: "benjamin-moore", slug: "almond-beige-2101-40" },
  // --- Popular high-search colors (verified in curated batches) ---
  { brandSlug: "sherwin-williams", slug: "agreeable-gray-7029" },
  { brandSlug: "sherwin-williams", slug: "repose-gray-7015" },
  { brandSlug: "sherwin-williams", slug: "tricorn-black-6258" },
  { brandSlug: "sherwin-williams", slug: "sea-salt-6204" },
  { brandSlug: "sherwin-williams", slug: "iron-ore-7069" },
  { brandSlug: "sherwin-williams", slug: "alabaster-7008" },
  { brandSlug: "sherwin-williams", slug: "naval-6244" },
  { brandSlug: "sherwin-williams", slug: "urbane-bronze-7048" },
  { brandSlug: "sherwin-williams", slug: "gauntlet-gray-7019" },
  { brandSlug: "sherwin-williams", slug: "drift-of-mist-9166" },
  { brandSlug: "sherwin-williams", slug: "oyster-bay-6206" },
  { brandSlug: "sherwin-williams", slug: "rainwashed-6211" },
  { brandSlug: "sherwin-williams", slug: "pewter-green-6208" },
  { brandSlug: "sherwin-williams", slug: "cavern-clay-7701" },
  { brandSlug: "sherwin-williams", slug: "greek-villa-7551" },
  { brandSlug: "sherwin-williams", slug: "shoji-white-7042" },
  { brandSlug: "benjamin-moore", slug: "revere-pewter-hc-172" },
  { brandSlug: "benjamin-moore", slug: "manchester-tan-hc-81" },
  { brandSlug: "benjamin-moore", slug: "kendall-charcoal-hc-166" },
  { brandSlug: "benjamin-moore", slug: "palladian-blue-hc-144" },
  { brandSlug: "benjamin-moore", slug: "gentlemans-gray-2062-20" },
  { brandSlug: "benjamin-moore", slug: "newburyport-blue-hc-155" },
  { brandSlug: "benjamin-moore", slug: "first-light-2102-70" },
  { brandSlug: "benjamin-moore", slug: "hawthorne-yellow-hc-4" },
  { brandSlug: "benjamin-moore", slug: "shaker-beige-hc-45" },
  { brandSlug: "benjamin-moore", slug: "caliente-af-290" },
  { brandSlug: "behr", slug: "cracked-pepper-ppu18-01" },
  { brandSlug: "ppg", slug: "chinese-porcelain-1160-6" },
  { brandSlug: "ppg", slug: "olive-sprig-1125-4" },
  { brandSlug: "valspar", slug: "filtered-shade-4003-1b" },
  { brandSlug: "dunn-edwards", slug: "bay-fog-de5934" },
];

(async () => {
  const { getColorBySlug } = await import("../../src/lib/queries.ts");
  const out: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  for (const { brandSlug, slug } of PRIORITY) {
    const dedup = `${brandSlug}/${slug}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);
    const c = await getColorBySlug(brandSlug, slug);
    if (!c) { console.warn("MISS", dedup); continue; }
    out.push({
      brandSlug, slug,
      brandName: c.brand?.name ?? "",
      name: c.name,
      hex: c.hex,
      code: c.color_number ?? null,
      lrv: c.lrv ?? null,
      family: c.color_family ?? null,
    });
  }
  fs.writeFileSync(path.resolve(__dirname, "swatch-colors.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("wrote", out.length, "swatch colors");
})();
