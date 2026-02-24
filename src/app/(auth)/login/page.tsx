'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { login } from '@/services/auth';
import { ROUTES } from '@/constants/routes';
import styles from './page.module.scss';

interface LoginState {
  error: string | null;
}

const initialState: LoginState = { error: null };

/**
 * Adapter so that `login` conforms to the `useActionState` signature, which
 * passes the previous state as the first argument before `FormData`.
 */
async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = await login(formData);
  // `login` either redirects (never returns) or returns `{ error: string }`.
  return { error: result.error };
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <>
      <h2 className={styles.heading}>Log in to your account</h2>

      <form className={styles.form} action={formAction}>
        {state.error ? (
          <p className={styles.errorBanner} role="alert">
            {state.error}
          </p>
        ) : null}

        <Input
          id="email"
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />

        <Input
          id="password"
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isPending}
          className={styles.submitButton}
        >
          Log In
        </Button>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account?{' '}
        <Link href={ROUTES.SIGNUP} className={styles.link}>
          Sign up
        </Link>
      </p>
    </>
  );
}
