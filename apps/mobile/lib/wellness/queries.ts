/**
 * 웰니스 Supabase 쿼리 래퍼
 *
 * @module lib/wellness/queries
 */
import type { SupabaseClient } from '@supabase/supabase-js';

import type { WellnessHistoryRecord } from './types';

/**
 * 최근 N일간 웰니스 히스토리 조회
 */
export async function getWellnessHistory(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<WellnessHistoryRecord[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('wellness_scores')
    .select('date, total, workout, nutrition, skin, body, grade')
    .eq('clerk_user_id', userId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    // 쿼리 실패 시 빈 배열 반환 (graceful degradation)
    return [];
  }

  return (data ?? []) as WellnessHistoryRecord[];
}

/**
 * 웰니스 점수 저장/업데이트 (upsert)
 */
export async function upsertWellnessScore(
  supabase: SupabaseClient,
  userId: string,
  record: Omit<WellnessHistoryRecord, 'date'> & { date?: string }
): Promise<boolean> {
  const date = record.date ?? new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('wellness_scores').upsert(
    {
      clerk_user_id: userId,
      date,
      total: record.total,
      workout: record.workout,
      nutrition: record.nutrition,
      skin: record.skin,
      body: record.body,
      grade: record.grade,
    },
    { onConflict: 'clerk_user_id,date' }
  );

  if (error) {
    // upsert 실패 시 false 반환
    return false;
  }

  return true;
}

/**
 * 최신 분석 점수 조회 (피부/체형/자세)
 */
export async function getLatestAnalysisScores(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  skinScore: number | null;
  bodyScore: number | null;
  postureScore: number | null;
}> {
  // 각 분석의 최신 점수 조회
  const [skinResult, bodyResult, postureResult] = await Promise.all([
    supabase
      .from('skin_assessments')
      .select('overall_score')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('body_assessments')
      .select('overall_score')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('posture_assessments')
      .select('overall_score')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    skinScore: skinResult.data?.overall_score ?? null,
    bodyScore: bodyResult.data?.overall_score ?? null,
    postureScore: postureResult.data?.overall_score ?? null,
  };
}
