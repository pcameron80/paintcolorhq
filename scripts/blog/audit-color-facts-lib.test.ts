import { test } from "node:test";
import assert from "node:assert/strict";
import { hexToRgb, rgbToLab, deltaE2000 } from "../../src/lib/color-utils.ts";
import {
  Catalog,
  auditText,
  auditBrandCounts,
  auditBrandTotal,
  auditCatalogRows,
  auditLightestWhites,
  normName,
  normCode,
  type AuditColor,
  type CatalogRules,
  type WhiteRow,
} from "./audit-color-facts-lib.ts";

const BRAND_NAMES: Record<string, string> = {
  "benjamin-moore": "Benjamin Moore",
  "sherwin-williams": "Sherwin-Williams",
  behr: "Behr",
  ppg: "PPG",
  valspar: "Valspar",
  "farrow-ball": "Farrow & Ball",
  "dutch-boy": "Dutch Boy",
};

let n = 0;
function color(brandSlug: string, slug: string, name: string, code: string, hex: string, lrv: number | null, archived = false): AuditColor {
  const { r, g, b } = hexToRgb(hex);
  return { id: `id-${++n}`, brandSlug, brandName: BRAND_NAMES[brandSlug], slug, name, code, hex, lrv, archived, lab: rgbToLab(r, g, b) };
}

// Current DB values (after the 2026-10-11 correction), taken from real rows.
const C = [
  color("benjamin-moore", "pale-oak-oc-20", "Pale Oak", "OC-20", "#ddd9ce", 68.6),
  color("benjamin-moore", "black-hc-190", "Black", "HC-190", "#313132", 4.6),
  color("benjamin-moore", "wrought-iron-2124-10", "Wrought Iron", "2124-10", "#4a4b4c", 7),
  color("benjamin-moore", "tweed-coat-csp-85", "Tweed Coat", "CSP-85", "#88837a", 23),
  color("behr", "bee-s-knees-t13-11", "Bee's Knees", "T13-11", "#e8d9d2", 70),
  color("behr", "campfire-ash-n320-1", "Campfire Ash", "N320-1", "#ddd9ce", 68.6),
  color("behr", "timber-brown-n140-7", "Timber Brown", "N140-7", "#605652", 9),
  color("behr", "night-club-n500-7", "Night Club", "N500-7", "#494b4e", 7),
  color("behr", "limousine-leather-mq5-05", "Limousine Leather", "MQ5-05", "#3b3c3b", 5),
  color("behr", "retired-gray-x1", "Retired Gray", "X1", "#4a4b4c", 7, true),
  color("sherwin-williams", "tricorn-black-6258", "Tricorn Black", "6258", "#2f2f30", 2.9),
  color("ppg", "black-magic-1001-7", "Black Magic", "1001-7", "#414040", 5.2),
  color("valspar", "mountain-smoke-6004-2b", "Mountain Smoke", "6004-2B", "#817b72", 20),
];
const cat = new Catalog(C, deltaE2000);
const id = (slug: string) => C.find((c) => c.slug === slug)!.id;

test("normName folds case, apostrophes and entities", () => {
  assert.equal(normName("Bee&apos;s Knees"), normName("Bee's Knees"));
  assert.equal(normName("Farrow &amp; Ball"), "farrow & ball");
});

