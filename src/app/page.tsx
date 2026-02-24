import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

/**
 * Root page — immediately redirects to the applications dashboard.
 * Unauthenticated users are caught by middleware and sent to /login before
 * this component ever runs.
 */
export default function Home() {
  redirect(ROUTES.APPLICATIONS);
}
