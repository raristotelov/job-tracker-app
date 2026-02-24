import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils/formatDate';
import { ROUTES } from '@/constants/routes';
import type { ApplicationWithSection } from '@/types';
import styles from './ApplicationTable.module.scss';

interface ApplicationTableProps {
  applications: ApplicationWithSection[];
}

/**
 * Renders a table of job applications.
 *
 * Each row is a clickable link to the application's detail page.
 * Optional fields that are null are shown as an em dash.
 * Text that overflows a cell is truncated with an ellipsis.
 */
export function ApplicationTable({ applications }: ApplicationTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Section</th>
            <th className={styles.th}>Company</th>
            <th className={styles.th}>Position</th>
            <th className={styles.th}>Location</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Date Applied</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className={styles.row}>
              <td className={styles.td}>
                <Link href={ROUTES.APPLICATION_DETAIL(app.id)} className={styles.rowLink}>
                  <span className={`${styles.cellText} ${styles.muted}`}>
                    {app.sections?.name ?? <span className={styles.placeholder}>—</span>}
                  </span>
                </Link>
              </td>
              <td className={styles.td}>
                <Link href={ROUTES.APPLICATION_DETAIL(app.id)} className={styles.rowLink}>
                  <span className={styles.cellText}>{app.company_name}</span>
                </Link>
              </td>
              <td className={styles.td}>
                <Link href={ROUTES.APPLICATION_DETAIL(app.id)} className={styles.rowLink}>
                  <span className={styles.cellText}>{app.position_title}</span>
                </Link>
              </td>
              <td className={styles.td}>
                <Link href={ROUTES.APPLICATION_DETAIL(app.id)} className={styles.rowLink}>
                  <span className={`${styles.cellText} ${styles.muted}`}>
                    {app.location ?? <span className={styles.placeholder}>—</span>}
                  </span>
                </Link>
              </td>
              <td className={styles.td}>
                <Link href={ROUTES.APPLICATION_DETAIL(app.id)} className={styles.rowLink}>
                  <StatusBadge status={app.status} />
                </Link>
              </td>
              <td className={styles.td}>
                <Link href={ROUTES.APPLICATION_DETAIL(app.id)} className={styles.rowLink}>
                  <span className={`${styles.cellText} ${styles.muted}`}>
                    {formatDate(app.date_applied)}
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
