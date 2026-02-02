/**
 * 스트릭 통합 테스트
 *
 * @module tests/lib/gamification/streak-integration
 * @description 스트릭 배지 코드 생성, 마일스톤 계산 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getStreakBadgeCode,
  getDaysToNextMilestone,
  getNextMilestoneInfo,
} from '@/lib/gamification/streak-integration';
import { STREAK_MILESTONES } from '@/lib/gamification/constants';

describe('lib/gamification/streak-integration', () => {
  // =========================================
  // getStreakBadgeCode 테스트
  // =========================================

  describe('getStreakBadgeCode', () => {
    it('운동 7일 스트릭 배지 코드를 생성한다', () => {
      expect(getStreakBadgeCode('workout', 7)).toBe('workout_streak_7day');
    });

    it('운동 30일 스트릭 배지 코드를 생성한다', () => {
      expect(getStreakBadgeCode('workout', 30)).toBe('workout_streak_30day');
    });

    it('운동 100일 스트릭 배지 코드를 생성한다', () => {
      expect(getStreakBadgeCode('workout', 100)).toBe('workout_streak_100day');
    });

    it('영양 7일 스트릭 배지 코드를 생성한다', () => {
      expect(getStreakBadgeCode('nutrition', 7)).toBe('nutrition_streak_7day');
    });

    it('영양 30일 스트릭 배지 코드를 생성한다', () => {
      expect(getStreakBadgeCode('nutrition', 30)).toBe('nutrition_streak_30day');
    });

    it('영양 100일 스트릭 배지 코드를 생성한다', () => {
      expect(getStreakBadgeCode('nutrition', 100)).toBe('nutrition_streak_100day');
    });
  });

  // =========================================
  // getDaysToNextMilestone 테스트
  // =========================================

  describe('getDaysToNextMilestone', () => {
    it('스트릭 0에서 다음 마일스톤까지 남은 일수를 계산한다', () => {
      const firstMilestone = STREAK_MILESTONES[0];
      expect(getDaysToNextMilestone(0)).toBe(firstMilestone);
    });

    it('스트릭 5에서 7일 마일스톤까지 2일 남았다', () => {
      expect(getDaysToNextMilestone(5)).toBe(2);
    });

    it('스트릭 7에서 다음 마일스톤까지 남은 일수를 계산한다', () => {
      // 7일 달성 후, 다음 마일스톤으로 이동
      const result = getDaysToNextMilestone(7);
      expect(result).toBeGreaterThan(0);
    });

    it('스트릭 25에서 30일 마일스톤까지 5일 남았다', () => {
      expect(getDaysToNextMilestone(25)).toBe(5);
    });

    it('스트릭 90에서 100일 마일스톤까지 10일 남았다', () => {
      expect(getDaysToNextMilestone(90)).toBe(10);
    });

    it('최대 마일스톤 달성 후에는 null을 반환한다', () => {
      const maxMilestone = Math.max(...STREAK_MILESTONES);
      expect(getDaysToNextMilestone(maxMilestone)).toBeNull();
      expect(getDaysToNextMilestone(maxMilestone + 100)).toBeNull();
    });

    it('마일스톤 직전 값에서 1을 반환한다', () => {
      const firstMilestone = STREAK_MILESTONES[0];
      expect(getDaysToNextMilestone(firstMilestone - 1)).toBe(1);
    });
  });

  // =========================================
  // getNextMilestoneInfo 테스트
  // =========================================

  describe('getNextMilestoneInfo', () => {
    it('운동 도메인에서 다음 마일스톤 정보를 반환한다', () => {
      const info = getNextMilestoneInfo('workout', 5);

      expect(info).not.toBeNull();
      expect(info?.milestone).toBe(7);
      expect(info?.daysLeft).toBe(2);
      expect(info?.badgeCode).toBe('workout_streak_7day');
    });

    it('영양 도메인에서 다음 마일스톤 정보를 반환한다', () => {
      const info = getNextMilestoneInfo('nutrition', 5);

      expect(info).not.toBeNull();
      expect(info?.milestone).toBe(7);
      expect(info?.daysLeft).toBe(2);
      expect(info?.badgeCode).toBe('nutrition_streak_7day');
    });

    it('스트릭 0에서 첫 번째 마일스톤 정보를 반환한다', () => {
      const info = getNextMilestoneInfo('workout', 0);
      const firstMilestone = STREAK_MILESTONES[0];

      expect(info).not.toBeNull();
      expect(info?.milestone).toBe(firstMilestone);
      expect(info?.daysLeft).toBe(firstMilestone);
    });

    it('마일스톤 직후 스트릭에서 다음 마일스톤 정보를 반환한다', () => {
      const info = getNextMilestoneInfo('workout', 7);

      expect(info).not.toBeNull();
      // 7일 다음 마일스톤은 14일 또는 30일 (STREAK_MILESTONES 정의에 따라)
      expect(info?.milestone).toBeGreaterThan(7);
      expect(info?.daysLeft).toBe(info!.milestone - 7);
    });

    it('최대 마일스톤 달성 후에는 null을 반환한다', () => {
      const maxMilestone = Math.max(...STREAK_MILESTONES);
      const info = getNextMilestoneInfo('workout', maxMilestone);

      expect(info).toBeNull();
    });

    it('최대 마일스톤 초과 스트릭에서 null을 반환한다', () => {
      const maxMilestone = Math.max(...STREAK_MILESTONES);
      const info = getNextMilestoneInfo('nutrition', maxMilestone + 50);

      expect(info).toBeNull();
    });
  });

  // =========================================
  // STREAK_MILESTONES 상수 검증
  // =========================================

  describe('STREAK_MILESTONES', () => {
    it('마일스톤이 오름차순으로 정렬되어 있다', () => {
      for (let i = 0; i < STREAK_MILESTONES.length - 1; i++) {
        expect(STREAK_MILESTONES[i]).toBeLessThan(STREAK_MILESTONES[i + 1]);
      }
    });

    it('모든 마일스톤이 양수이다', () => {
      for (const milestone of STREAK_MILESTONES) {
        expect(milestone).toBeGreaterThan(0);
      }
    });

    it('마일스톤에 일반적인 값들이 포함되어 있다', () => {
      // 일반적인 마일스톤: 7일, 30일, 100일, 365일
      expect(STREAK_MILESTONES).toContain(7);
      expect(STREAK_MILESTONES).toContain(30);
    });
  });

  // =========================================
  // 통합 시나리오 테스트
  // =========================================

  describe('통합 시나리오', () => {
    it('스트릭 증가 시나리오: 0 → 첫 마일스톤 → 첫 마일스톤+1', () => {
      const firstMilestone = STREAK_MILESTONES[0];

      // 0일: 첫 번째 마일스톤까지
      const info0 = getNextMilestoneInfo('workout', 0);
      expect(info0?.daysLeft).toBe(firstMilestone);

      // 첫 마일스톤 달성: 다음 마일스톤 확인
      const infoAtFirst = getNextMilestoneInfo('workout', firstMilestone);
      expect(infoAtFirst?.milestone).toBeGreaterThan(firstMilestone);

      // 첫 마일스톤+1: 다음 마일스톤까지 하루 줄어듦
      const infoAfterFirst = getNextMilestoneInfo('workout', firstMilestone + 1);
      expect(infoAfterFirst?.daysLeft).toBe(infoAtFirst!.daysLeft - 1);
    });

    it('도메인별 배지 코드가 다르다', () => {
      const workoutBadge = getStreakBadgeCode('workout', 7);
      const nutritionBadge = getStreakBadgeCode('nutrition', 7);

      expect(workoutBadge).not.toBe(nutritionBadge);
      expect(workoutBadge).toContain('workout');
      expect(nutritionBadge).toContain('nutrition');
    });
  });
});
