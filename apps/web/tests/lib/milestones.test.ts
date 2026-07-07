/**
 * 마일스톤 추적 테스트
 *
 * @module tests/lib/milestones
 */

import { describe, it, expect } from 'vitest';

import {
  MILESTONES,
  checkNewMilestone,
  getCurrentMilestone,
  getNextMilestoneProgress,
} from '@/lib/milestones';

// ============================================================================
// MILESTONES 상수
// ============================================================================

describe('MILESTONES', () => {
  it('운동, 영양, 옷장 마일스톤이 모두 존재한다', () => {
    const types = new Set(MILESTONES.map((m) => m.type));
    expect(types.has('workout')).toBe(true);
    expect(types.has('nutrition')).toBe(true);
    expect(types.has('closet')).toBe(true);
  });

  it('각 마일스톤에 필수 필드가 있다', () => {
    for (const milestone of MILESTONES) {
      expect(milestone.id).toBeTruthy();
      expect(milestone.type).toBeTruthy();
      expect(milestone.title).toBeTruthy();
      expect(milestone.description).toBeTruthy();
      // 데모 폴리시(2026-06)로 이모지 아이콘이 의도적으로 빈 문자열 처리됨 — 타입만 검증
      expect(typeof milestone.icon).toBe('string');
      expect(milestone.threshold).toBeGreaterThan(0);
    }
  });

  it('운동 마일스톤은 10, 25, 50, 100 기준이다', () => {
    const workoutThresholds = MILESTONES.filter((m) => m.type === 'workout').map(
      (m) => m.threshold
    );
    expect(workoutThresholds).toEqual([10, 25, 50, 100]);
  });

  it('영양 마일스톤은 10, 25, 50, 100 기준이다', () => {
    const nutritionThresholds = MILESTONES.filter((m) => m.type === 'nutrition').map(
      (m) => m.threshold
    );
    expect(nutritionThresholds).toEqual([10, 25, 50, 100]);
  });

  it('옷장 마일스톤은 10, 25, 50 기준이다', () => {
    const closetThresholds = MILESTONES.filter((m) => m.type === 'closet').map((m) => m.threshold);
    expect(closetThresholds).toEqual([10, 25, 50]);
  });
});

// ============================================================================
// checkNewMilestone
// ============================================================================

describe('checkNewMilestone', () => {
  describe('정상 케이스', () => {
    it('새 마일스톤 달성 시 해당 마일스톤을 반환한다', () => {
      const result = checkNewMilestone('workout', 9, 10);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('workout_10');
      expect(result!.threshold).toBe(10);
    });

    it('정확히 threshold에 도달하면 마일스톤을 반환한다', () => {
      const result = checkNewMilestone('nutrition', 24, 25);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('nutrition_25');
    });

    it('threshold를 초과해도 마일스톤을 반환한다', () => {
      const result = checkNewMilestone('closet', 8, 12);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('closet_10');
    });
  });

  describe('마일스톤 미달성', () => {
    it('이전과 현재 모두 threshold 미만이면 null을 반환한다', () => {
      const result = checkNewMilestone('workout', 5, 8);

      expect(result).toBeNull();
    });

    it('이전에 이미 달성한 마일스톤은 null을 반환한다', () => {
      const result = checkNewMilestone('workout', 10, 15);

      expect(result).toBeNull();
    });

    it('카운트가 감소해도 null을 반환한다', () => {
      const result = checkNewMilestone('workout', 15, 5);

      expect(result).toBeNull();
    });
  });

  describe('엣지 케이스', () => {
    it('0에서 10으로 증가 시 마일스톤을 반환한다', () => {
      const result = checkNewMilestone('workout', 0, 10);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('workout_10');
    });

    it('존재하지 않는 마일스톤 타입의 필터링이 작동한다', () => {
      const result = checkNewMilestone('personal_record', 0, 100);

      // personal_record 타입 마일스톤은 MILESTONES에 없으므로 null
      expect(result).toBeNull();
    });

    it('동일한 카운트에서는 null을 반환한다', () => {
      const result = checkNewMilestone('workout', 10, 10);

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// getCurrentMilestone
// ============================================================================

describe('getCurrentMilestone', () => {
  describe('정상 케이스', () => {
    it('가장 높은 달성 마일스톤을 반환한다', () => {
      const result = getCurrentMilestone('workout', 55);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('workout_50');
    });

    it('정확히 threshold와 같으면 해당 마일스톤을 반환한다', () => {
      const result = getCurrentMilestone('workout', 25);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('workout_25');
    });

    it('최고 마일스톤 이상이면 최고를 반환한다', () => {
      const result = getCurrentMilestone('workout', 200);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('workout_100');
    });
  });

  describe('마일스톤 미달성', () => {
    it('최소 threshold 미만이면 null을 반환한다', () => {
      const result = getCurrentMilestone('workout', 5);

      expect(result).toBeNull();
    });

    it('카운트 0이면 null을 반환한다', () => {
      const result = getCurrentMilestone('nutrition', 0);

      expect(result).toBeNull();
    });
  });
});

// ============================================================================
// getNextMilestoneProgress
// ============================================================================

describe('getNextMilestoneProgress', () => {
  describe('정상 케이스', () => {
    it('다음 마일스톤까지 남은 횟수를 반환한다', () => {
      const result = getNextMilestoneProgress('workout', 7);

      expect(result).not.toBeNull();
      expect(result!.next.id).toBe('workout_10');
      expect(result!.remaining).toBe(3);
    });

    it('첫 마일스톤 달성 후 두 번째 마일스톤을 가리킨다', () => {
      const result = getNextMilestoneProgress('workout', 15);

      expect(result).not.toBeNull();
      expect(result!.next.id).toBe('workout_25');
      expect(result!.remaining).toBe(10);
    });

    it('0에서 시작하면 첫 마일스톤까지의 거리를 반환한다', () => {
      const result = getNextMilestoneProgress('closet', 0);

      expect(result).not.toBeNull();
      expect(result!.next.threshold).toBe(10);
      expect(result!.remaining).toBe(10);
    });
  });

  describe('모든 마일스톤 달성', () => {
    it('최고 마일스톤 이상이면 null을 반환한다', () => {
      const result = getNextMilestoneProgress('workout', 100);

      expect(result).toBeNull();
    });

    it('옷장 최고(50) 이상이면 null을 반환한다', () => {
      const result = getNextMilestoneProgress('closet', 60);

      expect(result).toBeNull();
    });
  });

  describe('경계값', () => {
    it('threshold 바로 직전이면 remaining=1이다', () => {
      const result = getNextMilestoneProgress('workout', 9);

      expect(result).not.toBeNull();
      expect(result!.remaining).toBe(1);
    });

    it('threshold 정확히 도달하면 다음으로 넘어간다', () => {
      const result = getNextMilestoneProgress('workout', 10);

      expect(result).not.toBeNull();
      expect(result!.next.id).toBe('workout_25');
    });
  });
});
