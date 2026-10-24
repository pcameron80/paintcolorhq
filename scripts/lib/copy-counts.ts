/**
 * Rules for hard-coded brand counts in copy. Pure, so it can be unit tested;
 * scripts/check-copy-counts.ts walks src/ and reports.
 *
 * Copy should read counts from src/lib/site-facts.ts (BRAND_COUNT,
 * moreBrands()). Where a numeral is still typed into a string, it has to agree
 * with BRAND_COUNT:
 * - a catalog-sized total ("13 brands", "13 paint brands", "all 13 supported
 *   brands", any numeral from 10 to 19) must equal BRAND_COUNT. Smaller
 *   numbers ("top 7 brands") describe subsets and are left alone;
 * - "N other brands" / "the other N brands" must be below BRAND_COUNT. The
 *   right value depends on how many brands the sentence already named
 *   (12 after one, 10 after three), so only impossible values are caught;
 * - "and N more" / "& N more brands" with N of 8 or more is a remainder of the
 *   whole catalog and must come from moreBrands(), not a typed numeral.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export interface CountFinding {
  line: number;
  text: string;
  reason: string;
}

// Words that can sit between the numeral and "brands" in a total.
const QUALIFIER = String.raw`(?:(?:major|paint|supported|leading|top|popular|national)\s+){0,2}`;
// "brands" or "paint manufacturers", optionally possessive.
const NOUN = String.raw`(?:brands|paint\s+manufacturers)(?:'|&apos;)?`;

const TOTAL = new RegExp(String.raw`(?<![\w$])(\d{1,2})\s+${QUALIFIER}${NOUN}`, "gi");
const OTHER = new RegExp(
  String.raw`(?:(?<![\w$])(\d{1,2})\s+other\s+${QUALIFIER}${NOUN}|\bother\s+(\d{1,2})\s+${QUALIFIER}${NOUN})`,
  "gi",
);
const MORE = new RegExp(
  String.raw`(?:\band\s+|&amp;\s+|&\s+)(\d{1,2})\s+more\b|(?<![\w$])(\d{1,2})\s+more\s+${QUALIFIER}${NOUN}`,
  "gi",
);

export function findCountProblems(source: string, brandCount: number): CountFinding[] {
  const findings: CountFinding[] = [];
  source.split("\n").forEach((lineText, i) => {
    const line = i + 1;
    for (const m of lineText.matchAll(OTHER)) {
      const n = Number(m[1] ?? m[2]);
      if (n >= brandCount) {
        findings.push({ line, text: m[0], reason: `"other" count must be below BRAND_COUNT (${brandCount})` });
      }
    }
    for (const m of lineText.matchAll(MORE)) {
      if (Number(m[1] ?? m[2]) < 8) continue;
      findings.push({ line, text: m[0].trim(), reason: 'typed "N more" count; use moreBrands() from src/lib/site-facts.ts' });
    }
    for (const m of lineText.matchAll(TOTAL)) {
      // "the other 12 brands" is an "other" count, judged above.
      if (/\bother\s+$/i.test(lineText.slice(0, m.index))) continue;
      const n = Number(m[1]);
      if (n >= 10 && n <= 19 && n !== brandCount) {
        findings.push({ line, text: m[0], reason: `brand total should be ${brandCount} (BRAND_COUNT)` });
      }
    }
  });
  return findings;
}

// ---- Tree walk ---------------------------------------------------------------

// Skipped whole files, each with a reason.
const SKIP_FILES = new Set<string>([
  // Auto-generated color-page copy; its typed "and 10 more" list moves to
  // moreBrands() in MP-40.
  "src/lib/color-description.ts",
]);

// Individual phrasings that are correct as written, keyed by file and the
// matched text, each with a reason.
const ALLOW: { file: string; text: string; why: string }[] = [
  {
    file: "src/lib/blog-posts.tsx",
    text: "12 paint brands",
    why: "alt text of the most-duplicated chart, which draws 12 palettes (RAL is compared but not drawn)",
  },
];

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === "generated" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p);
  }
}

/** Every copy-count problem under `root`/src, as "file:line: message" strings. */
export function checkCopyCounts(root: string, brandCount: number): string[] {
  const errors: string[] = [];
  const src = join(root, "src");

  const snapshot = join(src, "generated", "sitemap.json");
  if (existsSync(snapshot)) {
    const brands = JSON.parse(readFileSync(snapshot, "utf8")).brands as unknown[];
    if (brands.length !== brandCount) {
      errors.push(`src/lib/site-facts.ts: BRAND_COUNT is ${brandCount} but the catalog snapshot has ${brands.length} brands`);
    }
  }

  const files: string[] = [];
  walk(src, files);
  for (const abs of files.sort()) {
    const file = relative(root, abs).split(sep).join("/");
    if (SKIP_FILES.has(file)) continue;
    for (const f of findCountProblems(readFileSync(abs, "utf8"), brandCount)) {
      if (ALLOW.some((a) => a.file === file && a.text === f.text)) continue;
      errors.push(`${file}:${f.line}: "${f.text}": ${f.reason}`);
    }
  }
  return errors;
}
