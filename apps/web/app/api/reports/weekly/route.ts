/**
 * R-1 주간 리포트 API
 * Task R-1.3: 주간 리포트 API
 *
 * GET /api/reports/weekly?weekStart=YYYY-MM-DD
 * - 해당 주의 영양/운동 리포트 반환
 * - weekStart 미지정 시 이번 주 리포트
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generateWeeklyReport,
  getWeekStart,
  getWeekEnd,
  DEFAULT_NUTRITION_TARGETS,
} from '@/lib/reports/weeklyAggregator';
import type {
  RawMealRecord,
  RawWaterRecord,
  RawWorkoutLog,
  RawNutritionSettings,
  ReportStreakStatus,
  WeeklyReportResponse,
} from '@/types/report';

/**
 * 날짜 형식 검증 (YYYY-MM-DD)
 */
function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * 스트릭 데이터를 ReportStreakStatus로 변환
 */
function convertToReportStreakStatus(
  streakData: { currentStreak: number; longestStreak: number; } | null,
  achievedMilestones: number[]
): ReportStreakStatus {
  const current = streakData?.currentStreak || 0;
  const longest = streakData?.longestStreak || 0;

  // 기간 내 달성한 마일스톤 확인
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
      return NextResponse.json<WeeklyReportResponse>(
        { success: false, error: 'Unauthorized', hasData: false },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 weekStart 추출
    const { searchParams } = new URL(req.url);
    const weekStartParam = searchParams.get('weekStart');

    let weekStart: string;

    if (weekStartParam) {
      // 날짜 형식 검증
      if (!isValidDateFormat(weekStartParam)) {
        return NextResponse.json<WeeklyReportResponse>(
          { success: false, error: 'Invalid date format. Use YYYY-MM-DD', hasData: false },
          { status: 400 }
        );
      }
      // 주어진 날짜의 주 시작일 계산
      weekStart = getWeekStart(new Date(weekStartParam));
    } else {
      // 이번 주 시작일
      weekStart = getWeekStart();
    }

    const weekEnd = getWeekEnd(weekStart);

    const supabase = createServiceRoleClient();

    // 병렬로 데이터 조회
    const [
      mealsResult,
      waterResult,
      workoutResult,
      settingsResult,
      nutritionStreakResult,
      workoutStreakResult,
    ] = await Promise.all([
      // 식사 기록 조회
      supabase
        .from('meal_records')
        .select('id, clerk_user_id, meal_date, meal_type, foods, total_calories, total_protein, total_carbs, total_fat, created_at')
        .eq('clerk_user_id', userId)
        .gte('meal_date', weekStart)
        .lte('meal_date', weekEnd)
        .order('meal_date', { ascending: true }),

      // 수분 기록 조회
      supabase
        .from('water_records')
        .select('id, clerk_user_id, record_date, amount_ml, effective_ml, drink_type')
        .eq('clerk_user_id', userId)
        .gte('record_date', weekStart)
        .lte('record_date', weekEnd),

      // 운동 기록 조회 (workout_logs 테이블이 있는 경우)
      supabase
        .from('workout_logs')
        .select('id, user_id, workout_date, exercise_logs, actual_duration, actual_calories, completed_at')
        .eq('user_id', userId)
        .gte('workout_date', weekStart)
        .lte('workout_date', weekEnd),

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
    ]);

    // 에러 처리 (workout_logs 테이블이 없을 수 있음)
    if (mealsResult.error && mealsResult.error.code !== 'PGRST116') {
      console.error('[R-1] Weekly report meals fetch error:', mealsResult.error);
      return NextResponse.json<WeeklyReportResponse>(
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

    // 운동 기록 (테이블이 없으면 빈 배열)
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
    // 배지 ID에서 마일스톤 숫자 추출
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

    // 데이터 존재 여부 확인
    const hasData = meals.length > 0 || waterRecords.length > 0;

    if (!hasData) {
      return NextResponse.json<WeeklyReportResponse>({
        success: true,
        hasData: false,
        data: undefined,
      });
    }

    // 주간 리포트 생성
    const report = generateWeeklyReport({
      weekStart,
      meals,
      waterRecords,
      workoutLogs,
      settings,
      nutritionStreak,
      workoutStreak,
    });

    return NextResponse.json<WeeklyReportResponse>({
      success: true,
      hasData: true,
      data: report,
    });
  } catch (error) {
    console.error('[R-1] Weekly report error:', error);
    return NextResponse.json<WeeklyReportResponse>(
      { success: false, error: 'Internal server error', hasData: false },
      { status: 500 }
    );
  }
}
