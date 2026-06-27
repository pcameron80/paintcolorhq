import { NextResponse } from "next/server";

// Lightweight liveness check for RapidAPI's daily health monitor. Confirms the app
// is serving; intentionally does NOT touch the database — a transient DB blip
// shouldn't flag the whole API as down (the /api/color-match endpoint surfaces real
// data errors itself). Always fresh, never cached.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok", service: "paintcolorhq-color-match-api" },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
