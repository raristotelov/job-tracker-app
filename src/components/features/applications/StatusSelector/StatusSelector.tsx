'use client';

import { useState } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/constants/status';
import { updateApplicationStatus } from '@/services/statusActions';
import type { ApplicationStatus } from '@/types';
import styles from './StatusSelector.module.scss';

interface StatusSelectorProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus) => void;
}

const STATUS_OPTIONS = APPLICATION_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

export function StatusSelector({
  applicationId,
  currentStatus,
  onStatusChange,
}: StatusSelectorProps) {
  const [selected, setSelected] = useState<ApplicationStatus>(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSameStatus = selected === currentStatus;

  const handleSave = async () => {
    setError(null);
    setIsLoading(true);

    const result = await updateApplicationStatus(applicationId, selected);

    setIsLoading(false);

    if ('error' in result) {
      setSelected(currentStatus);
      setError(result.error);
      return;
    }

    onStatusChange(selected);
  };

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <Select
          label="Change status"
          id={`status-selector-${applicationId}`}
          options={STATUS_OPTIONS}
          value={selected}
          onChange={(e) => {
            const val = e.target.value;
            if (APPLICATION_STATUSES.includes(val as ApplicationStatus)) {
              setSelected(val as ApplicationStatus);
            }
          }}
          disabled={isLoading}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSave}
          disabled={isSameStatus || isLoading}
          isLoading={isLoading}
        >
          Save Status
        </Button>
      </div>
      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}
    </div>
  );
}
