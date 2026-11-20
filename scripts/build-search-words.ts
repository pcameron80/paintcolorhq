/**
 * Builds src/generated/search-words.json: every word (3+ letters) in the
 * catalog's color names, with the number of names it appears in. Site search
 * corrects misspelled words against this list (src/lib/search-spelling.ts).
 * Runs before dev and build, beside build-sitemap-data.ts.
 */
import dotenv from "dotenv";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { nameWords } from "../src/lib/search-spelling";

dotenv.config({ path: resolve(process.cwd(), ".env.local"), quiet: true });

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Supabase environment required to build search words");
  const { supabase } = await import("../src/lib/supabase");
  const counts = new Map<string, number>();
  let names = 0;
  let after: string | undefined;
  while (true) {
    let query = supabase.from("colors").select("id, name").order("id", { ascending: true }).limit(1000);
    if (after) query = query.gt("id", after);
    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;
    for (const { name } of data) {
      names++;
      for (const w of new Set(nameWords(name ?? ""))) counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    const next = data[data.length - 1].id as string;
    if (next === after) throw new Error("Color pagination did not advance");
    after = next;
  }
  if (names < 1000) throw new Error(`Refusing a search word list from only ${names} color names`);
  const words = Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
  await mkdir("src/generated", { recursive: true });
  await writeFile("src/generated/search-words.json.tmp", JSON.stringify(words));
  await rename("src/generated/search-words.json.tmp", "src/generated/search-words.json");
  console.log(`search-words.json: ${counts.size} words from ${names} color names`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
