'use server';

/**
 * W-1 운동 모듈 Server Actions (Task 3.10)
 *
 * 분석 결과 및 운동 데이터 DB 저장을 위한 Server Actions
 */

import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { WorkoutInputData } from '@/types/workout';
import type { GeminiWorkoutAnalysisResult } from '@/lib/gemini';
import { revalidatePath } from 'next/cache';
import { getDaysDifference } from '@/lib/workout/streak';

// =====================================================
// 타입 정의
// =====================================================

export interface WorkoutAnalysisDB {
  id: string;
  user_id: string;
  body_analysis_id?: string;
  personal_color_id?: string;
  workout_type: string;
  workout_type_reason?: string;
  workout_type_confidence?: number;
  goals: string[];
  concerns: string[];
  frequency?: string;
  location?: string;
  equipment: string[];
  injuries: string[];
  target_weight?: number;
  target_date?: string;
  specific_goal?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyPlanDB {
  day: number;
  day_label: string;
  is_rest_day: boolean;
  focus?: string[];
  exercises: PlanExerciseDB[];
  estimated_minutes: number;
  estimated_calories: number;
}

export interface PlanExerciseDB {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest_seconds: number;
}

export interface WorkoutPlanDB {
  id: string;
  user_id: string;
  analysis_id?: string;
  week_start_date: string;
  week_number: number;
  daily_plans: DailyPlanDB[];
  total_workout_days: number;
  total_estimated_minutes: number;
  total_estimated_calories: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ExerciseLogDB {
  exercise_id: string;
  exercise_name: string;
  sets: SetLogDB[];
  difficulty?: number;
}

export interface SetLogDB {
  reps: number;
  weight?: number;
  completed: boolean;
}

export interface WorkoutLogDB {
  id: string;
  user_id: string;
  plan_id?: string;
  workout_date: string;
  completed_at?: string;
  actual_duration?: number;
  actual_calories?: number;
  exercise_logs: ExerciseLogDB[];
  total_volume: number;
  perceived_effort?: number;
  notes?: string;
  mood?: string;
  created_at: string;
}

export interface WorkoutStreakDB {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_workout_date?: string;
  streak_start_date?: string;
  badges_earned: string[];
  milestones_reached: number[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// 결과 타입
// =====================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =====================================================
// 유틸리티 함수
// =====================================================

/**
 * 현재 사용자의 내부 ID 조회
 */
async function getInternalUserId(): Promise<string | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();

  if (error || !data) {
    console.error('[Workout Action] User not found:', error);
    return null;
  }

  return data.id;
}

// =====================================================
// 운동 분석 결과 Actions
// =====================================================

/**
 * 운동 분석 결과 저장
 */
export async function saveWorkoutAnalysis(
  inputData: WorkoutInputData,
  analysisResult: GeminiWorkoutAnalysisResult
): Promise<ActionResult<WorkoutAnalysisDB>> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const { userId } = await auth();
    const supabase = createServiceRoleClient();

    // C-1 최신 체형 분석 연동
    let bodyAnalysisId: string | null = null;
    if (inputData.bodyTypeData) {
      const { data: bodyData } = await supabase
        .from('body_analyses')
        .select('id')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      bodyAnalysisId = bodyData?.id || null;
    }

    // PC-1 최신 퍼스널 컬러 연동
    const { data: pcData } = await supabase
      .from('personal_color_assessments')
      .select('id')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const personalColorId = pcData?.id || null;

    // DB 저장
    const { data, error } = await supabase
      .from('workout_analyses')
      .insert({
        user_id: internalUserId,
        body_analysis_id: bodyAnalysisId,
        personal_color_id: personalColorId,
        workout_type: analysisResult.workoutType,
        workout_type_reason: analysisResult.reason,
        workout_type_confidence: analysisResult.confidence,
        goals: inputData.goals || [],
        concerns: inputData.concerns || [],
        frequency: inputData.frequency,
        location: inputData.location,
        equipment: inputData.equipment || [],
        injuries: inputData.injuries || [],
        target_weight: inputData.targetWeight,
        target_date: inputData.targetDate,
      })
      .select()
      .single();

