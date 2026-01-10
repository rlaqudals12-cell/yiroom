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

// 기본값 re-export (편의성)
export { DEFAULT_NOTIFICATION_SETTINGS };
