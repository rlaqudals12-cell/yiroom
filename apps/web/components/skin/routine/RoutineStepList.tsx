'use client';

import { memo } from 'react';
import { Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import RoutineStepItem from './RoutineStepItem';
import type { RoutineStepListProps } from '@/types/skincare-routine';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('skinUI');
  // 0단계 프리스텝도 승인 문구 카탈로그를 쓴다.
  // 상수(HAND_WASH_PRESTEP)를 그대로 렌더하면 다른 로케일에서 이 줄만 한국어로 남는다.
  const claimText = useTranslations('skincareClaims');
  // 순서대로 정렬
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  if (sortedSteps.length === 0) {
    return (
      <div
        className={cn('text-center py-8 text-muted-foreground', className)}
        data-testid="routine-step-list-empty"
      >
        <p>{t('routineStepList0')}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="routine-step-list">
      {/* 0단계 손 씻기 — 초보자용 고정 안내 행 (체크 불요, 아이콘 + 한 줄) */}
      <div
        className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30 p-3"
        data-testid="routine-handwash-step"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          0
        </div>
        <Droplets className="h-4 w-4 flex-shrink-0 text-sky-500" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{claimText('handWashLabel')}</p>
          {/* 위생 근거까지 읽혀야 하므로 한 줄 자르기 대신 두 줄까지 허용한다. */}
          <p className="line-clamp-2 text-xs text-muted-foreground">{claimText('handWash')}</p>
        </div>
      </div>

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
