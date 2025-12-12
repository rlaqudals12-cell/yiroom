'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AnalysisLoadingBaseProps {
  onComplete: () => void;
  tips: string[];
  analysisItems: ReactNode;
  accentColor?: 'blue' | 'purple' | 'pink';
  duration?: number;
  loadingMessage?: string;
}

/**
 * 공통 분석 로딩 컴포넌트
 * S-1 피부 분석과 C-1 체형 분석에서 공통으로 사용
 */
export default function AnalysisLoadingBase({
  onComplete,
  tips,
  analysisItems,
  accentColor = 'blue',
  duration = 3000,
  loadingMessage = '분석 중...',
}: AnalysisLoadingBaseProps) {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // 색상 클래스 매핑
  const colorClasses = {
    blue: {
      spinner: 'text-blue-500',
      progressBar: 'bg-blue-500',
    },
    purple: {
      spinner: 'text-purple-500',
      progressBar: 'bg-purple-500',
    },
    pink: {
      spinner: 'text-pink-500',
      progressBar: 'bg-pink-500',
    },
  };

  const colors = colorClasses[accentColor];

  // 프로그레스 바 애니메이션
  useEffect(() => {
    const interval = 50;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration]);

  // 분석 완료 (100% 도달 시)
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  // 팁 순환 (3초 간격 - 스펙 기준)
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [tips.length]);

  return (
    <div className="space-y-8">
      {/* 로딩 애니메이션 */}
      <div
        className="flex flex-col items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-label={`분석 중 ${Math.round(progress)}% 완료`}
      >
        <div className="relative">
          <Loader2 className={`w-16 h-16 ${colors.spinner} animate-spin`} aria-hidden="true" data-testid="loader-icon" />
        </div>
        <p className="mt-6 text-lg font-medium text-foreground">{loadingMessage}</p>
        <p className="text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      {/* 프로그레스 바 */}
      <div className="px-4">
        <div
          className="h-2 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full ${colors.progressBar} rounded-full transition-all duration-100 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 로딩 팁 */}
      <div className="bg-muted rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">
          💡 {tips[tipIndex]}
        </p>
      </div>

      {/* 분석 항목 목록 */}
      <div className="bg-card rounded-xl border p-4">
        <p className="text-sm font-medium text-foreground mb-3">분석 항목</p>
        {analysisItems}
      </div>
    </div>
  );
}
