import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 익명 커뮤니티 통계 조회
 * GET /api/community/stats?date=YYYY-MM-DD
 *
 * 인증 불필요 - 익명 통계
 * "오늘 123명이 식단 기록" 같은 표시용
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // 날짜 결정 (기본: 오늘)
    let targetDate: string;
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      targetDate = dateParam;
    } else {
      // 한국 시간 기준 오늘
      const now = new Date();
      const koreaOffset = 9 * 60;
      const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
      targetDate = koreaTime.toISOString().split('T')[0];
    }

    const supabase = createServiceRoleClient();

    // 캐시된 통계 조회
    const { data: cachedStats, error: cacheError } = await supabase
      .from('daily_community_stats')
      .select('*')
      .eq('stat_date', targetDate)
      .single();

    if (!cacheError && cachedStats) {
      // 캐시 히트
      return NextResponse.json({
        date: targetDate,
        stats: {
          mealRecords: cachedStats.meal_records_count,
          waterRecords: cachedStats.water_records_count,
          workoutRecords: cachedStats.workout_records_count,
          checkins: cachedStats.checkin_count,
          activeUsers: cachedStats.active_users_count,
        },
        cached: true,
        updatedAt: cachedStats.updated_at,
      });
    }

    // 캐시 미스 - 실시간 집계 (읽기 전용)
    const [mealResult, waterResult, workoutResult, checkinResult, activeUsersResult] =
      await Promise.all([
        supabase
          .from('meal_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
        supabase
          .from('water_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
        supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('activity_type', 'checkin')
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
        // 활성 사용자 수 (activity_logs 기반)
        supabase
          .from('activity_logs')
          .select('clerk_user_id')
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
      ]);

    // 고유 사용자 수 계산
    const uniqueUsers = new Set(activeUsersResult.data?.map((r) => r.clerk_user_id) || []);

    const stats = {
      mealRecords: mealResult.count || 0,
      waterRecords: waterResult.count || 0,
      workoutRecords: workoutResult.count || 0,
      checkins: checkinResult.count || 0,
      activeUsers: uniqueUsers.size,
    };

    return NextResponse.json({
      date: targetDate,
      stats,
      cached: false,
    });
  } catch (error) {
    console.error('[CommunityStats] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
