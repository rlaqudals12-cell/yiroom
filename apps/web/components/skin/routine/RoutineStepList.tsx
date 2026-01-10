'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import RoutineStepItem from './RoutineStepItem';
import type { RoutineStepListProps } from '@/types/skincare-routine';

/**
 * 루틴 단계 목록 컴포넌트
 * - 단계 아이템 렌더링
 * - 연결선 표시
 */
const RoutineStepList = memo(function RoutineStepList({
  steps,
  showProducts = false,
  onProductClick,
  className,
}: RoutineStepListProps) {
  // 순서대로 정렬
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  if (sortedSteps.length === 0) {
    return (
      <div
        className={cn('text-center py-8 text-muted-foreground', className)}
        data-testid="routine-step-list-empty"
      >
        <p>루틴 단계가 없어요</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="routine-step-list">
      {sortedSteps.map((step, index) => (
        <div key={`${step.category}-${step.order}`} className="relative">
          {/* 연결선 (마지막 아이템 제외) */}
          {index < sortedSteps.length - 1 && (
            <div
              className="absolute left-[2.25rem] top-full w-0.5 h-3 bg-border z-0"
              aria-hidden="true"
            />
          )}

          <RoutineStepItem
            step={step}
            showProducts={showProducts}
            onProductClick={onProductClick}
          />
        </div>
      ))}
    </div>
  );
});

export default RoutineStepList;
