/**
 * AI visibility tracker: asks ChatGPT, Perplexity and Gemini the fixed
 * questions in ai-visibility-questions.json (through DataForSEO's LLM
 * Responses API, web search on) and records which domains each answer cites.
 * The point is the trend and the gaps: which questions cite paintcolorhq.com,
 * and who is cited instead when we are not. Writers research with these
 * assistants, so a citation reaches them before they decide what to link.
 *
 * Cost: about $0.03 (ChatGPT), $0.006 (Perplexity) and $0.03 (Gemini) per
 * question, so ~$2.60 for the full 40-question run (measured 2026-10-27).
 * --max-cost aborts before spending if the estimate is higher.
 *
 * Credentials: DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD (API password, not the
 * account login) from the environment, .env.local, or
 * ~/.config/scout/dataforseo.env. Never printed.
 *
 * Usage (npm run ai-visibility -- [flags]):
 *   --platforms=chatgpt,perplexity,gemini   default all three
 *   --only=<id,id>                          question ids to run
 *   --limit=N                               first N questions (for a test)
 *   --max-cost=5                            USD guard on the estimate
 *   --dry-run                               print the plan and estimate only
 *   --no-save                               skip writing the snapshot
 *   report [--file=<snapshot>]              re-print a saved snapshot's report
 *
 * Output: scripts/seo/snapshots/ai-visibility-<date>.json plus a markdown
 * report on stdout, compared with the newest earlier snapshot.
 */
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local"), quiet: true });
dotenv.config({ path: path.join(os.homedir(), ".config/scout/dataforseo.env"), quiet: true });

const API = "https://api.dataforseo.com/v3/ai_optimization";
const SNAPSHOT_DIR = path.resolve(__dirname, "snapshots");
const QUESTIONS_FILE = path.resolve(__dirname, "ai-visibility-questions.json");
const OUR_DOMAIN = "paintcolorhq.com";
const OUR_NAME = /paint\s*color\s*hq|paintcolorhq/i;

type Platform = "chatgpt" | "perplexity" | "gemini";
const PLATFORMS: Record<Platform, { path: string; body: Record<string, unknown>; estimate: number }> = {
  chatgpt: { path: "chat_gpt", body: { model_name: "gpt-5.4-mini", web_search: true, web_search_country_iso_code: "US" }, estimate: 0.035 },
  perplexity: { path: "perplexity", body: { model_name: "sonar" }, estimate: 0.008 },
  gemini: { path: "gemini", body: { model_name: "gemini-3.5-flash", web_search: true }, estimate: 0.035 },
};

type Question = { id: string; category: string; question: string; target: string };
type Answer = {
  platform: Platform;
  ok: boolean;
  error?: string;
  cost: number;
  cited: boolean; // a paintcolorhq.com URL is among the citations
  mentioned: boolean; // the answer text names Paint Color HQ
  ourUrls: string[];
  domains: string[]; // cited domains, deduplicated, in citation order
};
type Snapshot = { date: string; platforms: Platform[]; questions: (Question & { answers: Answer[] })[]; cost: number };

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}
const flag = (name: string) => process.argv.includes(`--${name}`);

function auth(): string {
  const { DATAFORSEO_LOGIN: login, DATAFORSEO_PASSWORD: password } = process.env;
  if (!login || !password) throw new Error("DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD not set");
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

/** Gemini returns grounding-redirect URLs with the domain as the title. */
export function citedDomain(url: string | undefined, title: string | undefined): string | null {
  try {
    const host = new URL(url ?? "").hostname.replace(/^www\./, "");
    if (host === "vertexaisearch.cloud.google.com") return title ? title.replace(/^www\./, "").toLowerCase() : null;
    return host;
  } catch {
    return null;
  }
}

export function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const k of [...u.searchParams.keys()]) if (k.startsWith("utm_")) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return url;
  }
}

type Annotation = { title?: string; url?: string };
type Section = { type?: string; text?: string; annotations?: Annotation[] | null };
type Item = { type?: string; sections?: Section[] };

