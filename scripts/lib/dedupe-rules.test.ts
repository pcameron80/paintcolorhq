import { test } from "node:test";
import assert from "node:assert/strict";
import {
  pickCanonical,
  dupeGroupKey,
  findDuplicateGroups,
  primaryReason,
  mergeRedirects,
  resolveAcTarget,
  explicitGroups,
  type ExplicitDuplicate,
  type GroupableRow,
} from "./dedupe-rules";

const LIVE = "2026-10-11";
let n = 0;
const row = (brand: string, slug: string, color_number: string, name: string, hex: string, live = true): GroupableRow => ({
  id: `id-${++n}`,
  brand_id: brand,
  slug,
  color_number,
  name,
  hex,
  last_seen_live_on: live ? LIVE : null,
});
const brands = new Map(["behr", "benjamin-moore", "sherwin-williams", "kilz"].map((b) => [b, b]));

test("BM: US retail number beats Canadian CC- number (October Mist)", () => {
  const { canonical, dupes, alternates } = pickCanonical(
    [
      { slug: "october-mist-cc-550", color_number: "CC-550" },
      { slug: "october-mist-1495", color_number: "1495" },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "october-mist-1495");
  assert.deepEqual(dupes.map((d) => d.slug), ["october-mist-cc-550"]);
  assert.deepEqual(alternates, ["CC-550"]);
});

test("BM: OC- collection number beats both retail and CC- (Cloud White)", () => {
  const { canonical, alternates } = pickCanonical(
    [
      { slug: "cloud-white-967", color_number: "967" },
      { slug: "cloud-white-cc-40", color_number: "CC-40" },
      { slug: "cloud-white-oc-130", color_number: "OC-130" },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "cloud-white-oc-130");
  assert.deepEqual(alternates.sort(), ["967", "CC-40"]);
});

test("BM: HC- beats plain retail number (Black)", () => {
  const { canonical } = pickCanonical(
    [
      { slug: "black-2132-10", color_number: "2132-10" },
      { slug: "black-hc-190", color_number: "HC-190" },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "black-hc-190");
});

test("PPG: modern code beats legacy code", () => {
  const { canonical, alternates } = pickCanonical(
    [
      { slug: "adorable-18-28", color_number: "18-28" },
      { slug: "adorable-1066-4", color_number: "1066-4" },
    ],
    "ppg",
  );
  assert.equal(canonical.slug, "adorable-1066-4");
  assert.deepEqual(alternates, ["18-28"]);
});

test("same-number import dupes: base slug wins, no alternates", () => {
  const { canonical, dupes, alternates } = pickCanonical(
    [
      { slug: "aviator-silver-tb-34-2", color_number: "TB-34" },
      { slug: "aviator-silver-tb-34", color_number: "TB-34" },
      { slug: "aviator-silver-tb-34-3", color_number: "TB-34" },
    ],
    "kilz",
  );
  assert.equal(canonical.slug, "aviator-silver-tb-34");
  assert.equal(dupes.length, 2);
  assert.deepEqual(alternates, []);
});

test("created_at breaks slug-length ties", () => {
  const { canonical } = pickCanonical(
    [
      { slug: "kona-af-165-b", color_number: "AF-165", created_at: "2026-03-01" },
      { slug: "kona-af-165-a", color_number: "AF-165", created_at: "2026-02-01" },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "kona-af-165-a");
});

test("group key normalizes case and whitespace", () => {
  assert.equal(
    dupeGroupKey("bm", " October Mist ", "#B7B9A6"),
    dupeGroupKey("bm", "october mist", "#b7b9a6"),
  );
});

test("Behr: the live padded code beats the shorter unpadded slug (Cracked Pepper)", () => {
  const { canonical, alternates, liveConflict } = pickCanonical(
    [
      { slug: "cracked-pepper-ppu18-1", color_number: "PPU18-1", last_seen_live_on: null },
      { slug: "cracked-pepper-ppu18-01", color_number: "PPU18-01", last_seen_live_on: LIVE },
    ],
    "behr",
  );
  assert.equal(canonical.slug, "cracked-pepper-ppu18-01");
  assert.deepEqual(alternates, ["PPU18-1"]);
  assert.equal(liveConflict, false);
});

test("Behr: padded code wins even when the feed cannot tell the rows apart", () => {
  const { canonical } = pickCanonical(
    [
      { slug: "calm-bl-w1", color_number: "BL-W1" },
      { slug: "calm-bl-w01", color_number: "BL-W01" },
    ],
    "behr",
  );
  assert.equal(canonical.slug, "calm-bl-w01");
});

test("feed presence outranks brand numbering rules", () => {
  const { canonical, liveConflict } = pickCanonical(
    [
      { slug: "white-oc-151", color_number: "OC-151", last_seen_live_on: null },
      { slug: "white-pm-2", color_number: "PM-2", last_seen_live_on: LIVE },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "white-pm-2");
  assert.equal(liveConflict, false);
});

test("BM: OC- beats PM- when both are live (White OC-151 / PM-2)", () => {
  const { canonical, alternates } = pickCanonical(
    [
      { slug: "white-pm-2", color_number: "PM-2", last_seen_live_on: LIVE },
      { slug: "white-oc-151", color_number: "OC-151", last_seen_live_on: LIVE },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "white-oc-151");
  assert.deepEqual(alternates, ["PM-2"]);
});

test("BM: AC- alias loses to the primary number", () => {
  const { canonical } = pickCanonical(
    [
      { slug: "berkshire-ac-2", color_number: "AC-2" },
      { slug: "brandon-beige-977", color_number: "977" },
    ],
    "benjamin-moore",
  );
  assert.equal(canonical.slug, "brandon-beige-977");
});

test("HISP: the English row is canonical and no (HISP) code is folded", () => {
  const { canonical, alternates } = pickCanonical(
    [
      { slug: "hierba-santa-pph-59-hisp", color_number: "PPH-59 (HISP)", name: "Hierba Santa" },
      { slug: "holy-herb-pph-59", color_number: "PPH-59", name: "Holy Herb" },
    ],
    "behr",
  );
  assert.equal(canonical.slug, "holy-herb-pph-59");
  assert.deepEqual(alternates, []);
});

test("SW: the 4-digit code SW publishes beats the unpadded one", () => {
  const { canonical } = pickCanonical(
    [
      { slug: "indian-white-35", color_number: "35", last_seen_live_on: LIVE },
      { slug: "warm-beige-0035", color_number: "0035", last_seen_live_on: LIVE },
    ],
    "sherwin-williams",
  );
  assert.equal(canonical.slug, "warm-beige-0035");
});

test("groups: Behr padding pairs join without matching hex", () => {
  const rows = [
    row("behr", "cracked-pepper-ppu18-01", "PPU18-01", "Cracked Pepper", "#4c4e4e"),
    row("behr", "cracked-pepper-ppu18-1", "PPU18-1", "Cracked Pepper", "#53504f", false),
    row("behr", "other-ppu18-02", "PPU18-02", "Other", "#4c4e4e"),
  ];
  const { groups } = findDuplicateGroups(rows, brands);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].rows.map((r) => r.slug).sort(), ["cracked-pepper-ppu18-01", "cracked-pepper-ppu18-1"]);
  assert.equal(primaryReason(groups[0].reasons), "behr-pad");
});

test("groups: same code under two slugs, including an apostrophe variant (Writer's Parchment)", () => {
  const rows = [
    row("behr", "writers-parchment-n280-2", "N280-2", "Writers Parchment", "#e8dfcc"),
    row("behr", "writers-parchment-n280-2-2", "N280-2", "Writer's Parchment", "#e9dfcb"),
    row("behr", "open-canyon-n300-4", "N300-4", "Open Canyon", "#a88f76"),
    row("behr", "canyon-ouvert-n300-4", "N300-4", "Canyon Ouvert", "#a88f76"),
  ];
  const { groups } = findDuplicateGroups(rows, brands);
  assert.equal(groups.length, 2);
  for (const g of groups) assert.equal(primaryReason(g.reasons), "same-code");
  const canon = groups.map((g) => pickCanonical(g.rows, g.brandSlug).canonical.slug).sort();
  assert.deepEqual(canon, ["open-canyon-n300-4", "writers-parchment-n280-2"]);
});

test("groups: HISP row maps to the English row with the same code and hex", () => {
  const rows = [
    row("behr", "holy-herb-pph-59", "PPH-59", "Holy Herb", "#9aa36b", false),
    row("behr", "hierba-santa-pph-59-hisp", "PPH-59 (HISP)", "Hierba Santa", "#9aa36b", false),
    row("behr", "same-hex-other-code", "PPH-60", "Other", "#9aa36b", false),
  ];
  const { groups } = findDuplicateGroups(rows, brands);
  assert.equal(groups.length, 1);
  assert.equal(primaryReason(groups[0].reasons), "hisp");
  assert.equal(pickCanonical(groups[0].rows, "behr").canonical.slug, "holy-herb-pph-59");
});

test("groups: SW normalized code + hex (35 / 0035)", () => {
  const rows = [
    row("sherwin-williams", "indian-white-35", "35", "Indian White", "#eedac3"),
    row("sherwin-williams", "warm-beige-0035", "0035", "Warm Beige", "#eedac3"),
    row("sherwin-williams", "other-36", "36", "Other", "#eedac3"),
  ];
  const { groups } = findDuplicateGroups(rows, brands);
  assert.equal(groups.length, 1);
  assert.equal(primaryReason(groups[0].reasons), "norm-code");
});

test("groups: a BM AC- seed joins the AC row to its primary, unioned with name+hex twins", () => {
  const rows = [
    row("benjamin-moore", "mesa-ac-33", "AC-33", "Mesa", "#a08f7d", false),
    row("benjamin-moore", "cabot-trail-998", "998", "Cabot", "#a38f7a"),
    row("benjamin-moore", "cabot-cc-480", "CC-480", "Cabot", "#a38f7a"),
  ];
  const { groups, acUnresolved } = findDuplicateGroups(rows, brands, [
    { code: "AC-33", primary: { number: "998" }, candidates: [{ number: "998" }, { number: "CC-480" }] },
    { code: "AC-99", primary: { number: "1234" } },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].rows.length, 3);
  assert.equal(pickCanonical(groups[0].rows, "benjamin-moore").canonical.slug, "cabot-trail-998");
  assert.deepEqual(acUnresolved, []); // no AC-99 row is held, so nothing to report
});

test("resolveAcTarget: name prefix first, then closest hex", () => {
  const held = new Map([
    ["968", { name: "Dune White", hex: "#e9e4d8", color_number: "968" }],
    ["OC-37", { name: "Glacier White", hex: "#e6e3d6", color_number: "OC-37" }],
    ["1544", { name: "Waynesboro Taupe", hex: "#a39787", color_number: "1544" }],
    ["HC-87", { name: "Ashley Gray", hex: "#a69b8e", color_number: "HC-87" }],
  ]);
  const glacier = { name: "Glacier", hex: "#edebe1", color_number: "AC-40" };
  const ac40 = { code: "AC-40", primary: { number: "968" }, candidates: [{ number: "968" }, { number: "OC-37" }] };
  assert.equal(resolveAcTarget(glacier, ac40, held)?.color_number, "OC-37");
  const shen = { name: "Shenandoah", hex: "#a69b8e", color_number: "AC-36" };
  const ac36 = { code: "AC-36", primary: { number: "1544" }, candidates: [{ number: "1544" }, { number: "HC-87" }] };
  assert.equal(resolveAcTarget(shen, ac36, held)?.color_number, "HC-87");
});

test("mergeRedirects never drops an entry and re-points chains", () => {
  const existing = { "behr/a": "behr/b", "behr/x": "behr/y" };
  const { merged, added, repointed, conflicts } = mergeRedirects(existing, { "behr/b": "behr/c", "behr/x": "behr/z" });
  assert.equal(Object.keys(merged).length, 3);
  assert.equal(merged["behr/a"], "behr/c");
  assert.equal(merged["behr/b"], "behr/c");
  assert.equal(merged["behr/x"], "behr/y");
  assert.deepEqual(added, ["behr/b"]);
  assert.equal(repointed.length, 1);
  assert.equal(conflicts.length, 1);
});

test("compute-matches: equal Delta E prefers the live row, then match id, regardless of input order", async () => {
  const { insertCandidate } = await import("../compute-matches");
  const english = { index: 0, deltaE: 1.5, live: true, id: "behr/holy-herb-pph-59" };
  const hisp = { index: 1, deltaE: 1.5, live: false, id: "behr/hierba-santa-pph-59-hisp" };
  const worse = { index: 2, deltaE: 2.0, live: true, id: "behr/a" };
  for (const order of [[english, hisp, worse], [hisp, worse, english], [worse, hisp, english]]) {
    const top: typeof order = [];
    for (const c of order) insertCandidate(top, 2, c);
    assert.deepEqual(top.map((c) => c.id), ["behr/holy-herb-pph-59", "behr/hierba-santa-pph-59-hisp"]);
  }
  const tie = [
    { index: 0, deltaE: 1, live: false, id: "behr/b" },
    { index: 1, deltaE: 1, live: false, id: "behr/a" },
  ];
  const top: typeof tie = [];
  for (const c of tie) insertCandidate(top, 1, c);
  assert.equal(top[0].id, "behr/a");
});

const vistaBrands = new Map([...brands, ["vista-paint", "vista-paint"]]);

test("explicit: declared canonical is kept and losers that share it form one group", () => {
  const rows = [
    row("behr", "swiss-coffee-12", "12", "Swiss Coffee", "#f3f2e6"),
    row("behr", "swiss-coffee-1812-1812", "1812", "Swiss Coffee 1812", "#f2f1e5", false),
    row("behr", "swiss-coffee-w-b-700", "W-B-700", "Swiss Coffee", "#f2f1e5", false),
    // Equal slug length and neither live: pickCanonical would fall to created_at.
    row("behr", "grape-cr-me-ul250-10", "UL250-10", "Grape Crème", "#bebbbb", false),
    row("behr", "grape-creme-ppu16-11", "PPU16-11", "Grape Creme", "#bebbbb", false),
  ];
  const { groups, refused } = explicitGroups(rows, brands, [
    { brand: "behr", loser: "swiss-coffee-1812-1812", loserCode: "1812", canonical: "swiss-coffee-12" },
    { brand: "behr", loser: "swiss-coffee-w-b-700", loserCode: "W-B-700", canonical: "swiss-coffee-12" },
    { brand: "behr", loser: "grape-cr-me-ul250-10", loserCode: "UL250-10", canonical: "grape-creme-ppu16-11" },
  ]);
  assert.deepEqual(refused, []);
  assert.equal(groups.length, 2);
  const swiss = groups.find((g) => g.canonical.slug === "swiss-coffee-12")!;
  assert.deepEqual(swiss.dupes.map((d) => d.slug).sort(), ["swiss-coffee-1812-1812", "swiss-coffee-w-b-700"]);
  assert.deepEqual(swiss.alternates.sort(), ["1812", "W-B-700"]);
  assert.equal(groups.find((g) => g.dupes[0].slug === "grape-cr-me-ul250-10")!.canonical.slug, "grape-creme-ppu16-11");
});

test("explicit: refuses a loser that no longer holds its code (fix-vista-identities not run yet)", () => {
  const rows = [
    // Before the identity fix, goldfinch-k-545 holds Under the Sun's live code 7861.
    row("vista-paint", "goldfinch-k-545", "7861", "Under the Sun", "#ffcf2e"),
    row("vista-paint", "goldfinch-7942", "7942", "Goldfinch", "#ffbe3c"),
  ];
  const { groups, refused } = explicitGroups(rows, vistaBrands, [
    { brand: "vista-paint", loser: "goldfinch-k-545", loserCode: "K-545", canonical: "goldfinch-7942", requires: "fix-vista-identities.ts --apply" },
  ]);
  assert.equal(groups.length, 0);
  assert.match(refused[0], /expected "K-545".*fix-vista-identities/);
});

test("explicit: refuses missing rows, rows already grouped, and a not-live canonical over a live loser", () => {
  const rows = [
    row("vista-paint", "cyan-sky-c-680", "C-680", "Cyan Sky", "#00b5b6", false),
    row("vista-paint", "cyan-sky-0681", "0681", "Cyan Sky", "#28b7b8"),
    row("vista-paint", "a-live", "1", "A", "#111111"),
    row("vista-paint", "b-dead", "2", "A", "#111112", false),
  ];
  const { refused } = explicitGroups(
    rows,
    vistaBrands,
    [
      { brand: "vista-paint", loser: "gone-c-1", loserCode: "C-1", canonical: "cyan-sky-0681" },
      { brand: "vista-paint", loser: "cyan-sky-c-680", loserCode: "C-680", canonical: "cyan-sky-0681" },
      { brand: "vista-paint", loser: "a-live", loserCode: "1", canonical: "b-dead" },
    ],
    new Set(["vista-paint/cyan-sky-0681"]),
  );
  assert.equal(refused.length, 3);
  assert.match(refused[0], /loser row not found/);
  assert.match(refused[1], /rule-based group/);
  assert.match(refused[2], /not in the live feed/);
});

test("explicit-duplicates.json: every pair is well formed and no slug is both loser and canonical", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const file = path.resolve(__dirname, "../data/explicit-duplicates.json");
  const { pairs } = JSON.parse(fs.readFileSync(file, "utf8")) as { pairs: ExplicitDuplicate[] };
  assert.equal(pairs.length, 84);
  const losers = new Set(pairs.map((p) => `${p.brand}/${p.loser}`));
  assert.equal(losers.size, pairs.length, "a loser is listed twice");
  for (const p of pairs) {
    assert.ok(p.brand && p.loser && p.canonical && p.loserCode, JSON.stringify(p));
    assert.ok(!losers.has(`${p.brand}/${p.canonical}`), `${p.canonical} is also a loser`);
  }
});
