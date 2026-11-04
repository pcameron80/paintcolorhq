/**
 * Pure logic for claim-check.ts: pull prose blocks out of blog-posts.tsx, the
 * TypeSafe (Jev) questions asked about each block, and the code that turns the
 * answers into pass / review / fail. Jev supplies the judgments; the rules that
 * decide what to do with them live here, where they can be read and tested.
 *
 * Numbers (hex, LRV, closeness labels) are not checked here. audit-color-facts.ts
 * checks those exactly against the DB. This covers wording no number can verify:
 * popularity and ranking claims, trend claims, product-performance claims, and
 * which brand program a color belongs to.
 */
import type { PostRange } from "./check-modified-dates-lib.ts";

export const MODEL = "jev-1.14.0";
/** Noul at or above this reads as yes; at or below NO reads as no; between is unsettled. */
export const YES = 0.7;
export const NO = 0.3;
/** A "supports" verdict on a program claim only clears it at this confidence or higher. */
export const PROGRAM_ACCEPT = 0.8;

export interface Block {
  slug: string;
  line: number;
  kind: "title" | "excerpt" | "faq" | "body";
  text: string;
}

export interface CotyFact {
  brand: string;
  color: string;
}

// ─── Extraction ──────────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  "&apos;": "'",
  "&quot;": '"',
  "&amp;": "&",
  "&mdash;": "—",
  "&ndash;": "–",
  "&nbsp;": " ",
  "&deg;": "°",
};

