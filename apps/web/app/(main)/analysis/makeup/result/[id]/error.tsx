'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MakeupResultError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[M-1] Result page error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-muted" data-testid="makeup-result-error-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
            <span className="text-3xl">😥</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">결과를 불러올 수 없어요</h2>
          <p className="text-muted-foreground mb-6">
            메이크업 분석 결과 페이지에서 오류가 발생했어요
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/analysis/makeup">
                <ArrowLeft className="w-4 h-4 mr-2" />
                분석 페이지로
              </Link>
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
