/**
 * 활동 트래킹 함수
 * 각 모듈에서 활동 기록 시 호출
 * @see docs/SPEC-LEVEL-SYSTEM.md
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVITY_POINTS, type ActivityType } from './constants';

/**
 * 활동 기록 추가
 * DB 트리거가 자동으로 user_levels 업데이트
 */
export async function trackActivity(
  supabase: SupabaseClient,
  userId: string,
  type: ActivityType,
  activityId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const points = ACTIVITY_POINTS[type];

    const { error } = await supabase.from('activity_logs').insert({
      clerk_user_id: userId,
      activity_type: type,
      activity_id: activityId,
      points,
    });

    if (error) {
      console.error('[Levels] Failed to track activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[Levels] Unexpected error tracking activity:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * 사용자 레벨 정보 조회
 */
export async function getUserLevel(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  level: number;
  totalActivityCount: number;
  levelUpdatedAt: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('user_levels')
      .select('level, total_activity_count, level_updated_at')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      // 레코드가 없으면 기본값 반환
      if (error.code === 'PGRST116') {
        return {
          level: 1,
          totalActivityCount: 0,
          levelUpdatedAt: null,
        };
      }
      console.error('[Levels] Failed to get user level:', error);
      return null;
    }

    return {
      level: data.level,
      totalActivityCount: data.total_activity_count || 0,
      levelUpdatedAt: data.level_updated_at,
    };
  } catch (error) {
    console.error('[Levels] Unexpected error getting user level:', error);
    return null;
  }
}

/**
 * 사용자 활동 로그 조회 (최근 N개)
 */
export async function getUserActivityLogs(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20
): Promise<
  {
    id: string;
    activityType: ActivityType;
    points: number;
    createdAt: string;
  }[]
> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, activity_type, points, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Levels] Failed to get activity logs:', error);
      return [];
    }

    return (data || []).map((log) => ({
      id: log.id,
      activityType: log.activity_type as ActivityType,
      points: log.points,
      createdAt: log.created_at,
    }));
  } catch (error) {
    console.error('[Levels] Unexpected error getting activity logs:', error);
    return [];
  }
}

/**
 * 오늘 활동 수 조회 (유형별)
 */
export async function getTodayActivityCount(
  supabase: SupabaseClient,
  userId: string,
  type: ActivityType
): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('clerk_user_id', userId)
      .eq('activity_type', type)
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('[Levels] Failed to get today activity count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[Levels] Unexpected error:', error);
    return 0;
  }
}

/**
 * 레벨 정의 조회 (DB에서)
 */
export async function getLevelDefinitions(supabase: SupabaseClient) {
  try {
    const { data, error } = await supabase
      .from('level_definitions')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.error('[Levels] Failed to get level definitions:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Levels] Unexpected error:', error);
    return null;
  }
}
