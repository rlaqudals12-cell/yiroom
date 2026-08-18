import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  NotificationSettings,
  NotificationSettingsDb,
  DEFAULT_NOTIFICATION_SETTINGS,
  dbToClientSettings,
  clientToDbSettings,
} from '@/types/notifications';

// =====================================================
// 타입 정의
// =====================================================

export interface NotificationSettingsResult {
  settings: NotificationSettings | null;
  error: string | null;
}

export interface SaveNotificationSettingsResult {
  success: boolean;
  settings: NotificationSettings | null;
  error: string | null;
}

export type NotificationSettingsPatch = Partial<NotificationSettings>;

type NotificationSettingsDbWrite = Partial<
  Omit<NotificationSettingsDb, 'id' | 'created_at' | 'updated_at'>
> & { clerk_user_id: string };

const BOOLEAN_FIELD_MAP = [
  ['enabled', 'enabled'],
  ['workoutReminder', 'workout_reminder'],
  ['streakWarning', 'streak_warning'],
  ['nutritionReminder', 'nutrition_reminder'],
  ['waterReminder', 'water_reminder'],
  ['socialNotifications', 'social_notifications'],
  ['achievementNotifications', 'achievement_notifications'],
] as const;

const TIME_FIELD_MAP = [
  ['workoutReminderTime', 'workout_reminder_time'],
  ['mealReminderBreakfast', 'meal_reminder_breakfast'],
  ['mealReminderLunch', 'meal_reminder_lunch'],
  ['mealReminderDinner', 'meal_reminder_dinner'],
] as const;

function toDbNotificationPatch(
  clerkUserId: string,
  patch: NotificationSettingsPatch
): NotificationSettingsDbWrite {
  const dbPatch: NotificationSettingsDbWrite = { clerk_user_id: clerkUserId };

  for (const [clientField, dbField] of BOOLEAN_FIELD_MAP) {
    const value = patch[clientField];
    if (value !== undefined) Object.assign(dbPatch, { [dbField]: value });
  }

  for (const [clientField, dbField] of TIME_FIELD_MAP) {
    const value = patch[clientField];
    if (value !== undefined) Object.assign(dbPatch, { [dbField]: `${value}:00` });
  }

  if (patch.waterReminderInterval !== undefined) {
    dbPatch.water_reminder_interval = patch.waterReminderInterval;
  }

  return dbPatch;
}

// =====================================================
// 알림 설정 API
// =====================================================

/**
 * 사용자의 알림 설정 조회
 * @param clerkUserId Clerk 사용자 ID
 * @returns 알림 설정 또는 기본값
 */
export async function getUserNotificationSettings(
  clerkUserId: string
): Promise<NotificationSettingsResult> {
  try {
    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      // 데이터가 없는 경우 (PGRST116: no rows returned)
      if (error.code === 'PGRST116') {
        return {
          settings: null, // 기본값은 클라이언트에서 처리
          error: null,
        };
      }

      console.error('[Notifications] Error fetching settings:', error);
      return {
        settings: null,
        error: error.message,
      };
    }

    // DB 형식을 클라이언트 형식으로 변환
    const clientSettings = dbToClientSettings(data as NotificationSettingsDb);

    return {
      settings: clientSettings,
      error: null,
    };
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err);
    return {
      settings: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * 사용자의 알림 설정 저장 (upsert)
 * @param clerkUserId Clerk 사용자 ID
 * @param settings 저장할 알림 설정
 * @returns 저장 결과
 */
export async function saveUserNotificationSettings(
  clerkUserId: string,
  settings: NotificationSettings
): Promise<SaveNotificationSettingsResult> {
  try {
    const supabase = createClerkSupabaseClient();

    // 클라이언트 형식을 DB 형식으로 변환
    const dbSettings = clientToDbSettings(settings, clerkUserId);

    // upsert: clerk_user_id로 존재하면 업데이트, 없으면 삽입
    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert(dbSettings, {
        onConflict: 'clerk_user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('[Notifications] Error saving settings:', error);
      return {
        success: false,
        settings: null,
        error: error.message,
      };
    }

    // DB 형식을 클라이언트 형식으로 변환하여 반환
    const savedSettings = dbToClientSettings(data as NotificationSettingsDb);

    return {
      success: true,
      settings: savedSettings,
      error: null,
    };
  } catch (err) {
    console.error('[Notifications] Unexpected error:', err);
    return {
      success: false,
      settings: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * 알림 설정 한 필드만 저장한다.
 *
 * DB 기본값이 있는 upsert에 변경 컬럼만 전달하므로 최초 저장은 행을 만들고,
 * 기존 행에서는 동시에 저장 중인 다른 필드를 덮어쓰지 않는다.
 */
export async function patchUserNotificationSettings(
  clerkUserId: string,
  patch: NotificationSettingsPatch
): Promise<SaveNotificationSettingsResult> {
  try {
    const supabase = createClerkSupabaseClient();
    const dbPatch = toDbNotificationPatch(clerkUserId, patch);

    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert(dbPatch, { onConflict: 'clerk_user_id' })
      .select()
      .single();

    if (error || !data) {
      console.error('[Notifications] Error patching settings:', error);
      return { success: false, settings: null, error: error?.message ?? 'No data returned' };
    }

    return {
      success: true,
      settings: dbToClientSettings(data as NotificationSettingsDb),
      error: null,
    };
  } catch (err) {
    console.error('[Notifications] Unexpected patch error:', err);
    return {
      success: false,
      settings: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// 기본값 re-export (편의성)
export { DEFAULT_NOTIFICATION_SETTINGS };
