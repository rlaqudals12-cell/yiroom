import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 일일 커뮤니티 통계 캐시 업데이트
 * POST /api/cron/community-stats
 *
 * Vercel Cron: 매일 자정 (0 0 * * *)
 */
export async function POST(req: Request) {
  try {
    // Cron 인증 (Vercel Cron 시크릿)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // 한국 시간 기준 오늘
    const now = new Date();
    const koreaOffset = 9 * 60;
    const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
    const today = koreaTime.toISOString().split('T')[0];

    // 실시간 집계
    const [mealResult, waterResult, workoutResult, checkinResult, activeUsersResult] =
      await Promise.all([
        supabase
          .from('meal_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        supabase
          .from('water_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('activity_type', 'checkin')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
        supabase
          .from('activity_logs')
          .select('clerk_user_id')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`),
      ]);

    // 고유 사용자 수 계산
    const uniqueUsers = new Set(activeUsersResult.data?.map((r) => r.clerk_user_id) || []);

    // Upsert 통계
    const { error: upsertError } = await supabase.from('daily_community_stats').upsert(
      {
        stat_date: today,
        meal_records_count: mealResult.count || 0,
        water_records_count: waterResult.count || 0,
        workout_records_count: workoutResult.count || 0,
        checkin_count: checkinResult.count || 0,
        active_users_count: uniqueUsers.size,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'stat_date' }
    );

    if (upsertError) {
      console.error('[CommunityStats Cron] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
    }

    console.log('[CommunityStats Cron] Updated stats for', today);

    return NextResponse.json({
      success: true,
      date: today,
      stats: {
        mealRecords: mealResult.count || 0,
        waterRecords: waterResult.count || 0,
        workoutRecords: workoutResult.count || 0,
        checkins: checkinResult.count || 0,
        activeUsers: uniqueUsers.size,
      },
    });
  } catch (error) {
    console.error('[CommunityStats Cron] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET 지원 (Vercel Cron은 GET도 지원)
export async function GET(req: Request) {
  return POST(req);
}
