/**
 * Calibration fixtures for scripts/lib/undertone.ts. Lab values are the stored
 * DB values (data/colors-processed.json, exported 2026-10-11).
 *
 * The fixtures are of two kinds, and the 2026-11 audit found the old header
 * overstated the first:
 * - Sourced: the label matches the manufacturer's own wording where it names
 *   a temperature or hue (SW Agreeable Gray "beige undertone", Mindful Gray
 *   "warm", Passive "cool blue undertones", Hale Navy and Naval as blues).
 *   Where the manufacturer is silent (Revere Pewter, Stonington Gray, Extra
 *   White, Kendall Charcoal) the pin follows the Lab math, not reviewers.
 * - Colorimetric guards: the red, violet, navy and C*-cutoff boundary cases
 *   (Burgundy vs Georgian Brick, the lilacs, Pure White). These are checked
 *   from CIELAB alone and keep the sector boundaries from drifting.
 *
 * The audit's v2 classifier (scratchpad labels/undertone-v2.ts) was NOT
 * adopted: its held-out gain was 2 of 35 colors and its warm/cool/neutral
 * agreement averaged -1.1 points over 300 splits. Only sourced overrides
 * carried over. Run: npm run test:undertone
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUndertone,
  undertoneLabel,
  chromaHue,
  LABEL_MAP,
  NEUTRAL_CHROMA,
  UNDERTONE_OVERRIDES,
} from './undertone';
import { UNDERTONE_LABELS } from '../../src/lib/undertone-utils';

type Fixture = [key: string, hex: string, labA: number, labB: number, expected: string];

const FIXTURES: Fixture[] = [
  // Warm whites, creams and greiges: the bulk of the old Neutral mislabels.
  ['sherwin-williams/alabaster-7008', '#edeae0', -0.72, 5.21, 'Warm (Golden)'],
  ['benjamin-moore/white-dove-oc-17', '#efeee5', -1.2278, 4.4675, 'Warm (Golden)'],
  ['benjamin-moore/swiss-coffee-oc-45', '#eeece1', -1.23, 5.56, 'Warm (Golden)'],
  ['sherwin-williams/greek-villa-7551', '#f0ece2', -0.38, 5.32, 'Warm (Golden)'],
  ['sherwin-williams/agreeable-gray-7029', '#d1cbc1', 0.33, 5.72, 'Warm (Golden)'],
  ['sherwin-williams/accessible-beige-7036', '#d1c7b8', 0.94, 8.75, 'Warm (Golden)'],
  ['sherwin-williams/shoji-white-7042', '#e6dfd3', 0.33, 6.72, 'Warm (Golden)'],
  ['sherwin-williams/natural-linen-9109', '#dfd3c3', 1.47, 9.4, 'Warm (Golden)'],
  ['benjamin-moore/pale-oak-oc-20', '#ddd9ce', -0.55, 5.89, 'Warm (Golden)'],
  ['benjamin-moore/revere-pewter-hc-172', '#ccc7b9', -0.7, 7.62, 'Warm (Golden)'],
  ['benjamin-moore/edgecomb-gray-hc-173', '#dad4c5', -0.51, 8.15, 'Warm (Golden)'],
  ['sherwin-williams/mindful-gray-7016', '#bcb7ad', -0.01, 5.71, 'Warm (Golden)'],
  ['benjamin-moore/simply-white-2143-70', '#f7f7ee', -1.56, 4.32, 'Warm (Golden)'],
  ['sherwin-williams/urbane-bronze-7048', '#54504a', 0.43, 4.12, 'Warm (Golden)'],

  // Green-leaning grays and greens.
  ['sherwin-williams/sea-salt-6204', '#cdd2ca', -3.15, 3.36, 'Cool (Green)'],
  ['benjamin-moore/gray-owl-2137-60', '#d4d5cd', -1.77, 3.83, 'Cool (Green)'],
  ['benjamin-moore/stonington-gray-hc-170', '#cbccc6', -1.43, 2.86, 'Cool (Green)'],
  ['sherwin-williams/evergreen-fog-9130', '#95978a', -3.16, 6.6, 'Cool (Green)'],
  ['benjamin-moore/sherwood-green-hc-118', '#aab696', -9.94, 14.91, 'Cool (Green)'],
  ['sherwin-williams/silver-strand-7057', '#c8cbc4', -2.3, 3.12, 'Cool (Green)'],

  // Navies: a* near 0, so the old a* < -5 gate called them Neutral.
  ['benjamin-moore/hale-navy-hc-154', '#444c57', -0.48, -7.57, 'Cool (Blue)'],
  ['sherwin-williams/naval-6244', '#2f3d4c', -1.37, -10.96, 'Cool (Blue)'],
  ['sherwin-williams/in-the-navy-9178', '#283849', -1.3, -12.52, 'Cool (Blue)'],

  // True neutrals: chroma under 3.
  ['benjamin-moore/chantilly-lace-2121-70', '#f4f6f1', -1.5401, 2.167, 'Neutral'],
  ['sherwin-williams/tricorn-black-6258', '#2f2f30', 0.24, -0.64, 'Neutral'],
  ['sherwin-williams/iron-ore-7069', '#434341', -0.44, 1.21, 'Neutral'],
  ['benjamin-moore/kendall-charcoal-hc-166', '#686763', -0.42, 2.39, 'Neutral'],
  ['sherwin-williams/extra-white-7006', '#eeefea', -1.21, 2.3, 'Neutral'],
  ['benjamin-moore/pure-white-oc-64', '#e5e7e4', -1.2, 1.22, 'Neutral'],

  // Pinks and blue-leaning reds (h under 30).
  ['benjamin-moore/ballet-slippers-1331', '#f8dad8', 10.04, 4.8, 'Warm (Pink)'],
  ['behr/pink-damask-m160-5', '#d98580', 31.66, 16.44, 'Warm (Pink)'],
  ['sherwin-williams/burgundy-6300', '#63333e', 22.93, 2.82, 'Warm (Pink)'],
  ['benjamin-moore/cranberry-cocktail-2083-20', '#84404e', 30.69, 5.25, 'Warm (Pink)'],

  // Orange-leaning reds (h 30-45): brick and tomato reds carry yellow, not pink.
  ['benjamin-moore/georgian-brick-hc-50', '#995a4a', 24.13, 20.32, 'Warm (Golden)'],
  ['sherwin-williams/habanero-chile-7589', '#b8473d', 45.08, 29.77, 'Warm (Golden)'],

  // Violets: the old a* > 8 rule filed most of these as Warm (Pink).
  ['sherwin-williams/forever-lilac-9067', '#afa5c7', 10.29, -16.05, 'Cool (Violet)'],
  ['sherwin-williams/rhapsody-lilac-6828', '#d2c8dd', 7.33, -9.16, 'Cool (Violet)'],
  ['sherwin-williams/inspired-lilac-6820', '#dfd9e4', 4.03, -4.66, 'Cool (Violet)'],
  ['benjamin-moore/spring-lilac-1388', '#ddcede', 8.03, -6.02, 'Cool (Violet)'],
  ['benjamin-moore/dark-lilac-2070-30', '#554e6e', 10.38, -17.37, 'Cool (Violet)'],

  // SW's color page: "Tranquil tones and soothing warmth". No source names
  // green, so the old green override is gone and the Lab result stands.
  ['sherwin-williams/repose-gray-7015', '#ccc9c0', -0.56, 4.86, 'Warm (Golden)'],

  // Sourced overrides (manufacturer wording the Lab math cannot see).
  // SW: "cool blue undertones"; C* 1.6 alone would read Neutral.
  ['sherwin-williams/passive-7064', '#cbccc9', -0.89, 1.37, 'Cool (Blue)'],
  // Farrow & Ball neutral groups.
  ['farrow-ball/pavilion-gray-242', '#c8c3bc', 0.5, 4.13, 'Cool (Blue)'],
  ['farrow-ball/old-white-4', '#c7bfab', -0.59, 11.1, 'Cool (Green)'],
  ['farrow-ball/dimity-2008', '#eee3d3', 1.08, 9.15, 'Warm (Pink)'],
  ['farrow-ball/school-house-white-291', '#e6dfd1', 0, 7.7, 'Neutral'],
];

for (const [key, hex, a, b, expected] of FIXTURES) {
  test(`${key} is ${expected}`, () => {
    assert.equal(undertoneLabel(hex, a, b, key), expected);
  });
}

test('fixture count stays in the 30-50 calibration range', () => {
  assert.ok(FIXTURES.length >= 30 && FIXTURES.length <= 50, `${FIXTURES.length} fixtures`);
});

test('every output label is a site UNDERTONE_LABELS string', () => {
  for (const label of Object.values(LABEL_MAP)) {
    assert.ok((UNDERTONE_LABELS as readonly string[]).includes(label), label);
  }
});

test('every override key is brand-slug/color-slug and maps to a known undertone', () => {
  for (const [key, raw] of Object.entries(UNDERTONE_OVERRIDES)) {
    assert.match(key, /^[a-z0-9-]+\/[a-z0-9-]+$/);
    assert.ok(raw in LABEL_MAP, raw);
  }
});

test('without a key the override does not apply (Passive by Lab alone)', () => {
  assert.equal(undertoneLabel('#cbccc9', -0.89, 1.37), 'Neutral');
});

test('overrides the manufacturer contradicts stay out (2026-11 audit)', () => {
  for (const key of [
    'sherwin-williams/repose-gray-7015', // SW: "soothing warmth"
    'benjamin-moore/revere-pewter-hc-172', // BM: "bridge between warm and cool tones"
    'benjamin-moore/balboa-mist-oc-27', // BM: "pale gray with a slightly warm cast"
    'farrow-ball/elephants-breath-229', // F&B: lilac with "a modern warmth"
  ]) {
    assert.equal(UNDERTONE_OVERRIDES[key], undefined, key);
  }
});

test('chroma just under and at the neutral threshold', () => {
  assert.equal(computeUndertone('#000000', 0, NEUTRAL_CHROMA - 0.01), 'balanced');
  assert.equal(computeUndertone('#000000', 0, NEUTRAL_CHROMA), 'golden');
});

test('hue angle wraps: a* > 0 with small negative b* is pink, not violet', () => {
  const { hue } = chromaHue(10, -1);
  assert.ok(hue > 350 && hue < 360);
  assert.equal(computeUndertone('#000000', 10, -1), 'pink');
});

test('falls back to Lab derived from hex when Lab is missing', () => {
  // Hale Navy's hex alone still reads blue; pure gray reads neutral.
  assert.equal(undertoneLabel('#444c57', null, null), 'Cool (Blue)');
  assert.equal(undertoneLabel('#808080', null, null), 'Neutral');
  assert.equal(undertoneLabel('not-a-hex', null, null), 'Neutral');
});
