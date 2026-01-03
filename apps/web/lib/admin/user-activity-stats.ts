/**
 * 사용자 활동 통계 (DAU/WAU/MAU)
 * @description 관리자 대시보드용 사용자 활동 분석
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 활성 사용자 통계 타입
 */
export interface ActiveUserStats {
  dau: number; // Daily Active Users
  wau: number; // Weekly Active Users
  mau: number; // Monthly Active Users
  dauChange: number; // 전일 대비 변화율 (%)
  wauChange: number; // 전주 대비 변화율 (%)
  mauChange: number; // 전월 대비 변화율 (%)
}

/**
 * 기능별 사용 현황 타입
 */
export interface FeatureUsageStats {
  personalColorAnalyses: number;
  skinAnalyses: number;
  bodyAnalyses: number;
  workoutLogs: number;
  mealRecords: number;
  changes: {
    personalColor: number;
    skin: number;
    body: number;
    workout: number;
    meal: number;
  };
}

/**
 * 일별 활성 사용자 추이 데이터
 */
export interface DailyActiveUserTrend {
  date: string;
  activeUsers: number;
}

/**
 * 기능별 일별 사용량 추이 데이터
 */
export interface DailyFeatureUsageTrend {
  date: string;
  personalColor: number;
  skin: number;
  body: number;
  workout: number;
  meal: number;
}

function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function getActiveUsersCount(startDate: Date, endDate: Date): Promise<number> {
  const supabase = createServiceRoleClient();

  const [workoutResult, mealResult] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('clerk_user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
    supabase
      .from('meal_records')
      .select('clerk_user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
  ]);

  const uniqueUsers = new Set<string>();
  workoutResult.data?.forEach((row) => {
    if (row.clerk_user_id) uniqueUsers.add(row.clerk_user_id);
  });
  mealResult.data?.forEach((row) => {
    if (row.clerk_user_id) uniqueUsers.add(row.clerk_user_id);
  });

  return uniqueUsers.size;
}

export async function getActiveUserStats(): Promise<ActiveUserStats> {
  try {
    const todayRange = getTodayRange();
    const weekRange = getDateRange(7);
    const monthRange = getDateRange(30);

    const yesterdayStart = new Date(todayRange.start);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayRange.start);
    yesterdayEnd.setMilliseconds(-1);

    const prevWeekStart = new Date(weekRange.start);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekRange.start);
    prevWeekEnd.setMilliseconds(-1);

    const prevMonthStart = new Date(monthRange.start);
    prevMonthStart.setDate(prevMonthStart.getDate() - 30);
    const prevMonthEnd = new Date(monthRange.start);
    prevMonthEnd.setMilliseconds(-1);

    const [dau, wau, mau, prevDau, prevWau, prevMau] = await Promise.all([
      getActiveUsersCount(todayRange.start, todayRange.end),
      getActiveUsersCount(weekRange.start, weekRange.end),
      getActiveUsersCount(monthRange.start, monthRange.end),
      getActiveUsersCount(yesterdayStart, yesterdayEnd),
      getActiveUsersCount(prevWeekStart, prevWeekEnd),
      getActiveUsersCount(prevMonthStart, prevMonthEnd),
    ]);

    return {
      dau,
      wau,
      mau,
      dauChange: calculateChange(dau, prevDau),
      wauChange: calculateChange(wau, prevWau),
      mauChange: calculateChange(mau, prevMau),
    };
  } catch (error) {
    console.error('[Admin] getActiveUserStats error:', error);
    return { dau: 0, wau: 0, mau: 0, dauChange: 0, wauChange: 0, mauChange: 0 };
  }
}

