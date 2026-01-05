'use client';

/**
 * 레벨 진행률 컴포넌트
 * 다음 레벨까지의 진행 상황 표시
 * @see docs/SPEC-LEVEL-SYSTEM.md
 */

import { cn } from '@/lib/utils';
import { LEVEL_COLORS, type Level } from '@/lib/levels';
import { LevelBadge } from './LevelBadge';

interface LevelProgressProps {
  level: Level;
  currentCount: number;
  nextThreshold: number | null;
  progress: number;
  showDetails?: boolean;
  className?: string;
}

export function LevelProgress({
  level,
  currentCount,
  nextThreshold,
  progress,
  showDetails = true,
  className,
}: LevelProgressProps) {
  const color = LEVEL_COLORS[level];
  const isMaxLevel = nextThreshold === null;

  return (
    <div className={cn('w-full', className)} data-testid="level-progress">
      {/* 헤더: 레벨 뱃지 + 활동 수 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <LevelBadge level={level} size="md" showLabel />
          {showDetails && (
            <span className="text-sm text-muted-foreground">{currentCount}회 활동</span>
          )}
        </div>
        {!isMaxLevel && showDetails && (
          <span className="text-xs text-muted-foreground">{progress}%</span>
        )}
      </div>

      {/* 프로그레스 바 */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: color.hex,
          }}
        />
      </div>

      {/* 다음 레벨 정보 */}
      {showDetails && (
        <div className="mt-1 text-xs text-muted-foreground">
          {isMaxLevel ? (
            <span>최고 레벨 달성!</span>
          ) : (
            <span>다음 레벨까지 {nextThreshold! - currentCount}회 남음</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 컴팩트한 레벨 진행률 (한 줄)
 */
interface LevelProgressCompactProps {
  level: Level;
  progress: number;
  className?: string;
}

export function LevelProgressCompact({ level, progress, className }: LevelProgressCompactProps) {
  const color = LEVEL_COLORS[level];

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="level-progress-compact">
      <LevelBadge level={level} size="sm" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: color.hex,
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
    </div>
  );
}

export default LevelProgress;
