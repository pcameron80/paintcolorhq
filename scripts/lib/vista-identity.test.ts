import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { patchFor, validatePlan, type IdentityPlan } from './vista-identity';

const plan = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/vista-identity-plan.json'), 'utf8'),
) as IdentityPlan;

test('the committed plan is sound', () => {
  assert.deepEqual(validatePlan(plan), []);
  assert.equal(plan.ops.filter((o) => o.op === 'assign').length, 11);
  assert.equal(plan.ops.filter((o) => o.op === 'restore').length, 10);
});

test('Golden Ray: the same-name legacy row takes 7869 from sporty-yellow-k-1203', () => {
  const take = plan.ops.find((o) => o.slug === 'golden-ray-k-472')!;
  assert.equal(take.set.color_number, '7869');
  assert.deepEqual(take.set.alternate_numbers, ['K-472']);
  assert.equal(take.set.hex, '#ffc923');
  const give = plan.ops.find((o) => o.slug === 'sporty-yellow-k-1203')!;
  assert.equal(give.op, 'restore');
  assert.equal(give.expect.color_number, '7869');
  assert.equal(give.set.color_number, 'K-1203');
  assert.equal(give.set.name, 'Sporty Yellow');
  assert.equal(give.set.last_seen_live_on, null);
});

test('the crossed pair: evoultion-c-129 gives 8685 to Wendy Way and takes 0130 Evolution from Madder', () => {
  const evo = plan.ops.find((o) => o.slug === 'evoultion-c-129')!;
  assert.equal(evo.expect.color_number, '8685');
  assert.equal(evo.set.color_number, '0130');
  assert.equal(evo.set.name, 'Evolution');
  assert.equal(plan.ops.find((o) => o.slug === 'wendy-way-k-1128')!.set.color_number, '8685');
  const madder = plan.ops.find((o) => o.slug === 'madder-c-1321')!;
  assert.equal(madder.set.color_number, 'C-1321');
  assert.equal(madder.set.name, 'Madder');
});

test('plum-cake-1232 only gets its C- prefix back', () => {
  const p = plan.ops.find((o) => o.slug === 'plum-cake-1232')!;
  assert.deepEqual(patchFor(p, 'vista-paint/plum-cake-1232'), { alternate_numbers: ['C-1232'] });
});

test('patchFor recomputes every hex-derived column and keeps a published LRV', () => {
  const p = patchFor(
    { op: 'assign', slug: 'x', expect: { color_number: 'K-1', hex: '#000000' }, set: { color_number: '7869', name: 'Golden Ray', hex: '#FFC923', lrv: 61 }, source: '' },
    'vista-paint/x',
  );
  assert.equal(p.hex, '#ffc923');
  assert.deepEqual([p.rgb_r, p.rgb_g, p.rgb_b], [255, 201, 35]);
  assert.equal(p.lrv, 61);
  assert.equal(p.color_family, 'yellow');
  assert.ok(p.undertone && p.lab_l! > 80);
  const computed = patchFor({ ...plan.ops[0], set: { hex: '#808080', lrv: null } }, 'vista-paint/x');
  assert.equal(computed.lrv, 21.6);
});

test('validatePlan catches a live code assigned twice or released to nobody', () => {
  const bad: IdentityPlan = {
    brand: 'vista-paint',
    ops: [
      { op: 'assign', slug: 'a', expect: { color_number: 'K-1', hex: '#111111' }, set: { color_number: '7000', name: 'A', hex: '#111111' }, source: '' },
      { op: 'assign', slug: 'b', expect: { color_number: 'K-2', hex: '#111111' }, set: { color_number: '7000', name: 'A', hex: '#111111' }, source: '' },
      { op: 'restore', slug: 'c', expect: { color_number: '7001', hex: '#111111' }, set: { color_number: 'C-9', name: 'C' }, source: '' },
    ],
  };
  const errors = validatePlan(bad);
  assert.ok(errors.some((e) => /7000 assigned to a and b/.test(e)));
  assert.ok(errors.some((e) => /gives up live code 7001/.test(e)));
});
