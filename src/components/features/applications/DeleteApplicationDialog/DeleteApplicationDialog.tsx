'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { deleteApplication } from '@/services/applications';
import styles from './DeleteApplicationDialog.module.scss';

interface DeleteApplicationDialogProps {
  applicationId: string;
  companyName: string;
  positionTitle: string;
}

/**
 * Delete confirmation for a job application.
 *
 * Renders as an inline trigger button ("Delete") that, when clicked, replaces
 * itself with a confirmation message and two action buttons. Confirming calls
 * the `deleteApplication` Server Action, which redirects to the applications
 * list on success. Cancelling closes the dialog without any data change.
 */
export function DeleteApplicationDialog({
  applicationId,
  companyName,
  positionTitle,
}: DeleteApplicationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteApplication(applicationId);
      // If result is returned, it means an error occurred (success redirects).
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError(null);
  };

  if (!isOpen) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div
      ref={dialogRef}
      className={styles.dialog}
      role="alert"
      tabIndex={-1}
    >
      {error ? <ErrorBanner message={error} /> : null}

      <p className={styles.message}>
        Are you sure you want to delete your application to{' '}
        <strong>{companyName}</strong> for <strong>{positionTitle}</strong>?{' '}
        This cannot be undone.
      </p>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleConfirm}
          isLoading={isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
