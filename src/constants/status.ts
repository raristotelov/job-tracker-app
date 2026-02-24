import type { ApplicationStatus } from '@/types/application';

/** All valid application pipeline status values, in pipeline order. */
export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'applied',
  'interview_scheduled',
  'interview_completed',
  'offer_received',
  'rejected',
];

/** Human-readable display label for each application status. */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied:              'Applied',
  interview_scheduled:  'Interview Scheduled',
  interview_completed:  'Interview Completed',
  offer_received:       'Offer Received',
  rejected:             'Rejected',
};

/**
 * Color identifier for each application status.
 * Maps to the CSS class suffix used by StatusBadge (e.g. "gray" -> .badge--gray).
 */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied:              'gray',
  interview_scheduled:  'blue',
  interview_completed:  'purple',
  offer_received:       'green',
  rejected:             'red',
};
