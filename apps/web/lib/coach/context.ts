/**
 * 사용자 컨텍스트 수집 (서버 전용)
 * @description AI 코치가 맞춤 조언을 위해 사용하는 사용자 정보
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { UserContext, SkinScores } from './types';

// 타입은 types.ts에서 re-export
export type { UserContext, SkinScores } from './types';
export { summarizeContext } from './types';

/**
 * 사용자 컨텍스트 수집
 * @param clerkUserId - Clerk 사용자 ID
 */
export async function getUserContext(clerkUserId: string): Promise<UserContext | null> {
  try {
    const supabase = createClerkSupabaseClient();
    const context: UserContext = {};

    // 병렬로 데이터 조회
    const [
      personalColorResult,
      skinResult,
      bodyResult,
      workoutAnalysisResult,
      workoutStreakResult,
      nutritionSettingsResult,
      nutritionStreakResult,
      todayWorkoutResult,
      todayNutritionResult,
    ] = await Promise.all([
      // 퍼스널 컬러
      supabase
        .from('personal_color_assessments')
        .select('result')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 피부 분석
      supabase
        .from('skin_analyses')
        .select('skin_type, concerns, scores')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 체형 분석
      supabase
        .from('body_analyses')
        .select('body_type, bmi, height, weight')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 운동 분석
      supabase
        .from('workout_analyses')
        .select('workout_type, goal, frequency')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 운동 스트릭
      supabase
        .from('workout_streaks')
        .select('current_streak')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle(),

      // 영양 설정
      supabase
        .from('nutrition_settings')
        .select('goal, target_calories')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle(),

      // 영양 스트릭
      supabase
        .from('nutrition_streaks')
        .select('current_streak')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle(),

      // 오늘 운동
      supabase
        .from('workout_logs')
        .select('exercise_name, duration_minutes')
        .eq('clerk_user_id', clerkUserId)
        .gte('completed_at', new Date().toISOString().split('T')[0])
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 오늘 영양
      supabase
        .from('daily_nutrition_summary')
        .select('total_calories, water_ml')
        .eq('clerk_user_id', clerkUserId)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle(),
    ]);

    // 퍼스널 컬러
    if (personalColorResult.data?.result) {
      const result = personalColorResult.data.result as { season?: string; tone?: string };
      if (result.season) {
        context.personalColor = {
          season: result.season,
          tone: result.tone,
        };
      }
    }

    // 피부 분석
    if (skinResult.data) {
      context.skinAnalysis = {
        skinType: skinResult.data.skin_type || '알 수 없음',
        concerns: skinResult.data.concerns as string[] | undefined,
        scores: skinResult.data.scores as SkinScores | undefined,
      };
    }

    // 체형 분석
    if (bodyResult.data) {
      context.bodyAnalysis = {
        bodyType: bodyResult.data.body_type || '알 수 없음',
        bmi: bodyResult.data.bmi,
        height: bodyResult.data.height,
        weight: bodyResult.data.weight,
      };
    }

    // 운동 정보
    if (workoutAnalysisResult.data || workoutStreakResult.data) {
      context.workout = {
        workoutType: workoutAnalysisResult.data?.workout_type,
        goal: workoutAnalysisResult.data?.goal,
        frequency: workoutAnalysisResult.data?.frequency,
        streak: workoutStreakResult.data?.current_streak,
      };
    }

    // 영양 정보
    if (nutritionSettingsResult.data || nutritionStreakResult.data) {
      context.nutrition = {
        goal: nutritionSettingsResult.data?.goal,
        targetCalories: nutritionSettingsResult.data?.target_calories,
        streak: nutritionStreakResult.data?.current_streak,
      };
    }

    // 최근 활동
    if (todayWorkoutResult.data || todayNutritionResult.data) {
      context.recentActivity = {};
      if (todayWorkoutResult.data) {
        context.recentActivity.todayWorkout = `${todayWorkoutResult.data.exercise_name} (${todayWorkoutResult.data.duration_minutes}분)`;
      }
      if (todayNutritionResult.data) {
        context.recentActivity.todayCalories = todayNutritionResult.data.total_calories;
        context.recentActivity.waterIntake = todayNutritionResult.data.water_ml;
      }
    }

    // 컨텍스트가 비어있으면 null 반환
    if (Object.keys(context).length === 0) {
      return null;
    }

    return context;
  } catch (error) {
    console.error('[Coach] 컨텍스트 조회 오류:', error);
    return null;
  }
}