    if (error) {
      console.error('[Workout Action] Save analysis error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/workout');
    return { success: true, data: data as WorkoutAnalysisDB };
  } catch (error) {
    console.error('[Workout Action] Save analysis exception:', error);
    return { success: false, error: 'Failed to save analysis' };
  }
}

/**
 * 최신 운동 분석 결과 조회
 */
export async function getLatestWorkoutAnalysis(): Promise<
  ActionResult<WorkoutAnalysisDB>
> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('workout_analyses')
      .select('*')
      .eq('user_id', internalUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: undefined };
      }
      console.error('[Workout Action] Get analysis error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as WorkoutAnalysisDB };
  } catch (error) {
    console.error('[Workout Action] Get analysis exception:', error);
    return { success: false, error: 'Failed to get analysis' };
  }
}

// =====================================================
// 운동 계획 Actions
// =====================================================

/**
 * 주간 운동 계획 저장
 */
export async function saveWorkoutPlan(
  analysisId: string,
  weekStartDate: string,
  dailyPlans: DailyPlanDB[],
  weekNumber = 1
): Promise<ActionResult<WorkoutPlanDB>> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    // 통계 계산
    const totalWorkoutDays = dailyPlans.filter((d) => !d.is_rest_day).length;
    const totalEstimatedMinutes = dailyPlans.reduce(
      (sum, d) => sum + d.estimated_minutes,
      0
    );
    const totalEstimatedCalories = dailyPlans.reduce(
      (sum, d) => sum + d.estimated_calories,
      0
    );

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: internalUserId,
        analysis_id: analysisId,
        week_start_date: weekStartDate,
        week_number: weekNumber,
        daily_plans: dailyPlans,
        total_workout_days: totalWorkoutDays,
        total_estimated_minutes: totalEstimatedMinutes,
        total_estimated_calories: totalEstimatedCalories,
      })
      .select()
      .single();

    if (error) {
      console.error('[Workout Action] Save plan error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/workout');
    return { success: true, data: data as WorkoutPlanDB };
  } catch (error) {
    console.error('[Workout Action] Save plan exception:', error);
    return { success: false, error: 'Failed to save plan' };
  }
}

/**
 * 현재 주간 운동 계획 조회
 */
export async function getCurrentWeekPlan(): Promise<
  ActionResult<WorkoutPlanDB>
> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    // 이번 주 월요일 날짜 계산
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff);
    const weekStart = monday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', internalUserId)
      .eq('week_start_date', weekStart)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: undefined };
      }
      console.error('[Workout Action] Get plan error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as WorkoutPlanDB };
  } catch (error) {
    console.error('[Workout Action] Get plan exception:', error);
    return { success: false, error: 'Failed to get plan' };
  }
}

// =====================================================
// 운동 기록 Actions
// =====================================================

/**
 * 운동 기록 저장
 */
export async function saveWorkoutLog(
  workoutDate: string,
  exerciseLogs: ExerciseLogDB[],
  options?: {
    planId?: string;
    actualDuration?: number;
    actualCalories?: number;
    notes?: string;
    mood?: string;
    perceivedEffort?: number;
  }
): Promise<ActionResult<WorkoutLogDB>> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    // 총 볼륨 계산
    const totalVolume = exerciseLogs.reduce((total, exercise) => {
      return (
        total +
        exercise.sets.reduce((setTotal, set) => {
          return setTotal + (set.completed ? set.reps * (set.weight || 1) : 0);
        }, 0)
      );
    }, 0);

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: internalUserId,
        plan_id: options?.planId,
        workout_date: workoutDate,
        completed_at: new Date().toISOString(),
        exercise_logs: exerciseLogs,
        total_volume: totalVolume,
        actual_duration: options?.actualDuration,
        actual_calories: options?.actualCalories,
        notes: options?.notes,
        mood: options?.mood,
        perceived_effort: options?.perceivedEffort,
      })
      .select()
      .single();

    if (error) {
      console.error('[Workout Action] Save log error:', error);
      return { success: false, error: error.message };
    }

    // Streak 업데이트
    await updateWorkoutStreak(workoutDate);

    revalidatePath('/workout');
    return { success: true, data: data as WorkoutLogDB };
  } catch (error) {
    console.error('[Workout Action] Save log exception:', error);
    return { success: false, error: 'Failed to save log' };
  }
}

/**
 * 특정 날짜 운동 기록 조회
 */
export async function getWorkoutLogByDate(
  date: string
): Promise<ActionResult<WorkoutLogDB>> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', internalUserId)
      .eq('workout_date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: undefined };
      }
      console.error('[Workout Action] Get log error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as WorkoutLogDB };
  } catch (error) {
    console.error('[Workout Action] Get log exception:', error);
    return { success: false, error: 'Failed to get log' };
  }
}

