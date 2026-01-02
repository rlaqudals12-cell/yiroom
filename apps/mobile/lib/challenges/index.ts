/**
 * 챌린지 시스템 API 클라이언트
 * Supabase 직접 조회
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 타입 정의
// ============================================

export type ChallengeDomain = 'workout' | 'nutrition' | 'skin' | 'combined';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus =
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'abandoned';

export interface ChallengeTarget {
  type: 'streak' | 'count' | 'daily' | 'combined';
  days?: number;
  workouts?: number;
  meals?: number;
  waterCups?: number;
  [key: string]: unknown;
}

export interface ChallengeProgress {
  currentDays?: number;
  totalDays?: number;
  completedDays?: number[];
  missedDays?: number[];
  completedCount?: number;
  percentage?: number;
  lastActivityDate?: string;
}

export interface Challenge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  domain: ChallengeDomain;
  durationDays: number;
  target: ChallengeTarget;
  rewardXp: number;
  difficulty: ChallengeDifficulty;
  isActive: boolean;
}

export interface UserChallenge {
  id: string;
  clerkUserId: string;
  challengeId: string;
  status: ChallengeStatus;
  startedAt: Date;
  targetEndAt: Date;
  completedAt: Date | null;
  progress: ChallengeProgress;
  challenge?: Challenge;
}

export interface ChallengeStats {
  total: number;
  inProgress: number;
  completed: number;
  failed: number;
}

// ============================================
// 상수
// ============================================

export const DOMAIN_NAMES: Record<ChallengeDomain, string> = {
  workout: '운동',
  nutrition: '영양',
  skin: '피부',
  combined: '복합',
};

export const DOMAIN_COLORS: Record<ChallengeDomain, string> = {
  workout: '#f97316', // orange
  nutrition: '#22c55e', // green
  skin: '#ec4899', // pink
  combined: '#8b5cf6', // purple
};

export const DIFFICULTY_NAMES: Record<ChallengeDifficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#ef4444',
};

export const STATUS_NAMES: Record<ChallengeStatus, string> = {
  in_progress: '진행 중',
  completed: '완료',
  failed: '실패',
  abandoned: '포기',
};

// ============================================
// 변환 함수
// ============================================

interface ChallengeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  domain: string;
  duration_days: number;
  target: Record<string, unknown>;
  reward_xp: number;
  difficulty: string;
  is_active: boolean;
}

interface UserChallengeRow {
  id: string;
  clerk_user_id: string;
  challenge_id: string;
  status: string;
  started_at: string;
  target_end_at: string;
  completed_at: string | null;
  progress: Record<string, unknown>;
  challenges?: ChallengeRow;
}

function toChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon,
    domain: row.domain as ChallengeDomain,
    durationDays: row.duration_days,
    target: row.target as ChallengeTarget,
    rewardXp: row.reward_xp,
    difficulty: row.difficulty as ChallengeDifficulty,
    isActive: row.is_active,
  };
}

function toUserChallenge(row: UserChallengeRow): UserChallenge {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    challengeId: row.challenge_id,
    status: row.status as ChallengeStatus,
    startedAt: new Date(row.started_at),
    targetEndAt: new Date(row.target_end_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    progress: row.progress as ChallengeProgress,
    challenge: row.challenges ? toChallenge(row.challenges) : undefined,
  };
}

// ============================================
// 조회 함수
// ============================================

/**
 * 활성 챌린지 목록 조회
 */
export async function getActiveChallenges(
  supabase: SupabaseClient
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('[Mobile] 챌린지 조회 실패:', error);
    return [];
  }

  return (data ?? []).map(toChallenge);
}

/**
 * 사용자 챌린지 목록 조회
 */
export async function getUserChallenges(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserChallenge[]> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Mobile] 사용자 챌린지 조회 실패:', error);
    return [];
  }

  return (data ?? []).map(toUserChallenge);
}

/**
 * 사용자 챌린지 통계 조회
 */
export async function getUserChallengeStats(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<ChallengeStats> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('status')
    .eq('clerk_user_id', clerkUserId);

  if (error || !data) {
    return { total: 0, inProgress: 0, completed: 0, failed: 0 };
  }

  return {
    total: data.length,
    inProgress: data.filter((d) => d.status === 'in_progress').length,
    completed: data.filter((d) => d.status === 'completed').length,
    failed: data.filter((d) => d.status === 'failed').length,
  };
}

/**
 * 챌린지 참여 여부 확인
 */
export async function isUserParticipating(
  supabase: SupabaseClient,
  clerkUserId: string,
  challengeId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('user_challenges')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('challenge_id', challengeId)
    .eq('status', 'in_progress')
    .maybeSingle();

  return !!data;
}

// ============================================
// 변경 함수
// ============================================

/**
 * 챌린지 참여
 */
export async function joinChallenge(
  supabase: SupabaseClient,
  clerkUserId: string,
  challengeId: string
): Promise<{
  success: boolean;
  userChallenge?: UserChallenge;
  error?: string;
}> {
  // 챌린지 정보 조회
  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .select('duration_days')
    .eq('id', challengeId)
    .single();

  if (challengeError || !challenge) {
    return { success: false, error: '챌린지를 찾을 수 없습니다' };
  }

  // 이미 참여 중인지 확인
  const isParticipating = await isUserParticipating(
    supabase,
    clerkUserId,
    challengeId
  );
  if (isParticipating) {
    return { success: false, error: '이미 참여 중인 챌린지입니다' };
  }

  // 목표 종료일 계산
  const startedAt = new Date();
  const targetEndAt = new Date(startedAt);
  targetEndAt.setDate(targetEndAt.getDate() + challenge.duration_days);

  // 참여 생성
  const { data, error } = await supabase
    .from('user_challenges')
    .insert({
      clerk_user_id: clerkUserId,
      challenge_id: challengeId,
      status: 'in_progress',
      started_at: startedAt.toISOString(),
      target_end_at: targetEndAt.toISOString(),
      progress: { currentDays: 0, completedDays: [], percentage: 0 },
    })
    .select('*, challenges(*)')
    .single();

  if (error) {
    console.error('[Mobile] 챌린지 참여 실패:', error);
    return { success: false, error: '참여에 실패했습니다' };
  }

  return { success: true, userChallenge: toUserChallenge(data) };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 진행률 계산
 */
export function calculateProgress(userChallenge: UserChallenge): number {
  const { progress } = userChallenge;
  if (progress.percentage !== undefined) {
    return progress.percentage;
  }
  if (progress.currentDays !== undefined && progress.totalDays) {
    return Math.round((progress.currentDays / progress.totalDays) * 100);
  }
  return 0;
}

/**
 * 남은 일수 계산
 */
export function getDaysRemaining(targetEndAt: Date): number {
  const now = new Date();
  const diff = targetEndAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
