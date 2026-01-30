/**
 * R-1 월간 리포트 집계 로직
 * Task R-2.1: 월간 집계 로직
 *
 * - 한 달간 영양/운동 데이터 집계
 * - 주간 비교
 * - 체중 변화 추적 (C-1 연동)
 * - 목표 진행률
 */

import type {
  MonthlyReport,
  WeeklySummary,
  BodyProgress,
  GoalProgress,
  DailyNutrition,
  DailyWorkout,
  NutritionSummaryStats,
  NutritionAchievement,
  NutritionTrend,
  WorkoutSummaryStats,
  ReportInsights,
  ReportStreakStatus,
  RawMealRecord,
  RawWaterRecord,
  RawWorkoutLog,
  RawNutritionSettings,
} from '@/types/report';
import {
  aggregateMealsByDay,
  aggregateWorkoutsByDay,
  calculateNutritionSummary,
  calculateNutritionAchievement,
  calculateNutritionTrend,
  calculateWorkoutSummary,
  calculateWorkoutTrend,
  calculateFoodQualityScore,
  getCalorieBalanceStatus,
  getDateRange,
  DEFAULT_NUTRITION_TARGETS,
  calculateBeautyNutritionCorrelation,
  type RawHairAnalysis,
  type RawMakeupAnalysis,
} from './weeklyAggregator';
import type { NutritionGoal } from '@/types/nutrition';

// =====================================================
// 유틸리티 함수
// =====================================================

/**
 * 월의 시작일 계산 (1일)
 * UTC 기반으로 계산하여 타임존 문제 방지
 */
export function getMonthStart(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const d = new Date(Date.UTC(year, month, 1));
  return d.toISOString().split('T')[0];
}

/**
 * 월의 종료일 계산
 * UTC 기반으로 계산하여 타임존 문제 방지
 */
export function getMonthEnd(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const d = new Date(Date.UTC(year, month + 1, 0));
  return d.toISOString().split('T')[0];
}

/**
 * YYYY-MM 형식에서 시작일/종료일 계산
 * UTC 기반으로 계산하여 타임존 문제 방지
 */
export function getMonthRangeFromYYYYMM(yearMonth: string): {
  monthStart: string;
  monthEnd: string;
} {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  return {
    monthStart: startDate.toISOString().split('T')[0],
    monthEnd: endDate.toISOString().split('T')[0],
  };
}

/**
 * 월 내 주간 범위 계산
 * 월의 첫째 날부터 7일씩 나눔 (마지막 주는 짧을 수 있음)
 */
