import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase client configured for use inside Next.js middleware.
 *
 * Middleware runs before rendering, so it has access to both the incoming
 * request and the outgoing response. Both `getAll` and `setAll` are wired
 * to the request/response cookie pair so that session tokens are refreshed
 * and forwarded on every request.
 *
 * @param request  - The incoming `NextRequest` from the middleware function.
 * @param response - A mutable `NextResponse` that will be returned by the
 *                   middleware. Cookie mutations are applied to this object.
 * @returns        An object containing the configured Supabase client and the
 *                 (possibly mutated) response, both of which must be used by
 *                 the calling middleware.
 */
export function createClient(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Apply cookies to both the request (so the server sees them during
          // this request cycle) and the response (so the browser receives them).
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response };
}
