import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffPalette, normName, normHex, type DbColor, type LiveColor } from './palette-diff';

const row = (over: Partial<DbColor>): DbColor => ({
  color_number: '6150',
  alternate_numbers: null,
  name: 'Universal Khaki',
  hex: '#b8a992',
  slug: 'universal-khaki-6150',
  is_archived: false,
  ...over,
});

const live = (over: Partial<LiveColor>): LiveColor => ({
  code: '6150',
  name: 'Universal Khaki',
  hex: '#B8A992',
  ...over,
});

test('code match is case- and whitespace-insensitive', () => {
  const d = diffPalette([live({ code: ' 50bb  13/104 ' })], [row({ color_number: '50BB 13/104' })]);
  assert.equal(d.matched, 1);
  assert.equal(d.missing.length, 0);
});

test('alternate_numbers count as present (BM dual numbers)', () => {
  const d = diffPalette([live({ code: 'OC-1' })], [row({ color_number: '950', alternate_numbers: ['OC-1'] })]);
  assert.equal(d.matched, 1);
  assert.equal(d.notLive.length, 0);
});

test('normalizeCode maps manufacturer codes onto the DB convention', () => {
  const d = diffPalette([live({ code: 'No. 239' })], [row({ color_number: '239' })], {
    normalizeCode: (c) => c.replace(/^No\.\s*/i, ''),
  });
  assert.equal(d.matched, 1);
});

test('normalizeCode is applied to DB codes too', () => {
  const norm = (c: string) => c.replace(/^SW\s*/i, '').replace(/^0+(?=\d)/, '');
  const d = diffPalette(
    [live({ code: '0001' }), live({ code: '6980' })],
    [row({ color_number: '1' }), row({ color_number: 'SW 6980' })],
    { normalizeCode: norm },
  );
  assert.equal(d.matched, 2);
  assert.equal(d.notLive.length, 0);
});

test('unknown code is missing; same name under another code is flagged as a likely renumber', () => {
  const d = diffPalette(
    [live({ code: '9999', name: 'Brand New' }), live({ code: '0471', name: 'Universal  khaki' })],
    [row({})],
  );
  assert.equal(d.missing.length, 2);
  assert.equal(d.missing[0].dbCodeForName, undefined);
  assert.equal(d.missing[1].dbCodeForName, '6150');
});

test('keep() and hexless entries are filtered, not reported missing', () => {
  const d = diffPalette(
    [live({ code: 'ST-1' }), live({ code: 'X1', hex: null }), live({ code: 'X2', hex: 'nope' })],
    [],
    { keep: (c) => !c.code.startsWith('ST-') },
  );
  assert.equal(d.missing.length, 0);
  assert.equal(d.filtered, 3);
});

test('active DB rows absent from live are notLive; archived rows are not', () => {
  const d = diffPalette(
    [live({})],
    [row({}), row({ color_number: '1111', slug: 'gone' }), row({ color_number: '2222', is_archived: true })],
  );
  assert.deepEqual(d.notLive.map((r) => r.code), ['1111']);
});

test('hex drift below threshold is ignored; a real change is reported', () => {
  const small = diffPalette([live({ hex: '#b8a993' })], [row({})]);
  assert.equal(small.hexChanged.length, 0);
  const big = diffPalette([live({ hex: '#5a6e8c' })], [row({})]);
  assert.equal(big.hexChanged.length, 1);
  assert.ok(big.hexChanged[0].deltaE > 2);
});

test('duplicate live codes are counted once', () => {
  const d = diffPalette([live({ code: '12' }), live({ code: '12' })], [row({ color_number: '12' })]);
  assert.equal(d.matched, 1);
});

test('normName and normHex', () => {
  assert.equal(normName("Farrow & Ball's  Café"), 'farrow and ball s cafe');
  assert.equal(normHex('FFD5CB'), '#ffd5cb');
  assert.equal(normHex('#fff'), null);
});
