/**
 * N-1 오늘의 칼로리 요약 컴포넌트 (Task 2.7)
 *
 * 원형 진행률 차트로 오늘의 칼로리 섭취량을 표시
 * - 목표 대비 섭취 칼로리 비율
 * - 남은 칼로리
 * - 탄단지 섭취량
 */

'use client';

import { useMemo } from 'react';
import CalorieProgressRing from './CalorieProgressRing';

// 영양소 요약 타입
interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// 목표 칼로리 타입
interface CalorieGoal {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface DailyCalorieSummaryProps {
  /** 오늘의 영양소 섭취량 */
  summary: NutritionSummary;
  /** 목표 칼로리 (기본값: 2000 kcal) */
  goal?: CalorieGoal;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 날짜 표시 (예: "오늘의 식단") */
  title?: string;
}

// 기본 목표값
const DEFAULT_GOAL: CalorieGoal = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65,
};

// CircularProgress는 CalorieProgressRing으로 대체됨 (Task 3.3)

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton() {
  return (
    <div
      className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      data-testid="daily-calorie-summary-loading"
    >
      <div className="flex flex-col items-center">
        {/* 원형 차트 스켈레톤 */}
        <div className="w-40 h-40 rounded-full bg-muted animate-pulse mb-4" />

        {/* 영양소 바 스켈레톤 */}
        <div className="w-full flex justify-center gap-8 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-8 h-4 bg-muted animate-pulse rounded" />
              <div className="w-12 h-3 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DailyCalorieSummary({
  summary,
  goal = DEFAULT_GOAL,
  isLoading = false,
  title = '오늘의 식단',
}: DailyCalorieSummaryProps) {
  // 칼로리 비율 계산
  const caloriePercentage = useMemo(() => {
    if (!goal.calories || goal.calories === 0) return 0;
    return Math.round((summary.totalCalories / goal.calories) * 100);
  }, [summary.totalCalories, goal.calories]);

  // 남은 칼로리 계산
  const remainingCalories = useMemo(() => {
    return Math.max(0, goal.calories - summary.totalCalories);
  }, [summary.totalCalories, goal.calories]);

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className="bg-card rounded-2xl p-6 shadow-sm border border-border"
      data-testid="daily-calorie-summary"
    >
      {/* 제목 */}
      <h2 className="text-lg font-bold text-foreground text-center mb-4">
        {title}
      </h2>

      {/* 원형 진행률 차트 (Task 3.3: CalorieProgressRing 사용) */}
      <div className="flex justify-center mb-4">
        <CalorieProgressRing
          current={summary.totalCalories}
          target={goal.calories}
          testId="calorie-ring"
        >
          {/* 중앙 텍스트 */}
          <span
            className="text-3xl font-bold text-foreground"
            data-testid="consumed-calories"
          >
            {summary.totalCalories.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            / {goal.calories.toLocaleString()} kcal
          </span>
          <span
            className={`text-sm font-medium mt-1 ${
              caloriePercentage >= 100 ? 'text-red-500' : 'text-muted-foreground'
            }`}
            data-testid="calorie-percentage"
          >
            ({caloriePercentage}%)
          </span>
        </CalorieProgressRing>
      </div>

      {/* 남은 칼로리 */}
      <p
        className="text-center text-sm text-muted-foreground mb-4"
        data-testid="remaining-calories"
      >
        {caloriePercentage >= 100 ? (
          <span className="text-red-500">
            {(summary.totalCalories - goal.calories).toLocaleString()} kcal 초과
          </span>
        ) : (
          <>남은 칼로리: <span className="font-semibold text-green-600">{remainingCalories.toLocaleString()} kcal</span></>
        )}
      </p>

      {/* 탄단지 섭취량 */}
      <div
        className="flex justify-center gap-6"
        data-testid="macros-summary"
      >
        <MacroItem
          label="탄수화물"
          value={summary.totalCarbs}
          unit="g"
          color="bg-amber-100 text-amber-700"
        />
        <MacroItem
          label="단백질"
          value={summary.totalProtein}
          unit="g"
          color="bg-blue-100 text-blue-700"
        />
        <MacroItem
          label="지방"
          value={summary.totalFat}
          unit="g"
          color="bg-rose-100 text-rose-700"
        />
      </div>
    </div>
  );
}

/**
 * 영양소 아이템 (탄/단/지)
 */
function MacroItem({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label.charAt(0)}
      </span>
      <span className="text-sm font-semibold text-foreground">
        {Math.round(value * 10) / 10}{unit}
      </span>
    </div>
  );
}
