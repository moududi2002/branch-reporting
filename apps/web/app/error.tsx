// apps/web/app/error.tsx
'use client';
import { useEffect } from 'react';
import { ErrorState } from '@/components/ErrorState';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return <ErrorState variant="error" error={error} onRetry={reset} />;
}