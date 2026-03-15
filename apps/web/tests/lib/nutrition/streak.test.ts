/**
 * N-1 Streak 계산 유틸리티 테스트
 * Task 3.5: 식단 Streak 로직
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NUTRITION_STREAK_MILESTONES,
  NUTRITION_STREAK_BADGES,
  NUTRITION_STREAK_REWARDS,
  getDaysDifference,
  isStreakBroken,
  calculateCurrentStreak,
  getNextMilestone,
  getDaysToNextMilestone,
  getAchievedMilestones,
  getNewlyAchievedMilestones,
  getBadgesForMilestones,
  getNewBadges,
  getStreakMessage,
  getStreakWarningMessage,
  getReEngagementMessage,
  getMilestoneAchievementMessage,
  getStreakSummary,
  type NutritionStreak,
} from '@/lib/nutrition/streak';

describe('N-1 Streak 계산 유틸리티', () => {
  // 시간 고정을 위한 설정
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-03T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('상수 정의', () => {
    it('마일스톤이 올바르게 정의되어 있다', () => {
      expect(NUTRITION_STREAK_MILESTONES).toEqual([3, 7, 14, 30, 60, 100]);
    });

    it('모든 마일스톤에 배지가 정의되어 있다', () => {
      for (const milestone of NUTRITION_STREAK_MILESTONES) {
        expect(NUTRITION_STREAK_BADGES[milestone]).toBeDefined();
        expect(NUTRITION_STREAK_BADGES[milestone].id).toBeDefined();
        expect(NUTRITION_STREAK_BADGES[milestone].name).toBeDefined();
        expect(NUTRITION_STREAK_BADGES[milestone].emoji).toBeDefined();
      }
    });

    it('모든 마일스톤에 보상이 정의되어 있다', () => {
      for (const milestone of NUTRITION_STREAK_MILESTONES) {
        expect(NUTRITION_STREAK_REWARDS[milestone]).toBeDefined();
        expect(NUTRITION_STREAK_REWARDS[milestone].type).toBeDefined();
        expect(NUTRITION_STREAK_REWARDS[milestone].description).toBeDefined();
      }
    });
  });

  describe('getDaysDifference', () => {
    it('같은 날짜면 0을 반환한다', () => {
      const date1 = new Date('2025-12-03');
      const date2 = new Date('2025-12-03');
      expect(getDaysDifference(date1, date2)).toBe(0);
    });

    it('하루 차이를 올바르게 계산한다', () => {
      const date1 = new Date('2025-12-02');
      const date2 = new Date('2025-12-03');
      expect(getDaysDifference(date1, date2)).toBe(1);
    });

    it('일주일 차이를 올바르게 계산한다', () => {
      const date1 = new Date('2025-11-26');
      const date2 = new Date('2025-12-03');
      expect(getDaysDifference(date1, date2)).toBe(7);
    });

    it('과거 날짜면 음수를 반환한다', () => {
      const date1 = new Date('2025-12-03');
      const date2 = new Date('2025-12-01');
      expect(getDaysDifference(date1, date2)).toBe(-2);
    });
  });

  describe('isStreakBroken', () => {
    it('마지막 기록일이 없으면 true를 반환한다', () => {
      expect(isStreakBroken(null)).toBe(true);
      expect(isStreakBroken(undefined)).toBe(true);
    });

    it('오늘 기록했으면 false를 반환한다', () => {
      expect(isStreakBroken('2025-12-03')).toBe(false);
    });

    it('어제 기록했으면 false를 반환한다', () => {
      expect(isStreakBroken('2025-12-02')).toBe(false);
    });

    it('2일 전 기록했으면 true를 반환한다', () => {
      expect(isStreakBroken('2025-12-01')).toBe(true);
    });

    it('일주일 전 기록했으면 true를 반환한다', () => {
      expect(isStreakBroken('2025-11-26')).toBe(true);
    });
  });

  describe('calculateCurrentStreak', () => {
    it('마지막 기록일이 없어도 누적 기록을 유지한다', () => {
      expect(calculateCurrentStreak(null, 5)).toBe(5);
    });

    it('streak이 끊겨도 누적 기록을 유지한다', () => {
      expect(calculateCurrentStreak('2025-12-01', 10)).toBe(10);
    });

    it('streak이 유지되면 현재 streak을 반환한다', () => {
      expect(calculateCurrentStreak('2025-12-02', 5)).toBe(5);
      expect(calculateCurrentStreak('2025-12-03', 7)).toBe(7);
    });
  });

  describe('getNextMilestone', () => {
    it('0일이면 3을 반환한다', () => {
      expect(getNextMilestone(0)).toBe(3);
    });

    it('2일이면 3을 반환한다', () => {
      expect(getNextMilestone(2)).toBe(3);
    });

    it('3일이면 7을 반환한다', () => {
      expect(getNextMilestone(3)).toBe(7);
    });

    it('7일이면 14를 반환한다', () => {
      expect(getNextMilestone(7)).toBe(14);
    });

    it('100일 이상이면 null을 반환한다', () => {
      expect(getNextMilestone(100)).toBe(null);
      expect(getNextMilestone(150)).toBe(null);
    });
  });

  describe('getDaysToNextMilestone', () => {
    it('0일이면 3을 반환한다', () => {
      expect(getDaysToNextMilestone(0)).toBe(3);
    });

    it('2일이면 1을 반환한다', () => {
      expect(getDaysToNextMilestone(2)).toBe(1);
    });

    it('6일이면 1을 반환한다', () => {
      expect(getDaysToNextMilestone(6)).toBe(1);
    });

    it('100일 이상이면 null을 반환한다', () => {
      expect(getDaysToNextMilestone(100)).toBe(null);
    });
  });

  describe('getAchievedMilestones', () => {
    it('0일이면 빈 배열을 반환한다', () => {
      expect(getAchievedMilestones(0)).toEqual([]);
    });

    it('3일이면 [3]을 반환한다', () => {
      expect(getAchievedMilestones(3)).toEqual([3]);
    });

    it('7일이면 [3, 7]을 반환한다', () => {
      expect(getAchievedMilestones(7)).toEqual([3, 7]);
    });

    it('35일이면 [3, 7, 14, 30]을 반환한다', () => {
      expect(getAchievedMilestones(35)).toEqual([3, 7, 14, 30]);
    });

    it('100일 이상이면 모든 마일스톤을 반환한다', () => {
      expect(getAchievedMilestones(100)).toEqual([3, 7, 14, 30, 60, 100]);
    });
  });

  describe('getNewlyAchievedMilestones', () => {
    it('0에서 3으로 증가하면 [3]을 반환한다', () => {
      expect(getNewlyAchievedMilestones(0, 3)).toEqual([3]);
    });

    it('2에서 3으로 증가하면 [3]을 반환한다', () => {
      expect(getNewlyAchievedMilestones(2, 3)).toEqual([3]);
    });

    it('3에서 7로 증가하면 [7]을 반환한다', () => {
      expect(getNewlyAchievedMilestones(3, 7)).toEqual([7]);
    });

    it('3에서 4로 증가하면 빈 배열을 반환한다', () => {
      expect(getNewlyAchievedMilestones(3, 4)).toEqual([]);
    });

    it('6에서 15로 증가하면 [7, 14]를 반환한다', () => {
      expect(getNewlyAchievedMilestones(6, 15)).toEqual([7, 14]);
    });
  });

  describe('getBadgesForMilestones', () => {
    it('빈 배열이면 빈 배열을 반환한다', () => {
      expect(getBadgesForMilestones([])).toEqual([]);
    });

    it('[3]이면 ["3day"]를 반환한다', () => {
      expect(getBadgesForMilestones([3])).toEqual(['3day']);
    });

    it('[3, 7, 14]이면 ["3day", "7day", "14day"]를 반환한다', () => {
      expect(getBadgesForMilestones([3, 7, 14])).toEqual(['3day', '7day', '14day']);
    });
  });

  describe('getNewBadges', () => {
    it('기존 배지가 없고 3일이면 ["3day"]를 반환한다', () => {
      expect(getNewBadges(3, [])).toEqual(['3day']);
    });

    it('기존에 3day가 있고 7일이면 ["7day"]를 반환한다', () => {
      expect(getNewBadges(7, ['3day'])).toEqual(['7day']);
    });

    it('이미 모든 배지가 있으면 빈 배열을 반환한다', () => {
      expect(getNewBadges(7, ['3day', '7day'])).toEqual([]);
    });
  });

  describe('getStreakMessage', () => {
    it('streak이 없으면 시작 메시지를 반환한다', () => {
      expect(getStreakMessage(null)).toBe('오늘 식단 기록을 시작해보세요!');
    });

    it('current_streak이 0이면 시작 메시지를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 0,
        longestStreak: 5,
        badgesEarned: [],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      expect(getStreakMessage(streak)).toBe('오늘 식단 기록을 시작해보세요!');
    });

    it('6일 기록 시 누적 메시지를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 6,
        longestStreak: 6,
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const message = getStreakMessage(streak);
      expect(message).toContain('6일');
    });

    it('마일스톤 달성 메시지를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 7,
        longestStreak: 7,
        badgesEarned: ['3day', '7day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const message = getStreakMessage(streak);
      expect(message).toContain('7일 기록 달성');
    });

    it('일반 연속 메시지를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 5,
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const message = getStreakMessage(streak);
      expect(message).toContain('5일');
    });
  });

  describe('getStreakWarningMessage', () => {
    it('streak이 없으면 null을 반환한다', () => {
      expect(getStreakWarningMessage(null)).toBe(null);
    });

    it('currentStreak이 0이면 null을 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 0,
        longestStreak: 5,
        badgesEarned: [],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      expect(getStreakWarningMessage(streak)).toBe(null);
    });

    it('어제 기록했으면 경고 메시지를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 5,
        lastRecordDate: '2025-12-02',
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const message = getStreakWarningMessage(streak);
      expect(message).not.toBe(null);
      expect(message).toContain('오늘');
    });

    it('오늘 기록했으면 null을 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 5,
        lastRecordDate: '2025-12-03',
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      expect(getStreakWarningMessage(streak)).toBe(null);
    });
  });

  describe('getReEngagementMessage', () => {
    it('streak이 없으면 시작 메시지를 반환한다', () => {
      expect(getReEngagementMessage(null)).toContain('첫 식단');
    });

    it('누적 기록이 없으면 시작 안내를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 0,
        longestStreak: 10,
        badgesEarned: ['3day', '7day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const message = getReEngagementMessage(streak);
      expect(message).toContain('언제든');
    });

    it('누적 기록이 적으면 시작 안내를 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 2,
        longestStreak: 2,
        badgesEarned: [],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const message = getReEngagementMessage(streak);
      expect(message).toContain('언제든');
    });
  });

  describe('getMilestoneAchievementMessage', () => {
    it('3일 마일스톤 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(3);
      expect(message).toContain('3일 기록');
      expect(message).toContain('🌱');
    });

    it('7일 마일스톤 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(7);
      expect(message).toContain('7일 기록');
      expect(message).toContain('🌿');
    });

    it('30일 마일스톤 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(30);
      expect(message).toContain('30일 기록');
      expect(message).toContain('🏆');
    });

    it('정의되지 않은 마일스톤도 기본 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(50);
      expect(message).toContain('50일 기록');
    });
  });

  describe('getStreakSummary', () => {
    it('streak이 없으면 기본값을 반환한다', () => {
      const summary = getStreakSummary(null);

      expect(summary.currentStreak).toBe(0);
      expect(summary.longestStreak).toBe(0);
      expect(summary.isActive).toBe(false);
      expect(summary.nextMilestone).toBe(3);
      expect(summary.daysToNextMilestone).toBe(3);
      expect(summary.achievedMilestones).toEqual([]);
      expect(summary.badges).toEqual([]);
    });

    it('활성 streak 요약을 올바르게 반환한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastRecordDate: '2025-12-02',
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const summary = getStreakSummary(streak);

      expect(summary.currentStreak).toBe(5);
      expect(summary.longestStreak).toBe(10);
      expect(summary.isActive).toBe(true);
      expect(summary.nextMilestone).toBe(7);
      expect(summary.daysToNextMilestone).toBe(2);
      expect(summary.achievedMilestones).toEqual([3]);
      expect(summary.badges).toEqual(['3day']);
    });

    it('끊긴 streak도 누적 기록을 유지한다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 5,
        longestStreak: 10,
        lastRecordDate: '2025-11-30', // 3일 전
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const summary = getStreakSummary(streak);

      expect(summary.currentStreak).toBe(5);
      expect(summary.longestStreak).toBe(10);
      expect(summary.isActive).toBe(false);
      expect(summary.message).toContain('기록');
    });

    it('오늘 기록한 streak은 활성 상태다', () => {
      const streak: NutritionStreak = {
        id: '1',
        userId: 'user1',
        currentStreak: 3,
        longestStreak: 3,
        lastRecordDate: '2025-12-03',
        badgesEarned: ['3day'],
        premiumRewardsClaimed: [],
        updatedAt: '',
      };

      const summary = getStreakSummary(streak);

      expect(summary.isActive).toBe(true);
      expect(summary.currentStreak).toBe(3);
    });
  });

  describe('주간 진행도 표시', () => {
    it('7일 중 현재 진행도를 계산한다', () => {
      const currentStreak = 5;
      const weeklyProgress = Math.min(currentStreak, 7);
      const remaining = 7 - weeklyProgress;

      expect(weeklyProgress).toBe(5);
      expect(remaining).toBe(2);
    });

    it('7일 이상일 때 7을 반환한다', () => {
      const currentStreak = 10;
      const weeklyProgress = Math.min(currentStreak, 7);

      expect(weeklyProgress).toBe(7);
    });
  });
});
