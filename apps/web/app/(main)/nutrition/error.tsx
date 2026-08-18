'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function NutritionError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[N-1] Page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="영양 페이지를 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/dashboard"
      backLabel="대시보드로"
      testId="nutrition-error-page"
    />
  );
}
