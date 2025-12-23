/**
 * 배지 시스템 라이브러리
 * - 배지 조회/부여
 * - DB Row → 도메인 타입 변환
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Badge,
  BadgeRow,
  UserBadge,
  UserBadgeRow,
  BadgeCategory,
  BadgeGroup,
  BadgeRequirement,
} from '@/types/gamification';
import { CATEGORY_NAMES } from './constants';

// ============================================================
// Row → 도메인 타입 변환
// ============================================================

export function badgeRowToBadge(row: BadgeRow): Badge {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category as BadgeCategory,
    rarity: row.rarity as Badge['rarity'],
    requirement: row.requirement as unknown as BadgeRequirement,
    xpReward: row.xp_reward,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
  };
}

export function userBadgeRowToUserBadge(row: UserBadgeRow): UserBadge {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    badgeId: row.badge_id,
    earnedAt: new Date(row.earned_at),
    badge: row.badges ? badgeRowToBadge(row.badges) : undefined,
  };
}

// ============================================================
// 배지 조회
// ============================================================

/**
 * 모든 배지 조회
 */
export async function getAllBadges(supabase: SupabaseClient): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Gamification] Failed to fetch badges:', error);
    return [];
  }

  return (data as BadgeRow[]).map(badgeRowToBadge);
}

/**
 * 카테고리별 배지 조회
 */
export async function getBadgesByCategory(
  supabase: SupabaseClient,
  category: BadgeCategory
): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[Gamification] Failed to fetch badges by category:', error);
    return [];
  }

  return (data as BadgeRow[]).map(badgeRowToBadge);
}

/**
 * 코드로 배지 조회
 */
export async function getBadgeByCode(
  supabase: SupabaseClient,
  code: string
): Promise<Badge | null> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  if (error || !data) {
    console.error('[Gamification] Failed to fetch badge by code:', error);
    return null;
  }

  return badgeRowToBadge(data as BadgeRow);
}

// ============================================================
// 사용자 배지 조회
// ============================================================

/**
 * 사용자가 획득한 배지 조회
 */
export async function getUserBadges(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges (*)
    `)
    .eq('clerk_user_id', clerkUserId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('[Gamification] Failed to fetch user badges:', error);
    return [];
  }

  return (data as UserBadgeRow[]).map(userBadgeRowToUserBadge);
}

/**
 * 최근 획득 배지 조회 (N개)
 */
export async function getRecentBadges(
  supabase: SupabaseClient,
  clerkUserId: string,
  limit: number = 3
): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges (*)
    `)
    .eq('clerk_user_id', clerkUserId)
    .order('earned_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Gamification] Failed to fetch recent badges:', error);
    return [];
  }

  return (data as UserBadgeRow[]).map(userBadgeRowToUserBadge);
}

/**
 * 특정 배지 소유 여부 확인
 */
export async function hasBadge(
  supabase: SupabaseClient,
  clerkUserId: string,
  badgeCode: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id,
      badges!inner (code)
    `)
    .eq('clerk_user_id', clerkUserId)
    .eq('badges.code', badgeCode)
    .maybeSingle();

  if (error) {
    console.error('[Gamification] Failed to check badge ownership:', error);
    return false;
  }

  return data !== null;
}

// ============================================================
// 배지 부여
// ============================================================

/**
 * 사용자에게 배지 부여
 * @returns 성공 시 UserBadge, 이미 보유 시 null
 */
export async function awardBadge(
  supabase: SupabaseClient,
  clerkUserId: string,
  badgeCode: string
): Promise<{ userBadge: UserBadge | null; alreadyOwned: boolean; xpReward: number }> {
  // 배지 정보 조회
  const badge = await getBadgeByCode(supabase, badgeCode);
  if (!badge) {
    console.error('[Gamification] Badge not found:', badgeCode);
    return { userBadge: null, alreadyOwned: false, xpReward: 0 };
  }

  // 이미 보유 중인지 확인
  const owned = await hasBadge(supabase, clerkUserId, badgeCode);
  if (owned) {
    return { userBadge: null, alreadyOwned: true, xpReward: 0 };
  }

  // 배지 부여
  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      clerk_user_id: clerkUserId,
      badge_id: badge.id,
    })
    .select(`
      *,
      badges (*)
    `)
    .single();

  if (error) {
    console.error('[Gamification] Failed to award badge:', error);
    return { userBadge: null, alreadyOwned: false, xpReward: 0 };
  }

  const userBadge = userBadgeRowToUserBadge(data as UserBadgeRow);
  return { userBadge, alreadyOwned: false, xpReward: badge.xpReward };
}

/**
 * 배지 코드로 직접 부여 (badge_id 사용)
 */
export async function awardBadgeById(
  supabase: SupabaseClient,
  clerkUserId: string,
  badgeId: string
): Promise<UserBadge | null> {
  const { data, error } = await supabase
    .from('user_badges')
    .insert({
      clerk_user_id: clerkUserId,
      badge_id: badgeId,
    })
    .select(`
      *,
      badges (*)
    `)
    .maybeSingle();

  if (error) {
    // 중복 삽입 시 무시 (unique constraint)
    if (error.code === '23505') {
      return null;
    }
    console.error('[Gamification] Failed to award badge by ID:', error);
    return null;
  }

  return data ? userBadgeRowToUserBadge(data as UserBadgeRow) : null;
}

// ============================================================
// 배지 그룹화
// ============================================================

/**
 * 배지를 카테고리별로 그룹화
 */
export function groupBadgesByCategory(
  allBadges: Badge[],
  userBadges: UserBadge[]
): BadgeGroup[] {
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const categories: BadgeCategory[] = ['streak', 'workout', 'nutrition', 'analysis', 'special'];

  return categories.map((category) => {
    const categoryBadges = allBadges.filter((b) => b.category === category);
    const earnedCount = categoryBadges.filter((b) => earnedBadgeIds.has(b.id)).length;

    return {
      category,
      categoryName: CATEGORY_NAMES[category],
      badges: categoryBadges,
      earnedCount,
      totalCount: categoryBadges.length,
    };
  });
}

/**
 * 사용자 배지 통계
 */
export function getBadgeStats(
  allBadges: Badge[],
  userBadges: UserBadge[]
): { total: number; earned: number; progress: number } {
  const total = allBadges.length;
  const earned = userBadges.length;
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0;

  return { total, earned, progress };
}
