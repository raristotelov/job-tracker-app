'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './SideDrawer.module.scss';

// =============================================================================
// TYPES
// =============================================================================

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// =============================================================================
// FOCUS TRAP HELPERS
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

/**
 * Generic slide-in side drawer that renders via `createPortal` to `document.body`.
 *
 * Responsibilities:
 * - Locks body scroll while open
 * - Traps keyboard focus within the panel
 * - Closes on Escape keydown or backdrop click
 * - Accessible: role="dialog", aria-modal, aria-labelledby
 * - Respects prefers-reduced-motion
 */
export function SideDrawer({ isOpen, onClose, title, children }: SideDrawerProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const titleId = `side-drawer-title-${generatedId}`;
  const wasOpenRef = useRef(false);

  // Avoid SSR mismatch — only render the portal after mount.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Lock body scroll while the drawer is open.
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
          // Shift+Tab: if focus is on first element, wrap to last.
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if focus is on last element, wrap to first.
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

  // Move focus to the first focusable element when the drawer opens.
  // Only fires on the false -> true transition to avoid stealing focus from
  // form validation that runs while the drawer is already open.
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (!isOpen || wasOpen || !panelRef.current) return;
    const focusable = getFocusableElements(panelRef.current);
    if (focusable.length > 0) {
      // Defer slightly so the animation frame doesn't interfere.
      const id = requestAnimationFrame(() => focusable[0].focus());
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  if (!hasMounted) return null;

  const drawer = (
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

      {/* Drawer panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close drawer"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
