'use server';

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { generateMockWorkoutAnalysis } from '@/lib/mock/workout-analysis';
import { upsertPreferences } from '@/lib/preferences';
import { injuriesToPreferences } from '@/lib/preferences/converters';
import type { WorkoutAnalysis, WorkoutStreak } from '@/lib/api/workout';
import type { WorkoutAnalysisInput } from '@/lib/gemini';

/**
 * 운동 분석 결과 저장 (Server Action)
 */
export async function saveWorkoutAnalysisAction(
  clerkUserId: string,
  input: {
    bodyType?: string;
    goals: string[];
    concerns?: string[];
    frequency: string;
    location?: string;
    equipment?: string[];
    injuries?: string[];
    targetWeight?: number;
    targetDate?: string;
  }
): Promise<{ success: boolean; data?: WorkoutAnalysis; error?: string }> {
  console.log('[W-1 Action] saveWorkoutAnalysisAction called for user:', clerkUserId);
  console.log('[W-1 Action] Input:', JSON.stringify(input));
  const supabase = createServiceRoleClient();

  // Clerk ID로 내부 user_id 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (userError || !userData) {
    console.error('[W-1 Action] User not found for clerk_user_id:', clerkUserId, userError);
    return { success: false, error: `User not found: ${userError?.message || 'Unknown'}` };
  }

  console.log('[W-1 Action] Found user:', userData.id);

  // Mock 분석 결과 생성
  const analysisInput: WorkoutAnalysisInput = {
    bodyType: input.bodyType,
    goals: input.goals,
    concerns: input.concerns || [],
    frequency: input.frequency,
    location: input.location || 'home',
    equipment: input.equipment || [],
    injuries: input.injuries || [],
  };
  const mockResult = generateMockWorkoutAnalysis(analysisInput);

  // C-1 최신 체형 분석 결과 조회 (연동)
  let bodyAnalysisId: string | null = null;
  if (input.bodyType) {
    const { data: bodyData } = await supabase
      .from('body_analyses')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    bodyAnalysisId = bodyData?.id || null;
  }

  // PC-1 최신 퍼스널 컬러 결과 조회 (연동)
  const { data: pcData } = await supabase
    .from('personal_color_assessments')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  const personalColorId = pcData?.id || null;

  // DB에 저장
  const { data, error } = await supabase
    .from('workout_analyses')
    .insert({
      user_id: userData.id,
      body_analysis_id: bodyAnalysisId,
      personal_color_id: personalColorId,
      workout_type: mockResult.workoutType,
      workout_type_reason: mockResult.reason,
      workout_type_confidence: mockResult.confidence,
      goals: input.goals,
      concerns: input.concerns || [],
      frequency: input.frequency,
      location: input.location || 'home',
      equipment: input.equipment || [],
      injuries: input.injuries || [],
      target_weight: input.targetWeight,
      target_date: input.targetDate,
    })
    .select()
    .single();

  if (error) {
    console.error('[W-1 Action] Error saving workout analysis:', error);
    return { success: false, error: `DB Error: ${error.message} (${error.code})` };
  }

  // Dual Write: user_preferences에도 저장 (injuries)
  try {
    const preferences = injuriesToPreferences(input.injuries || [], clerkUserId);

    if (preferences.length > 0) {
      await upsertPreferences(supabase, preferences);
      console.log(
        `[W-1 Action] Saved ${preferences.length} injury preferences to user_preferences`
      );
    }
  } catch (prefError) {
    // user_preferences 저장 실패해도 기존 로직은 정상 동작
    console.error('[W-1 Action] Failed to save preferences (non-critical):', prefError);
  }

  console.log('[W-1 Action] Workout analysis saved:', data?.id, data?.workout_type);
  return { success: true, data: data as WorkoutAnalysis };
}

/**
 * 사용자의 최신 운동 분석 결과 조회 (Server Action)
 */
export async function getLatestWorkoutAnalysisAction(
  clerkUserId: string
): Promise<WorkoutAnalysis | null> {
  console.log('[W-1 Action] getLatestWorkoutAnalysisAction called with clerkUserId:', clerkUserId);
  const supabase = createServiceRoleClient();

  // Clerk ID로 내부 user_id 조회
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (userError || !userData) {
    console.error('[W-1 Action] User not found for clerk_user_id:', clerkUserId, userError);
    return null;
  }

  console.log('[W-1 Action] Found internal user_id:', userData.id);

  const { data, error } = await supabase
    .from('workout_analyses')
    .select('*')
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.log('[W-1 Action] No workout analysis found for user_id:', userData.id);
      return null;
    }
    console.error('[W-1 Action] Error fetching workout analysis:', error);
    return null;
  }

  console.log('[W-1 Action] Found workout analysis:', data?.id, data?.workout_type);
  return data as WorkoutAnalysis;
}

/**
 * 사용자의 Streak 조회 (Server Action)
 * workout_streaks.user_id는 Clerk ID (TEXT)
 */
export async function getWorkoutStreakAction(clerkUserId: string): Promise<WorkoutStreak | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('workout_streaks')
    .select('*')
    .eq('user_id', clerkUserId)
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
