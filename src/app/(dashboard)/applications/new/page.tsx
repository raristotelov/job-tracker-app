import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ApplicationForm } from '@/components/features/applications/ApplicationForm';
import { ROUTES } from '@/constants/routes';
import type { Section } from '@/types';
import styles from './page.module.scss';

/**
 * Create application page — Server Component.
 *
 * Fetches the user's sections server-side for the dropdown.
 * Renders ApplicationForm in create mode (no initialData).
 * On success the form action redirects to the new application's detail view.
 */
export default async function NewApplicationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const { data: sectionsData } = await supabase
    .from('sections')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  const sections = (sectionsData ?? []) as Section[];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href={ROUTES.APPLICATIONS} className={styles.backLink}>
          <span aria-hidden="true">←</span> Applications
        </Link>
        <h1 className={styles.title}>Add Application</h1>
      </header>

      <ApplicationForm sections={sections} cancelHref={ROUTES.APPLICATIONS} />
    </div>
  );
}
