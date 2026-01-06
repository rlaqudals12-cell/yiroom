/**
 * 위젯 모듈 export
 */

// 타입
export * from './types';

// 데이터 제공자 (새 API - 위젯 타입별)
export {
  generateDailySummaryData,
  generateWorkoutProgressData,
  generateNutritionTrackerData,
  generateWellnessScoreData,
  generateQuickActionsData,
  generateWidgetData,
  updateAllWidgets,
} from './data-provider';

// 저장소 (기존 API - TodaySummaryData)
export {
  saveWidgetData,
  getWidgetData,
  getLastSyncTime,
  updateWaterIntake,
  updateWorkoutComplete,
  updateCaloriesConsumed,
  updateStreak,
  resetDailyData,
  setGoals,
  APP_GROUP_ID,
} from './storage';

// 훅
export { useWidgetSync } from './useWidgetSync';
