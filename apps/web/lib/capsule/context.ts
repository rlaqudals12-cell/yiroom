/**
 * 컨텍스트 수집 — Daily Capsule Step 2
 *
 * 요일, 계절, 최근 사용 이력 기반 컨텍스트
 * @see docs/adr/ADR-073-one-button-daily.md
 */

import type { DailyContext, DayOfWeek, SeasonType } from '@/types/capsule';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 오늘의 컨텍스트 수집
 * Step 2: 요일 + 계절 + 최근 사용 이력
 */
export async function collectContext(userId: string): Promise<DailyContext> {
  const now = new Date();

  const [recentUsage] = await Promise.all([getRecentUsageHistory(userId)]);

  return {
    dayOfWeek: getDayOfWeek(now),
    season: getSeason(now),
    recentUsageHistory: recentUsage,
  };
}

// =============================================================================
// 요일/계절 유틸
// =============================================================================

const DAY_MAP: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function getDayOfWeek(date: Date): DayOfWeek {
  return DAY_MAP[date.getDay()];
}

export function getSeason(date: Date): SeasonType {
  const month = date.getMonth() + 1; // 0-indexed → 1-indexed

  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// =============================================================================
// 최근 사용 이력
// =============================================================================

interface RecentUsage {
  lastUsedItems: string[];
  lastRotationDate: string | null;
  frequency: Record<string, number>;
}

/**
 * 최근 7일간 Daily Capsule 아이템 사용 이력 조회
 */
async function getRecentUsageHistory(userId: string): Promise<RecentUsage> {
  const supabase = createServiceRoleClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: dailyRows, error } = await supabase
    .from('daily_capsules')
    .select('items, date')
    .eq('clerk_user_id', userId)
    .eq('status', 'completed')
    .gte('date', sevenDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(7);

  if (error) {
    console.error('[Context] 최근 사용 이력 조회 실패:', error);
    return { lastUsedItems: [], lastRotationDate: null, frequency: {} };
  }

  // 최근 사용 아이템 ID 추출
  const lastUsedItems: string[] = [];
  const frequency: Record<string, number> = {};

  for (const row of dailyRows ?? []) {
    const items = (row.items ?? []) as Array<{ id: string; moduleCode: string }>;
    for (const item of items) {
      if (item.id && !lastUsedItems.includes(item.id)) {
        lastUsedItems.push(item.id);
      }
      if (item.moduleCode) {
        frequency[item.moduleCode] = (frequency[item.moduleCode] ?? 0) + 1;
      }
    }
  }

  // 최근 로테이션 날짜 조회
  const { data: rotationRow } = await supabase
    .from('rotation_history')
    .select('created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    lastUsedItems,
    lastRotationDate: rotationRow?.created_at ?? null,
    frequency,
  };
}
