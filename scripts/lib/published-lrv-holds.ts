/**
 * Published LRVs that apply-published-lrv.ts must not write, beyond the
 * --max-delta guard. Found in the 2026-11 data audit
 * (docs/data-audit-2026-11.md, finding lrv-mp50-preflight): each of these
 * passes the 10-point cap but contradicts the brand's own hex, its strip
 * neighbors or another brand's figure for the same color. The row keeps its
 * computed LRV.
 *
 * Codes are the feed's codes, upper-cased, exactly as <brand>-live.json holds
 * them (PPG's feed writes "PPG1031-1", so both spellings are listed).
 * Matching is exact per brand, so Hirshfield's H0027 (published 27.9,
 * correct) is not caught by Vista's H0027.
 *
 * These are frozen exceptions: if the brand corrects its page, remove the
 * entry by hand. If PR #263 (lrv-source.ts, LRV_SKIP_CODES) lands first,
 * move this list there.
 */
export const LRV_HOLD_CODES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ppg: {
    // 52 is 1031-2 Misty Meadow's value. ppgpaints.com published 60 for the
    // same RGB 204/204/186 in 2020 and 2022 (Wayback); hex Y is 59.6.
    '1031-1': 'copies 1031-2 (52); old PPG site said 60',
    'PPG1031-1': 'copies 1031-2 (52); old PPG site said 60',
    // Published 79 since 2021, but hex Y is 84.9 and its strip publishes
    // within 2.7 of Y everywhere else. Medium confidence; recheck the page.
    '1235-1': 'off its strip by 5.9 (79 vs hex Y 84.9)',
    'PPG1235-1': 'off its strip by 5.9 (79 vs hex Y 84.9)',
  },
  'vista-paint': {
    '7152': "copies 7153 Lavender Lilac's 57 (hex Y 47.8)",
    '7329': "copies 7330's 62 (hex Y 53.6)",
    '7386': "copies 7385's 53 (hex Y 60.2)",
    AC124: 'AC120-AC128 publish within 0.5 of Y; AC124 says 19 vs Y 12.9',
    H0027: "Hirshfield's publishes 27.9 for the same Farmhouse Ochre; Vista says 36",
    // Vista's page contradicts itself (RGB text 219/185/152 vs hex #775745);
    // the hex needs a review too, see the audit doc.
    '8560': 'page RGB and hex disagree; 17 fits neither',
  },
};

/** True when the feed code's published LRV must not be written. */
export function isLrvHeld(brandSlug: string, feedCode: string): boolean {
  const held = LRV_HOLD_CODES[brandSlug];
  return !!held && Object.prototype.hasOwnProperty.call(held, feedCode.trim().toUpperCase());
}
