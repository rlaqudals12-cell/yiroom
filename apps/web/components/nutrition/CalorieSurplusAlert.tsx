/**
 * N-1 칼로리 초과 알림 배너 컴포넌트 (P3-5.1)
 *
 * 칼로리 초과 시 상단에 표시되는 눈에 띄는 알림 배너
 * - 초과량에 따른 시각적 강조 (경고/위험 수준)
 * - W-1 운동 페이지로 빠른 이동 버튼
 * - 세션 동안 닫기 가능
 */

'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Flame, X, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getWorkoutNutritionInsight,
  type WorkoutSummary,
} from '@/lib/nutrition/workoutInsight';

export interface CalorieSurplusAlertProps {
  /** 오늘의 운동 요약 */
  workoutSummary: WorkoutSummary | null;
  /** 오늘 섭취 칼로리 */
  intakeCalories: number;
  /** 목표 칼로리 */
  targetCalories?: number;
  /** W-1 운동 페이지로 이동 핸들러 */
  onNavigateToWorkout?: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * 초과량에 따른 알림 레벨
 */
type AlertLevel = 'warning' | 'danger';

/**
 * 알림 레벨별 스타일 설정
 */
const ALERT_STYLES: Record<AlertLevel, { bg: string; border: string; text: string; button: string }> = {
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    button: 'bg-red-500 hover:bg-red-600',
  },
};

/**
 * 초과량에 따른 알림 레벨 결정
 * - 200~400kcal: warning (경고)
 * - 400kcal 이상: danger (위험)
 */
function getAlertLevel(surplusCalories: number): AlertLevel {
  if (surplusCalories >= 400) {
    return 'danger';
  }
  return 'warning';
}

/**
 * CalorieSurplusAlert 컴포넌트
 */
export default function CalorieSurplusAlert({
  workoutSummary,
  intakeCalories,
  targetCalories = 2000,
  onNavigateToWorkout,
  isLoading = false,
}: CalorieSurplusAlertProps) {
  // 닫기 상태 (세션 동안 유지)
  const [isDismissed, setIsDismissed] = useState(false);

  // 인사이트 계산
  const insight = useMemo(
    () => getWorkoutNutritionInsight(workoutSummary, intakeCalories, targetCalories),
    [workoutSummary, intakeCalories, targetCalories]
  );

  // 초과량 계산
  const surplusCalories = useMemo(() => {
    return insight.calorieBalance.netCalories - targetCalories;
  }, [insight.calorieBalance.netCalories, targetCalories]);

  // 로딩 중이거나 닫힌 상태면 표시하지 않음
  if (isLoading || isDismissed) {
    return null;
  }

  // 칼로리 초과가 아니거나 추천이 없으면 표시하지 않음
  if (!insight.recommendation.shouldRecommend || insight.recommendation.reason !== 'calorie_surplus') {
    return null;
  }

  const alertLevel = getAlertLevel(surplusCalories);
  const styles = ALERT_STYLES[alertLevel];

  return (
    <div
      className={cn(
        'rounded-xl p-4 border shadow-sm animate-in slide-in-from-top-2 duration-300',
        styles.bg,
        styles.border
      )}
      role="alert"
      aria-live="polite"
      data-testid="calorie-surplus-alert"
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {alertLevel === 'danger' ? (
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <Flame className="w-5 h-5 text-amber-500 flex-shrink-0" />
          )}
          <div>
            <h3 className={cn('font-semibold text-sm', styles.text)}>
              {alertLevel === 'danger' ? '칼로리 초과 주의!' : '칼로리 초과'}
            </h3>
            <p className="text-xs text-muted-foreground">
              목표 대비 <span className="font-medium">{surplusCalories}kcal</span> 초과
            </p>
          </div>
        </div>
        {/* 닫기 버튼 */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="알림 닫기"
          data-testid="calorie-surplus-alert-dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* 운동 추천 정보 */}
      <div className="bg-card/60 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {insight.recommendation.recommendedDuration}분 운동으로 균형 맞추기
            </p>
            <p className="text-xs text-muted-foreground">
              약 {insight.recommendation.estimatedCalories}kcal 소모 예상
            </p>
          </div>
        </div>
      </div>

      {/* 운동 시작 버튼 */}
      <button
        onClick={onNavigateToWorkout}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 text-white font-medium rounded-lg transition-colors',
          styles.button
        )}
        data-testid="calorie-surplus-alert-cta"
      >
        <span>운동하러 가기</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * CalorieSurplusAlert 스켈레톤 (로딩용)
 */
export function CalorieSurplusAlertSkeleton() {
  return (
    <div
      className="rounded-xl p-4 border border-border bg-muted/50 animate-pulse"
      data-testid="calorie-surplus-alert-skeleton"
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="w-24 h-4 bg-muted rounded mb-1" />
          <div className="w-32 h-3 bg-muted/70 rounded" />
        </div>
      </div>
      <div className="bg-card/60 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="w-40 h-4 bg-muted rounded mb-1" />
            <div className="w-28 h-3 bg-muted/70 rounded" />
          </div>
        </div>
      </div>
      <div className="w-full h-12 bg-muted rounded-lg" />
    </div>
  );
}
