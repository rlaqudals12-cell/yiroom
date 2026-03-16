// lib/reports 공개 API

// 연간 리포트
export type { YearlyStats } from './yearlyTypes';
export { getMonthName, generateYearlyHighlights } from './yearlyTypes';
export { getYearlyStats } from './yearlyAggregator';

// 월간 리포트
export {
  getMonthStart,
  getMonthEnd,
  getMonthRangeFromYYYYMM,
  getWeeksInMonth,
  calculateWeeklySummary,
  calculateBodyProgress,
  calculateGoalProgress,
  generateMonthlyInsights,
  calculateMonthlyHighlights,
  generateMonthlyReport,
} from './monthlyAggregator';
export type { MonthlyAggregatorInput } from './monthlyAggregator';

// 주간 리포트
export {
  DEFAULT_NUTRITION_TARGETS,
  CALORIE_BALANCE_THRESHOLDS,
  BEAUTY_NUTRIENT_RECOMMENDATIONS,
  getWeekStart,
  getWeekEnd,
  getDateRange,
  calculateTrend,
  calculateFoodQualityScore,
  calculateConsistencyScore,
  getCalorieBalanceStatus,
  calculateDayScore,
  aggregateMealsByDay,
  aggregateWorkoutsByDay,
  calculateNutritionSummary,
  calculateNutritionAchievement,
  calculateNutritionTrend,
  calculateWorkoutSummary,
  calculateWorkoutTrend,
  generateWeeklyInsights,
  generateNextActions,
  calculateHighlights,
  calculateBeautyNutritionCorrelation,
  generateWeeklyReport,
} from './weeklyAggregator';
export type { WeeklyAggregatorInput, RawHairAnalysis, RawMakeupAnalysis } from './weeklyAggregator';
