'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { logout } from '@/services/auth';
import styles from './layout.module.scss';

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Applications', href: ROUTES.APPLICATIONS },
  { label: 'Sections', href: ROUTES.SECTIONS },
];

interface SidebarNavProps {
  /** The authenticated user's email address, displayed in the sidebar footer. */
  userEmail: string;
}

/**
 * Client Component that renders the sidebar navigation links and footer.
 * Separated from the Server Component layout so it can use `usePathname`
 * to determine the active route.
 */
export function SidebarNav({ userEmail }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className={styles.nav} aria-label="Main navigation">
        <ul className={styles.navList}>
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href} className={styles.navItem}>
                <Link
                  href={href}
                  className={`${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <span className={styles.userEmail} title={userEmail}>
          {userEmail}
        </span>
        <form action={logout}>
          <button type="submit" className={styles.logoutButton}>
            Log out
          </button>
        </form>
      </div>
    </>
  );
}
