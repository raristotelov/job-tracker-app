import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils/formatDate';
import { formatSalary } from '@/lib/utils/formatSalary';
import { WORK_TYPE_LABELS } from '@/constants/workType';
import { ROUTES } from '@/constants/routes';
import { DeleteApplicationDialog } from '@/components/features/applications/DeleteApplicationDialog';
import type { ApplicationWithSection } from '@/types';
import styles from './ApplicationDetail.module.scss';

interface ApplicationDetailProps {
  application: ApplicationWithSection;
}

/**
 * Displays all fields of a single application in a structured detail view.
 *
 * Server Component — only the DeleteApplicationDialog and the future
 * StatusSelector are Client Components embedded within.
 */
export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const {
    id,
    company_name,
    position_title,
    job_posting_url,
    location,
    work_type,
    salary_range_min,
    salary_range_max,
    status,
    date_applied,
    sections,
    created_at,
    updated_at,
  } = application;

  const PLACEHOLDER = '—';

  return (
    <article className={styles.detail}>
      {/* ——— Header ——— */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{position_title}</h1>
          <p className={styles.company}>{company_name}</p>
        </div>

        <div className={styles.headerActions}>
          <Link href={ROUTES.APPLICATION_EDIT(id)} className={styles.editLink}>
            Edit
          </Link>
          <DeleteApplicationDialog
            applicationId={id}
            companyName={company_name}
            positionTitle={position_title}
          />
        </div>
      </header>

      {/* ——— Status ——— */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Status</h2>
        <StatusBadge status={status} />
      </section>

      {/* ——— Job Details ——— */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Job Details</h2>

        <dl className={styles.grid}>
          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Section</dt>
            <dd className={styles.fieldValue}>
              {sections?.name ?? PLACEHOLDER}
            </dd>
          </div>

          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Location</dt>
            <dd className={styles.fieldValue}>{location ?? PLACEHOLDER}</dd>
          </div>

          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Work Type</dt>
            <dd className={styles.fieldValue}>
              {work_type ? WORK_TYPE_LABELS[work_type] : PLACEHOLDER}
            </dd>
          </div>

          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Salary Range</dt>
            <dd className={styles.fieldValue}>
              {formatSalary(salary_range_min, salary_range_max)}
            </dd>
          </div>

          <div className={styles.field}>
            <dt className={styles.fieldLabel}>Date Applied</dt>
            <dd className={styles.fieldValue}>{formatDate(date_applied)}</dd>
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <dt className={styles.fieldLabel}>Job Posting URL</dt>
            <dd className={styles.fieldValue}>
              {job_posting_url ? (
                <a
                  href={job_posting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  {job_posting_url}
                </a>
              ) : (
                PLACEHOLDER
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* ——— Timestamps ——— */}
      <footer className={styles.timestamps}>
        <span>Created {formatDate(created_at)}</span>
        {new Date(updated_at).getTime() !== new Date(created_at).getTime() ? (
          <span> · Updated {formatDate(updated_at)}</span>
        ) : null}
      </footer>
    </article>
  );
}
