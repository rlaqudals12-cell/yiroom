/**
 * 크로스도메인 챌린지 시스템
 * @description 뷰티+운동+영양+웰니스를 조합한 멀티도메인 챌린지 정의 및 진행 추적
 * @see apps/web/lib/gamification/cross-domain-challenges.ts (웹 원본)
 */

// ============================================
// 타입
// ============================================

/** 크로스도메인에 참여하는 도메인 종류 */
export type CrossChallengeDomain = 'beauty' | 'workout' | 'nutrition' | 'wellness';

/** 챌린지 난이도 */
export type CrossChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** 도메인별 요구 조건 */
export interface DomainRequirement {
  domain: CrossChallengeDomain;
  /** 필요 횟수 */
  count: number;
  /** 활동 라벨 (UI 표시용) */
  label: string;
}

/** 크로스도메인 챌린지 정의 */
export interface CrossDomainChallengeDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: CrossChallengeDifficulty;
  /** 전체 목표 수 (requirements의 count 합계) */
  targetCount: number;
  /** XP 보상 */
  xpReward: number;
  /** 참여 조건 (최소 레벨) */
  minLevel: number;
  /** 기간 (일) */
  durationDays: number;
  /** 도메인별 세부 요구 조건 */
  requirements: DomainRequirement[];
}

/** 도메인별 진행 현황 */
export interface DomainProgress {
  domain: CrossChallengeDomain;
  current: number;
  target: number;
  /** 달성 여부 */
  completed: boolean;
}

/** 크로스도메인 챌린지 진행 뷰 */
export interface CrossDomainProgressView {
  challengeId: string;
  name: string;
  description: string;
  /** 도메인별 진행 */
  domainProgress: DomainProgress[];
  /** 전체 진행률 (0-100) */
  overallPercent: number;
  /** 모든 도메인 달성 여부 */
  allCompleted: boolean;
  /** 총 XP 보상 */
  xpReward: number;
}

// ============================================
// XP 계산 (웹의 calculateChallengeXp 인라인)
// ============================================

const DIFFICULTY_MULTIPLIER: Record<CrossChallengeDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

/** 난이도별 XP 보상 계산 */
function calculateXp(difficulty: CrossChallengeDifficulty, baseXp: number = 50): number {
  return baseXp * DIFFICULTY_MULTIPLIER[difficulty];
}

// ============================================
// 크로스도메인 챌린지 정의 (웹과 동일한 5종)
// ============================================

export const CROSS_DOMAIN_CHALLENGES: CrossDomainChallengeDefinition[] = [
  // 입문: 각 도메인 1회씩
  {
    id: 'cross-triple-start',
    name: '트리플 스타트',
    description: '뷰티 분석, 운동, 식단 기록을 각 1회 완료하세요.',
    difficulty: 'easy',
    targetCount: 3,
    xpReward: calculateXp('easy', 75),
    minLevel: 1,
    durationDays: 7,
    requirements: [
      { domain: 'beauty', count: 1, label: '뷰티 분석' },
      { domain: 'workout', count: 1, label: '운동 기록' },
      { domain: 'nutrition', count: 1, label: '식단 기록' },
    ],
  },

  // 주간 균형 챌린지
  {
    id: 'cross-weekly-balance',
    name: '주간 균형 케어',
    description: '일주일간 운동 3회 + 식단 5회 + 스킨케어 기록 3회를 완료하세요.',
    difficulty: 'medium',
    targetCount: 11,
    xpReward: calculateXp('medium', 100),
    minLevel: 3,
    durationDays: 7,
    requirements: [
      { domain: 'workout', count: 3, label: '운동 3회' },
      { domain: 'nutrition', count: 5, label: '식단 5회' },
      { domain: 'beauty', count: 3, label: '스킨케어 3회' },
    ],
  },

  // 뷰티+영양 연계
  {
    id: 'cross-beauty-nutrition',
    name: '안팎으로 케어',
    description: '피부 분석 1회 + 7일 식단 기록으로 내외 케어를 완성하세요.',
    difficulty: 'medium',
    targetCount: 8,
    xpReward: calculateXp('medium', 100),
    minLevel: 2,
    durationDays: 14,
    requirements: [
      { domain: 'beauty', count: 1, label: '피부 분석' },
      { domain: 'nutrition', count: 7, label: '식단 7일' },
    ],
  },

  // 운동+웰니스 연계
  {
    id: 'cross-active-wellness',
    name: '활력 웰니스',
    description: '운동 5회 + 웰니스 체크 3회로 몸과 마음을 챙기세요.',
    difficulty: 'medium',
    targetCount: 8,
    xpReward: calculateXp('medium', 100),
    minLevel: 3,
    durationDays: 14,
    requirements: [
      { domain: 'workout', count: 5, label: '운동 5회' },
      { domain: 'wellness', count: 3, label: '웰니스 체크 3회' },
    ],
  },

  // 종합 마스터 (hard)
  {
    id: 'cross-total-care-master',
    name: '토탈 케어 마스터',
    description: '한 달간 뷰티 5회 + 운동 12회 + 식단 20회 + 웰니스 4회를 달성하세요.',
    difficulty: 'hard',
    targetCount: 41,
    xpReward: calculateXp('hard', 150),
    minLevel: 5,
    durationDays: 30,
    requirements: [
      { domain: 'beauty', count: 5, label: '뷰티 5회' },
      { domain: 'workout', count: 12, label: '운동 12회' },
      { domain: 'nutrition', count: 20, label: '식단 20회' },
      { domain: 'wellness', count: 4, label: '웰니스 4회' },
    ],
  },
];

