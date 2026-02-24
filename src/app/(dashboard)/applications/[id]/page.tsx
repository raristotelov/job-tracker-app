import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ApplicationDetail } from '@/components/features/applications/ApplicationDetail';
import { UpdatedSuccessBanner } from './UpdatedSuccessBanner';
import { ROUTES } from '@/constants/routes';
import type { ApplicationWithSection } from '@/types';
import styles from './page.module.scss';

interface ApplicationDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}

/**
 * Application detail page — Server Component.
 *
 * Fetches a single application (with section name) by ID. The RLS policy
 * ensures the record must belong to the authenticated user — any other ID
 * will return no data and trigger a 404.
 */
export default async function ApplicationDetailPage({ params, searchParams }: ApplicationDetailPageProps) {
  const { id } = await params;
  const { updated } = await searchParams;

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
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const application = data as ApplicationWithSection;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={ROUTES.APPLICATIONS} className={styles.backLink}>
          <span aria-hidden="true">←</span> Applications
        </Link>
      </nav>

      {updated === '1' ? (
        <UpdatedSuccessBanner detailPath={ROUTES.APPLICATION_DETAIL(id)} />
      ) : null}

      <ApplicationDetail application={application} />
    </div>
  );
}
