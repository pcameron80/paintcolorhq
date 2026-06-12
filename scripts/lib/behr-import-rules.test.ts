import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLivePalette,
  shouldImport,
  titleCaseName,
  makeSlug,
  type LiveColor,
} from './behr-import-rules';
import { classifyColorFamily, calculateLrv, rgbToLab, hexToRgb } from './color-math';

const color = (over: Partial<LiveColor>): LiveColor => ({
  id: 'S350-4A',
  name: 'DRIED ROSEMARY',
  hex: '#a7a07e',
  isLegacy: false,
  ...over,
});

test('spray ids and GLOSS names are excluded', () => {
  assert.equal(shouldImport(color({ id: '6794', name: 'SILVER GRAY - GLOSS' })), false);
  assert.equal(shouldImport(color({ id: '6694', name: 'SILVER GRAY' })), false);
  assert.equal(shouldImport(color({})), true);
});

test('classic ready-mix whites (numeric ids) are kept', () => {
  assert.equal(shouldImport(color({ id: '12', name: 'SWISS COFFEE', hex: '#f3f2e6' })), true);
  assert.equal(shouldImport(color({ id: '1850', name: 'ULTRA PURE WHITE', hex: '#ffffff' })), true);
});

test('legacy and malformed-hex entries are excluded', () => {
  assert.equal(shouldImport(color({ isLegacy: true })), false);
  assert.equal(shouldImport(color({ hex: 'rgb(1,2,3)' })), false);
});

test('parseLivePalette dedupes repeated ids', () => {
  const raw = {
    header: ['id', 'name', 'rgb', 'islegacycolor'],
    count: 3,
    rows: [
      ['52', 'WHITE', '#FFFFFF', 'false'],
      ['52', 'WHITE', '#FFFFFF', 'false'],
      ['DC-001', 'WHIPPED CREAM', '#F6F5EF', 'false'],
    ],
  };
  const parsed = parseLivePalette(raw);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed.map((c) => c.id), ['52', 'DC-001']);
  assert.equal(parsed[1].hex, '#f6f5ef');
});

test('titleCaseName lowercases small words but not the first word', () => {
  assert.equal(titleCaseName('PEACH OF MIND'), 'Peach of Mind');
  assert.equal(titleCaseName('THE REAL TEAL'), 'The Real Teal');
  assert.equal(titleCaseName('SEMI-SWEET'), 'Semi-Sweet');
});

test('makeSlug matches the existing DB slug shape', () => {
  assert.equal(makeSlug('Dried Rosemary', 'S350-4A'), 'dried-rosemary-s350-4a');
  assert.equal(makeSlug('Whipped Cream', 'DC-001'), 'whipped-cream-dc-001');
  assert.equal(makeSlug("Will O' The Wisp", '23'), 'will-o-the-wisp-23');
});

test('color math reproduces the manually-verified Dried Rosemary row', () => {
  const rgb = hexToRgb('#A7A07E')!;
  assert.deepEqual(rgb, { r: 167, g: 160, b: 126 });
  assert.equal(classifyColorFamily(rgb.r, rgb.g, rgb.b), 'neutral');
  assert.equal(Math.round(calculateLrv(rgb.r, rgb.g, rgb.b) * 10) / 10, 34.9);
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
  assert.ok(Math.abs(lab.l - 65.64) < 0.05, `lab.l=${lab.l}`);
  assert.ok(Math.abs(lab.a - -3.08) < 0.05, `lab.a=${lab.a}`);
  assert.ok(Math.abs(lab.b_val - 18.68) < 0.05, `lab.b=${lab.b_val}`);
});
