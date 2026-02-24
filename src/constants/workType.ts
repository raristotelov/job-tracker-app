import type { WorkType } from '@/types/application';

/** All valid work arrangement type values. */
export const WORK_TYPES: WorkType[] = ['remote', 'hybrid', 'on_site'];

/** Human-readable display label for each work type. */
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  remote:  'Remote',
  hybrid:  'Hybrid',
  on_site: 'On Site',
};