test("flags a Swatch hex that no longer matches the DB", () => {
  const f = auditText("x.tsx", `<p><Swatch hex="#E8D8D0" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> is soft.</p>`, cat);
  assert.deepEqual(f.map((x) => x.kind), ["stale-hex"]);
  assert.match(f[0].message, /#E8D8D0.*#ddd9ce/);
});

test("accepts a current hex in any case", () => {
  const f = auditText("x.tsx", `<p><Swatch hex="#DDD9CE" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> is soft.</p>`, cat);
  assert.deepEqual(f, []);
});

test("flags broken and archived color links", () => {
  const f = auditText("x.tsx", `<p>See <Link href="/colors/behr/no-such-1">x</Link> and <Link href="/colors/behr/retired-gray-x1">y</Link>.</p>`, cat);
  assert.deepEqual(f.map((x) => x.kind).sort(), ["archived-link", "broken-link"]);
});

test("flags a printed LRV that disagrees, allowing display rounding", () => {
  const ok = auditText("x.tsx", `<p><Swatch hex="#ddd9ce" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> (OC-20, LRV 69) is soft.</p>`, cat);
  assert.deepEqual(ok, []);
  const bad = auditText("x.tsx", `<p><Swatch hex="#ddd9ce" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> (LRV 70.8) is soft.</p>`, cat);
  assert.deepEqual(bad.map((x) => x.kind), ["stale-lrv"]);
  assert.match(bad[0].message, /DB has 68\.6/);
  const dash = auditText("x.tsx", `<p><Swatch hex="#817b72" name="Mountain Smoke" href="/colors/valspar/mountain-smoke-6004-2b" /> — 6004-2B, LRV 23. A deep gray.</p>`, cat);
  assert.deepEqual(dash.map((x) => x.kind), ["stale-lrv"]);
});

test("flags a match label that the current swatches no longer support", () => {
  // Pale Oak vs Bee's Knees was 0.56 on the old swatch, 6.3 now.
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#ddd9ce" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> is light, with Behr Bee&apos;s Knees as a nearly identical match.</p>`,
    cat,
  );
  assert.ok(f.some((x) => x.kind === "closeness-label" && /Bee's Knees/.test(x.message) && /visible difference/.test(x.message)));
});

test("passes a correct label and attributes labels per mention", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#313132" name="Black" href="/colors/benjamin-moore/black-hc-190" /> pairs with SW Tricorn Black, nearly identical, and Behr Limousine Leather, very similar.</p>`,
    cat,
  );
  assert.deepEqual(f.filter((x) => x.kind === "closeness-label"), []);
});

test("flags a 'closest' claim when the brand has a much nearer color", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#4a4b4c" name="Wrought Iron" href="/colors/benjamin-moore/wrought-iron-2124-10" /> is a soft black. Behr Timber Brown is its closest match.</p>`,
    cat,
  );
  const nc = f.find((x) => x.kind === "not-closest");
  assert.ok(nc, JSON.stringify(f));
  assert.match(nc!.message, /Night Club/); // archived Retired Gray is never suggested
});

test("editorial entries: hex and LRV in prose are checked against the keyed color", () => {
  const text = `export const E = {
  "benjamin-moore/pale-oak-oc-20": (
    <>
      <p>
        Pale Oak (OC-20) is hex #E8D8D0 with an estimated LRV of 70.8. Behr Campfire Ash is a nearly
        identical digital match.
      </p>
    </>
  ),
};`;
  const kinds = auditText("e.tsx", text, cat).map((x) => x.kind).sort();
  assert.deepEqual(kinds, ["stale-hex", "stale-lrv"]);
});

test("table cells: 'Name (label)' is resolved in the column's brand and checked", () => {
  const text = `<table><thead><tr><th>Door color</th><th>Closest SW or BM</th><th>Closest Behr</th></tr></thead>
<tbody>
<tr><td><Swatch hex="#313132" name="Black" href="/colors/benjamin-moore/black-hc-190" /></td><td>Black Magic (nearly identical)</td><td>Limousine Leather (very similar)</td></tr>
</tbody></table>`;
  const f = auditText("t.tsx", text, cat);
  // Black Magic is PPG (wrong column) and only very similar; Limousine Leather is right.
  assert.equal(f.filter((x) => /Limousine/.test(x.message)).length, 0);
  assert.ok(f.some((x) => /Black Magic/.test(x.message)), JSON.stringify(f));
});

test("changed-color info when a corrected color is mentioned", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#ddd9ce" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> is light.</p>`,
    cat,
    { changedIds: new Set([id("pale-oak-oc-20")]) },
  );
  assert.deepEqual(f.map((x) => x.kind), ["changed-color"]);
});

