/**
 * Count the rank-1 matches whose LRVs disagree with their closeness label.
 * Read-only: SELECTs only, nothing is written.
 *
 * The match page and /compare add a note when CIEDE2000 with L* taken from the
 * two LRVs lands in a worse closeness tier than the swatch score behind the
 * label (src/lib/lrv-gap.ts). This script runs that same test over every
 * rank-1 row in cross_brand_matches, so an LRV change can be sized before or
 * after it lands. Large jumps (Nearly identical by swatch, Visible difference
 * by LRV) usually mean a bad LRV, not a real lightness gap: review those rows
 * before keeping an LRV write.
 *
 * --lrv-updates=<file> reads an array of { id, from?, to } (the shape of the
 * apply-published-lrv backup) and compares two states: LRVs as `from` (or as
 * stored, when an entry has no `from`) against LRVs as `to`. Run it on an
 * apply's backup file right after the apply to see what that apply added, and
 * revert the apply if it added large jumps.
 *
 * Usage:
 *   npx tsx scripts/check-lrv-pairs.ts
 *   npx tsx scripts/check-lrv-pairs.ts --lrv-updates=scripts/data/backups/published-lrv-<ts>.json
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { closenessTier, type ClosenessTier } from "../src/lib/closeness";
import { lrvLightnessGap } from "../src/lib/lrv-gap";

dotenv.config({ path: path.resolve(__dirname, "../.env.local"), quiet: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

const updatesArg = process.argv.find((a) => a.startsWith("--lrv-updates="))?.slice("--lrv-updates=".length);

interface ColorRow {
  id: string;
  brand_id: string;
  slug: string;
  name: string;
  color_number: string | null;
  lrv: number | null;
  lab_l: number | null;
  lab_a: number | null;
  lab_b_val: number | null;
}
interface MatchRow {
  source_color_id: string;
  match_color_id: string;
  delta_e_score: number;
}
interface LrvUpdate {
  id: string;
  from?: number | null;
  to: number;
}

async function loadColors(): Promise<ColorRow[]> {
  const rows: ColorRow[] = [];
  let after = "00000000-0000-0000-0000-000000000000";
  for (;;) {
    const { data, error } = await supabase
      .from("colors")
      .select("id, brand_id, slug, name, color_number, lrv, lab_l, lab_a, lab_b_val")
      .gt("id", after)
      .order("id")
      .limit(1000);
    if (error) throw error;
    rows.push(...(data as ColorRow[]));
    if (!data || data.length < 1000) return rows;
    after = data[data.length - 1].id;
  }
}

async function loadRank1(ids: string[]): Promise<MatchRow[]> {
  const rows: MatchRow[] = [];
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += 80) batches.push(ids.slice(i, i + 80));
  let next = 0;
  async function worker() {
    while (next < batches.length) {
      const batch = batches[next++];
      const { data, error } = await supabase
        .from("cross_brand_matches")
        .select("source_color_id, match_color_id, delta_e_score")
        .in("source_color_id", batch)
        .eq("rank", 1)
        .limit(5000);
      if (error) throw error;
      rows.push(...(data as MatchRow[]));
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  return rows;
}

type Transition = `${ClosenessTier} -> ${ClosenessTier}`;

interface Flag {
  source: ColorRow;
  match: ColorRow;
  shown: number;
  lrvDeltaE: number;
  transition: Transition;
}

function evaluate(matches: MatchRow[], colors: Map<string, ColorRow>, lrvs: Map<string, number | null>) {
  let bothLrv = 0;
  const flags: Flag[] = [];
  for (const m of matches) {
    const source = colors.get(m.source_color_id);
    const match = colors.get(m.match_color_id);
    if (!source || !match || source.lab_a == null || source.lab_b_val == null || match.lab_a == null || match.lab_b_val == null) continue;
    const lrvA = lrvs.get(source.id) ?? null;
    const lrvB = lrvs.get(match.id) ?? null;
    if (lrvA == null || lrvB == null) continue;
    bothLrv++;
    const shown = Number(m.delta_e_score);
    const gap = lrvLightnessGap(
      { lab: { L: Number(source.lab_l), a: Number(source.lab_a), b: Number(source.lab_b_val) }, lrv: lrvA },
      { lab: { L: Number(match.lab_l), a: Number(match.lab_a), b: Number(match.lab_b_val) }, lrv: lrvB },
      shown,
    );
    if (gap) flags.push({ source, match, shown, lrvDeltaE: gap.deltaE, transition: `${closenessTier(shown)} -> ${closenessTier(gap.deltaE)}` });
  }
  return { bothLrv, flags };
}

function key(f: Flag) {
  return `${f.source.id}>${f.match.id}`;
}

async function main() {
  const [brandsRes, colorRows] = await Promise.all([supabase.from("brands").select("id, slug"), loadColors()]);
  if (brandsRes.error) throw brandsRes.error;
  const brandSlug = new Map((brandsRes.data ?? []).map((b) => [b.id as string, b.slug as string]));
  const colors = new Map(colorRows.map((c) => [c.id, c]));
  console.log(`Colors: ${colorRows.length}`);
  const matches = await loadRank1(colorRows.map((c) => c.id));
  console.log(`Rank-1 matches: ${matches.length}`);

  const label = (c: ColorRow) => `${brandSlug.get(c.brand_id)}/${c.slug}`;
  const stored = new Map(colorRows.map((c) => [c.id, c.lrv == null ? null : Number(c.lrv)]));

  function report(title: string, flags: Flag[], bothLrv: number, lrvs: Map<string, number | null>) {
    console.log(`\n${title}`);
    console.log(`  Rank-1 matches with an LRV on both sides: ${bothLrv}`);
    console.log(`  Note shown (LRV tier worse than swatch tier): ${flags.length} (${bothLrv ? ((100 * flags.length) / bothLrv).toFixed(1) : "0"}%)`);
    const byTransition = new Map<string, number>();
    const byPair = new Map<string, number>();
    for (const f of flags) {
      byTransition.set(f.transition, (byTransition.get(f.transition) ?? 0) + 1);
      const pair = [brandSlug.get(f.source.brand_id), brandSlug.get(f.match.brand_id)].sort().join(" / ");
      byPair.set(pair, (byPair.get(pair) ?? 0) + 1);
    }
    for (const [t, n] of [...byTransition].sort((a, b) => b[1] - a[1])) console.log(`    ${t}: ${n}`);
    console.log("  By brand pair (top 15):");
    for (const [p, n] of [...byPair].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`    ${p}: ${n}`);
    const jumps = flags.filter((f) => f.transition === "nearly-identical -> visible-difference");
    console.log(`  Nearly identical by swatch, Visible difference by LRV (check these LRVs): ${jumps.length}`);
    for (const f of jumps.sort((a, b) => b.lrvDeltaE - a.lrvDeltaE).slice(0, 25)) {
      const lrvA = lrvs.get(f.source.id);
      const lrvB = lrvs.get(f.match.id);
      console.log(`    ${label(f.source)} (LRV ${lrvA}) -> ${label(f.match)} (LRV ${lrvB}): swatch ${f.shown.toFixed(2)}, LRV ${f.lrvDeltaE.toFixed(2)}`);
    }
  }

  if (!updatesArg) {
    const { bothLrv, flags } = evaluate(matches, colors, stored);
    report("Current LRVs", flags, bothLrv, stored);
    const frozen = JSON.parse(fs.readFileSync(path.resolve(__dirname, "data/frozen-match-sources.json"), "utf8")) as { id: string; key: string }[];
    const frozenIds = new Set(frozen.map((f) => f.id));
    const head = flags.filter((f) => frozenIds.has(f.source.id));
    console.log(`\nFrozen head-color sources with a note: ${head.length}`);
    for (const f of head) console.log(`  ${label(f.source)} -> ${label(f.match)}: ${f.transition}`);
    return;
  }

  const updates = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), updatesArg), "utf8")) as LrvUpdate[];
  const before = new Map(stored);
  const after = new Map(stored);
  for (const u of updates) {
    if (u.from !== undefined) before.set(u.id, u.from);
    after.set(u.id, u.to);
  }
  console.log(`LRV updates in ${updatesArg}: ${updates.length}`);
  const b = evaluate(matches, colors, before);
  const a = evaluate(matches, colors, after);
  report("Before the updates", b.flags, b.bothLrv, before);
  report("After the updates", a.flags, a.bothLrv, after);
  const had = new Set(b.flags.map(key));
  const added = a.flags.filter((f) => !had.has(key(f)));
  const gone = b.flags.length - (a.flags.length - added.length);
  report("Notes the updates add", added, a.bothLrv, after);
  console.log(`\nNotes the updates remove: ${gone}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
