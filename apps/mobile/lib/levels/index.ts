/**
 * 레벨 계산 모듈
 *
 * 활동 기반 레벨, 임계값, 보상 정의
 *
 * @module lib/levels
 */

// ─── 타입 ────────────────────────────────────────────

export interface ActivityLevel {
  category: ActivityCategory;
  level: number;
  xp: number;
  nextLevelXp: number;
  progress: number;
  title: string;
}

export type ActivityCategory =
  | 'analysis'
  | 'workout'
  | 'nutrition'
  | 'skincare'
  | 'social';

export interface LevelReward {
  level: number;
  reward: string;
  description: string;
  unlocked: boolean;
}

export interface LevelConfig {
  category: ActivityCategory;
  label: string;
  icon: string;
  xpPerAction: number;
  milestones: number[];
}

// ─── 카테고리별 설정 ──────────────────────────────────

export const LEVEL_CONFIGS: Record<ActivityCategory, LevelConfig> = {
  analysis: {
    category: 'analysis',
    label: 'AI 분석',
    icon: '🔬',
    xpPerAction: 100,
    milestones: [1, 5, 10, 25, 50, 100],
  },
  workout: {
    category: 'workout',
    label: '운동',
    icon: '💪',
    xpPerAction: 30,
    milestones: [1, 7, 14, 30, 60, 100],
  },
  nutrition: {
    category: 'nutrition',
    label: '영양',
    icon: '🥗',
    xpPerAction: 15,
    milestones: [1, 7, 14, 30, 60, 100],
  },
  skincare: {
    category: 'skincare',
    label: '스킨케어',
    icon: '✨',
    xpPerAction: 20,
    milestones: [1, 7, 14, 30, 60, 100],
  },
  social: {
    category: 'social',
    label: '소셜',
    icon: '👥',
    xpPerAction: 10,
    milestones: [1, 5, 10, 25, 50],
  },
};

// ─── 레벨 계산 ────────────────────────────────────────

/**
 * 카테고리 XP를 레벨로 변환
 *
 * 각 레벨 = 이전 레벨 XP × 1.5 (기하급수)
 * L1=100, L2=150, L3=225, L4=338, ...
 */
export function getCategoryLevel(xp: number, category: ActivityCategory): ActivityLevel {
  const config = LEVEL_CONFIGS[category];
  let level = 1;
  let accumulatedXp = 0;
  let currentLevelXp = config.xpPerAction * 3; // 기본 3회 활동으로 Lv.2

  while (accumulatedXp + currentLevelXp <= xp) {
    accumulatedXp += currentLevelXp;
    level++;
    currentLevelXp = Math.ceil(currentLevelXp * 1.5);
  }

  const xpInCurrentLevel = xp - accumulatedXp;
  const progress = Math.min(1, xpInCurrentLevel / currentLevelXp);

  return {
    category,
    level,
    xp,
    nextLevelXp: currentLevelXp - xpInCurrentLevel,
    progress,
    title: getCategoryTitle(category, level),
  };
}

/**
 * 카테고리 + 레벨에 따른 칭호
 */
export function getCategoryTitle(category: ActivityCategory, level: number): string {
  const titles: Record<ActivityCategory, Record<number, string>> = {
    analysis: {
      1: '관찰자',
      5: '분석가',
      10: '연구원',
      20: '뷰티 과학자',
      30: '전문 분석가',
    },
    workout: {
      1: '입문자',
      5: '운동 습관러',
      10: '피트니스 마니아',
      20: '운동 전문가',
      30: '철인',
    },
    nutrition: {
      1: '식단 초보',
      5: '균형 식단러',
      10: '영양 전문가',
      20: '식단 마스터',
      30: '영양사',
    },
    skincare: {
      1: '스킨케어 입문',
      5: '스킨케어 루틴러',
      10: '피부 전문가',
      20: '스킨케어 마스터',
      30: '피부과학자',
    },
    social: {
      1: '새내기',
      5: '활동가',
      10: '인플루언서',
      20: '커뮤니티 리더',
      30: '소셜 마스터',
    },
  };

  const categoryTitles = titles[category];
  let title = categoryTitles[1];

  for (const [threshold, label] of Object.entries(categoryTitles)) {
    if (level >= parseInt(threshold)) {
      title = label;
    }
  }

  return title;
}

// ─── 마일스톤 보상 ────────────────────────────────────

/**
 * 레벨 보상 목록 생성
 */
export function getLevelRewards(
  category: ActivityCategory,
  currentLevel: number
): LevelReward[] {
  const config = LEVEL_CONFIGS[category];
  return config.milestones.map((milestone) => ({
    level: milestone,
    reward: `${config.label} Lv.${milestone} 달성`,
    description: getRewardDescription(category, milestone),
    unlocked: currentLevel >= milestone,
  }));
}

function getRewardDescription(category: ActivityCategory, milestone: number): string {
  const descriptions: Record<ActivityCategory, Record<number, string>> = {
    analysis: {
      1: '첫 AI 분석을 완료했어요!',
      5: '5회 분석으로 패턴을 발견했어요',
      10: '10회 분석의 전문가예요',
      25: '25회 분석! 데이터가 축적되고 있어요',
      50: '50회 분석의 마스터!',
      100: '100회 달성! 진정한 뷰티 과학자',
    },
    workout: {
      1: '운동 시작이 반이에요!',
      7: '일주일 운동 완료!',
      14: '2주 운동 습관 형성 중',
      30: '한 달 운동! 몸이 변하고 있어요',
      60: '두 달 연속! 대단해요',
      100: '100일 운동의 철인!',
    },
    nutrition: {
      1: '첫 식단 기록!',
      7: '일주일 식단 관리',
      14: '2주 영양 관리 중',
      30: '한 달 균형 식단!',
      60: '두 달 영양 관리의 프로',
      100: '100일 영양 마스터!',
    },
    skincare: {
      1: '스킨케어 루틴 시작!',
      7: '일주일 루틴 완료',
      14: '피부가 좋아지고 있어요',
      30: '한 달 꾸준한 관리',
      60: '피부 전문가 수준이에요',
      100: '피부과학자 등극!',
    },
    social: {
      1: '커뮤니티에 참여했어요!',
      5: '활발한 소통 중',
      10: '인플루언서 자격 획득',
      25: '커뮤니티 리더!',
      50: '소셜 마스터!',
    },
  };

  return descriptions[category]?.[milestone] ?? `${milestone}회 달성!`;
}

// ─── 종합 레벨 ────────────────────────────────────────

/**
 * 모든 카테고리 레벨 요약
 */
export function getAllCategoryLevels(
  xpByCategory: Record<ActivityCategory, number>
): ActivityLevel[] {
  return (Object.keys(LEVEL_CONFIGS) as ActivityCategory[]).map((category) =>
    getCategoryLevel(xpByCategory[category] ?? 0, category)
  );
}

/**
 * 종합 레벨 (카테고리 평균)
 */
export function getOverallLevel(
  xpByCategory: Record<ActivityCategory, number>
): number {
  const levels = getAllCategoryLevels(xpByCategory);
  const sum = levels.reduce((acc, l) => acc + l.level, 0);
  return Math.round(sum / levels.length);
}
