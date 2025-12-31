// ============================================================
// 웰니스 스코어 조회 함수
// Phase H Sprint 2
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { wellnessLogger } from '@/lib/utils/logger';
import type { WellnessScore, WellnessScoreRow } from '@/types/wellness';
import { toWellnessScore, getWellnessGrade } from '@/types/wellness';

// 오늘 웰니스 스코어 조회
export async function getTodayWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<WellnessScore | null> {
  const today = new Date().toISOString().split('T')[0];
  return getWellnessScoreByDate(supabase, clerkUserId, today);
}

// 특정 날짜 웰니스 스코어 조회
export async function getWellnessScoreByDate(
  supabase: SupabaseClient,
  clerkUserId: string,
  date: string
): Promise<WellnessScore | null> {
  const { data, error } = await supabase
    .from('wellness_scores')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    wellnessLogger.error(' Error fetching score:', error);
    return null;
  }

  if (!data) return null;

  return toWellnessScore(data as WellnessScoreRow);
}

// 최근 N일 웰니스 스코어 조회
export async function getWellnessHistory(
  supabase: SupabaseClient,
  clerkUserId: string,
  days: number = 7
): Promise<WellnessScore[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('wellness_scores')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (error) {
    wellnessLogger.error(' Error fetching history:', error);
    return [];
  }

  return (data as WellnessScoreRow[]).map(toWellnessScore);
}

// 최근 웰니스 스코어 조회 (가장 최근 1개)
export async function getLatestWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<WellnessScore | null> {
  const { data, error } = await supabase
    .from('wellness_scores')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    wellnessLogger.error(' Error fetching latest score:', error);
    return null;
  }

  if (!data) return null;

  return toWellnessScore(data as WellnessScoreRow);
}

// 평균 웰니스 스코어 조회 (최근 N일)
export async function getAverageWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string,
  days: number = 7
): Promise<{
  totalScore: number;
  workoutScore: number;
  nutritionScore: number;
  skinScore: number;
  bodyScore: number;
  grade: string;
  count: number;
}> {
  const history = await getWellnessHistory(supabase, clerkUserId, days);

  if (history.length === 0) {
    return {
      totalScore: 0,
      workoutScore: 0,
      nutritionScore: 0,
      skinScore: 0,
      bodyScore: 0,
      grade: 'F',
      count: 0,
    };
  }

  const sum = history.reduce(
    (acc, score) => ({
      totalScore: acc.totalScore + score.totalScore,
      workoutScore: acc.workoutScore + score.workoutScore,
      nutritionScore: acc.nutritionScore + score.nutritionScore,
      skinScore: acc.skinScore + score.skinScore,
      bodyScore: acc.bodyScore + score.bodyScore,
    }),
    { totalScore: 0, workoutScore: 0, nutritionScore: 0, skinScore: 0, bodyScore: 0 }
  );

  const count = history.length;
  const avgTotal = Math.round(sum.totalScore / count);

  return {
    totalScore: avgTotal,
    workoutScore: Math.round(sum.workoutScore / count),
    nutritionScore: Math.round(sum.nutritionScore / count),
    skinScore: Math.round(sum.skinScore / count),
    bodyScore: Math.round(sum.bodyScore / count),
    grade: getWellnessGrade(avgTotal),
    count,
  };
}

// 웰니스 스코어 트렌드 (주간/월간)
export async function getWellnessTrend(
  supabase: SupabaseClient,
  clerkUserId: string,
  period: 'weekly' | 'monthly' = 'weekly'
): Promise<{
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}> {
  const days = period === 'weekly' ? 7 : 30;

  // 현재 기간
  const currentEnd = new Date();
  const currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - days);

  // 이전 기간
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days);

  // 현재 기간 평균
  const { data: currentData } = await supabase
    .from('wellness_scores')
    .select('total_score')
    .eq('clerk_user_id', clerkUserId)
    .gte('date', currentStart.toISOString().split('T')[0])
    .lte('date', currentEnd.toISOString().split('T')[0]);

  // 이전 기간 평균
  const { data: previousData } = await supabase
    .from('wellness_scores')
    .select('total_score')
    .eq('clerk_user_id', clerkUserId)
    .gte('date', previousStart.toISOString().split('T')[0])
    .lte('date', previousEnd.toISOString().split('T')[0]);

  const currentAvg =
    currentData && currentData.length > 0
      ? currentData.reduce((sum, row) => sum + (row.total_score ?? 0), 0) / currentData.length
      : 0;

  const previousAvg =
    previousData && previousData.length > 0
      ? previousData.reduce((sum, row) => sum + (row.total_score ?? 0), 0) / previousData.length
      : 0;

  const change = currentAvg - previousAvg;
  const changePercent = previousAvg > 0 ? (change / previousAvg) * 100 : 0;

  return {
    current: Math.round(currentAvg),
    previous: Math.round(previousAvg),
    change: Math.round(change),
    changePercent: Math.round(changePercent),
  };
}
