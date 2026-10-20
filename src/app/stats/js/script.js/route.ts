import { PLAUSIBLE_ORIGIN } from "@/lib/plausible";

// Serves Plausible's tracker first-party. Fetched server-side without the
// visitor's cookies and cached for a day, so a NAS outage doesn't stall pages.
export const revalidate = 86400;

export async function GET() {
  const res = await fetch(`${PLAUSIBLE_ORIGIN}/js/script.js`, { next: { revalidate: 86400 } });
  if (!res.ok) return new Response("", { status: 502 });
  return new Response(await res.text(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
