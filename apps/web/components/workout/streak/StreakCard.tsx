'use client';

import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { StreakProgress } from './StreakProgress';
import { StreakBadgeList } from './StreakBadge';
import type { StreakSummary } from '@/lib/workout/streak';

interface StreakCardProps {
  summary: StreakSummary;
  onStartWorkout?: () => void;
}

/**
 * Streak 카드 컴포넌트
 * - 현재 연속 기록 표시
 * - 진행도 시각화
 * - 마일스톤 메시지
 */
export function StreakCard({ summary, onStartWorkout }: StreakCardProps) {
  const {
    currentStreak,
    longestStreak,
    isActive,
    nextMilestone,
    daysToNextMilestone,
    badges,
    message,
    warningMessage,
  } = summary;

  return (
    <div
      className="bg-card rounded-2xl p-6 shadow-sm"
      data-testid="streak-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-module-workout-light flex items-center justify-center">
            <Flame className="w-5 h-5 text-module-workout" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">연속 기록</h3>
            <p className="text-sm text-muted-foreground">
              {isActive ? '현재 진행 중' : '다시 시작해보세요'}
            </p>
          </div>
        </div>

        {/* 현재 streak 숫자 */}
        <div className="text-right">
          <p className="text-3xl font-bold text-module-workout">
            {currentStreak}
            <span className="text-lg text-muted-foreground">일</span>
          </p>
        </div>
      </div>

      {/* 진행도 - 다음 마일스톤까지 진행 상황 표시 */}
      {isActive && nextMilestone && nextMilestone <= 14 && (
        <div className="mb-4">
          <StreakProgress
            currentStreak={currentStreak}
            targetDays={nextMilestone}
          />
        </div>
      )}

      {/* 메시지 */}
      <div className="mb-4">
        <p className="text-foreground">{message}</p>
        {warningMessage && (
          <p className="text-module-workout-dark text-sm mt-1 font-medium">
            {warningMessage}
          </p>
        )}
      </div>

      {/* 다음 마일스톤 정보 */}
      {isActive && nextMilestone && daysToNextMilestone && (
        <div className="bg-module-workout-light rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-module-workout" />
            <span className="text-sm text-module-workout-dark">
              {nextMilestone}일 연속까지{' '}
              <span className="font-bold">{daysToNextMilestone}일</span> 남았어요!
            </span>
          </div>
        </div>
      )}

      {/* 최장 기록 */}
      {longestStreak > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Trophy className="w-4 h-4" />
          <span>최장 기록: {longestStreak}일</span>
        </div>
      )}

      {/* 획득한 배지 */}
      {badges.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">획득한 배지</p>
          <StreakBadgeList badges={badges} size="sm" />
        </div>
      )}

      {/* 운동 시작 버튼 (비활성 상태일 때) */}
      {!isActive && onStartWorkout && (
        <button
          onClick={onStartWorkout}
          className="w-full py-3 bg-module-workout text-white font-medium rounded-xl hover:bg-module-workout-dark transition-colors"
        >
          새로운 기록 시작하기
        </button>
      )}
    </div>
  );
}
