/**
 * Re-run the cross-brand duplication study and write src/data/duplication-study.json.
 *
 * The study feeds /paint-color-statistics and the /blog/most-duplicated-paint-color
 * figures. The July 2026 run was hand-computed and never committed, and it ran on
 * stale hexes (~3,000 Behr, ~1,100 Vista, ~500 Valspar rows corrected 2026-10-11),
 * so its originality ranking was wrong. This script is the reproducible version:
 * read-only SELECTs, no writes to the database.
 *
 * Definitions (unchanged from July):
 *   twin         a color whose rank-1 match at some other non-RAL brand has
 *                cross_brand_matches.delta_e_score < 1.0, the tightest half of the
 *                Nearly identical band. RAL is an industrial standard, so a RAL
 *                match does not count; RAL colors themselves stay in the total.
 *   originality  share of a brand's colors with no twin. RAL is left out of the
 *                ranking but not out of the denominator of the headline share.
 *   exact hex    one hex value sold by two or more brands, RAL included.
 *   whites       every color at LRV 75 or above.
 *   retired      availability = 'retired' (still mixable by code).
 *
 * The July "about 14,700 distinct colors" figure came from an ad hoc clustering
 * pass that cannot be reproduced from the stored rank-1..5 shortlist, so it is
 * not computed here and should not be quoted.
 *
 * Usage: npm run study-duplication            (writes the JSON)
 *        npm run study-duplication -- --dry   (prints it only)
 */
import "./blog/load-env.ts"; // MUST be first: populates env (a worktree falls back to the main checkout's).
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "src/data/duplication-study.json");
const PAGE = 1000;
const TWIN_MAX = 1.0;
const WHITE_MIN_LRV = 75;
const REUSED_NAME_MIN_BRANDS = 6;

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Color {
  id: string;
  brand_id: string;
  name: string;
  hex: string;
  lrv: number | null;
  lab_b_val: number | null;
  availability: "current" | "retired" | "discontinued";
}

/** Keyset pagination on the primary key: stable, and no deep OFFSET scans on the 1M-row match table. */
async function fetchAll<T extends { id: string }>(
  build: (after: string | null) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  let after: string | null = null;
  for (;;) {
    const { data, error } = await build(after);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
    after = data[data.length - 1].id;
  }
}

