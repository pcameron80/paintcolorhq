import { NextRequest, NextResponse } from "next/server";
import { checkAdminSession } from "@/lib/admin-auth";
import { getLiveData } from "@/lib/admin-analytics";

export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  // 404, not 401: do not reveal that the endpoint exists.
  if ((await checkAdminSession()) !== "ok") {
    return new NextResponse("Not found", { status: 404, headers: HEADERS });
  }
  const part = request.nextUrl.searchParams.get("part");
  const data = await getLiveData(part === "realtime" ? "realtime" : "all");
  return NextResponse.json(data, { headers: HEADERS });
}
