/**
 * Audit hand-written color facts in content files against the live DB.
 *
 * Run after anything that changes color data — a palette drift correction
 * (apply-hex-corrections.ts), a published-LRV update, a match recompute — and
 * before publishing a post. It reports stale Swatch hexes, broken or archived
 * color links, printed LRVs that disagree with the DB, and cross-brand match
 * claims whose closeness label or "closest" wording no longer holds.
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
 *   --files=a,b              files to audit (default: the content files below)
 *   --json=<path>            write findings as JSON
 *   --strict                 exit 1 on warnings too, not only errors
 *
 * Exits 1 when any error-level finding exists (stale hex, broken link).
 */
import "./load-env.ts"; // MUST be first — populates env before anything reads it.
import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { deltaE2000 } from "../../src/lib/color-utils.ts";
import { Catalog, auditText, type AuditColor, type Finding } from "./audit-color-facts-lib.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const DEFAULT_FILES = [
  "src/lib/blog-posts.tsx",
  "src/lib/color-editorial.tsx",
  "src/lib/brand-content.tsx",
  "src/lib/family-content.tsx",
  "src/lib/family-undertone-copy.ts",
  "src/lib/palettes.ts",
  "src/app/not-found.tsx",
];

function arg(name: string): string | undefined {
  return process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.replace(`--${name}=`, "");
}

/** In a git worktree the checkout's own .env.local is often absent; fall back to the main checkout's. */
function ensureEnv() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim();
    dotenv.config({ path: path.join(path.dirname(common), ".env.local"), quiet: true });
  } catch {
    /* not a git checkout; the check below reports it */
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set (looked for .env.local here and in the main checkout).");
    process.exit(2);
  }
}

async function loadColors(): Promise<AuditColor[]> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
  const out: AuditColor[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("colors")
      .select("id, slug, name, color_number, hex, lrv, lab_l, lab_a, lab_b_val, is_archived, brands!inner(slug, name)")
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
      });
    }
    if (!data || data.length < PAGE) break;
  }
  return out;
}

async function main() {
  ensureEnv();
  const files = (arg("files")?.split(",") ?? DEFAULT_FILES).map((f) => f.trim()).filter(Boolean);
  const changedPath = arg("changed");
  const changedIds = changedPath
    ? new Set<string>((JSON.parse(fs.readFileSync(path.resolve(changedPath), "utf8")) as { id: string }[]).map((r) => r.id))
    : undefined;

  const colors = await loadColors();
  const cat = new Catalog(colors, deltaE2000);
  console.log(`Loaded ${colors.length} colors${changedIds ? `; ${changedIds.size} marked changed` : ""}.\n`);

  const findings: Finding[] = [];
  for (const f of files) {
    const abs = path.resolve(root, f);
    if (!fs.existsSync(abs)) {
      console.warn(`skip (missing): ${f}`);
      continue;
    }
    findings.push(...auditText(f, fs.readFileSync(abs, "utf8"), cat, { changedIds }));
  }

  const order = { error: 0, warn: 1, info: 2 } as const;
  const byFile = new Map<string, Finding[]>();
  for (const f of findings) (byFile.get(f.file) ?? byFile.set(f.file, []).get(f.file)!).push(f);
  for (const [file, list] of byFile) {
    console.log(file);
    for (const f of list.sort((a, b) => a.line - b.line || order[a.severity] - order[b.severity]))
      console.log(`  ${String(f.line).padStart(5)}  ${f.severity.padEnd(5)}  ${f.kind.padEnd(15)}  ${f.message}`);
    console.log();
  }

  const count = (s: Finding["severity"]) => findings.filter((f) => f.severity === s).length;
  console.log(`${count("error")} errors, ${count("warn")} warnings, ${count("info")} info across ${files.length} files.`);
  if (arg("json")) fs.writeFileSync(path.resolve(arg("json")!), JSON.stringify(findings, null, 2));

  if (count("error") > 0 || (process.argv.includes("--strict") && count("warn") > 0)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
