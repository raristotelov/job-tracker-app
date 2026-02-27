import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ApplicationList } from '@/components/features/applications/ApplicationList';
import { ROUTES } from '@/constants/routes';
import type { ApplicationWithSection, Section } from '@/types';
import styles from './page.module.scss';

/**
 * Applications list page — Server Component.
 *
 * Fetches all of the authenticated user's applications with their section name
 * joined, ordered by date_applied descending. Also fetches sections for the
 * inline creation drawer. Passes both datasets to ApplicationList.
 */
export default async function ApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const [applicationsResult, sectionsResult] = await Promise.all([
    supabase
      .from('applications')
      .select('*, sections(name)')
      .order('date_applied', { ascending: false }),
    supabase
      .from('sections')
      .select('id, name')
      .order('name', { ascending: true }),
  ]);

  if (applicationsResult.error) {
    throw new Error('Failed to load applications. Please refresh the page.');
  }

  if (sectionsResult.error) {
    throw new Error('Failed to load sections. Please refresh the page.');
  }

  const applications = (applicationsResult.data ?? []) as ApplicationWithSection[];
  const sections = (sectionsResult.data ?? []) as Section[];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Applications</h1>
      </header>

      <ApplicationList applications={applications} sections={sections} />
    </div>
  );
}