/**
 * 최근 운동 기록 조회
 */
export async function getRecentWorkoutLogs(
  days = 7
): Promise<ActionResult<WorkoutLogDB[]>> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', internalUserId)
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .order('workout_date', { ascending: false });

    if (error) {
      console.error('[Workout Action] Get recent logs error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as WorkoutLogDB[] };
  } catch (error) {
    console.error('[Workout Action] Get recent logs exception:', error);
    return { success: false, error: 'Failed to get recent logs' };
  }
}

// =====================================================
// Streak Actions
// =====================================================

/**
 * 운동 Streak 조회
 */
export async function getWorkoutStreak(): Promise<
  ActionResult<WorkoutStreakDB>
> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('workout_streaks')
      .select('*')
      .eq('user_id', internalUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: undefined };
      }
      console.error('[Workout Action] Get streak error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as WorkoutStreakDB };
  } catch (error) {
    console.error('[Workout Action] Get streak exception:', error);
    return { success: false, error: 'Failed to get streak' };
  }
}

/**
 * Streak 업데이트 (내부 함수)
 */
async function updateWorkoutStreak(
  workoutDate: string
): Promise<ActionResult<WorkoutStreakDB>> {
  try {
    const internalUserId = await getInternalUserId();

    if (!internalUserId) {
      return { success: false, error: 'User not authenticated' };
    }

    const supabase = createServiceRoleClient();

    // 기존 streak 조회
    const { data: existingStreak } = await supabase
      .from('workout_streaks')
      .select('*')
      .eq('user_id', internalUserId)
      .single();

    const today = new Date(workoutDate);
    const todayStr = today.toISOString().split('T')[0];

    if (!existingStreak) {
      // 첫 운동 - streak 생성
      const { data, error } = await supabase
        .from('workout_streaks')
        .insert({
          user_id: internalUserId,
          current_streak: 1,
          longest_streak: 1,
          last_workout_date: todayStr,
          streak_start_date: todayStr,
          badges_earned: [],
          milestones_reached: [],
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as WorkoutStreakDB };
    }

    // Streak 계산
    const lastWorkout = existingStreak.last_workout_date
      ? new Date(existingStreak.last_workout_date)
      : null;

    let newCurrentStreak = existingStreak.current_streak;
    let newStreakStart = existingStreak.streak_start_date;

    if (lastWorkout) {
      // getDaysDifference로 일관된 날짜 계산 (시간 무시, 날짜만 비교)
      const daysDiff = getDaysDifference(lastWorkout, today);

      if (daysDiff === 0) {
        // 같은 날 - 변경 없음
        return { success: true, data: existingStreak as WorkoutStreakDB };
      } else if (daysDiff === 1) {
        // 연속 - streak 증가
        newCurrentStreak += 1;
      } else {
        // 끊김 - streak 리셋
        newCurrentStreak = 1;
        newStreakStart = todayStr;
      }
    }

    const newLongestStreak = Math.max(
      existingStreak.longest_streak,
      newCurrentStreak
    );

    // 마일스톤 및 배지 체크
    const milestones = [3, 7, 14, 30, 60, 100];
    const badgeMap: Record<number, string> = {
      3: '3day',
      7: '7day',
      14: '14day',
      30: '30day',
      60: '60day',
      100: '100day',
    };

    const newMilestones = [...(existingStreak.milestones_reached || [])];
    const newBadges = [...(existingStreak.badges_earned || [])];

    for (const milestone of milestones) {
      if (newCurrentStreak >= milestone && !newMilestones.includes(milestone)) {
        newMilestones.push(milestone);
        // 배지도 함께 추가
        const badgeId = badgeMap[milestone];
        if (badgeId && !newBadges.includes(badgeId)) {
          newBadges.push(badgeId);
        }
      }
    }

    const { data, error } = await supabase
      .from('workout_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_workout_date: todayStr,
        streak_start_date: newStreakStart,
        milestones_reached: newMilestones,
        badges_earned: newBadges,
      })
      .eq('user_id', internalUserId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as WorkoutStreakDB };
  } catch (error) {
    console.error('[Workout Action] Update streak exception:', error);
    return { success: false, error: 'Failed to update streak' };
  }
}
