/**
 * 알림 시스템 타입 정의
 * 훅 의존성 없이 테스트 가능
 */
import { FEATURE_FLAGS } from '@yiroom/shared';

// ============================================================
// 개인화 트리거 설정
// ============================================================

export interface PersonalizedTriggerSettings {
  streakReminder: boolean;
  reanalysisDue: boolean;
  seasonalTip: boolean;
  morningRoutine: boolean;
  eveningRecap: boolean;
}

export const DEFAULT_PERSONALIZED_TRIGGER_SETTINGS: PersonalizedTriggerSettings = {
  streakReminder: true,
  reanalysisDue: true,
  seasonalTip: true,
  morningRoutine: true,
  eveningRecap: true,
};

// ============================================================
// 알림 설정 타입
// ============================================================

export interface NotificationSettings {
  enabled: boolean;
  workoutReminder: boolean;
  workoutReminderTime: string; // HH:MM
  nutritionReminder: boolean;
  mealReminderTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  waterReminder: boolean;
  waterReminderInterval: number; // hours
  streakWarning: boolean;
  socialNotifications: boolean;
  achievementNotifications: boolean;
  // 개인화 트리거 설정
  personalizedTriggers: PersonalizedTriggerSettings;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  workoutReminder: FEATURE_FLAGS.WELLNESS_PHASE2,
  workoutReminderTime: '09:00',
  nutritionReminder: FEATURE_FLAGS.WELLNESS_PHASE2,
  mealReminderTimes: {
    breakfast: '08:30',
    lunch: '12:30',
    dinner: '18:30',
  },
  waterReminder: FEATURE_FLAGS.WELLNESS_PHASE2,
  waterReminderInterval: 2,
  streakWarning: true,
  socialNotifications: FEATURE_FLAGS.SOCIAL_FEED,
  achievementNotifications: FEATURE_FLAGS.BADGES,
  personalizedTriggers: DEFAULT_PERSONALIZED_TRIGGER_SETTINGS,
};

/** 저장된 구버전 설정이 true여도 닫힌 모듈 알림을 되살리지 않는다. */
export function enforceNotificationFeatureFlags(
  settings: NotificationSettings
): NotificationSettings {
  return {
    ...settings,
    workoutReminder: FEATURE_FLAGS.WELLNESS_PHASE2 ? settings.workoutReminder : false,
    nutritionReminder: FEATURE_FLAGS.WELLNESS_PHASE2 ? settings.nutritionReminder : false,
    waterReminder: FEATURE_FLAGS.WELLNESS_PHASE2 ? settings.waterReminder : false,
    socialNotifications: FEATURE_FLAGS.SOCIAL_FEED ? settings.socialNotifications : false,
    achievementNotifications: FEATURE_FLAGS.BADGES ? settings.achievementNotifications : false,
  };
}

// ============================================================
// 개인화 트리거 타입
// ============================================================

export type PersonalizedTriggerType =
  | 'streak_reminder'
  | 'reanalysis_due'
  | 'seasonal_tip'
  | 'morning_routine'
  | 'evening_recap';

/** 사용자 상태 데이터 (트리거 조건 평가용) */
export interface UserTriggerData {
  /** 현재 streak 일수 (0이면 연속 기록 없음) */
  currentStreak: number;
  /** 오늘 할 일 완료 여부 */
  todayCompleted: boolean;
  /** 마지막 분석 날짜 (ISO string, null이면 분석 이력 없음) */
  lastAnalysisDate: string | null;
  /** 스킨케어 루틴 설정 여부 */
  hasSkincareRoutine: boolean;
  /** 오늘 기록 건수 */
  todayRecordCount: number;
}

export interface PersonalizedTrigger {
  id: PersonalizedTriggerType;
  /** 트리거 조건 평가 함수 */
  condition: (userData: UserTriggerData) => boolean;
  /** 알림 내용 생성에 사용할 변수 */
  getVariables: (userData: UserTriggerData) => Record<string, string | number>;
  /** 스케줄 설정 */
  schedule: {
    hour: number;
    minute: number;
  };
  /** NotificationSettings의 personalizedTriggers 키와 매핑 */
  settingsKey: keyof PersonalizedTriggerSettings;
}