/** JSX source of one block → the text a reader sees. */
export function cleanText(jsx: string): string {
  return jsx
    .replace(/<Swatch\b[^>]*?\bname="([^"]*)"[^>]*\/>/g, "$1")
    .replace(/\{"([^"]*)"\}/g, "$1")
    .replace(/\{'([^']*)'\}/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^{}]*\}/g, "")
    .replace(/&[a-z]+;/g, (e) => ENTITIES[e] ?? e)
    .replace(/\\"/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const BLOCK_TAG = /<(p|li|h2|h3|td|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/g;
/** Blocks shorter than this are headings like "Cabinet whites" with nothing to check. */
const MIN_CHARS = 25;

/** Every prose block of one post: title, excerpt, FAQ answers and body blocks. */
export function extractBlocks(lines: readonly string[], post: PostRange): Block[] {
  const blocks: Block[] = [];
  const add = (kind: Block["kind"], line: number, raw: string) => {
    const text = cleanText(raw);
    if (text.length >= MIN_CHARS) blocks.push({ slug: post.slug, line, kind, text });
  };

  // A field's string sits on the same line or the next one (excerpt:\n "...").
  const fieldString = (i: number, name: string): string | undefined => {
    const same = lines[i].match(new RegExp(`^\\s+${name}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (same) return same[1];
    if (new RegExp(`^\\s+${name}:\\s*$`).test(lines[i])) {
      return lines[i + 1]?.match(/^\s+"((?:[^"\\]|\\.)*)"/)?.[1];
    }
    return undefined;
  };

  let contentStart = -1;
  for (let i = post.start - 1; i < post.end; i++) {
    const l = lines[i];
    if (contentStart < 0 && /^\s{4}content:/.test(l)) contentStart = i;
    if (contentStart >= 0) continue;
    const title = /^\s{4}title:/.test(l) ? fieldString(i, "title") : undefined;
    if (title) add("title", i + 1, title);
    const excerpt = /^\s{4}excerpt:/.test(l) ? fieldString(i, "excerpt") : undefined;
    if (excerpt) add("excerpt", i + 1, excerpt);
  }
  // FAQ answers can sit before or after content; scan the whole post for them.
  for (let i = post.start - 1; i < post.end; i++) {
    if (/^\s+answer:/.test(lines[i])) {
      const answer = fieldString(i, "answer");
      if (answer) add("faq", i + 1, answer);
    }
  }
  if (contentStart >= 0) {
    const body = lines.slice(contentStart, post.end).join("\n");
    for (const m of body.matchAll(BLOCK_TAG)) {
      const line = contentStart + 1 + body.slice(0, m.index).split("\n").length - 1;
      add("body", line, m[2]);
    }
  }
  return blocks;
}

/** The verified 2026 Color of the Year table in docs/coty-playbook.md, as facts. */
export function parseCotyTable(markdown: string): CotyFact[] {
  const facts: CotyFact[] = [];
  for (const row of markdown.split("\n")) {
    const cells = row.split("|").map((c) => c.trim());
    // | Brand | Typical window | 2026-cycle date | 2026 color | Where |
    if (cells.length < 6 || !/\d{4}/.test(cells[3]) || cells[1] === "Brand") continue;
    const brand = cells[1].replace(/\s*\(context only\)/, "");
    facts.push({ brand, color: cells[4] });
  }
  return facts;
}

export function buildReference(facts: readonly CotyFact[]) {
  return {
    colors_of_the_year_2026: facts.map((f) => `${f.brand}: ${f.color}`),
    farrow_and_ball: "Farrow & Ball does not name a single Color of the Year; it releases a set of new colours each year.",
  };
}

// ─── Questions ───────────────────────────────────────────────────────────────

/** Every question asked about each block. Wording lives here and nowhere else. */
export const QUESTIONS = {
  popularity: {
    type: "noul",
    instructions:
      "Does `paragraph` claim that a color, brand or product is the most popular, best-selling, most used, most specified or ranked first by buyers or designers?",
    criteria: {
      true: "Claims what most people buy, use, specify or love, or gives a sales rank",
      false: "Names a color as the writer's own best pick, or reports a count from PaintColorHQ's color data",
    },
  },
  trend: {
    type: "noul",
    instructions: "Does `paragraph` claim that a color, palette or style is in fashion right now?",
    criteria: {
      true: "Calls something a trend, the look of the year, having a moment, or part of a shift in taste",
      false: "Describes or recommends colors, or names a brand's Color of the Year, without saying what is in fashion",
    },
  },
  price: {
    type: "noul",
    instructions: "Does `paragraph` state a paint price, a discount, or when a brand's paint goes on sale?",
  },
  product_performance: {
    type: "noul",
    instructions:
      "Does `paragraph` claim how a specific named paint line or color performs, such as washability, durability, coverage, hiding fingerprints or resisting moisture?",
    criteria: {
      true: "Credits a named paint line or color with a performance property",
      false: "Describes sheens or paint in general, gives measured color values, or gives advice",
    },
  },
  cites_source: {
    type: "noul",
    instructions: "Does `paragraph` say where its product facts come from?",
    criteria: {
      true: "Credits the facts to the brand or a document, such as \"Benjamin Moore says\", \"Glidden notes\" or \"per the data sheet\"",
      false: "States the product facts with no source named",
    },
  },
  program: {
    type: "noul",
    instructions:
      "Does `paragraph` say a color belongs to a named brand program, such as a Color of the Year or a color collection?",
  },
  program_vs_reference: {
    type: "choice",
    instructions: "How does `reference` relate to what `paragraph` says about the color's brand program?",
    criteria: {
      supports: "`reference` names the same program and the same color as the paragraph",
      contradicts: "`reference` names a different color for that brand's 2026 Color of the Year than the paragraph does",
      says_nothing: "`reference` does not cover the program the paragraph names, including any program from a year other than 2026",
    },
  },
} as const;

export interface Answers {
  popularity: { noul: number };
  trend: { noul: number };
  price: { noul: number };
  product_performance: { noul: number };
  cites_source: { noul: number };
  program: { noul: number };
  program_vs_reference: { choice: "supports" | "contradicts" | "says_nothing"; confidence: number };
}

// ─── Decision ────────────────────────────────────────────────────────────────

export type Verdict = "fail" | "review" | "pass";

export interface Decision {
  verdict: Verdict;
  reasons: string[];
  /** For ranking: the strongest yes among the failing or unsettled judgments. */
  score: number;
}

const WORDING: Array<[keyof Answers, string]> = [
  ["popularity", "popularity or ranking claim"],
  ["trend", "trend claim"],
  ["price", "price or sale claim (goes stale)"],
  ["product_performance", "product performance claim without a source"],
];

/**
 * The truth table. Each wording judgment fails at YES and is unsettled between NO
 * and YES. A performance claim that names its source (a data sheet, the brand's
 * site) passes. A program claim passes only when the reference supports it
 * confidently; a confidently contradicted one fails; any other is reviewed.
 */
export function decide(a: Answers): Decision {
  const fails: string[] = [];
  const reviews: string[] = [];
  let score = 0;

  const prog = a.program.noul;
  const rel = a.program_vs_reference;
  // Naming a verified Color of the Year reads as trend-ish to the model; with the
  // designation confirmed, only a confident trend claim still counts.
  const verifiedProgram = prog >= YES && rel.choice === "supports" && rel.confidence >= PROGRAM_ACCEPT;
  const sourced = a.cites_source.noul >= YES;

  for (const [key, label] of WORDING) {
    const p = (a[key] as { noul: number }).noul;
    if (key === "trend" && verifiedProgram && p < YES) continue;
    if (key === "product_performance" && sourced) continue;
    if (p >= YES) fails.push(`${label} (${p.toFixed(2)})`);
    else if (p > NO) reviews.push(`possible ${label} (${p.toFixed(2)})`);
    else continue;
    score = Math.max(score, p);
  }

  if (prog >= YES && !verifiedProgram) {
    const label = `brand program ${rel.choice} by reference (${rel.confidence.toFixed(2)})`;
    if (rel.choice === "contradicts" && rel.confidence >= PROGRAM_ACCEPT) {
      fails.push(label);
      score = Math.max(score, prog);
    } else {
      reviews.push(label);
      score = Math.max(score, prog * 0.9);
    }
  }

  if (fails.length) return { verdict: "fail", reasons: [...fails, ...reviews], score: 1 + score };
  if (reviews.length) return { verdict: "review", reasons: reviews, score };
  return { verdict: "pass", reasons: [], score: 0 };
}
