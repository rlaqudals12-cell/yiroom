'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface StepNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** 로딩 상태 (다음 버튼에 스피너 표시) */
  isLoading?: boolean;
  /** 다음 버튼 텍스트 커스텀 */
  nextLabel?: string;
  /** 마지막 단계 버튼 텍스트 커스텀 */
  submitLabel?: string;
}

export default function StepNavigation({
  isFirstStep,
  isLastStep,
  canProceed,
  onPrev,
  onNext,
  isLoading = false,
  nextLabel = '다음',
  submitLabel = '분석 시작',
}: StepNavigationProps) {
  const isDisabled = !canProceed || isLoading;
  const buttonLabel = isLastStep ? submitLabel : nextLabel;

  return (
    <div className="flex gap-3 mt-8">
      {/* 이전 버튼 */}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrev}
          disabled={isLoading}
          className={`flex-1 py-4 px-6 border border-border text-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
            isLoading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-muted'
          }`}
          aria-label="이전 단계로 이동"
        >
          <ChevronLeft className="w-5 h-5" />
          이전
        </button>
      )}

      {/* 다음/분석 시작 버튼 */}
      <button
        type="button"
        onClick={onNext}
        disabled={isDisabled}
        className={`flex-1 py-4 px-6 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${
          isDisabled
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-white'
        } ${isFirstStep ? 'w-full' : ''}`}
        aria-label={isLastStep ? '분석 시작하기' : '다음 단계로 이동'}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            {buttonLabel}
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </>
        )}
      </button>
    </div>
  );
}
