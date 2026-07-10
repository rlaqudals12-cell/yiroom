/**
 * 알림 시스템 통합 모듈
 */

// 기존 기본 알림 함수 (notifications.ts에서)
export {
  requestNotificationPermission,
  scheduleWorkoutReminder,
  scheduleMealReminder,
  sendStreakReminder,
  sendWorkoutCompleteNotification,
  sendCalorieWarningNotification,
  cancelAllNotifications,
  cancelNotification,
  addNotificationListener,
  addNotificationResponseListener,
  setupDefaultNotifications,
} from '../notifications';

// 템플릿 시스템
export {
  type NotificationCategory,
  type NotificationType,
  type NotificationTemplate,
  type TemplateVariables,
  NOTIFICATION_TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  interpolateTemplate,
  createNotification,
  getNotificationTypesByCategory,
} from './templates';

// 알림 훅
export {
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  useNotificationPermission,
  usePushToken,
  useNotificationSettings,
  useNotificationScheduler,
  useNotificationResponse,
} from './useNotifications';

// 개인화 트리거 타입
export {
  type PersonalizedTriggerSettings,
  type PersonalizedTriggerType,
  type PersonalizedTrigger,
  type UserTriggerData,
  DEFAULT_PERSONALIZED_TRIGGER_SETTINGS,
} from './types';

// 개인화 트리거 로직
export {
  PERSONALIZED_TRIGGERS,
  evaluateTriggers,
  getTriggerById,
  getSeasonName,
  isSeasonChangeMonth,
  getDaysSinceLastAnalysis,
} from './personalized-triggers';

// 개인화 알림 훅
export {
  usePersonalizedNotifications,
  saveUserTriggerData,
  loadUserTriggerData,
  schedulePersonalizedNotifications,
} from './usePersonalizedNotifications';

// DB API (직접 사용은 드물지만 테스트/디버깅용 export)
export {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  savePushToken,
  deactivatePushToken,
  getActivePushTokens,
} from './api';

// 아침 브리핑 로컬 알림 (ADR-114/118)
export {
  type MorningBriefingSettings,
  DEFAULT_MORNING_BRIEFING_SETTINGS,
  MORNING_BRIEFING_ROUTE,
  MORNING_BRIEFING_TITLE,
  MORNING_BRIEFING_BODY,
  formatBriefingTime,
  loadMorningBriefingSettings,
  saveMorningBriefingSettings,
  scheduleMorningBriefing,
  cancelMorningBriefing,
  hasSeenBriefingProposal,
  markBriefingProposalSeen,
} from './morning-briefing';

export { type UseMorningBriefingResult, useMorningBriefing } from './useMorningBriefing';
