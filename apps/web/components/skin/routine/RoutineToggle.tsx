'use client';

import { memo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoutineToggleProps } from '@/types/skincare-routine';

/**
 * 아침/저녁 루틴 토글 컴포넌트
 * - 시간대 선택 UI
 * - 각 시간대의 단계 수 표시
 */
const RoutineToggle = memo(function RoutineToggle({
  activeTime,
  onToggle,
  morningStepCount,
  eveningStepCount,
  className,
}: RoutineToggleProps) {
  return (
    <div
      className={cn('flex bg-muted/50 rounded-xl p-1 gap-1', className)}
      data-testid="routine-toggle"
      role="tablist"
      aria-label="루틴 시간대 선택"
    >
      {/* 아침 버튼 */}
      <button
        role="tab"
        aria-selected={activeTime === 'morning'}
        aria-controls="morning-routine-panel"
        onClick={() => onToggle('morning')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
          activeTime === 'morning'
            ? 'bg-amber-500 text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        data-testid="morning-toggle-button"
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
        <span>아침</span>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            activeTime === 'morning'
              ? 'bg-white/20 text-white'
              : 'bg-muted-foreground/10 text-muted-foreground'
          )}
        >
          {morningStepCount}단계
        </span>
      </button>

      {/* 저녁 버튼 */}
      <button
        role="tab"
        aria-selected={activeTime === 'evening'}
        aria-controls="evening-routine-panel"
        onClick={() => onToggle('evening')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
          activeTime === 'evening'
            ? 'bg-indigo-500 text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        data-testid="evening-toggle-button"
      >
        <Moon className="h-4 w-4" aria-hidden="true" />
        <span>저녁</span>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            activeTime === 'evening'
              ? 'bg-white/20 text-white'
              : 'bg-muted-foreground/10 text-muted-foreground'
          )}
        >
          {eveningStepCount}단계
        </span>
      </button>
    </div>
  );
});

export default RoutineToggle;
