'use client';

import { useEffect, useState } from 'react';

interface AnalyzingLoaderProps {
  title?: string;
  subtitle?: string;
  messages?: string[];
  showProgress?: boolean;
  estimatedSeconds?: number;
}

/**
 * W-1 AI 분석 로딩 컴포넌트 (Task 3.7)
 *
 * 사용 예시:
 * <AnalyzingLoader
 *   title="AI가 분석 중입니다"
 *   subtitle="당신에게 맞는 운동을 찾고 있어요..."
 * />
 */
export default function AnalyzingLoader({
  title = 'AI가 분석 중입니다',
  subtitle = '당신에게 맞는 운동을 찾고 있어요...',
  messages,
  showProgress = false,
  estimatedSeconds = 3,
}: AnalyzingLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // 프로그레스 애니메이션
  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + (95 - prev) * 0.1;
      });
    }, estimatedSeconds * 10);

    return () => clearInterval(interval);
  }, [showProgress, estimatedSeconds]);

  // 메시지 순환
  useEffect(() => {
    if (!messages || messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages]);

  const displaySubtitle = messages ? messages[currentMessageIndex] : subtitle;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      {/* 스피너 애니메이션 */}
      <div className="relative">
        <div className="w-24 h-24 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 w-24 h-24 border-4 border-primary rounded-full border-t-transparent animate-spin" />
        {/* 중앙 아이콘 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 텍스트 */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground transition-opacity duration-300">
          {displaySubtitle}
        </p>
      </div>

      {/* 프로그레스 바 (선택적) */}
      {showProgress && (
        <div className="w-64">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {Math.round(progress)}% 완료
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 에러 상태 컴포넌트
 */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message = '오류가 발생했습니다.',
  onRetry,
  retryLabel = '다시 시도',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-16 h-16 bg-status-error/20 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-status-error"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
