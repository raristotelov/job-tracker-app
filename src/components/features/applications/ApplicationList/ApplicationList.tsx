'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/constants/routes';
import type { ApplicationWithSection } from '@/types';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { ApplicationTable } from './ApplicationTable';
import styles from './ApplicationList.module.scss';

interface ApplicationListProps {
  applications: ApplicationWithSection[];
}

/**
 * Client Component that manages view mode state (All vs. By Section) and
 * renders the application list accordingly.
 *
 * Receives all applications as a prop from the Server Component page.
 * Grouping into sections is computed client-side from the fetched array.
 */
export function ApplicationList({ applications }: ApplicationListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <Link href={ROUTES.APPLICATION_NEW} className={styles.addButton}>
          Add Application
        </Link>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          message="No applications yet. Add your first one to get started."
          actionLabel="Add Application"
          actionHref={ROUTES.APPLICATION_NEW}
        />
      ) : viewMode === 'all' ? (
        <ApplicationTable applications={applications} />
      ) : (
        <BySectionView applications={applications} />
      )}
    </div>
  );
}

// =============================================================================
// BY SECTION VIEW
// =============================================================================

interface BySectionViewProps {
  applications: ApplicationWithSection[];
}

/**
 * Groups applications by their section and renders each group under a heading.
 * Applications with no section appear under "Unsectioned" at the bottom.
 * Empty sections (no applications) are not rendered.
 */
function BySectionView({ applications }: BySectionViewProps) {
  // Build a map of section name -> applications.
  // The original date_applied desc ordering from the server query is preserved within each group.
  const groups = new Map<string, ApplicationWithSection[]>();

  for (const app of applications) {
    const key = app.sections?.name ?? '__unsectioned__';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(app);
  }

  // Alpha-sort named sections; unsectioned always goes last.
  const unsectionedApps = groups.get('__unsectioned__') ?? [];
  const namedGroups = Array.from(groups.entries())
    .filter(([key]) => key !== '__unsectioned__')
    .sort(([a], [b]) => a.localeCompare(b));

  const orderedGroups: Array<{ name: string; apps: ApplicationWithSection[] }> = [
    ...namedGroups.map(([name, apps]) => ({ name, apps })),
    ...(unsectionedApps.length > 0 ? [{ name: 'Unsectioned', apps: unsectionedApps }] : []),
  ];

  return (
    <div className={styles.sections}>
      {orderedGroups.map(({ name, apps }) => (
        <section key={name} className={styles.sectionGroup}>
          <h2 className={styles.sectionHeading}>
            {name}
            <span className={styles.sectionCount}>{apps.length}</span>
          </h2>
          <ApplicationTable applications={apps} />
        </section>
      ))}
    </div>
  );
}
