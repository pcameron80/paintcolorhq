import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { isColorIndexable } from "../src/lib/indexing";
dotenv.config({ path: ".env.local", quiet: true });
async function main() {
  const snapshot = JSON.parse(await readFile("src/generated/sitemap.json", "utf8"));
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  // Independent reverse-order pass validates the generated URL set against the
  // catalog, rather than comparing the generator with its own output.
  const expected = new Set<string>();
  let before: string | undefined;
  let total = 0;
  while (true) {
    let q = client.from("colors").select("id,slug,name,color_number,lrv,undertone,color_family,brand:brand_id(slug)").order("id", { ascending: false }).limit(1000);
    if (before) q = q.lt("id", before);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    total += data.length;
    for (const c of data) {
      const brand = c.brand as unknown as { slug: string };
      if (brand && isColorIndexable(c)) expected.add(`${brand.slug}/${c.slug}`);
    }
    before = data[data.length - 1].id;
  }
  const urls = snapshot.colors.map((c: {brandSlug:string;colorSlug:string}) => `${c.brandSlug}/${c.colorSlug}`);
  const actual = new Set<string>(urls);
  const missing = [...expected].filter(x => !actual.has(x));
  const extra = [...actual].filter(x => !expected.has(x));
  const duplicates = urls.length - actual.size;
  console.log(JSON.stringify({ catalogRows: total, eligible: expected.size, sitemap: actual.size, excluded: total - expected.size, duplicates, missing: missing.length, extra: extra.length }));
  if (duplicates || missing.length || extra.length) throw new Error("Sitemap/catalog mismatch");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
