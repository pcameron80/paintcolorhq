// Preset paints for the room visualizer's trim, window and cabinet regions.
//
// Walls get their swatches from the page that opened the visualizer; these
// regions had none, so a visitor started from a single color. Each list covers
// the jobs the surface is usually painted for: clean, warm and soft whites for
// trim, whites, greige, greens, navies and dark neutrals for cabinets, and the
// black, bronze and white that window frames come in. Ids, hex values and
// slugs are the catalog's (checked 2026-10-31), so a preset saves to a project
// as that exact paint and links to its color page.

export interface PresetPaint {
  id: string;
  name: string;
  brand: string;
  brandSlug: string;
  number: string;
  slug: string;
  hex: string;
}

const SW = { brand: "Sherwin-Williams", brandSlug: "sherwin-williams" };
const BM = { brand: "Benjamin Moore", brandSlug: "benjamin-moore" };

const PAINTS = {
  pureWhite: { ...SW, id: "31acd35a-ece3-480c-ba53-321cb6b2fd42", name: "Pure White", number: "SW 7005", slug: "pure-white-7005", hex: "#EDECE6" },
  extraWhite: { ...SW, id: "43638318-d603-4f65-9e5c-7598268f249c", name: "Extra White", number: "SW 7006", slug: "extra-white-7006", hex: "#EEEFEA" },
  alabaster: { ...SW, id: "355ff048-6b5e-4aa6-b4a4-ee66055068ec", name: "Alabaster", number: "SW 7008", slug: "alabaster-7008", hex: "#EDEAE0" },
  chantillyLace: { ...BM, id: "c798ce15-98ec-4751-90be-8ba3bd14629e", name: "Chantilly Lace", number: "2121-70", slug: "chantilly-lace-2121-70", hex: "#F4F6F1" },
  whiteDove: { ...BM, id: "2c655797-9532-4c5a-bd20-7d3aaf3df999", name: "White Dove", number: "OC-17", slug: "white-dove-oc-17", hex: "#EFEEE5" },
  reverePewter: { ...BM, id: "45d69383-d8b9-41c4-959d-9532ac2866ac", name: "Revere Pewter", number: "HC-172", slug: "revere-pewter-hc-172", hex: "#CCC7B9" },
  evergreenFog: { ...SW, id: "65eed008-2713-43d7-8148-85c05e2c937e", name: "Evergreen Fog", number: "SW 9130", slug: "evergreen-fog-9130", hex: "#95978A" },
  websterGreen: { ...BM, id: "1f9ba534-dcc4-4d6c-968e-02ed78ffadae", name: "Webster Green", number: "HC-130", slug: "webster-green-hc-130", hex: "#65816D" },
  pewterGreen: { ...SW, id: "ca055762-31dd-4053-bc1f-062f2aee7290", name: "Pewter Green", number: "SW 6208", slug: "pewter-green-6208", hex: "#5E6259" },
  haleNavy: { ...BM, id: "367c23ad-8a7c-4749-81b2-534d2d020780", name: "Hale Navy", number: "HC-154", slug: "hale-navy-hc-154", hex: "#444C57" },
  naval: { ...SW, id: "2d37e5de-0b21-4da7-870e-c2d94ee13b61", name: "Naval", number: "SW 6244", slug: "naval-6244", hex: "#2F3D4C" },
  urbaneBronze: { ...SW, id: "e23e85c9-a5fa-4f7f-8426-0dbae13a2620", name: "Urbane Bronze", number: "SW 7048", slug: "urbane-bronze-7048", hex: "#54504A" },
  ironOre: { ...SW, id: "65806ca2-ce4a-4a1e-b1a7-d24842b0b747", name: "Iron Ore", number: "SW 7069", slug: "iron-ore-7069", hex: "#434341" },
  wroughtIron: { ...BM, id: "aa5f06d6-3390-45a1-aa73-c6e2b61294b8", name: "Wrought Iron", number: "2124-10", slug: "wrought-iron-2124-10", hex: "#4A4B4C" },
  tricornBlack: { ...SW, id: "18848bc1-2acf-41f9-ae8a-e023a5637e17", name: "Tricorn Black", number: "SW 6258", slug: "tricorn-black-6258", hex: "#2F2F30" },
} satisfies Record<string, PresetPaint>;

const P = PAINTS;

export const VISUALIZER_PRESETS = {
  trim: [P.pureWhite, P.extraWhite, P.chantillyLace, P.whiteDove, P.alabaster, P.tricornBlack],
  cabinets: [P.whiteDove, P.alabaster, P.reverePewter, P.evergreenFog, P.websterGreen, P.pewterGreen, P.haleNavy, P.naval, P.urbaneBronze, P.ironOre],
  windows: [P.tricornBlack, P.wroughtIron, P.ironOre, P.urbaneBronze, P.pureWhite, P.chantillyLace],
} satisfies Record<string, PresetPaint[]>;

/** The preset with this hex, if any (case-insensitive). */
export function presetForHex(hex: string): PresetPaint | undefined {
  const h = hex.toUpperCase();
  return Object.values(PAINTS).find((p) => p.hex === h);
}
