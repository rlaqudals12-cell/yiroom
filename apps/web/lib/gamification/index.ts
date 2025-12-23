/**
 * 게이미피케이션 시스템 통합 export
 */

// 상수 및 계산 함수
export {
  // XP/레벨 계산
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromTotalXp,
  getLevelProgress,
  calculateLevelInfo,

  // 티어
  getTierForLevel,

  // 표시 상수
  TIER_NAMES,
  TIER_COLORS,
  TIER_GRADIENT,
  CATEGORY_NAMES,
  CATEGORY_ICONS,
  RARITY_NAMES,
  RARITY_COLORS,

  // XP 보상
  DEFAULT_XP_REWARDS,

  // 스트릭 마일스톤
  STREAK_MILESTONES,
  getNewMilestones,
  type StreakMilestone,
} from './constants';

// 배지 함수
export {
  // 변환
  badgeRowToBadge,
  userBadgeRowToUserBadge,

  // 조회
  getAllBadges,
  getBadgesByCategory,
  getBadgeByCode,
  getUserBadges,
  getRecentBadges,
  hasBadge,

  // 부여
  awardBadge,
  awardBadgeById,

  // 그룹화
  groupBadgesByCategory,
  getBadgeStats,
} from './badges';

// 레벨 함수
export {
  // 변환
  userLevelRowToUserLevel,

  // 조회
  getUserLevel,
  getUserLevelInfo,

  // XP 추가
  addXp,
  awardBadgeXp,
  addWorkoutXp,
  addMealRecordXp,
  addWaterGoalXp,

  // 유틸리티
  didLevelUp,
  didTierChange,
  getLevelUpMessage,
} from './levels';

// 스트릭 통합
export {
  // 배지 코드
  getStreakBadgeCode,

  // 스트릭 배지
  checkAndAwardStreakBadges,
  awardStreakBadge,

  // 마일스톤
  getDaysToNextMilestone,
  getNextMilestoneInfo,

  // 분석 배지
  awardAnalysisBadge,
  checkAndAwardAllAnalysisBadge,

  // 활동 배지
  checkFirstWorkoutBadge,
  checkWorkoutCountBadges,
  checkFirstNutritionBadge,
} from './streak-integration';

// 타입 re-export
export type {
  Badge,
  UserBadge,
  UserLevel,
  BadgeCategory,
  BadgeRarity,
  LevelTier,
  LevelInfo,
  LevelUpResult,
  BadgeAwardResult,
  BadgeGroup,
  GamificationSummary,
  BadgeRequirement,
} from '@/types/gamification';
