import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  canAccess,
  homePathFor,
  isPublicPath,
  isUserRole,
  moduleForPath,
} from "@/lib/access";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Verifies the sign-in token and refreshes it when it has expired. Do not remove.
  // Reads the token only, with no database call, so it stays cheap on every request.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const pathname = request.nextUrl.pathname;

  // A redirect that keeps any refreshed session cookies.
  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  // Not signed in: only the public pages are open.
  if (!claims) {
    return isPublicPath(pathname) ? supabaseResponse : redirectTo("/login");
  }

  const role = claims.app_metadata?.user_role;

  // Signed in but the account has no role (not set up): only the login page, which explains it.
  if (!isUserRole(role)) {
    if (pathname === "/login") return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=no-account";
    return NextResponse.redirect(url);
  }

  // Already signed in: no reason to see the login page again.
  if (pathname === "/login") {
    return redirectTo(homePathFor(role));
  }

  // A module the role may not open goes back to the role's own home.
  // Shared pages (notifications, preferences) belong to no module, so they stay open.
  const requestedModule = moduleForPath(pathname);
  if (requestedModule && !canAccess(role, requestedModule)) {
    return redirectTo(homePathFor(role));
  }

  return supabaseResponse;
}
