/**
 * Audit hand-written color facts in content files against the live DB.
 *
 * Run after anything that changes color data — a palette drift correction
 * (apply-hex-corrections.ts), a published-LRV update, a match recompute — and
 * before publishing a post. It is part of the seo-preflight gate. It reports
 * stale Swatch and list hexes, broken, archived or not-live color links, printed
 * LRVs that disagree with the DB, cross-brand match claims whose closeness label
 * or "closest" wording no longer holds, "N brands" copy that disagrees with the
 * brands table, rows in src/data/lightest-whites.ts that are not live or not the
 * brand's published value, and DB rows no page should print as-is (implausible
 * LRV, null undertone, entity or mis-cased names). Read-only: it never writes.
 * See audit-color-facts-lib.ts for exactly what is checked.
 *
 * Usage:
 *   npm run audit-colors
 *   npm run audit-colors -- --changed=scripts/data/backups/hex-corrections-<ts>.json
 *   npm run audit-colors -- --files=src/lib/blog-posts.tsx --json=/tmp/audit.json
 *
 *   --changed=<backup.json>  also list every reference to a color in that backup
 *                            (the rows a correction rewrote), for a human pass over
 *                            descriptive copy ("pink-beige", "soft blue-gray") that
 *                            no number can verify
 *   --files=a,b              content files to audit (default: the content files below);
 *                            the DB, brand-count and lightest-whites passes always run
 *   --scan-dir=<dir>         palette feeds for the lightest-whites check (default: the
 *                            newest data/brand-scans/<date> here or in the main checkout)
 *   --json=<path>            write every finding as JSON
 *   --verbose                print every DB-row finding, not the first few per rule
 *   --strict                 exit 1 on warnings too, not only errors
 *
 * Exits 1 when any error-level finding exists (stale hex, broken link, a lightest-whites
 * row that is not live, a brand-count mismatch with the brands table).
 */
import "./load-env.ts"; // MUST be first — populates env before anything reads it.
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { deltaE2000 } from "../../src/lib/color-utils.ts";
import { LIGHTEST_WHITES } from "../../src/data/lightest-whites.ts";
import {
  Catalog,
  auditText,
  auditBrandCounts,
  auditBrandTotal,
  auditCatalogRows,
  auditLightestWhites,
  type AuditColor,
  type CatalogRules,
  type FeedRow,
  type Finding,
} from "./audit-color-facts-lib.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const DEFAULT_FILES = [
  "src/lib/blog-posts.tsx",
  "src/lib/color-editorial.tsx",
  "src/lib/brand-content.tsx",
  "src/lib/family-content.tsx",
  "src/lib/family-undertone-copy.ts",
  "src/lib/palettes.ts",
  "src/app/not-found.tsx",
  "src/app/colors/family/[familySlug]/page.tsx",
  "src/app/paint-color-statistics/page.tsx",
];

/** Brand-count copy can sit in any page or lib file (layout meta, tool pages, FAQ). */
const BRAND_COUNT_DIRS = ["src/app", "src/lib"];

const WHITES_FILE = "src/data/lightest-whites.ts";

const RULES: CatalogRules = {
  lrvRange: [2, 94.5],
  // Rows whose out-of-range LRV is the manufacturer's own published value. None yet:
  // every row outside the range today is computed from its hex.
  lrvAllowlist: new Set<string>([]),
  // Manufacturer styling, not a casing bug. The rule only fires on two letters before
  // the apostrophe, so O'Brien, D'Azur and M'Apelle never need listing.
  nameAllowlist: new Set<string>([]),
  // Both backlogs need DB writes (Philip): the undertone backfill for the 346 rows the
  // importers skipped (A23), and apply-published-names --case for the mis-cased and
  // entity names (A56). Until those land these report as warnings; flip each to
  // "error" the day its backlog reaches zero so a new import cannot reopen it.
  nullUndertone: "warn",
  nameMechanics: "warn",
};

function arg(name: string): string | undefined {
  return process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

function mainCheckout(): string | undefined {
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim();
    return path.dirname(common);
  } catch {
    return undefined;
  }
}

/** In a git worktree the checkout's own .env.local is often absent; fall back to the main checkout's. */
function ensureEnv() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const main = mainCheckout();
  if (main) dotenv.config({ path: path.join(main, ".env.local"), quiet: true });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set (looked for .env.local here and in the main checkout).");
    process.exit(2);
  }
}

/** Newest dated palette-scan folder (data/ is gitignored, so worktrees fall back to the main checkout). */
function findScanDir(): string | undefined {
  const given = arg("scan-dir");
  if (given) return path.resolve(given);
  for (const base of [root, mainCheckout()].filter(Boolean) as string[]) {
    const dir = path.join(base, "data/brand-scans");
    if (!fs.existsSync(dir)) continue;
    const dated = fs.readdirSync(dir).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    if (dated.length) return path.join(dir, dated[dated.length - 1]);
  }
  return undefined;
}

function loadFeeds(dir: string | undefined): Map<string, FeedRow[]> | undefined {
  if (!dir || !fs.existsSync(dir)) return undefined;
  const feeds = new Map<string, FeedRow[]>();
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(.+)-live\.json$/);
    if (m) feeds.set(m[1], JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as FeedRow[]);
  }
  return feeds;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

