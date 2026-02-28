'use client';

import { useState, useRef } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApplicationDrawer } from '@/components/features/applications/ApplicationDrawer';
import { ApplicationDetailModal } from '@/components/features/applications/ApplicationDetailModal';
import { deleteApplication } from '@/services/applications';
import type { ApplicationWithSection, Section, ApplicationStatus } from '@/types';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { ApplicationTable } from './ApplicationTable';
import styles from './ApplicationList.module.scss';

interface ApplicationListProps {
  applications: ApplicationWithSection[];
  sections: Section[];
}

/**
 * Client Component that manages view mode state (All vs. By Section) and
 * renders the application list accordingly.
 *
 * Receives applications and sections as props from the Server Component page.
 * Grouping into sections is computed client-side from the fetched array.
 * The inline creation/editing drawer is managed here — sections are passed
 * through to avoid a redundant client-side fetch.
 */
export function ApplicationList({ applications, sections }: ApplicationListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApplicationWithSection | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithSection | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Ref to the "Add Application" button for focus restoration after create.
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Ref to the row's "Edit" button for focus restoration after edit.
  const editTriggerRef = useRef<HTMLButtonElement | null>(null);

  const openDrawer = () => setIsDrawerOpen(true);

  const openEditDrawer = (app: ApplicationWithSection, buttonEl: HTMLButtonElement) => {
    editTriggerRef.current = buttonEl;
    setEditTarget(app);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    if (editTarget !== null) {
      // Restore focus to the row's Edit button.
      editTriggerRef.current?.focus();
    } else {
      // Restore focus to the Add Application button.
      triggerRef.current?.focus();
    }
    // Clear edit target after restoring focus so the next open defaults to create.
    setEditTarget(null);
  };

  const openDetail = (app: ApplicationWithSection) => {
    setSelectedApplication(app);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    // Keep selectedApplication set until the close animation completes (300ms)
    // so the popup content doesn't disappear before the fade-out finishes.
    setTimeout(() => setSelectedApplication(null), 300);
  };

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setSelectedApplication((prev) =>
      prev ? { ...prev, status: newStatus } : null,
    );
  };

  const handleDelete = async (app: ApplicationWithSection) => {
    const confirmed = window.confirm(
      `Delete "${app.position_title}" at ${app.company_name}? This cannot be undone.`,
    );
    if (!confirmed) return;

    const result = await deleteApplication(app.id);
    if ('error' in result) {
      alert(result.error);
    }
    // On success, revalidatePath in the server action triggers a re-render automatically.
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <ViewToggle value={viewMode} onChange={setViewMode} />
        <button
          ref={triggerRef}
          type="button"
          className={styles.addButton}
          onClick={openDrawer}
          disabled={isDrawerOpen}
        >
          Add Application
        </button>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          message="No applications yet. Add your first one to get started."
          actionLabel="Add Application"
          onAction={openDrawer}
        />
      ) : viewMode === 'all' ? (
        <ApplicationTable
          applications={applications}
          sections={sections}
          onEditClick={openEditDrawer}
          onDeleteClick={handleDelete}
          onRowClick={openDetail}
        />
      ) : (
        <BySectionView
          applications={applications}
          sections={sections}
          onEditClick={openEditDrawer}
          onDeleteClick={handleDelete}
          onRowClick={openDetail}
        />
      )}

      <ApplicationDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        sections={sections}
        editTarget={editTarget ?? undefined}
      />

      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={isDetailOpen}
        onClose={closeDetail}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

// =============================================================================
// BY SECTION VIEW
// =============================================================================

interface BySectionViewProps {
  applications: ApplicationWithSection[];
  sections: Section[];
  onEditClick: (application: ApplicationWithSection, buttonEl: HTMLButtonElement) => void;
  onDeleteClick: (application: ApplicationWithSection) => void;
  onRowClick: (application: ApplicationWithSection) => void;
}

/**
 * Groups applications by their section and renders each group under a heading.
 * Applications with no section appear under "Unsectioned" at the bottom.
 * Empty sections (no applications) are not rendered.
 */
function BySectionView({ applications, sections, onEditClick, onDeleteClick, onRowClick }: BySectionViewProps) {
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
          <ApplicationTable
            applications={apps}
            sections={sections}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            onRowClick={onRowClick}
          />
        </section>
      ))}
    </div>
  );
}
