'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { sectionNameSchema } from '@/lib/validators/section';
import { ROUTES } from '@/constants/routes';

/** Shared return type for section actions that can fail without redirecting. */
export interface SectionActionError {
  error: string;
  fieldErrors?: { name?: string };
}

// Supabase Postgres error code for unique constraint violations.
const UNIQUE_VIOLATION_CODE = '23505';

/**
 * Creates a new section for the authenticated user.
 *
 * Validates the name with the Zod schema, inserts the record into Supabase,
 * and revalidates the sections page. Handles the DB unique constraint
 * (case-insensitive unique index on user_id + lower(name)) gracefully.
 *
 * Returns `{ error, fieldErrors? }` on validation or DB failure so the
 * form can surface the message without a page reload.
 */
export async function createSection(
  formData: FormData,
): Promise<SectionActionError | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to create a section.' };
  }

  const raw = { name: formData.get('name') };
  const parsed = sectionNameSchema.safeParse(raw);

  if (!parsed.success) {
    return buildValidationError(parsed.error);
  }

  const { error } = await supabase
    .from('sections')
    .insert({ user_id: user.id, name: parsed.data.name });

  if (error) {
    if (error.code === UNIQUE_VIOLATION_CODE) {
      return {
        error: 'Please fix the errors below.',
        fieldErrors: { name: 'A section with this name already exists' },
      };
    }
    return { error: 'Failed to create section. Please try again.' };
  }

  revalidatePath(ROUTES.SECTIONS);
  return null;
}

/**
 * Renames an existing section owned by the authenticated user.
 *
 * Validates the new name with the Zod schema, updates the matching record in
 * Supabase (the RLS policy ensures only the owner can update it), and
 * revalidates the sections page. Handles the unique constraint gracefully.
 *
 * Returns `{ error, fieldErrors? }` on validation or DB failure.
 */
export async function renameSection(
  id: string,
  formData: FormData,
): Promise<SectionActionError | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to rename a section.' };
  }

  const raw = { name: formData.get('name') };
  const parsed = sectionNameSchema.safeParse(raw);

  if (!parsed.success) {
    return buildValidationError(parsed.error);
  }

  const { error } = await supabase
    .from('sections')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION_CODE) {
      return {
        error: 'Please fix the errors below.',
        fieldErrors: { name: 'A section with this name already exists' },
      };
    }
    return { error: 'Failed to rename section. Please try again.' };
  }

  revalidatePath(ROUTES.SECTIONS);
  revalidatePath(ROUTES.APPLICATIONS);
  return null;
}

/**
 * Deletes a section owned by the authenticated user.
 *
 * The `ON DELETE SET NULL` FK constraint on `applications.section_id`
 * automatically nullifies related application rows at the database level.
 * RLS enforces ownership — this action cannot delete another user's section.
 *
 * Returns `{ error }` on failure so the caller can surface the message.
 */
export async function deleteSection(
  id: string,
): Promise<SectionActionError | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to delete a section.' };
  }

  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Failed to delete section. Please try again.' };
  }

  revalidatePath(ROUTES.SECTIONS);
  revalidatePath(ROUTES.APPLICATIONS);
  return null;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Converts a Zod parse error into the `SectionActionError` shape,
 * mapping the first issue for the `name` field to `fieldErrors`.
 */
function buildValidationError(zodError: z.ZodError): SectionActionError {
  const fieldErrors: { name?: string } = {};

  for (const issue of zodError.issues) {
    const key = issue.path[0];
    if (key === 'name' && !fieldErrors.name) {
      fieldErrors.name = issue.message;
    }
  }

  return {
    error: 'Please fix the errors below.',
    fieldErrors,
  };
}
