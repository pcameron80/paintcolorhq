import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Country of the visitor, used client-side to decide whether to show the
// cookie banner. Never cached: the answer is per-visitor.
export function GET(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country");
  return NextResponse.json(
    { country: country ? country.toUpperCase() : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
