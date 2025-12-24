'use server';

/**
 * 어필리에이트 통계 서버 액션
 * Sprint E Day 10: 수익화 준비
 */

import { getAffiliateStats, getTodayClickCount } from '@/lib/products/affiliate';
import type { AffiliateStats } from '@/types/affiliate';

export type StatsPeriod = 'today' | 'week' | 'month' | 'all';

/**
 * 기간별 날짜 범위 계산
 */
function getDateRange(period: StatsPeriod): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today':
      // 오늘만
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'all':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  return { startDate, endDate };
}

/**
 * 어필리에이트 통계 조회
 */
export async function fetchAffiliateStats(
  period: StatsPeriod
): Promise<AffiliateStats | null> {
  const { startDate, endDate } = getDateRange(period);
  return getAffiliateStats(startDate, endDate);
}

/**
 * 오늘 클릭 수 조회
 */
export async function fetchTodayClicks(): Promise<number> {
  return getTodayClickCount();
}

/**
 * 대시보드용 요약 통계
 */
export interface DashboardStats {
  todayClicks: number;
  weekClicks: number;
  monthClicks: number;
  weeklyGrowth: number; // 전주 대비 증감율 (%)
}

/**
 * 대시보드 요약 통계 조회
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  // 병렬로 조회
  const [todayClicks, thisWeekStats, lastWeekStats, monthStats] = await Promise.all([
    getTodayClickCount(),
    getAffiliateStats(weekAgo, endDate),
    getAffiliateStats(twoWeeksAgo, weekAgo),
    getAffiliateStats(monthAgo, endDate),
  ]);

  const weekClicks = thisWeekStats?.totalClicks ?? 0;
  const lastWeekClicks = lastWeekStats?.totalClicks ?? 0;
  const monthClicks = monthStats?.totalClicks ?? 0;

  // 주간 증감율 계산
  let weeklyGrowth = 0;
  if (lastWeekClicks > 0) {
    weeklyGrowth = Math.round(((weekClicks - lastWeekClicks) / lastWeekClicks) * 100);
  } else if (weekClicks > 0) {
    weeklyGrowth = 100;
  }

  return {
    todayClicks,
    weekClicks,
    monthClicks,
    weeklyGrowth,
  };
}
