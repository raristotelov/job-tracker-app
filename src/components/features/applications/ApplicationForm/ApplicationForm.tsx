'use client';

import { useActionState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/constants/status';
import { WORK_TYPES, WORK_TYPE_LABELS } from '@/constants/workType';
import { ROUTES } from '@/constants/routes';
import { createApplication, updateApplication } from '@/services/applications';
import type { ApplicationActionError } from '@/services/applications';
import type { ApplicationWithSection, Section } from '@/types';
import styles from './ApplicationForm.module.scss';

// =============================================================================
// TYPES
// =============================================================================

interface ApplicationFormProps {
  /** When provided, the form operates in edit mode pre-filled with this data. */
  initialData?: ApplicationWithSection;
  /** Available sections for the section dropdown. */
  sections: Section[];
  /** Route to return to when Cancel is clicked. */
  cancelHref: string;
}

type FormState = ApplicationActionError | null;

// =============================================================================
// OPTION BUILDERS
// =============================================================================

const statusOptions = APPLICATION_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

const workTypeOptions = WORK_TYPES.map((wt) => ({
  value: wt,
  label: WORK_TYPE_LABELS[wt],
}));

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Shared create/edit form for job applications.
 *
 * In create mode (`initialData` is undefined): wraps `createApplication`.
 * In edit mode (`initialData` is provided): wraps `updateApplication` via a
 * bound partial action so `useActionState` always receives `(state, formData)`.
 *
 * Client-side validation is done by the Server Action (Zod) and errors are
 * returned as `fieldErrors` in the action state. We do not duplicate
 * validation rules here — the server is the authority.
 */
export function ApplicationForm({ initialData, sections, cancelHref }: ApplicationFormProps) {
  const isEditMode = initialData !== undefined;

  // Bind the update action to the application ID so we can use it in useActionState.
  const action = isEditMode
    ? updateApplication.bind(null, initialData.id)
    : createApplication;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await action(formData);
      // `result` is only returned on error — on success the action redirects.
      return result ?? null;
    },
    null,
  );

  const fieldErrors = state?.fieldErrors ?? {};

  const formRef = useRef<HTMLFormElement>(null);

  // When server-side validation returns field errors, move focus to the first
  // invalid field so keyboard and screen-reader users are immediately aware.
  useEffect(() => {
    if (!state?.fieldErrors) return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    firstInvalid?.focus();
  }, [state?.fieldErrors]);

  // Build section options with an explicit "No section" option at the top.
  const sectionOptions = [
    { value: '', label: 'No section' },
    ...sections.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <form ref={formRef} action={formAction} className={styles.form} noValidate>
      {/* Top-level error banner — shown for both field validation failures and server errors */}
      {state?.error ? (
        <ErrorBanner message={state.error} />
      ) : null}

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Job Details</legend>

        <div className={styles.row}>
          <Input
            id="company_name"
            name="company_name"
            label="Company Name *"
            defaultValue={initialData?.company_name ?? ''}
            error={fieldErrors.company_name}
            autoComplete="organization"
            autoFocus={!isEditMode}
          />
        </div>

        <div className={styles.row}>
          <Input
            id="position_title"
            name="position_title"
            label="Position Title *"
            defaultValue={initialData?.position_title ?? ''}
            error={fieldErrors.position_title}
          />
        </div>

        <div className={styles.row}>
          <Input
            id="job_posting_url"
            name="job_posting_url"
            label="Job Posting URL"
            type="url"
            defaultValue={initialData?.job_posting_url ?? ''}
            error={fieldErrors.job_posting_url}
            placeholder="https://example.com/jobs/123"
            autoComplete="url"
          />
        </div>

        <div className={styles.rowTwo}>
          <Input
            id="location"
            name="location"
            label="Location"
            defaultValue={initialData?.location ?? ''}
            error={fieldErrors.location}
            placeholder="Austin, TX"
          />

          <Select
            id="work_type"
            name="work_type"
            label="Work Type"
            options={workTypeOptions}
            defaultValue={initialData?.work_type ?? ''}
            error={fieldErrors.work_type}
            placeholder="Select work type"
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Salary Range (USD)</legend>

        <div className={styles.rowTwo}>
          <Input
            id="salary_range_min"
            name="salary_range_min"
            label="Minimum"
            type="number"
            min={0}
            defaultValue={initialData?.salary_range_min?.toString() ?? ''}
            error={fieldErrors.salary_range_min}
            placeholder="e.g. 80000"
          />

          <Input
            id="salary_range_max"
            name="salary_range_max"
            label="Maximum"
            type="number"
            min={0}
            defaultValue={initialData?.salary_range_max?.toString() ?? ''}
            error={fieldErrors.salary_range_max}
            placeholder="e.g. 120000"
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Application Details</legend>

        <div className={styles.rowTwo}>
          <Input
            id="date_applied"
            name="date_applied"
            label="Date Applied *"
            type="date"
            defaultValue={initialData?.date_applied ?? ''}
            error={fieldErrors.date_applied}
          />

          <Select
            id="status"
            name="status"
            label="Status *"
            options={statusOptions}
            defaultValue={initialData?.status ?? 'applied'}
            error={fieldErrors.status}
          />
        </div>

        <div className={styles.row}>
          <Select
            id="section_id"
            name="section_id"
            label="Section"
            options={sectionOptions}
            defaultValue={initialData?.section_id ?? ''}
            error={fieldErrors.section_id}
          />
        </div>
      </fieldset>

      <div className={styles.actions}>
        <Link href={cancelHref} className={styles.cancelLink}>
          Cancel
        </Link>
        <Button type="submit" isLoading={isPending}>
          {isEditMode ? 'Save Changes' : 'Add Application'}
        </Button>
      </div>
    </form>
  );
}
