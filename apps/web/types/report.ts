/**
 * R-1 주간/월간 리포트 타입 정의
 * Task R-1.1: 리포트 타입 정의
 */

import type { TrafficLight, NutritionGoal } from './nutrition';

// =====================================================
// 기본 타입
// =====================================================

/**
 * 트렌드 방향
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * 칼로리 밸런스 상태
 */
export type CalorieBalanceStatus = 'deficit' | 'balanced' | 'surplus';

// =====================================================
// 일일 데이터 타입
// =====================================================

/**
 * 일일 영양 데이터 (리포트용)
 */
export interface DailyNutrition {
  date: string;                     // YYYY-MM-DD
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;                    // ml
  mealsLogged: number;
  trafficLightRatio: {
    green: number;
    yellow: number;
    red: number;
  };
  calorieTarget: number;
  caloriePercent: number;           // 목표 대비 %
}

/**
 * 일일 운동 데이터 (리포트용)
 */
export interface DailyWorkout {
  date: string;                     // YYYY-MM-DD
  sessions: number;
  duration: number;                 // minutes
  caloriesBurned: number;
  workoutTypes: string[];
}

// =====================================================
// 요약 타입
// =====================================================

/**
 * 영양 요약 통계
 */
export interface NutritionSummaryStats {
  totalCalories: number;
  avgCaloriesPerDay: number;
  totalProtein: number;
  avgProteinPerDay: number;
  totalCarbs: number;
  avgCarbsPerDay: number;
  totalFat: number;
  avgFatPerDay: number;
  totalWater: number;
  avgWaterPerDay: number;
  mealCount: number;
  daysWithRecords: number;
}

/**
 * 영양 달성률
 */
export interface NutritionAchievement {
  caloriesPercent: number;          // 평균 목표 대비 %
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  waterPercent: number;
}

/**
 * 영양 트렌드
 */
export interface NutritionTrend {
  caloriesTrend: TrendDirection;
  waterTrend: TrendDirection;
  proteinTrend: TrendDirection;
  foodQualityScore: number;         // 0-100 (green 비율 기반)
  consistencyScore: number;         // 0-100 (기록 빈도 기반)
}

/**
 * 운동 요약 통계
 */
export interface WorkoutSummaryStats {
  totalSessions: number;
  totalDuration: number;            // minutes
  avgDurationPerSession: number;
  totalCaloriesBurned: number;
  daysWithWorkout: number;
}

/**
 * 운동 트렌드
 */
export interface WorkoutTrend {
  consistencyScore: number;         // 0-100
  durationTrend: TrendDirection;
  caloriesTrend: TrendDirection;
}

// =====================================================
// 인사이트 타입
// =====================================================

/**
 * 리포트 인사이트 타입
 */
export type ReportInsightType =
  | 'highlight'                     // 긍정적 변화/성과
  | 'improvement'                   // 개선 필요
  | 'tip'                           // 추천/팁
  | 'achievement'                   // 마일스톤 달성
  | 'warning';                      // 경고

/**
 * 리포트 인사이트
 */
export interface ReportInsight {
  type: ReportInsightType;
  message: string;
  icon?: string;
  data?: Record<string, unknown>;
}

/**
 * 인사이트 모음
 */
export interface ReportInsights {
  highlights: string[];             // 긍정적 변화
  improvements: string[];           // 개선 필요 사항
  tips: string[];                   // 다음 기간 추천
  achievements?: string[];          // 달성 사항
}

// =====================================================
// 스트릭 타입
// =====================================================

/**
 * 스트릭 상태 (리포트용)
 */
export interface ReportStreakStatus {
  current: number;
  longest: number;
  milestone: number | null;         // 기간 내 달성한 마일스톤
  message: string;
}

// =====================================================
// 주간 리포트
// =====================================================

/**
 * 주간 리포트
 */
export interface WeeklyReport {
  // 메타데이터
  weekStart: string;                // YYYY-MM-DD (월요일)
  weekEnd: string;                  // YYYY-MM-DD (일요일)
  generatedAt: string;              // ISO timestamp

  // 영양 데이터
  nutrition: {
    summary: NutritionSummaryStats;
    achievement: NutritionAchievement;
    trend: NutritionTrend;
    dailyBreakdown: DailyNutrition[];
  };

  // 운동 데이터
  workout: {
    summary: WorkoutSummaryStats;
    trend: WorkoutTrend;
    dailyBreakdown: DailyWorkout[];
    hasData: boolean;               // 운동 데이터 존재 여부
  };

  // 통합 분석
  calorieBalance: {
    totalIntake: number;
    totalBurned: number;
    netCalories: number;
    status: CalorieBalanceStatus;
    avgNetPerDay: number;
  };

