/**
 * Back up colors.description_extended before the column is dropped
 * (supabase/migrations/011_drop_description_extended.sql).
 *
 * Keyset-paginates on id (1000 rows/page) and writes every row where
 * description_extended is not null as {id, slug, brand_id, description_extended}
 * to an absolute path in the MAIN checkout so it survives worktree cleanup.
 *
 * Read-only. Usage: npx tsx scripts/backup-description-extended.ts
 */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const MAIN_CHECKOUT = "/Users/philipcameron/Documents/GitHub/projects/paintcolorhq";
dotenv.config({ path: path.join(MAIN_CHECKOUT, ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) } },
);

const PAGE = 1000;

interface Row {
  id: string;
  slug: string;
  brand_id: string;
  description_extended: string;
}

async function main() {
  const rows: Row[] = [];
  let lastId: string | null = null;
  for (;;) {
    let q = supabase
      .from("colors")
      .select("id, slug, brand_id, description_extended")
      .not("description_extended", "is", null)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (lastId) q = q.gt("id", lastId);
    const { data, error } = await q;
    if (error) throw new Error(`Page after ${lastId ?? "start"} failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as Row[]));
    lastId = data[data.length - 1].id;
    if (data.length < PAGE) break;
  }

  const { count, error: countErr } = await supabase
    .from("colors")
    .select("id", { count: "exact", head: true })
    .not("description_extended", "is", null);
  if (countErr) throw new Error(`Count failed: ${countErr.message}`);

  const dir = path.join(MAIN_CHECKOUT, "scripts", "backups");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `description-extended-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(rows));

  console.log(`Backed up ${rows.length} rows to ${file}`);
  console.log(`Count query (description_extended not null): ${count}`);
  if (count !== rows.length) {
    console.error("ROW COUNT MISMATCH");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
