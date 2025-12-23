/**
 * 챌린지 시스템 조회 함수
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Challenge,
  UserChallenge,
  ChallengeRow,
  UserChallengeRow,
  ChallengeDomain,
  ChallengeDifficulty,
} from '@/types/challenges';
import {
  challengeRowToChallenge,
  userChallengeRowToUserChallenge,
} from './constants';

// ============================================================
// 챌린지 조회
// ============================================================

/**
 * 모든 활성 챌린지 조회
 */
export async function getActiveChallenges(
  supabase: SupabaseClient
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Challenges] Get active challenges error:', error);
    return [];
  }

  return (data as ChallengeRow[]).map(challengeRowToChallenge);
}

/**
 * 도메인별 챌린지 조회
 */
export async function getChallengesByDomain(
  supabase: SupabaseClient,
  domain: ChallengeDomain
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .eq('domain', domain)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Challenges] Get challenges by domain error:', error);
    return [];
  }

  return (data as ChallengeRow[]).map(challengeRowToChallenge);
}

/**
 * 난이도별 챌린지 조회
 */
export async function getChallengesByDifficulty(
  supabase: SupabaseClient,
  difficulty: ChallengeDifficulty
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .eq('difficulty', difficulty)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Challenges] Get challenges by difficulty error:', error);
    return [];
  }

  return (data as ChallengeRow[]).map(challengeRowToChallenge);
}

/**
 * 챌린지 ID로 조회
 */
export async function getChallengeById(
  supabase: SupabaseClient,
  challengeId: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[Challenges] Get challenge by ID error:', error);
    }
    return null;
  }

  return challengeRowToChallenge(data as ChallengeRow);
}

/**
 * 챌린지 코드로 조회
 */
export async function getChallengeByCode(
  supabase: SupabaseClient,
  code: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[Challenges] Get challenge by code error:', error);
    }
    return null;
  }

  return challengeRowToChallenge(data as ChallengeRow);
}

// ============================================================
// 사용자 챌린지 조회
// ============================================================

/**
 * 사용자의 모든 챌린지 조회 (챌린지 정보 포함)
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
    console.error('[Challenges] Get user challenges error:', error);
    return [];
  }

  return (data as UserChallengeRow[]).map(userChallengeRowToUserChallenge);
}

/**
 * 사용자의 진행 중인 챌린지 조회
 */
export async function getActiveUserChallenges(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserChallenge[]> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('clerk_user_id', clerkUserId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Challenges] Get active user challenges error:', error);
    return [];
  }

  return (data as UserChallengeRow[]).map(userChallengeRowToUserChallenge);
}

/**
 * 사용자의 완료된 챌린지 조회
 */
export async function getCompletedUserChallenges(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserChallenge[]> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('clerk_user_id', clerkUserId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('[Challenges] Get completed user challenges error:', error);
    return [];
  }

  return (data as UserChallengeRow[]).map(userChallengeRowToUserChallenge);
}

/**
 * 특정 챌린지에 대한 사용자 참여 조회
 */
export async function getUserChallengeByChallenge(
  supabase: SupabaseClient,
  clerkUserId: string,
  challengeId: string
): Promise<UserChallenge | null> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('*, challenges(*)')
    .eq('clerk_user_id', clerkUserId)
    .eq('challenge_id', challengeId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[Challenges] Get user challenge error:', error);
    }
    return null;
  }

  return userChallengeRowToUserChallenge(data as UserChallengeRow);
}

/**
 * 사용자가 특정 챌린지에 참여 중인지 확인
 */
export async function isUserParticipating(
  supabase: SupabaseClient,
  clerkUserId: string,
  challengeId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('challenge_id', challengeId)
    .eq('status', 'in_progress')
    .limit(1);

  if (error) {
    console.error('[Challenges] Check participation error:', error);
    return false;
  }

  return data.length > 0;
}

// ============================================================
// 통계 조회
// ============================================================

/**
 * 사용자 챌린지 통계
 */
export interface ChallengeStats {
  total: number;
  inProgress: number;
  completed: number;
  failed: number;
  abandoned: number;
}

export async function getUserChallengeStats(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<ChallengeStats> {
  const { data, error } = await supabase
    .from('user_challenges')
    .select('status')
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('[Challenges] Get challenge stats error:', error);
    return {
      total: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      abandoned: 0,
    };
  }

  const stats: ChallengeStats = {
    total: data.length,
    inProgress: 0,
    completed: 0,
    failed: 0,
    abandoned: 0,
  };

  data.forEach((row) => {
    switch (row.status) {
      case 'in_progress':
        stats.inProgress++;
        break;
      case 'completed':
        stats.completed++;
        break;
      case 'failed':
        stats.failed++;
        break;
      case 'abandoned':
        stats.abandoned++;
        break;
    }
  });

  return stats;
}
