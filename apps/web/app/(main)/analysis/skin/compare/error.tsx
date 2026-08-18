'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SkinCompareError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[S-1 Compare] Page error:', error.message);
  }, [error]);

  return (
    <ErrorState
      description="피부 분석 비교 페이지를 불러오는 중 오류가 발생했어요"
      onRetry={reset}
      backHref="/analysis/skin"
      backLabel="분석으로"
      testId="skin-compare-error-page"
    />
  );
}
