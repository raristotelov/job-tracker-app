'use client';

import { useActionState, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { createSection } from '@/services/sections';
import type { SectionActionError } from '@/services/sections';
import styles from './CreateSectionForm.module.scss';

type FormState =
  | { status: 'idle' }
  | { status: 'error'; error: string; fieldErrors?: { name?: string } };

const INITIAL_STATE: FormState = { status: 'idle' };

/**
 * Inline form for creating a new section.
 *
 * Renders a single text input and a "Create" button. On success, the action
 * returns idle and the form key increments — remounting the form element and
 * clearing the uncontrolled input. On failure, the error is surfaced inline.
 */
export function CreateSectionForm() {
  // Bumping formKey remounts the <form> element, which resets uncontrolled
  // inputs (the name input) to their defaultValue without extra state.
  const [formKey, setFormKey] = useState(0);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result: SectionActionError | null = await createSection(formData);

      if (result === null) {
        setFormKey((k) => k + 1);
        return INITIAL_STATE;
      }

      return {
        status: 'error' as const,
        error: result.error,
        fieldErrors: result.fieldErrors,
      };
    },
    INITIAL_STATE,
  );

  const fieldError = state.status === 'error' ? state.fieldErrors?.name : undefined;
  const topError =
    state.status === 'error' && !state.fieldErrors ? state.error : undefined;

  return (
    <form key={formKey} action={formAction} className={styles.form} noValidate>
      {topError ? <ErrorBanner message={topError} /> : null}

      <div className={styles.inputRow}>
        <Input
          id="section-name"
          name="name"
          label="New Section Name"
          placeholder="e.g. LinkedIn, Referrals, Direct Apply"
          maxLength={100}
          error={fieldError}
          autoComplete="off"
        />
        <Button type="submit" isLoading={isPending} className={styles.createButton}>
          Create
        </Button>
      </div>
    </form>
  );
}