  // 인사이트
  insights: ReportInsights;

  // 스트릭
  streak: {
    nutrition: ReportStreakStatus;
    workout: ReportStreakStatus;
  };

  // 하이라이트
  highlights: {
    bestDay: string | null;         // 가장 건강한 날 (date)
    worstDay: string | null;        // 개선 필요한 날 (date)
    bestDayScore: number;
    worstDayScore: number;
  };
}

// =====================================================
// 월간 리포트
// =====================================================

/**
 * 주간 요약 (월간 비교용)
 */
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  avgCalories: number;
  avgWater: number;
  avgProtein: number;
  workoutCount: number;
  mealCount: number;
  foodQualityScore: number;
}

/**
 * 체중 변화 (C-1 연동)
 */
export interface BodyProgress {
  startWeight: number | null;
  endWeight: number | null;
  weightChange: number;
  reanalysisRecommended: boolean;
  message: string;
}

/**
 * 목표 진행률
 */
export interface GoalProgress {
  goal: NutritionGoal;
  achievementRate: number;          // 0-100
  message: string;
  isOnTrack: boolean;
}

/**
 * 월간 리포트
 */
export interface MonthlyReport {
  // 메타데이터
  month: string;                    // YYYY-MM
  monthStart: string;               // YYYY-MM-DD
  monthEnd: string;                 // YYYY-MM-DD
  generatedAt: string;

  // 영양 데이터
  nutrition: {
    summary: NutritionSummaryStats;
    achievement: NutritionAchievement;
    trend: NutritionTrend;
    dailyBreakdown: DailyNutrition[];
  };

  // 운동 데이터
  workout: {
    summary: WorkoutSummaryStats;
    trend: WorkoutTrend;
    dailyBreakdown: DailyWorkout[];
    hasData: boolean;
  };

  // 주간 비교
  weeklyComparison: WeeklySummary[];

  // 통합 분석
  calorieBalance: {
    totalIntake: number;
    totalBurned: number;
    netCalories: number;
    status: CalorieBalanceStatus;
    avgNetPerDay: number;
  };

  // 체중 변화 (C-1 연동)
  bodyProgress: BodyProgress;

  // 목표 진행률
  goalProgress: GoalProgress;

  // 인사이트
  insights: ReportInsights;

  // 스트릭
  streak: {
    nutrition: ReportStreakStatus;
    workout: ReportStreakStatus;
  };

  // 하이라이트
  highlights: {
    bestWeek: number | null;        // 1-4
    worstWeek: number | null;
    bestWeekScore: number;
    worstWeekScore: number;
  };
}

// =====================================================
// API 응답 타입
// =====================================================

/**
 * 주간 리포트 API 응답
 */
export interface WeeklyReportResponse {
  success: boolean;
  data?: WeeklyReport;
  error?: string;
  hasData: boolean;
}

/**
 * 월간 리포트 API 응답
 */
export interface MonthlyReportResponse {
  success: boolean;
  data?: MonthlyReport;
  error?: string;
  hasData: boolean;
}

/**
 * 리포트 목록 항목
 */
export interface ReportListItem {
  type: 'weekly' | 'monthly';
  period: string;                   // YYYY-MM-DD (주간) 또는 YYYY-MM (월간)
  label: string;                    // 표시용 (예: "12월 1주차", "2024년 12월")
  summary: {
    avgCalories: number;
    avgWater: number;
    mealCount: number;
    workoutCount: number;
    streak: number;
  };
}

/**
 * 리포트 목록 API 응답
 */
export interface ReportListResponse {
  success: boolean;
  data: ReportListItem[];
  error?: string;
}

// =====================================================
// 집계 함수 입력 타입
// =====================================================

/**
 * 영양 기록 원본 데이터 (DB에서 조회)
 */
export interface RawMealRecord {
  id: string;
  clerk_user_id: string;
  meal_date: string;
  meal_type: string;
  foods: Array<{
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    traffic_light: TrafficLight;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}

/**
 * 수분 기록 원본 데이터 (DB에서 조회)
 */
export interface RawWaterRecord {
  id: string;
  clerk_user_id: string;
  record_date: string;
  amount_ml: number;
  effective_ml: number;
  drink_type: string;
}

/**
 * 영양 설정 원본 데이터 (DB에서 조회)
 */
export interface RawNutritionSettings {
  goal: NutritionGoal;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  daily_water: number;
}

/**
 * 운동 기록 원본 데이터 (DB에서 조회 - 향후 구현)
 */
export interface RawWorkoutLog {
  id: string;
  clerk_user_id: string;
  session_date: string;
  workout_type: string;
  duration: number;                 // minutes
  calories_burned: number;
  completed_at: string | null;
}