test("banned closeness wording is flagged next to a match", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#2f2f30" name="Tricorn Black" href="/colors/sherwin-williams/tricorn-black-6258" /> and BM Black are a close match.</p>`,
    cat,
  );
  assert.ok(f.some((x) => x.kind === "banned-label"));
});

test("a label after 'with Y' belongs to Y, not to the earlier match", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#313132" name="Black" href="/colors/benjamin-moore/black-hc-190" /> is deep. SW Tricorn Black is its closest match, with Behr Limousine Leather very similar.</p>`,
    cat,
  );
  assert.deepEqual(f.filter((x) => x.kind === "closeness-label"), []);
});

test("nameRun keeps the whole capitalized phrase, including inner small words", async () => {
  const { nameRun } = await import("./audit-color-facts-lib.ts");
  assert.equal(nameRun("Shy Green (MQ3-48), which"), "Shy Green");
  assert.equal(nameRun("Back to Nature is a"), "Back to Nature");
  assert.equal(nameRun("Nimbus Gray are its closest"), "Nimbus Gray");
  assert.equal(nameRun("and more"), "");
  assert.equal(nameRun("Bee's Knees and PPG Sandy Beach as"), "Bee's Knees");
});

test("an unknown longer name never resolves to a shorter one", () => {
  // "Timber Brown Deluxe" is not a color; it must not be read as Timber Brown.
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#4a4b4c" name="Wrought Iron" href="/colors/benjamin-moore/wrought-iron-2124-10" /> is soft. Behr Timber Brown Deluxe is its closest match.</p>`,
    cat,
  );
  assert.deepEqual(f, []);
});

test("editorial: a neighbor's LRV in a later sentence is not checked against the keyed color", () => {
  const text = `export const E = {
  "benjamin-moore/pale-oak-oc-20": (
    <>
      <p>
        Pale Oak (OC-20) is hex #DDD9CE with an estimated LRV of 68.6. Against Black (HC-190, LRV
        4.6), Pale Oak reads light.
      </p>
    </>
  ),
};`;
  assert.deepEqual(auditText("e.tsx", text, cat), []);
});

test("reads a label placed before the match: 'a nearly identical match for <X>'", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#817b72" name="Mountain Smoke" href="/colors/valspar/mountain-smoke-6004-2b" /> is warm. It is a nearly identical match for <Link href="/colors/benjamin-moore/tweed-coat-csp-85">Benjamin Moore Tweed Coat</Link>.</p>`,
    cat,
  );
  assert.ok(f.some((x) => x.kind === "closeness-label" && /Tweed Coat/.test(x.message) && /very similar/.test(x.message)), JSON.stringify(f));
});

test("joined matches with codes share the predicate: '<A> (code) and <B> are its closest twins'", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#ddd9ce" name="Pale Oak" href="/colors/benjamin-moore/pale-oak-oc-20" /> is light. Behr Bee&apos;s Knees (T13-11) and Behr Campfire Ash are its closest twins.</p>`,
    cat,
  );
  assert.ok(f.some((x) => /Bee's Knees/.test(x.message) && x.kind === "closeness-label"), JSON.stringify(f));
  assert.ok(!f.some((x) => x.message.startsWith("Behr Campfire Ash")), JSON.stringify(f)); // a true twin is not flagged
});

test("a label right before a match beats one carried over a ', and' join", () => {
  const f = auditText(
    "x.tsx",
    `<p><Swatch hex="#2f2f30" name="Tricorn Black" href="/colors/sherwin-williams/tricorn-black-6258" /> is crisp. It rates very similar to Behr Limousine Leather, and BM Black is its nearly identical match.</p>`,
    cat,
  );
  assert.deepEqual(f.filter((x) => x.kind === "closeness-label"), []);
});

// ---------- MP-35: blind spots the 2026-10 audit missed ----------

