'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { ConditionSelectorProps, SkinConditionScore } from '@/types/skin-diary';
import { CONDITION_EMOJIS, CONDITION_LABELS, CONDITION_COLORS } from '@/types/skin-diary';

/**
 * 피부 컨디션 선택기 컴포넌트
 * - 1-5 이모지 선택 UI
 * - 현재 선택 상태 표시
 */
const ConditionSelector = memo(function ConditionSelector({
  value,
  onChange,
  className,
}: ConditionSelectorProps) {
  const scores: SkinConditionScore[] = [1, 2, 3, 4, 5];

  return (
    <div className={cn('space-y-3', className)} data-testid="condition-selector">
      <label className="text-sm font-medium text-foreground">피부 컨디션</label>

      <div className="flex items-center justify-between gap-2">
        {scores.map((score) => {
          const isSelected = value === score;
          const emoji = CONDITION_EMOJIS[score];
          const label = CONDITION_LABELS[score];
          const color = CONDITION_COLORS[score];

          return (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200',
                'hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected && 'ring-2 ring-offset-2 bg-muted'
              )}
              style={isSelected ? ({ '--tw-ring-color': color } as React.CSSProperties) : undefined}
              aria-label={`피부 컨디션 ${score}점: ${label}`}
              aria-pressed={isSelected}
              data-testid={`condition-${score}`}
            >
              <span className="text-3xl" aria-hidden="true">
                {emoji}
              </span>
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {value && (
        <p className="text-sm text-muted-foreground text-center">
          오늘 피부 컨디션: {CONDITION_EMOJIS[value]} {CONDITION_LABELS[value]}
        </p>
      )}
    </div>
  );
});

export default ConditionSelector;
