import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Enforce www canonical domain (301 redirect)
  const host = request.headers.get("host") ?? "";
  if (host === "paintcolorhq.com") {
    const url = new URL(request.url);
    url.host = "www.paintcolorhq.com";
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  // Supabase redirects OAuth codes to the Site URL (root).
  // Catch them here and forward to the callback route.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const callbackUrl = new URL("/auth/callback", request.nextUrl.origin);
    callbackUrl.searchParams.set("code", code);
    return NextResponse.redirect(callbackUrl);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session token
  await supabase.auth.getUser();

  // Set canonical Link header AFTER Supabase auth (which may recreate
  // supabaseResponse via setAll), so the header survives on the final response.
  // Crawlers use this even when Next.js 16 streams <link rel="canonical">
  // inside <body> via RSC.
  const canonical = `https://www.paintcolorhq.com${request.nextUrl.pathname}`;
  supabaseResponse.headers.set("Link", `<${canonical}>; rel="canonical"`);

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
