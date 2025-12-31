/**
 * 레벨 시스템 라이브러리
 * - 레벨/XP 조회
 * - XP 추가 및 레벨업 처리
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { gamificationLogger } from '@/lib/utils/logger';
import type {
  UserLevel,
  UserLevelRow,
  LevelInfo,
  LevelUpResult,
  LevelTier,
} from '@/types/gamification';
import { calculateLevelInfo, getLevelFromTotalXp, getTierForLevel } from './constants';

// ============================================================
// Row → 도메인 타입 변환
// ============================================================

export function userLevelRowToUserLevel(row: UserLevelRow): UserLevel {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    level: row.level,
    currentXp: row.current_xp,
    totalXp: row.total_xp,
    tier: row.tier as LevelTier,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================================
// 레벨 조회
// ============================================================

/**
 * 사용자 레벨 조회 (없으면 생성)
 */
export async function getUserLevel(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserLevel | null> {
  // 기존 레벨 조회
  const { data: existing, error: selectError } = await supabase
    .from('user_levels')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (selectError) {
    gamificationLogger.error(' Failed to fetch user level:', selectError);
    return null;
  }

  if (existing) {
    return userLevelRowToUserLevel(existing as UserLevelRow);
  }

  // 없으면 생성
  const { data: created, error: insertError } = await supabase
    .from('user_levels')
    .insert({
      clerk_user_id: clerkUserId,
      level: 1,
      current_xp: 0,
      total_xp: 0,
      tier: 'beginner',
    })
    .select('*')
    .single();

  if (insertError) {
    gamificationLogger.error(' Failed to create user level:', insertError);
    return null;
  }

  return userLevelRowToUserLevel(created as UserLevelRow);
}

/**
 * 사용자 레벨 정보 조회 (UI 표시용)
 */
export async function getUserLevelInfo(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<LevelInfo | null> {
  const userLevel = await getUserLevel(supabase, clerkUserId);
  if (!userLevel) return null;

  return calculateLevelInfo(userLevel.totalXp);
}

// ============================================================
// XP 추가
// ============================================================

/**
 * XP 추가 및 레벨업 처리
 */
export async function addXp(
  supabase: SupabaseClient,
  clerkUserId: string,
  xpAmount: number
): Promise<LevelUpResult | null> {
  if (xpAmount <= 0) return null;

  // 현재 레벨 조회
  const userLevel = await getUserLevel(supabase, clerkUserId);
  if (!userLevel) return null;

  // 새 XP 계산
  const previousLevel = userLevel.level;
  const previousTier = userLevel.tier;
  const newTotalXp = userLevel.totalXp + xpAmount;
  const newLevel = getLevelFromTotalXp(newTotalXp);
  const newTier = getTierForLevel(newLevel);
  const newLevelInfo = calculateLevelInfo(newTotalXp);

  // DB 업데이트
  const { error } = await supabase
    .from('user_levels')
    .update({
      level: newLevel,
      current_xp: newLevelInfo.currentXp,
      total_xp: newTotalXp,
      tier: newTier,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    gamificationLogger.error(' Failed to update XP:', error);
    return null;
  }

  return {
    previousLevel,
    newLevel,
    previousTier,
    newTier,
    tierChanged: previousTier !== newTier,
    xpGained: xpAmount,
    totalXp: newTotalXp,
  };
}

/**
 * 배지 획득 시 XP 추가 (통합 함수)
 */
export async function awardBadgeXp(
  supabase: SupabaseClient,
  clerkUserId: string,
  xpReward: number
): Promise<LevelUpResult | null> {
  if (xpReward <= 0) return null;
  return addXp(supabase, clerkUserId, xpReward);
}

// ============================================================
// 활동 XP
// ============================================================

/**
 * 운동 기록 시 XP 추가 (5 XP)
 */
export async function addWorkoutXp(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<LevelUpResult | null> {
  return addXp(supabase, clerkUserId, 5);
}

/**
 * 식단 기록 시 XP 추가 (2 XP)
 */
export async function addMealRecordXp(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<LevelUpResult | null> {
  return addXp(supabase, clerkUserId, 2);
}

/**
 * 수분 목표 달성 시 XP 추가 (3 XP)
 */
export async function addWaterGoalXp(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<LevelUpResult | null> {
  return addXp(supabase, clerkUserId, 3);
}

// ============================================================
// 유틸리티
// ============================================================

/**
 * 레벨업 발생 여부 확인
 */
export function didLevelUp(result: LevelUpResult | null): boolean {
  if (!result) return false;
  return result.newLevel > result.previousLevel;
}

/**
 * 티어 변경 발생 여부 확인
 */
export function didTierChange(result: LevelUpResult | null): boolean {
  if (!result) return false;
  return result.tierChanged;
}

/**
 * 레벨업 메시지 생성
 */
export function getLevelUpMessage(result: LevelUpResult): string {
  if (result.tierChanged) {
    const tierNames: Record<LevelTier, string> = {
      beginner: '비기너',
      practitioner: '프랙티셔너',
      expert: '엑스퍼트',
      master: '마스터',
    };
    return `축하합니다! 레벨 ${result.newLevel}로 올라갔어요! ${tierNames[result.newTier]} 티어 달성!`;
  }
  return `축하합니다! 레벨 ${result.newLevel}로 올라갔어요!`;
}
