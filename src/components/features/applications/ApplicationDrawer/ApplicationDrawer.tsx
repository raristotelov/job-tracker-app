'use client';

import { SideDrawer } from '@/components/ui/SideDrawer';
import { ApplicationForm } from '@/components/features/applications/ApplicationForm';
import type { ApplicationWithSection, Section } from '@/types';
import styles from './ApplicationDrawer.module.scss';

// =============================================================================
// TYPES
// =============================================================================

interface ApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  /** When provided, the drawer opens in edit mode with the form pre-filled. */
  editTarget?: ApplicationWithSection;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Feature wrapper that composes `SideDrawer` and `ApplicationForm` for inline
 * application creation and editing.
 *
 * - In create mode (`editTarget` is undefined): renders a blank form with the
 *   title "Add Application".
 * - In edit mode (`editTarget` is provided): renders the form pre-filled with
 *   the target application's data and the title "Edit Application".
 * - Passes `onSuccess` and `onCancel` to `ApplicationForm` so the drawer
 *   closes after a successful submission or when the user cancels.
 * - Sections are passed through from the parent Server Component — no
 *   additional client-side fetch is needed.
 */
export function ApplicationDrawer({
  isOpen,
  onClose,
  sections,
  editTarget,
}: ApplicationDrawerProps) {
  const title = editTarget ? 'Edit Application' : 'Add Application';

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.formWrapper}>
        <ApplicationForm
          sections={sections}
          initialData={editTarget}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </SideDrawer>
  );
}
