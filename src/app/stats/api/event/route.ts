import { NextRequest, NextResponse } from "next/server";
import { PLAUSIBLE_ORIGIN } from "@/lib/plausible";

// First-party relay for Plausible events. Not a rewrite: a rewrite would pass
// the visitor's cookies (including the Supabase session) to the stats host.
// Only the body and the headers Plausible needs are forwarded. The visitor IP
// goes in X-Plausible-IP, which Plausible reads before CF-Connecting-IP;
// otherwise Cloudflare in front of the NAS would report Vercel's IP for every
// visit and collapse location and unique-visitor counts.
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  const body = await request.text();
  if (body.length > 4096) return new NextResponse(null, { status: 413 });

  try {
    const res = await fetch(`${PLAUSIBLE_ORIGIN}/api/event`, {
      method: "POST",
      body,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "text/plain",
        "User-Agent": request.headers.get("user-agent") ?? "",
        ...(ip ? { "X-Plausible-IP": ip } : {}),
      },
      cache: "no-store",
    });
    return new NextResponse(null, { status: res.status });
  } catch {
    // The NAS being down must never break the page; the event is just lost.
    return new NextResponse(null, { status: 202 });
  }
}
