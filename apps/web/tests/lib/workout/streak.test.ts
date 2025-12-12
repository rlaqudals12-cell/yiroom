import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  STREAK_MILESTONES,
  STREAK_BADGES,
  STREAK_REWARDS,
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
} from '@/lib/workout/streak';
import type { WorkoutStreak } from '@/lib/api/workout';

describe('Streak 계산 유틸리티', () => {
  // 시간 고정을 위한 설정
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-30T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('상수 정의', () => {
    it('마일스톤이 올바르게 정의되어 있다', () => {
      expect(STREAK_MILESTONES).toEqual([3, 7, 14, 30, 60, 100]);
    });

    it('모든 마일스톤에 배지가 정의되어 있다', () => {
      for (const milestone of STREAK_MILESTONES) {
        expect(STREAK_BADGES[milestone]).toBeDefined();
        expect(STREAK_BADGES[milestone].id).toBeDefined();
        expect(STREAK_BADGES[milestone].name).toBeDefined();
        expect(STREAK_BADGES[milestone].emoji).toBeDefined();
      }
    });

    it('모든 마일스톤에 보상이 정의되어 있다', () => {
      for (const milestone of STREAK_MILESTONES) {
        expect(STREAK_REWARDS[milestone]).toBeDefined();
        expect(STREAK_REWARDS[milestone].type).toBeDefined();
        expect(STREAK_REWARDS[milestone].description).toBeDefined();
      }
    });
  });

  describe('getDaysDifference', () => {
    it('같은 날짜면 0을 반환한다', () => {
      const date1 = new Date('2025-11-30');
      const date2 = new Date('2025-11-30');
      expect(getDaysDifference(date1, date2)).toBe(0);
    });

    it('하루 차이를 올바르게 계산한다', () => {
      const date1 = new Date('2025-11-29');
      const date2 = new Date('2025-11-30');
      expect(getDaysDifference(date1, date2)).toBe(1);
    });

    it('일주일 차이를 올바르게 계산한다', () => {
      const date1 = new Date('2025-11-23');
      const date2 = new Date('2025-11-30');
      expect(getDaysDifference(date1, date2)).toBe(7);
    });

    it('과거 날짜면 음수를 반환한다', () => {
      const date1 = new Date('2025-11-30');
      const date2 = new Date('2025-11-28');
      expect(getDaysDifference(date1, date2)).toBe(-2);
    });
  });

  describe('isStreakBroken', () => {
    it('마지막 운동일이 없으면 true를 반환한다', () => {
      expect(isStreakBroken(null)).toBe(true);
      expect(isStreakBroken(undefined)).toBe(true);
    });

    it('오늘 운동했으면 false를 반환한다', () => {
      expect(isStreakBroken('2025-11-30')).toBe(false);
    });

    it('어제 운동했으면 false를 반환한다', () => {
      expect(isStreakBroken('2025-11-29')).toBe(false);
    });

    it('2일 전 운동했으면 true를 반환한다', () => {
      expect(isStreakBroken('2025-11-28')).toBe(true);
    });

    it('일주일 전 운동했으면 true를 반환한다', () => {
      expect(isStreakBroken('2025-11-23')).toBe(true);
    });
  });

  describe('calculateCurrentStreak', () => {
    it('마지막 운동일이 없으면 0을 반환한다', () => {
      expect(calculateCurrentStreak(null, 5)).toBe(0);
    });

    it('streak이 끊겼으면 0을 반환한다', () => {
      expect(calculateCurrentStreak('2025-11-28', 10)).toBe(0);
    });

    it('streak이 유지되면 현재 streak을 반환한다', () => {
      expect(calculateCurrentStreak('2025-11-29', 5)).toBe(5);
      expect(calculateCurrentStreak('2025-11-30', 7)).toBe(7);
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
      expect(getStreakMessage(null)).toBe('오늘 운동을 시작해보세요!');
    });

    it('마일스톤 달성 직전 메시지를 반환한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 6,
        longest_streak: 6,
        badges_earned: [],
        milestones_reached: [3],
        created_at: '',
        updated_at: '',
      };

      const message = getStreakMessage(streak);
      expect(message).toContain('7일 연속');
    });

    it('마일스톤 달성 메시지를 반환한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 7,
        longest_streak: 7,
        badges_earned: ['3day', '7day'],
        milestones_reached: [3, 7],
        created_at: '',
        updated_at: '',
      };

      const message = getStreakMessage(streak);
      expect(message).toContain('7일 연속 달성');
    });

    it('일반 연속 메시지를 반환한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 5,
        longest_streak: 5,
        badges_earned: ['3day'],
        milestones_reached: [3],
        created_at: '',
        updated_at: '',
      };

      const message = getStreakMessage(streak);
      expect(message).toContain('5일');
    });
  });

  describe('getStreakWarningMessage', () => {
    it('streak이 없으면 null을 반환한다', () => {
      expect(getStreakWarningMessage(null)).toBe(null);
    });

    it('current_streak이 0이면 null을 반환한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 0,
        longest_streak: 5,
        badges_earned: [],
        milestones_reached: [],
        created_at: '',
        updated_at: '',
      };

      expect(getStreakWarningMessage(streak)).toBe(null);
    });

    it('어제 운동했으면 경고 메시지를 반환한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 5,
        longest_streak: 5,
        last_workout_date: '2025-11-29',
        badges_earned: ['3day'],
        milestones_reached: [3],
        created_at: '',
        updated_at: '',
      };

      const message = getStreakWarningMessage(streak);
      expect(message).not.toBe(null);
      expect(message).toContain('오늘');
    });
  });

  describe('getReEngagementMessage', () => {
    it('streak이 없으면 시작 메시지를 반환한다', () => {
      expect(getReEngagementMessage(null)).toContain('첫 운동');
    });

    it('이전 최장 기록이 있으면 언급한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 0,
        longest_streak: 10,
        badges_earned: ['3day', '7day'],
        milestones_reached: [3, 7],
        created_at: '',
        updated_at: '',
      };

      const message = getReEngagementMessage(streak);
      expect(message).toContain('10일');
    });
  });

  describe('getMilestoneAchievementMessage', () => {
    it('3일 마일스톤 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(3);
      expect(message).toContain('3일 연속');
      expect(message).toContain('🌱');
    });

    it('7일 마일스톤 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(7);
      expect(message).toContain('7일 연속');
      expect(message).toContain('🔥');
    });

    it('30일 마일스톤 메시지를 반환한다', () => {
      const message = getMilestoneAchievementMessage(30);
      expect(message).toContain('30일 연속');
      expect(message).toContain('🏆');
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
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 5,
        longest_streak: 10,
        last_workout_date: '2025-11-29',
        badges_earned: ['3day'],
        milestones_reached: [3],
        created_at: '',
        updated_at: '',
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

    it('끊긴 streak 요약을 올바르게 반환한다', () => {
      const streak: WorkoutStreak = {
        id: '1',
        user_id: 'user1',
        current_streak: 5,
        longest_streak: 10,
        last_workout_date: '2025-11-27', // 3일 전
        badges_earned: ['3day'],
        milestones_reached: [3],
        created_at: '',
        updated_at: '',
      };

      const summary = getStreakSummary(streak);

      expect(summary.currentStreak).toBe(0);
      expect(summary.longestStreak).toBe(10);
      expect(summary.isActive).toBe(false);
      expect(summary.message).toContain('10일');
    });
  });
});
