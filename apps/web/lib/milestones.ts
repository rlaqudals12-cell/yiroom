/**
 * 마일스톤 정의 및 체크 유틸리티
 * 부담 없는 긍정적 피드백만 제공
 */

export interface Milestone {
  id: string;
  type: 'workout' | 'nutrition' | 'closet' | 'personal_record';
  title: string;
  description: string;
  icon: string; // emoji
  threshold: number;
}

// 마일스톤 정의 (벌칙 없음, 축하만)
export const MILESTONES: Milestone[] = [
  // 운동 마일스톤
  {
    id: 'workout_10',
    type: 'workout',
    title: '운동 10회 달성!',
    description: '꾸준히 하고 계시네요',
    icon: '',
    threshold: 10,
  },
  {
    id: 'workout_25',
    type: 'workout',
    title: '운동 25회 달성!',
    description: '훌륭해요!',
    icon: '',
    threshold: 25,
  },
  {
    id: 'workout_50',
    type: 'workout',
    title: '운동 50회 달성!',
    description: '정말 대단해요!',
    icon: '',
    threshold: 50,
  },
  {
    id: 'workout_100',
    type: 'workout',
    title: '운동 100회 달성!',
    description: '운동 마스터!',
    icon: '',
    threshold: 100,
  },

  // 식단 기록 마일스톤
  {
    id: 'nutrition_10',
    type: 'nutrition',
    title: '식단 10회 기록!',
    description: '기록 습관이 생겼어요',
    icon: '',
    threshold: 10,
  },
  {
    id: 'nutrition_25',
    type: 'nutrition',
    title: '식단 25회 기록!',
    description: '꾸준히 관리 중!',
    icon: '',
    threshold: 25,
  },
  {
    id: 'nutrition_50',
    type: 'nutrition',
    title: '식단 50회 기록!',
    description: '영양 관리 프로!',
    icon: '',
    threshold: 50,
  },
  {
    id: 'nutrition_100',
    type: 'nutrition',
    title: '식단 100회 기록!',
    description: '건강 전문가!',
    icon: '',
    threshold: 100,
  },

  // 옷장 마일스톤
  {
    id: 'closet_10',
    type: 'closet',
    title: '옷 10벌 등록!',
    description: '멋진 옷장이 만들어지고 있어요',
    icon: '',
    threshold: 10,
  },
  {
    id: 'closet_25',
    type: 'closet',
    title: '옷 25벌 등록!',
    description: '스타일리스트 수준!',
    icon: '',
    threshold: 25,
  },
  {
    id: 'closet_50',
    type: 'closet',
    title: '옷 50벌 등록!',
    description: '패셔니스타!',
    icon: '',
    threshold: 50,
  },
];

/**
 * 현재 카운트로 달성한 새 마일스톤 찾기
 * @param type 마일스톤 유형
 * @param previousCount 이전 카운트
 * @param currentCount 현재 카운트
 * @returns 새로 달성한 마일스톤 (없으면 null)
 */
export function checkNewMilestone(
  type: Milestone['type'],
  previousCount: number,
  currentCount: number
): Milestone | null {
  const typeMilestones = MILESTONES.filter((m) => m.type === type);

  // 이전에는 미달성이었지만 현재는 달성한 마일스톤 찾기
  for (const milestone of typeMilestones) {
    if (previousCount < milestone.threshold && currentCount >= milestone.threshold) {
      return milestone;
    }
  }

  return null;
}

/**
 * 특정 카운트에 해당하는 가장 높은 마일스톤 가져오기
 */
export function getCurrentMilestone(type: Milestone['type'], count: number): Milestone | null {
  const typeMilestones = MILESTONES.filter((m) => m.type === type).sort(
    (a, b) => b.threshold - a.threshold
  );

  for (const milestone of typeMilestones) {
    if (count >= milestone.threshold) {
      return milestone;
    }
  }

  return null;
}

/**
 * 다음 마일스톤까지 남은 횟수
 */
export function getNextMilestoneProgress(
  type: Milestone['type'],
  count: number
): { next: Milestone; remaining: number } | null {
  const typeMilestones = MILESTONES.filter((m) => m.type === type).sort(
    (a, b) => a.threshold - b.threshold
  );

  for (const milestone of typeMilestones) {
    if (count < milestone.threshold) {
      return {
        next: milestone,
        remaining: milestone.threshold - count,
      };
    }
  }

  return null;
}
