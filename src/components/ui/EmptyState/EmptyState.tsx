import Link from 'next/link';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ message, actionLabel, actionHref }: EmptyStateProps) {
  const showAction = actionLabel && actionHref;

  return (
    <div className={styles.container}>
      <p className={styles.message}>{message}</p>
      {showAction ? (
        <Link href={actionHref} className={styles.action}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
