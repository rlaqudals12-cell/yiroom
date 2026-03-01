/**
 * 마일스톤 추적 모듈
 *
 * 사용자 활동 마일스톤 정의, 추적, 알림
 *
 * @module lib/milestones
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export interface Milestone {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: MilestoneCategory;
  threshold: number;
  unit: string;
}

export type MilestoneCategory =
  | 'streak'
  | 'analysis'
  | 'workout'
  | 'nutrition'
  | 'social'
  | 'level';

export interface UserMilestone {
  milestoneId: string;
  milestone: Milestone;
  achievedAt: string;
  currentValue: number;
}

export interface MilestoneProgress {
  milestone: Milestone;
  currentValue: number;
  progress: number;
  achieved: boolean;
  achievedAt: string | null;
}

// ─── 마일스톤 정의 ────────────────────────────────────

export const STREAK_MILESTONES: Milestone[] = [
  { id: 'ms-s3', key: 'streak_3', name: '3일 연속', description: '3일 연속 앱을 사용했어요', icon: '🔥', category: 'streak', threshold: 3, unit: '일' },
  { id: 'ms-s7', key: 'streak_7', name: '일주일 습관', description: '7일 연속 앱을 사용했어요', icon: '⚡', category: 'streak', threshold: 7, unit: '일' },
  { id: 'ms-s14', key: 'streak_14', name: '2주 루틴', description: '14일 연속 달성!', icon: '💫', category: 'streak', threshold: 14, unit: '일' },
  { id: 'ms-s30', key: 'streak_30', name: '한 달 습관', description: '30일 연속! 습관이 되었어요', icon: '🌟', category: 'streak', threshold: 30, unit: '일' },
  { id: 'ms-s60', key: 'streak_60', name: '60일 마스터', description: '60일 연속 달성!', icon: '💎', category: 'streak', threshold: 60, unit: '일' },
  { id: 'ms-s100', key: 'streak_100', name: '100일 전설', description: '100일 연속! 전설이에요', icon: '👑', category: 'streak', threshold: 100, unit: '일' },
];

export const ANALYSIS_MILESTONES: Milestone[] = [
  { id: 'ms-a1', key: 'analysis_1', name: '첫 분석', description: '첫 AI 분석을 완료했어요', icon: '🔬', category: 'analysis', threshold: 1, unit: '회' },
  { id: 'ms-a5', key: 'analysis_5', name: '분석 5회', description: '5번의 분석을 완료했어요', icon: '🧪', category: 'analysis', threshold: 5, unit: '회' },
  { id: 'ms-a10', key: 'analysis_10', name: '분석 10회', description: '꾸준한 분석가', icon: '📊', category: 'analysis', threshold: 10, unit: '회' },
  { id: 'ms-a25', key: 'analysis_25', name: '분석 25회', description: '데이터 축적 중', icon: '📈', category: 'analysis', threshold: 25, unit: '회' },
  { id: 'ms-a50', key: 'analysis_50', name: '분석 50회', description: '분석 마스터', icon: '🏆', category: 'analysis', threshold: 50, unit: '회' },
];

export const WORKOUT_MILESTONES: Milestone[] = [
  { id: 'ms-w1', key: 'workout_1', name: '첫 운동', description: '운동 시작!', icon: '💪', category: 'workout', threshold: 1, unit: '회' },
  { id: 'ms-w10', key: 'workout_10', name: '운동 10회', description: '운동이 습관이 되고 있어요', icon: '🏋️', category: 'workout', threshold: 10, unit: '회' },
  { id: 'ms-w30', key: 'workout_30', name: '운동 30회', description: '한 달 운동 완료!', icon: '🔥', category: 'workout', threshold: 30, unit: '회' },
  { id: 'ms-w100', key: 'workout_100', name: '운동 100회', description: '100회 운동의 철인!', icon: '🏅', category: 'workout', threshold: 100, unit: '회' },
];

export const SOCIAL_MILESTONES: Milestone[] = [
  { id: 'ms-f1', key: 'friend_1', name: '첫 친구', description: '첫 친구를 만들었어요', icon: '🤝', category: 'social', threshold: 1, unit: '명' },
  { id: 'ms-f5', key: 'friend_5', name: '5명의 친구', description: '사교적이에요!', icon: '👋', category: 'social', threshold: 5, unit: '명' },
  { id: 'ms-f10', key: 'friend_10', name: '10명의 친구', description: '인기인!', icon: '🌟', category: 'social', threshold: 10, unit: '명' },
];

export const LEVEL_MILESTONES: Milestone[] = [
  { id: 'ms-l5', key: 'level_5', name: 'Lv.5 달성', description: '레벨 5 달성!', icon: '⭐', category: 'level', threshold: 5, unit: '레벨' },
  { id: 'ms-l10', key: 'level_10', name: 'Lv.10 달성', description: '실버 티어 진입!', icon: '🥈', category: 'level', threshold: 10, unit: '레벨' },
  { id: 'ms-l20', key: 'level_20', name: 'Lv.20 달성', description: '골드 티어 진입!', icon: '🥇', category: 'level', threshold: 20, unit: '레벨' },
  { id: 'ms-l30', key: 'level_30', name: 'Lv.30 달성', description: '플래티넘 티어!', icon: '💎', category: 'level', threshold: 30, unit: '레벨' },
];

/**
 * 모든 마일스톤
 */
