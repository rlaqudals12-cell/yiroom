/**
 * N-1 Streak UI 컴포넌트 (Task 3.6)
 *
 * 식단 기록 연속일(Streak) 시각화 컴포넌트
 * - 진행도 표시: [✅][✅][✅][✅][✅][✅][⬜] 6/7
 * - 배지 표시
 * - 카드형 요약 UI
 */

'use client';

import { Check, Circle, Utensils, Trophy, TrendingUp } from 'lucide-react';
import {
  NUTRITION_STREAK_BADGES,
  type StreakSummary,
} from '@/lib/nutrition/streak';

// =====================================================
// NutritionStreakProgress - 진행도 표시 컴포넌트
// =====================================================

interface NutritionStreakProgressProps {
  currentStreak: number;
  targetDays?: number;
  showLabels?: boolean;
}

/**
 * Streak 진행도 표시 컴포넌트
 * - 마일스톤 기준 진행도 시각화
 * - [✅][✅][⬜] 형태
 */
export function NutritionStreakProgress({
  currentStreak,
  targetDays = 7,
  showLabels = true,
}: NutritionStreakProgressProps) {
  // 표시할 일수 계산 (최소 3일, 최대 14일)
  const displayDays = Math.min(Math.max(targetDays, 3), 14);

  // 현재 streak이 목표보다 클 경우 처리
  const completedDays = Math.min(currentStreak, displayDays);
  const remainingDays = displayDays - completedDays;

  return (
    <div className="space-y-2" data-testid="nutrition-streak-progress">
      {/* 진행도 바 */}
      <div className="flex items-center gap-1">
        {/* 완료된 날 */}
        {Array.from({ length: completedDays }).map((_, i) => (
          <div
            key={`completed-${i}`}
            className="w-8 h-8 rounded-lg bg-module-nutrition flex items-center justify-center"
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
            <span className="text-module-nutrition font-medium">목표 달성!</span>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================
// NutritionStreakBadge - 배지 컴포넌트
// =====================================================

interface NutritionStreakBadgeProps {
  badgeId: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

/**
 * Streak 배지 컴포넌트
 * - 마일스톤 배지 표시
 */
export function NutritionStreakBadge({
  badgeId,
  size = 'md',
  showName = true,
}: NutritionStreakBadgeProps) {
  // 배지 ID에서 일수 추출 (예: '7day' -> 7)
  const milestone = parseInt(badgeId.replace('day', ''), 10);
  const badge = NUTRITION_STREAK_BADGES[milestone];

  if (!badge) return null;

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div
      className="flex flex-col items-center gap-1"
      data-testid="nutrition-streak-badge"
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full bg-gradient-nutrition
          flex items-center justify-center shadow-lg
        `}
        aria-label={badge.name}
      >
        <span>{badge.emoji}</span>
      </div>
      {showName && (
        <span className="text-xs font-medium text-muted-foreground">{badge.name}</span>
      )}
    </div>
  );
}

// =====================================================
// NutritionStreakBadgeList - 배지 목록 컴포넌트
// =====================================================

interface NutritionStreakBadgeListProps {
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Streak 배지 목록 컴포넌트
 */
export function NutritionStreakBadgeList({
  badges,
  size = 'sm',
}: NutritionStreakBadgeListProps) {
  if (badges.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      data-testid="nutrition-streak-badge-list"
    >
      {badges.map((badgeId) => (
        <NutritionStreakBadge
          key={badgeId}
          badgeId={badgeId}
          size={size}
          showName={false}
        />
      ))}
    </div>
  );
}

// =====================================================
// NutritionStreakCard - 카드 컴포넌트
// =====================================================

interface NutritionStreakCardProps {
  summary: StreakSummary;
  onStartRecord?: () => void;
  isLoading?: boolean;
  testId?: string;
}

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton({ testId }: { testId: string }) {
  return (
    <div
      className="bg-card rounded-2xl p-6 shadow-sm"
      data-testid={`${testId}-loading`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="w-16 h-4 bg-muted animate-pulse rounded" />
            <div className="w-20 h-3 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="w-12 h-8 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
      <div className="w-full h-4 bg-muted animate-pulse rounded mb-2" />
      <div className="w-3/4 h-4 bg-muted animate-pulse rounded" />
    </div>
  );
}

/**
 * Streak 카드 컴포넌트
 * - 현재 연속 기록 표시
 * - 진행도 시각화
 * - 마일스톤 메시지
 */
export function NutritionStreakCard({
  summary,
  onStartRecord,
  isLoading = false,
  testId = 'nutrition-streak-card',
}: NutritionStreakCardProps) {
  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton testId={testId} />;
  }

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
      data-testid={testId}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-module-nutrition-light flex items-center justify-center">
            <Utensils className="w-5 h-5 text-module-nutrition" />
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
          <p className="text-3xl font-bold text-module-nutrition">
            {currentStreak}
            <span className="text-lg text-muted-foreground">일</span>
          </p>
        </div>
      </div>

      {/* 진행도 - 다음 마일스톤까지 진행 상황 표시 */}
      {isActive && nextMilestone && nextMilestone <= 14 && (
        <div className="mb-4">
          <NutritionStreakProgress
            currentStreak={currentStreak}
            targetDays={nextMilestone}
          />
        </div>
      )}

      {/* 메시지 */}
      <div className="mb-4">
        <p className="text-foreground">{message}</p>
        {warningMessage && (
          <p className="text-amber-600 text-sm mt-1 font-medium">
            {warningMessage}
          </p>
        )}
      </div>

      {/* 다음 마일스톤 정보 */}
      {isActive && nextMilestone && daysToNextMilestone && (
        <div className="bg-module-nutrition-light rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-module-nutrition" />
            <span className="text-sm text-module-nutrition-dark">
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
          <NutritionStreakBadgeList badges={badges} size="sm" />
        </div>
      )}

      {/* 기록 시작 버튼 (비활성 상태일 때) */}
      {!isActive && onStartRecord && (
        <button
          onClick={onStartRecord}
          className="w-full py-3 bg-module-nutrition text-white font-medium rounded-xl hover:bg-module-nutrition-dark transition-colors"
        >
          새로운 기록 시작하기
        </button>
      )}
    </div>
  );
}

// =====================================================
// 기본 Export
// =====================================================

export default NutritionStreakCard;
