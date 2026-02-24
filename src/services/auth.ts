'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/constants/routes';

/** Return type for auth actions that can fail without redirecting. */
interface AuthError {
  error: string;
}

/**
 * Authenticates a user with email and password.
 * Redirects to the dashboard on success.
 * Returns `{ error }` on failure so the form can display the message.
 */
export async function login(formData: FormData): Promise<AuthError | never> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(ROUTES.HOME);
}

/**
 * Creates a new user account with email and password.
 * Redirects to the login page on success (email confirmation may be required),
 * or to the dashboard if the session is confirmed immediately.
 * Returns `{ error }` on failure so the form can display the message.
 */
export async function signup(formData: FormData): Promise<AuthError | never> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // If the session is immediately available the user is auto-confirmed —
  // send them straight to the dashboard. Otherwise redirect to login so they
  // know to check their email.
  if (data.session) {
    redirect(ROUTES.HOME);
  }

  redirect(ROUTES.LOGIN);
}

/**
 * Signs the current user out and redirects to the login page.
 */
export async function logout(): Promise<never> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect(ROUTES.LOGIN);
}
