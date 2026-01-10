/**
 * 알림 설정 타입 정의
 * DB 테이블: user_notification_settings
 */

/**
 * 사용자 알림 설정 (DB 스키마와 일치)
 */
export interface NotificationSettings {
  // 전체 활성화
  enabled: boolean;

  // 운동 알림
  workoutReminder: boolean;
  workoutReminderTime: string; // HH:MM 형식
  streakWarning: boolean;

  // 영양 알림
  nutritionReminder: boolean;
  mealReminderBreakfast: string; // HH:MM 형식
  mealReminderLunch: string; // HH:MM 형식
  mealReminderDinner: string; // HH:MM 형식
  waterReminder: boolean;
  waterReminderInterval: number; // 시간 단위

  // 소셜 알림
  socialNotifications: boolean;

  // 성취 알림
  achievementNotifications: boolean;
}

/**
 * DB 스키마에서 사용하는 snake_case 형식
 */
export interface NotificationSettingsDb {
  id: string;
  clerk_user_id: string;
  enabled: boolean;
  workout_reminder: boolean;
  workout_reminder_time: string; // TIME (HH:MM:SS)
  streak_warning: boolean;
  nutrition_reminder: boolean;
  meal_reminder_breakfast: string | null; // TIME or null
  meal_reminder_lunch: string | null;
  meal_reminder_dinner: string | null;
  water_reminder: boolean;
  water_reminder_interval: number;
  social_notifications: boolean;
  achievement_notifications: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 알림 설정 기본값
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  workoutReminder: true,
  workoutReminderTime: '09:00',
  streakWarning: true,
  nutritionReminder: true,
  mealReminderBreakfast: '08:30',
  mealReminderLunch: '12:30',
  mealReminderDinner: '18:30',
  waterReminder: true,
  waterReminderInterval: 2,
  socialNotifications: true,
  achievementNotifications: true,
};

/**
 * DB 형식을 클라이언트 형식으로 변환
 */
export function dbToClientSettings(dbSettings: NotificationSettingsDb): NotificationSettings {
  return {
    enabled: dbSettings.enabled,
    workoutReminder: dbSettings.workout_reminder,
    workoutReminderTime: formatTimeToHHMM(dbSettings.workout_reminder_time),
    streakWarning: dbSettings.streak_warning,
    nutritionReminder: dbSettings.nutrition_reminder,
    mealReminderBreakfast: formatTimeToHHMM(dbSettings.meal_reminder_breakfast || '08:30:00'),
    mealReminderLunch: formatTimeToHHMM(dbSettings.meal_reminder_lunch || '12:30:00'),
    mealReminderDinner: formatTimeToHHMM(dbSettings.meal_reminder_dinner || '18:30:00'),
    waterReminder: dbSettings.water_reminder,
    waterReminderInterval: dbSettings.water_reminder_interval,
    socialNotifications: dbSettings.social_notifications,
    achievementNotifications: dbSettings.achievement_notifications,
  };
}

/**
 * 클라이언트 형식을 DB 형식으로 변환 (insert/update용)
 */
export function clientToDbSettings(
  settings: NotificationSettings,
  clerkUserId: string
): Omit<NotificationSettingsDb, 'id' | 'created_at' | 'updated_at'> {
  return {
    clerk_user_id: clerkUserId,
    enabled: settings.enabled,
    workout_reminder: settings.workoutReminder,
    workout_reminder_time: formatTimeToDbFormat(settings.workoutReminderTime),
    streak_warning: settings.streakWarning,
    nutrition_reminder: settings.nutritionReminder,
    meal_reminder_breakfast: formatTimeToDbFormat(settings.mealReminderBreakfast),
    meal_reminder_lunch: formatTimeToDbFormat(settings.mealReminderLunch),
    meal_reminder_dinner: formatTimeToDbFormat(settings.mealReminderDinner),
    water_reminder: settings.waterReminder,
    water_reminder_interval: settings.waterReminderInterval,
    social_notifications: settings.socialNotifications,
    achievement_notifications: settings.achievementNotifications,
  };
}

/**
 * DB TIME 형식(HH:MM:SS)을 클라이언트 형식(HH:MM)으로 변환
 */
function formatTimeToHHMM(time: string): string {
  // TIME 형식이 HH:MM:SS인 경우 HH:MM만 추출
  if (time.includes(':')) {
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

/**
 * 클라이언트 형식(HH:MM)을 DB TIME 형식(HH:MM:SS)으로 변환
 */
function formatTimeToDbFormat(time: string): string {
  // 이미 HH:MM:SS 형식이면 그대로 반환
  if (time.split(':').length === 3) {
    return time;
  }
  // HH:MM 형식이면 :00 추가
  return `${time}:00`;
}