export const ALL_MILESTONES: Milestone[] = [
  ...STREAK_MILESTONES,
  ...ANALYSIS_MILESTONES,
  ...WORKOUT_MILESTONES,
  ...SOCIAL_MILESTONES,
  ...LEVEL_MILESTONES,
];

// ─── 마일스톤 조회 ────────────────────────────────────

/**
 * 사용자 달성 마일스톤 조회
 */
export async function getUserMilestones(
  supabase: SupabaseClient,
  userId: string
): Promise<UserMilestone[]> {
  const { data } = await supabase
    .from('user_milestones')
    .select('milestone_id, achieved_at, current_value')
    .eq('clerk_user_id', userId)
    .order('achieved_at', { ascending: false });

  if (!data) return [];

  return data.map((row) => {
    const milestone = ALL_MILESTONES.find((m) => m.id === row.milestone_id) ?? {
      id: row.milestone_id,
      key: row.milestone_id,
      name: '알 수 없는 마일스톤',
      description: '',
      icon: '❓',
      category: 'streak' as MilestoneCategory,
      threshold: 0,
      unit: '',
    };

    return {
      milestoneId: row.milestone_id,
      milestone,
      achievedAt: row.achieved_at,
      currentValue: row.current_value ?? 0,
    };
  });
}

/**
 * 마일스톤 달성 기록
 */
export async function achieveMilestone(
  supabase: SupabaseClient,
  userId: string,
  milestoneId: string,
  currentValue: number
): Promise<boolean> {
  // 이미 달성 여부 확인
  const { count } = await supabase
    .from('user_milestones')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .eq('milestone_id', milestoneId);

  if ((count ?? 0) > 0) return false;

  const { error } = await supabase.from('user_milestones').insert({
    clerk_user_id: userId,
    milestone_id: milestoneId,
    current_value: currentValue,
  });

  return !error;
}

// ─── 진행률 계산 ──────────────────────────────────────

/**
 * 카테고리별 마일스톤 진행률
 */
export function getMilestoneProgress(
  category: MilestoneCategory,
  currentValue: number,
  achievedIds: string[]
): MilestoneProgress[] {
  const milestones = ALL_MILESTONES.filter((m) => m.category === category);

  return milestones.map((milestone) => {
    const achieved = achievedIds.includes(milestone.id);
    return {
      milestone,
      currentValue,
      progress: Math.min(1, currentValue / milestone.threshold),
      achieved,
      achievedAt: null,
    };
  });
}

/**
 * 다음 달성 가능한 마일스톤 조회
 */
export function getNextMilestone(
  category: MilestoneCategory,
  currentValue: number,
  achievedIds: string[]
): Milestone | null {
  const milestones = ALL_MILESTONES
    .filter((m) => m.category === category)
    .sort((a, b) => a.threshold - b.threshold);

  return milestones.find(
    (m) => !achievedIds.includes(m.id) && currentValue < m.threshold
  ) ?? null;
}

/**
 * 새로 달성 가능한 마일스톤 확인
 */
export function checkNewMilestones(
  category: MilestoneCategory,
  currentValue: number,
  achievedIds: string[]
): Milestone[] {
  return ALL_MILESTONES.filter(
    (m) =>
      m.category === category &&
      currentValue >= m.threshold &&
      !achievedIds.includes(m.id)
  );
}
