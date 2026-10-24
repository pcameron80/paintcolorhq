import { NextRequest, NextResponse } from "next/server";
import { getColorById } from "@/lib/queries";

// Full color row by id. The /compare search boxes get card rows from
// /api/search (no RGB, LAB or LRV), so the tool fetches the full row here
// after a pick. Colors change rarely, so the CDN can hold answers for a day.
const FOUND_CACHE = "public, s-maxage=86400, stale-while-revalidate=604800";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid color id" }, { status: 400 });
  }

  const color = await getColorById(id);
  if (!color) {
    return NextResponse.json({ error: "Color not found" }, { status: 404 });
  }

  return NextResponse.json(
    { color },
    { headers: { "Cache-Control": FOUND_CACHE } },
  );
}
