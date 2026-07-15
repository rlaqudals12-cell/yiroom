/**
 * 사용자 컨텍스트 수집 (서버 전용)
 * @description AI 코치가 맞춤 조언을 위해 사용하는 사용자 정보
 */

import { isFeatureEnabled } from '@yiroom/shared';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import { calculateBiorhythm } from '@/lib/wellness/biorhythm';
import { getShelfItems } from '@/lib/scan/product-shelf';
import type { UserContext, SkinScores } from './types';

// 타입은 types.ts에서 re-export
export type { UserContext, SkinScores } from './types';
export { summarizeContext } from './types';

/**
 * 사용자 컨텍스트 수집
 * @param clerkUserId - Clerk 사용자 ID
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- context aggregation
export async function getUserContext(clerkUserId: string): Promise<UserContext | null> {
  try {
    const supabase = createClerkSupabaseClient();
    const context: UserContext = {};

    // 주간 날짜 계산
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // W-1 운동·N-1 영양은 숨김 모듈(ADR-098, CLAUDE.md 하드룰). 코치는 뷰티 전속
    // (스타일리스트 ≠ PT)이라 오프차터인 운동·영양 컨텍스트를 조회·주입하지 않는다.
    // 뷰티 유저는 이 6개 테이블에 데이터가 없어 어차피 빈 조회였고(dead read), weeklySummary
    // (#12·#13)는 프롬프트 빌더가 참조조차 안 하는 구조적 dead였다.
    // 삭제가 아니라 플래그 게이팅 — WELLNESS_PHASE2 재활성 시 형제 뷰티 쿼리와 대칭 복원
    // (하드룰: 재노출 대비 코드 유지). fashion RAG(옷장)는 뷰티라 별개로 항상 유지.
    const wellnessEnabled = isFeatureEnabled('WELLNESS_PHASE2');
    const emptySingle = Promise.resolve({ data: null, error: null });
    const emptyCount = Promise.resolve({ count: null, data: null, error: null });

    // 병렬로 데이터 조회
    const [
      personalColorResult,
      skinResult,
      bodyResult,
      hairResult,
      makeupResult,
      workoutAnalysisResult,
      workoutStreakResult,
      nutritionSettingsResult,
      nutritionStreakResult,
      todayWorkoutResult,
      todayNutritionResult,
      weeklyWorkoutResult,
      weeklyNutritionResult,
      skinDiaryResult, // Phase D
      mentalHealthResult, // ADR-089: 바이오리듬
      shelfResult, // 고객 노트: 보유 제품(제품함 owned)
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

      // 헤어 분석
      supabase
        .from('hair_analyses')
        .select('hair_type, scalp_type, overall_score, concerns')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 메이크업 분석
      supabase
        .from('makeup_analyses')
        .select('undertone, face_shape, eye_shape, overall_score, recommendations')
        .eq('clerk_user_id', clerkUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // 운동 분석 (WELLNESS_PHASE2 게이팅)
      wellnessEnabled
        ? supabase
            .from('workout_analyses')
            .select('workout_type, goal, frequency')
            .eq('clerk_user_id', clerkUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : emptySingle,

      // 운동 스트릭 (게이팅)
      wellnessEnabled
        ? supabase
            .from('workout_streaks')
            .select('current_streak')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle()
        : emptySingle,

      // 영양 설정 (게이팅)
      wellnessEnabled
        ? supabase
            .from('nutrition_settings')
            .select('goal, target_calories')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle()
        : emptySingle,

      // 영양 스트릭 (게이팅)
      wellnessEnabled
        ? supabase
            .from('nutrition_streaks')
            .select('current_streak')
            .eq('clerk_user_id', clerkUserId)
            .maybeSingle()
        : emptySingle,

      // 오늘 운동 (게이팅)
      wellnessEnabled
        ? supabase
            .from('workout_logs')
            .select('exercise_name, duration_minutes')
            .eq('clerk_user_id', clerkUserId)
            .gte('completed_at', todayStr)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        : emptySingle,

      // 오늘 영양 (게이팅)
      wellnessEnabled
        ? supabase
            .from('daily_nutrition_summary')
            .select('total_calories, water_ml')
            .eq('clerk_user_id', clerkUserId)
            .eq('date', todayStr)
            .maybeSingle()
        : emptySingle,

      // 주간 운동 횟수 (게이팅 — count 쿼리)
      wellnessEnabled
        ? supabase
            .from('workout_logs')
            .select('id', { count: 'exact', head: true })
            .eq('clerk_user_id', clerkUserId)
            .gte('workout_date', weekAgoStr)
            .lte('workout_date', todayStr)
        : emptyCount,

      // 주간 영양 평균 (게이팅)
      wellnessEnabled
        ? supabase
            .from('daily_nutrition_summary')
            .select('total_calories, protein_g, carbs_g, fat_g')
            .eq('clerk_user_id', clerkUserId)
            .gte('date', weekAgoStr)
            .lte('date', todayStr)
        : emptySingle,

      // Phase D: 피부 일기 최근 7일
      supabase
        .from('skin_diary_entries')
        .select(
          'skin_condition, sleep_hours, water_intake_ml, stress_level, morning_routine_completed, evening_routine_completed'
        )
        .eq('clerk_user_id', clerkUserId)
        .gte('entry_date', weekAgoStr)
        .lte('entry_date', todayStr),

      // ADR-089: 바이오리듬 (오늘 컨디션)
      supabase
        .from('mental_health_logs')
        .select('mood_score, stress_level, sleep_hours, sleep_quality, energy_level')
        .eq('clerk_user_id', clerkUserId)
        .eq('date', todayStr)
        .maybeSingle(),

      // 고객 노트: 보유 제품 상위 5개(브리핑이 쓰는 getShelfItems 재사용).
      // 조회 실패가 5축 컨텍스트 전체를 날리면 안 되므로 빈 결과로 격리.
      getShelfItems(supabase, clerkUserId, { status: 'owned', limit: 5 }).catch(() => ({
        items: [],
      })),
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

      // Phase D: 피부 일기 데이터 추가
      const diaryEntries = skinDiaryResult.data as Array<{
        skin_condition?: number;
        sleep_hours?: number;
        water_intake_ml?: number;
        stress_level?: number;
        morning_routine_completed?: boolean;
        evening_routine_completed?: boolean;
      }> | null;

      if (diaryEntries && diaryEntries.length > 0) {
        const count = diaryEntries.length;

        // 평균 피부 컨디션
        const conditionSum = diaryEntries.reduce((sum, e) => sum + (e.skin_condition || 0), 0);
        const validConditions = diaryEntries.filter((e) => e.skin_condition).length;
        if (validConditions > 0) {
          context.skinAnalysis.recentCondition =
            Math.round((conditionSum / validConditions) * 10) / 10;
        }

        // 루틴 완료율
        const morningCompleted = diaryEntries.filter((e) => e.morning_routine_completed).length;
        const eveningCompleted = diaryEntries.filter((e) => e.evening_routine_completed).length;
        context.skinAnalysis.routineCompletionRate = {
          morning: Math.round((morningCompleted / count) * 100),
          evening: Math.round((eveningCompleted / count) * 100),
        };

        // 생활 요인 평균
        const sleepSum = diaryEntries.reduce((sum, e) => sum + (e.sleep_hours || 0), 0);
        const waterSum = diaryEntries.reduce((sum, e) => sum + (e.water_intake_ml || 0), 0);
        const stressSum = diaryEntries.reduce((sum, e) => sum + (e.stress_level || 0), 0);
        const validSleep = diaryEntries.filter((e) => e.sleep_hours).length;
        const validWater = diaryEntries.filter((e) => e.water_intake_ml).length;
        const validStress = diaryEntries.filter((e) => e.stress_level).length;

        context.skinAnalysis.recentFactors = {};
        if (validSleep > 0) {
          context.skinAnalysis.recentFactors.avgSleep =
            Math.round((sleepSum / validSleep) * 10) / 10;
        }
        if (validWater > 0) {
          context.skinAnalysis.recentFactors.avgWater = Math.round(waterSum / validWater);
        }
        if (validStress > 0) {
          context.skinAnalysis.recentFactors.avgStress =
            Math.round((stressSum / validStress) * 10) / 10;
        }
      }
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

    // 헤어 분석
    if (hairResult.data) {
      context.hairAnalysis = {
        hairType: hairResult.data.hair_type || '알 수 없음',
        scalpType: hairResult.data.scalp_type || '알 수 없음',
        overallScore: hairResult.data.overall_score || 0,
        concerns: hairResult.data.concerns as string[] | undefined,
      };
    }

    // 메이크업 분석
    if (makeupResult.data) {
      const recommendations = makeupResult.data.recommendations as {
        styles?: string[];
      } | null;
      context.makeupAnalysis = {
        undertone: makeupResult.data.undertone || '알 수 없음',
        faceShape: makeupResult.data.face_shape || '알 수 없음',
        eyeShape: makeupResult.data.eye_shape,
        overallScore: makeupResult.data.overall_score || 0,
        recommendedStyles: recommendations?.styles,
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

    // 주간 요약
    const weeklyWorkoutCount = weeklyWorkoutResult.count || 0;
    const weeklyNutritionData = weeklyNutritionResult.data as Array<{
      total_calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
    }> | null;

    if (weeklyWorkoutCount > 0 || (weeklyNutritionData && weeklyNutritionData.length > 0)) {
      context.weeklySummary = {};

      if (weeklyWorkoutCount > 0) {
        context.weeklySummary.workoutCount = weeklyWorkoutCount;
      }

      if (weeklyNutritionData && weeklyNutritionData.length > 0) {
        const count = weeklyNutritionData.length;
        const totals = weeklyNutritionData.reduce(
          (acc, day) => ({
            calories: acc.calories + (day.total_calories || 0),
            protein: acc.protein + (day.protein_g || 0),
            carbs: acc.carbs + (day.carbs_g || 0),
            fat: acc.fat + (day.fat_g || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        context.weeklySummary.avgCalories = Math.round(totals.calories / count);
        context.weeklySummary.avgProtein = Math.round(totals.protein / count);
        context.weeklySummary.avgCarbs = Math.round(totals.carbs / count);
        context.weeklySummary.avgFat = Math.round(totals.fat / count);
      }
    }

    // ADR-089: 바이오리듬
    const mentalData = mentalHealthResult.data as {
      mood_score?: number;
      stress_level?: number;
      sleep_hours?: number;
      sleep_quality?: number;
      energy_level?: number;
    } | null;

    if (mentalData) {
      const biorhythm = calculateBiorhythm({
        sleepHours: mentalData.sleep_hours ?? 7,
        sleepQuality: mentalData.sleep_quality ?? 3,
        stressLevel: mentalData.stress_level ?? 5,
        energyLevel: mentalData.energy_level ?? 3,
        moodScore: mentalData.mood_score ?? 3,
      });

      context.biorhythm = {
        totalScore: biorhythm.totalScore,
        modifier: biorhythm.modifier,
        sleepScore: biorhythm.breakdown.sleep,
        stressScore: biorhythm.breakdown.stress,
        energyScore: biorhythm.breakdown.energy,
        moodScore: biorhythm.breakdown.mood,
        cyclePhase: biorhythm.cyclePhase,
        topInsight: biorhythm.insights[0]?.message,
      };
    }

    // 고객 노트: 보유 제품 (owned-first 답변 근거). 비었으면 미주입(지어내지 않음).
    const shelfItems = (shelfResult as { items?: Array<Record<string, unknown>> }).items ?? [];
    if (shelfItems.length > 0) {
      context.ownedProducts = shelfItems.map((item) => {
        const owned: NonNullable<UserContext['ownedProducts']>[number] = {
          name: String(item.productName ?? ''),
        };
        if (item.productBrand) owned.brand = String(item.productBrand);
        if (typeof item.rating === 'number') owned.rating = item.rating;
        if (typeof item.compatibilityScore === 'number') {
          owned.compatibilityScore = item.compatibilityScore;
        }
        return owned;
      });
    }

    // 컨텍스트가 비어있으면 null 반환
    if (Object.keys(context).length === 0) {
      return null;
    }

    return context;
  } catch (error) {
    coachLogger.error('컨텍스트 조회 오류:', error);
    return null;
  }
}
