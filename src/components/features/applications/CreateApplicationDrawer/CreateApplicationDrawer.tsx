'use client';

import { SideDrawer } from '@/components/ui/SideDrawer';
import { ApplicationForm } from '@/components/features/applications/ApplicationForm';
import type { Section } from '@/types';
import styles from './CreateApplicationDrawer.module.scss';

// =============================================================================
// TYPES
// =============================================================================

interface CreateApplicationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Feature wrapper that composes `SideDrawer` and `ApplicationForm` for inline
 * application creation.
 *
 * - Passes `onSuccess` and `onCancel` to `ApplicationForm` so the drawer
 *   closes after a successful submission or when the user cancels.
 * - Sections are passed through from the parent Server Component — no
 *   additional client-side fetch is needed.
 */
export function CreateApplicationDrawer({
  isOpen,
  onClose,
  sections,
}: CreateApplicationDrawerProps) {
  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} title="Add Application">
      <div className={styles.formWrapper}>
        <ApplicationForm
          sections={sections}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </SideDrawer>
  );
}
