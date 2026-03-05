'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Loader2, Check } from 'lucide-react';

// 분석 단계 메시지
const PHASE_MESSAGES: Record<string, string> = {
  preparing: '이미지를 준비하고 있어요',
  analyzing: 'AI가 분석 중이에요',
  generating: '결과를 생성하고 있어요',
  complete: '분석이 완료되었어요!',
};

interface AnalysisLoadingBaseProps {
  /** API 호출 완료 시 true로 설정 */
  isApiComplete?: boolean;
  /** API 완료 후 호출 (전환 애니메이션 후) */
  onComplete?: () => void;
  tips: string[];
  analysisItems: ReactNode;
  accentColor?: 'blue' | 'purple' | 'pink';
  loadingMessage?: string;
}

/**
 * 공통 분석 로딩 컴포넌트
 *
 * API 호출과 동기화된 단계별 프로그레스:
 * - preparing (0→30%): 이미지 준비 중 (1초)
 * - analyzing (30→75%): AI 분석 중 (API 응답 대기, 느린 진행)
 * - generating (75→95%): 결과 생성 (API 완료 후, 0.5초)
 * - complete (95→100%): 완료 전환
 */
export default function AnalysisLoadingBase({
  isApiComplete = false,
  onComplete,
  tips,
  analysisItems,
  accentColor = 'blue',
  loadingMessage,
}: AnalysisLoadingBaseProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'preparing' | 'analyzing' | 'generating' | 'complete'>(
    'preparing'
  );
  const [tipIndex, setTipIndex] = useState(0);

  // 색상 클래스 매핑
  const colorClasses = {
    blue: {
      spinner: 'text-blue-500',
      progressBar: 'bg-blue-500',
      check: 'text-blue-500',
    },
    purple: {
      spinner: 'text-purple-500',
      progressBar: 'bg-purple-500',
      check: 'text-purple-500',
    },
    pink: {
      spinner: 'text-pink-500',
      progressBar: 'bg-pink-500',
      check: 'text-pink-500',
    },
  };

  const colors = colorClasses[accentColor];
  const displayMessage = loadingMessage || PHASE_MESSAGES[phase];

  // Phase 1: preparing (0→30%, 1초)
  useEffect(() => {
    if (phase !== 'preparing') return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 30) {
          clearInterval(timer);
          setPhase('analyzing');
          return 30;
        }
        return prev + 1.5; // 1초에 30%
      });
    }, 50);

    return () => clearInterval(timer);
  }, [phase]);

  // Phase 2: analyzing (30→75%, 느린 진행 — API 대기)
  useEffect(() => {
    if (phase !== 'analyzing') return;

    // 느리게 진행 (최대 75%까지, ~20초에 걸쳐)
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 75) {
          clearInterval(timer);
          return 75;
        }
        // 점차 느려지는 속도 (로그 곡선)
        const remaining = 75 - prev;
        const increment = Math.max(0.05, remaining * 0.02);
        return Math.min(prev + increment, 75);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [phase]);

  // API 완료 시 → generating phase
  useEffect(() => {
    if (isApiComplete && phase === 'analyzing') {
      setPhase('generating');
    }
  }, [isApiComplete, phase]);

  // Phase 3: generating (→95%, 0.5초)
  useEffect(() => {
    if (phase !== 'generating') return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          setPhase('complete');
          return 95;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [phase]);

  // Phase 4: complete (→100%, 전환)
  useEffect(() => {
    if (phase !== 'complete') return;

    setProgress(100);
    const timer = setTimeout(() => {
      onComplete?.();
    }, 500);

    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  // 팁 순환 (3초 간격)
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [tips.length]);

  const isComplete = phase === 'complete';

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
          {isComplete ? (
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Check className={`w-8 h-8 ${colors.check}`} aria-hidden="true" />
            </div>
          ) : (
            <Loader2
              className={`w-16 h-16 ${colors.spinner} animate-spin`}
              aria-hidden="true"
              data-testid="loader-icon"
            />
          )}
        </div>
        <p className="mt-6 text-lg font-medium text-foreground">{displayMessage}</p>
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
            className={`h-full ${colors.progressBar} rounded-full transition-all duration-200 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 로딩 팁 */}
      <div className="bg-muted rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">💡 {tips[tipIndex]}</p>
      </div>

      {/* 분석 항목 목록 */}
      <div className="bg-card rounded-xl border p-4">
        <p className="text-sm font-medium text-foreground mb-3">분석 항목</p>
        {analysisItems}
      </div>
    </div>
  );
}
