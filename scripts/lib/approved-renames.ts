/**
 * Manufacturer renames that scripts/apply-published-names.ts may write with
 * --renames. A feed rename outside this list is reported, never written.
 *
 * Drafted 2026-10-24 (MP-45) from the dry run against the 2026-10-11 scans.
 * Every entry matched its feed row by code at CIEDE2000 0.0. Applying the
 * script is Philip's approval of the list.
 *
 * `former` is the name the page carried before. Entries with `spelling: true`
 * fix our own typo, so the old name is not added to src/lib/former-names.ts;
 * every other entry's old name must be there (approved-renames.test.ts).
 *
 * Decisions taken in the draft:
 *  - PPG 1075-2 is "Alley Caty" on pittsburghpaints.com. It reads like a typo
 *    but it is the published name, so it is kept as published.
 *  - PPG 1216-1 Morning Glow -> Morning Fog: same code, same swatch. Kept.
 *  - PPG 1111-3 Safari -> Safari Green is an "artifact" (the old name is a
 *    prefix of the new), so it is written without --renames. Its old name is
 *    still added to former-names.ts because people search for "PPG Safari".
 *  - Dunn-Edwards DEW380 White -> Warm White is also an artifact and gets no
 *    former name: "Previously listed as White" tells nobody anything.
 *
 * Feed renames deliberately left out (need a separate call):
 *  - valspar/ashen-grey-6004-1c Ashen Grey -> Ashen Gray (dE 1.8, may be a
 *    regional spelling of the same chip rather than a rename)
 *  - valspar/ripe-olives-6005-4b Ripe Olives -> Ripe Olive
 *  - behr/frosted-pomegranate-140b-7: Behr's feed misspells it "Pomgranate"
 *
 * Not touched here (MP-49 handles them): sherwin-williams indian-white-35 and
 * portrait-tone-39.
 */

export interface ApprovedRename {
  former: string;
  name: string;
  spelling?: true;
}

