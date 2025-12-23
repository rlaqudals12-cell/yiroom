import { describe, it, expect } from 'vitest';
import {
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromTotalXp,
  getLevelProgress,
  calculateLevelInfo,
  getTierForLevel,
  getNewMilestones,
  TIER_NAMES,
  TIER_COLORS,
  CATEGORY_NAMES,
  RARITY_NAMES,
  STREAK_MILESTONES,
} from '@/lib/gamification/constants';

describe('게이미피케이션 상수', () => {
  describe('getXpForLevel', () => {
    it('레벨 1에서 2로 가는데 100 XP 필요', () => {
      expect(getXpForLevel(1)).toBe(100);
    });

    it('레벨 5에서 6으로 가는데 500 XP 필요', () => {
      expect(getXpForLevel(5)).toBe(500);
    });

    it('레벨 10에서 11로 가는데 1000 XP 필요', () => {
      expect(getXpForLevel(10)).toBe(1000);
    });

    it('레벨 0 이하는 0 반환', () => {
      expect(getXpForLevel(0)).toBe(0);
      expect(getXpForLevel(-1)).toBe(0);
    });
  });

  describe('getTotalXpForLevel', () => {
    it('레벨 1에 도달하는데 필요한 XP는 0', () => {
      expect(getTotalXpForLevel(1)).toBe(0);
    });

    it('레벨 2에 도달하는데 필요한 XP는 100', () => {
      expect(getTotalXpForLevel(2)).toBe(100);
    });

    it('레벨 3에 도달하는데 필요한 XP는 300 (100 + 200)', () => {
      expect(getTotalXpForLevel(3)).toBe(300);
    });

    it('레벨 5에 도달하는데 필요한 XP는 1000', () => {
      // 100 + 200 + 300 + 400 = 1000
      expect(getTotalXpForLevel(5)).toBe(1000);
    });
  });

  describe('getLevelFromTotalXp', () => {
    it('0 XP는 레벨 1', () => {
      expect(getLevelFromTotalXp(0)).toBe(1);
    });

    it('99 XP는 레벨 1', () => {
      expect(getLevelFromTotalXp(99)).toBe(1);
    });

    it('100 XP는 레벨 2', () => {
      expect(getLevelFromTotalXp(100)).toBe(2);
    });

    it('299 XP는 레벨 2', () => {
      expect(getLevelFromTotalXp(299)).toBe(2);
    });

    it('300 XP는 레벨 3', () => {
      expect(getLevelFromTotalXp(300)).toBe(3);
    });

    it('1000 XP는 레벨 5', () => {
      expect(getLevelFromTotalXp(1000)).toBe(5);
    });
  });

  describe('getLevelProgress', () => {
    it('0 XP에서 진행률은 0%', () => {
      expect(getLevelProgress(0)).toBe(0);
    });

    it('50 XP (레벨 1)에서 진행률은 50%', () => {
      expect(getLevelProgress(50)).toBe(50);
    });

    it('100 XP (레벨 2 시작)에서 진행률은 0%', () => {
      expect(getLevelProgress(100)).toBe(0);
    });

    it('200 XP (레벨 2에서 50%)에서 진행률은 50%', () => {
      // 레벨 2 시작: 100 XP, 다음 레벨까지: 200 XP
      // 현재 XP: 200 - 100 = 100, 진행률 = 100/200 = 50%
      expect(getLevelProgress(200)).toBe(50);
    });
  });

  describe('calculateLevelInfo', () => {
    it('0 XP에서 레벨 정보 계산', () => {
      const info = calculateLevelInfo(0);
      expect(info.level).toBe(1);
      expect(info.tier).toBe('beginner');
      expect(info.tierName).toBe('비기너');
      expect(info.currentXp).toBe(0);
      expect(info.xpForNextLevel).toBe(100);
      expect(info.xpProgress).toBe(0);
      expect(info.totalXp).toBe(0);
    });

    it('150 XP에서 레벨 정보 계산', () => {
      const info = calculateLevelInfo(150);
      expect(info.level).toBe(2);
      expect(info.tier).toBe('beginner');
      expect(info.currentXp).toBe(50); // 150 - 100
      expect(info.xpForNextLevel).toBe(200);
      expect(info.xpProgress).toBe(25); // 50/200 = 25%
    });
  });

  describe('getTierForLevel', () => {
    it('레벨 1-10은 비기너', () => {
      expect(getTierForLevel(1)).toBe('beginner');
      expect(getTierForLevel(10)).toBe('beginner');
    });

    it('레벨 11-30은 프랙티셔너', () => {
      expect(getTierForLevel(11)).toBe('practitioner');
      expect(getTierForLevel(30)).toBe('practitioner');
    });

    it('레벨 31-50은 엑스퍼트', () => {
      expect(getTierForLevel(31)).toBe('expert');
      expect(getTierForLevel(50)).toBe('expert');
    });

    it('레벨 51 이상은 마스터', () => {
      expect(getTierForLevel(51)).toBe('master');
      expect(getTierForLevel(100)).toBe('master');
    });
  });

  describe('getNewMilestones', () => {
    it('0일에서 3일로 갈 때 3일 마일스톤 달성', () => {
      expect(getNewMilestones(0, 3)).toEqual([3]);
    });

    it('0일에서 7일로 갈 때 3, 7일 마일스톤 달성', () => {
      expect(getNewMilestones(0, 7)).toEqual([3, 7]);
    });

    it('3일에서 7일로 갈 때 7일 마일스톤만 달성', () => {
      expect(getNewMilestones(3, 7)).toEqual([7]);
    });

    it('7일에서 8일로 갈 때 새 마일스톤 없음', () => {
      expect(getNewMilestones(7, 8)).toEqual([]);
    });

    it('99일에서 100일로 갈 때 100일 마일스톤 달성', () => {
      expect(getNewMilestones(99, 100)).toEqual([100]);
    });
  });

  describe('상수 객체', () => {
    it('TIER_NAMES에 모든 티어가 있음', () => {
      expect(TIER_NAMES.beginner).toBe('비기너');
      expect(TIER_NAMES.practitioner).toBe('프랙티셔너');
      expect(TIER_NAMES.expert).toBe('엑스퍼트');
      expect(TIER_NAMES.master).toBe('마스터');
    });

    it('TIER_COLORS에 모든 티어 색상이 있음', () => {
      expect(TIER_COLORS.beginner).toBeDefined();
      expect(TIER_COLORS.master.bg).toBeDefined();
    });

    it('CATEGORY_NAMES에 모든 카테고리가 있음', () => {
      expect(CATEGORY_NAMES.streak).toBe('연속 달성');
      expect(CATEGORY_NAMES.workout).toBe('운동');
      expect(CATEGORY_NAMES.nutrition).toBe('영양');
      expect(CATEGORY_NAMES.analysis).toBe('분석');
      expect(CATEGORY_NAMES.special).toBe('특별');
    });

    it('RARITY_NAMES에 모든 희귀도가 있음', () => {
      expect(RARITY_NAMES.common).toBe('일반');
      expect(RARITY_NAMES.rare).toBe('레어');
      expect(RARITY_NAMES.epic).toBe('에픽');
      expect(RARITY_NAMES.legendary).toBe('전설');
    });

    it('STREAK_MILESTONES가 올바른 순서', () => {
      expect(STREAK_MILESTONES).toEqual([3, 7, 14, 30, 60, 100]);
    });
  });
});
