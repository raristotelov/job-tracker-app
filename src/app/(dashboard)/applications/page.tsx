import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ApplicationList } from '@/components/features/applications/ApplicationList';
import { ROUTES } from '@/constants/routes';
import type { ApplicationWithSection } from '@/types';
import styles from './page.module.scss';

/**
 * Applications list page — Server Component.
 *
 * Fetches all of the authenticated user's applications with their section name
 * joined, ordered by date_applied descending. Passes the data to the
 * ApplicationList Client Component for rendering and view-mode toggling.
 */
export default async function ApplicationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*, sections(name)')
    .order('date_applied', { ascending: false });

  if (error) {
    throw new Error('Failed to load applications. Please refresh the page.');
  }

  const applications = (data ?? []) as ApplicationWithSection[];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Applications</h1>
      </header>

      <ApplicationList applications={applications} />
    </div>
  );
}
