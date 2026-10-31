import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyPunctuation, mergePunctuation } from './name-punctuation';

// [db, feed, class, expected written name] from the 2026-11 audit
// (finding feed-names-punctuation; feeds of 2026-10-31).
const CASES: [string, string, string, string | null][] = [
  ['Strawberryncream', "Strawberry 'n Cream", 'punctuation', "Strawberry 'n Cream"],
  ['Bananappeal', 'Banan-Appeal', 'punctuation', 'Banan-Appeal'],
  ['Squishsquash', 'Squish-Squash', 'punctuation', 'Squish-Squash'],
  ['Unteal We Meet Again', 'Un-Teal We Meet Again', 'punctuation', 'Un-Teal We Meet Again'],
  ['Smoke Mirrors', 'Smoke & Mirrors', 'punctuation', 'Smoke & Mirrors'],
  ['St Johns Bay', "St. John's Bay", 'punctuation', "St. John's Bay"],
  ['Gi Green', 'G.I. Green', 'punctuation', 'G.I. Green'],
  ['Natures Reflection', 'Nature’s Reflection', 'punctuation', "Nature's Reflection"],
  ['Norwester', "Nor'wester", 'punctuation', "Nor'wester"],
  ['Its A Girl', "It's A Girl", 'punctuation', "It's A Girl"],
  ['Peaches N Cream', "Peaches 'n Cream", 'punctuation', "Peaches 'n Cream"],
  ['Mt Rainier Gray', 'Mt. Rainier Gray', 'punctuation', 'Mt. Rainier Gray'],
  ['How Blue Am I', 'How Blue Am I?', 'punctuation', 'How Blue Am I?'],
  // Feed title-casing is not copied: "to" keeps the catalog's lower case.
  ['Bride to Be', 'Bride-To-Be', 'punctuation', 'Bride-to-Be'],
  ['Cup O Java', "Cup o' Java", 'punctuation', "Cup o' Java"],
  ['Fun N Games', "Fun 'n Games", 'punctuation', "Fun 'n Games"],
  ['California Dreamin', "California Dreamin'", 'punctuation', "California Dreamin'"],
  ['Neo Mediterranean Mist', 'Neo-Mediterranean Mist', 'punctuation', 'Neo-Mediterranean Mist'],
  // Word joins need their own flag.
  ['Tear Drop', 'Teardrop', 'word-join', 'Teardrop'],
  ['Black Jack', 'Blackjack', 'word-join', 'Blackjack'],
  ['Tea Green', 'Teagreen', 'word-join', 'Teagreen'],
  // Accents
  ['Cafe Noir', 'Café Noir', 'accent', 'Café Noir'],
  ['Creme De La Creme', 'Crème De La Crème', 'accent', 'Crème De La Crème'],
  ['A la Mode', 'À la Mode', 'accent', 'À la Mode'],
  ['Jalapeño Jelly', 'Jalapeno Jelly', 'accent-kept', null],
  // Quote style only
  ["Painter's White", 'Painter’s White', 'quote-only', null],
  ['Soft-Spoken', 'Soft‐Spoken', 'quote-only', null],
];

for (const [db, feed, cls, written] of CASES) {
  test(`"${db}" vs "${feed}" is ${cls}`, () => {
    assert.equal(classifyPunctuation(db, feed), cls);
    if (written !== null) assert.equal(mergePunctuation(db, feed), written);
  });
}

test('different letters are not this class', () => {
  assert.equal(classifyPunctuation('Almond', 'Almond Bisque'), null);
  assert.equal(classifyPunctuation('Gypsy Love', 'Rose Love'), null);
});
