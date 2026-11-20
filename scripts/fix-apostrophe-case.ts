/**
 * Lowercase the capital after a mid-word apostrophe in color names:
 * "Ocean'S Depth" -> "Ocean's Depth", "Bee'S Knees" -> "Bee's Knees".
 *
 * Found 2026-11-03: the colornerd source files title-cased every letter after
 * an apostrophe, so 84 names (Dutch Boy 34, PPG 26, Dunn-Edwards 8, Behr 6,
 * Kilz 6, Sherwin-Williams 4) showed the bad capital on their own pages, in
 * match lists and in meta descriptions. import-colors.ts now applies the same
 * fixApostropheCase(), so a reimport does not bring them back.
 *
 * Name only. Slugs stay as they are (same rule as apply-published-names.ts):
 * URLs are stable, so there are no redirects to maintain.
 *
 * public/match-data/*.json is rebuilt by the prebuild hook on the next deploy:
 * a name change alters build-match-data's content fingerprint. Colors on the
 * frozen-match list keep their snapshot text until their freeze ends.
 *
 * Usage:
 *   npx tsx scripts/fix-apostrophe-case.ts           # dry run: prints before/after
 *   npx tsx scripts/fix-apostrophe-case.ts --apply   # backs up, then writes
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { fixApostropheCase } from "./lib/name-punctuation";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const APPLY = process.argv.includes("--apply");

type Row = { id: string; name: string; slug: string; brand: { slug: string } | null };

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, name, slug, brand:brands(slug)")
      .like("name", "%'%")
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as unknown as Row[]));
    if (!data || data.length < 1000) break;
  }

  const changes = rows
    .map((r) => ({ ...r, fixed: fixApostropheCase(r.name) }))
    .filter((r) => r.fixed !== r.name);

  for (const c of changes) console.log(`${c.brand?.slug}/${c.slug}: ${c.name} -> ${c.fixed}`);
  console.log(`\n${changes.length} of ${rows.length} names with an apostrophe need fixing.`);

  if (!APPLY) {
    console.log("Dry run. Re-run with --apply to write.");
    return;
  }

  const backupDir = path.resolve(__dirname, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `fix-apostrophe-case-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(changes.map(({ id, name, slug }) => ({ id, name, slug })), null, 2));
  console.log(`Backed up ${changes.length} rows to ${backupFile}`);

  let written = 0;
  for (const c of changes) {
    const { error } = await supabase.from("colors").update({ name: c.fixed }).eq("id", c.id).eq("name", c.name);
    if (error) throw error;
    written++;
  }
  console.log(`Wrote ${written} names. Redeploy so public/match-data picks them up.`);
}

main().catch((e) => {
  console.error("Error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
