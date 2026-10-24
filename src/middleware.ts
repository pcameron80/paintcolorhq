import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATH_PREFIXES = ["/dashboard", "/auth", "/account", "/admin"];
const AUTH_TIMEOUT_MS = 2500;

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

  // Renamed color slugs are redirected by the color page itself
  // (generateMetadata -> permanentRedirect, a real 308). Middleware runs ahead
  // of the CDN cache, so a database lookup here cost every color-page request,
  // cache hits included. Keep middleware free of data fetching.

  // Skip Supabase session refresh for anonymous traffic on public routes.
  // Calling auth.getUser() invokes setAll with cookies, which makes Vercel
  // mark responses `private, no-store` and bypass the ISR cache.
  const hasSupabaseSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  const needsAuth = AUTH_PATH_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );
  if (!hasSupabaseSession && !needsAuth) {
    return NextResponse.next({ request });
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
      // A slow auth server must not hold the page: give up after 2.5 s.
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) =>
          fetch(url, { ...init, signal: AbortSignal.timeout(AUTH_TIMEOUT_MS) }),
      },
    }
  );

  // Refresh the session token. On timeout or a network error, fall through
  // with the request untouched; the next request retries the refresh.
  try {
    await supabase.auth.getUser();
  } catch {
    return NextResponse.next({ request });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
