/**
 * K-4 영양 대시보드 카드 컴포넌트
 * @description 레시피/식사별 영양 정보 시각화 카드
 */

'use client';

import { useMemo } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  Utensils,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import NutrientBarChart, { type NutrientData } from './NutrientBarChart';
import {
  type NutritionGoal,
  NUTRITION_GOAL_LABELS,
  NUTRITION_TARGETS,
} from '@/lib/nutrition/recipe-matcher';

export interface NutritionDashboardCardProps {
  /** 현재 영양 섭취 */
  current: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** 목표 영양 (미지정 시 기본값 사용) */
  target?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** 영양 목표 타입 */
  goal?: NutritionGoal;
  /** 사용자 체중 (kg) - 목표 자동 계산에 사용 */
  weightKg?: number;
  /** 식사 수 */
  mealCount?: number;
  /** 제목 */
  title?: string;
  /** 설명 */
  description?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

// 기본 영양 목표
const DEFAULT_TARGETS = {
  calories: 2000,
  protein: 80,
  carbs: 250,
  fat: 65,
};

/**
 * NutritionDashboardCard 메인 컴포넌트
 */
export default function NutritionDashboardCard({
  current,
  target,
  goal,
  weightKg,
  mealCount,
  title = '오늘의 영양',
  description,
  isLoading = false,
  className,
}: NutritionDashboardCardProps) {
  // 목표 계산 (goal과 weightKg 기반, 또는 직접 지정, 또는 기본값)
  const calculatedTargets = useMemo(() => {
    if (target) return target;

    if (goal && weightKg) {
      const goalConfig = NUTRITION_TARGETS[goal];
      const tdee = weightKg * 24 * 1.55; // 기본 활동량 moderate로 가정
      const calories = Math.round(tdee * goalConfig.calorieMultiplier);
      const protein = Math.round(weightKg * goalConfig.proteinPerKg);
      const carbs = Math.round((calories * goalConfig.carbRatio) / 4);
      const fat = Math.round((calories * goalConfig.fatRatio) / 9);

      return { calories, protein, carbs, fat };
    }

    return DEFAULT_TARGETS;
  }, [target, goal, weightKg]);

  // 영양소별 진행률 데이터
  const nutrientData: NutrientData[] = useMemo(
    () => [
      {
        name: '단백질',
        current: current.protein,
        target: calculatedTargets.protein,
        unit: 'g',
        color: 'blue',
      },
      {
        name: '탄수화물',
        current: current.carbs,
        target: calculatedTargets.carbs,
        unit: 'g',
        color: 'amber',
      },
      {
        name: '지방',
        current: current.fat,
        target: calculatedTargets.fat,
        unit: 'g',
        color: 'rose',
      },
    ],
    [current, calculatedTargets]
  );

  // 칼로리 진행률
  const calorieProgress = useMemo(() => {
    const percentage = Math.round(
      (current.calories / calculatedTargets.calories) * 100
    );
    return Math.min(100, Math.max(0, percentage));
  }, [current.calories, calculatedTargets.calories]);

  // 칼로리 상태 (부족/적정/초과)
  const calorieStatus = useMemo(() => {
    const ratio = current.calories / calculatedTargets.calories;
    if (ratio < 0.8) return { label: '부족', color: 'text-blue-500', icon: TrendingDown };
    if (ratio > 1.1) return { label: '초과', color: 'text-red-500', icon: TrendingUp };
    return { label: '적정', color: 'text-green-500', icon: Target };
  }, [current.calories, calculatedTargets.calories]);

  // 단백질 상태
  const proteinStatus = useMemo(() => {
    const ratio = current.protein / calculatedTargets.protein;
    if (ratio < 0.6) return { warning: true, message: '단백질이 부족해요!' };
    return { warning: false, message: null };
  }, [current.protein, calculatedTargets.protein]);

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <Card data-testid="nutrition-dashboard-card-loading" className={className}>
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-24 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-2 bg-muted animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = calorieStatus.icon;

  return (
    <Card data-testid="nutrition-dashboard-card" className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {goal && (
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              {NUTRITION_GOAL_LABELS[goal]}
            </Badge>
          )}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 칼로리 메인 표시 */}
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium">칼로리</span>
            </div>
            <div className={cn('flex items-center gap-1 text-sm', calorieStatus.color)}>
              <StatusIcon className="h-4 w-4" />
              <span>{calorieStatus.label}</span>
            </div>
          </div>

          <div className="text-center mb-3">
            <span className="text-3xl font-bold text-foreground">
              {current.calories.toLocaleString()}
            </span>
            <span className="text-lg text-muted-foreground">
              {' '}/ {calculatedTargets.calories.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground ml-1">kcal</span>
          </div>

          <Progress
            value={calorieProgress}
            className={cn(
              'h-3',
              current.calories > calculatedTargets.calories && '[&>[data-slot=indicator]]:bg-red-500'
            )}
          />

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>남은 칼로리: {Math.max(0, calculatedTargets.calories - current.calories).toLocaleString()}kcal</span>
            <span>{calorieProgress}%</span>
          </div>
        </div>

        {/* 매크로 영양소 차트 */}
        <NutrientBarChart
          data={nutrientData}
          title="영양소 현황"
          showWarningThreshold
        />

        {/* 단백질 부족 경고 */}
        {proteinStatus.warning && (
          <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{proteinStatus.message}</p>
              <p className="text-xs text-blue-500 mt-1">
                닭가슴살 100g(약 31g) 또는 계란 2개(약 12g)를 추가해보세요.
              </p>
            </div>
          </div>
        )}

        {/* 식사 수 표시 */}
        {mealCount !== undefined && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Utensils className="h-4 w-4" />
            <span>오늘 {mealCount}끼 기록</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 레시피 영양 정보 미니 카드 (레시피 목록에서 사용)
 */
export interface RecipeNutritionMiniProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  className?: string;
}

export function RecipeNutritionMini({
  calories,
  protein,
  carbs,
  fat,
  className,
}: RecipeNutritionMiniProps) {
  return (
    <div
      data-testid="recipe-nutrition-mini"
      className={cn('grid grid-cols-4 gap-1 text-xs', className)}
    >
      <div className="text-center p-1.5 rounded bg-muted">
        <span className="font-medium">{calories}</span>
        <span className="text-muted-foreground block">kcal</span>
      </div>
      <div className="text-center p-1.5 rounded bg-blue-50 dark:bg-blue-950/50">
        <span className="font-medium text-blue-600">{protein}g</span>
        <span className="text-muted-foreground block">단백질</span>
      </div>
      <div className="text-center p-1.5 rounded bg-yellow-50 dark:bg-yellow-950/50">
        <span className="font-medium text-yellow-600">{carbs}g</span>
        <span className="text-muted-foreground block">탄수화물</span>
      </div>
      <div className="text-center p-1.5 rounded bg-red-50 dark:bg-red-950/50">
        <span className="font-medium text-red-600">{fat}g</span>
        <span className="text-muted-foreground block">지방</span>
      </div>
    </div>
  );
}
