/**
 * Re-runs refineColorFamily (scripts/lib/color-math.ts) over every color and
 * fixes stored families it disagrees with. Written for the 2026-10-05 family
 * audit: ~1.4K creamy whites (Swiss Coffee, Alabaster, White Dove) were filed
 * under yellow/orange, purples under blue, and saturated colors under neutral.
 *
 *   npx tsx scripts/refine-color-families.ts            # dry run, prints a summary
 *   npx tsx scripts/refine-color-families.ts --apply    # writes, saves a backup first
 *   npx tsx scripts/refine-color-families.ts --revert <backup.json>
 *
 * Family feeds titles, meta descriptions and /colors/family hubs, so a write
 * changes live pages once ISR revalidates. Redeploy afterwards to refresh.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { refineColorFamily, hexToRgb } from "./lib/color-math";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface Row { id: string; name: string; hex: string; color_family: string | null; brand: { slug: string } }
interface Change { id: string; brand: string; name: string; hex: string; old: string; next: string }

async function fetchAll(): Promise<Row[]> {
  const rows: Row[] = [];
  let last = "";
  // Keyset pagination: unordered range pagination drops and repeats rows.
  for (;;) {
    let q = supabase.from("colors").select("id, name, hex, color_family, brand:brand_id (slug)").order("id").limit(1000);
    if (last) q = q.gt("id", last);
    const { data, error } = await q;
    if (error) throw error;
    if (!data.length) break;
    rows.push(...(data as unknown as Row[]));
    last = data[data.length - 1].id;
  }
  return rows;
}

async function writeFamilies(updates: { id: string; family: string }[]): Promise<number> {
  let written = 0;
  for (const u of updates) {
    const { data, error } = await supabase.from("colors").update({ color_family: u.family }).eq("id", u.id).select("id");
    if (error) throw error;
    written += data?.length ?? 0;
  }
  return written;
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--revert") {
    const backup: Change[] = JSON.parse(readFileSync(args[1], "utf8"));
    const written = await writeFamilies(backup.map((c) => ({ id: c.id, family: c.old })));
    console.log(`Reverted ${written} of ${backup.length} rows.`);
    return;
  }

  const rows = await fetchAll();
  const changes: Change[] = [];
  for (const r of rows) {
    const rgb = hexToRgb(r.hex);
    if (!rgb || !r.color_family) continue;
    const next = refineColorFamily(r.color_family, rgb.r, rgb.g, rgb.b);
    if (next !== r.color_family) changes.push({ id: r.id, brand: r.brand.slug, name: r.name, hex: r.hex, old: r.color_family, next });
  }

  const tally = new Map<string, number>();
  for (const c of changes) tally.set(`${c.old} -> ${c.next}`, (tally.get(`${c.old} -> ${c.next}`) ?? 0) + 1);
  console.log(`Scanned ${rows.length} colors; ${changes.length} would change.`);
  for (const [k, v] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);

  if (!args.includes("--apply")) {
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }

  mkdirSync("scripts/data/backups", { recursive: true });
  const backupPath = `scripts/data/backups/color-family-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(backupPath, JSON.stringify(changes, null, 1));
  console.log(`\nBackup written to ${backupPath}`);

  const written = await writeFamilies(changes.map((c) => ({ id: c.id, family: c.next })));
  console.log(`Updated ${written} of ${changes.length} rows.`);
  if (written !== changes.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
