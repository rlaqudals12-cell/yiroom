/**
 * N-1 W-1 운동 연동 인사이트 카드 컴포넌트 (Task 3.8)
 *
 * 칼로리 밸런스 표시:
 * - 섭취 칼로리 - 운동 소모 = 순 칼로리
 * - 목표 대비 상태 (부족/적정/초과)
 * - 운동 추천 (칼로리 초과 시)
 */

'use client';

import { useMemo } from 'react';
import { Dumbbell, Flame, ChevronRight, Activity, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getWorkoutNutritionInsight,
  type WorkoutSummary,
  type CalorieBalanceStatus,
} from '@/lib/nutrition/workoutInsight';

export interface WorkoutInsightCardProps {
  /** 오늘의 운동 요약 */
  workoutSummary: WorkoutSummary | null;
  /** 오늘 섭취 칼로리 */
  intakeCalories: number;
  /** 목표 칼로리 */
  targetCalories?: number;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** W-1 운동 페이지로 이동 핸들러 */
  onNavigateToWorkout?: () => void;
}

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton() {
  return (
    <div
      className="bg-module-workout-light rounded-2xl p-4 shadow-sm border border-module-workout/20"
      data-testid="workout-insight-card-loading"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-module-workout/30 animate-pulse" />
        <div className="w-32 h-5 bg-module-workout/30 animate-pulse rounded" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-20 bg-module-workout/20 animate-pulse rounded-xl" />
        <div className="w-full h-12 bg-module-workout/20 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

/**
 * 칼로리 밸런스 상태 색상
 */
const STATUS_COLORS: Record<CalorieBalanceStatus, { bg: string; text: string; icon: string }> = {
  deficit: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  balanced: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  surplus: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
};

/**
 * 칼로리 밸런스 섹션
 */
function CalorieBalanceSection({
  intake,
  burned,
  net,
  target,
  status,
  message,
}: {
  intake: number;
  burned: number;
  net: number;
  target: number;
  status: CalorieBalanceStatus;
  message: string;
}) {
  const colors = STATUS_COLORS[status];
  const percentage = target > 0 ? Math.min(150, Math.round((net / target) * 100)) : 0;

  return (
    <div
      className={cn('rounded-xl p-3 border', colors.bg)}
      data-testid="calorie-balance-section"
    >
      {/* 칼로리 요약 */}
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <p className="text-xs text-muted-foreground">섭취</p>
          <p className="text-sm font-semibold text-foreground">
            {intake.toLocaleString()}
            <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">소모</p>
          <p className="text-sm font-semibold text-module-workout">
            -{burned.toLocaleString()}
            <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">순 칼로리</p>
          <p className={cn('text-sm font-semibold', colors.text)}>
            {net.toLocaleString()}
            <span className="text-xs font-normal">kcal</span>
          </p>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>0</span>
          <span>목표 {target.toLocaleString()}kcal</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              status === 'deficit' && 'bg-blue-500',
              status === 'balanced' && 'bg-green-500',
              status === 'surplus' && 'bg-red-500'
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`순 칼로리 ${percentage}%`}
          />
        </div>
      </div>

      {/* 메시지 */}
      <p className={cn('text-sm', colors.text)}>{message}</p>
    </div>
  );
}

/**
 * 운동 요약 섹션
 */
function WorkoutSummarySection({
  workoutCount,
  totalDuration,
  totalCaloriesBurned,
}: {
  workoutCount: number;
  totalDuration: number;
  totalCaloriesBurned: number;
}) {
  if (workoutCount === 0) {
    return (
      <div
        className="flex items-center justify-between bg-muted/50 rounded-xl p-3 border border-border/50"
        data-testid="workout-summary-empty"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">오늘 운동 기록 없음</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between bg-module-workout-light rounded-xl p-3 border border-module-workout/20"
      data-testid="workout-summary-section"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-module-workout/20 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-module-workout" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            오늘 {workoutCount}회 운동 완료!
          </p>
          <p className="text-xs text-muted-foreground">
            {totalDuration}분 · {totalCaloriesBurned.toLocaleString()}kcal 소모
          </p>
        </div>
      </div>
      <Flame className="w-5 h-5 text-module-workout" />
    </div>
  );
}

/**
 * 운동 추천 버튼
 */
function WorkoutRecommendButton({
  message,
  recommendedDuration,
  estimatedCalories,
  onClick,
}: {
  message: string;
  recommendedDuration: number;
  estimatedCalories: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-gradient-workout text-white rounded-xl p-3 hover:opacity-90 transition-all"
      data-testid="workout-recommend-button"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">{message}</p>
          <p className="text-xs text-white/80">
            약 {recommendedDuration}분 · {estimatedCalories}kcal 소모 예상
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5" />
    </button>
  );
}

/**
 * WorkoutInsightCard 컴포넌트
 */
export default function WorkoutInsightCard({
  workoutSummary,
  intakeCalories,
  targetCalories = 2000,
  isLoading = false,
  onNavigateToWorkout,
}: WorkoutInsightCardProps) {
  // 인사이트 계산
  const insight = useMemo(
    () => getWorkoutNutritionInsight(workoutSummary, intakeCalories, targetCalories),
    [workoutSummary, intakeCalories, targetCalories]
  );

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className="bg-module-workout-light rounded-2xl p-4 shadow-sm border border-module-workout/20"
      data-testid="workout-insight-card"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-5 h-5 text-module-workout" />
        <h3 className="text-sm font-semibold text-foreground">칼로리 밸런스</h3>
        <span className="text-xs text-muted-foreground ml-auto">W-1 연동</span>
      </div>

      {/* 운동 요약 */}
      <div className="mb-3">
        <WorkoutSummarySection
          workoutCount={insight.workoutSummary.workoutCount}
          totalDuration={insight.workoutSummary.totalDuration}
          totalCaloriesBurned={insight.workoutSummary.totalCaloriesBurned}
        />
      </div>

      {/* 칼로리 밸런스 */}
      <div className="mb-3">
        <CalorieBalanceSection
          intake={insight.calorieBalance.intakeCalories}
          burned={insight.calorieBalance.burnedCalories}
          net={insight.calorieBalance.netCalories}
          target={insight.calorieBalance.targetCalories}
          status={insight.calorieBalance.status}
          message={insight.calorieBalance.message}
        />
      </div>

      {/* 운동 추천 (필요 시) */}
      {insight.recommendation.shouldRecommend && (
        <WorkoutRecommendButton
          message={insight.recommendation.message}
          recommendedDuration={insight.recommendation.recommendedDuration}
          estimatedCalories={insight.recommendation.estimatedCalories}
          onClick={onNavigateToWorkout}
        />
      )}
    </div>
  );
}

// 하위 컴포넌트 내보내기 (테스트용)
export { CalorieBalanceSection, WorkoutSummarySection, WorkoutRecommendButton };
