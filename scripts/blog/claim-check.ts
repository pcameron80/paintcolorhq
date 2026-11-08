/**
 * Flag blog wording that needs a source before it ships: popularity and ranking
 * claims ("America's #1 paint color"), trend claims ("the kitchen green of the
 * decade"), product-performance or price claims ("hides fingerprints", "30-40%
 * off sales"), and brand-program attributions ("the 2026 HGTV Home Color
 * Collection pick") that the verified Color of the Year table in
 * docs/coty-playbook.md does not back.
 *
 * Each prose block (title, excerpt, FAQ answer, body paragraph or list item) goes
 * to TypeSafe's Jev model as one request with the questions in claim-check-lib.ts;
 * the pass / review / fail rules are code in the same file. Numbers are out of
 * scope: run `npm run audit-colors` for hex, LRV and closeness claims.
 *
 * Read-only: it never edits a post. Sends post text (public or about to be) to
 * api.typesafe.ai. Cost is per input token ($0.042 per million on jev-1.14); a
 * full scan of every live post is a few hundred thousand tokens.
 *
 * Usage:
 *   npm run claim-check                          every live post (date <= today)
 *   npm run claim-check -- --slugs=a,b           only these posts, live or scheduled
 *   npm run claim-check -- --json=/tmp/claims.json --show=all
 *
 *   --slugs=a,b        posts to check (default: all posts dated today or earlier)
 *   --show=fail|review|all   which findings to print (default: review, i.e. fail + review)
 *   --json=<path>      write every block with its answers and decision
 *   --max-tokens=<n>   stop before sending more than n input tokens (default 5,000,000)
 *
 * Needs TYPESAFE_API_KEY (from .env.local). Exits 1 when any block fails, and 2
 * when the API errors: an API failure is never read as a pass.
 */
import "./load-env.ts"; // MUST be first — populates env before anything reads it.
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parsePostRanges } from "./check-modified-dates-lib.ts";
import {
  MODEL,
  QUESTIONS,
  buildReference,
  decide,
  extractBlocks,
  parseCotyTable,
  type Answers,
  type Block,
  type Decision,
} from "./claim-check-lib.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const CONCURRENCY = 4;
const PRICE_PER_TOKEN = 0.042 / 1e6;

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

const key = process.env.TYPESAFE_API_KEY;
if (!key) {
  console.error("TYPESAFE_API_KEY is not set (looked for .env.local here and in the main checkout).");
  process.exit(2);
}

const show = arg("show") ?? "review";
const maxTokens = Number(arg("max-tokens") ?? 5_000_000);
const slugs = arg("slugs")?.split(",").filter(Boolean);
const today = new Date().toISOString().slice(0, 10);

const source = fs.readFileSync(path.join(ROOT, "src/lib/blog-posts.tsx"), "utf8");
const lines = source.split("\n");
const posts = parsePostRanges(source).filter((p) => (slugs ? slugs.includes(p.slug) : p.date <= today));
if (slugs) {
  const missing = slugs.filter((s) => !posts.some((p) => p.slug === s));
  if (missing.length) {
    console.error(`Unknown slug(s): ${missing.join(", ")}`);
    process.exit(2);
  }
}

const facts = parseCotyTable(fs.readFileSync(path.join(ROOT, "docs/coty-playbook.md"), "utf8"));
if (facts.length < 5) {
  console.error(`Read only ${facts.length} Color of the Year rows from docs/coty-playbook.md; the table format changed.`);
  process.exit(2);
}
const reference = buildReference(facts);
const blocks = posts.flatMap((p) => extractBlocks(lines, p));

let tokensUsed = 0;

async function ask(block: Block): Promise<Answers> {
  const body = JSON.stringify({ model: MODEL, state: { paragraph: block.text, reference }, questions: QUESTIONS });
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body,
    });
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get("retry-after") ?? 2 ** attempt);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`TypeSafe HTTP ${res.status} on ${block.slug}:${block.line}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    tokensUsed += json.usage?.input_tokens ?? 0;
    return json.answers as Answers;
  }
}

interface Result extends Block {
  answers: Answers;
  decision: Decision;
}

async function main() {
  console.log(`Checking ${blocks.length} blocks in ${posts.length} posts with ${MODEL}…`);
  const results: Result[] = [];
  let next = 0;
  let stopped = false;
  async function worker() {
    while (next < blocks.length && !stopped) {
      if (tokensUsed >= maxTokens) {
        stopped = true;
        break;
      }
      const block = blocks[next++];
      const answers = await ask(block);
      results.push({ ...block, answers, decision: decide(answers) });
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const order = { fail: 0, review: 1, pass: 2 } as const;
  results.sort((a, b) => order[a.decision.verdict] - order[b.decision.verdict] || b.decision.score - a.decision.score);

  const wanted = results.filter((r) =>
    show === "all" ? true : show === "fail" ? r.decision.verdict === "fail" : r.decision.verdict !== "pass",
  );
  for (const r of wanted) {
    console.log(`\n[${r.decision.verdict.toUpperCase()}] ${r.slug} (src/lib/blog-posts.tsx:${r.line}, ${r.kind})`);
    console.log(`  ${r.decision.reasons.join("; ") || "no issues"}`);
    console.log(`  "${r.text.length > 240 ? r.text.slice(0, 237) + "…" : r.text}"`);
  }

  const count = (v: string) => results.filter((r) => r.decision.verdict === v).length;
  console.log(
    `\n${count("fail")} fail, ${count("review")} review, ${count("pass")} pass across ${results.length} blocks` +
      `${stopped ? ` (STOPPED at --max-tokens; ${blocks.length - results.length} blocks unchecked)` : ""}.` +
      ` ${tokensUsed.toLocaleString()} input tokens, about $${(tokensUsed * PRICE_PER_TOKEN).toFixed(4)}.`,
  );

  const jsonPath = arg("json");
  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify({ model: MODEL, date: today, reference, results }, null, 2));
    console.log(`Wrote ${jsonPath}`);
  }
  if (stopped) process.exit(2);
  if (count("fail")) process.exit(1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
