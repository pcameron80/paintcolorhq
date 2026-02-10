import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${request.nextUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?auth_error=true`);
  }

  return NextResponse.redirect(data.url);
}
