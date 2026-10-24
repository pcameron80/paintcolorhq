import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNext } from "@/lib/safe-next";

export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"), request.nextUrl.origin, "/dashboard");
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?auth_error=true`);
  }

  const response = NextResponse.redirect(data.url);
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
