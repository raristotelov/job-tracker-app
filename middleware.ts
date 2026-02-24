import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { ROUTES } from '@/constants/routes';

/** Paths that are accessible without an authenticated session. */
const PUBLIC_PATHS = [ROUTES.LOGIN, ROUTES.SIGNUP] as const;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const { supabase, response: supabaseResponse } = createClient(request, response);

  // Refresh the session on every request. This keeps the session cookie
  // up-to-date and makes the user available to Server Components and Actions.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path);

  if (!user && !isPublicPath) {
    // Unauthenticated user trying to access a protected route — send to login.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.LOGIN;
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicPath) {
    // Authenticated user visiting login or signup — send to the dashboard.
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = ROUTES.HOME;
    return NextResponse.redirect(dashboardUrl);
  }

  // Return the Supabase response so any refreshed session cookies are set.
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
