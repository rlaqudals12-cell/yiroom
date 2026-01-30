/**
 * 알림 설정 DB API
 * Supabase 연동 - user_notification_settings, user_push_tokens 테이블
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { NotificationSettings } from './types';
import { pushLogger } from '../utils/logger';

// ============================================================
// DB 타입 정의
// ============================================================

/** DB 테이블 스키마: user_notification_settings */
interface DbNotificationSettings {
  id: string;
  clerk_user_id: string;
  enabled: boolean;
  workout_reminder: boolean;
  workout_reminder_time: string; // TIME 타입은 string으로 반환됨
  streak_warning: boolean;
  nutrition_reminder: boolean;
  meal_reminder_breakfast: string | null;
  meal_reminder_lunch: string | null;
  meal_reminder_dinner: string | null;
  water_reminder: boolean;
  water_reminder_interval: number;
  social_notifications: boolean;
  achievement_notifications: boolean;
  created_at: string;
  updated_at: string;
}

/** DB 테이블 스키마: user_push_tokens */
interface DbPushToken {
  id: string;
  clerk_user_id: string;
  push_token: string;
  platform: 'ios' | 'android' | 'web';
  device_name: string | null;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 알림 설정 API
// ============================================================

/**
 * 사용자 알림 설정 조회
 * @param supabase - Clerk 인증된 Supabase 클라이언트
 * @param clerkUserId - 사용자 ID
 * @returns 알림 설정 또는 null (미설정 시)
 */
export async function getUserNotificationSettings(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<NotificationSettings | null> {
  const { data, error } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    // PGRST116: no rows returned (첫 설정)
    if (error.code === 'PGRST116') {
      return null;
    }
    pushLogger.error('getUserNotificationSettings error:', error);
    throw error;
  }

  return transformDbToSettings(data);
}

/**
 * 사용자 알림 설정 저장 (Upsert)
 * @param supabase - Clerk 인증된 Supabase 클라이언트
 * @param clerkUserId - 사용자 ID
 * @param settings - 저장할 설정
 */
export async function saveUserNotificationSettings(
  supabase: SupabaseClient,
  clerkUserId: string,
  settings: NotificationSettings
): Promise<void> {
  const dbSettings = transformSettingsToDb(clerkUserId, settings);

  const { error } = await supabase
    .from('user_notification_settings')
    .upsert(dbSettings, {
      onConflict: 'clerk_user_id',
    });

  if (error) {
    pushLogger.error('saveUserNotificationSettings error:', error);
    throw error;
  }
}

// ============================================================
// 푸시 토큰 API
// ============================================================

/**
 * 푸시 토큰 저장/갱신
 * 동일 사용자+토큰이 이미 있으면 last_used_at 갱신
 * @param supabase - Clerk 인증된 Supabase 클라이언트
 * @param clerkUserId - 사용자 ID
 * @param token - Expo 푸시 토큰
 * @param deviceName - 기기 이름 (선택)
 */
export async function savePushToken(
  supabase: SupabaseClient,
  clerkUserId: string,
  token: string,
  deviceName?: string
): Promise<void> {
  const platform = Platform.OS as 'ios' | 'android';

  const { error } = await supabase.from('user_push_tokens').upsert(
    {
      clerk_user_id: clerkUserId,
      push_token: token,
      platform,
      device_name: deviceName || `${platform} device`,
      is_active: true,
      last_used_at: new Date().toISOString(),
    },
    {
      onConflict: 'clerk_user_id,push_token',
    }
  );

  if (error) {
    pushLogger.error('savePushToken error:', error);
    throw error;
  }
}

/**
 * 푸시 토큰 비활성화 (로그아웃 시 호출)
 * @param supabase - Clerk 인증된 Supabase 클라이언트
 * @param clerkUserId - 사용자 ID
 * @param token - 비활성화할 토큰
 */
export async function deactivatePushToken(
  supabase: SupabaseClient,
  clerkUserId: string,
  token: string
): Promise<void> {
  const { error } = await supabase
    .from('user_push_tokens')
    .update({ is_active: false })
    .eq('clerk_user_id', clerkUserId)
    .eq('push_token', token);

  if (error) {
    pushLogger.error('deactivatePushToken error:', error);
    throw error;
  }
}

/**
 * 사용자의 모든 활성 푸시 토큰 조회
 * @param supabase - Clerk 인증된 Supabase 클라이언트
 * @param clerkUserId - 사용자 ID
 */
export async function getActivePushTokens(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<DbPushToken[]> {
  const { data, error } = await supabase
    .from('user_push_tokens')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('is_active', true);

  if (error) {
    pushLogger.error('getActivePushTokens error:', error);
    throw error;
  }

  return data || [];
}

// ============================================================
// 변환 함수
// ============================================================

/**
 * DB 스키마 → 앱 설정 타입 변환
 * TIME 타입은 'HH:MM:SS' 형식으로 반환됨, 'HH:MM'으로 변환
 */
function transformDbToSettings(
  db: DbNotificationSettings
): NotificationSettings {
  return {
    enabled: db.enabled,
    workoutReminder: db.workout_reminder,
    workoutReminderTime: formatTimeToHHMM(db.workout_reminder_time),
    nutritionReminder: db.nutrition_reminder,
    mealReminderTimes: {
      breakfast: formatTimeToHHMM(db.meal_reminder_breakfast || '08:30'),
      lunch: formatTimeToHHMM(db.meal_reminder_lunch || '12:30'),
      dinner: formatTimeToHHMM(db.meal_reminder_dinner || '18:30'),
    },
    waterReminder: db.water_reminder,
    waterReminderInterval: db.water_reminder_interval,
    streakWarning: db.streak_warning,
    socialNotifications: db.social_notifications,
    achievementNotifications: db.achievement_notifications,
  };
}

/**
 * 앱 설정 타입 → DB upsert용 객체 변환
 */
function transformSettingsToDb(
  clerkUserId: string,
  settings: NotificationSettings
): Omit<DbNotificationSettings, 'id' | 'created_at' | 'updated_at'> {
  return {
    clerk_user_id: clerkUserId,
    enabled: settings.enabled,
    workout_reminder: settings.workoutReminder,
    workout_reminder_time: settings.workoutReminderTime,
    streak_warning: settings.streakWarning,
    nutrition_reminder: settings.nutritionReminder,
    meal_reminder_breakfast: settings.mealReminderTimes.breakfast,
    meal_reminder_lunch: settings.mealReminderTimes.lunch,
    meal_reminder_dinner: settings.mealReminderTimes.dinner,
    water_reminder: settings.waterReminder,
    water_reminder_interval: settings.waterReminderInterval,
    social_notifications: settings.socialNotifications,
    achievement_notifications: settings.achievementNotifications,
  };
}

/**
 * 'HH:MM:SS' 또는 'HH:MM' → 'HH:MM' 변환
 */
function formatTimeToHHMM(time: string): string {
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return time;
}
