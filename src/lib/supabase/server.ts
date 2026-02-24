import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * Reads and writes session cookies via Next.js `cookies()` from `next/headers`.
 *
 * Usage: call `createClient()` at the top of a Server Component or Server Action.
 * Do NOT cache or share the returned instance — create a new one per request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // `setAll` is called from a Server Component where cookies cannot
            // be set. The middleware client handles session refresh, so this
            // is safe to ignore here.
          }
        },
      },
    },
  );
}