export function getWeeksInMonth(
  monthStart: string,
  monthEnd: string
): Array<{
  weekNum: number;
  weekStart: string;
  weekEnd: string;
}> {
  const weeks: Array<{ weekNum: number; weekStart: string; weekEnd: string }> = [];
  const start = new Date(monthStart);
  const end = new Date(monthEnd);

  let weekNum = 1;
  let currentStart = new Date(start);

  while (currentStart <= end) {
    const weekEnd = new Date(currentStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // 월 종료일을 넘지 않도록 조정
    const actualEnd = weekEnd > end ? end : weekEnd;

    weeks.push({
      weekNum,
      weekStart: currentStart.toISOString().split('T')[0],
      weekEnd: actualEnd.toISOString().split('T')[0],
    });

    // 다음 주 시작
    currentStart = new Date(actualEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    weekNum++;
  }

  return weeks;
}

/**
 * 주간 요약 계산
 */
export function calculateWeeklySummary(
  dailyNutrition: DailyNutrition[],
  dailyWorkout: DailyWorkout[],
  weekStart: string,
  weekEnd: string
): WeeklySummary {
  // 해당 주 데이터만 필터링
  const weekNutrition = dailyNutrition.filter((d) => d.date >= weekStart && d.date <= weekEnd);
  const weekWorkout = dailyWorkout.filter((d) => d.date >= weekStart && d.date <= weekEnd);

  const daysWithRecords = weekNutrition.filter((d) => d.mealsLogged > 0).length;
  const totalCalories = weekNutrition.reduce((sum, d) => sum + d.calories, 0);
  const totalWater = weekNutrition.reduce((sum, d) => sum + d.water, 0);
  const totalProtein = weekNutrition.reduce((sum, d) => sum + d.protein, 0);
  const mealCount = weekNutrition.reduce((sum, d) => sum + d.mealsLogged, 0);
  const workoutCount = weekWorkout.reduce((sum, d) => sum + d.sessions, 0);

  return {
    weekStart,
    weekEnd,
    avgCalories: daysWithRecords > 0 ? Math.round(totalCalories / daysWithRecords) : 0,
    avgWater: daysWithRecords > 0 ? Math.round(totalWater / daysWithRecords) : 0,
    avgProtein: daysWithRecords > 0 ? Math.round((totalProtein / daysWithRecords) * 10) / 10 : 0,
    workoutCount,
    mealCount,
    foodQualityScore: calculateFoodQualityScore(weekNutrition),
  };
}

/**
 * 체중 변화 계산 (C-1 연동)
 */
export function calculateBodyProgress(
  bodyAnalysisStart: { weight: number } | null,
  bodyAnalysisEnd: { weight: number } | null,
  goal: NutritionGoal | null
): BodyProgress {
  const startWeight = bodyAnalysisStart?.weight || null;
  const endWeight = bodyAnalysisEnd?.weight || null;

  if (!startWeight || !endWeight) {
    return {
      startWeight,
      endWeight,
      weightChange: 0,
      reanalysisRecommended: false,
      message: startWeight ? '월말 체형 분석을 해보세요!' : '체형 분석을 시작해보세요!',
    };
  }

  const weightChange = Math.round((endWeight - startWeight) * 10) / 10;
  const absChange = Math.abs(weightChange);

  // 2kg 이상 변화 시 재분석 권장
  const reanalysisRecommended = absChange >= 2;

  let message: string;
  if (absChange < 0.5) {
    message = '체중이 안정적으로 유지되고 있어요.';
  } else if (weightChange > 0) {
    if (goal === 'muscle') {
      message = `${weightChange}kg 증가! 근육량이 늘었을 수 있어요.`;
    } else if (goal === 'weight_loss') {
      message = `${weightChange}kg 증가했어요. 식단을 점검해보세요.`;
    } else {
      message = `${weightChange}kg 증가했어요.`;
    }
  } else {
    if (goal === 'weight_loss') {
      message = `${Math.abs(weightChange)}kg 감량 성공!`;
    } else if (goal === 'muscle') {
      message = `${Math.abs(weightChange)}kg 감소. 단백질 섭취를 확인해보세요.`;
    } else {
      message = `${Math.abs(weightChange)}kg 감소했어요.`;
    }
  }

  return {
    startWeight,
    endWeight,
    weightChange,
    reanalysisRecommended,
    message,
  };
}

/**
 * 목표 진행률 계산
 */
export function calculateGoalProgress(
  goal: NutritionGoal,
  achievement: NutritionAchievement,
  bodyProgress: BodyProgress
): GoalProgress {
  let achievementRate: number;
  let message: string;
  let isOnTrack: boolean;

  switch (goal) {
    case 'weight_loss':
      // 칼로리 목표 준수 + 체중 감소
      const calorieCompliance = Math.min(achievement.caloriesPercent, 100);
      const weightLossBonus = bodyProgress.weightChange < 0 ? 20 : 0;
      achievementRate = Math.min(calorieCompliance * 0.8 + weightLossBonus, 100);
      isOnTrack = achievement.caloriesPercent <= 105 && bodyProgress.weightChange <= 0;
      message = isOnTrack ? '감량 목표를 잘 지키고 있어요!' : '칼로리 섭취를 조금 줄여보세요.';
      break;

    case 'muscle':
      // 단백질 목표 준수 + 칼로리 충분
      const proteinScore = Math.min(achievement.proteinPercent, 100);
      const calorieScore = achievement.caloriesPercent >= 100 ? 20 : 0;
      achievementRate = Math.min(proteinScore * 0.8 + calorieScore, 100);
      isOnTrack = achievement.proteinPercent >= 100;
      message = isOnTrack ? '근육 증가 목표를 향해 잘 가고 있어요!' : '단백질 섭취를 늘려보세요.';
      break;

    case 'skin':
      // 수분 섭취 + 영양 균형
      const waterScore = Math.min(achievement.waterPercent, 100);
      const balanceScore = Math.min(
        (achievement.caloriesPercent + achievement.proteinPercent) / 2,
        100
      );
      achievementRate = Math.round(waterScore * 0.6 + balanceScore * 0.4);
      isOnTrack = achievement.waterPercent >= 80;
      message = isOnTrack ? '피부 건강을 위한 수분 섭취 좋아요!' : '수분 섭취를 더 늘려보세요.';
      break;

    case 'health':
    case 'maintain':
    default:
      // 전체 균형
      const allScores = [
        achievement.caloriesPercent,
        achievement.proteinPercent,
        achievement.carbsPercent,
        achievement.fatPercent,
        achievement.waterPercent,
      ];
      const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      achievementRate = Math.min(Math.round(avgScore), 100);
      isOnTrack = avgScore >= 80 && avgScore <= 120;
      message = isOnTrack ? '균형 잡힌 식단을 유지하고 있어요!' : '영양 균형을 맞춰보세요.';
      break;
  }

  return {
    goal,
    achievementRate,
    message,
    isOnTrack,
  };
}

/**
 * 월간 인사이트 생성
 */
export function generateMonthlyInsights(
  nutritionSummary: NutritionSummaryStats,
  nutritionAchievement: NutritionAchievement,
  nutritionTrend: NutritionTrend,
  workoutSummary: WorkoutSummaryStats,
  weeklyComparison: WeeklySummary[],
  bodyProgress: BodyProgress,
  goalProgress: GoalProgress
): ReportInsights {
  const highlights: string[] = [];
  const improvements: string[] = [];
  const tips: string[] = [];
  const achievements: string[] = [];

  // 목표 달성
  if (goalProgress.achievementRate >= 80) {
    achievements.push(
      `${getGoalLabel(goalProgress.goal)} 목표 달성률 ${goalProgress.achievementRate}%!`
    );
  }

  // 긍정적 하이라이트
  if (nutritionSummary.daysWithRecords >= 20) {
    highlights.push(`한 달간 ${nutritionSummary.daysWithRecords}일 식단을 기록했어요!`);
  }

  if (nutritionTrend.consistencyScore >= 70) {
    highlights.push('꾸준한 식단 기록 습관이 만들어지고 있어요!');
  }

  if (workoutSummary.daysWithWorkout >= 12) {
    highlights.push(`${workoutSummary.daysWithWorkout}일 운동으로 건강해지고 있어요!`);
  }

  // 주간 비교 트렌드
  if (weeklyComparison.length >= 2) {
    const lastWeek = weeklyComparison[weeklyComparison.length - 1];
    const firstWeek = weeklyComparison[0];

    if (lastWeek.avgCalories < firstWeek.avgCalories * 0.9) {
      highlights.push('월말로 갈수록 칼로리 섭취가 줄었어요!');
    }

    if (lastWeek.foodQualityScore > firstWeek.foodQualityScore + 10) {
      highlights.push('음식 품질이 개선되고 있어요!');
    }
  }

  // 체중 변화 (목표에 부합하는 변화인 경우)
  const isWeightChangePositive =
    (goalProgress.goal === 'weight_loss' && bodyProgress.weightChange < 0) ||
    (goalProgress.goal === 'muscle' && bodyProgress.weightChange > 0);

  if (bodyProgress.weightChange !== 0 && isWeightChangePositive) {
    achievements.push(bodyProgress.message);
  }

  // 개선 필요 사항
  if (nutritionAchievement.proteinPercent < 80) {
    improvements.push('단백질 섭취가 목표에 미달했어요. 육류, 생선, 두부를 더 먹어보세요.');
  }

  if (nutritionAchievement.waterPercent < 70) {
    improvements.push('수분 섭취가 부족했어요. 하루 8잔을 목표로 해보세요.');
  }

  if (nutritionTrend.foodQualityScore < 50) {
    improvements.push('고칼로리 음식 비율이 높았어요. 채소와 과일을 늘려보세요.');
  }

  // 다음 달 팁
  if (!goalProgress.isOnTrack) {
    tips.push(goalProgress.message);
  }

  if (workoutSummary.daysWithWorkout < 8) {
    tips.push('다음 달은 주 3회 이상 운동을 목표로 해보세요!');
  }

  if (bodyProgress.reanalysisRecommended) {
    tips.push('체중 변화가 있으니 체형 분석을 다시 해보세요!');
  }

  return {
    highlights: highlights.slice(0, 3),
    improvements: improvements.slice(0, 3),
    tips: tips.slice(0, 3),
    achievements: achievements.slice(0, 2),
  };
}

/**
 * 하이라이트 계산 (가장 좋은/나쁜 주)
 */
export function calculateMonthlyHighlights(weeklyComparison: WeeklySummary[]): {
  bestWeek: number | null;
  worstWeek: number | null;
  bestWeekScore: number;
  worstWeekScore: number;
} {
  if (weeklyComparison.length === 0) {
    return { bestWeek: null, worstWeek: null, bestWeekScore: 0, worstWeekScore: 0 };
  }

  const scored = weeklyComparison.map((week, index) => ({
    weekNum: index + 1,
    score: calculateWeekScore(week),
  }));

  scored.sort((a, b) => b.score - a.score);

  return {
    bestWeek: scored[0].weekNum,
    worstWeek: scored.length > 1 ? scored[scored.length - 1].weekNum : null,
    bestWeekScore: scored[0].score,
    worstWeekScore: scored.length > 1 ? scored[scored.length - 1].score : scored[0].score,
  };
}

function calculateWeekScore(week: WeeklySummary): number {
  // 음식 품질 점수 + 운동 보너스
  const qualityScore = week.foodQualityScore;
  const workoutBonus = Math.min(week.workoutCount * 5, 20);
  const mealBonus = (Math.min(week.mealCount, 21) / 21) * 10;

  return Math.round(qualityScore + workoutBonus + mealBonus);
}

function getGoalLabel(goal: NutritionGoal): string {
  const labels: Record<NutritionGoal, string> = {
    weight_loss: '체중 감량',
    maintain: '체중 유지',
    muscle: '근육 증가',
    skin: '피부 개선',
    health: '건강 관리',
  };
  return labels[goal] || '건강';
}

// =====================================================
// 메인 함수
// =====================================================

export interface MonthlyAggregatorInput {
  month: string; // YYYY-MM
  meals: RawMealRecord[];
  waterRecords: RawWaterRecord[];
  workoutLogs: RawWorkoutLog[];
  settings: RawNutritionSettings | null;
  nutritionStreak: ReportStreakStatus;
  workoutStreak: ReportStreakStatus;
  bodyAnalysisStart?: { weight: number } | null;
  bodyAnalysisEnd?: { weight: number } | null;
  // H-1/M-1 뷰티-영양 상관관계
  hairAnalysis?: RawHairAnalysis | null;
  makeupAnalysis?: RawMakeupAnalysis | null;
}

/**
 * 월간 리포트 생성
 */
export function generateMonthlyReport(input: MonthlyAggregatorInput): MonthlyReport {
  const {
    month,
    meals,
    waterRecords,
    workoutLogs,
    settings,
    nutritionStreak,
    workoutStreak,
    bodyAnalysisStart = null,
    bodyAnalysisEnd = null,
    hairAnalysis,
    makeupAnalysis,
  } = input;

  const { monthStart, monthEnd } = getMonthRangeFromYYYYMM(month);
  const dateRange = getDateRange(monthStart, monthEnd);
  const weeksInMonth = getWeeksInMonth(monthStart, monthEnd);

  // 일별 데이터 집계
  const dailyNutrition = aggregateMealsByDay(meals, waterRecords, settings, dateRange);
  const dailyWorkout = aggregateWorkoutsByDay(workoutLogs, dateRange);

  // 영양 요약
  const nutritionSummary = calculateNutritionSummary(dailyNutrition);
  const nutritionAchievement = calculateNutritionAchievement(nutritionSummary, settings);
  const nutritionTrend = calculateNutritionTrend(dailyNutrition);

  // 운동 요약
  const workoutSummary = calculateWorkoutSummary(dailyWorkout);
  const workoutTrend = calculateWorkoutTrend(dailyWorkout);

  // 주간 비교
  const weeklyComparison = weeksInMonth.map((week) =>
    calculateWeeklySummary(dailyNutrition, dailyWorkout, week.weekStart, week.weekEnd)
  );

  // 칼로리 밸런스
  const targetCalories = settings?.daily_calories || DEFAULT_NUTRITION_TARGETS.calories;
  const totalIntake = nutritionSummary.totalCalories;
  const totalBurned = workoutSummary.totalCaloriesBurned;
  const netCalories = totalIntake - totalBurned;
  const avgNetPerDay =
    nutritionSummary.daysWithRecords > 0
      ? Math.round(netCalories / nutritionSummary.daysWithRecords)
      : 0;

  // 체중 변화 (C-1 연동)
  const goal = settings?.goal || 'maintain';
  const bodyProgress = calculateBodyProgress(bodyAnalysisStart, bodyAnalysisEnd, goal);

  // 목표 진행률
  const goalProgress = calculateGoalProgress(goal, nutritionAchievement, bodyProgress);

  // 인사이트 생성
  const insights = generateMonthlyInsights(
    nutritionSummary,
    nutritionAchievement,
    nutritionTrend,
    workoutSummary,
    weeklyComparison,
    bodyProgress,
    goalProgress
  );

  // 하이라이트
  const highlights = calculateMonthlyHighlights(weeklyComparison);

  // H-1/M-1 뷰티-영양 상관관계 계산
  const beautyNutritionCorrelation = calculateBeautyNutritionCorrelation(
    nutritionSummary,
    hairAnalysis,
    makeupAnalysis
  );

  return {
    month,
    monthStart,
    monthEnd,
    generatedAt: new Date().toISOString(),

    nutrition: {
      summary: nutritionSummary,
      achievement: nutritionAchievement,
      trend: nutritionTrend,
      dailyBreakdown: dailyNutrition,
    },

    workout: {
      summary: workoutSummary,
      trend: workoutTrend,
      dailyBreakdown: dailyWorkout,
      hasData: workoutSummary.totalSessions > 0,
    },

    weeklyComparison,

    calorieBalance: {
      totalIntake,
      totalBurned,
      netCalories,
      status: getCalorieBalanceStatus(avgNetPerDay, targetCalories),
      avgNetPerDay,
    },

    bodyProgress,
    goalProgress,
    insights,

    streak: {
      nutrition: nutritionStreak,
      workout: workoutStreak,
    },

    highlights,

    // H-1/M-1 뷰티-영양 상관관계
    beautyNutritionCorrelation,
  };
}
