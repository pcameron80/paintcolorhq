import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBehrCode, normalizePpgCode, parsePpgPage, parseDunnEdwardsLrv, SOURCES } from './palette-sources';

test('Behr codes drop leading zeros after a non-digit only', () => {
  assert.equal(normalizeBehrCode('PR-W05'), 'PR-W5');
  assert.equal(normalizeBehrCode('PPU18-06'), 'PPU18-6');
  assert.equal(normalizeBehrCode('DC-001'), 'DC-1');
  assert.equal(normalizeBehrCode('1850'), '1850');
  assert.equal(normalizeBehrCode('W-B-500'), 'W-B-500');
  assert.equal(normalizeBehrCode('S-H-100'), 'S-H-100');
  assert.equal(normalizeBehrCode('PPH-01 (HISP)'), 'PPH-1 (HISP)');
  assert.equal(SOURCES.behr.normalizeCode, normalizeBehrCode);
});

test('PPG codes drop the PPG and COL prefixes', () => {
  assert.equal(normalizePpgCode('PPG14-28'), '14-28');
  assert.equal(normalizePpgCode('PPG-SS-30'), 'SS-30');
  assert.equal(normalizePpgCode('COL1104-2'), '1104-2');
  assert.equal(normalizePpgCode('20YY 83/075'), '20YY 83/075');
  assert.equal(SOURCES.ppg.normalizeCode, normalizePpgCode);
});

test('PPG page: name and code from <title>, R/G/B and LRV from the bold labels', () => {
  const html =
    '<title>Aldabra - PPG14-28 Paint Color | PPG Paints</title>' +
    '<div class="color-details_rgb"><p><b>R:</b> 170 <b>G:</b> 164 <b>B:</b> 146 <b>LRV:</b> 36</p></div>';
  assert.deepEqual(parsePpgPage(html), { code: 'PPG14-28', name: 'Aldabra', hex: '#aaa492', lrv: 36 });
  const voc = parsePpgPage('<title>Almond Wisp - 20YY 83/075 Paint Color | PPG Paints</title>');
  assert.equal(voc?.code, '20YY 83/075');
  assert.equal(voc?.hex, null);
  assert.equal(parsePpgPage('<title>Harper&#x27;s Blue - 70BG 43/103 Paint Color | PPG Paints</title>')?.name, "Harper's Blue");
  assert.equal(parsePpgPage('<title>Gigiâ€™s Golden Locket - 20YY 29/351 Paint Color | PPG Paints</title>')?.name, "Gigi's Golden Locket");
  assert.equal(parsePpgPage('<title>PPG Paints is now Pittsburgh Paints</title>'), null);
});

test('Dunn-Edwards LRV from the tag-stripped page', () => {
  const html = '<li><strong>Light Reflectance Value:</strong> <span>LRV 84</span></li>';
  assert.equal(parseDunnEdwardsLrv(html), 84);
  assert.equal(parseDunnEdwardsLrv('<p>Light Reflectance Value: LRV 7.5</p>'), 7.5);
  assert.equal(parseDunnEdwardsLrv('<p>no value</p>'), undefined);
});
