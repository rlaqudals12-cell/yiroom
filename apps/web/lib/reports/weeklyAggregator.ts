/**
 * R-1 주간 리포트 집계 로직
 * Task R-1.2: 주간 집계 로직
 *
 * - 7일간 영양/운동 데이터 집계
 * - 트렌드 분석
 * - 인사이트 생성
 */

import type {
  WeeklyReport,
  DailyNutrition,
  DailyWorkout,
  NutritionSummaryStats,
  NutritionAchievement,
  NutritionTrend,
  WorkoutSummaryStats,
  WorkoutTrend,
  ReportInsights,
  ReportStreakStatus,
  TrendDirection,
  CalorieBalanceStatus,
  RawMealRecord,
  RawWaterRecord,
  RawNutritionSettings,
  RawWorkoutLog,
  BeautyNutritionCorrelation,
  NutrientBeautyImpact,
} from '@/types/report';

// =====================================================
// 상수 정의
// =====================================================

/**
 * 기본 영양 목표
 */
export const DEFAULT_NUTRITION_TARGETS = {
  calories: 2000,
  protein: 80,
  carbs: 250,
  fat: 55,
  water: 2000,
} as const;

/**
 * 칼로리 밸런스 임계값
 */
export const CALORIE_BALANCE_THRESHOLDS = {
  deficit: -200, // 200kcal 이상 부족 시 deficit
  surplus: 200, // 200kcal 이상 초과 시 surplus
} as const;

/**
 * 뷰티 관련 영양소 권장량 (일일 기준)
 */
export const BEAUTY_NUTRIENT_RECOMMENDATIONS = {
  biotin: { daily: 30, unit: 'mcg', label: '비오틴 (B7)', benefit: '모발 성장' },
  zinc: { daily: 11, unit: 'mg', label: '아연', benefit: '두피 건강' },
  iron: { daily: 18, unit: 'mg', label: '철분', benefit: '탈모 예방' },
  vitaminC: { daily: 100, unit: 'mg', label: '비타민 C', benefit: '피부 광채' },
  vitaminE: { daily: 15, unit: 'mg', label: '비타민 E', benefit: '항산화' },
  omega3: { daily: 1600, unit: 'mg', label: '오메가-3', benefit: '모발 윤기' },
  collagen: { daily: 5000, unit: 'mg', label: '콜라겐', benefit: '피부 탄력' },
} as const;

// =====================================================
// 뷰티 분석 원본 데이터 타입
// =====================================================

/**
 * 헤어 분석 원본 데이터 (DB에서 조회)
 */
export interface RawHairAnalysis {
  id: string;
  clerk_user_id: string;
  scalp_health: number | null;
  density: number | null;
  damage_level: number | null;
  overall_score: number | null;
  hair_type: string | null;
  concerns: string[] | null;
  recommendations: {
    ingredients?: string[];
    careTips?: string[];
  } | null;
  created_at: string;
}

/**
 * 메이크업/피부 분석 원본 데이터 (DB에서 조회)
 */
export interface RawMakeupAnalysis {
  id: string;
  clerk_user_id: string;
  skin_texture: number | null;
  hydration: number | null;
  overall_score: number | null;
  undertone: string | null;
  concerns: string[] | null;
  created_at: string;
}

// =====================================================
// 유틸리티 함수
// =====================================================

/**
 * 주간 시작일(월요일) 계산
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // 일요일(0)이면 6을 빼고, 그 외에는 (day - 1)을 뺌
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

/**
 * 주간 종료일(일요일) 계산
 */
export function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

/**
 * 날짜 범위 내 모든 날짜 생성
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * 트렌드 방향 계산
 * 첫 절반과 후 절반의 평균을 비교
 */
export function calculateTrend(values: number[]): TrendDirection {
  if (values.length < 2) return 'stable';

  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  // 10% 이상 변화 시 트렌드로 인식
  const changePercent = ((secondAvg - firstAvg) / (firstAvg || 1)) * 100;

  if (changePercent > 10) return 'up';
  if (changePercent < -10) return 'down';
  return 'stable';
}

/**
 * 음식 품질 점수 계산 (green 비율 기반)
 */
export function calculateFoodQualityScore(dailyData: DailyNutrition[]): number {
  const daysWithData = dailyData.filter((d) => d.mealsLogged > 0);
  if (daysWithData.length === 0) return 0;

  const totalGreen = daysWithData.reduce((sum, d) => sum + d.trafficLightRatio.green, 0);
  return Math.round(totalGreen / daysWithData.length);
}

