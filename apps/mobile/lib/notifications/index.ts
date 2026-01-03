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
