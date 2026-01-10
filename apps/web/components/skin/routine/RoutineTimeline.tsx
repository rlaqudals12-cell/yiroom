'use client';

import { memo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/mock/skincare-routine';
import type { RoutineTimelineProps } from '@/types/skincare-routine';

/**
 * 루틴 타임라인 컴포넌트
 * - 수평 스크롤 타임라인 뷰
 * - 현재 진행 단계 표시
 * - 완료 상태 표시
 */
const RoutineTimeline = memo(function RoutineTimeline({
  steps,
  currentStep = 0,
  onStepClick,
  className,
}: RoutineTimelineProps) {
  // 순서대로 정렬
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  return (
    <div className={cn('w-full overflow-x-auto', className)} data-testid="routine-timeline">
      <div className="flex items-center gap-2 min-w-max px-4 py-2">
        {sortedSteps.map((step, index) => {
          const categoryInfo = getCategoryInfo(step.category);
          const isCompleted = currentStep > step.order;
          const isCurrent = currentStep === step.order;
          const isPending = currentStep < step.order;

          return (
            <div key={`${step.category}-${step.order}`} className="flex items-center">
              {/* 단계 버튼 */}
              <button
                onClick={() => onStepClick?.(step)}
                disabled={!onStepClick}
                className={cn(
                  'relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                  onStepClick && 'hover:bg-muted cursor-pointer',
                  isCurrent && 'scale-110'
                )}
                aria-label={`${step.order}단계: ${step.name}`}
                aria-current={isCurrent ? 'step' : undefined}
                data-testid={`timeline-step-${step.order}`}
              >
                {/* 아이콘 */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary/20 ring-2 ring-primary ring-offset-2',
                    isPending && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <span>{categoryInfo.emoji}</span>
                  )}
                </div>

                {/* 라벨 */}
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isCompleted && 'text-primary',
                    isCurrent && 'text-foreground',
                    isPending && 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </span>

                {/* 소요 시간 */}
                {step.duration && (
                  <span className="text-[10px] text-muted-foreground">{step.duration}</span>
                )}
              </button>

              {/* 연결선 (마지막 아이템 제외) */}
              {index < sortedSteps.length - 1 && (
                <div
                  className={cn('w-6 h-0.5 mx-1', isCompleted ? 'bg-primary' : 'bg-border')}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default RoutineTimeline;