/**
 * 기록 일관성 점수 계산
 */
export function calculateConsistencyScore(daysWithRecords: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((daysWithRecords / totalDays) * 100);
}

/**
 * 칼로리 밸런스 상태 결정
 */
export function getCalorieBalanceStatus(
  avgNetCalories: number,
  targetCalories: number
): CalorieBalanceStatus {
  const diff = avgNetCalories - targetCalories;

  if (diff < CALORIE_BALANCE_THRESHOLDS.deficit) return 'deficit';
  if (diff > CALORIE_BALANCE_THRESHOLDS.surplus) return 'surplus';
  return 'balanced';
}

/**
 * 일별 점수 계산 (목표 달성률 + 음식 품질)
 */
export function calculateDayScore(daily: DailyNutrition): number {
  if (daily.mealsLogged === 0) return 0;

  // 칼로리 달성률 점수 (목표의 90-110% 범위가 최고점)
  const calorieScore =
    daily.caloriePercent >= 90 && daily.caloriePercent <= 110
      ? 50
      : Math.max(0, 50 - Math.abs(daily.caloriePercent - 100) / 2);

  // 음식 품질 점수
  const qualityScore = daily.trafficLightRatio.green / 2;

  return Math.round(calorieScore + qualityScore);
}

// =====================================================
// 집계 함수
// =====================================================

/**
 * 식사 기록을 일별 영양 데이터로 변환
 */
