/**
 * 알림 시스템 타입 정의
 * 훅 의존성 없이 테스트 가능
 */

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
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  workoutReminder: true,
  workoutReminderTime: '09:00',
  nutritionReminder: true,
  mealReminderTimes: {
    breakfast: '08:30',
    lunch: '12:30',
    dinner: '18:30',
  },
  waterReminder: true,
  waterReminderInterval: 2,
  streakWarning: true,
  socialNotifications: true,
  achievementNotifications: true,
};