// Live DB values on 2026-10-24. Kept apart from C so the match-claim tests above are unaffected.
const D = [
  color("sherwin-williams", "alabaster-7008", "Alabaster", "7008", "#edeae0", 82),
  color("benjamin-moore", "swiss-coffee-oc-45", "Swiss Coffee", "OC-45", "#eeece1", 81.8),
  color("sherwin-williams", "agreeable-gray-7029", "Agreeable Gray", "7029", "#d1cbc1", 60.1),
  color("benjamin-moore", "baja-dunes-997", "Baja Dunes", "997", "#bfae97", 41.3),
  color("farrow-ball", "stiffkey-blue-281", "Stiffkey Blue", "281", "#4d5b6a", 10.1),
  color("benjamin-moore", "hale-navy-hc-154", "Hale Navy", "HC-154", "#434c56", 8.3),
  color("benjamin-moore", "edgecomb-gray-hc-173", "Edgecomb Gray", "HC-173", "#d9d3c4", 63.1),
  color("benjamin-moore", "gray-2121-10", "Gray", "2121-10", "#5d6061", 12),
  color("behr", "muted-sage-n350-5", "Muted Sage", "N350-5", "#9a9d86", 28),
  color("sherwin-williams", "ultrawhite-9500", "UltraWhite", "9500", "#f6f7f2", 92.5),
  color("behr", "ultra-pure-white-upw", "Ultra Pure White", "UPW", "#f8f9f3", 94),
  color("behr", "ultra-pure-white-w-b-500", "Ultra Pure White", "W-B-500", "#fafdf7", 97.3),
  color("valspar", "ultra-white-7006-24", "Ultra White", "7006-24", "#f8f8f3", 92.6),
];
// Palette-scan stamps: every row but W-B-500 was seen live (Behr, SW and Valspar have scans).
for (const c of D) c.lastSeenLive = c.slug === "ultra-pure-white-w-b-500" ? null : "2026-10-11";
const cat2 = new Catalog(D, deltaE2000);
const kinds = (f: { kind: string; severity: string }[]) => f.map((x) => `${x.severity}:${x.kind}`).sort();

test("normCode folds 'SW 7008', 'No. 281' and leading zeros", () => {
  assert.equal(normCode("SW 7008"), "7008");
  assert.equal(normCode("No. 281"), "281");
  assert.equal(normCode("0852"), "852");
  assert.equal(normCode("61YY 89/135"), "61YY89/135");
});

test("Swatch then '— No. 281, LRV n' is checked; 'LRV about n' allows a point either way", () => {
  const sw = `<Swatch hex="#4D5B6A" name="Stiffkey Blue" brand="Farrow & Ball" href="/colors/farrow-ball/stiffkey-blue-281" />`;
  const bad = auditText("b.tsx", `<p>${sw} — No. 281, LRV 5. The most dramatic blue.</p>`, cat2);
  assert.deepEqual(kinds(bad), ["warn:stale-lrv"]);
  assert.match(bad[0].message, /printed LRV 5, DB has 10/);
  assert.deepEqual(auditText("b.tsx", `<p>${sw} — No. 281, LRV about 10. The most dramatic blue.</p>`, cat2), []);
});

