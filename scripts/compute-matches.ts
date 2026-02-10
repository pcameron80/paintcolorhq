import * as fs from "fs";
import * as path from "path";
import { deltaE2000 } from "./lib/color-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProcessedColor {
  name: string;
  slug: string;
  color_number: string | null;
  hex: string;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number;
  lab_a: number;
  lab_b_val: number;
  lrv: number;
  color_family: string;
  brand_slug: string;
}

interface MatchRecord {
  source_color_id: string; // "brand_slug/color_slug"
  match_color_id: string;  // "brand_slug/color_slug"
  delta_e_score: number;
  rank: number;
}

// ---------------------------------------------------------------------------
// Top-N tracker using sorted insertion (small N, so insertion sort is fine)
// ---------------------------------------------------------------------------

interface Candidate {
  index: number;
  deltaE: number;
}

function insertCandidate(
  top: Candidate[],
  maxSize: number,
  candidate: Candidate,
): void {
  // If the list is full and this candidate is worse than the worst, skip
  if (top.length >= maxSize && candidate.deltaE >= top[top.length - 1].deltaE) {
    return;
  }

  // Binary search for insertion position
  let lo = 0;
  let hi = top.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (top[mid].deltaE < candidate.deltaE) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  top.splice(lo, 0, candidate);

  if (top.length > maxSize) {
    top.pop();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const dataDir = path.resolve(__dirname, "../data");
  const inputFile = path.join(dataDir, "colors-processed.json");
  const outputFile = path.join(dataDir, "cross-brand-matches.json");

  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    console.error("Run: npm run import-colors");
    process.exit(1);
  }

  console.log("Loading color data...");
  const colors: ProcessedColor[] = JSON.parse(
    fs.readFileSync(inputFile, "utf8"),
  );
  console.log(`Loaded ${colors.length} colors`);

  // Group colors by brand
  const brandGroups = new Map<string, number[]>();
  for (let i = 0; i < colors.length; i++) {
    const slug = colors[i].brand_slug;
    if (!brandGroups.has(slug)) {
      brandGroups.set(slug, []);
    }
    brandGroups.get(slug)!.push(i);
  }

  const brandSlugs = Array.from(brandGroups.keys());
  console.log(
    `Brands: ${brandSlugs.map((s) => `${s} (${brandGroups.get(s)!.length})`).join(", ")}`,
  );

  // Pre-extract Lab values into typed arrays for cache-friendly access
  const labL = new Float64Array(colors.length);
  const labA = new Float64Array(colors.length);
  const labB = new Float64Array(colors.length);
  for (let i = 0; i < colors.length; i++) {
    labL[i] = colors[i].lab_l;
    labA[i] = colors[i].lab_a;
    labB[i] = colors[i].lab_b_val;
  }

  const TOP_N = 5;
  const allMatches: MatchRecord[] = [];
  let processed = 0;
  const startTime = Date.now();

  // Process one source brand at a time to keep memory bounded
  for (const srcBrand of brandSlugs) {
    const srcIndices = brandGroups.get(srcBrand)!;
    console.log(`\nProcessing source brand: ${srcBrand} (${srcIndices.length} colors)`);

    // Build list of target indices (all other brands)
    const targetIndices: number[] = [];
    for (const [brand, indices] of brandGroups) {
      if (brand !== srcBrand) {
        targetIndices.push(...indices);
      }
    }

    // Group target indices by brand for per-brand top-5
    const targetBrands = new Map<string, number[]>();
    for (const idx of targetIndices) {
      const brand = colors[idx].brand_slug;
      if (!targetBrands.has(brand)) {
        targetBrands.set(brand, []);
      }
      targetBrands.get(brand)!.push(idx);
    }

    for (const srcIdx of srcIndices) {
      const srcL = labL[srcIdx];
      const srcA = labA[srcIdx];
      const srcB = labB[srcIdx];
      const srcLab = { L: srcL, a: srcA, b: srcB };

      // For each target brand, find top 5
      for (const [, brandIndices] of targetBrands) {
        const top: Candidate[] = [];

        for (const tgtIdx of brandIndices) {
          const de = deltaE2000(srcLab, {
            L: labL[tgtIdx],
            a: labA[tgtIdx],
            b: labB[tgtIdx],
          });
          insertCandidate(top, TOP_N, { index: tgtIdx, deltaE: de });
        }

        const srcId = `${colors[srcIdx].brand_slug}/${colors[srcIdx].slug}`;
        for (let rank = 0; rank < top.length; rank++) {
          const t = top[rank];
          allMatches.push({
            source_color_id: srcId,
            match_color_id: `${colors[t.index].brand_slug}/${colors[t.index].slug}`,
            delta_e_score: Math.round(t.deltaE * 100) / 100,
            rank: rank + 1,
          });
        }
      }

      processed++;
      if (processed % 1000 === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const remaining = (colors.length - processed) / rate;
        console.log(
          `  ${processed}/${colors.length} colors processed ` +
            `(${rate.toFixed(0)} colors/s, ~${remaining.toFixed(0)}s remaining)`,
        );
      }
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(
    `\nDone. Processed ${processed} colors in ${elapsed.toFixed(1)}s`,
  );
  console.log(`Total match records: ${allMatches.length}`);

  // Write output
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(allMatches, null, 2));
  console.log(`Output written to: ${outputFile}`);
}

main();
