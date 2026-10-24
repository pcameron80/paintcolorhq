"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/** How long the input has to sit still before a search counts. */
export const SEARCH_SETTLE_MS = 1500;
/** Retry interval while the results for the settled term are still loading. */
export const SEARCH_PENDING_RETRY_MS = 250;
/** Give up on a term whose results never arrive (about 3 s past settling). */
export const SEARCH_PENDING_MAX_RETRIES = 12;
export const SEARCH_MIN_LENGTH = 2;

export function normalizeSearchTerm(q: string): string {
  return q.trim();
}

type Timer = ReturnType<typeof setTimeout>;

export interface SearchSettlerOptions {
  /** Result count for the term on screen, or null while it is still loading. */
  getResultCount: () => number | null;
  send: (term: string, resultCount: number) => void;
  delayMs?: number;
  schedule?: (fn: () => void, ms: number) => Timer;
  cancel?: (t: Timer) => void;
}

/**
 * Turns a stream of keystrokes into one event per settled query. A term counts
 * once it has been unchanged for delayMs, is at least two characters after
 * trimming, and differs from the last term sent. The result count is read when
 * the timer fires, not when the fetch returns, so it always belongs to the
 * settled term; while that fetch is in flight the send waits for it.
 */
export function createSearchSettler({
  getResultCount,
  send,
  delayMs = SEARCH_SETTLE_MS,
  schedule = setTimeout,
  cancel = clearTimeout,
}: SearchSettlerOptions) {
  let timer: Timer | null = null;
  let lastSent: string | null = null;

  function clear() {
    if (timer !== null) cancel(timer);
    timer = null;
  }

  function attempt(term: string, retriesLeft: number) {
    timer = null;
    if (term === lastSent) return;
    const count = getResultCount();
    if (count === null) {
      if (retriesLeft > 0) {
        timer = schedule(() => attempt(term, retriesLeft - 1), SEARCH_PENDING_RETRY_MS);
      }
      return;
    }
    lastSent = term;
    send(term, count);
  }

  return {
    update(rawQuery: string) {
      clear();
      const term = normalizeSearchTerm(rawQuery);
      if (term.length < SEARCH_MIN_LENGTH) return;
      timer = schedule(() => attempt(term, SEARCH_PENDING_MAX_RETRIES), delayMs);
    },
    cancel: clear,
  };
}

/**
 * Sends one GA4/Plausible color_search per settled query. Pass resultCount as
 * null while results are loading. Replaces the per-fetch event that fired
 * on every 300 ms debounce (63% of /match events came within 1 s of another).
 */
export function useSearchTracking(query: string, resultCount: number | null, source: string) {
  const countRef = useRef<number | null>(resultCount);
  useEffect(() => {
    countRef.current = resultCount;
  }, [resultCount]);

  const settlerRef = useRef<ReturnType<typeof createSearchSettler> | null>(null);
  useEffect(() => {
    const settler = createSearchSettler({
      getResultCount: () => countRef.current,
      send: (term, count) =>
        trackEvent("color_search", {
          search_term: term,
          result_count: String(count),
          source,
        }),
    });
    settlerRef.current = settler;
    return () => {
      settler.cancel();
      settlerRef.current = null;
    };
  }, [source]);

  useEffect(() => {
    settlerRef.current?.update(query);
  }, [query]);
}
