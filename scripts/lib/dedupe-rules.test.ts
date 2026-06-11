import { test } from "node:test";
import assert from "node:assert/strict";
import { pickCanonical, dupeGroupKey } from "./dedupe-rules";

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
