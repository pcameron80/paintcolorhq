import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import { parsePostRanges } from "./check-modified-dates-lib.ts";
import { cleanText, decide, extractBlocks, parseCotyTable, type Answers } from "./claim-check-lib.ts";

const answers = (o: Partial<Record<"popularity" | "trend" | "price" | "product_performance" | "cites_source" | "program", number>>, rel: Answers["program_vs_reference"] = { choice: "says_nothing", confidence: 0.9 }): Answers => ({
  popularity: { noul: o.popularity ?? 0.05 },
  trend: { noul: o.trend ?? 0.05 },
  price: { noul: o.price ?? 0.05 },
  product_performance: { noul: o.product_performance ?? 0.05 },
  cites_source: { noul: o.cites_source ?? 0.05 },
  program: { noul: o.program ?? 0.05 },
  program_vs_reference: rel,
});

test("cleanText: Swatch becomes its name, tags and entities go", () => {
  const jsx = `<Swatch hex="#b8a992" name="Universal Khaki" brand="Sherwin-Williams" href="/x" /> — Sherwin-Williams&apos; pick.{" "}<Link href="/y" className="a">Rocky Beach</Link>`;
  assert.equal(cleanText(jsx), "Universal Khaki — Sherwin-Williams' pick. Rocky Beach");
});

test("extractBlocks: title, excerpt on the next line, FAQ answer and body blocks", () => {
  const src = [
    "const blogPosts: BlogPost[] = [",
    "  {",
    '    slug: "demo-post",',
    '    title: "Demo Post Title for Kitchens",',
    '    date: "2026-01-01",',
    "    excerpt:",
    '      "The most popular kitchen colors, measured and compared.",',
    "    faq: [",
    "      {",
    '        question: "Q?",',
    "        answer:",
    '          "Agreeable Gray is America\'s #1 paint color by sales.",',
    "      },",
    "    ],",
    "    content: () => (",
    "      <>",
    '        <p className="mt-4">',
    "          Pewter Green is the kitchen green of the decade.",
    "        </p>",
    "        <h3>Short</h3>",
    "      </>",
    "    ),",
    "  },",
    "];",
  ];
  const blocks = extractBlocks(src, parsePostRanges(src.join("\n"))[0]);
  assert.deepEqual(
    blocks.map((b) => [b.kind, b.line]),
    [["title", 4], ["excerpt", 6], ["faq", 11], ["body", 17]],
  );
  assert.equal(blocks[3].text, "Pewter Green is the kitchen green of the decade.");
});

test("parseCotyTable: reads the verified 2026 table from the playbook", () => {
  const facts = parseCotyTable(fs.readFileSync("docs/coty-playbook.md", "utf8"));
  assert.ok(facts.some((f) => f.brand === "Sherwin-Williams" && f.color === "Universal Khaki (SW 6150)"));
  assert.ok(facts.some((f) => f.brand === "Benjamin Moore" && f.color === "Silhouette (AF-655)"));
  assert.ok(facts.length >= 7);
});

test("decide: clean prose passes", () => {
  assert.equal(decide(answers({})).verdict, "pass");
});

test("decide: a confident wording claim fails, an unsettled one goes to review", () => {
  assert.equal(decide(answers({ popularity: 0.98 })).verdict, "fail");
  assert.equal(decide(answers({ product_performance: 0.5 })).verdict, "review");
});

test("decide: a program claim the reference supports passes; one it does not cover is reviewed", () => {
  assert.equal(decide(answers({ program: 0.99 }, { choice: "supports", confidence: 0.98 })).verdict, "pass");
  assert.equal(decide(answers({ program: 0.98 }, { choice: "says_nothing", confidence: 0.2 })).verdict, "review");
  assert.equal(decide(answers({ program: 0.98 }, { choice: "supports", confidence: 0.22 })).verdict, "review");
});

test("decide: a performance claim passes when it names its source; a price claim never does", () => {
  assert.equal(decide(answers({ product_performance: 0.9 })).verdict, "fail");
  assert.equal(decide(answers({ product_performance: 0.9, cites_source: 0.85 })).verdict, "pass");
  assert.equal(decide(answers({ price: 0.95, cites_source: 0.85 })).verdict, "fail");
});

test("decide: a verified Color of the Year excuses an unsettled trend score, not a confident one", () => {
  const supported = { choice: "supports", confidence: 0.98 } as const;
  assert.equal(decide(answers({ program: 0.99, trend: 0.53 }, supported)).verdict, "pass");
  assert.equal(decide(answers({ program: 0.99, trend: 0.9 }, supported)).verdict, "fail");
  assert.equal(decide(answers({ program: 0.2, trend: 0.53 })).verdict, "review");
});

test("decide: a contradicted program claim fails", () => {
  assert.equal(decide(answers({ program: 0.95 }, { choice: "contradicts", confidence: 0.9 })).verdict, "fail");
  assert.equal(decide(answers({ program: 0.95 }, { choice: "contradicts", confidence: 0.49 })).verdict, "review");
});

test("decide: fails rank above reviews", () => {
  assert.ok(decide(answers({ trend: 0.71 })).score > decide(answers({ trend: 0.69 })).score);
});
