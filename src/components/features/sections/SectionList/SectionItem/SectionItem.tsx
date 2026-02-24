'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { renameSection, deleteSection } from '@/services/sections';
import type { SectionWithCount } from '@/types';
import styles from './SectionItem.module.scss';

interface SectionItemProps {
  section: SectionWithCount;
}

type Mode = 'view' | 'rename' | 'delete';

/**
 * A single row in the sections management list.
 *
 * Shows the section name and application count. Provides:
 * - Inline rename: clicking "Rename" reveals an input pre-filled with the
 *   current name. Confirmed with Enter or "Save", cancelled with Escape or
 *   "Cancel". Optimistic UI: applies the new name locally, reverts on failure.
 * - Inline delete confirmation: clicking "Delete" reveals a contextual
 *   confirmation message (different copy depending on whether the section has
 *   applications). Confirmed with "Delete", cancelled with "Cancel".
 */
export function SectionItem({ section }: SectionItemProps) {
  const [mode, setMode] = useState<Mode>('view');
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic display name — set immediately on save attempt, reverted on failure.
  const [optimisticName, setOptimisticName] = useState<string | null>(null);
  const displayName = optimisticName ?? section.name;

  const renameInputRef = useRef<HTMLInputElement>(null);
  const deleteConfirmRef = useRef<HTMLDivElement>(null);

  // Focus the rename input when entering rename mode.
  useEffect(() => {
    if (mode === 'rename') {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [mode]);

  // Focus the delete confirmation region when entering delete mode.
  useEffect(() => {
    if (mode === 'delete') {
      deleteConfirmRef.current?.focus();
    }
  }, [mode]);

  const cancelRename = useCallback(() => {
    setMode('view');
    setError(null);
    setFieldError(null);
    setOptimisticName(null);
  }, []);

  const cancelDelete = useCallback(() => {
    setMode('view');
    setError(null);
  }, []);

  // ============================================================
  // RENAME
  // ============================================================

  const handleRenameSubmit = () => {
    const newName = renameInputRef.current?.value.trim() ?? '';

    if (newName === '') {
      setFieldError('Section name cannot be empty');
      return;
    }
    if (newName.length > 100) {
      setFieldError('Section name must be 100 characters or fewer');
      return;
    }

    setFieldError(null);
    setError(null);

    const formData = new FormData();
    formData.set('name', newName);

    // Apply optimistic update and switch back to view mode immediately.
    setOptimisticName(newName);
    setMode('view');

    startTransition(async () => {
      const result = await renameSection(section.id, formData);
      if (result !== null) {
        // Revert to original name on failure.
        setOptimisticName(null);
        setFieldError(result.fieldErrors?.name ?? null);
        setError(result.fieldErrors ? null : result.error);
        setMode('rename');
      }
    });
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDeleteConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteSection(section.id);
      if (result !== null) {
        setError(result.error);
      }
      // On success, revalidatePath removes the row from the server-rendered list.
    });
  };

  const count = section.application_count;

  const deleteMessage =
    count > 0
      ? `Deleting "${displayName}" will move ${count} ${count === 1 ? 'application' : 'applications'} to Unsectioned. Continue?`
      : `Delete "${displayName}"? This cannot be undone.`;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <li className={styles.item}>
      {/* ── Rename mode ── */}
      {mode === 'rename' ? (
        <div className={styles.renameRow}>
          <div className={styles.renameInputWrapper}>
            <input
              ref={renameInputRef}
              type="text"
              defaultValue={section.name}
              maxLength={100}
              className={`${styles.renameInput} ${fieldError ? styles.renameInputError : ''}`}
              aria-label="Section name"
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? `rename-error-${section.id}` : undefined}
              onKeyDown={handleRenameKeyDown}
              disabled={isPending}
            />
            {fieldError ? (
              <span
                id={`rename-error-${section.id}`}
                className={styles.fieldError}
                role="alert"
              >
                {fieldError}
              </span>
            ) : null}
          </div>

          <div className={styles.renameActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRenameSubmit}
              isLoading={isPending}
            >
              Save
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={cancelRename}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        /* ── View mode ── */
        <div className={styles.viewRow}>
          <div className={styles.nameWrapper}>
            <span className={styles.name}>{displayName}</span>
            <span className={styles.count}>
              {count} {count === 1 ? 'application' : 'applications'}
            </span>
          </div>

          <div className={styles.viewActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMode('rename');
                setError(null);
                setFieldError(null);
              }}
              disabled={isPending}
            >
              Rename
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setMode('delete');
                setError(null);
              }}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation (shown below the view row) ── */}
      {mode === 'delete' ? (
        <div
          ref={deleteConfirmRef}
          className={styles.deleteConfirm}
          role="alert"
          tabIndex={-1}
        >
          {error ? <ErrorBanner message={error} /> : null}

          <p className={styles.deleteMessage}>{deleteMessage}</p>

          <div className={styles.deleteActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={cancelDelete}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              isLoading={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      {/* Top-level error banner for rename network failures */}
      {mode !== 'rename' && error && mode !== 'delete' ? (
        <ErrorBanner message={error} />
      ) : null}
    </li>
  );
}
