'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MakeupResultError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[M-1] Result page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      title="결과를 불러올 수 없어요"
      description="메이크업 분석 결과 페이지에서 오류가 발생했어요"
      onRetry={reset}
      backHref="/analysis/makeup"
      backLabel="분석 페이지로"
      testId="makeup-result-error-page"
    />
  );
}
