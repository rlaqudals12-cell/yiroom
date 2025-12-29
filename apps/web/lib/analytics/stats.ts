/**
 * Analytics 통계 조회
 * @description 대시보드용 통계 데이터 조회/집계
 */

import type {
  AnalyticsSummary,
  TopPage,
  TopFeature,
  DeviceBreakdown,
  UserFlow,
  RealtimeStats,
  AnalyticsPeriod,
} from '@/types/analytics';
import {
  generateMockSummary,
  generateMockTopPages,
  generateMockTopFeatures,
  generateMockDeviceBreakdown,
  generateMockUserFlow,
  generateMockRealtimeStats,
  generateMockDailyTrend,
} from './mock';

// Mock 모드 확인
const USE_MOCK = process.env.FORCE_MOCK_ANALYTICS === 'true' || true; // 현재는 항상 Mock

/**
 * 기간 계산
 */
export function getDateRange(period: AnalyticsPeriod): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().split('T')[0];
  let start: string;

  switch (period) {
    case 'today':
      start = end;
      break;
    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      start = weekAgo.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      start = monthAgo.toISOString().split('T')[0];
      break;
    }
    case 'quarter': {
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      start = quarterAgo.toISOString().split('T')[0];
      break;
    }
    default:
      start = end;
  }

  return { start, end };
}

/**
 * 대시보드 요약 통계 조회
 */
export async function getAnalyticsSummary(
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<AnalyticsSummary> {
  if (useMock) {
    return generateMockSummary(startDate, endDate);
  }

  // TODO: 실제 Supabase 쿼리 구현
  // const supabase = createClerkSupabaseClient();
  // ...

  return generateMockSummary(startDate, endDate);
}

/**
 * 인기 페이지 조회
 */
export async function getTopPages(
  limit: number,
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<TopPage[]> {
  if (useMock) {
    return generateMockTopPages(limit);
  }

  // TODO: 실제 Supabase 쿼리 구현
  void startDate;
  void endDate;

  return generateMockTopPages(limit);
}

/**
 * 인기 기능 조회
 */
export async function getTopFeatures(
  limit: number,
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<TopFeature[]> {
  if (useMock) {
    return generateMockTopFeatures(limit);
  }

  // TODO: 실제 Supabase 쿼리 구현
  void startDate;
  void endDate;

  return generateMockTopFeatures(limit);
}

/**
 * 디바이스 분포 조회
 */
export async function getDeviceBreakdown(
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<DeviceBreakdown[]> {
  if (useMock) {
    return generateMockDeviceBreakdown();
  }

  // TODO: 실제 Supabase 쿼리 구현
  void startDate;
  void endDate;

  return generateMockDeviceBreakdown();
}

/**
 * 사용자 흐름 조회
 */
export async function getUserFlow(
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<UserFlow[]> {
  if (useMock) {
    return generateMockUserFlow();
  }

  // TODO: 실제 Supabase 쿼리 구현
  void startDate;
  void endDate;

  return generateMockUserFlow();
}

/**
 * 실시간 통계 조회
 */
export async function getRealtimeStats(useMock = USE_MOCK): Promise<RealtimeStats> {
  if (useMock) {
    return generateMockRealtimeStats();
  }

  // TODO: 실제 구현 (최근 5분 데이터)
  return generateMockRealtimeStats();
}

/**
 * 일별 트렌드 조회
 */
export async function getDailyTrend(
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<Array<{ date: string; pageViews: number; uniqueUsers: number; sessions: number }>> {
  if (useMock) {
    return generateMockDailyTrend(startDate, endDate);
  }

  // TODO: 실제 Supabase 쿼리 구현
  return generateMockDailyTrend(startDate, endDate);
}

/**
 * 전체 대시보드 데이터 조회 (한 번에)
 */
export async function getAnalyticsDashboardData(
  startDate: string,
  endDate: string,
  useMock = USE_MOCK
): Promise<{
  summary: AnalyticsSummary;
  topPages: TopPage[];
  topFeatures: TopFeature[];
  deviceBreakdown: DeviceBreakdown[];
  dailyTrend: Array<{ date: string; pageViews: number; uniqueUsers: number; sessions: number }>;
}> {
  const [summary, topPages, topFeatures, deviceBreakdown, dailyTrend] = await Promise.all([
    getAnalyticsSummary(startDate, endDate, useMock),
    getTopPages(10, startDate, endDate, useMock),
    getTopFeatures(10, startDate, endDate, useMock),
    getDeviceBreakdown(startDate, endDate, useMock),
    getDailyTrend(startDate, endDate, useMock),
  ]);

  return {
    summary,
    topPages,
    topFeatures,
    deviceBreakdown,
    dailyTrend,
  };
}
