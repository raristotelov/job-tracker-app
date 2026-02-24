import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreateSectionForm } from '@/components/features/sections/CreateSectionForm';
import { SectionList } from '@/components/features/sections/SectionList';
import { ROUTES } from '@/constants/routes';
import type { SectionWithCount } from '@/types';
import styles from './page.module.scss';

/**
 * Sections management page — Server Component.
 *
 * Fetches all sections for the authenticated user with their application
 * counts, then renders the `CreateSectionForm` at the top and `SectionList`
 * below. An empty state message is shown when the user has no sections yet.
 *
 * The `applications(count)` embedded count syntax fetches a count of related
 * rows per section in a single query without a separate aggregation call.
 */
export default async function SectionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data, error } = await supabase
    .from('sections')
    .select('*, applications(count)')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) {
    throw new Error('Failed to load sections. Please refresh the page.');
  }

  // Supabase returns applications as [{ count: number }] for embedded counts.
  const sections: SectionWithCount[] = (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    application_count: Array.isArray(row.applications) && row.applications.length > 0
      ? (row.applications[0] as { count: number }).count
      : 0,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sections</h1>
      </header>

      <div className={styles.createSection}>
        <p className={styles.createTitle}>Create Section</p>
        <CreateSectionForm />
      </div>

      <div className={styles.listSection}>
        <p className={styles.listTitle}>
          Your Sections {sections.length > 0 ? `(${sections.length})` : ''}
        </p>

        {sections.length === 0 ? (
          <p className={styles.emptyMessage}>
            No sections yet. Create one above.
          </p>
        ) : (
          <SectionList sections={sections} />
        )}
      </div>
    </div>
  );
}
