'use client';

import { memo } from 'react';
import { Sun, Moon, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { getCategoryInfo, formatDuration } from '@/lib/mock/skincare-routine';
import type { RoutineCardProps } from '@/types/skincare-routine';

/**
 * 루틴 요약 카드 컴포넌트
 * - 시간대별 루틴 요약 표시
 * - 단계 수, 소요 시간 표시
 * - 클릭 시 상세 보기
 */
const RoutineCard = memo(function RoutineCard({
  timeOfDay,
  steps,
  estimatedTime,
  isActive = false,
  onSelect,
  className,
}: RoutineCardProps) {
  const isMorning = timeOfDay === 'morning';
  const Icon = isMorning ? Sun : Moon;

  // 필수/선택 단계 분리
  const requiredSteps = steps.filter((s) => !s.isOptional);
  const optionalSteps = steps.filter((s) => s.isOptional);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md',
        isActive && 'ring-2 ring-primary ring-offset-2',
        isMorning
          ? 'hover:border-amber-300 dark:hover:border-amber-700'
          : 'hover:border-indigo-300 dark:hover:border-indigo-700',
        className
      )}
      onClick={onSelect}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      data-testid="routine-card"
    >
      {/* 헤더 */}
      <CardHeader
        className={cn(
          'pb-3',
          isMorning
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
            : 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isMorning ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{isMorning ? '아침 루틴' : '저녁 루틴'}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{steps.length}단계</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>{formatDuration(estimatedTime)}</span>
                </div>
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </CardHeader>

      {/* 단계 미리보기 */}
      <CardContent className="pt-4">
        {/* 필수 단계 */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">필수 단계</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredSteps.map((step) => {
              const categoryInfo = getCategoryInfo(step.category);
              return (
                <div
                  key={`${step.category}-${step.order}`}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                  title={step.name}
                >
                  <span>{categoryInfo.emoji}</span>
                  <span className="font-medium">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 선택 단계 */}
        {optionalSteps.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              선택 단계 ({optionalSteps.length}개)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {optionalSteps.slice(0, 4).map((step) => {
                const categoryInfo = getCategoryInfo(step.category);
                return (
                  <div
                    key={`${step.category}-${step.order}`}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
                    title={step.name}
                  >
                    <span>{categoryInfo.emoji}</span>
                    <span>{step.name}</span>
                  </div>
                );
              })}
              {optionalSteps.length > 4 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{optionalSteps.length - 4}개
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default RoutineCard;
