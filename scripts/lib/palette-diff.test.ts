import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffPalette, normName, normHex, caseFix, type DbColor, type LiveColor } from './palette-diff';

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

test('an alias never overrides the swatch of the row\'s own code', () => {
  const d = diffPalette(
    [live({ code: 'HC-190', hex: '#313132' }), live({ code: 'PM-9', hex: '#2b2c2d' })],
    [row({ color_number: 'HC-190', alternate_numbers: ['PM-9'], hex: '#323233' })],
  );
  assert.equal(d.hexChanged.length, 0);
  // With the own code absent from the feed, the alias is the only evidence and is used.
  const alone = diffPalette([live({ code: 'PM-9', hex: '#5a6e8c' })], [row({ color_number: 'HC-190', alternate_numbers: ['PM-9'] })]);
  assert.equal(alone.hexChanged.length, 1);
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

test('every DB row that owns a code is compared, not just the first', () => {
  const norm = (c: string) => c.replace(/(^|\D)0+(?=\d)/g, '$1');
  const db = [
    row({ color_number: 'PR-W05', slug: 'twin-pr-w05', hex: '#b8a992' }),
    row({ color_number: 'PR-W5', slug: 'twin-pr-w5', hex: '#5a6e8c' }),
  ];
  const d = diffPalette([live({ code: 'PR-W5', hex: '#b8a992' })], db, { normalizeCode: norm });
  assert.equal(d.matched, 1);
  assert.equal(d.notLive.length, 0);
  // Only the second row's swatch is wrong; it must be reported on its own slug.
  assert.deepEqual(d.hexChanged.map((h) => h.slug), ['twin-pr-w5']);

  const both = diffPalette([live({ code: 'PR-W5', hex: '#2b2c2d' })], db, { normalizeCode: norm });
  assert.deepEqual(both.hexChanged.map((h) => h.slug).sort(), ['twin-pr-w05', 'twin-pr-w5']);
});

test('duplicate codes are listed with each row compared to the live swatch', () => {
  const d = diffPalette(
    [live({ code: '6150', hex: '#b8a992' })],
    [row({ slug: 'a' }), row({ slug: 'b', hex: '#5a6e8c' }), row({ color_number: '7000', slug: 'c' })],
  );
  assert.equal(d.duplicateCodes.length, 1);
  const dup = d.duplicateCodes[0];
  assert.equal(dup.code, '6150');
  assert.equal(dup.liveHex, '#b8a992');
  assert.deepEqual(dup.rows.map((r) => r.slug), ['a', 'b']);
  assert.equal(dup.rows[0].deltaE, 0);
  assert.ok((dup.rows[1].deltaE ?? 0) > 2);
});

test('caseFix repairs import artifacts only, never copies the feed\'s title case', () => {
  assert.equal(caseFix("Painter'S White", "Painter's White"), "Painter's White");
  assert.equal(caseFix("Queen Anne'S Lace", "Queen Anne's Lace"), "Queen Anne's Lace");
  assert.equal(caseFix('Nypd', 'NYPD'), 'NYPD');
  assert.equal(caseFix('Midnight In Ny', 'Midnight in NY'), 'Midnight In NY');
  assert.equal(caseFix('Shell White Rm', 'Shell White RM'), 'Shell White RM');
  assert.equal(caseFix('A Touch of Gold', 'A Touch Of Gold'), 'A Touch of Gold');
  assert.equal(caseFix('Hush-a-bye', 'Hush-A-Bye'), 'Hush-a-bye');
  assert.equal(caseFix('Wabi-Sabi', 'Wabi-sabi'), 'Wabi-Sabi');
  assert.equal(caseFix("O'Reilly Green", "O'reilly Green"), "O'Reilly Green");
});

test('an alias answers only when no row owns the code', () => {
  const owner = row({ color_number: 'OC-1', slug: 'owner', hex: '#b8a992' });
  const aliased = row({ color_number: '950', alternate_numbers: ['OC-1'], slug: 'aliased', hex: '#5a6e8c' });
  const d = diffPalette([live({ code: 'OC-1', hex: '#b8a992' })], [aliased, owner]);
  assert.equal(d.hexChanged.length, 0);
  // Without the owner, the alias is the match.
  const alone = diffPalette([live({ code: 'OC-1', hex: '#b8a992' })], [aliased]);
  assert.deepEqual(alone.hexChanged.map((h) => h.slug), ['aliased']);
});
