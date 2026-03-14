/**
 * 챌린지 진행 시스템
 * @description 크로스 도메인 챌린지 정의, 진행률 계산, XP 보상
 */

// ============================================
// 타입
// ============================================

/** 챌린지 도메인 */
export type ChallengeDomain = 'beauty' | 'workout' | 'nutrition' | 'wellness' | 'cross';

/** 챌린지 난이도 */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** 챌린지 상태 */
export type ChallengeStatus = 'locked' | 'active' | 'completed' | 'expired';

/** 챌린지 정의 */
export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  domain: ChallengeDomain;
  difficulty: ChallengeDifficulty;
  /** 목표 수 */
  targetCount: number;
  /** XP 보상 */
  xpReward: number;
  /** 참여 조건 (최소 레벨) */
  minLevel: number;
  /** 기간 (일), 0이면 무기한 */
  durationDays: number;
}

/** 챌린지 진행 */
export interface ChallengeProgress {
  challengeId: string;
  currentCount: number;
  status: ChallengeStatus;
  startedAt: Date | null;
  completedAt: Date | null;
}

/** 챌린지 + 진행 통합 */
export interface ChallengeWithProgress {
  definition: ChallengeDefinition;
  progress: ChallengeProgress;
  /** 진행률 (0~100) */
  progressPercent: number;
  /** 남은 일수 (무기한이면 null) */
  remainingDays: number | null;
}

// ============================================
// 챌린지 정의 DB
// ============================================

/** 난이도별 XP 배율 */
const DIFFICULTY_MULTIPLIER: Record<ChallengeDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/**
 * 난이도별 XP 보상 계산
 */
export function calculateChallengeXp(difficulty: ChallengeDifficulty, baseXp: number = 50): number {
  return baseXp * DIFFICULTY_MULTIPLIER[difficulty];
}

/** 기본 챌린지 목록 */
export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  // 뷰티
  {
    id: 'beauty-first-analysis',
    name: '첫 분석 도전',
    description: '피부, 퍼스널컬러, 체형 분석 중 1개를 완료하세요.',
    domain: 'beauty',
    difficulty: 'easy',
    targetCount: 1,
    xpReward: calculateChallengeXp('easy'),
    minLevel: 1,
    durationDays: 0,
  },
  {
    id: 'beauty-analysis-trio',
    name: '뷰티 분석 트리오',
    description: '피부, 퍼스널컬러, 체형 분석을 모두 완료하세요.',
    domain: 'beauty',
    difficulty: 'medium',
    targetCount: 3,
    xpReward: calculateChallengeXp('medium'),
    minLevel: 1,
    durationDays: 30,
  },
  {
    id: 'beauty-routine-7days',
    name: '7일 스킨케어 루틴',
    description: '7일 연속 스킨케어 루틴을 기록하세요.',
    domain: 'beauty',
    difficulty: 'medium',
    targetCount: 7,
    xpReward: calculateChallengeXp('medium'),
    minLevel: 3,
    durationDays: 14,
  },

  // 운동
  {
    id: 'workout-first',
    name: '첫 운동 기록',
    description: '운동을 1회 기록하세요.',
    domain: 'workout',
    difficulty: 'easy',
    targetCount: 1,
    xpReward: calculateChallengeXp('easy'),
    minLevel: 1,
    durationDays: 0,
  },
  {
    id: 'workout-weekly-3',
    name: '주 3회 운동',
    description: '일주일에 3회 이상 운동을 기록하세요.',
    domain: 'workout',
    difficulty: 'medium',
    targetCount: 3,
    xpReward: calculateChallengeXp('medium'),
    minLevel: 2,
    durationDays: 7,
  },
  {
    id: 'workout-monthly-master',
    name: '운동 마스터',
    description: '한 달에 20회 이상 운동을 기록하세요.',
    domain: 'workout',
    difficulty: 'hard',
    targetCount: 20,
    xpReward: calculateChallengeXp('hard'),
    minLevel: 5,
    durationDays: 30,
  },

  // 영양
  {
    id: 'nutrition-first-meal',
    name: '첫 식단 기록',
    description: '식단을 1회 기록하세요.',
    domain: 'nutrition',
    difficulty: 'easy',
    targetCount: 1,
    xpReward: calculateChallengeXp('easy'),
    minLevel: 1,
    durationDays: 0,
  },
  {
    id: 'nutrition-weekly-log',
    name: '일주일 식단 기록',
    description: '7일 연속 식단을 기록하세요.',
    domain: 'nutrition',
    difficulty: 'medium',
    targetCount: 7,
    xpReward: calculateChallengeXp('medium'),
    minLevel: 2,
    durationDays: 10,
  },
  {
    id: 'nutrition-water-14days',
    name: '2주 수분 챌린지',
    description: '14일 연속 수분 목표를 달성하세요.',
    domain: 'nutrition',
    difficulty: 'hard',
    targetCount: 14,
    xpReward: calculateChallengeXp('hard'),
    minLevel: 5,
    durationDays: 21,
  },

  // 크로스 도메인
  {
    id: 'cross-wellness-starter',
    name: '웰니스 스타터',
    description: '운동, 식단, 뷰티 분석을 각 1회씩 완료하세요.',
    domain: 'cross',
    difficulty: 'medium',
    targetCount: 3,
    xpReward: calculateChallengeXp('medium', 75),
    minLevel: 1,
    durationDays: 14,
  },
  {
    id: 'cross-30day-streak',
    name: '30일 종합 스트릭',
    description: '30일 연속 아무 활동(운동/식단/분석)을 기록하세요.',
    domain: 'cross',
    difficulty: 'hard',
    targetCount: 30,
    xpReward: calculateChallengeXp('hard', 100),
    minLevel: 5,
    durationDays: 45,
  },
];

