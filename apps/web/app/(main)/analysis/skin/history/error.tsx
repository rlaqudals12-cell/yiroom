'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SkinHistoryError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[S-1 History] Page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="피부 분석 기록을 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/analysis/skin"
      backLabel="분석으로"
      testId="skin-history-error-page"
    />
  );
}
