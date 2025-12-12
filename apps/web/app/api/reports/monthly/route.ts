/**
 * R-1 월간 리포트 API
 * Task R-2.2: 월간 리포트 API
 *
 * GET /api/reports/monthly?month=YYYY-MM
 * - 해당 월의 영양/운동 리포트 반환
 * - month 미지정 시 이번 달 리포트
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generateMonthlyReport,
  getMonthRangeFromYYYYMM,
} from '@/lib/reports/monthlyAggregator';
import { DEFAULT_NUTRITION_TARGETS } from '@/lib/reports/weeklyAggregator';
import type {
  RawMealRecord,
  RawWaterRecord,
  RawWorkoutLog,
  RawNutritionSettings,
  ReportStreakStatus,
  MonthlyReportResponse,
} from '@/types/report';

/**
 * YYYY-MM 형식 검증
 */
function isValidMonthFormat(monthStr: string): boolean {
  return /^\d{4}-\d{2}$/.test(monthStr);
}

/**
 * 현재 월 반환 (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 스트릭 데이터를 ReportStreakStatus로 변환
 */
function convertToReportStreakStatus(
  streakData: { currentStreak: number; longestStreak: number } | null,
  achievedMilestones: number[]
): ReportStreakStatus {
  const current = streakData?.currentStreak || 0;
  const longest = streakData?.longestStreak || 0;

  const milestones = [3, 7, 14, 30, 60, 100];
  const milestone = milestones.find(m => current >= m && !achievedMilestones.includes(m)) || null;

  return {
    current,
    longest,
    milestone,
    message: current > 0 ? `${current}일 연속 기록 중!` : '오늘 기록을 시작해보세요!',
  };
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json<MonthlyReportResponse>(
        { success: false, error: 'Unauthorized', hasData: false },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 month 추출
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');

    let month: string;

    if (monthParam) {
      if (!isValidMonthFormat(monthParam)) {
        return NextResponse.json<MonthlyReportResponse>(
          { success: false, error: 'Invalid month format. Use YYYY-MM', hasData: false },
          { status: 400 }
        );
      }
      month = monthParam;
    } else {
      month = getCurrentMonth();
    }

    const { monthStart, monthEnd } = getMonthRangeFromYYYYMM(month);

    const supabase = createServiceRoleClient();

    // 병렬로 데이터 조회
    const [
      mealsResult,
      waterResult,
      workoutResult,
      settingsResult,
      nutritionStreakResult,
      workoutStreakResult,
      bodyAnalysisResult,
    ] = await Promise.all([
      // 식사 기록 조회
      supabase
        .from('meal_records')
        .select('id, clerk_user_id, meal_date, meal_type, foods, total_calories, total_protein, total_carbs, total_fat, created_at')
        .eq('clerk_user_id', userId)
        .gte('meal_date', monthStart)
        .lte('meal_date', monthEnd)
        .order('meal_date', { ascending: true }),

      // 수분 기록 조회
      supabase
        .from('water_records')
        .select('id, clerk_user_id, record_date, amount_ml, effective_ml, drink_type')
        .eq('clerk_user_id', userId)
        .gte('record_date', monthStart)
        .lte('record_date', monthEnd),

      // 운동 기록 조회
      supabase
        .from('workout_logs')
        .select('id, user_id, workout_date, exercise_logs, actual_duration, actual_calories, completed_at')
        .eq('user_id', userId)
        .gte('workout_date', monthStart)
        .lte('workout_date', monthEnd),

      // 영양 설정 조회
      supabase
        .from('nutrition_settings')
        .select('goal, daily_calories, daily_protein, daily_carbs, daily_fat, daily_water')
        .eq('clerk_user_id', userId)
        .single(),

      // 영양 스트릭 조회
      supabase
        .from('nutrition_streaks')
        .select('current_streak, longest_streak, last_record_date, badges_earned')
        .eq('clerk_user_id', userId)
        .single(),

      // 운동 스트릭 조회
      supabase
        .from('workout_streaks')
        .select('current_streak, longest_streak, last_workout_date, badges_earned')
        .eq('user_id', userId)
        .single(),

      // 체형 분석 조회 (월 시작/종료 시점)
      supabase
        .from('body_analyses')
        .select('user_input, created_at')
        .eq('clerk_user_id', userId)
        .gte('created_at', `${monthStart}T00:00:00`)
        .lte('created_at', `${monthEnd}T23:59:59`)
        .order('created_at', { ascending: true }),
    ]);

    // 에러 처리
    if (mealsResult.error && mealsResult.error.code !== 'PGRST116') {
      console.error('[R-1] Monthly report meals fetch error:', mealsResult.error);
      return NextResponse.json<MonthlyReportResponse>(
        { success: false, error: 'Failed to fetch meal records', hasData: false },
        { status: 500 }
      );
    }

    // 데이터 변환
    const meals: RawMealRecord[] = (mealsResult.data || []).map(m => ({
      id: m.id,
      clerk_user_id: m.clerk_user_id,
      meal_date: m.meal_date,
      meal_type: m.meal_type,
      foods: (m.foods || []) as Array<{
        food_name: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        traffic_light: 'green' | 'yellow' | 'red';
      }>,
      total_calories: m.total_calories || 0,
      total_protein: m.total_protein || 0,
      total_carbs: m.total_carbs || 0,
      total_fat: m.total_fat || 0,
      created_at: m.created_at,
    }));

    const waterRecords: RawWaterRecord[] = (waterResult.data || []).map(w => ({
      id: w.id,
      clerk_user_id: w.clerk_user_id,
      record_date: w.record_date,
      amount_ml: w.amount_ml || 0,
      effective_ml: w.effective_ml || w.amount_ml || 0,
      drink_type: w.drink_type || 'water',
    }));

    const workoutLogs: RawWorkoutLog[] = (workoutResult.data || []).map(w => ({
      id: w.id,
      clerk_user_id: w.user_id,
      session_date: w.workout_date,
      workout_type: '', // exercise_logs에서 추출 필요 시 별도 처리
      duration: w.actual_duration || 0,
      calories_burned: w.actual_calories || 0,
      completed_at: w.completed_at,
    }));

    // 설정 데이터
    const settings: RawNutritionSettings | null = settingsResult.data
      ? {
          goal: settingsResult.data.goal || 'maintain',
          daily_calories: settingsResult.data.daily_calories || DEFAULT_NUTRITION_TARGETS.calories,
          daily_protein: settingsResult.data.daily_protein || DEFAULT_NUTRITION_TARGETS.protein,
          daily_carbs: settingsResult.data.daily_carbs || DEFAULT_NUTRITION_TARGETS.carbs,
          daily_fat: settingsResult.data.daily_fat || DEFAULT_NUTRITION_TARGETS.fat,
          daily_water: settingsResult.data.daily_water || DEFAULT_NUTRITION_TARGETS.water,
        }
      : null;

    // 스트릭 데이터
    const nutritionStreakData = nutritionStreakResult.data
      ? {
          currentStreak: nutritionStreakResult.data.current_streak || 0,
          longestStreak: nutritionStreakResult.data.longest_streak || 0,
        }
      : null;

    const previousBadges = (nutritionStreakResult.data?.badges_earned || []) as string[];
    const achievedMilestones = previousBadges
      .map(badge => parseInt(badge.replace('day', ''), 10))
      .filter(n => !isNaN(n));

    const nutritionStreak = convertToReportStreakStatus(nutritionStreakData, achievedMilestones);

    // 운동 스트릭 조회 결과 처리
    const workoutStreakData = workoutStreakResult.data
      ? {
          currentStreak: workoutStreakResult.data.current_streak || 0,
          longestStreak: workoutStreakResult.data.longest_streak || 0,
        }
      : null;

    const workoutBadges = (workoutStreakResult.data?.badges_earned || []) as string[];
    const workoutAchievedMilestones = workoutBadges
      .map(badge => parseInt(badge.replace('day', ''), 10))
      .filter(n => !isNaN(n));

    const workoutStreak = convertToReportStreakStatus(workoutStreakData, workoutAchievedMilestones);

    // 체형 분석 데이터 (월 시작/종료 시점의 체중)
    const bodyAnalyses = bodyAnalysisResult.data || [];
    interface BodyAnalysisRow {
      user_input: { weight?: number } | null;
      created_at: string;
    }
    const bodyAnalysisStart = bodyAnalyses.length > 0
      ? { weight: ((bodyAnalyses[0] as BodyAnalysisRow).user_input?.weight || 0) }
      : null;
    const bodyAnalysisEnd = bodyAnalyses.length > 1
      ? { weight: ((bodyAnalyses[bodyAnalyses.length - 1] as BodyAnalysisRow).user_input?.weight || 0) }
      : bodyAnalysisStart;

    // 데이터 존재 여부 확인
    const hasData = meals.length > 0 || waterRecords.length > 0;

    if (!hasData) {
      return NextResponse.json<MonthlyReportResponse>({
        success: true,
        hasData: false,
        data: undefined,
      });
    }

    // 월간 리포트 생성
    const report = generateMonthlyReport({
      month,
      meals,
      waterRecords,
      workoutLogs,
      settings,
      nutritionStreak,
      workoutStreak,
      bodyAnalysisStart,
      bodyAnalysisEnd,
    });

    return NextResponse.json<MonthlyReportResponse>({
      success: true,
      hasData: true,
      data: report,
    });
  } catch (error) {
    console.error('[R-1] Monthly report error:', error);
    return NextResponse.json<MonthlyReportResponse>(
      { success: false, error: 'Internal server error', hasData: false },
      { status: 500 }
    );
  }
}
