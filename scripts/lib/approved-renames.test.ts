import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APPROVED_RENAMES, FORMER_NAME_ARTIFACTS } from './approved-renames';
import { FORMER_NAMES, formerNameFor } from '../../src/lib/former-names';

test('every approved rename keeps its old name in former-names.ts', () => {
  for (const [key, r] of Object.entries(APPROVED_RENAMES)) {
    if (r.spelling) {
      assert.equal(FORMER_NAMES[key], undefined, `${key} is a spelling fix and must not show a former name`);
    } else {
      assert.equal(FORMER_NAMES[key], r.former, `${key} needs "${r.former}" in FORMER_NAMES`);
    }
  }
  for (const [key, former] of Object.entries(FORMER_NAME_ARTIFACTS)) assert.equal(FORMER_NAMES[key], former);
});

test('approved names are clean', () => {
  for (const [key, r] of Object.entries(APPROVED_RENAMES)) {
    assert.notEqual(r.former, r.name, key);
    assert.doesNotMatch(r.name, /&#|[‐‑—]|[a-z]['’][A-Z]/, key);
    assert.doesNotMatch(r.former, /[‐‑]/, `${key}: write the former name with a plain hyphen`);
  }
});

test('the brief\'s counts and the MP-49 exclusions hold', () => {
  const keys = Object.keys(APPROVED_RENAMES);
  assert.equal(keys.filter((k) => k.startsWith('sherwin-williams/')).length, 9);
  assert.equal(keys.filter((k) => k.startsWith('ppg/')).length + Object.keys(FORMER_NAME_ARTIFACTS).length, 38);
  assert.ok(!keys.some((k) => /indian-white-35|portrait-tone-39/.test(k)));
  assert.equal(APPROVED_RENAMES['sherwin-williams/less-brown-6040'].name, 'Nutshell');
  assert.equal(APPROVED_RENAMES['ppg/navajo-white-1101-2'].name, 'Sugar Cookie');
  assert.equal(APPROVED_RENAMES['ppg/indian-muslin-1075-2'].name, 'Alley Caty');
});

test('formerNameFor shows the old name only after the rename lands', () => {
  // Before the DB write: same name (one with U+2010), so the page is unchanged.
  assert.equal(formerNameFor('sherwin-williams', 'well-bred-brown-7027', 'Well\u2010Bred Brown'), undefined);
  assert.equal(formerNameFor('sherwin-williams', 'less-brown-6040', 'Less Brown'), undefined);
  // After it.
  assert.equal(formerNameFor('sherwin-williams', 'less-brown-6040', 'Nutshell'), 'Less Brown');
  assert.equal(formerNameFor('sherwin-williams', 'well-bred-brown-7027', 'Hickory Smoke'), 'Well-Bred Brown');
  assert.equal(formerNameFor('sherwin-williams', 'alabaster-7008', 'Alabaster'), undefined);
});
