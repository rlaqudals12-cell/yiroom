'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MakeupAnalysisError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[M-1] Page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="메이크업 분석 페이지를 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/home"
      backLabel="홈으로"
      testId="makeup-error-page"
    />
  );
}