export const APPROVED_RENAMES: Record<string, ApprovedRename> = {
  // Sherwin-Williams, 9
  'sherwin-williams/arresting-auburn-6034': { former: 'Arresting Auburn', name: 'Dark Auburn' },
  'sherwin-williams/less-brown-6040': { former: 'Less Brown', name: 'Nutshell' },
  'sherwin-williams/moroccan-brown-6060': { former: 'Moroccan Brown', name: 'Moroccan Spice' },
  'sherwin-williams/rugged-brown-6062': { former: 'Rugged Brown', name: 'Vintage Leather' },
  'sherwin-williams/well-bred-brown-7027': { former: 'Well-Bred Brown', name: 'Hickory Smoke' },
  'sherwin-williams/suitable-brown-7054': { former: 'Suitable Brown', name: 'Oak Leaf Brown' },
  'sherwin-williams/china-doll-7517': { former: 'China Doll', name: 'Rivers Edge' },
  'sherwin-williams/plantation-shutters-7520': { former: 'Plantation Shutters', name: 'Dark Brown' },
  'sherwin-williams/biltmore-buff-7691': { former: 'Biltmore Buff', name: 'Pale Yellow' },

  // PPG, 37 (plus Safari -> Safari Green, written as an artifact)
  'ppg/baby-bunting-1243-3': { former: 'Baby Bunting', name: 'Set Sail' },
  'ppg/bare-beige-1067-2': { former: 'Bare Beige', name: 'Boardwalk' },
  'ppg/birthday-suit-1071-3': { former: 'Birthday Suit', name: 'Champagne Wishes' },
  'ppg/blue-booties-1241-2': { former: 'Blue Booties', name: 'Vitamin Sea' },
  'ppg/blushing-bride-1182-2': { former: 'Blushing Bride', name: 'Taffy' },
  'ppg/blushing-senorita-1186-2': { former: 'Blushing Senorita', name: 'Pinky Swear' },
  'ppg/cherokee-red-13-02': { former: 'Cherokee Red', name: 'Fallingwater Red' },
  'ppg/colonial-aqua-1148-4': { former: 'Colonial Aqua', name: 'Lazy River' },
  'ppg/colonial-white-1097-1': { former: 'Colonial White', name: 'Cold Foam' },
  'ppg/cradle-pink-1183-2': { former: 'Cradle Pink', name: 'Beauteous' },
  'ppg/easter-egg-1166-4': { former: 'Easter Egg', name: 'Fresh Violet' },
  'ppg/elf-shoe-1226-5': { former: 'Elf Shoe', name: 'Garden Mint' },
  'ppg/hindu-lotus-1026-6': { former: 'Hindu Lotus', name: 'Bronze Statue' },
  'ppg/how-handsome-1040-4': { former: 'How Handsome', name: 'Set in Stone' },
  'ppg/indian-maize-1214-6': { former: 'Indian Maize', name: 'Golden Hour' },
  'ppg/indian-muslin-1075-2': { former: 'Indian Muslin', name: 'Alley Caty' },
  'ppg/indian-paintbrush-18-32': { former: 'Indian Paintbrush', name: 'Berry Picking' },
  'ppg/ivory-beauty-12-29': { former: 'Ivory Beauty', name: 'Family Ties' },
  'ppg/lady-pink-1187-2': { former: 'Lady Pink', name: 'Adorbs' },
  'ppg/mexican-chile-1186-5': { former: 'Mexican Chile', name: 'Obsessed' },
  'ppg/mexican-jade-17-28': { former: 'Mexican Jade', name: 'Leaf Me Be' },
  'ppg/mexican-moonlight-1065-5': { former: 'Mexican Moonlight', name: 'Long Weekend' },
  'ppg/monkey-madness-1020-7': { former: 'Monkey Madness', name: 'Dolce' },
  'ppg/morning-glow-1216-1': { former: 'Morning Glow', name: 'Morning Fog' },
  'ppg/navajo-white-1101-2': { former: 'Navajo White', name: 'Sugar Cookie' },
  'ppg/pink-booties-1182-1': { former: 'Pink Booties', name: 'Full Bloom' },
  'ppg/racy-raisin-16-24': { former: 'Racy Raisin', name: 'Chocolate Croissant' },
  'ppg/rockabye-baby-1188-1': { former: 'Rockabye Baby', name: 'Burst Your Bubble' },
  'ppg/rojo-colonial-13-15': { former: 'Rojo Colonial', name: 'Binge Watch' },
  'ppg/sailor-boy-1164-4': { former: 'Sailor Boy', name: 'Dreamy' },
  'ppg/sentimental-lady-1159-2': { former: 'Sentimental Lady', name: 'Calm Sea' },
  'ppg/sleep-baby-sleep-1161-2': { former: 'Sleep Baby Sleep', name: "C'est La Vie" },
  'ppg/summer-tan-1067-4': { former: 'Summer Tan', name: 'Thankfully' },
  'ppg/suntan-1068-4': { former: 'Suntan', name: 'Lazy Summer' },
  'ppg/tan-your-hide-1091-6': { former: 'Tan Your Hide', name: 'Down to Earth' },
  'ppg/tantalizing-tan-1070-3': { former: 'Tantalizing Tan', name: 'Beach Vibes' },
  'ppg/tropical-tan-1080-5': { former: 'Tropical Tan', name: 'Wheat Toast' },

  // Spelling fixes the feed classifies as renames
  'dunn-edwards/exhuberant-orange-dea112': { former: 'Exhuberant Orange', name: 'Exuberant Orange', spelling: true },
  'valspar/palamino-pony-3004-8a': { former: 'Palamino Pony', name: 'Palomino Pony', spelling: true },
};

/** Artifact fixes whose old name is still searched, so it is kept as a former name. */
export const FORMER_NAME_ARTIFACTS: Record<string, string> = {
  'ppg/safari-1111-3': 'Safari',
};
