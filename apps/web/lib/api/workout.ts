import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { workoutLogger, gamificationLogger } from '@/lib/utils/logger';
import { WorkoutInputData, WorkoutType } from '@/types/workout';
import { getNewBadges, STREAK_MILESTONES, getDaysDifference } from '@/lib/workout';
import {
  checkAndAwardStreakBadges,
  checkWorkoutCountBadges,
  addXp,
  type BadgeAwardResult,
  type LevelUpResult,
} from '@/lib/gamification';
import { updateChallengesOnWorkout, type ChallengeUpdateResult } from '@/lib/challenges';

// XP 보상 상수
const XP_WORKOUT_COMPLETE = 5;

// =====================================================
// 타입 정의
// =====================================================

export interface WorkoutAnalysis {
  id: string;
  user_id: string;
  body_analysis_id?: string;
  personal_color_id?: string;
  workout_type: WorkoutType;
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

export interface WorkoutPlan {
  id: string;
  user_id: string;
  analysis_id?: string;
  week_start_date: string;
  week_number: number;
  daily_plans: DailyPlan[];
  total_workout_days: number;
  total_estimated_minutes: number;
  total_estimated_calories: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  day: number;
  day_label: string;
  is_rest_day: boolean;
  focus?: string[];
  exercises: PlanExercise[];
  estimated_minutes: number;
  estimated_calories: number;
}

export interface PlanExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  rest_seconds: number;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  plan_id?: string;
  workout_date: string;
  completed_at?: string;
  actual_duration?: number;
  actual_calories?: number;
  exercise_logs: ExerciseLog[];
  total_volume: number;
  perceived_effort?: number;
  notes?: string;
  mood?: string;
  created_at: string;
}

export interface ExerciseLog {
  exercise_id: string;
  exercise_name: string;
  sets: SetLog[];
  difficulty?: number;
}

export interface SetLog {
  reps: number;
  weight?: number;
  completed: boolean;
}

export interface WorkoutStreak {
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

// 게이미피케이션 연동 결과
export interface WorkoutGamificationResult {
  badgeResults: BadgeAwardResult[];
  xpResult: LevelUpResult | null;
  challengeResult?: ChallengeUpdateResult;
}

// =====================================================
// Workout Analysis API
// =====================================================

/**
 * 운동 분석 결과 저장
 */
export async function saveWorkoutAnalysis(
  userId: string,
  inputData: WorkoutInputData,
  workoutType: WorkoutType,
  reason: string
): Promise<WorkoutAnalysis | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('workout_analyses')
    .insert({
      user_id: userId,
      workout_type: workoutType,
      workout_type_reason: reason,
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
    workoutLogger.error('Error saving workout analysis:', error);
    return null;
  }

  return data as WorkoutAnalysis;
}

/**
 * 사용자의 최신 운동 분석 결과 조회
 */
export async function getLatestWorkoutAnalysis(userId: string): Promise<WorkoutAnalysis | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('workout_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    workoutLogger.error('Error fetching workout analysis:', error);
    return null;
  }

  return data as WorkoutAnalysis;
}

// =====================================================
// Workout Plan API
// =====================================================

/**
 * 주간 운동 계획 저장
 */
export async function saveWorkoutPlan(
  userId: string,
  analysisId: string,
  weekStartDate: string,
  dailyPlans: DailyPlan[],
  weekNumber = 1
): Promise<WorkoutPlan | null> {
  const supabase = createClerkSupabaseClient();

  // 통계 계산
  const totalWorkoutDays = dailyPlans.filter((d) => !d.is_rest_day).length;
  const totalEstimatedMinutes = dailyPlans.reduce((sum, d) => sum + d.estimated_minutes, 0);
  const totalEstimatedCalories = dailyPlans.reduce((sum, d) => sum + d.estimated_calories, 0);

  const { data, error } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
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
    workoutLogger.error('Error saving workout plan:', error);
    return null;
  }

  return data as WorkoutPlan;
}

/**
 * 현재 주간 운동 계획 조회
 */
export async function getCurrentWeekPlan(userId: string): Promise<WorkoutPlan | null> {
  const supabase = createClerkSupabaseClient();

  // 이번 주 월요일 날짜 계산 (일요일 처리 포함)
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + diff);
  const weekStart = monday.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekStart)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    workoutLogger.error('Error fetching current week plan:', error);
    return null;
  }

  return data as WorkoutPlan;
}

// =====================================================
// Workout Log API
// =====================================================

/**
 * 운동 기록 저장 결과
 */
export interface SaveWorkoutLogResult {
  log: WorkoutLog | null;
  gamification: WorkoutGamificationResult;
}

/**
 * 운동 기록 저장
 * - 운동 기록 DB 저장
 * - 스트릭 업데이트
 * - 게이미피케이션 연동 (XP + 배지)
 */
export async function saveWorkoutLog(
  userId: string,
  planId: string | null,
  workoutDate: string,
  exerciseLogs: ExerciseLog[],
  options?: {
    actualDuration?: number;
    actualCalories?: number;
    notes?: string;
    mood?: string;
    perceivedEffort?: number;
  }
): Promise<SaveWorkoutLogResult> {
  const supabase = createClerkSupabaseClient();

  // 총 볼륨 계산 (세트 x 횟수 x 무게)
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
      user_id: userId,
      plan_id: planId,
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
    workoutLogger.error('Error saving workout log:', error);
    return {
      log: null,
      gamification: { badgeResults: [], xpResult: null },
    };
  }

  // Streak 업데이트 + 게이미피케이션
  const { gamification } = await updateWorkoutStreak(userId, workoutDate);

  return {
    log: data as WorkoutLog,
    gamification,
  };
}

