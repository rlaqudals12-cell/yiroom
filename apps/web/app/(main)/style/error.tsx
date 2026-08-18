'use client';

import { ErrorState } from '@/components/common/ErrorState';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} testId="style-error" />;
}
