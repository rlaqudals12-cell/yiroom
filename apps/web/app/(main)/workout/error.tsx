'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WorkoutError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[W-1] Error:', error);
  }, [error]);

  return (
    <ErrorState
      description="운동 모듈에서 오류가 발생했어요. 다시 시도해주세요."
      onRetry={reset}
      backHref="/dashboard"
      backLabel="대시보드로"
      testId="workout-error-page"
    />
  );
}