/**
 * 특정 날짜의 운동 기록 조회
 */
export async function getWorkoutLogByDate(
  userId: string,
  date: string
): Promise<WorkoutLog | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('workout_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    workoutLogger.error('Error fetching workout log:', error);
    return null;
  }

  return data as WorkoutLog;
}

/**
 * 최근 운동 기록 조회 (최근 7일)
 */
export async function getRecentWorkoutLogs(userId: string, days = 7): Promise<WorkoutLog[]> {
  const supabase = createClerkSupabaseClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('workout_date', startDate.toISOString().split('T')[0])
    .order('workout_date', { ascending: false });

  if (error) {
    workoutLogger.error('Error fetching recent workout logs:', error);
    return [];
  }

  return (data || []) as WorkoutLog[];
}

// =====================================================
// Workout Streak API
// =====================================================

/**
 * 사용자의 Streak 조회
 */
export async function getWorkoutStreak(userId: string): Promise<WorkoutStreak | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('workout_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    workoutLogger.error('Error fetching workout streak:', error);
    return null;
  }

  return data as WorkoutStreak;
}

/**
 * Streak 업데이트 (운동 완료 시 호출)
 * - 기존 JSONB badges_earned 유지 (하위 호환)
 * - 새로운 user_badges 테이블에도 동기화
 */
export async function updateWorkoutStreak(
  userId: string,
  workoutDate: string
): Promise<{ streak: WorkoutStreak | null; gamification: WorkoutGamificationResult }> {
  const supabase = createClerkSupabaseClient();
  const gamificationResult: WorkoutGamificationResult = {
    badgeResults: [],
    xpResult: null,
  };

  // 기존 streak 조회
  const streak = await getWorkoutStreak(userId);

  const today = new Date(workoutDate);
  const todayStr = today.toISOString().split('T')[0];

  if (!streak) {
    // 첫 운동 - streak 생성
    const { data, error } = await supabase
      .from('workout_streaks')
      .insert({
        user_id: userId,
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
      workoutLogger.error('Error creating workout streak:', error);
      return { streak: null, gamification: gamificationResult };
    }

    // 게이미피케이션: 첫 운동 XP 추가
    try {
      const xpResult = await addXp(supabase, userId, XP_WORKOUT_COMPLETE);
      gamificationResult.xpResult = xpResult;

      // 첫 운동 배지 체크
      const countBadges = await checkWorkoutCountBadges(supabase, userId, 1);
      gamificationResult.badgeResults.push(...countBadges);
    } catch (err) {
      gamificationLogger.error('First workout error:', err);
    }

    return { streak: data as WorkoutStreak, gamification: gamificationResult };
  }

  // 기존 streak 업데이트
  const lastWorkout = streak.last_workout_date ? new Date(streak.last_workout_date) : null;

  let newCurrentStreak = streak.current_streak;
  let newStreakStart = streak.streak_start_date;
  const previousStreak = streak.current_streak;

  if (lastWorkout) {
    // getDaysDifference로 일관된 날짜 계산
    const daysDiff = getDaysDifference(lastWorkout, today);

    if (daysDiff === 0) {
      // 같은 날 - 변경 없음
      return { streak, gamification: gamificationResult };
    } else if (daysDiff === 1) {
      // 연속 - streak 증가
      newCurrentStreak += 1;
    } else {
      // 끊김 - streak 리셋
      newCurrentStreak = 1;
      newStreakStart = todayStr;
    }
  }

  const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

  // 마일스톤 체크
  const newMilestones = [...(streak.milestones_reached || [])];
  for (const milestone of STREAK_MILESTONES) {
    if (newCurrentStreak >= milestone && !newMilestones.includes(milestone)) {
      newMilestones.push(milestone);
    }
  }

  // 배지 체크 (기존 JSONB 방식)
  const existingBadges = streak.badges_earned || [];
  const newBadges = getNewBadges(newCurrentStreak, existingBadges);
  const updatedBadges = [...existingBadges, ...newBadges];

  const { data, error } = await supabase
    .from('workout_streaks')
    .update({
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_workout_date: todayStr,
      streak_start_date: newStreakStart,
      milestones_reached: newMilestones,
      badges_earned: updatedBadges,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    workoutLogger.error('Error updating workout streak:', error);
    return { streak: null, gamification: gamificationResult };
  }

  // 게이미피케이션 동기화
  try {
    // XP 추가 (운동 완료 시 5 XP)
    const xpResult = await addXp(supabase, userId, XP_WORKOUT_COMPLETE);
    gamificationResult.xpResult = xpResult;

    // 스트릭 배지 체크 및 user_badges 테이블에 동기화
    const streakBadges = await checkAndAwardStreakBadges(
      supabase,
      userId,
      'workout',
      newCurrentStreak,
      previousStreak
    );
    gamificationResult.badgeResults.push(...streakBadges);

    // 운동 횟수 배지 체크 (10회, 50회, 100회)
    const { count } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count) {
      const countBadges = await checkWorkoutCountBadges(supabase, userId, count);
      gamificationResult.badgeResults.push(...countBadges);
    }

    // 챌린지 진행 업데이트
    const challengeResult = await updateChallengesOnWorkout(supabase, userId, todayStr);
    gamificationResult.challengeResult = challengeResult;
  } catch (err) {
    gamificationLogger.error('Workout streak sync error:', err);
  }

  return { streak: data as WorkoutStreak, gamification: gamificationResult };
}
