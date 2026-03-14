/**
 * 헬스 디바이스 연동 모듈
 * @module lib/health-device
 * @description Apple HealthKit / Google Health Connect 연동, 수면-피부 상관 분석
 */

// 타입
export type {
  HealthPlatform,
  HealthDataCategory,
  SleepStage,
  SleepRecord,
  HeartRateRecord,
  ActivityRecord,
  DailyHealthData,
  SleepSkinImpact,
  SleepSkinCorrelation,
  ConsentScope,
  HealthDataConsent,
  HealthDeviceAdapter,
} from './types';

// 수면 분석
export {
  calculateSleepQuality,
  analyzeSleepTrend,
  predictSkinImpact,
  getSkinImpactDetails,
  recommendWorkoutAdjustment,
  analyzeSleepCorrelation,
} from './sleep-analysis';

// 동의 관리
export {
  DEFAULT_RETENTION_DAYS,
  CONSENT_SCOPE_DESCRIPTIONS,
  createConsent,
  isConsentValid,
  hasConsentForScope,
  revokeConsent,
  updateConsentScopes,
  getRetentionRemainingDays,
  getDataDeletionDeadline,
} from './consent';
