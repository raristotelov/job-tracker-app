'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  applicationCreateSchema,
  applicationUpdateSchema,
} from '@/lib/validators/application';
import { ROUTES } from '@/constants/routes';
import type { ApplicationCreateInput } from '@/types';

/** Shared return type for actions that can fail without redirecting. */
export interface ApplicationActionError {
  error: string;
  fieldErrors?: Partial<Record<keyof ApplicationCreateInput, string>>;
}

/**
 * Creates a new job application for the authenticated user.
 *
 * Validates the form data with the Zod schema, inserts the record into
 * Supabase (user_id is set server-side from the session), revalidates the
 * applications list, and redirects to the new record's detail page.
 *
 * Returns `{ error, fieldErrors? }` on validation or DB failure so the form
 * can surface the messages without a page reload.
 */
export async function createApplication(
  formData: FormData,
): Promise<ApplicationActionError | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create an application.' };
  }

  const raw = extractFormData(formData);

  const parsed = applicationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return buildValidationError(parsed.error);
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single();

  if (error || !data) {
    return { error: 'Something went wrong. Your changes were not saved. Please try again.' };
  }

  revalidatePath(ROUTES.APPLICATIONS);
  redirect(ROUTES.APPLICATION_DETAIL(data.id));
}

/**
 * Updates an existing job application owned by the authenticated user.
 *
 * Validates the form data with the Zod schema, updates the matching record in
 * Supabase (the RLS policy ensures only the owner can update it), revalidates
 * the affected pages, and redirects to the detail page.
 *
 * Returns `{ error, fieldErrors? }` on validation or DB failure.
 */
export async function updateApplication(
  id: string,
  formData: FormData,
): Promise<ApplicationActionError | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update an application.' };
  }

  const raw = extractFormData(formData);

  const parsed = applicationUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return buildValidationError(parsed.error);
  }

  const { error } = await supabase
    .from('applications')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Something went wrong. Your changes were not saved. Please try again.' };
  }

  revalidatePath(ROUTES.APPLICATION_DETAIL(id));
  revalidatePath(ROUTES.APPLICATION_EDIT(id));
  revalidatePath(ROUTES.APPLICATIONS);
  redirect(ROUTES.APPLICATION_DETAIL(id) + '?updated=1');
}

/**
 * Deletes a job application owned by the authenticated user.
 *
 * The RLS policy enforces ownership — this action cannot delete another user's
 * record. After deletion, revalidates the applications list and redirects there.
 *
 * Returns `{ error }` on failure so the caller can surface the message.
 */
export async function deleteApplication(
  id: string,
): Promise<ApplicationActionError | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to delete an application.' };
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Something went wrong. The application could not be deleted. Please try again.' };
  }

  revalidatePath(ROUTES.APPLICATIONS);
  redirect(ROUTES.APPLICATIONS);
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extracts raw field values from a FormData object into a plain object
 * suitable for Zod parsing.
 *
 * Numeric fields (`salary_range_min`, `salary_range_max`) are coerced to
 * numbers or null. All other fields default to null when the string is empty
 * so that optional fields are correctly treated as absent.
 */
function extractFormData(formData: FormData): Record<string, unknown> {
  const getString = (key: string): string | null => {
    const val = formData.get(key);
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const getNumber = (key: string): number | null => {
    const val = formData.get(key);
    if (typeof val !== 'string' || val.trim() === '') return null;
    const num = Number(val.trim());
    return isNaN(num) ? null : num;
  };

  return {
    company_name:     getString('company_name'),
    position_title:   getString('position_title'),
    job_posting_url:  getString('job_posting_url'),
    location:         getString('location'),
    work_type:        getString('work_type'),
    salary_range_min: getNumber('salary_range_min'),
    salary_range_max: getNumber('salary_range_max'),
    status:           getString('status') ?? 'applied',
    date_applied:     getString('date_applied'),
    section_id:       getString('section_id'),
  };
}

/**
 * Converts a Zod parse error into the `ApplicationActionError` shape,
 * mapping the first issue per field path to `fieldErrors`.
 */
function buildValidationError(zodError: z.ZodError): ApplicationActionError {
  const fieldErrors: Partial<Record<keyof ApplicationCreateInput, string>> = {};

  for (const issue of zodError.issues) {
    const key = issue.path[0] as keyof ApplicationCreateInput | undefined;
    if (key && !(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return {
    error: 'Please fix the errors below.',
    fieldErrors,
  };
}