test("list form resolved by code: a hex mismatch is an error, an LRV mismatch a warning", () => {
  const stale = `<li><strong>Alabaster SW 7008 (LRV 82, #F0EAD6)</strong> &#8776; Swiss Coffee OC-45 (BM, LRV 82, #EFE4CE): Nearly identical.</li>`;
  const f = auditText("b.tsx", `<ul>${stale}</ul>`, cat2);
  assert.deepEqual(kinds(f), ["error:stale-hex", "error:stale-hex"]);
  assert.ok(f.some((x) => /Alabaster 7008 printed as #F0EAD6; DB has #edeae0/.test(x.message)));
  assert.ok(f.some((x) => /Swiss Coffee OC-45 printed as #EFE4CE/.test(x.message)));
  const current = `<ul><li><strong>Alabaster SW 7008 (LRV 82, #EDEAE0)</strong> &#8776; Swiss Coffee OC-45 (BM, LRV 82, #EEECE1): Nearly identical.</li></ul>`;
  assert.deepEqual(auditText("b.tsx", current, cat2), []);
  const lrv = auditText("b.tsx", `<p>Hale Navy (HC-154, LRV 12) is deep.</p>`, cat2);
  assert.deepEqual(kinds(lrv), ["warn:stale-lrv"]);
});

test("list form resolved by a name only one brand uses, but not a lowercase or one-word phrase", () => {
  const meta = `description: "Browse beige paint colors, from Swiss Coffee to Baja Dunes (LRV 42), with hex codes.",`;
  const f = auditText("page.tsx", meta, cat2);
  assert.deepEqual(kinds(f), ["warn:stale-lrv"]);
  assert.match(f[0].message, /Baja Dunes 997: printed LRV 42, DB has 41/);
  // "Muted sage" describes a palette hex; "Gray (LRV 58)" is a generic word.
  assert.deepEqual(auditText("p.ts", `<p>Muted sage (LRV around 45) is the only color.</p>`, cat2), []);
  assert.deepEqual(auditText("p.ts", `<p>A warm Gray (LRV 58) works here.</p>`, cat2), []);
});

test("a range is not a single LRV: 'Moody Greens (LRV 6–12)'", () => {
  assert.deepEqual(auditText("b.tsx", `<h2>Moody Greens (LRV 6–12)</h2><p>Hale Navy (HC-154, LRV 6-12) too.</p>`, cat2), []);
});

test("a fact parenthetical right after a /colors Link describes that color", () => {
  const link = `<Link href="/colors/sherwin-williams/agreeable-gray-7029" className="x">\n  Agreeable Gray SW 7029\n</Link>{" "}`;
  const bad = auditText("brand.tsx", `<p>Their best-selling color — ${link}\n(LRV 60, warm undertone, hex #D4CDC3) — has been the top seller.</p>`, cat2);
  assert.deepEqual(kinds(bad), ["error:stale-hex"]);
  assert.match(bad[0].message, /Agreeable Gray 7029 printed as #D4CDC3; DB has #d1cbc1/);
  const ok = auditText("brand.tsx", `<p>Their best-selling color — ${link}\n(LRV 60, warm undertone, hex #D1CBC1) — has been the top seller.</p>`, cat2);
  assert.deepEqual(ok, []);
  // A different color named between the link and the parenthetical takes the fact.
  assert.deepEqual(auditText("brand.tsx", `<p>${link} pairs with Hale Navy (HC-154, LRV 8).</p>`, cat2), []);
});

test("a published LRV that the hex-computed DB value does not match is info, not a warning", () => {
  const f = auditText("b.tsx", `<p>Only UltraWhite (SW 9500, published LRV 93.5) reflects more.</p>`, cat2);
  assert.deepEqual(kinds(f), ["info:stale-lrv"]);
});

test("keyed editorial: 'at LRV n' in a later sentence is checked unless another color is named first", () => {
  const entry = (body: string) => `export const E = {
  "benjamin-moore/hale-navy-hc-154": (
    <>
      <p>
        ${body}
      </p>
    </>
  ),
};`;
  const later = auditText("e.tsx", entry(`Hale Navy is the navy of kitchen islands. What sets it apart is a gray-green softness — at\n        LRV 18 it&apos;s deep.`), cat2);
  assert.deepEqual(kinds(later), ["warn:stale-lrv"]);
  assert.match(later[0].message, /Hale Navy HC-154: printed LRV 18, DB has 8/);
  assert.deepEqual(auditText("e.tsx", entry(`Hale Navy is deep — at LRV 8 it reads navy.`), cat2), []);
  assert.deepEqual(auditText("e.tsx", entry(`It has an LRV of about 9, so it reads navy.`), cat2), []);
  // the neighbor's LRV, named by code first
  assert.deepEqual(auditText("e.tsx", entry(`Edgecomb Gray (HC-173) is often suggested, but at LRV 63.1 it is lighter.`), cat2), []);
});

test("links to a row the brand's palette scan never saw are warned", () => {
  const f = auditText("b.tsx", `<p>See <Link href="/colors/behr/ultra-pure-white-w-b-500">it</Link>.</p>`, cat2);
  assert.deepEqual(kinds(f), ["warn:not-live-link"]);
  // without scan data (the fixtures above), nothing is "not live"
  assert.deepEqual(auditText("b.tsx", `<p>See <Link href="/colors/behr/night-club-n500-7">it</Link>.</p>`, cat), []);
});

test("brand-count copy: named brands plus 'N more' must equal the DB count", () => {
  const layout = `  description:\n    "Match any color across Sherwin-Williams, Benjamin Moore, Behr & 11 more brands. 26,000+ colors.",`;
  const f = auditBrandCounts("layout.tsx", layout, 13);
  assert.equal(f.length, 1);
  assert.match(f[0].message, /after 3 named brands implies 14; the DB has 13/);
  assert.deepEqual(auditBrandCounts("layout.tsx", layout.replace("11 more", "10 more"), 13), []);
  // JSX between the names does not hide them; "&amp;" counts as "&"
  const jsx = `<p>From <Link href="/brands/behr">Behr</Link>, PPG, and 4 more brands.</p>`;
  assert.match(auditBrandCounts("m.tsx", jsx, 13)[0].message, /after 2 named brands implies 6/);
  assert.match(auditBrandCounts("m.tsx", `"SW, BM &amp; 12 more brands"`, 13)[0].message, /implies 14/);
});

test("brand-count copy: 'N other brands' is count - 1; a bare 'N brands' may not exceed the count", () => {
  assert.deepEqual(auditBrandCounts("b.tsx", `<p>its closest equivalents in 12 other brands</p>`, 13), []);
  assert.match(auditBrandCounts("b.tsx", `<p>its closest matches in 13 other brands</p>`, 13)[0].message, /implies 14 brands/);
  assert.match(auditBrandCounts("p.tsx", `"over 26,000 colors across 14 major brands"`, 13)[0].message, /more than the 13/);
  assert.deepEqual(auditBrandCounts("p.tsx", `"across 13 brands" and "the 7 brands with popular colors"`, 13), []);
});

test("BRAND_COUNT must equal the brands table", () => {
  assert.deepEqual(auditBrandTotal(13, 13), []);
  assert.deepEqual(kinds(auditBrandTotal(14, 13)), ["error:brand-count"]);
});

const RULES: CatalogRules = {
  lrvRange: [2, 94.5],
  lrvAllowlist: new Set(["ral/jet-black-9005"]),
  nameAllowlist: new Set(["dunn-edwards/maker-styled-x1"]),
  nullUndertone: "error",
  nameMechanics: "error",
};

test("DB pass: implausible LRV, null undertone, entity and mis-cased names", () => {
  const rows: AuditColor[] = [
    { ...color("valspar", "bright-1", "Bright", "1", "#ffffff", 100), undertone: "neutral" },
    { ...color("valspar", "deep-2", "Deep", "2", "#0a0a0a", 0.3), undertone: "neutral" },
    { ...color("valspar", "ok-3", "Fine", "3", "#808080", 21), undertone: "neutral" },
    { ...color("ppg", "jet-black-9005", "Jet Black", "9005", "#0a0a0a", 0.3), brandSlug: "ral", undertone: "neutral" },
    { ...color("ppg", "harper-x27-s-blue", "Harper&#x27;s Blue", "70BG", "#5577aa", 20), undertone: "cool" },
    { ...color("dutch-boy", "whale-s-tail", "Whale'S Tail", "430", "#556677", 20), undertone: "cool" },
    { ...color("dutch-boy", "o-brien-orange", "O'Brien Orange", "431", "#cc6633", 20), undertone: "warm" },
    { ...color("dutch-boy", "maker-styled-x1", "Rock'N Roll", "432", "#cc6633", 20), brandSlug: "dunn-edwards", undertone: "warm" },
    { ...color("valspar", "no-undertone", "Plain", "4", "#808080", 21), undertone: null },
    color("valspar", "not-loaded", "Fixture", "5", "#808080", 21), // undertone undefined: not loaded, not flagged
  ];
  const f = auditCatalogRows(rows, RULES);
  assert.deepEqual(kinds(f), ["error:name-mechanics", "error:name-mechanics", "error:null-undertone", "warn:lrv-range", "warn:lrv-range"]);
  assert.ok(f.some((x) => /HTML entity/.test(x.message) && /Harper/.test(x.message)));
  assert.ok(f.some((x) => /Whale'S Tail/.test(x.message)));
  assert.ok(!f.some((x) => /O'Brien|Rock'N|jet-black/.test(x.message)));
  // The CLI ships these as warnings until the DB backlog is fixed.
  assert.ok(auditCatalogRows(rows, { ...RULES, nullUndertone: "warn", nameMechanics: "warn" }).every((x) => x.severity === "warn"));
});

const W = (o: Partial<WhiteRow>): WhiteRow => ({
  brand: "Behr",
  brandSlug: "behr",
  name: "Ultra Pure White",
  code: "UPW",
  slug: "ultra-pure-white-upw",
  lrv: 94,
  source: "behr.com",
  estimated: false,
  checked: "2026-10-23",
  ...o,
});
const valsparWhite = { brand: "Valspar", brandSlug: "valspar", name: "Ultra White", code: "7006-24", slug: "ultra-white-7006-24", source: "estimate from hex", estimated: true };

test("lightest whites: live slug, matching code, published LRV vs the feed, estimated LRV vs the DB", () => {
  const feeds = new Map([
    ["behr", [{ code: "UPW", name: "Ultra Pure White", hex: "#F8F9F3", lrv: 94 }]],
    ["sherwin-williams", [{ code: "9500", name: "UltraWhite", hex: "#f6f7f2", lrv: 93.5 }]],
  ]);
  const good = [
    W({}),
    W({ brand: "Sherwin-Williams", brandSlug: "sherwin-williams", name: "UltraWhite", code: "SW 9500", slug: "ultrawhite-9500", lrv: 93.5 }),
    W({ ...valsparWhite, lrv: 92.6 }),
  ];
  assert.deepEqual(auditLightestWhites("w.ts", "", good, cat2, feeds), []);
  assert.deepEqual(auditLightestWhites("w.ts", "", good, cat2), []); // no feeds: DB checks only

  // The July 2026 row: Behr W-B-500 at 97.3, not in Behr's live palette.
  const july = auditLightestWhites("w.ts", `x\n  { slug: "ultra-pure-white-w-b-500" }`, [W({ code: "W-B-500", slug: "ultra-pure-white-w-b-500", lrv: 97.3 })], cat2, feeds);
  assert.deepEqual(kinds(july), ["error:whites-data", "warn:whites-data"]);
  assert.equal(july[0].line, 2);
  assert.ok(july.some((x) => /not in Behr's last palette scan/.test(x.message)));

  const wrong = auditLightestWhites(
    "w.ts",
    "",
    [
      W({ lrv: 97.3 }), // feed says 94
      W({ slug: "no-such-row" }),
      W({ code: "PR-W15" }), // code does not match the row, and is not in the feed
      W({ ...valsparWhite, lrv: 95 }),
      W({ source: "estimate from hex" }), // flag and source disagree
    ],
    cat2,
    feeds,
  );
  assert.deepEqual(kinds(wrong), ["error:whites-data", "warn:whites-data", "warn:whites-data", "warn:whites-data", "warn:whites-data", "warn:whites-data"]);
  assert.ok(wrong.some((x) => /published LRV 97.3, Behr's feed says 94/.test(x.message)));
  assert.ok(wrong.some((x) => /estimated LRV 95, DB computes 92.6/.test(x.message)));
});

test("shipped lightest-whites rows are well formed", async () => {
  const { LIGHTEST_WHITES } = await import("../../src/data/lightest-whites.ts");
  for (const r of LIGHTEST_WHITES) {
    assert.match(r.slug, /^[a-z0-9-]+$/);
    assert.match(r.checked, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(r.estimated, /estimate/i.test(r.source), `${r.brand} ${r.name}: estimated flag vs source`);
  }
});
