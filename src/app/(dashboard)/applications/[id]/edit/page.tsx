import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ApplicationForm } from '@/components/features/applications/ApplicationForm';
import { ROUTES } from '@/constants/routes';
import type { ApplicationWithSection, Section } from '@/types';
import styles from './page.module.scss';

interface EditApplicationPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit application page — Server Component.
 *
 * Fetches the application and available sections server-side.
 * Renders ApplicationForm in edit mode pre-filled with current values.
 * On save, the Server Action redirects to the detail view.
 */
export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Fetch the application and sections in parallel.
  const [{ data: appData, error: appError }, { data: sectionsData }] = await Promise.all([
    supabase
      .from('applications')
      .select('*, sections(name)')
      .eq('id', id)
      .single(),
    supabase
      .from('sections')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
  ]);

  if (appError || !appData) {
    notFound();
  }

  const application = appData as ApplicationWithSection;
  const sections = (sectionsData ?? []) as Section[];

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={ROUTES.APPLICATION_DETAIL(id)} className={styles.backLink}>
          <span aria-hidden="true">←</span> {application.company_name} — {application.position_title}
        </Link>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>Edit Application</h1>
      </header>

      <ApplicationForm
        initialData={application}
        sections={sections}
        cancelHref={ROUTES.APPLICATION_DETAIL(id)}
      />
    </div>
  );
}