const pct = (n: number, d: number) => Math.round((1000 * n) / d) / 10;

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not set (looked for .env.local here and in the main checkout).");
    process.exit(2);
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb: SupabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);

  const { data: brandRows, error: brandErr } = await sb.from("brands").select("id, name, slug");
  if (brandErr) throw new Error(brandErr.message);
  const brands = (brandRows ?? []) as Brand[];
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const ral = brands.find((b) => b.slug === "ral");
  if (!ral) throw new Error("RAL brand row not found");

  const colors = await fetchAll<Color>((after) => {
    let q = sb.from("colors").select("id, brand_id, name, hex, lrv, lab_b_val, availability").order("id").limit(PAGE);
    if (after) q = q.gt("id", after);
    return q;
  });
  const colorById = new Map(colors.map((c) => [c.id, c]));
  console.log(`Loaded ${colors.length} colors across ${brands.length} brands.`);

  const twinRows = await fetchAll<{ id: string; source_color_id: string; match_color_id: string }>((after) => {
    let q = sb
      .from("cross_brand_matches")
      .select("id, source_color_id, match_color_id")
      .eq("rank", 1)
      .lt("delta_e_score", TWIN_MAX)
      .order("id")
      .limit(PAGE);
    if (after) q = q.gt("id", after);
    return q;
  });
  console.log(`Loaded ${twinRows.length} rank-1 matches in the twin band.`);

  // twinBrands: source color id -> the non-RAL brands where its rank-1 match is a twin.
  const twinBrands = new Map<string, Set<string>>();
  for (const r of twinRows) {
    const match = colorById.get(r.match_color_id);
    if (!match || match.brand_id === ral.id) continue;
    (twinBrands.get(r.source_color_id) ?? twinBrands.set(r.source_color_id, new Set()).get(r.source_color_id)!).add(match.brand_id);
  }

  // Per brand: catalog size by availability, and how many colors have a twin.
  const perBrand = brands.map((b) => {
    const own = colors.filter((c) => c.brand_id === b.id);
    const twinned = own.filter((c) => twinBrands.has(c.id)).length;
    return {
      name: b.name,
      slug: b.slug,
      total: own.length,
      current: own.filter((c) => c.availability === "current").length,
      retired: own.filter((c) => c.availability === "retired").length,
      discontinued: own.filter((c) => c.availability === "discontinued").length,
      twinned,
      uniquePct: pct(own.length - twinned, own.length),
      uniqueShare: (own.length - twinned) / own.length,
    };
  });
  perBrand.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const originality = perBrand
    .filter((b) => b.slug !== "ral")
    .sort((a, b) => b.uniqueShare - a.uniqueShare)
    .map(({ name, slug, total, uniquePct }) => ({ name, slug, total, uniquePct }));

  const totalTwinned = colors.filter((c) => twinBrands.has(c.id)).length;

  // Brand pairs: for A->B, how many A colors have a twin at B. Ranked by the two directions summed.
  const directional = new Map<string, number>();
  for (const [colorId, set] of twinBrands) {
    const src = colorById.get(colorId);
    if (!src || src.brand_id === ral.id) continue;
    for (const target of set) directional.set(`${src.brand_id}>${target}`, (directional.get(`${src.brand_id}>${target}`) ?? 0) + 1);
  }
  const nonRal = brands.filter((b) => b.id !== ral.id);
  const pairs: { a: string; b: string; aWithTwinInB: number; bWithTwinInA: number }[] = [];
  for (let i = 0; i < nonRal.length; i++)
    for (let j = i + 1; j < nonRal.length; j++) {
      const [x, y] = [nonRal[i], nonRal[j]];
      pairs.push({ a: x.name, b: y.name, aWithTwinInB: directional.get(`${x.id}>${y.id}`) ?? 0, bWithTwinInA: directional.get(`${y.id}>${x.id}`) ?? 0 });
    }
  pairs.sort((p, q) => q.aWithTwinInB + q.bWithTwinInA - (p.aWithTwinInB + p.bWithTwinInA));
  const behr = brands.find((b) => b.slug === "behr")!;
  const bm = brands.find((b) => b.slug === "benjamin-moore")!;

  // Exact hexes shared by two or more brands, RAL included.
  const byHex = new Map<string, Color[]>();
  for (const c of colors) {
    const h = c.hex.toUpperCase();
    (byHex.get(h) ?? byHex.set(h, []).get(h)!).push(c);
  }
  const sharedHex = [...byHex.values()].filter((group) => new Set(group.map((c) => c.brand_id)).size >= 2);

  // Names sold by several brands under the exact same name (case and spacing ignored).
  const byName = new Map<string, Color[]>();
  for (const c of colors) {
    const k = c.name.trim().toLowerCase();
    (byName.get(k) ?? byName.set(k, []).get(k)!).push(c);
  }
  const reusedNames = [...byName.values()]
    .map((group) => {
      const spellings = new Map<string, number>();
      for (const c of group) spellings.set(c.name.trim(), (spellings.get(c.name.trim()) ?? 0) + 1);
      const name = [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
      return { name, brands: new Set(group.map((c) => c.brand_id)).size };
    })
    .filter((n) => n.brands >= REUSED_NAME_MIN_BRANDS)
    .sort((a, b) => b.brands - a.brands || a.name.localeCompare(b.name));

  // Whites: LRV 75+, with each brand's mean LAB b* (warmth).
  const whites = colors.filter((c) => c.lrv != null && Number(c.lrv) >= WHITE_MIN_LRV);
  const whitesByBrand = brands
    .map((b) => {
      const own = whites.filter((c) => c.brand_id === b.id && c.lab_b_val != null);
      const meanB = own.reduce((s, c) => s + Number(c.lab_b_val), 0) / (own.length || 1);
      return { name: b.name, slug: b.slug, count: whites.filter((c) => c.brand_id === b.id).length, meanB: Math.round(meanB * 10) / 10 };
    })
    .filter((w) => w.count > 0)
    .sort((a, b) => a.meanB - b.meanB);

  const count = (state: Color["availability"]) => colors.filter((c) => c.availability === state).length;

  const study = {
    runDate: new Date().toISOString().slice(0, 10),
    method: {
      twin: "Rank-1 cross-brand match at another non-RAL brand with CIEDE2000 delta_e_score < 1.0 (the tightest half of the Nearly identical band).",
      originality: "Share of a brand's colors with no twin. RAL is excluded from the ranking.",
      exactHex: "One hex value sold by two or more brands, RAL included.",
      whites: `Colors at LRV ${WHITE_MIN_LRV} or above; meanB is the mean LAB b* (higher is warmer).`,
      retired: "availability = 'retired': retired by the brand but still mixable by code.",
    },
    totals: { colors: colors.length, brands: brands.length, current: count("current"), retired: count("retired"), discontinued: count("discontinued") },
    twins: {
      twinned: totalTwinned,
      twinnedPct: pct(totalTwinned, colors.length),
      noTwin: colors.length - totalTwinned,
      noTwinPct: pct(colors.length - totalTwinned, colors.length),
    },
    exactHex: {
      hexes: sharedHex.length,
      colors: sharedHex.reduce((s, g) => s + g.length, 0),
      maxBrands: Math.max(...sharedHex.map((g) => new Set(g.map((c) => c.brand_id)).size)),
    },
    brands: perBrand.map((b) => ({
      name: b.name,
      slug: b.slug,
      total: b.total,
      current: b.current,
      retired: b.retired,
      discontinued: b.discontinued,
      twinned: b.twinned,
      uniquePct: b.uniquePct,
    })),
    originality,
    behrBenjaminMoore: {
      behrWithBenjaminMooreTwin: directional.get(`${behr.id}>${bm.id}`) ?? 0,
      benjaminMooreWithBehrTwin: directional.get(`${bm.id}>${behr.id}`) ?? 0,
    },
    topPairs: pairs.slice(0, 5),
    reusedNames,
    whites: { minLrv: WHITE_MIN_LRV, count: whites.length, byBrand: whitesByBrand },
  };

  // Sanity: every row must belong to a known brand.
  if (colors.some((c) => !brandById.has(c.brand_id))) throw new Error("color with unknown brand_id");

  const json = JSON.stringify(study, null, 2) + "\n";
  if (process.argv.includes("--dry")) {
    process.stdout.write(json);
    return;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, json);
  console.log(`Wrote ${path.relative(root, OUT)}: ${study.twins.twinned}/${study.totals.colors} twinned (${study.twins.twinnedPct}%).`);
  console.log(`Originality: ${originality.map((o) => `${o.name} ${o.uniquePct}`).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
