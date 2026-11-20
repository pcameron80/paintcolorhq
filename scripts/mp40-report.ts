// MP-40 offline report: runs the real title / meta / lede / FAQ / indexing
// code over catalog rows read from Supabase (SELECT only, anon key) and prints
// the acceptance numbers. No writes, no network beyond the DB.
//
//   npx tsx scripts/mp40-report.ts [--head-out file.json] [--old-indexing path]
//
// --head-out writes the 13 head-color strings (title, description, lede, FAQ,
// pin) so a run on another checkout can be diffed against this one. See the
// MP-40 PR for how it was used against origin/main.
import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
dotenv.config({ path: process.env.MP40_ENV ?? ".env.local", quiet: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const arg = (name: string) => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1]; };

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { getColorBySlug, getCrossBrandMatches } = await import("../src/lib/queries");
  const { generateColorLede, nearestMatchesPerBrand } = await import("../src/lib/color-description");
  const { buildColorFaq, buildPinDescription, colorMetadataText, pageUndertone } = await import("../src/lib/color-page-copy");
  const { isColorIndexable, extractVariantSuffix } = await import("../src/lib/indexing");
  const { withManufacturerFamily } = await import("../src/lib/manufacturer-family");
  const { HEAD_COLOR_PUSH } = await import("../src/lib/head-colors");
  const { REVIEWED_COLOR_PAGES } = await import("../src/lib/color-review");
  const { titleArm } = await import("../src/lib/title-test");
  const { displayUndertone } = await import("../src/lib/undertone-display");

  const line = (s = "") => console.log(s);
  const h = (s: string) => { line(); line(`== ${s}`); };

  // ---- Head colors: strings for a before/after diff ----
  const headOut: Record<string, unknown> = {};
  for (const key of HEAD_COLOR_PUSH) {
    const [brandSlug, colorSlug] = key.split("/");
    const color = (await getColorBySlug(brandSlug, colorSlug))!;
    const matches = await getCrossBrandMatches(color.id);
    const { title, description } = colorMetadataText({ color, brandSlug, colorSlug, matches, isHead: true });
    headOut[key] = {
      title, description,
      lede: generateColorLede(color, matches, { legacy: true }),
      faqItems: buildColorFaq(color, matches, true),
      pinDescription: buildPinDescription(color, true),
      undertone: pageUndertone(color, true), family: color.color_family,
      colorNum: color.color_number ? ` ${color.color_number}` : "",
    };
  }
  const headFile = arg("--head-out");
  if (headFile) writeFileSync(headFile, JSON.stringify(headOut, null, 2));

  // ---- Whole catalog ----
  const all: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("colors")
      .select("id,slug,name,color_number,alternate_numbers,hex,lrv,lab_a,lab_b_val,color_family,undertone,brand:brand_id(slug,name)")
      .order("id").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
  }
  h(`Catalog: ${all.length} colors`);

  // ---- Indexing before / after ----
  const oldPath = arg("--old-indexing");
  if (oldPath) {
    const old = await import(oldPath);
    const key = (c: Row) => `${c.brand.slug}/${c.slug}`;
    const before = new Set(all.filter((c) => old.isColorIndexable(c)).map(key));
    const after = new Set(all.filter((c) => isColorIndexable(c)).map(key));
    const added = [...after].filter((k) => !before.has(k));
    const removed = [...before].filter((k) => !after.has(k));
    h("Indexable colors (sitemap eligibility, same inputs the builder uses)");
    line(`before ${before.size}, after ${after.size}, added ${added.length}, removed ${removed.length}`);
    for (const k of added) line(`  + ${k}`);
    for (const k of removed) line(`  - ${k}`);
    const variantsBefore = all.filter((c) => old.isVariantSlug(c.slug, c.color_number)).map(key);
    const variantsAfter = all.filter((c) => extractVariantSuffix(c.slug, c.color_number) !== "").map(key);
    line(`variant slugs: before ${variantsBefore.length}, after ${variantsAfter.length}`);
    line(`  newly not-variant: ${variantsBefore.filter((k) => !variantsAfter.includes(k)).join(", ")}`);
    line(`  newly variant: ${variantsAfter.filter((k) => !variantsBefore.includes(k)).join(", ") || "none"}`);
    const behr22 = all.filter((c) => c.brand.slug === "behr" && c.slug.endsWith("-2-2"));
    line(`Behr -2-2 slugs: ${behr22.length}, indexable after: ${behr22.filter((c) => isColorIndexable(c)).length}, indexable before: ${behr22.filter((c) => old.isColorIndexable(c)).length}`);
    const vistaCasa = all.find((c) => c.slug === "casa-blanca-c-7")!;
    line(`casa-blanca-c-7: indexable ${isColorIndexable(vistaCasa)}, variant suffix "${extractVariantSuffix(vistaCasa.slug, vistaCasa.color_number)}"`);
  }

  // ---- Sample ----
  const hash = (s: string) => { let x = 2166136261; for (const ch of s) { x ^= ch.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; } return x; };
  const nonHead = all.filter((c) => !HEAD_COLOR_PUSH.includes(`${c.brand.slug}/${c.slug}`));
  const sample = [...nonHead].sort((a, b) => hash(`mp40${a.id}`) - hash(`mp40${b.id}`)).slice(0, 200);
  const band = (lrv: number | null) => lrv == null ? "none" : lrv >= 70 ? "70+" : lrv >= 50 ? "50-70" : lrv >= 25 ? "25-50" : "<25";
  const perBand = new Map<string, Row[]>();
  for (const c of sample) { const b = band(c.lrv == null ? null : Number(c.lrv)); perBand.set(b, [...(perBand.get(b) ?? []), c]); }
  const bandPages = ["70+", "50-70", "25-50", "<25"].flatMap((b) => (perBand.get(b) ?? []).slice(0, 3));
  const named = ["shakespeare-tan-228", "ultra-pure-white-1850-1850", "casa-blanca-c-7", "zinc-yellow-1018", "gypsum-1006-1", "repose-gray-7015", "peacock-plume-20", "westhaven-9675", "merlot-2704", "hague-blue-30"]
    .map((slug) => all.find((c) => c.slug === slug)).filter(Boolean) as Row[];

  interface Out { c: Row; title: string; description: string; lede: string; faq: Array<{ question: string; answer: string }>; pin: string; perBrandCount: number; harmony: string[] }
  const outs = new Map<string, Out>();
  async function render(c: Row): Promise<Out> {
    const k = `${c.brand.slug}/${c.slug}`;
    if (outs.has(k)) return outs.get(k)!;
    const full = withManufacturerFamily((await getColorBySlug(c.brand.slug, c.slug))!, c.brand.slug, c.slug);
    const matches = await getCrossBrandMatches(full.id);
    const meta = colorMetadataText({ color: full, brandSlug: c.brand.slug, colorSlug: c.slug, matches, isHead: false });
    const o: Out = {
      c: full as never,
      title: typeof meta.title === "string" ? meta.title : meta.title.absolute,
      description: meta.description,
      lede: generateColorLede(full, matches),
      faq: buildColorFaq(full, matches, false),
      pin: buildPinDescription(full, false),
      perBrandCount: nearestMatchesPerBrand(matches).length,
      harmony: [],
    };
    outs.set(k, o);
    return o;
  }
  const todo = [...sample, ...bandPages, ...named];
  for (const c of todo) await render(c);
  h(`Rendered ${outs.size} non-head pages`);

  const sampleOuts = sample.map((c) => outs.get(`${c.brand.slug}/${c.slug}`)!);
  const over = sampleOuts.filter((o) => o.title.length > 60);
  const reviewedInSample = sample.filter((c) => REVIEWED_COLOR_PAGES[`${c.brand.slug}/${c.slug}`]).length;
  h("A. Titles");
  line(`200-sample titles over 60 characters: ${over.length} (max ${Math.max(...sampleOuts.map((o) => o.title.length))}, median ${[...sampleOuts].map((o) => o.title.length).sort((a, b) => a - b)[100]}); reviewed pages in sample: ${reviewedInSample}`);
  const shape = (re: RegExp) => sampleOuts.filter((o) => re.test(o.title)).length;
  line(`title shapes in the 200: "Closest A & B Matches" ${shape(/Closest .* & .* Matches$/)}, "A & B Matches" ${shape(/: [^:]* & [^:]* Matches$/) - shape(/Closest .* & .* Matches$/)}, "Closest A Match" ${shape(/Closest [^&]* Match$/)}, "A Match" ${shape(/: (?!Closest)[^&:]* Match$/)}, no match clause ${sampleOuts.filter((o) => !/Match(es)?$/.test(o.title)).length}`);
  const ppg = sampleOuts.filter((o) => o.c.brand.slug === "ppg" && o.c.color_number && /^\d{4}-\d+$/.test(o.c.color_number));
  line(`PPG with a code like 1001-5 in sample: ${ppg.length}, showing "PPG" prefix: ${ppg.filter((o) => o.title.includes(`PPG${o.c.color_number}`)).length}`);
  for (const o of ppg.slice(0, 2)) line(`  ${o.title}`);
  const dupCode = [...outs.values()].filter((o) => /\b(\S+) \1\b/i.test(o.title) && o.c.color_number && o.title.includes(`${o.c.color_number} ${o.c.color_number}`));
  line(`titles that repeat the code: ${dupCode.length}`);
  const ultra = outs.get("behr/ultra-pure-white-1850-1850");
  line(`Ultra Pure White 1850: "${ultra?.title}" | lede starts "${ultra?.lede.slice(0, 60)}"`);

  const everything = (o: Out) => [o.title, o.description, o.lede, o.pin, ...o.faq.flatMap((f) => [f.question, f.answer])];
  h("B. Generated text");
  const texts = [...outs.values()];
  const bad49 = texts.filter((o) => /49 more equivalents|more equivalents/.test(everything(o).join(" ")));
  line(`'more equivalents' anywhere: ${bad49.length}`);
  const bad10 = texts.filter((o) => {
    const m = o.description.match(/across (.+?), and (\d+) more\./);
    return m ? Number(m[2]) !== o.perBrandCount - m[1].split(", ").length : false;
  });
  line(`metas saying 'and 10 more': ${texts.filter((o) => /and 10 more/.test(o.description)).length}; 'and N more' that disagrees with the per-brand count: ${bad10.length}`);
  // The shipped meta is the title-test winner; generateMetaDescription is its
  // fallback (reviewed pages, or only Colorhouse matching). Check its "and N
  // more" on every rendered page too, since that is where the false "10" lived.
  const { generateMetaDescription } = await import("../src/lib/color-description");
  let fallbackChecked = 0, fallbackBad = 0, fallbackWithMore = 0;
  const fallbackDist = new Map<string, number>();
  for (const [k, o] of outs) {
    const [bs, cs] = k.split("/");
    const full = (await getColorBySlug(bs, cs))!;
    const per = nearestMatchesPerBrand(await getCrossBrandMatches(full.id));
    const d = generateMetaDescription(withManufacturerFamily(full, bs, cs), per);
    fallbackChecked++;
    const m = d.match(/across (.+?), and (\d+) more\./);
    if (m) { fallbackWithMore++; fallbackDist.set(m[2], (fallbackDist.get(m[2]) ?? 0) + 1); }
    if (m && Number(m[2]) !== o.perBrandCount - m[1].split(", ").length) fallbackBad++;
    if (/and 10 more|\u2014/.test(d)) fallbackBad++;
  }
  line(`generateMetaDescription on all ${fallbackChecked} rendered pages: ${fallbackWithMore} have 'and N more', ${fallbackBad} wrong or with an em dash; N values ${[...fallbackDist.entries()].sort().map(([n, v]) => `${n}:${v}`).join(" ")}`);
  const dist = new Map<string, number>();
  for (const o of texts) { const m = o.description.match(/and (\d+) more/); const k = m ? m[1] : "none"; dist.set(k, (dist.get(k) ?? 0) + 1); }
  line(`'and N more' values: ${[...dist.entries()].sort().map(([k, v]) => `${k}:${v}`).join(" ")}`);
  const dash = texts.filter((o) => everything(o).some((t) => t.includes("—") || t.includes("–")));
  line(`em/en dashes in title, meta, lede, pin or FAQ (FAQ text feeds the FAQPage JSON-LD): ${dash.length}`);
  line(`metas over 160 characters: ${texts.filter((o) => o.description.length > 160).length} (max ${Math.max(...texts.map((o) => o.description.length))})`);
  const banned = texts.filter((o) => /\b(exact|virtually identical|near-identical|close match)\b/i.test(everything(o).join(" ")));
  line(`banned closeness words ("exact", "virtually identical", "near-identical", "close match"): ${banned.length}`);
  const lrvBand = bandPages.map((c) => outs.get(`${c.brand.slug}/${c.slug}`)!);
  line(`per-LRV-band pages checked (3 per band): ${lrvBand.length}, with an em dash: ${lrvBand.filter((o) => everything(o).some((t) => t.includes("—"))).length}`);

  h("C. Undertone");
  const tan = outs.get("benjamin-moore/shakespeare-tan-228");
  line(`Shakespeare Tan: shows 'neutral undertone' anywhere: ${tan ? everything(tan).some((t) => /neutral undertone/i.test(t)) : "not found"}`);
  const chantilly = all.find((c) => c.slug === "chantilly-lace-2121-70")!;
  const cosmic = all.find((c) => c.slug === "cosmic-blue-4008-10c")!;
  line(`displayUndertone: Chantilly Lace ${displayUndertone(chantilly)}, Cosmic Blue ${displayUndertone(cosmic)}, Shakespeare Tan ${displayUndertone(all.find((c) => c.slug === "shakespeare-tan-228")!)}`);
  const hidden = all.filter((c) => c.undertone && !displayUndertone(c)).length;
  line(`catalog colors with an undertone label hidden by the guard: ${hidden} of ${all.filter((c) => c.undertone).length} labeled`);

  h("D. No-close-match and FAQ wording");
  const noClose = texts.filter((o) => /No brand in our data has a very similar match/.test(o.lede));
  line(`pages with the no-close-match lede: ${noClose.length} of ${texts.length}`);
  const zinc = outs.get("ral/zinc-yellow-1018");
  line(`RAL Zinc Yellow lede: ${zinc?.lede}`);
  line(`RAL Zinc Yellow FAQ: ${zinc?.faq.find((f) => /match/i.test(f.question))?.answer}`);
  const localNoMajor = texts.filter((o) => o.faq.some((f) => /local store/.test(f.answer)) && !/(Sherwin-Williams|Benjamin Moore|Behr|PPG|Valspar|Dunn-Edwards|Farrow & Ball)/.test(o.faq.find((f) => /local store/.test(f.answer))!.answer));
  line(`FAQ says 'local store' with no major brand listed: ${localNoMajor.length}`);
  line(`FAQ names Colorhouse: ${texts.filter((o) => o.faq.some((f) => /Colorhouse/.test(f.answer))).length}`);
  const noMajor = texts.filter((o) => { const a = o.faq.find((f) => /What colors match/.test(f.question))?.answer; return a && !/(Sherwin-Williams|Benjamin Moore|Behr|PPG|Valspar|Dunn-Edwards|Farrow & Ball)/.test(a); });
  line(`FAQ match answers with no major brand: ${noMajor.length}`);

  h("E. Manufacturer family");
  for (const slug of ["westhaven-9675", "peacock-plume-20", "merlot-2704"]) {
    const o = outs.get(`sherwin-williams/${slug}`);
    line(`${slug}: family ${o?.c.color_family} | lede: ${o?.lede.slice(0, 70)}`);
  }

  h("F. Before / after, 5 examples (before = origin/main arm logic)");
  const before = (o: Out) => {
    const c = o.c; const k = `${c.brand.slug}/${c.slug}`; const colorNum = c.color_number ? ` ${c.color_number}` : "";
    const variant = extractVariantSuffix(c.slug, c.color_number);
    const fam = c.color_family ? c.color_family[0].toUpperCase() + c.color_family.slice(1) : null;
    const suffix = fam ? ` | ${c.lrv != null ? `LRV ${Math.round(Number(c.lrv))} ` : ""}${fam} Paint Color` : ` | ${c.hex.toUpperCase()}`;
    const arm = titleArm(c.brand.slug, c.slug);
    const subs = ["Sherwin-Williams", "Benjamin Moore", "Behr"].filter((x) => x !== c.brand.name);
    return { arm, title: arm === "matches" ? `${c.name}${colorNum} by ${c.brand.name}${variant}: Closest ${subs[0]} & ${subs[1]} Matches` : `${c.name}${colorNum} by ${c.brand.name}${variant}${suffix}` };
  };
  const longName = [...outs.values()].filter((o) => !REVIEWED_COLOR_PAGES[`${o.c.brand.slug}/${o.c.slug}`]).sort((a, b) => b.c.name.length - a.c.name.length)[0];
  // Hunt for a color with no cross-brand matches among rarely-matched brands.
  let noMatch: Out | null = [...outs.values()].find((o) => o.perBrandCount === 0) ?? null;
  if (!noMatch) {
    for (const c of all.filter((x) => ["ral", "colorhouse", "hirshfields", "kilz"].includes(x.brand.slug)).slice(0, 400)) {
      const o = await render(c);
      if (o.perBrandCount === 0) { noMatch = o; break; }
    }
  }
  if (!noMatch) {
    // No catalog color in the rendered set has zero matches (checked 400 more
    // from RAL, Colorhouse, Hirshfield's and Kilz). Show what the page does for
    // one by passing a real color an empty match list.
    const base = outs.get("ral/zinc-yellow-1018")!;
    const meta = colorMetadataText({ color: base.c as never, brandSlug: "ral", colorSlug: "zinc-yellow-1018", matches: [], isHead: false });
    noMatch = { ...base, title: (meta.title as { absolute: string }).absolute, description: meta.description, perBrandCount: 0 };
    line("(no color with zero matches found; the 'no matches' example below is Zinc Yellow with an empty match list)");
  }
  const examples: Array<[string, Out | undefined | null]> = [
    ["PPG", outs.get("ppg/gypsum-1006-1")], ["SW (zero-pad)", outs.get("sherwin-williams/peacock-plume-20")],
    ["SW typical", outs.get("sherwin-williams/repose-gray-7015")],
    ["long name", longName], ["no matches", noMatch],
  ];
  for (const [label, o] of examples) {
    if (!o) { line(`${label}: none found`); continue; }
    const b = before(o);
    line(`${label}: ${o.c.brand.name} ${o.c.name} ${o.c.color_number ?? ""}`);
    line(`  title before (${b.arm}, ${b.title.length}): ${b.title}`);
    line(`  title after  (${o.title.length}): ${o.title}`);
    line(`  meta after   (${o.description.length}): ${o.description}`);
  }
  const noMatchCount = texts.filter((o) => o.perBrandCount === 0).length;
  line(`rendered pages with zero cross-brand matches: ${noMatchCount}`);
  line();
  line("Done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
