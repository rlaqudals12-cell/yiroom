'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getNewBadges, STREAK_MILESTONES, getDaysDifference } from '@/lib/workout/streak';
import type { WorkoutLog, WorkoutStreak, ExerciseLog } from '@/lib/api/workout';

/**
 * 사용자의 Streak 조회 (Server Action)
 */
export async function getWorkoutStreakAction(
  userId: string
): Promise<WorkoutStreak | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('workout_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching workout streak:', error);
    return null;
  }

  return data as WorkoutStreak;
}

/**
 * Streak 업데이트 (Server Action - 내부 사용)
 */
async function updateWorkoutStreakAction(
  userId: string,
  workoutDate: string
): Promise<WorkoutStreak | null> {
  const supabase = createServiceRoleClient();

  const streak = await getWorkoutStreakAction(userId);

  const today = new Date(workoutDate);
  const todayStr = today.toISOString().split('T')[0];

  if (!streak) {
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
      console.error('Error creating workout streak:', error);
      return null;
    }

    return data as WorkoutStreak;
  }

  const lastWorkout = streak.last_workout_date
    ? new Date(streak.last_workout_date)
    : null;

  let newCurrentStreak = streak.current_streak;
  let newStreakStart = streak.streak_start_date;

  if (lastWorkout) {
    const daysDiff = getDaysDifference(lastWorkout, today);

    if (daysDiff === 0) {
      return streak;
    } else if (daysDiff === 1) {
      newCurrentStreak += 1;
    } else {
      newCurrentStreak = 1;
      newStreakStart = todayStr;
    }
  }

  const newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);

  const newMilestones = [...(streak.milestones_reached || [])];
  for (const milestone of STREAK_MILESTONES) {
    if (newCurrentStreak >= milestone && !newMilestones.includes(milestone)) {
      newMilestones.push(milestone);
    }
  }

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
    console.error('Error updating workout streak:', error);
    return null;
  }

  return data as WorkoutStreak;
}

/**
 * 운동 기록 저장 (Server Action)
 */
export async function saveWorkoutLogAction(
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
): Promise<WorkoutLog | null> {
  const supabase = createServiceRoleClient();

  // 총 볼륨 계산 (세트 x 횟수 x 무게)
  const totalVolume = exerciseLogs.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.completed ? set.reps * (set.weight || 1) : 0);
    }, 0);
  }, 0);

  // plan_id는 UUID 형식이 아니면 null로 설정
  const isValidUUID = planId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({
      user_id: userId,
      plan_id: isValidUUID ? planId : null,
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
    console.error('Error saving workout log:', {
      error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      workoutDate,
      totalVolume,
      exerciseLogsCount: exerciseLogs?.length,
    });
    return null;
  }

  // Streak 업데이트
  await updateWorkoutStreakAction(userId, workoutDate);

  return data as WorkoutLog;
}
