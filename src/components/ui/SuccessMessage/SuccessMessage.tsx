'use client';

import { useEffect } from 'react';
import styles from './SuccessMessage.module.scss';

const AUTO_DISMISS_DELAY_MS = 3000;

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  useEffect(() => {
    if (!onDismiss) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_DELAY_MS);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <p className={styles.message}>{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      ) : null}
    </div>
  );
}
