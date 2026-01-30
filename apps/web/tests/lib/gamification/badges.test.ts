import { describe, it, expect } from 'vitest';
import {
  badgeRowToBadge,
  userBadgeRowToUserBadge,
  groupBadgesByCategory,
  getBadgeStats,
} from '@/lib/gamification/badges';
import type { Badge, UserBadge, BadgeRow, UserBadgeRow } from '@/types/gamification';

describe('배지 라이브러리', () => {
  describe('badgeRowToBadge', () => {
    it('DB Row를 Badge 객체로 변환', () => {
      const row: BadgeRow = {
        id: 'badge-123',
        code: 'workout_streak_7day',
        name: '일주일 스트릭',
        description: '7일 연속 운동',
        icon: '💪',
        category: 'streak',
        rarity: 'common',
        requirement: { type: 'streak', domain: 'workout', days: 7 },
        xp_reward: 25,
        sort_order: 2,
        created_at: '2024-01-01T00:00:00Z',
      };

      const badge = badgeRowToBadge(row);

      expect(badge.id).toBe('badge-123');
      expect(badge.code).toBe('workout_streak_7day');
      expect(badge.name).toBe('일주일 스트릭');
      expect(badge.description).toBe('7일 연속 운동');
      expect(badge.icon).toBe('💪');
      expect(badge.category).toBe('streak');
      expect(badge.rarity).toBe('common');
      expect(badge.xpReward).toBe(25);
      expect(badge.sortOrder).toBe(2);
      expect(badge.createdAt).toBeInstanceOf(Date);
    });

    it('description이 null인 경우 처리', () => {
      const row: BadgeRow = {
        id: 'badge-123',
        code: 'test',
        name: 'Test',
        description: null,
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        requirement: {},
        xp_reward: 10,
        sort_order: 0,
        created_at: '2024-01-01T00:00:00Z',
      };

      const badge = badgeRowToBadge(row);
      expect(badge.description).toBeNull();
    });
  });

  describe('userBadgeRowToUserBadge', () => {
    it('DB Row를 UserBadge 객체로 변환', () => {
      const row: UserBadgeRow = {
        id: 'ub-123',
        clerk_user_id: 'user_abc',
        badge_id: 'badge-123',
        earned_at: '2024-01-15T10:30:00Z',
      };

      const userBadge = userBadgeRowToUserBadge(row);

      expect(userBadge.id).toBe('ub-123');
      expect(userBadge.clerkUserId).toBe('user_abc');
      expect(userBadge.badgeId).toBe('badge-123');
      expect(userBadge.earnedAt).toBeInstanceOf(Date);
      expect(userBadge.badge).toBeUndefined();
    });

    it('badges 조인 데이터가 있는 경우 badge 포함', () => {
      const row: UserBadgeRow = {
        id: 'ub-123',
        clerk_user_id: 'user_abc',
        badge_id: 'badge-123',
        earned_at: '2024-01-15T10:30:00Z',
        badges: {
          id: 'badge-123',
          code: 'workout_first',
          name: '첫 운동',
          description: '첫 운동 기록',
          icon: '🎯',
          category: 'workout',
          rarity: 'common',
          requirement: { type: 'count', domain: 'workout', sessions: 1 },
          xp_reward: 10,
          sort_order: 20,
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const userBadge = userBadgeRowToUserBadge(row);

      expect(userBadge.badge).toBeDefined();
      expect(userBadge.badge?.code).toBe('workout_first');
      expect(userBadge.badge?.name).toBe('첫 운동');
    });
  });

  describe('groupBadgesByCategory', () => {
    const mockBadges: Badge[] = [
      {
        id: '1',
        code: 'streak_3',
        name: '3일 스트릭',
        description: null,
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        requirement: { type: 'streak', domain: 'workout', days: 3 },
        xpReward: 10,
        sortOrder: 1,
        createdAt: new Date(),
      },
      {
        id: '2',
        code: 'streak_7',
        name: '7일 스트릭',
        description: null,
        icon: '💪',
        category: 'streak',
        rarity: 'common',
        requirement: { type: 'streak', domain: 'workout', days: 7 },
        xpReward: 25,
        sortOrder: 2,
        createdAt: new Date(),
      },
      {
        id: '3',
        code: 'workout_first',
        name: '첫 운동',
        description: null,
        icon: '🎯',
        category: 'workout',
        rarity: 'common',
        requirement: { type: 'count', domain: 'workout', sessions: 1 },
        xpReward: 10,
        sortOrder: 20,
        createdAt: new Date(),
      },
    ];

    it('카테고리별로 배지를 그룹화', () => {
      const userBadges: UserBadge[] = [
        {
          id: 'ub-1',
          clerkUserId: 'user',
          badgeId: '1',
          earnedAt: new Date(),
        },
      ];

      const groups = groupBadgesByCategory(mockBadges, userBadges);

      // streak 카테고리
      const streakGroup = groups.find((g) => g.category === 'streak');
      expect(streakGroup).toBeDefined();
      expect(streakGroup?.badges.length).toBe(2);
      expect(streakGroup?.earnedCount).toBe(1);
      expect(streakGroup?.totalCount).toBe(2);

      // workout 카테고리
      const workoutGroup = groups.find((g) => g.category === 'workout');
      expect(workoutGroup).toBeDefined();
      expect(workoutGroup?.badges.length).toBe(1);
      expect(workoutGroup?.earnedCount).toBe(0);
    });

    it('빈 userBadges일 때 earnedCount는 0', () => {
      const groups = groupBadgesByCategory(mockBadges, []);

      const streakGroup = groups.find((g) => g.category === 'streak');
      expect(streakGroup?.earnedCount).toBe(0);
    });
  });

  describe('getBadgeStats', () => {
    const mockBadges: Badge[] = [
      { id: '1' } as Badge,
      { id: '2' } as Badge,
      { id: '3' } as Badge,
      { id: '4' } as Badge,
      { id: '5' } as Badge,
    ];

    it('배지 통계 계산', () => {
      const userBadges: UserBadge[] = [
        { id: 'ub-1', badgeId: '1' } as UserBadge,
        { id: 'ub-2', badgeId: '2' } as UserBadge,
      ];

      const stats = getBadgeStats(mockBadges, userBadges);

      expect(stats.total).toBe(5);
      expect(stats.earned).toBe(2);
      expect(stats.progress).toBe(40);
    });

    it('배지가 없을 때 0% 진행률', () => {
      const stats = getBadgeStats([], []);

      expect(stats.total).toBe(0);
      expect(stats.earned).toBe(0);
      expect(stats.progress).toBe(0);
    });

    it('모든 배지 획득 시 100% 진행률', () => {
      const userBadges = mockBadges.map((b) => ({
        id: `ub-${b.id}`,
        badgeId: b.id,
      })) as UserBadge[];

      const stats = getBadgeStats(mockBadges, userBadges);

      expect(stats.progress).toBe(100);
    });
  });
});
