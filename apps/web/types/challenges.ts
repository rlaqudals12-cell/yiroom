/**
 * 챌린지 시스템 타입 정의
 * Phase H Sprint 4: 챌린지 시스템 구현
 */

// ============================================================
// 챌린지 기본 타입
// ============================================================

/** 챌린지 도메인 */
export type ChallengeDomain = 'workout' | 'nutrition' | 'skin' | 'combined';

/** 챌린지 난이도 */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** 챌린지 상태 */
export type ChallengeStatus = 'in_progress' | 'completed' | 'failed' | 'abandoned';

// ============================================================
// 챌린지 목표 타입 (JSONB target 필드)
// ============================================================

/** 스트릭 기반 목표 */
export interface StreakTarget {
  type: 'streak';
  days: number;
}

/** 횟수 기반 목표 */
export interface CountTarget {
  type: 'count';
  workouts?: number;
  meals?: number;
  waterCups?: number;
}

/** 일일 목표 */
export interface DailyTarget {
  type: 'daily';
  waterCups?: number;
  calorieGoal?: boolean;
  proteinGoal?: boolean;
}

/** 복합 목표 */
export interface CombinedTarget {
  type: 'combined';
  workout?: boolean;
  nutrition?: boolean;
  water?: boolean;
}

/** 챌린지 목표 통합 타입 */
export type ChallengeTarget = StreakTarget | CountTarget | DailyTarget | CombinedTarget;

// ============================================================
// 챌린지 엔티티
// ============================================================

/** 챌린지 */
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
  rewardBadgeId: string | null;
  difficulty: ChallengeDifficulty;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// ============================================================
// 진행 상황 타입
// ============================================================

/** 챌린지 진행 상황 */
export interface ChallengeProgress {
  /** 현재 연속 일수 (스트릭) */
  currentDays?: number;
  /** 목표 일수 */
  totalDays?: number;
  /** 완료한 날짜 목록 (1-based day index) */
  completedDays?: number[];
  /** 실패한 날짜 목록 */
  missedDays?: number[];
  /** 완료한 횟수 (count 타입) */
  completedCount?: number;
  /** 진행률 (0-100) */
  percentage?: number;
  /** 마지막 활동 날짜 */
  lastActivityDate?: string;
}

// ============================================================
// 사용자 챌린지
// ============================================================

/** 사용자 챌린지 참여 */
export interface UserChallenge {
  id: string;
  clerkUserId: string;
  challengeId: string;
  status: ChallengeStatus;
  startedAt: Date;
  targetEndAt: Date;
  completedAt: Date | null;
  progress: ChallengeProgress;
  rewardClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** 조인 시 포함 */
  challenge?: Challenge;
}

// ============================================================
// DB Row 타입 (Supabase 응답용)
// ============================================================

/** challenges 테이블 Row */
export interface ChallengeRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  domain: string;
  duration_days: number;
  target: Record<string, unknown>;
  reward_xp: number;
  reward_badge_id: string | null;
  difficulty: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

/** user_challenges 테이블 Row */
export interface UserChallengeRow {
  id: string;
  clerk_user_id: string;
  challenge_id: string;
  status: string;
  started_at: string;
  target_end_at: string;
  completed_at: string | null;
  progress: Record<string, unknown>;
  reward_claimed: boolean;
  created_at: string;
  updated_at: string;
  /** 조인 시 포함 */
  challenges?: ChallengeRow;
}

// ============================================================
// 변환 함수 시그니처
// ============================================================

export type ChallengeRowToChallenge = (row: ChallengeRow) => Challenge;
export type UserChallengeRowToUserChallenge = (row: UserChallengeRow) => UserChallenge;

// ============================================================
// API 응답 타입
// ============================================================

/** 챌린지 참여 결과 */
export interface JoinChallengeResult {
  success: boolean;
  userChallenge?: UserChallenge;
  message?: string;
  error?: string;
}

/** 챌린지 완료 결과 */
export interface CompleteChallengeResult {
  success: boolean;
  xpAwarded?: number;
  badgeAwarded?: {
    id: string;
    name: string;
    icon: string;
  };
  error?: string;
}

/** 챌린지 진행 업데이트 결과 */
export interface UpdateProgressResult {
  success: boolean;
  progress: ChallengeProgress;
  isCompleted: boolean;
}

// ============================================================
// UI 표시용 상수
// ============================================================

/** 도메인별 이름 */
export const DOMAIN_NAMES: Record<ChallengeDomain, string> = {
  workout: '운동',
  nutrition: '영양',
  skin: '피부',
  combined: '복합',
};

/** 도메인별 색상 */
export const DOMAIN_COLORS: Record<ChallengeDomain, { bg: string; text: string; border: string }> = {
  workout: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
  },
  nutrition: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  skin: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    border: 'border-pink-300',
  },
  combined: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },
};

/** 난이도별 이름 */
export const DIFFICULTY_NAMES: Record<ChallengeDifficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

/** 난이도별 색상 */
export const DIFFICULTY_COLORS: Record<ChallengeDifficulty, { bg: string; text: string }> = {
  easy: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  hard: {
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
};

/** 상태별 이름 */
export const STATUS_NAMES: Record<ChallengeStatus, string> = {
  in_progress: '진행 중',
  completed: '완료',
  failed: '실패',
  abandoned: '포기',
};
