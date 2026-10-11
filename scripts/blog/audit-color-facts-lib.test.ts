import { test } from "node:test";
import assert from "node:assert/strict";
import { hexToRgb, rgbToLab, deltaE2000 } from "../../src/lib/color-utils.ts";
import { Catalog, auditText, normName, type AuditColor } from "./audit-color-facts-lib.ts";

const BRAND_NAMES: Record<string, string> = {
  "benjamin-moore": "Benjamin Moore",
  "sherwin-williams": "Sherwin-Williams",
  behr: "Behr",
  ppg: "PPG",
  valspar: "Valspar",
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
