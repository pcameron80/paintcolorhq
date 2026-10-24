/**
 * Side-effect module: load .env.local before anything reads process.env.
 *
 * Import this FIRST (before src/lib/queries.ts) in blog pipeline runners.
 * queries.ts → supabase.ts creates the Supabase client at import time from
 * process.env, so the env must be populated before that module evaluates.
 * ES/CJS evaluate imports in source order, so a bare `import "./load-env.ts"`
 * above the queries import guarantees this without top-level await (which tsx's
 * cjs output rejects).
 *
 * In a git worktree the checkout's own .env.local is usually absent, so this
 * falls back to the main checkout's, the same rule audit-color-facts.ts uses.
 * Values are loaded into process.env only, never printed.
 */
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim();
    dotenv.config({ path: path.join(path.dirname(common), ".env.local"), quiet: true });
  } catch {
    /* not a git checkout; callers report the missing env */
  }
}
