'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[W-1] Error:', error);
  }, [error]);

  return (
    <div
      className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4"
      data-testid="workout-error-page"
    >
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">💪</div>
        <h2 className="text-xl font-bold text-foreground mb-2">문제가 발생했어요</h2>
        <p className="text-muted-foreground mb-6">
          운동 모듈에서 오류가 발생했어요. 다시 시도해주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              대시보드로
            </Link>
          </Button>
          <Button onClick={() => reset()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}
