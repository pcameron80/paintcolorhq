// Self-hosted Plausible Community Edition on the NAS, reached through a
// personal Cloudflare Tunnel. See the Brain: reference/infrastructure.
export const PLAUSIBLE_ORIGIN = "https://stats.clinchriverweb.com";

// Plausible CE 3.2.1 reads the flag as `body["i"] || body["interactive"]`
// (lib/plausible/ingestion/request.ex). In Elixir `false || nil` is nil, so the
// tracker's `"i": false` alone falls back to interactive and every Web Vitals
// event cleared the session's bounce flag (bounce 65% -> 1% from 2026-10-24).
// Sending `interactive: false` as well makes the expression false.
export function withNonInteractiveFlag(body: string): string {
  if (!body.includes('"i":false')) return body;
  try {
    const event = JSON.parse(body);
    if (event?.i !== false || "interactive" in event) return body;
    return JSON.stringify({ ...event, interactive: false });
  } catch {
    return body;
  }
}
