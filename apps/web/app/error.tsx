'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry 에러 리포팅
    Sentry.captureException(error);
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-pink-50 to-white">
      {/* 에러 아이콘 */}
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>

      {/* 에러 메시지 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          문제가 발생했어요
        </h1>
        <p className="text-gray-500 max-w-md">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-2">
            오류 코드: {error.digest}
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          다시 시도
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2 w-full">
            <Home className="h-4 w-4" />
            홈으로 돌아가기
          </Button>
        </Link>
      </div>
    </div>
  );
}
