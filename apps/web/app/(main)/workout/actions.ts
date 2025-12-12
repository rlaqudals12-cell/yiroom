'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { WorkoutAnalysis, WorkoutStreak } from '@/lib/api/workout';

/**
 * 사용자의 최신 운동 분석 결과 조회 (Server Action)
 */
export async function getLatestWorkoutAnalysisAction(
  userId: string
): Promise<WorkoutAnalysis | null> {
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
      return null;
    }
    console.error('Error fetching workout analysis:', error);
    return null;
  }

  return data as WorkoutAnalysis;
}

/**
 * 사용자의 Streak 조회 (Server Action)
 */
export async function getWorkoutStreakAction(
  userId: string
): Promise<WorkoutStreak | null> {
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
    console.error('Error fetching workout streak:', error);
    return null;
  }

  return data as WorkoutStreak;
}
