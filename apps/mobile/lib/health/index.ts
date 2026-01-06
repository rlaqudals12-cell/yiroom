/**
 * 건강 데이터 연동 모듈
 * Apple Health (iOS) + Google Fit (Android) 통합
 */

// 타입 export
export * from './types';

// Apple Health (iOS) - 명시적 export
export {
  isHealthKitAvailable,
  initializeHealthKit,
  checkPermissions as checkApplePermissions,
  getTodaySteps as getAppleSteps,
  getStepHistory as getAppleStepHistory,
  getTodayActiveCalories as getAppleCalories,
  getTodayHeartRate as getAppleHeartRate,
  getHeartRateDetails as getAppleHeartRateDetails,
  getLastNightSleep as getAppleSleep,
  getLatestWeight as getAppleWeight,
  saveWorkout as saveAppleWorkout,
  saveWaterIntake as saveAppleWater,
  saveCalorieIntake as saveAppleCalories,
  getTodayHealthSummary as getAppleHealthSummary,
  getSyncState as getAppleSyncState,
  performFullSync as performAppleSync,
} from './apple-health';

// Google Fit (Android) - 명시적 export
export {
  isGoogleFitAvailable,
  initializeGoogleFit,
  checkGoogleFitPermissions,
  getTodaySteps as getGoogleSteps,
  getStepHistory as getGoogleStepHistory,
  getTodayActiveCalories as getGoogleCalories,
  getTodayHeartRate as getGoogleHeartRate,
  getLastNightSleep as getGoogleSleep,
  getLatestWeight as getGoogleWeight,
  saveWorkout as saveGoogleWorkout,
  getTodayHealthSummary as getGoogleHealthSummary,
  getGoogleFitSyncState,
  performGoogleFitSync,
} from './google-fit';

// 통합 동기화 매니저
export {
  getLocalSyncState,
  setSyncState,
  enableSync,
  disableSync,
  needsSync,
  collectTodayHealthData,
  syncToServer,
  performSync,
  performMockSync,
  isHealthDataAvailable,
  getHealthPlatform,
} from './sync-manager';
