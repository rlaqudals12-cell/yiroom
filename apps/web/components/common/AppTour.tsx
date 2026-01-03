'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppTour, type AppTourStep } from '@/hooks/useAppTour';
import { cn } from '@/lib/utils';

interface AppTourProps {
  /** 자동 시작 여부 */
  autoStart?: boolean;
}

/**
 * 앱 투어 컴포넌트
 * - 첫 방문 사용자에게 주요 기능 안내
 * - localStorage로 완료 상태 저장
 */
export function AppTour({ autoStart = true }: AppTourProps) {
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTour } =
    useAppTour({ autoStart });

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 타겟 요소 위치 계산
  const updateTargetPosition = useCallback(() => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }

    const target = document.querySelector(currentStep.targetSelector);
    if (target) {
      setTargetRect(target.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  if (!mounted || !isActive || !currentStep) {
    return null;
  }

  const tooltipPosition = getTooltipPosition(targetRect, currentStep.position);

  return createPortal(
    <div
      data-testid="app-tour"
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-label="앱 투어"
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" onClick={skipTour} aria-hidden="true" />

      {/* 하이라이트 영역 */}
      {targetRect && (
        <div
          data-testid="app-tour-spotlight"
          className="absolute bg-transparent ring-4 ring-primary rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* 툴팁 */}
      <div
        data-testid="app-tour-tooltip"
        className={cn(
          'absolute bg-card border rounded-xl shadow-lg p-4 max-w-xs',
          'animate-in fade-in-0 zoom-in-95'
        )}
        style={tooltipPosition}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {currentStepIndex + 1} / {totalSteps}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={skipTour}
            aria-label="투어 건너뛰기"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 내용 */}
        <h3 className="font-semibold text-foreground mb-1">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>

        {/* 진행률 인디케이터 */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === currentStepIndex ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            disabled={currentStepIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>

          <Button variant="default" size="sm" onClick={nextStep} className="gap-1">
            {currentStepIndex === totalSteps - 1 ? '완료' : '다음'}
            {currentStepIndex < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * 툴팁 위치 계산
 */
function getTooltipPosition(
  targetRect: DOMRect | null,
  position: AppTourStep['position'] = 'top'
): React.CSSProperties {
  if (!targetRect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const offset = 16;

  switch (position) {
    case 'bottom':
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2,
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        top: targetRect.top + targetRect.height / 2,
        right: window.innerWidth - targetRect.left + offset,
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        top: targetRect.top + targetRect.height / 2,
        left: targetRect.right + offset,
        transform: 'translateY(-50%)',
      };
    case 'top':
    default:
      return {
        bottom: window.innerHeight - targetRect.top + offset,
        left: targetRect.left + targetRect.width / 2,
        transform: 'translateX(-50%)',
      };
  }
}

export default AppTour;
