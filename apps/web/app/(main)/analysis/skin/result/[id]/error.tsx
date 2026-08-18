'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SkinResultError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[S-1] Result page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="피부 분석 결과를 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/home"
      backLabel="홈으로"
      testId="skin-result-error-page"
    />
  );
}
