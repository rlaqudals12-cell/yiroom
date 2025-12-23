/**
 * 게이미피케이션 시스템 타입 정의
 * - 배지 시스템: 업적 달성 시 배지 획득
 * - 레벨 시스템: XP 기반 레벨업
 */

// ============================================================
// 배지 카테고리 및 희귀도
// ============================================================

export type BadgeCategory = 'streak' | 'workout' | 'nutrition' | 'analysis' | 'special';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

// ============================================================
// 레벨 티어
// ============================================================

export type LevelTier = 'beginner' | 'practitioner' | 'expert' | 'master';

// ============================================================
// 배지 획득 조건 타입
// ============================================================

export interface StreakRequirement {
  type: 'streak';
  domain: 'workout' | 'nutrition';
  days: number;
}

export interface CountRequirement {
  type: 'count';
  domain: 'workout' | 'nutrition';
  sessions?: number;
  records?: number;
}

export interface BalanceRequirement {
  type: 'balance';
  domain: 'nutrition';
  days: number;
}

export interface WaterRequirement {
  type: 'water';
  domain: 'nutrition';
  days: number;
}

export interface AnalysisRequirement {
  type: 'complete';
  domain: 'analysis';
  module: 'personal-color' | 'skin' | 'body';
}

export type BadgeRequirement =
  | StreakRequirement
  | CountRequirement
  | BalanceRequirement
  | WaterRequirement
  | AnalysisRequirement;

// ============================================================
// 배지 타입
// ============================================================

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirement: BadgeRequirement;
  xpReward: number;
  sortOrder: number;
  createdAt: Date;
}

// ============================================================
// 사용자 배지 타입
// ============================================================

export interface UserBadge {
  id: string;
  clerkUserId: string;
  badgeId: string;
  earnedAt: Date;
  badge?: Badge; // 조인 시 포함
}

// ============================================================
// 사용자 레벨 타입
// ============================================================

export interface UserLevel {
  id: string;
  clerkUserId: string;
  level: number;
  currentXp: number;
  totalXp: number;
  tier: LevelTier;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// 레벨 정보 (UI 표시용)
// ============================================================

export interface LevelInfo {
  level: number;
  tier: LevelTier;
  tierName: string;        // 한국어 티어명
  currentXp: number;
  xpForNextLevel: number;  // 다음 레벨까지 필요한 총 XP
  xpProgress: number;      // 진행률 (0-100)
  totalXp: number;
}

// ============================================================
// 레벨업 결과
// ============================================================

export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  previousTier: LevelTier;
  newTier: LevelTier;
  tierChanged: boolean;
  xpGained: number;
  totalXp: number;
}

// ============================================================
// 배지 획득 결과
// ============================================================

export interface BadgeAwardResult {
  success: boolean;
  badge: Badge;
  alreadyOwned: boolean;
  xpAwarded: number;
  levelUpResult?: LevelUpResult;
}

// ============================================================
// DB Row 타입 (Supabase 응답용)
// ============================================================

export interface BadgeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  rarity: string;
  requirement: Record<string, unknown>;
  xp_reward: number;
  sort_order: number;
  created_at: string;
}

export interface UserBadgeRow {
  id: string;
  clerk_user_id: string;
  badge_id: string;
  earned_at: string;
  badges?: BadgeRow; // 조인 시
}

export interface UserLevelRow {
  id: string;
  clerk_user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  tier: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 변환 함수 시그니처
// ============================================================

export type BadgeRowToBadge = (row: BadgeRow) => Badge;
export type UserBadgeRowToUserBadge = (row: UserBadgeRow) => UserBadge;
export type UserLevelRowToUserLevel = (row: UserLevelRow) => UserLevel;

// ============================================================
// 배지 그룹 (카테고리별)
// ============================================================

export interface BadgeGroup {
  category: BadgeCategory;
  categoryName: string;  // 한국어 카테고리명
  badges: Badge[];
  earnedCount: number;
  totalCount: number;
}

// ============================================================
// 게이미피케이션 요약 (대시보드용)
// ============================================================

export interface GamificationSummary {
  level: LevelInfo;
  recentBadges: UserBadge[];  // 최근 획득 배지 3개
  totalBadges: number;
  earnedBadges: number;
}
