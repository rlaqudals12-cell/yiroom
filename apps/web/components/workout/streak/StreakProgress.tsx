'use client';

import { Check, Circle } from 'lucide-react';

interface StreakProgressProps {
  currentStreak: number;
  targetDays?: number; // 목표 일수 (기본 7일)
  showLabels?: boolean;
}

/**
 * Streak 진행도 표시 컴포넌트
 * - 마일스톤 기준 진행도 시각화
 * - [✅][✅][⬜] 형태 (3일 마일스톤)
 * - [✅][✅][✅][✅][✅][✅][⬜] 형태 (7일 마일스톤)
 */
export function StreakProgress({
  currentStreak,
  targetDays = 7,
  showLabels = true,
}: StreakProgressProps) {
  // 표시할 일수 계산 (최소 3일, 최대 14일)
  const displayDays = Math.min(Math.max(targetDays, 3), 14);

  // 현재 streak이 목표보다 클 경우 처리
  const completedDays = Math.min(currentStreak, displayDays);
  const remainingDays = displayDays - completedDays;

  return (
    <div className="space-y-2" data-testid="streak-progress">
      {/* 진행도 바 */}
      <div className="flex items-center gap-1">
        {/* 완료된 날 */}
        {Array.from({ length: completedDays }).map((_, i) => (
          <div
            key={`completed-${i}`}
            className="w-8 h-8 rounded-lg bg-status-success flex items-center justify-center"
            aria-label={`${i + 1}일차 완료`}
          >
            <Check className="w-4 h-4 text-white" />
          </div>
        ))}

        {/* 남은 날 */}
        {Array.from({ length: remainingDays }).map((_, i) => (
          <div
            key={`remaining-${i}`}
            className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center"
            aria-label={`${completedDays + i + 1}일차 미완료`}
          >
            <Circle className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* 라벨 */}
      {showLabels && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {currentStreak}/{displayDays}일
          </span>
          {currentStreak >= displayDays && (
            <span className="text-status-success font-medium">목표 달성!</span>
          )}
        </div>
      )}
    </div>
  );
}