export function aggregateMealsByDay(
  meals: RawMealRecord[],
  waterRecords: RawWaterRecord[],
  settings: RawNutritionSettings | null,
  dateRange: string[]
): DailyNutrition[] {
  // 기본 목표값
  const targets = {
    calories: settings?.daily_calories || DEFAULT_NUTRITION_TARGETS.calories,
    protein: settings?.daily_protein || DEFAULT_NUTRITION_TARGETS.protein,
    carbs: settings?.daily_carbs || DEFAULT_NUTRITION_TARGETS.carbs,
    fat: settings?.daily_fat || DEFAULT_NUTRITION_TARGETS.fat,
    water: settings?.daily_water || DEFAULT_NUTRITION_TARGETS.water,
  };

  // 날짜별 데이터 맵 초기화
  const dailyMap = new Map<string, DailyNutrition>();

  dateRange.forEach((date) => {
    dailyMap.set(date, {
      date,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      water: 0,
      mealsLogged: 0,
      trafficLightRatio: { green: 0, yellow: 0, red: 0 },
      calorieTarget: targets.calories,
      caloriePercent: 0,
    });
  });

  // 식사 기록 집계
  meals.forEach((meal) => {
    const daily = dailyMap.get(meal.meal_date);
    if (!daily) return;

    daily.calories += meal.total_calories || 0;
    daily.protein += meal.total_protein || 0;
    daily.carbs += meal.total_carbs || 0;
    daily.fat += meal.total_fat || 0;
    daily.mealsLogged += 1;

    // 신호등 비율 계산을 위한 음식 수집
    if (meal.foods && Array.isArray(meal.foods)) {
      let green = 0,
        yellow = 0,
        red = 0;
      meal.foods.forEach((food) => {
        switch (food.traffic_light) {
          case 'green':
            green++;
            break;
          case 'red':
            red++;
            break;
          default:
            yellow++;
        }
      });
      const total = green + yellow + red;
      if (total > 0) {
        // 누적 비율 (나중에 평균 계산)
        daily.trafficLightRatio.green += (green / total) * 100;
        daily.trafficLightRatio.yellow += (yellow / total) * 100;
        daily.trafficLightRatio.red += (red / total) * 100;
      }
    }
  });

  // 수분 기록 집계
  waterRecords.forEach((record) => {
    const daily = dailyMap.get(record.record_date);
    if (!daily) return;

    daily.water += record.effective_ml || record.amount_ml || 0;
  });

  // 최종 계산 (달성률, 신호등 비율 평균화)
  const result = Array.from(dailyMap.values()).map((daily) => {
    // 칼로리 달성률
    daily.caloriePercent =
      daily.calorieTarget > 0 ? Math.round((daily.calories / daily.calorieTarget) * 100) : 0;

    // 신호등 비율 평균 (식사 수로 나눔)
    if (daily.mealsLogged > 0) {
      daily.trafficLightRatio.green = Math.round(daily.trafficLightRatio.green / daily.mealsLogged);
      daily.trafficLightRatio.yellow = Math.round(
        daily.trafficLightRatio.yellow / daily.mealsLogged
      );
      daily.trafficLightRatio.red = Math.round(daily.trafficLightRatio.red / daily.mealsLogged);
    }

    // 소수점 정리
    daily.protein = Math.round(daily.protein * 10) / 10;
    daily.carbs = Math.round(daily.carbs * 10) / 10;
    daily.fat = Math.round(daily.fat * 10) / 10;

    return daily;
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 운동 기록을 일별 데이터로 변환
 */
export function aggregateWorkoutsByDay(
  workoutLogs: RawWorkoutLog[],
  dateRange: string[]
): DailyWorkout[] {
  const dailyMap = new Map<string, DailyWorkout>();

  dateRange.forEach((date) => {
    dailyMap.set(date, {
      date,
      sessions: 0,
      duration: 0,
      caloriesBurned: 0,
      workoutTypes: [],
    });
  });

  workoutLogs.forEach((log) => {
    if (!log.completed_at) return; // 완료된 운동만

    const daily = dailyMap.get(log.session_date);
    if (!daily) return;

    daily.sessions += 1;
    daily.duration += log.duration || 0;
    daily.caloriesBurned += log.calories_burned || 0;

    if (log.workout_type && !daily.workoutTypes.includes(log.workout_type)) {
      daily.workoutTypes.push(log.workout_type);
    }
  });

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 영양 요약 통계 계산
 */
export function calculateNutritionSummary(dailyData: DailyNutrition[]): NutritionSummaryStats {
  const daysWithRecords = dailyData.filter((d) => d.mealsLogged > 0).length;
  const totalCalories = dailyData.reduce((sum, d) => sum + d.calories, 0);
  const totalProtein = dailyData.reduce((sum, d) => sum + d.protein, 0);
  const totalCarbs = dailyData.reduce((sum, d) => sum + d.carbs, 0);
  const totalFat = dailyData.reduce((sum, d) => sum + d.fat, 0);
  const totalWater = dailyData.reduce((sum, d) => sum + d.water, 0);
  const mealCount = dailyData.reduce((sum, d) => sum + d.mealsLogged, 0);

  return {
    totalCalories: Math.round(totalCalories),
    avgCaloriesPerDay: daysWithRecords > 0 ? Math.round(totalCalories / daysWithRecords) : 0,
    totalProtein: Math.round(totalProtein * 10) / 10,
    avgProteinPerDay:
      daysWithRecords > 0 ? Math.round((totalProtein / daysWithRecords) * 10) / 10 : 0,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    avgCarbsPerDay: daysWithRecords > 0 ? Math.round((totalCarbs / daysWithRecords) * 10) / 10 : 0,
    totalFat: Math.round(totalFat * 10) / 10,
    avgFatPerDay: daysWithRecords > 0 ? Math.round((totalFat / daysWithRecords) * 10) / 10 : 0,
    totalWater: Math.round(totalWater),
    avgWaterPerDay: daysWithRecords > 0 ? Math.round(totalWater / daysWithRecords) : 0,
    mealCount,
    daysWithRecords,
  };
}

/**
 * 영양 달성률 계산
 */
export function calculateNutritionAchievement(
  summary: NutritionSummaryStats,
  settings: RawNutritionSettings | null
): NutritionAchievement {
  const targets = {
    calories: settings?.daily_calories || DEFAULT_NUTRITION_TARGETS.calories,
    protein: settings?.daily_protein || DEFAULT_NUTRITION_TARGETS.protein,
    carbs: settings?.daily_carbs || DEFAULT_NUTRITION_TARGETS.carbs,
    fat: settings?.daily_fat || DEFAULT_NUTRITION_TARGETS.fat,
    water: settings?.daily_water || DEFAULT_NUTRITION_TARGETS.water,
  };

  const safePercent = (value: number, target: number) =>
    target > 0 ? Math.round((value / target) * 100) : 0;

  return {
    caloriesPercent: safePercent(summary.avgCaloriesPerDay, targets.calories),
    proteinPercent: safePercent(summary.avgProteinPerDay, targets.protein),
    carbsPercent: safePercent(summary.avgCarbsPerDay, targets.carbs),
    fatPercent: safePercent(summary.avgFatPerDay, targets.fat),
    waterPercent: safePercent(summary.avgWaterPerDay, targets.water),
  };
}

/**
 * 영양 트렌드 계산
 */
export function calculateNutritionTrend(dailyData: DailyNutrition[]): NutritionTrend {
  const daysWithData = dailyData.filter((d) => d.mealsLogged > 0);
  const calories = daysWithData.map((d) => d.calories);
  const water = daysWithData.map((d) => d.water);
  const protein = daysWithData.map((d) => d.protein);

  return {
    caloriesTrend: calculateTrend(calories),
    waterTrend: calculateTrend(water),
    proteinTrend: calculateTrend(protein),
    foodQualityScore: calculateFoodQualityScore(dailyData),
    consistencyScore: calculateConsistencyScore(daysWithData.length, dailyData.length),
  };
}

/**
 * 운동 요약 통계 계산
 */
export function calculateWorkoutSummary(dailyData: DailyWorkout[]): WorkoutSummaryStats {
  const totalSessions = dailyData.reduce((sum, d) => sum + d.sessions, 0);
  const totalDuration = dailyData.reduce((sum, d) => sum + d.duration, 0);
  const totalCaloriesBurned = dailyData.reduce((sum, d) => sum + d.caloriesBurned, 0);
  const daysWithWorkout = dailyData.filter((d) => d.sessions > 0).length;

  return {
    totalSessions,
    totalDuration,
    avgDurationPerSession: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
    totalCaloriesBurned,
    daysWithWorkout,
  };
}

/**
 * 운동 트렌드 계산
 */
export function calculateWorkoutTrend(dailyData: DailyWorkout[]): WorkoutTrend {
  const daysWithWorkout = dailyData.filter((d) => d.sessions > 0);
  const durations = daysWithWorkout.map((d) => d.duration);
  const calories = daysWithWorkout.map((d) => d.caloriesBurned);

  return {
    consistencyScore: calculateConsistencyScore(daysWithWorkout.length, dailyData.length),
    durationTrend: calculateTrend(durations),
    caloriesTrend: calculateTrend(calories),
  };
}

/**
 * 주간 인사이트 생성
 */
export function generateWeeklyInsights(
  nutritionSummary: NutritionSummaryStats,
  nutritionAchievement: NutritionAchievement,
  nutritionTrend: NutritionTrend,
  workoutSummary: WorkoutSummaryStats,
  settings: RawNutritionSettings | null
): ReportInsights {
  const highlights: string[] = [];
  const improvements: string[] = [];
  const tips: string[] = [];

  // 긍정적 하이라이트
  if (nutritionAchievement.caloriesPercent >= 90 && nutritionAchievement.caloriesPercent <= 110) {
    highlights.push('칼로리 목표를 안정적으로 달성했어요!');
  }

  if (nutritionAchievement.proteinPercent >= 100) {
    highlights.push('단백질 섭취 목표를 달성했어요!');
  }

  if (nutritionTrend.foodQualityScore >= 60) {
    highlights.push('건강한 음식 위주로 식단을 구성했어요!');
  }

  if (nutritionTrend.consistencyScore >= 80) {
    highlights.push('꾸준히 식단을 기록했어요!');
  }

  if (workoutSummary.daysWithWorkout >= 3) {
    highlights.push(`이번 주 ${workoutSummary.daysWithWorkout}일 운동했어요!`);
  }

  // 개선 필요 사항
  if (nutritionAchievement.proteinPercent < 70) {
    improvements.push('단백질 섭취가 부족해요. 살코기, 계란, 두부를 추천해요.');
  }

  if (nutritionAchievement.waterPercent < 70) {
    improvements.push('수분 섭취를 늘려보세요. 하루 2L를 목표로!');
  }

  if (nutritionTrend.foodQualityScore < 40) {
    improvements.push('고칼로리 음식이 많았어요. 채소와 과일을 더 먹어보세요.');
  }

  if (nutritionAchievement.caloriesPercent > 120) {
    improvements.push('칼로리 섭취가 목표를 초과했어요.');
  }

  // 다음 주 팁
  if (settings?.goal === 'weight_loss' && nutritionAchievement.caloriesPercent > 100) {
    tips.push('감량 목표를 위해 다음 주는 간식을 줄여보세요.');
  }

  if (workoutSummary.daysWithWorkout === 0) {
    tips.push('다음 주는 가벼운 운동부터 시작해보세요!');
  } else if (workoutSummary.daysWithWorkout < 3) {
    tips.push('다음 주는 운동 횟수를 조금 늘려보세요!');
  }

  if (nutritionTrend.consistencyScore < 60) {
    tips.push('식단 기록을 더 자주 해보세요. 습관이 중요해요!');
  }

  // 최대 3개씩만 반환
  return {
    highlights: highlights.slice(0, 3),
    improvements: improvements.slice(0, 3),
    tips: tips.slice(0, 3),
  };
}

/**
 * 하이라이트 계산 (가장 좋은/나쁜 날)
 */
export function calculateHighlights(dailyData: DailyNutrition[]): {
  bestDay: string | null;
  worstDay: string | null;
  bestDayScore: number;
  worstDayScore: number;
} {
  const daysWithData = dailyData.filter((d) => d.mealsLogged > 0);

  if (daysWithData.length === 0) {
    return { bestDay: null, worstDay: null, bestDayScore: 0, worstDayScore: 0 };
  }

  const scored = daysWithData.map((d) => ({
    date: d.date,
    score: calculateDayScore(d),
  }));

  scored.sort((a, b) => b.score - a.score);

  return {
    bestDay: scored[0].date,
    worstDay: scored.length > 1 ? scored[scored.length - 1].date : null,
    bestDayScore: scored[0].score,
    worstDayScore: scored.length > 1 ? scored[scored.length - 1].score : scored[0].score,
  };
}

// =====================================================
// 메인 함수
// =====================================================

export interface WeeklyAggregatorInput {
  weekStart: string;
  meals: RawMealRecord[];
  waterRecords: RawWaterRecord[];
  workoutLogs: RawWorkoutLog[];
  settings: RawNutritionSettings | null;
  nutritionStreak: ReportStreakStatus;
  workoutStreak: ReportStreakStatus;
  // 뷰티 분석 데이터 (선택)
  hairAnalysis?: RawHairAnalysis | null;
  makeupAnalysis?: RawMakeupAnalysis | null;
}

// =====================================================
// 뷰티-영양 상관관계 분석
// =====================================================

/**
 * 단백질 섭취량을 영양소별 추정 임팩트로 변환
 * (실제 영양소 추적이 없으므로 단백질 기반 추정)
 */
function estimateNutrientIntake(
  nutritionSummary: NutritionSummaryStats,
  nutrient: keyof typeof BEAUTY_NUTRIENT_RECOMMENDATIONS
): number {
  const proteinRatio = nutritionSummary.avgProteinPerDay / DEFAULT_NUTRITION_TARGETS.protein;
  const rec = BEAUTY_NUTRIENT_RECOMMENDATIONS[nutrient];

  // 단백질 섭취 비율을 기반으로 영양소 섭취량 추정
  // (실제 데이터가 없으므로 proxy 값)
  switch (nutrient) {
    case 'biotin':
    case 'zinc':
    case 'iron':
      // 단백질과 상관관계가 높은 영양소
      return Math.round(rec.daily * proteinRatio * 0.8);
    case 'vitaminC':
    case 'vitaminE':
      // 채소/과일 섭취와 상관 (칼로리 기반 추정)
      const calorieRatio = nutritionSummary.avgCaloriesPerDay / DEFAULT_NUTRITION_TARGETS.calories;
      return Math.round(rec.daily * calorieRatio * 0.6);
    case 'omega3':
      // 지방 섭취와 상관
      const fatRatio = nutritionSummary.avgFatPerDay / DEFAULT_NUTRITION_TARGETS.fat;
      return Math.round(rec.daily * fatRatio * 0.5);
    case 'collagen':
      // 단백질과 상관
      return Math.round(rec.daily * proteinRatio * 0.4);
    default:
      return Math.round(rec.daily * 0.5);
  }
}

/**
 * 영양소별 뷰티 임팩트 분석
 */
function analyzeNutrientImpacts(
  nutritionSummary: NutritionSummaryStats,
  hasHairData: boolean,
  hasSkinData: boolean
): NutrientBeautyImpact[] {
  const impacts: NutrientBeautyImpact[] = [];

  // 헤어 관련 영양소
  if (hasHairData) {
    const hairNutrients: (keyof typeof BEAUTY_NUTRIENT_RECOMMENDATIONS)[] = [
      'biotin',
      'zinc',
      'iron',
      'omega3',
    ];
    for (const nutrient of hairNutrients) {
      const rec = BEAUTY_NUTRIENT_RECOMMENDATIONS[nutrient];
      const intake = estimateNutrientIntake(nutritionSummary, nutrient);
      const percentage = Math.min(100, Math.round((intake / rec.daily) * 100));

      impacts.push({
        nutrient,
        label: rec.label,
        intake,
        recommended: rec.daily,
        percentage,
        impact: percentage >= 80 ? 'positive' : percentage >= 50 ? 'neutral' : 'negative',
      });
    }
  }

  // 피부 관련 영양소
  if (hasSkinData) {
    const skinNutrients: (keyof typeof BEAUTY_NUTRIENT_RECOMMENDATIONS)[] = [
      'vitaminC',
      'vitaminE',
      'collagen',
    ];
    for (const nutrient of skinNutrients) {
      // 헤어 데이터도 있으면 중복 방지
      if (hasHairData && impacts.some((i) => i.nutrient === nutrient)) continue;

      const rec = BEAUTY_NUTRIENT_RECOMMENDATIONS[nutrient];
      const intake = estimateNutrientIntake(nutritionSummary, nutrient);
      const percentage = Math.min(100, Math.round((intake / rec.daily) * 100));

      impacts.push({
        nutrient,
        label: rec.label,
        intake,
        recommended: rec.daily,
        percentage,
        impact: percentage >= 80 ? 'positive' : percentage >= 50 ? 'neutral' : 'negative',
      });
    }
  }

  return impacts;
}

/**
 * 뷰티-영양 상관관계 추천사항 생성
 */
function generateBeautyRecommendations(
  hairAnalysis: RawHairAnalysis | null | undefined,
  makeupAnalysis: RawMakeupAnalysis | null | undefined,
  nutrientImpacts: NutrientBeautyImpact[]
): string[] {
  const recommendations: string[] = [];

  // 헤어 기반 추천
  if (hairAnalysis) {
    const scalpHealth = hairAnalysis.scalp_health ?? 70;
    const density = hairAnalysis.density ?? 70;
    const damage = hairAnalysis.damage_level ?? 30;

    if (scalpHealth < 60) {
      recommendations.push('두피 건강을 위해 아연과 비오틴이 풍부한 견과류, 달걀을 섭취해보세요.');
    }
    if (density < 60) {
      recommendations.push(
        '모발 밀도를 위해 철분과 단백질 섭취를 늘려보세요. 시금치, 두부가 좋아요.'
      );
    }
    if (damage > 50) {
      recommendations.push('손상된 모발 회복을 위해 오메가-3 (연어, 호두)를 추천해요.');
    }
  }

  // 피부 기반 추천
  if (makeupAnalysis) {
    const hydration = makeupAnalysis.hydration ?? 70;
    const texture = makeupAnalysis.skin_texture ?? 70;

    if (hydration < 60) {
      recommendations.push('피부 수분을 위해 물 섭취를 늘리고, 비타민 C가 풍부한 과일을 드세요.');
    }
    if (texture < 60) {
      recommendations.push('피부 탄력을 위해 콜라겐과 비타민 E가 풍부한 식품을 섭취해보세요.');
    }
  }

  // 영양소 부족 기반 추천
  const negativeImpacts = nutrientImpacts.filter((i) => i.impact === 'negative');
  if (negativeImpacts.length > 0 && recommendations.length < 3) {
    const top = negativeImpacts[0];
    recommendations.push(
      `${top.label} 섭취가 부족해요. 권장량의 ${top.percentage}%만 섭취 중이에요.`
    );
  }

  return recommendations.slice(0, 3);
}

/**
 * 뷰티-영양 상관관계 계산
 */
export function calculateBeautyNutritionCorrelation(
  nutritionSummary: NutritionSummaryStats,
  hairAnalysis: RawHairAnalysis | null | undefined,
  makeupAnalysis: RawMakeupAnalysis | null | undefined
): BeautyNutritionCorrelation | undefined {
  const hasHairData = !!hairAnalysis;
  const hasSkinData = !!makeupAnalysis;

  // 뷰티 분석 데이터가 없으면 undefined
  if (!hasHairData && !hasSkinData) {
    return undefined;
  }

  // 영양소별 임팩트 분석
  const nutrientImpacts = analyzeNutrientImpacts(nutritionSummary, hasHairData, hasSkinData);

  // 종합 점수 계산
  const positiveCount = nutrientImpacts.filter((i) => i.impact === 'positive').length;
  const totalCount = nutrientImpacts.length;
  const avgPercentage =
    nutrientImpacts.reduce((sum, i) => sum + i.percentage, 0) / (totalCount || 1);

  // 뷰티 건강도
  let beautyScore = 50;
  if (hairAnalysis?.overall_score) {
    beautyScore = hairAnalysis.overall_score;
  }
  if (makeupAnalysis?.overall_score) {
    beautyScore =
      hasSkinData && hasHairData
        ? Math.round((beautyScore + makeupAnalysis.overall_score) / 2)
        : makeupAnalysis.overall_score;
  }

  // 영양-뷰티 조화도 (영양소 달성률과 뷰티 점수의 조합)
  const overallScore = Math.round(avgPercentage * 0.4 + beautyScore * 0.6);

  // 트렌드 결정
  let trend: TrendDirection = 'stable';
  if (positiveCount >= totalCount * 0.7) trend = 'up';
  else if (positiveCount <= totalCount * 0.3) trend = 'down';

  // 메시지 생성
  let message = '영양 섭취와 뷰티 건강이 균형을 이루고 있어요.';
  if (trend === 'up') {
    message = '영양 섭취가 뷰티 건강에 긍정적인 영향을 주고 있어요!';
  } else if (trend === 'down') {
    message = '뷰티 건강을 위해 영양 섭취를 개선해보세요.';
  }

  // 추천사항
  const recommendations = generateBeautyRecommendations(
    hairAnalysis,
    makeupAnalysis,
    nutrientImpacts
  );

  return {
    hairHealth: hairAnalysis
      ? {
          scalpScore: hairAnalysis.scalp_health,
          densityScore: hairAnalysis.density,
          damageLevel: hairAnalysis.damage_level,
          overallScore: hairAnalysis.overall_score,
          analyzedAt: hairAnalysis.created_at,
        }
      : null,

    skinHealth: makeupAnalysis
      ? {
          hydration: makeupAnalysis.hydration,
          texture: makeupAnalysis.skin_texture,
          overallScore: makeupAnalysis.overall_score,
          analyzedAt: makeupAnalysis.created_at,
        }
      : null,

    nutrientImpacts,

    correlationSummary: {
      overallScore,
      trend,
      message,
    },

    recommendations,

    hasHairData,
    hasSkinData,
  };
}

/**
 * 주간 리포트 생성
 */
export function generateWeeklyReport(input: WeeklyAggregatorInput): WeeklyReport {
  const {
    weekStart,
    meals,
    waterRecords,
    workoutLogs,
    settings,
    nutritionStreak,
    workoutStreak,
    hairAnalysis,
    makeupAnalysis,
  } = input;

  const weekEnd = getWeekEnd(weekStart);
  const dateRange = getDateRange(weekStart, weekEnd);

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

  // 칼로리 밸런스
  const targetCalories = settings?.daily_calories || DEFAULT_NUTRITION_TARGETS.calories;
  const totalIntake = nutritionSummary.totalCalories;
  const totalBurned = workoutSummary.totalCaloriesBurned;
  const netCalories = totalIntake - totalBurned;
  const avgNetPerDay =
    nutritionSummary.daysWithRecords > 0
      ? Math.round(netCalories / nutritionSummary.daysWithRecords)
      : 0;

  // 인사이트 생성
  const insights = generateWeeklyInsights(
    nutritionSummary,
    nutritionAchievement,
    nutritionTrend,
    workoutSummary,
    settings
  );

  // 하이라이트
  const highlights = calculateHighlights(dailyNutrition);

  // 뷰티-영양 상관관계 (H-1/M-1 연동)
  const beautyNutritionCorrelation = calculateBeautyNutritionCorrelation(
    nutritionSummary,
    hairAnalysis,
    makeupAnalysis
  );

  return {
    weekStart,
    weekEnd,
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

    calorieBalance: {
      totalIntake,
      totalBurned,
      netCalories,
      status: getCalorieBalanceStatus(avgNetPerDay, targetCalories),
      avgNetPerDay,
    },

    insights,

    streak: {
      nutrition: nutritionStreak,
      workout: workoutStreak,
    },

    highlights,

    // 뷰티-영양 상관관계 (선택)
    beautyNutritionCorrelation,
  };
}
