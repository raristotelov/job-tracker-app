'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatusSelector } from '@/components/features/applications/StatusSelector';
import { formatDate } from '@/lib/utils/formatDate';
import { formatSalary } from '@/lib/utils/formatSalary';
import { WORK_TYPE_LABELS } from '@/constants/workType';
import type { ApplicationWithSection, ApplicationStatus } from '@/types';
import styles from './ApplicationDetailModal.module.scss';

// =============================================================================
// FOCUS TRAP HELPERS (same pattern as SideDrawer)
// =============================================================================

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ApplicationDetailModalProps {
  application: ApplicationWithSection | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: ApplicationStatus) => void;
}

const PLACEHOLDER = '—';

/**
 * Centered modal popup that displays all fields of a single application.
 *
 * Renders via createPortal to document.body.
 * Follows the same accessibility and UX patterns as SideDrawer:
 * body scroll lock, Escape key dismiss, backdrop click dismiss, focus trap.
 *
 * Returns null when application is null — safe to render unconditionally.
 */
export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onStatusChange,
}: ApplicationDetailModalProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = `modal-title-${generatedId}`;
  const wasOpenRef = useRef(false);

  // Avoid SSR mismatch — only render the portal after mount.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Close on Escape key and trap focus within the panel.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        const focusable = getFocusableElements(panelRef.current);
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Move focus to the first focusable element when the modal opens.
  // Only fires on the false → true transition.
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen || wasOpen || !panelRef.current) return;
    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length > 0) {
      const id = requestAnimationFrame(() => focusable[0].focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  if (!hasMounted) return null;
  if (application === null) return null;

  const {
    position_title,
    company_name,
    status,
    sections,
    location,
    work_type,
    salary_range_min,
    salary_range_max,
    date_applied,
    job_posting_url,
    created_at,
    updated_at,
  } = application;

  const modal = (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop — click to close */}
      <div
        className={styles.backdrop}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 id={titleId} className={styles.title}>{position_title}</h2>
            <p className={styles.company}>{company_name}</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className={styles.body}>
          {/* Status */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Status</h3>
            <StatusBadge status={status} />
            <StatusSelector
              applicationId={application.id}
              currentStatus={status}
              onStatusChange={onStatusChange}
            />
          </section>

          {/* Job Details */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Job Details</h3>
            <dl className={styles.grid}>
              <div className={styles.field}>
                <dt className={styles.fieldLabel}>Section</dt>
                <dd className={styles.fieldValue}>{sections?.name ?? PLACEHOLDER}</dd>
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

          {/* Timestamps */}
          <footer className={styles.timestamps}>
            <span>Created {formatDate(created_at)}</span>
            {new Date(updated_at).getTime() !== new Date(created_at).getTime() ? (
              <span> · Updated {formatDate(updated_at)}</span>
            ) : null}
          </footer>

        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
