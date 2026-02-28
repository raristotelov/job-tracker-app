'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { statusUpdateSchema } from '@/lib/validators/application';
import { ROUTES } from '@/constants/routes';
import type { ApplicationStatus } from '@/types';

/**
 * Updates only the status column of an application owned by the authenticated user.
 *
 * Validates that the provided status is one of the 5 allowed enum values,
 * then performs a targeted single-column update via Supabase.
 */
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<{ success: true } | { error: string }> {
  const parsed = statusUpdateSchema.safeParse(status);
  if (!parsed.success) {
    return { error: 'Invalid status value.' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in to update the status.' };
  }

  const { error } = await supabase
    .from('applications')
    .update({ status: parsed.data })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Something went wrong. The status could not be updated. Please try again.' };
  }

  revalidatePath(ROUTES.APPLICATIONS);
  return { success: true };
}
