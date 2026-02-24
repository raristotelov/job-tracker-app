import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components (browser context).
 * The browser client manages its own cookie storage automatically.
 *
 * Usage: call `createClient()` inside a Client Component or custom hook.
 * `createBrowserClient` returns a singleton by default when called with the
 * same URL and key, so repeated calls are safe.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
