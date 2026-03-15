/**
 * 사용자 데이터 내보내기 API
 * GDPR 준수 및 사용자 데이터 포터빌리티
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

interface ExportData {
  exportedAt: string;
  user: {
    clerkUserId: string;
    email?: string;
  };
  personalColor?: unknown;
  skinAnalyses?: unknown[];
  bodyAnalyses?: unknown[];
  hairAnalyses?: unknown[];
  makeupAnalyses?: unknown[];
  oralHealthAssessments?: unknown[];
  workoutPlans?: unknown[];
  workoutLogs?: unknown[];
  mealRecords?: unknown[];
  waterRecords?: unknown[];
  nutritionSummaries?: unknown[];
  wellnessScores?: unknown[];
  badges?: unknown[];
  wishlists?: unknown[];
  inventory?: unknown[];
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();

    // 병렬로 모든 사용자 데이터 조회
    const [
      personalColorResult,
      skinResult,
      bodyResult,
      hairResult,
      makeupResult,
      oralHealthResult,
      workoutPlansResult,
      workoutLogsResult,
      mealRecordsResult,
      waterRecordsResult,
      nutritionSummaryResult,
      wellnessResult,
      badgesResult,
      wishlistResult,
      inventoryResult,
    ] = await Promise.all([
      supabase
        .from('personal_color_assessments')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('skin_analyses')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('body_analyses')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('hair_analyses')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('makeup_analyses')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('oral_health_assessments')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('workout_plans')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('workout_logs')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('completed_at', { ascending: false }),
      supabase
        .from('meal_records')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('logged_at', { ascending: false }),
      supabase
        .from('water_records')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('logged_at', { ascending: false }),
      supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('wellness_scores')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('user_badges')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('earned_at', { ascending: false }),
      supabase
        .from('user_wishlists')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_inventory')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      user: {
        clerkUserId: userId,
      },
      personalColor: personalColorResult.data,
      skinAnalyses: skinResult.data || [],
      bodyAnalyses: bodyResult.data || [],
      hairAnalyses: hairResult.data || [],
      makeupAnalyses: makeupResult.data || [],
      oralHealthAssessments: oralHealthResult.data || [],
      workoutPlans: workoutPlansResult.data || [],
      workoutLogs: workoutLogsResult.data || [],
      mealRecords: mealRecordsResult.data || [],
      waterRecords: waterRecordsResult.data || [],
      nutritionSummaries: nutritionSummaryResult.data || [],
      wellnessScores: wellnessResult.data || [],
      badges: badgesResult.data || [],
      wishlists: wishlistResult.data || [],
      inventory: inventoryResult.data || [],
    };

    // JSON 파일로 다운로드
    const filename = `yiroom-data-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[Export] Error exporting data:', error);
    return NextResponse.json({ error: '데이터 내보내기에 실패했습니다.' }, { status: 500 });
  }
}
