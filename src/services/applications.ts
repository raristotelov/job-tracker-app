'use server';

import { revalidatePath } from 'next/cache';
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
 * Creates a new job application for the authenticated user — inline variant.
 *
 * Uses the same validation and insert logic as `createApplication` but
 * returns `{ id: string }` on success instead of calling `redirect()`.
 * This makes it safe to use inside `useActionState` where a return value
 * is expected by the Client Component (e.g. in the side drawer form).
 *
 * Returns `ApplicationActionError` on validation or DB failure.
 */
export async function createApplicationInline(
  formData: FormData,
): Promise<{ id: string } | ApplicationActionError> {
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
  return { id: data.id };
}

/**
 * Updates an existing job application owned by the authenticated user — inline variant.
 *
 * Uses the same validation and update logic as `updateApplication` but returns
 * `{ id: string }` on success instead of calling `redirect()`. This makes it
 * safe to use inside `useActionState` in the side drawer form.
 *
 * Does not revalidate the detail or edit page routes — the drawer user has no
 * need for those caches to update.
 *
 * Returns `ApplicationActionError` on validation or DB failure.
 */
export async function updateApplicationInline(
  id: string,
  formData: FormData,
): Promise<{ id: string } | ApplicationActionError> {
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

  revalidatePath(ROUTES.APPLICATIONS);
  return { id };
}

/**
 * Deletes a job application owned by the authenticated user.
 *
 * The RLS policy enforces ownership — this action cannot delete another user's
 * record. After deletion, revalidates the applications list so the table
 * updates automatically.
 *
 * Returns `{ success: true }` on success, `{ error }` on failure.
 */
export async function deleteApplication(
  id: string,
): Promise<{ success: true } | ApplicationActionError> {
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
  return { success: true };
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
