'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { SuccessMessage } from '@/components/ui/SuccessMessage';

interface UpdatedSuccessBannerProps {
  /** The canonical path of this detail page, used to replace the URL on dismiss. */
  detailPath: string;
}

/**
 * Renders a dismissable success banner after a successful edit save.
 *
 * On dismiss (manual or auto), replaces the current URL with the clean detail
 * path so the `?updated=1` query param is removed without a full page reload.
 */
export function UpdatedSuccessBanner({ detailPath }: UpdatedSuccessBannerProps) {
  const router = useRouter();

  const handleDismiss = useCallback(() => {
    router.replace(detailPath);
  }, [router, detailPath]);

  return (
    <SuccessMessage
      message="Your changes have been saved."
      onDismiss={handleDismiss}
    />
  );
}
