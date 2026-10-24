import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HEAD_KEYS, LRV_CEILING, feedLrvIndex, namesAgree, publishedLrv, scanDate } from './lrv-source';

test('publishedLrv rejects feed values that are not LRVs', () => {
  assert.equal(publishedLrv('sherwin-williams', '9500', 93.5), 93.5);
  assert.equal(publishedLrv('dunn-edwards', 'DE5553', 92), 92);
  assert.equal(publishedLrv('benjamin-moore', 'HC-154', 8.36), 8.4);
  // SW encodes "none" as 0 (6995 Superwhite, archived 2927 Weathervane).
  assert.equal(publishedLrv('sherwin-williams', '2927', 0), null);
  assert.equal(publishedLrv('sherwin-williams', '2927', undefined), null);
  assert.equal(publishedLrv('ppg', '15-27', 101), null);
  // BM premixed PM- codes carry their own LRV; Vista R codes print L*.
  assert.equal(publishedLrv('benjamin-moore', 'PM-1', 89.1), null);
  assert.equal(publishedLrv('vista-paint', 'R132', 32.7), null);
  assert.equal(publishedLrv('vista-paint', 'r132', 32.7), null);
  // Only those brands skip those prefixes.
  assert.equal(publishedLrv('vista-paint', '8480', 46), 46);
  assert.equal(publishedLrv('dunn-edwards', 'R132', 40), 40);
});

test('feedLrvIndex matches color_number, then alternates, through normalizeCode', () => {
  const feed = feedLrvIndex('ppg', [
    { code: 'PPG1104-2', name: 'Aldabra', lrv: 36 },
    { code: 'PPG1104-2', name: 'Duplicate', lrv: 99 },
    { code: 'PPG15-06', name: 'White Chip', lrv: 0 },
  ]);
  assert.equal(feed.size, 1);
  assert.equal(feed.lookup({ color_number: '1104-2', alternate_numbers: null })?.published, 36);
  assert.equal(feed.lookup({ color_number: 'X', alternate_numbers: ['ppg1104-2'] })?.name, 'Aldabra');
  assert.equal(feed.lookup({ color_number: '15-06', alternate_numbers: null }), undefined);

  const behr = feedLrvIndex('behr', [{ code: 'PR-W5', name: 'Ultra Pure White', lrv: 94 }]);
  assert.equal(behr.lookup({ color_number: 'PR-W05', alternate_numbers: [] })?.published, 94);
});

test('namesAgree tolerates case, accents, marks and truncation, not renames', () => {
  assert.ok(namesAgree('Almond', 'Almond Bisque'));
  assert.ok(namesAgree('Crème de Menthe', 'Creme De Menthe'));
  assert.ok(namesAgree("Lamb's Wool", 'Lambs Wool®'));
  assert.ok(!namesAgree('White', 'Warm White'));
  assert.ok(!namesAgree('Exhuberant Orange', 'Exuberant Orange'));
  assert.ok(!namesAgree('', 'Anything'));
});

test('scanDate reads the dated scan folder', () => {
  assert.equal(scanDate('data/brand-scans/2026-10-24'), '2026-10-24');
  assert.equal(scanDate('/abs/data/brand-scans/2026-10-11/'), '2026-10-11');
  assert.equal(scanDate('data/brand-scans'), null);
});

test('head keys and ceiling', () => {
  assert.equal(HEAD_KEYS.size, 13);
  assert.ok(HEAD_KEYS.has('sherwin-williams/alabaster-7008'));
  // SW 9500 UltraWhite, the brightest published white we hold, sits under the ceiling.
  assert.ok(93.5 < LRV_CEILING);
});