// ============================================
// 진행률 계산
// ============================================

/**
 * 챌린지 진행률 계산 (0~100)
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * 챌린지 남은 일수 계산
 */
export function calculateRemainingDays(
  startedAt: Date | null,
  durationDays: number,
  now: Date = new Date()
): number | null {
  if (durationDays === 0) return null; // 무기한
  if (!startedAt) return durationDays;

  const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, durationDays - elapsed);
}

/**
 * 챌린지 만료 여부 확인
 */
export function isChallengeExpired(
  startedAt: Date | null,
  durationDays: number,
  now: Date = new Date()
): boolean {
  const remaining = calculateRemainingDays(startedAt, durationDays, now);
  if (remaining === null) return false; // 무기한은 만료 없음
  return remaining <= 0;
}

/**
 * 챌린지 상태 결정
 */
export function determineChallengeStatus(
  progress: ChallengeProgress,
  definition: ChallengeDefinition,
  userLevel: number,
  now: Date = new Date()
): ChallengeStatus {
  if (progress.completedAt) return 'completed';
  if (userLevel < definition.minLevel) return 'locked';
  if (progress.startedAt && isChallengeExpired(progress.startedAt, definition.durationDays, now)) {
    return 'expired';
  }
  return 'active';
}

// ============================================
// 챌린지 조회
// ============================================

/**
 * 레벨에 맞는 참여 가능한 챌린지 필터
 */
export function getAvailableChallenges(
  userLevel: number,
  completedIds: string[] = []
): ChallengeDefinition[] {
  return CHALLENGE_DEFINITIONS.filter(
    (c) => c.minLevel <= userLevel && !completedIds.includes(c.id)
  );
}

/**
 * 도메인별 챌린지 필터
 */
export function getChallengesByDomain(domain: ChallengeDomain): ChallengeDefinition[] {
  return CHALLENGE_DEFINITIONS.filter((c) => c.domain === domain);
}

/**
 * 챌린지+진행 통합 뷰 생성
 */
export function buildChallengeView(
  definition: ChallengeDefinition,
  progress: ChallengeProgress,
  userLevel: number,
  now: Date = new Date()
): ChallengeWithProgress {
  const status = determineChallengeStatus(progress, definition, userLevel, now);
  const progressPercent = calculateProgress(progress.currentCount, definition.targetCount);
  const remainingDays = calculateRemainingDays(progress.startedAt, definition.durationDays, now);

  return {
    definition,
    progress: { ...progress, status },
    progressPercent,
    remainingDays,
  };
}

/**
 * 챌린지 완료 시 XP 보상 계산 (레벨 보너스 포함)
 */
export function getChallengeRewardXp(definition: ChallengeDefinition, userLevel: number): number {
  // 레벨 10 이상이면 +10% 보너스
  const levelBonus = userLevel >= 10 ? 1.1 : 1.0;
  return Math.round(definition.xpReward * levelBonus);
}

/**
 * 난이도별 챌린지 수 통계
 */
export function getChallengeDifficultyStats(): Record<ChallengeDifficulty, number> {
  const stats: Record<ChallengeDifficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };
  for (const c of CHALLENGE_DEFINITIONS) {
    stats[c.difficulty]++;
  }
  return stats;
}
