'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signup } from '@/services/auth';
import { ROUTES } from '@/constants/routes';
import styles from './page.module.scss';

interface SignupState {
  error: string | null;
}

const initialState: SignupState = { error: null };

/**
 * Adapter so that `signup` conforms to the `useActionState` signature, which
 * passes the previous state as the first argument before `FormData`.
 */
async function signupAction(
  _prevState: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const result = await signup(formData);
  // `signup` either redirects (never returns) or returns `{ error: string }`.
  return { error: result.error };
}

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  return (
    <>
      <h2 className={styles.heading}>Create an account</h2>

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
          autoComplete="new-password"
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
          Sign Up
        </Button>
      </form>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link href={ROUTES.LOGIN} className={styles.link}>
          Log in
        </Link>
      </p>
    </>
  );
}
