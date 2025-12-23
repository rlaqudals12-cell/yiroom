'use client';

import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import type { ChallengeProgress as ChallengeProgressType } from '@/types/challenges';

interface ChallengeProgressProps {
  progress: ChallengeProgressType;
  durationDays: number;
  showDayIndicators?: boolean;
  targetCount?: number; // count 타입 챌린지의 목표 횟수
  className?: string;
}

/**
 * 챌린지 진행 상황 표시 컴포넌트
 */
export function ChallengeProgress({
  progress,
  durationDays,
  showDayIndicators = true,
  targetCount,
  className,
}: ChallengeProgressProps) {
  const completedDays = progress.completedDays || [];
  const missedDays = progress.missedDays || [];

  // 진행률 계산
  const calculatePercentage = (): number => {
    if (progress.percentage !== undefined) return progress.percentage;

    // count 타입 챌린지
    if (targetCount && progress.completedCount !== undefined) {
      return Math.min(100, Math.round((progress.completedCount / targetCount) * 100));
    }

    // completedDays 기반
    if (completedDays.length > 0 && (progress.totalDays || durationDays)) {
      const total = progress.totalDays || durationDays;
      return Math.min(100, Math.round((completedDays.length / total) * 100));
    }

    // currentDays 기반 (streak)
    if (progress.currentDays !== undefined && (progress.totalDays || durationDays)) {
      const total = progress.totalDays || durationDays;
      return Math.min(100, Math.round((progress.currentDays / total) * 100));
    }

    return 0;
  };

  const percentage = calculatePercentage();

  // 각 날짜의 상태 결정
  const getDayStatus = (day: number): 'completed' | 'missed' | 'pending' | 'future' => {
    if (completedDays.includes(day)) return 'completed';
    if (missedDays.includes(day)) return 'missed';

    // 현재 진행 일수 기준으로 past/future 결정
    const currentDay = progress.currentDays || 0;
    if (day <= currentDay) return 'pending';
    return 'future';
  };

  return (
    <div className={cn('space-y-3', className)} data-testid="challenge-progress">
      {/* 진행률 바 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">진행률</span>
          <span className="font-medium text-foreground">{percentage}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percentage >= 100 ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 일별 표시 */}
      {showDayIndicators && durationDays <= 30 && (
        <div className="space-y-2" data-testid="day-indicators">
          <span className="text-xs text-muted-foreground">일별 달성</span>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: durationDays }).map((_, index) => {
              const day = index + 1;
              const status = getDayStatus(day);

              return (
                <div
                  key={day}
                  data-testid={`day-indicator-${status}`}
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium transition-colors',
                    status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    status === 'missed' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    status === 'pending' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    status === 'future' && 'bg-muted text-muted-foreground'
                  )}
                  title={`${day}일차: ${getStatusLabel(status)}`}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : status === 'missed' ? (
                    <X className="w-4 h-4" />
                  ) : (
                    day
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 요약 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30" />
          <span>완료 {completedDays.length}일</span>
        </div>
        {missedDays.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/30" />
            <span>실패 {missedDays.length}일</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted" />
          <span>남음 {durationDays - completedDays.length - missedDays.length}일</span>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: 'completed' | 'missed' | 'pending' | 'future'): string {
  switch (status) {
    case 'completed':
      return '완료';
    case 'missed':
      return '실패';
    case 'pending':
      return '대기중';
    case 'future':
      return '예정';
  }
}

export default ChallengeProgress;
