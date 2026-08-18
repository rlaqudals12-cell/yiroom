'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PersonalColorAnalysisError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[PC-1] Page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="퍼스널 컬러 분석 페이지를 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/home"
      backLabel="홈으로"
      testId="personal-color-error-page"
    />
  );
}
