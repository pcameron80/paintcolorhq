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

  // Renamed-slug redirect for color pages: when a color slug doesn't match a
  // record, try the color-number → canonical slug fallback at the HTTP level.
  // The page-component fallback in /colors/[brand]/[slug]/page.tsx produces a
  // meta-refresh in streaming mode, which Googlebot indexes as a soft-404.
  // Doing it here yields a proper 308.
  const colorRedirect = await maybeColorSlugRedirect(request);
  if (colorRedirect) return colorRedirect;

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

  return supabaseResponse;
}

async function maybeColorSlugRedirect(
  request: NextRequest,
): Promise<NextResponse | null> {
  const path = request.nextUrl.pathname;
  const match = path.match(/^\/colors\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;
  const [, brandSlug, colorSlug] = match;
  if (brandSlug === "family") return null;

  const colorNumber = extractColorNumber(colorSlug);
  if (!colorNumber) return null;

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );

  // Single join query: find the canonical slug for this brand + color number.
  // If it matches the requested slug, no redirect needed (most common case).
  const { data } = await sb
    .from("colors")
    .select("slug, brands!inner(slug)")
    .eq("brands.slug", brandSlug)
    .eq("color_number", colorNumber)
    .maybeSingle();
  if (!data || data.slug === colorSlug) return null;

  const target = new URL(
    `/colors/${brandSlug}/${data.slug}${request.nextUrl.search}`,
    request.url,
  );
  return NextResponse.redirect(target, 308);
}

function extractColorNumber(slug: string): string | null {
  const patterns = [
    /-([a-z]{1,4}\d+-\d+[a-z]*)$/i,
    /-([a-z]{1,4}-\d+[a-z]*)$/i,
    /-(\d+-\d+)$/i,
    /-(\d+)$/i,
  ];
  for (const p of patterns) {
    const m = slug.match(p);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
