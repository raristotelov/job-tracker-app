'use client';

import styles from './ViewToggle.module.scss';

export type ViewMode = 'all' | 'by-section';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Toggle control for switching the applications list between "All" (flat)
 * and "By Section" (grouped) display modes.
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle} role="group" aria-label="View mode">
      <button
        type="button"
        className={`${styles.option} ${value === 'all' ? styles.active : ''}`}
        aria-pressed={value === 'all'}
        onClick={() => onChange('all')}
      >
        All
      </button>
      <button
        type="button"
        className={`${styles.option} ${value === 'by-section' ? styles.active : ''}`}
        aria-pressed={value === 'by-section'}
        onClick={() => onChange('by-section')}
      >
        By Section
      </button>
    </div>
  );
}
