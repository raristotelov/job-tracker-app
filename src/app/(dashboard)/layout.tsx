import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/constants/routes';
import { SidebarNav } from './SidebarNav';
import styles from './layout.module.scss';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * Server Component layout for all authenticated dashboard pages.
 * Fetches the current user session from Supabase and passes the email
 * down to the SidebarNav Client Component.
 *
 * If no valid session exists, redirects to the login page.
 * (Middleware already handles this, but the redirect here is a safety net.)
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  const userEmail = user.email ?? '';

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href={ROUTES.APPLICATIONS} className={styles.appTitleLink}>
            Job Tracker
          </Link>
        </div>

        <SidebarNav userEmail={userEmail} />
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
