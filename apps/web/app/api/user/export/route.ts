/**
 * 사용자 데이터 내보내기 API
 * POST /api/user/export
 *
 * GDPR Art.20 데이터 이동권 준수
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { UserExportData, ExportResponse } from '@/types/user-data';

export async function POST() {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 2. Supabase 클라이언트
    const supabase = await createClerkSupabaseClient();

    // 3. 병렬로 모든 데이터 조회
    const [
      userResult,
      pcResult,
      skinResult,
      bodyResult,
      workoutAnalysisResult,
      workoutLogsResult,
      mealResult,
      waterResult,
      friendsResult,
      badgesResult,
      levelResult,
      wellnessResult,
      nutritionResult,
      wishlistResult,
    ] = await Promise.all([
      // 기본 정보
      supabase.from('users').select('*').eq('clerk_user_id', userId).single(),
      // 분석 결과
      supabase.from('personal_color_assessments').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('skin_analyses').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('body_analyses').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('workout_analyses').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
      // 기록
      supabase.from('workout_logs').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }),
      supabase.from('meal_records').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }),
      supabase.from('water_records').select('*').eq('clerk_user_id', userId).order('created_at', { ascending: false }),
      // 소셜
      supabase.from('friendships').select('*').eq('user_id', userId),
      supabase.from('user_badges').select('*').eq('clerk_user_id', userId),
      supabase.from('user_levels').select('*').eq('clerk_user_id', userId).single(),
      supabase.from('wellness_scores').select('*').eq('clerk_user_id', userId).order('date', { ascending: false }),
      // 설정
      supabase.from('nutrition_settings').select('*').eq('clerk_user_id', userId).single(),
      supabase.from('user_wishlists').select('*').eq('clerk_user_id', userId),
    ]);

    // 4. 데이터 구조화
    const exportData: UserExportData = {
      user: {
        id: userId,
        email: userResult.data?.email || '',
        name: userResult.data?.name || null,
        createdAt: userResult.data?.created_at || new Date().toISOString(),
      },
      analyses: {
        personalColor: pcResult.data ? {
          season: pcResult.data.season || '',
          subtype: pcResult.data.subtype || '',
          analyzedAt: pcResult.data.created_at || '',
        } : null,
        skin: skinResult.data ? {
          skinType: skinResult.data.skin_type || '',
          concerns: skinResult.data.concerns || [],
          analyzedAt: skinResult.data.created_at || '',
        } : null,
        body: bodyResult.data ? {
          bodyType: bodyResult.data.body_type || '',
          analyzedAt: bodyResult.data.created_at || '',
        } : null,
        workout: workoutAnalysisResult.data ? {
          fitnessLevel: workoutAnalysisResult.data.fitness_level || '',
          goals: workoutAnalysisResult.data.goals || [],
          analyzedAt: workoutAnalysisResult.data.created_at || '',
        } : null,
      },
      records: {
        workoutLogs: (workoutLogsResult.data || []).map((log) => ({
          id: log.id,
          exerciseId: log.exercise_id || '',
          duration: log.duration || 0,
          completedAt: log.created_at || '',
        })),
        mealRecords: (mealResult.data || []).map((meal) => ({
          id: meal.id,
          mealType: meal.meal_type || '',
          calories: meal.calories || 0,
          recordedAt: meal.created_at || '',
        })),
        waterRecords: (waterResult.data || []).map((water) => ({
          id: water.id,
          amount: water.amount || 0,
          recordedAt: water.created_at || '',
        })),
      },
      social: {
        friends: (friendsResult.data || []).map((f) => ({
          friendId: f.friend_id || '',
          friendName: f.friend_name || '',
          since: f.created_at || '',
        })),
        badges: (badgesResult.data || []).map((b) => ({
          id: b.id,
          name: b.badge_id || '',
          earnedAt: b.earned_at || '',
        })),
        level: levelResult.data ? {
          level: levelResult.data.level || 1,
          exp: levelResult.data.exp || 0,
        } : null,
        wellnessScores: (wellnessResult.data || []).map((w) => ({
          date: w.date || '',
          score: w.total_score || 0,
        })),
      },
      preferences: {
        nutritionSettings: nutritionResult.data ? {
          dailyCalorieGoal: nutritionResult.data.daily_calorie_goal || 2000,
          dailyWaterGoal: nutritionResult.data.daily_water_goal || 2000,
        } : null,
        wishlists: (wishlistResult.data || []).map((w) => ({
          productId: w.product_id || '',
          productName: w.product_name || '',
          addedAt: w.created_at || '',
        })),
      },
    };

    // 5. 응답 생성
    const response: ExportResponse = {
      success: true,
      data: exportData,
      exportedAt: new Date().toISOString(),
      format: 'json',
    };

    // Content-Disposition으로 다운로드 유도
    return new NextResponse(JSON.stringify(response, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="yiroom-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('[USER-EXPORT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'EXPORT_FAILED', message: '데이터 내보내기에 실패했습니다.' },
      { status: 500 }
    );
  }
}