// ============================================
// 진행률 계산
// ============================================

/**
 * 도메인별 활동 횟수로 크로스도메인 챌린지 진행률 계산
 */
export function calculateCrossDomainProgress(
  challenge: CrossDomainChallengeDefinition,
  activityCounts: Partial<Record<CrossChallengeDomain, number>>
): DomainProgress[] {
  return challenge.requirements.map((req) => {
    const current = Math.min(activityCounts[req.domain] ?? 0, req.count);
    return {
      domain: req.domain,
      current,
      target: req.count,
      completed: current >= req.count,
    };
  });
}

/**
 * 크로스도메인 챌린지 전체 진행률 (0-100)
 */
export function calculateOverallProgress(domainProgress: DomainProgress[]): number {
  if (domainProgress.length === 0) return 0;

  const totalTarget = domainProgress.reduce((sum, dp) => sum + dp.target, 0);
  if (totalTarget === 0) return 100;

  const totalCurrent = domainProgress.reduce((sum, dp) => sum + dp.current, 0);
  return Math.min(100, Math.round((totalCurrent / totalTarget) * 100));
}

/**
 * 크로스도메인 챌린지 진행 뷰 생성
 */
export function buildCrossDomainView(
  challenge: CrossDomainChallengeDefinition,
  activityCounts: Partial<Record<CrossChallengeDomain, number>>
): CrossDomainProgressView {
  const domainProgress = calculateCrossDomainProgress(challenge, activityCounts);
  const overallPercent = calculateOverallProgress(domainProgress);
  const allCompleted = domainProgress.every((dp) => dp.completed);

  return {
    challengeId: challenge.id,
    name: challenge.name,
    description: challenge.description,
    domainProgress,
    overallPercent,
    allCompleted,
    xpReward: challenge.xpReward,
  };
}

/**
 * ID로 크로스도메인 챌린지 조회
 */
export function getCrossDomainChallengeById(
  id: string
): CrossDomainChallengeDefinition | undefined {
  return CROSS_DOMAIN_CHALLENGES.find((c) => c.id === id);
}

/**
 * 레벨에 맞는 크로스도메인 챌린지 필터
 */
export function getAvailableCrossDomainChallenges(
  userLevel: number,
  completedIds: string[] = []
): CrossDomainChallengeDefinition[] {
  return CROSS_DOMAIN_CHALLENGES.filter(
    (c) => c.minLevel <= userLevel && !completedIds.includes(c.id)
  );
}

/**
 * 미완료 도메인 안내 메시지 생성
 */
export function getIncompleteDomainMessages(domainProgress: DomainProgress[]): string[] {
  return domainProgress
    .filter((dp) => !dp.completed)
    .map((dp) => {
      const remaining = dp.target - dp.current;
      const domainLabel = DOMAIN_LABELS[dp.domain];
      return `${domainLabel} ${remaining}회 더 필요해요.`;
    });
}

// ============================================
// 상수
// ============================================

export const DOMAIN_LABELS: Record<CrossChallengeDomain, string> = {
  beauty: '뷰티',
  workout: '운동',
  nutrition: '식단',
  wellness: '웰니스',
};

/** 도메인별 색상 (React Native용 hex) */
export const DOMAIN_COLORS: Record<CrossChallengeDomain, string> = {
  beauty: '#ec4899',
  workout: '#f97316',
  nutrition: '#22c55e',
  wellness: '#a855f7',
};

/** 도메인별 배경 색상 */
export const DOMAIN_BG_COLORS: Record<CrossChallengeDomain, string> = {
  beauty: '#fce7f3',
  workout: '#fff7ed',
  nutrition: '#f0fdf4',
  wellness: '#faf5ff',
};

/** 난이도별 설정 */
export const DIFFICULTY_CONFIG: Record<
  CrossChallengeDifficulty,
  { label: string; color: string; bgColor: string }
> = {
  easy: { label: '입문', color: '#15803d', bgColor: '#dcfce7' },
  medium: { label: '보통', color: '#1d4ed8', bgColor: '#dbeafe' },
  hard: { label: '고급', color: '#dc2626', bgColor: '#fee2e2' },
};