/** Reads only the final answer: ChatGPT also returns reasoning summaries without citations. */
export function parseAnswer(platform: Platform, items: Item[], cost: number): Answer {
  const answerItems = items.filter((i) => i.type !== "reasoning");
  const sections = answerItems.flatMap((i) => i.sections ?? []);
  const text = sections.map((s) => s.text ?? "").join("\n");
  const annotations = sections.flatMap((s) => s.annotations ?? []);
  const domains: string[] = [];
  const ourUrls: string[] = [];
  for (const a of annotations) {
    const d = citedDomain(a.url, a.title);
    if (!d) continue;
    if (!domains.includes(d)) domains.push(d);
    if (d === OUR_DOMAIN || d.endsWith(`.${OUR_DOMAIN}`)) {
      const u = d === OUR_DOMAIN && a.url && !a.url.includes("vertexaisearch") ? cleanUrl(a.url) : OUR_DOMAIN;
      if (!ourUrls.includes(u)) ourUrls.push(u);
    }
  }
  return { platform, ok: true, cost, cited: ourUrls.length > 0, mentioned: OUR_NAME.test(text), ourUrls, domains };
}

async function ask(platform: Platform, question: string): Promise<Answer> {
  const p = PLATFORMS[platform];
  const empty = { platform, cost: 0, cited: false, mentioned: false, ourUrls: [], domains: [] };
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${API}/${p.path}/llm_responses/live`, {
        method: "POST",
        headers: { Authorization: auth(), "Content-Type": "application/json" },
        body: JSON.stringify([{ user_prompt: question, ...p.body }]),
        signal: AbortSignal.timeout(180_000),
      });
      const json = (await res.json()) as { tasks?: { status_code: number; status_message: string; cost?: number; result?: { items?: Item[] }[] }[] };
      const task = json.tasks?.[0];
      if (!task || task.status_code !== 20000) throw new Error(task ? `${task.status_code} ${task.status_message}` : `HTTP ${res.status}`);
      return parseAnswer(platform, task.result?.[0]?.items ?? [], task.cost ?? 0);
    } catch (e) {
      if (attempt === 2) return { ...empty, ok: false, error: String((e as Error).message ?? e).slice(0, 200) };
    }
  }
  return { ...empty, ok: false, error: "unreachable" };
}

function latestSnapshot(before?: string): string | null {
  if (!fs.existsSync(SNAPSHOT_DIR)) return null;
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => /^ai-visibility-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  const eligible = before ? files.filter((f) => f < `ai-visibility-${before}.json`) : files;
  return eligible.length ? path.join(SNAPSHOT_DIR, eligible[eligible.length - 1]) : null;
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "n/a");

export function report(snap: Snapshot, prev: Snapshot | null): string {
  const lines: string[] = [];
  const ok = (q: Snapshot["questions"][number], p: Platform) => q.answers.find((a) => a.platform === p && a.ok);
  lines.push(`# AI visibility, ${snap.date}`, "");
  lines.push(`${snap.questions.length} questions, ${snap.platforms.join(", ")}. Cost $${snap.cost.toFixed(2)}.`, "");

  lines.push("## Cited (a paintcolorhq.com link in the answer)", "", "| Platform | Cited | Named in text | Previous |", "|---|---|---|---|");
  for (const p of snap.platforms) {
    const answered = snap.questions.map((q) => ok(q, p)).filter(Boolean) as Answer[];
    const prevAnswered = prev ? (prev.questions.map((q) => ok(q, p)).filter(Boolean) as Answer[]) : [];
    const prevCell = prev ? `${prevAnswered.filter((a) => a.cited).length}/${prevAnswered.length}` : "first run";
    lines.push(`| ${p} | ${answered.filter((a) => a.cited).length}/${answered.length} (${pct(answered.filter((a) => a.cited).length, answered.length)}) | ${answered.filter((a) => a.mentioned).length} | ${prevCell} |`);
  }

  lines.push("", "## By category (cited on any platform)", "", "| Category | Questions cited |", "|---|---|");
  const cats = [...new Set(snap.questions.map((q) => q.category))];
  for (const c of cats) {
    const qs = snap.questions.filter((q) => q.category === c);
    lines.push(`| ${c} | ${qs.filter((q) => q.answers.some((a) => a.cited)).length}/${qs.length} |`);
  }

  const counts = new Map<string, number>();
  for (const q of snap.questions) {
    const seen = new Set(q.answers.flatMap((a) => a.domains));
    for (const d of seen) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  lines.push("", "## Most-cited domains (questions where cited, any platform)", "");
  [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([d, n]) => lines.push(`- ${d === OUR_DOMAIN ? `**${d}**` : d}: ${n}`));

  lines.push("", "## Gaps: not cited anywhere (target page, who is cited instead)", "");
  for (const q of snap.questions.filter((q) => !q.answers.some((a) => a.cited))) {
    const others = [...new Set(q.answers.flatMap((a) => a.domains))].slice(0, 4).join(", ") || "no citations";
    lines.push(`- **${q.question}** (${q.target}): ${others}`);
  }

  if (prev) {
    const prevCited = new Map(prev.questions.map((q) => [q.id, q.answers.some((a) => a.cited)]));
    const gained = snap.questions.filter((q) => q.answers.some((a) => a.cited) && prevCited.get(q.id) === false);
    const lost = snap.questions.filter((q) => !q.answers.some((a) => a.cited) && prevCited.get(q.id) === true);
    lines.push("", `## Change since ${prev.date}`, "");
    lines.push(`Gained: ${gained.map((q) => q.id).join(", ") || "none"}`, "");
    lines.push(`Lost: ${lost.map((q) => q.id).join(", ") || "none"}`);
  }

  const failed = snap.questions.flatMap((q) => q.answers.filter((a) => !a.ok).map((a) => `${q.id}/${a.platform}: ${a.error}`));
  if (failed.length) lines.push("", "## Failed calls (excluded above)", "", ...failed.map((f) => `- ${f}`));
  return lines.join("\n");
}

async function main() {
  if (process.argv[2] === "report") {
    const file = arg("file") ?? latestSnapshot();
    if (!file) throw new Error("no snapshot found");
    const snap = JSON.parse(fs.readFileSync(file, "utf8")) as Snapshot;
    const prevFile = latestSnapshot(snap.date);
    console.log(report(snap, prevFile ? JSON.parse(fs.readFileSync(prevFile, "utf8")) : null));
    return;
  }

  const platforms = (arg("platforms")?.split(",") ?? Object.keys(PLATFORMS)) as Platform[];
  for (const p of platforms) if (!(p in PLATFORMS)) throw new Error(`unknown platform ${p}`);
  let questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8")) as Question[];
  const only = arg("only")?.split(",");
  if (only) questions = questions.filter((q) => only.includes(q.id));
  const limit = Number(arg("limit") ?? 0);
  if (limit > 0) questions = questions.slice(0, limit);

  const estimate = questions.length * platforms.reduce((s, p) => s + PLATFORMS[p].estimate, 0);
  const maxCost = Number(arg("max-cost") ?? 5);
  console.error(`${questions.length} questions x ${platforms.join(", ")}: estimated $${estimate.toFixed(2)} (max $${maxCost})`);
  if (estimate > maxCost) throw new Error(`estimate $${estimate.toFixed(2)} is over --max-cost=${maxCost}`);
  if (flag("dry-run")) return;
  auth();

  const date = new Date().toISOString().slice(0, 10);
  const results: Snapshot["questions"] = [];
  for (const [i, q] of questions.entries()) {
    const answers = await Promise.all(platforms.map((p) => ask(p, q.question)));
    results.push({ ...q, answers });
    const marks = answers.map((a) => `${a.platform}:${a.ok ? (a.cited ? "CITED" : "-") : "ERR"}`).join(" ");
    console.error(`[${i + 1}/${questions.length}] ${q.id} ${marks}`);
  }
  const snap: Snapshot = { date, platforms, questions: results, cost: results.flatMap((q) => q.answers).reduce((s, a) => s + a.cost, 0) };

  if (!flag("no-save")) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    const out = path.join(SNAPSHOT_DIR, `ai-visibility-${date}.json`);
    fs.writeFileSync(out, JSON.stringify(snap, null, 2) + "\n");
    console.error(`saved ${path.relative(process.cwd(), out)}`);
  }
  const prevFile = latestSnapshot(date);
  console.log(report(snap, prevFile ? JSON.parse(fs.readFileSync(prevFile, "utf8")) : null));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(String((e as Error).message ?? e));
    process.exit(1);
  });
}
