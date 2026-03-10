/**
 * Analytics 통계 조회
 * @description 대시보드용 통계 데이터 조회/집계
 */

import type {
  AnalyticsSummary,
  TopPage,
  TopFeature,
  DeviceBreakdown,
  DeviceType,
  UserFlow,
  RealtimeStats,
  AnalyticsPeriod,
} from '@/types/analytics';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generateMockSummary,
  generateMockTopPages,
  generateMockTopFeatures,
  generateMockDeviceBreakdown,
  generateMockUserFlow,
  generateMockRealtimeStats,
  generateMockDailyTrend,
} from './mock';

// Mock 모드 확인 (테이블이 없으면 자동으로 Mock 사용)
const USE_MOCK = process.env.FORCE_MOCK_ANALYTICS === 'true';

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
 * 이전 기간 계산 (비교용)
 */
function getPreviousPeriod(startDate: string, endDate: string): { start: string; end: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);

  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  };
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

  try {
    const supabase = createServiceRoleClient();
    const prevPeriod = getPreviousPeriod(startDate, endDate);

    // 현재 기간 통계
    const [eventsResult, sessionsResult, prevEventsResult, prevSessionsResult] = await Promise.all([
      // 현재 기간 이벤트
      supabase
        .from('analytics_events')
        .select('id, clerk_user_id', { count: 'exact' })
        .eq('event_type', 'page_view')
        .gte('created_at', `${startDate}T00:00:00Z`)
        .lte('created_at', `${endDate}T23:59:59Z`),

      // 현재 기간 세션
      supabase
        .from('analytics_sessions')
        .select('id, duration_seconds, page_views, clerk_user_id', { count: 'exact' })
        .gte('started_at', `${startDate}T00:00:00Z`)
        .lte('started_at', `${endDate}T23:59:59Z`),

      // 이전 기간 이벤트
      supabase
        .from('analytics_events')
        .select('id, clerk_user_id', { count: 'exact' })
        .eq('event_type', 'page_view')
        .gte('created_at', `${prevPeriod.start}T00:00:00Z`)
        .lte('created_at', `${prevPeriod.end}T23:59:59Z`),

      // 이전 기간 세션
      supabase
        .from('analytics_sessions')
        .select('id', { count: 'exact' })
        .gte('started_at', `${prevPeriod.start}T00:00:00Z`)
        .lte('started_at', `${prevPeriod.end}T23:59:59Z`),
    ]);

    const totalPageViews = eventsResult.count || 0;
    const totalSessions = sessionsResult.count || 0;
    const prevPageViews = prevEventsResult.count || 0;
    const prevSessions = prevSessionsResult.count || 0;

    // 고유 사용자 수 계산
    const uniqueUsers = new Set(eventsResult.data?.map((e) => e.clerk_user_id).filter(Boolean))
      .size;
    const prevUniqueUsers = new Set(
      prevEventsResult.data?.map((e) => e.clerk_user_id).filter(Boolean)
    ).size;

    // 평균 계산
    const sessions = sessionsResult.data || [];
    const avgSessionDuration =
      sessions.length > 0
        ? Math.round(
            sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length
          )
        : 0;

    const avgPagePerSession =
      sessions.length > 0
        ? Math.round(
            (sessions.reduce((sum, s) => sum + (s.page_views || 0), 0) / sessions.length) * 10
          ) / 10
        : 0;

    // 이탈률 계산 (페이지뷰 1회인 세션 비율)
    const bouncedSessions = sessions.filter((s) => s.page_views === 1).length;
    const bounceRate =
      sessions.length > 0 ? Math.round((bouncedSessions / sessions.length) * 1000) / 10 : 0;

    // 변화율 계산
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    };

    return {
      period: { start: startDate, end: endDate },
      totalPageViews,
      uniqueUsers,
      totalSessions,
      avgSessionDuration,
      avgPagePerSession,
      bounceRate,
      comparedToPrevious: {
        pageViewsChange: calcChange(totalPageViews, prevPageViews),
        usersChange: calcChange(uniqueUsers, prevUniqueUsers),
        sessionsChange: calcChange(totalSessions, prevSessions),
      },
    };
  } catch (error) {
    console.error('[Analytics] getAnalyticsSummary error:', error);
    return generateMockSummary(startDate, endDate);
  }
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

  try {
    const supabase = createServiceRoleClient();

    // 일별 통계에서 페이지뷰 집계
    const { data, error } = await supabase
      .from('analytics_daily_stats')
      .select('metric_name, value, unique_users, avg_duration_seconds')
      .eq('metric_type', 'page_views')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    // 페이지별 집계
    const pageMap = new Map<
      string,
      { pageViews: number; uniqueUsers: number; totalDuration: number; count: number }
    >();

    for (const row of data || []) {
      const existing = pageMap.get(row.metric_name) || {
        pageViews: 0,
        uniqueUsers: 0,
        totalDuration: 0,
        count: 0,
      };
      pageMap.set(row.metric_name, {
        pageViews: existing.pageViews + row.value,
        uniqueUsers: existing.uniqueUsers + row.unique_users,
        totalDuration: existing.totalDuration + (row.avg_duration_seconds || 0),
        count: existing.count + 1,
      });
    }

    // 정렬 및 상위 N개 추출
    const sorted = Array.from(pageMap.entries())
      .map(([path, stats]) => ({
        path,
        pageViews: stats.pageViews,
        uniqueUsers: stats.uniqueUsers,
        avgDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
        bounceRate: 0, // P2: 세션 기반 이탈률 계산 (단일 페이지뷰 세션 비율)
      }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, limit);

    return sorted.length > 0 ? sorted : generateMockTopPages(limit);
  } catch (error) {
    console.error('[Analytics] getTopPages error:', error);
    return generateMockTopPages(limit);
  }
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

  try {
    const supabase = createServiceRoleClient();

    // feature_use 이벤트 집계
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_data, clerk_user_id')
      .eq('event_type', 'feature_use')
      .gte('created_at', `${startDate}T00:00:00Z`)
      .lte('created_at', `${endDate}T23:59:59Z`);

    if (error) throw error;

    // 기능별 집계
    const featureMap = new Map<
      string,
      { featureName: string; usageCount: number; users: Set<string> }
    >();

    for (const row of data || []) {
      const eventData = row.event_data as { feature_id?: string; feature_name?: string };
      const featureId = eventData?.feature_id || 'unknown';
      const featureName = eventData?.feature_name || featureId;

      const existing = featureMap.get(featureId) || {
        featureName,
        usageCount: 0,
        users: new Set<string>(),
      };
      existing.usageCount++;
      if (row.clerk_user_id) existing.users.add(row.clerk_user_id);
      featureMap.set(featureId, existing);
    }

    // 정렬 및 상위 N개 추출
    const sorted = Array.from(featureMap.entries())
      .map(([featureId, stats]) => ({
        featureId,
        featureName: stats.featureName,
        usageCount: stats.usageCount,
        uniqueUsers: stats.users.size,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);

    return sorted.length > 0 ? sorted : generateMockTopFeatures(limit);
  } catch (error) {
    console.error('[Analytics] getTopFeatures error:', error);
    return generateMockTopFeatures(limit);
  }
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

  try {
    const supabase = createServiceRoleClient();

    // 세션별 디바이스 타입 집계
    const { data, error } = await supabase
      .from('analytics_sessions')
      .select('device_type')
      .gte('started_at', `${startDate}T00:00:00Z`)
      .lte('started_at', `${endDate}T23:59:59Z`)
      .not('device_type', 'is', null);

    if (error) throw error;

    // 디바이스별 집계
    const deviceMap = new Map<DeviceType, number>();
    let total = 0;

    const validDeviceTypes: DeviceType[] = ['mobile', 'tablet', 'desktop'];

    for (const row of data || []) {
      const rawType = row.device_type || 'desktop';
      // 유효한 디바이스 타입인지 확인, 아니면 desktop으로 폴백
      const deviceType: DeviceType = validDeviceTypes.includes(rawType as DeviceType)
        ? (rawType as DeviceType)
        : 'desktop';
      deviceMap.set(deviceType, (deviceMap.get(deviceType) || 0) + 1);
      total++;
    }

    // 비율 계산
    const result: DeviceBreakdown[] = Array.from(deviceMap.entries())
      .map(([deviceType, sessions]) => ({
        deviceType,
        sessions,
        percentage: total > 0 ? Math.round((sessions / total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    return result.length > 0 ? result : generateMockDeviceBreakdown();
  } catch (error) {
    console.error('[Analytics] getDeviceBreakdown error:', error);
    return generateMockDeviceBreakdown();
  }
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

  try {
    const supabase = createServiceRoleClient();

    // 페이지뷰 이벤트를 세션별로 정렬하여 조회
    const { data, error } = await supabase
      .from('analytics_events')
      .select('session_id, page_path, created_at')
      .eq('event_type', 'page_view')
      .gte('created_at', `${startDate}T00:00:00Z`)
      .lte('created_at', `${endDate}T23:59:59Z`)
      .order('session_id')
      .order('created_at');

    if (error) throw error;

    // 세션별 페이지 흐름 추출
    const flowMap = new Map<string, number>();
    let currentSession = '';
    let prevPage = '';

    for (const row of data || []) {
      if (row.session_id !== currentSession) {
        currentSession = row.session_id;
        prevPage = row.page_path || '';
        continue;
      }

      if (prevPage && row.page_path) {
        const flowKey = `${prevPage}|${row.page_path}`;
        flowMap.set(flowKey, (flowMap.get(flowKey) || 0) + 1);
      }
      prevPage = row.page_path || '';
    }

    // 상위 흐름 추출
    const total = Array.from(flowMap.values()).reduce((sum, count) => sum + count, 0);
    const result = Array.from(flowMap.entries())
      .map(([key, count]) => {
        const [fromPage, toPage] = key.split('|');
        return {
          fromPage,
          toPage,
          count,
          percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return result.length > 0 ? result : generateMockUserFlow();
  } catch (error) {
    console.error('[Analytics] getUserFlow error:', error);
    return generateMockUserFlow();
  }
}

/**
 * 실시간 통계 조회
 */
export async function getRealtimeStats(useMock = USE_MOCK): Promise<RealtimeStats> {
  if (useMock) {
    return generateMockRealtimeStats();
  }

  try {
    const supabase = createServiceRoleClient();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // 최근 5분 이벤트 조회
    const [eventsResult, activeSessionsResult] = await Promise.all([
      supabase
        .from('analytics_events')
        .select('page_path, clerk_user_id')
        .eq('event_type', 'page_view')
        .gte('created_at', fiveMinutesAgo),

      supabase
        .from('analytics_sessions')
        .select('id')
        .is('ended_at', null)
        .gte('started_at', fiveMinutesAgo),
    ]);

    const events = eventsResult.data || [];
    const pageViewsLast5Min = events.length;
    const activeUsers = new Set(events.map((e) => e.clerk_user_id).filter(Boolean)).size;

    // 인기 페이지 집계
    const pageCountMap = new Map<string, number>();
    for (const event of events) {
      if (event.page_path) {
        pageCountMap.set(event.page_path, (pageCountMap.get(event.page_path) || 0) + 1);
      }
    }

    const topPagesNow = Array.from(pageCountMap.entries())
      .map(([path, users]) => ({ path, users }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 5);

    return {
      activeUsers: activeUsers || activeSessionsResult.count || 0,
      pageViewsLast5Min,
      topPagesNow,
    };
  } catch (error) {
    console.error('[Analytics] getRealtimeStats error:', error);
    return generateMockRealtimeStats();
  }
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

  try {
    const supabase = createServiceRoleClient();

    // 일별 통계 조회
    const { data, error } = await supabase
      .from('analytics_daily_stats')
      .select('date, metric_type, value, unique_users')
      .in('metric_type', ['page_views', 'sessions'])
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;

    // 날짜별 집계
    const dateMap = new Map<string, { pageViews: number; uniqueUsers: number; sessions: number }>();

    for (const row of data || []) {
      const dateStr = row.date;
      const existing = dateMap.get(dateStr) || { pageViews: 0, uniqueUsers: 0, sessions: 0 };

      if (row.metric_type === 'page_views') {
        existing.pageViews += row.value;
        existing.uniqueUsers = Math.max(existing.uniqueUsers, row.unique_users);
      } else if (row.metric_type === 'sessions') {
        existing.sessions += row.value;
      }

      dateMap.set(dateStr, existing);
    }

    // 날짜 순서로 정렬
    const result = Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        date,
        pageViews: stats.pageViews,
        uniqueUsers: stats.uniqueUsers,
        sessions: stats.sessions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result.length > 0 ? result : generateMockDailyTrend(startDate, endDate);
  } catch (error) {
    console.error('[Analytics] getDailyTrend error:', error);
    return generateMockDailyTrend(startDate, endDate);
  }
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
