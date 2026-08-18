'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function HairHistoryError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[H-1 History] Page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="헤어 분석 기록을 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/analysis/hair"
      backLabel="분석으로"
      testId="hair-history-error-page"
    />
  );
}
