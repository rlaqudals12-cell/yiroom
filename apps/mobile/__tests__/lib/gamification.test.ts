/**
 * 게이미피케이션 모듈 테스트
 */

import {
  getXpForLevel,
  getTotalXpForLevel,
  getLevelFromTotalXp,
  getLevelProgress,
  calculateLevelInfo,
  getTierForLevel,
  XP_REWARDS,
  DEFAULT_BADGES,
  TIER_THRESHOLDS,
  TIER_LABELS,
  XP_PER_LEVEL_MULTIPLIER,
} from '../../lib/gamification';

describe('gamification', () => {
  describe('getXpForLevel', () => {
    it('레벨 1 XP는 100', () => {
      expect(getXpForLevel(1)).toBe(100);
    });

    it('레벨 5 XP는 500', () => {
      expect(getXpForLevel(5)).toBe(500);
    });

    it('레벨 0은 0 반환', () => {
      expect(getXpForLevel(0)).toBe(0);
    });
  });

  describe('getTotalXpForLevel', () => {
    it('레벨 1 누적 XP는 0', () => {
      expect(getTotalXpForLevel(1)).toBe(0);
    });

    it('레벨 2 누적 XP는 100', () => {
      expect(getTotalXpForLevel(2)).toBe(100);
    });

    it('레벨이 올라갈수록 더 많은 XP 필요', () => {
      expect(getTotalXpForLevel(5)).toBeGreaterThan(getTotalXpForLevel(3));
    });
  });

  describe('getLevelFromTotalXp', () => {
    it('XP 0은 레벨 1', () => {
      expect(getLevelFromTotalXp(0)).toBe(1);
    });

    it('XP 음수는 레벨 1', () => {
      expect(getLevelFromTotalXp(-10)).toBe(1);
    });

    it('충분한 XP는 높은 레벨', () => {
      const level = getLevelFromTotalXp(10000);
      expect(level).toBeGreaterThan(5);
    });

    it('레벨은 항상 1 이상', () => {
      expect(getLevelFromTotalXp(0)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getLevelProgress', () => {
    it('XP 0일 때 진행률은 0~1 사이', () => {
      const progress = getLevelProgress(0);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('진행률은 항상 0~1 범위', () => {
      const progress = getLevelProgress(150);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    it('큰 XP에서도 진행률 1 이하', () => {
      const progress = getLevelProgress(99999);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateLevelInfo', () => {
    it('레벨 정보 전체 구조 반환', () => {
      const info = calculateLevelInfo(500);
      expect(info).toHaveProperty('level');
      expect(info).toHaveProperty('totalXp');
      expect(info).toHaveProperty('currentLevelXp');
      expect(info).toHaveProperty('xpToNextLevel');
      expect(info).toHaveProperty('progress');
      expect(info).toHaveProperty('tier');
      expect(info).toHaveProperty('tierLabel');
      expect(info.level).toBeGreaterThanOrEqual(1);
    });

    it('totalXp가 입력값과 일치', () => {
      const info = calculateLevelInfo(1234);
      expect(info.totalXp).toBe(1234);
    });
  });

  describe('getTierForLevel', () => {
    it('레벨 1은 beginner', () => {
      expect(getTierForLevel(1)).toBe('beginner');
    });

    it('레벨 30은 platinum', () => {
      expect(getTierForLevel(30)).toBe('platinum');
    });

    it('레벨 50은 master', () => {
      expect(getTierForLevel(50)).toBe('master');
    });
  });

  describe('XP_REWARDS 상수', () => {
    it('분석 완료 보상 존재', () => {
      expect(XP_REWARDS.analysis_complete).toBeGreaterThan(0);
    });

    it('운동 완료 보상 존재', () => {
      expect(XP_REWARDS.workout_complete).toBeGreaterThan(0);
    });

    it('8개 액션 보상 정의', () => {
      expect(Object.keys(XP_REWARDS).length).toBe(8);
    });
  });

  describe('DEFAULT_BADGES 상수', () => {
    it('12개 기본 뱃지 정의', () => {
      expect(DEFAULT_BADGES.length).toBe(12);
    });

    it('각 뱃지에 id, name, description 포함', () => {
      DEFAULT_BADGES.forEach((badge) => {
        expect(badge.id).toBeTruthy();
        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
      });
    });
  });

  describe('TIER_THRESHOLDS 상수', () => {
    it('7개 티어 정의', () => {
      expect(TIER_THRESHOLDS.length).toBe(7);
    });

    it('내림차순 정렬 (master부터 beginner)', () => {
      // TIER_THRESHOLDS는 minLevel 내림차순
      for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
        expect(TIER_THRESHOLDS[i].minLevel).toBeLessThan(
          TIER_THRESHOLDS[i - 1].minLevel
        );
      }
    });
  });

  describe('TIER_LABELS 상수', () => {
    it('7개 티어 라벨 정의', () => {
      expect(Object.keys(TIER_LABELS).length).toBe(7);
    });

    it('한국어 라벨', () => {
      expect(TIER_LABELS.beginner).toBe('초보자');
      expect(TIER_LABELS.master).toBe('마스터');
    });
  });

  describe('XP_PER_LEVEL_MULTIPLIER 상수', () => {
    it('100', () => {
      expect(XP_PER_LEVEL_MULTIPLIER).toBe(100);
    });
  });
});
