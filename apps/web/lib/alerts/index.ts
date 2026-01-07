/**
 * P3-5.3: 통합 알림 시스템
 */

// 타입 정의
export {
  type ModuleType,
  type CrossModuleAlertType,
  type AlertPriority,
  type AlertLevel,
  type CrossModuleAlertData,
  ALERT_TYPE_CONFIG,
  ALERT_LEVEL_STYLES,
  MODULE_LABELS,
} from './types';

// 알림 생성 함수
export {
  createCalorieSurplusAlert,
  createPostWorkoutNutritionAlert,
  createPostWorkoutSkinAlert,
  createHydrationReminderAlert,
  createWeightChangeAlert,
  // H-1 → N-1 알림
  createScalpHealthNutritionAlert,
  createHairLossPreventionAlert,
  createHairShineBoostAlert,
  // M-1 → N-1 알림
  createSkinToneNutritionAlert,
  createCollagenBoostAlert,
  // 유틸리티
  sortAlertsByPriority,
  filterExpiredAlerts,
  getVisibleAlerts,
} from './crossModuleAlerts';
