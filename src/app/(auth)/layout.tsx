import { ReactNode } from 'react';
import styles from './layout.module.scss';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout for all auth pages (login, signup).
 * Renders a centered card with the app title above the page content.
 * No navigation — this layout is intentionally minimal.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h1 className={styles.title}>Job Tracker</h1>
        {children}
      </div>
    </div>
  );
}
