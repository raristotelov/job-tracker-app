import type { ApplicationStatus } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants/status';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorKey = STATUS_COLORS[status];

  return (
    <span
      className={`${styles.badge} ${styles[`badge--${colorKey}`]}`}
      aria-label={`Status: ${STATUS_LABELS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