async function loadColors(): Promise<{ colors: AuditColor[]; brandRows: number }> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
  const out: AuditColor[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("colors")
      .select("id, slug, name, color_number, hex, lrv, lab_l, lab_a, lab_b_val, is_archived, undertone, last_seen_live_on, brands!inner(slug, name)")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`colors query failed: ${error.message}`);
    for (const r of data ?? []) {
      const brand = r.brands as unknown as { slug: string; name: string };
      out.push({
        id: r.id,
        brandSlug: brand.slug,
        brandName: brand.name,
        slug: r.slug,
        name: r.name,
        code: r.color_number ?? "",
        hex: r.hex,
        lrv: r.lrv == null ? null : Number(r.lrv),
        archived: Boolean(r.is_archived),
        lab: { L: Number(r.lab_l), a: Number(r.lab_a), b: Number(r.lab_b_val) },
        undertone: r.undertone ?? null,
        lastSeenLive: r.last_seen_live_on ?? null,
      });
    }
    if (!data || data.length < PAGE) break;
  }
  const { count, error } = await sb.from("brands").select("id", { count: "exact", head: true });
  if (error || count == null) throw new Error(`brands count failed: ${error?.message}`);
  return { colors: out, brandRows: count };
}

async function main() {
  ensureEnv();
  const files = (arg("files")?.split(",") ?? DEFAULT_FILES).map((f) => f.trim()).filter(Boolean);
  const changedPath = arg("changed");
  const changedIds = changedPath
    ? new Set<string>((JSON.parse(fs.readFileSync(path.resolve(changedPath), "utf8")) as { id: string }[]).map((r) => r.id))
    : undefined;

  const { colors, brandRows } = await loadColors();
  const cat = new Catalog(colors, deltaE2000);
  console.log(`Loaded ${colors.length} colors and ${brandRows} brands${changedIds ? `; ${changedIds.size} marked changed` : ""}.\n`);

  const findings: Finding[] = [];
  for (const f of files) {
    const abs = path.resolve(root, f);
    if (!fs.existsSync(abs)) {
      console.warn(`skip (missing): ${f}`);
      continue;
    }
    findings.push(...auditText(f, fs.readFileSync(abs, "utf8"), cat, { changedIds }));
  }

  // Brand counts: the snapshot BRAND_COUNT the pages print vs the brands table, then copy everywhere.
  const snapPath = path.join(root, "src/generated/sitemap.json");
  if (fs.existsSync(snapPath)) {
    const snapshot = JSON.parse(fs.readFileSync(snapPath, "utf8")) as { brands: unknown[] };
    findings.push(...auditBrandTotal(brandRows, snapshot.brands.length));
  } else console.warn("skip BRAND_COUNT check: src/generated/sitemap.json is missing (it is written at build).");
  for (const dir of BRAND_COUNT_DIRS)
    for (const abs of walk(path.join(root, dir)))
      findings.push(...auditBrandCounts(path.relative(root, abs), fs.readFileSync(abs, "utf8"), brandRows));

  const scanDir = findScanDir();
  const feeds = loadFeeds(scanDir);
  findings.push(...auditLightestWhites(WHITES_FILE, fs.readFileSync(path.join(root, WHITES_FILE), "utf8"), LIGHTEST_WHITES, cat, feeds));
  console.log(
    feeds
      ? `Lightest whites checked against palette feeds in ${path.relative(root, scanDir!) || scanDir}.\n`
      : "No palette feeds found (data/brand-scans/<date>); lightest whites checked against the DB only.\n",
  );

  const dbFindings = auditCatalogRows(colors, RULES);
  findings.push(...dbFindings);

  const order = { error: 0, warn: 1, info: 2 } as const;
  const byFile = new Map<string, Finding[]>();
  for (const f of findings.filter((x) => x.line > 0)) (byFile.get(f.file) ?? byFile.set(f.file, []).get(f.file)!).push(f);
  for (const [file, list] of byFile) {
    console.log(file);
    for (const f of list.sort((a, b) => a.line - b.line || order[a.severity] - order[b.severity]))
      console.log(`  ${String(f.line).padStart(5)}  ${f.severity.padEnd(5)}  ${f.kind.padEnd(15)}  ${f.message}`);
    console.log();
  }
  // DB-row findings run to hundreds; group them by rule.
  const rows = findings.filter((x) => x.line === 0);
  const byKind = new Map<string, Finding[]>();
  for (const f of rows) (byKind.get(`${f.file} ${f.kind}`) ?? byKind.set(`${f.file} ${f.kind}`, []).get(`${f.file} ${f.kind}`)!).push(f);
  const show = process.argv.includes("--verbose") ? Infinity : 8;
  for (const [k, list] of byKind) {
    console.log(`${k}: ${list.length} ${list[0].severity}${list.length > 1 ? "s" : ""}`);
    for (const f of list.slice(0, show)) console.log(`         ${f.message}`);
    if (list.length > show) console.log(`         … ${list.length - show} more (--verbose or --json for all)`);
    console.log();
  }

  const count = (s: Finding["severity"]) => findings.filter((f) => f.severity === s).length;
  console.log(`${count("error")} errors, ${count("warn")} warnings, ${count("info")} info across ${files.length} content files, the brand-count copy pass, ${WHITES_FILE} and ${colors.length} DB rows.`);
  if (arg("json")) fs.writeFileSync(path.resolve(arg("json")!), JSON.stringify(findings, null, 2));

  if (count("error") > 0 || (process.argv.includes("--strict") && count("warn") > 0)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
