// ============================================================
// 웰니스 스코어 저장 함수
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { wellnessLogger } from '@/lib/utils/logger';
import type { ScoreBreakdown, WellnessInsight } from '@/types/wellness';

interface SaveWellnessScoreInput {
  totalScore: number;
  workoutScore: number;
  nutritionScore: number;
  skinScore: number;
  bodyScore: number;
  scoreBreakdown: ScoreBreakdown;
  insights?: WellnessInsight[];
}

// 웰니스 스코어 저장 (upsert)
export async function saveWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string,
  input: SaveWellnessScoreInput,
  date?: string
): Promise<{ success: boolean; error?: string }> {
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('wellness_scores').upsert(
    {
      clerk_user_id: clerkUserId,
      date: targetDate,
      total_score: input.totalScore,
      workout_score: input.workoutScore,
      nutrition_score: input.nutritionScore,
      skin_score: input.skinScore,
      body_score: input.bodyScore,
      score_breakdown: input.scoreBreakdown,
      insights: input.insights ?? [],
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'clerk_user_id,date',
    }
  );

  if (error) {
    wellnessLogger.error(' Error saving score:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 웰니스 인사이트 업데이트
export async function updateWellnessInsights(
  supabase: SupabaseClient,
  clerkUserId: string,
  insights: WellnessInsight[],
  date?: string
): Promise<{ success: boolean; error?: string }> {
  const targetDate = date ?? new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('wellness_scores')
    .update({
      insights,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId)
    .eq('date', targetDate);

  if (error) {
    wellnessLogger.error(' Error updating insights:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 웰니스 스코어 삭제
export async function deleteWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string,
  date: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('wellness_scores')
    .delete()
    .eq('clerk_user_id', clerkUserId)
    .eq('date', date);

  if (error) {
    wellnessLogger.error(' Error deleting score:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// 오래된 웰니스 스코어 정리 (90일 이상)
export async function cleanupOldWellnessScores(
  supabase: SupabaseClient,
  clerkUserId: string,
  retentionDays: number = 90
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('wellness_scores')
    .delete()
    .eq('clerk_user_id', clerkUserId)
    .lt('date', cutoffDate.toISOString().split('T')[0])
    .select('id');

  if (error) {
    wellnessLogger.error(' Error cleaning up scores:', error);
    return { success: false, deletedCount: 0, error: error.message };
  }

  return { success: true, deletedCount: data?.length ?? 0 };
}
