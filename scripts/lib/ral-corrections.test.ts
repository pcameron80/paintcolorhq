import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { decideRal, ralLrv, yFromL, type RalReference } from './ral-corrections';

const refs = new Map(
  (JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/ral-classic-reference.json'), 'utf8')) as { colors: RalReference[] }).colors.map(
    (r) => [r.code, r],
  ),
);
const ref = (code: string) => refs.get(code)!;

test('reference covers the 213 catalog codes, 23 of them effect colors', () => {
  assert.equal(refs.size, 213);
  assert.equal([...refs.values()].filter((r) => r.effect).length, 23);
  assert.equal(ref('9010').siteHex, '#efeee5');
});

test('RAL 9010 Pure White: stored #ffffff takes the swatch and the published LRV 84', () => {
  const d = decideRal('#ffffff', ref('9010'));
  assert.equal(d.action, 'apply');
  assert.ok(d.dSite > 5);
  assert.equal(d.lrv, 84);
});

test('RAL 1017 Saffron Yellow: the swatch is closer to RAL Lab than the stored hex, so it applies', () => {
  assert.equal(decideRal('#f5d033', ref('1017')).action, 'apply');
});

test('RAL 8011 Nut Brown: stored is 0.8 dE from RAL Lab, the swatch 3.8, so it is held', () => {
  const d = decideRal('#5b3a29', ref('8011'));
  assert.equal(d.action, 'hold-gamut');
  assert.ok(d.dSiteLab! > d.dStoredLab! + 1);
});

test('RAL 5015 Sky Blue: stored is within 2 dE of the swatch, left alone', () => {
  assert.equal(decideRal('#2271b3', ref('5015')).action, 'ok');
});

test('effect colors are never written', () => {
  assert.equal(decideRal('#ffff00', ref('1026')).action, 'effect');
});

test('LRV comes from the published figure, else from Lab Y, never from the screen hex', () => {
  assert.equal(ralLrv({ ...ref('9010') }), 84);
  assert.equal(ralLrv({ ...ref('9010'), publishedLrv: null }), yFromL(ref('9010').lab!.L));
  assert.equal(ralLrv({ ...ref('9010'), publishedLrv: null, lab: null }), null);
  assert.equal(yFromL(100), 100);
  assert.ok(Math.abs(yFromL(50) - 18.4) < 0.1);
});