export async function getFeatureUsageStats(): Promise<FeatureUsageStats> {
  try {
    const supabase = createServiceRoleClient();
    const todayRange = getTodayRange();
    const yesterdayStart = new Date(todayRange.start);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      pcTotal,
      skinTotal,
      bodyTotal,
      workoutTotal,
      mealTotal,
      pcToday,
      skinToday,
      bodyToday,
      workoutToday,
      mealToday,
      pcYesterday,
      skinYesterday,
      bodyYesterday,
      workoutYesterday,
      mealYesterday,
    ] = await Promise.all([
      supabase.from('personal_color_assessments').select('id', { count: 'exact', head: true }),
      supabase.from('skin_analyses').select('id', { count: 'exact', head: true }),
      supabase.from('body_analyses').select('id', { count: 'exact', head: true }),
      supabase.from('workout_logs').select('id', { count: 'exact', head: true }),
      supabase.from('meal_records').select('id', { count: 'exact', head: true }),
      supabase
        .from('personal_color_assessments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayRange.start.toISOString()),
      supabase
        .from('skin_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayRange.start.toISOString()),
      supabase
        .from('body_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayRange.start.toISOString()),
      supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayRange.start.toISOString()),
      supabase
        .from('meal_records')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayRange.start.toISOString()),
      supabase
        .from('personal_color_assessments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayRange.start.toISOString()),
      supabase
        .from('skin_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayRange.start.toISOString()),
      supabase
        .from('body_analyses')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayRange.start.toISOString()),
      supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayRange.start.toISOString()),
      supabase
        .from('meal_records')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayRange.start.toISOString()),
    ]);

    return {
      personalColorAnalyses: pcTotal.count ?? 0,
      skinAnalyses: skinTotal.count ?? 0,
      bodyAnalyses: bodyTotal.count ?? 0,
      workoutLogs: workoutTotal.count ?? 0,
      mealRecords: mealTotal.count ?? 0,
      changes: {
        personalColor: calculateChange(pcToday.count ?? 0, pcYesterday.count ?? 0),
        skin: calculateChange(skinToday.count ?? 0, skinYesterday.count ?? 0),
        body: calculateChange(bodyToday.count ?? 0, bodyYesterday.count ?? 0),
        workout: calculateChange(workoutToday.count ?? 0, workoutYesterday.count ?? 0),
        meal: calculateChange(mealToday.count ?? 0, mealYesterday.count ?? 0),
      },
    };
  } catch (error) {
    console.error('[Admin] getFeatureUsageStats error:', error);
    return {
      personalColorAnalyses: 0,
      skinAnalyses: 0,
      bodyAnalyses: 0,
      workoutLogs: 0,
      mealRecords: 0,
      changes: { personalColor: 0, skin: 0, body: 0, workout: 0, meal: 0 },
    };
  }
}

export async function getDailyActiveUserTrend(days: number = 14): Promise<DailyActiveUserTrend[]> {
  try {
    const supabase = createServiceRoleClient();
    const result: DailyActiveUserTrend[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [workoutResult, mealResult] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('clerk_user_id')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('meal_records')
          .select('clerk_user_id')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
      ]);

      const uniqueUsers = new Set<string>();
      workoutResult.data?.forEach((row) => {
        if (row.clerk_user_id) uniqueUsers.add(row.clerk_user_id);
      });
      mealResult.data?.forEach((row) => {
        if (row.clerk_user_id) uniqueUsers.add(row.clerk_user_id);
      });

      result.push({ date: dateStr, activeUsers: uniqueUsers.size });
    }

    return result;
  } catch (error) {
    console.error('[Admin] getDailyActiveUserTrend error:', error);
    return [];
  }
}

export async function getDailyFeatureUsageTrend(
  days: number = 14
): Promise<DailyFeatureUsageTrend[]> {
  try {
    const supabase = createServiceRoleClient();
    const result: DailyFeatureUsageTrend[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [pcResult, skinResult, bodyResult, workoutResult, mealResult] = await Promise.all([
        supabase
          .from('personal_color_assessments')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('skin_analyses')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('body_analyses')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('workout_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase
          .from('meal_records')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
      ]);

      result.push({
        date: dateStr,
        personalColor: pcResult.count ?? 0,
        skin: skinResult.count ?? 0,
        body: bodyResult.count ?? 0,
        workout: workoutResult.count ?? 0,
        meal: mealResult.count ?? 0,
      });
    }

    return result;
  } catch (error) {
    console.error('[Admin] getDailyFeatureUsageTrend error:', error);
    return [];
  }
}
