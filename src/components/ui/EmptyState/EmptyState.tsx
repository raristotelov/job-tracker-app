import Link from 'next/link';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  /** Render a link action pointing to this href. Ignored when `onAction` is provided. */
  actionHref?: string;
  /** Render a button action calling this callback. Takes precedence over `actionHref`. */
  onAction?: () => void;
}

export function EmptyState({ message, actionLabel, actionHref, onAction }: EmptyStateProps) {
  const showButton = actionLabel && onAction;
  const showLink = actionLabel && actionHref && !onAction;

  return (
    <div className={styles.container}>
      <p className={styles.message}>{message}</p>
      {showButton ? (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      ) : showLink ? (
        <Link href={actionHref} className={styles.action}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
