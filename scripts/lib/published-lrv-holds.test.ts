import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLrvHeld, LRV_HOLD_CODES } from './published-lrv-holds';

test('the eight 2026-11 audit codes are held, in either PPG spelling', () => {
  for (const c of ['1031-1', 'PPG1031-1', '1235-1', 'PPG1235-1']) assert.ok(isLrvHeld('ppg', c), c);
  for (const c of ['7152', '7329', '7386', 'AC124', 'H0027', '8560', 'ac124 ']) assert.ok(isLrvHeld('vista-paint', c), c);
});

test('holds are exact and per brand', () => {
  assert.equal(isLrvHeld('hirshfields', 'H0027'), false); // Hirshfield's 27.9 is right
  assert.equal(isLrvHeld('vista-paint', '71520'), false);
  assert.equal(isLrvHeld('vista-paint', '8561'), false);
  assert.equal(isLrvHeld('ppg', '1031-2'), false);
  assert.equal(isLrvHeld('behr', '7152'), false);
});

test('every held code is upper-case and carries a reason', () => {
  for (const codes of Object.values(LRV_HOLD_CODES)) {
    for (const [code, reason] of Object.entries(codes)) {
      assert.equal(code, code.toUpperCase());
      assert.ok(reason.length > 10, code);
    }
  }
});
