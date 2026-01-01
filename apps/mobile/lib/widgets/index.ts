/**
 * 위젯 모듈
 * iOS/Android 홈 화면 위젯 지원
 */

// 타입
export * from './types';

// 저장소
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
