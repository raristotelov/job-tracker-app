'use client';

import styles from './ErrorBanner.module.scss';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <p className={styles.message}>{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className={styles.dismiss}
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      ) : null}
    </div>
  );
}
