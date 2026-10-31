/**
 * Re-runs refineColorFamily (scripts/lib/color-math.ts) over every color and
 * fixes stored families it disagrees with. Written for the 2026-10-05 family
 * audit (creamy whites under yellow/orange, purples under blue, saturated
 * colors under neutral) and extended for the 2026-10-24 rewrite (MP-27:
 * near-blacks under gray, tans under orange, muted greens under gray) and
 * the 2026-11 data audit (colored grays/neutrals, light reds to pink, teal
 * greens out of blue, a peach carve-out from the tan rule, and the sourced
 * FAMILY_OVERRIDES via familyForRow). See docs/data-audit-2026-11.md.
 *
 *   npx tsx scripts/refine-color-families.ts            # dry run, prints the report
 *   npx tsx scripts/refine-color-families.ts --apply    # writes, saves a backup first
 *   npx tsx scripts/refine-color-families.ts --revert <backup.json>
 *
 * Filters (dry run and --apply alike). Keys are "brandSlug/colorSlug":
 *   --exclude-keys a/b,c/d   never touch these rows (or --exclude-keys @file.txt, one per line)
 *   --only-keys a/b,c/d      touch only these rows (same @file form)
 *   --skip-family beige      hold back every move into or out of this family (repeatable)
 *   --include-head           also move the HEAD_COLOR_PUSH colors (excluded by default:
 *                            their pages are frozen until 2026-11-27)
 *   --list <n>               print up to n example rows per from -> to cell (default 3)
 *
 * Family feeds titles, meta descriptions and /colors/family hubs, so a write
 * changes live pages once ISR revalidates. Redeploy afterwards to refresh.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { familyForRow, hexToRgb } from "./lib/color-math";
import { HEAD_COLOR_PUSH } from "../src/lib/head-colors";

dotenv.config({ path: ".env.local" });

interface Row { id: string; name: string; slug: string; hex: string; color_family: string | null; brand: { slug: string } }
interface Change { id: string; key: string; brand: string; name: string; hex: string; old: string; next: string }

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function fetchAll(): Promise<Row[]> {
  const supabase = getSupabase();
  const rows: Row[] = [];
  let last = "";
  // Keyset pagination: unordered range pagination drops and repeats rows.
  for (;;) {
    let q = supabase.from("colors").select("id, name, slug, hex, color_family, brand:brand_id (slug)").order("id").limit(1000);
    if (last) q = q.gt("id", last);
    const { data, error } = await q;
    if (error) throw error;
    if (!data.length) break;
    rows.push(...(data as unknown as Row[]));
    last = data[data.length - 1].id;
  }
  return rows;
}

// Each write only lands if the row still holds the family that was read, so an
// importer or another script editing the row in between is never overwritten.
async function writeFamilies(updates: { id: string; family: string; expected: string }[]): Promise<number> {
  const supabase = getSupabase();
  let written = 0;
  const stale: string[] = [];
  for (const u of updates) {
    const { data, error } = await supabase
      .from("colors")
      .update({ color_family: u.family })
      .eq("id", u.id)
      .eq("color_family", u.expected)
      .select("id");
    if (error) throw error;
    if (data?.length) written += data.length;
    else stale.push(u.id);
  }
  if (stale.length) console.warn(`Skipped ${stale.length} rows that changed since they were read: ${stale.slice(0, 10).join(", ")}${stale.length > 10 ? " ..." : ""}`);
  return written;
}

// Family is in the color-page title and meta of the title test's control arm
// (src/lib/title-test.ts), which reads on 2026-11-03. Writing earlier would
// change titles in one arm only.
const APPLY_NOT_BEFORE = "2026-11-04";

function argValues(args: string[], flag: string): string[] {
  const out: string[] = [];
  args.forEach((a, i) => {
    if (a === flag && args[i + 1]) out.push(args[i + 1]);
  });
  return out;
}

function parseKeys(values: string[]): Set<string> | null {
  if (!values.length) return null;
  const keys = new Set<string>();
  for (const v of values) {
    const raw = v.startsWith("@") ? readFileSync(v.slice(1), "utf8").split(/[\n,]/) : v.split(",");
    for (const k of raw) if (k.trim()) keys.add(k.trim());
  }
  return keys;
}

function printMatrix(changes: Change[]) {
  const from = [...new Set(changes.map((c) => c.old))].sort();
  const to = [...new Set(changes.map((c) => c.next))].sort();
  const cell = new Map<string, number>();
  for (const c of changes) cell.set(`${c.old}|${c.next}`, (cell.get(`${c.old}|${c.next}`) ?? 0) + 1);
  const w = Math.max(9, ...from.map((f) => f.length)) + 1;
  const cw = Math.max(6, ...to.map((t) => t.length)) + 1;
  console.log("\nFrom (rows) -> to (columns):");
  console.log("".padEnd(w) + to.map((t) => t.padStart(cw)).join("") + "total".padStart(cw));
  for (const f of from) {
    const n = to.map((t) => cell.get(`${f}|${t}`) ?? 0);
    console.log(f.padEnd(w) + n.map((v) => (v ? String(v) : ".").padStart(cw)).join("") + String(n.reduce((a, b) => a + b, 0)).padStart(cw));
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === "--revert") {
    const backup: Change[] = JSON.parse(readFileSync(args[1], "utf8"));
    const written = await writeFamilies(backup.map((c) => ({ id: c.id, family: c.old, expected: c.next })));
    console.log(`Reverted ${written} of ${backup.length} rows.`);
    return;
  }

  const onlyKeys = parseKeys(argValues(args, "--only-keys"));
  const excludeKeys = parseKeys(argValues(args, "--exclude-keys")) ?? new Set<string>();
  const includeHead = args.includes("--include-head");
  if (!includeHead) for (const k of HEAD_COLOR_PUSH) excludeKeys.add(k);
  const skipFamilies = new Set(argValues(args, "--skip-family"));
  const listN = Number(argValues(args, "--list")[0] ?? 3);
  const head = new Set(HEAD_COLOR_PUSH);

  const rows = await fetchAll();
  const all: Change[] = [];
  const headRows: { key: string; old: string; next: string }[] = [];
  const before = new Map<string, number>();
  for (const r of rows) {
    if (r.color_family) before.set(r.color_family, (before.get(r.color_family) ?? 0) + 1);
    const rgb = hexToRgb(r.hex);
    if (!rgb || !r.color_family) continue;
    const key = `${r.brand.slug}/${r.slug}`;
    const next = familyForRow(key, r.color_family, rgb.r, rgb.g, rgb.b);
    if (head.has(key)) headRows.push({ key, old: r.color_family, next });
    if (next !== r.color_family) all.push({ id: r.id, key, brand: r.brand.slug, name: r.name, hex: r.hex, old: r.color_family, next });
  }

  const held = { excluded: 0, notOnly: 0, family: 0 };
  const changes = all.filter((c) => {
    if (excludeKeys.has(c.key)) { held.excluded++; return false; }
    if (onlyKeys && !onlyKeys.has(c.key)) { held.notOnly++; return false; }
    if (skipFamilies.has(c.old) || skipFamilies.has(c.next)) { held.family++; return false; }
    return true;
  });

  console.log(`Scanned ${rows.length} colors; the classifier disagrees with ${all.length}; ${changes.length} would change.`);
  console.log(`Held back: ${held.excluded} excluded keys${includeHead ? "" : " (head colors excluded by default)"}, ${held.notOnly} outside --only-keys, ${held.family} by --skip-family.`);

  printMatrix(changes);

  const after = new Map(before);
  for (const c of changes) {
    after.set(c.old, (after.get(c.old) ?? 0) - 1);
    after.set(c.next, (after.get(c.next) ?? 0) + 1);
  }
  console.log("\nFamily totals, before -> after:");
  for (const f of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const b = before.get(f) ?? 0;
    const a = after.get(f) ?? 0;
    console.log(`  ${f.padEnd(10)} ${String(b).padStart(6)} -> ${String(a).padStart(6)}  (${a - b >= 0 ? "+" : ""}${a - b})`);
  }

  console.log(`\nHead colors (${includeHead ? "INCLUDED" : "excluded"}):`);
  for (const h of HEAD_COLOR_PUSH) {
    const r = headRows.find((x) => x.key === h);
    if (!r) console.log(`  ${h}: not found`);
    else console.log(`  ${h}: ${r.old}${r.next !== r.old ? ` -> ${r.next} (classifier)${includeHead ? "" : ", held"}` : ", unchanged"}`);
  }

  const beigeIn = changes.filter((c) => c.next === "beige");
  const beigeOut = changes.filter((c) => c.old === "beige");
  console.log(`\nBeige in: ${beigeIn.length}, beige out: ${beigeOut.length}`);
  for (const c of beigeOut) console.log(`  out ${c.key} ${c.hex} -> ${c.next}`);
  for (const c of beigeIn.slice(0, 25)) console.log(`  in  ${c.key} ${c.hex} from ${c.old}`);
  if (beigeIn.length > 25) console.log(`  ... ${beigeIn.length - 25} more in`);

  if (listN > 0) {
    console.log(`\nExamples (up to ${listN} per cell):`);
    const seen = new Map<string, number>();
    for (const c of changes) {
      const k = `${c.old} -> ${c.next}`;
      const n = seen.get(k) ?? 0;
      if (n >= listN) continue;
      seen.set(k, n + 1);
      console.log(`  ${k.padEnd(22)} ${c.key} ${c.hex}`);
    }
  }

  if (!args.includes("--apply")) {
    console.log("\nDry run. Re-run with --apply to write.");
    return;
  }

  if (new Date().toISOString().slice(0, 10) < APPLY_NOT_BEFORE) {
    console.error(`Refusing --apply before ${APPLY_NOT_BEFORE}: the color-page title test reads 2026-11-03.`);
    process.exit(1);
  }

  mkdirSync("scripts/data/backups", { recursive: true });
  const backupPath = `scripts/data/backups/color-family-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(backupPath, JSON.stringify(changes, null, 1));
  console.log(`\nBackup written to ${backupPath}`);

  const written = await writeFamilies(changes.map((c) => ({ id: c.id, family: c.next, expected: c.old })));
  console.log(`Updated ${written} of ${changes.length} rows.`);
  if (written !== changes.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
