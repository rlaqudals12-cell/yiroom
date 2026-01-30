/**
 * 등급 시스템 유틸리티 함수 테스트
 *
 * @module tests/lib/levels/utils
 * @description calculateLevel, getNextLevelThreshold, calculateProgress,
 *              getLevelInfo, getAllLevels, calculateUserLevelState
 */

import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  getNextLevelThreshold,
  calculateProgress,
  getLevelInfo,
  getAllLevels,
  getLevelTailwindClass,
  calculateUserLevelState,
} from '@/lib/levels/utils';
import { LEVEL_THRESHOLDS, MAX_LEVEL } from '@/lib/levels/constants';

describe('lib/levels/utils', () => {
  // ---------------------------------------------------------------------------
  // calculateLevel
  // ---------------------------------------------------------------------------

  describe('calculateLevel', () => {
    it('should return level 1 for 0 activities', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('should return level 1 for activities below level 2 threshold', () => {
      expect(calculateLevel(29)).toBe(1);
    });

    it('should return level 2 at threshold', () => {
      expect(calculateLevel(LEVEL_THRESHOLDS[2])).toBe(2);
    });

    it('should return level 3 at threshold', () => {
      expect(calculateLevel(LEVEL_THRESHOLDS[3])).toBe(3);
    });

    it('should return level 4 at threshold', () => {
      expect(calculateLevel(LEVEL_THRESHOLDS[4])).toBe(4);
    });

    it('should return level 5 at threshold', () => {
      expect(calculateLevel(LEVEL_THRESHOLDS[5])).toBe(5);
    });

    it('should return level 5 for activities above max threshold', () => {
      expect(calculateLevel(10000)).toBe(5);
    });

    it('should handle boundary values correctly', () => {
      // Just below level 2
      expect(calculateLevel(LEVEL_THRESHOLDS[2] - 1)).toBe(1);
      // At level 2
      expect(calculateLevel(LEVEL_THRESHOLDS[2])).toBe(2);
      // Just above level 2
      expect(calculateLevel(LEVEL_THRESHOLDS[2] + 1)).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // getNextLevelThreshold
  // ---------------------------------------------------------------------------

  describe('getNextLevelThreshold', () => {
    it('should return level 2 threshold for level 1', () => {
      expect(getNextLevelThreshold(1)).toBe(LEVEL_THRESHOLDS[2]);
    });

    it('should return level 3 threshold for level 2', () => {
      expect(getNextLevelThreshold(2)).toBe(LEVEL_THRESHOLDS[3]);
    });

    it('should return level 4 threshold for level 3', () => {
      expect(getNextLevelThreshold(3)).toBe(LEVEL_THRESHOLDS[4]);
    });

    it('should return level 5 threshold for level 4', () => {
      expect(getNextLevelThreshold(4)).toBe(LEVEL_THRESHOLDS[5]);
    });

    it('should return null for max level', () => {
      expect(getNextLevelThreshold(MAX_LEVEL as 1 | 2 | 3 | 4 | 5)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // calculateProgress
  // ---------------------------------------------------------------------------

  describe('calculateProgress', () => {
    it('should return 0% at level start', () => {
      expect(calculateProgress(0, 1)).toBe(0);
    });

    it('should return 100% at max level', () => {
      expect(calculateProgress(1000, 5)).toBe(100);
    });

    it('should calculate mid-level progress correctly', () => {
      // Level 1 range: 0-30
      // At 15, should be 50%
      expect(calculateProgress(15, 1)).toBe(50);
    });

    it('should not exceed 100%', () => {
      expect(calculateProgress(500, 1)).toBeLessThanOrEqual(100);
    });

    it('should handle boundary values', () => {
      // At level 2 threshold (30), should be 0% of level 2
      expect(calculateProgress(30, 2)).toBe(0);
      // At level 3 threshold (100), should be 0% of level 3
      expect(calculateProgress(100, 3)).toBe(0);
    });

    it('should round to nearest integer', () => {
      const progress = calculateProgress(10, 1);
      expect(Number.isInteger(progress)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getLevelInfo
  // ---------------------------------------------------------------------------

  describe('getLevelInfo', () => {
    it('should return correct info for level 1', () => {
      const info = getLevelInfo(1);
      expect(info).toMatchObject({
        level: 1,
        name: 'Lv.1',
        threshold: 0,
      });
      expect(info.icon).toBeDefined();
      expect(info.color).toBeDefined();
    });

    it('should return correct info for level 5', () => {
      const info = getLevelInfo(5);
      expect(info).toMatchObject({
        level: 5,
        name: 'Lv.5',
        threshold: 1000,
      });
    });

    it('should include color with hex and tailwind', () => {
      const info = getLevelInfo(3);
      expect(info.color).toHaveProperty('hex');
      expect(info.color).toHaveProperty('tailwind');
      expect(info.color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  // ---------------------------------------------------------------------------
  // getAllLevels
  // ---------------------------------------------------------------------------

  describe('getAllLevels', () => {
    it('should return 5 levels', () => {
      const levels = getAllLevels();
      expect(levels).toHaveLength(5);
    });

    it('should be ordered from level 1 to 5', () => {
      const levels = getAllLevels();
      expect(levels[0].level).toBe(1);
      expect(levels[4].level).toBe(5);
    });

    it('should have increasing thresholds', () => {
      const levels = getAllLevels();
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].threshold).toBeGreaterThan(levels[i - 1].threshold);
      }
    });

    it('should include all level info properties', () => {
      const levels = getAllLevels();
      levels.forEach((level) => {
        expect(level).toHaveProperty('level');
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('icon');
        expect(level).toHaveProperty('color');
        expect(level).toHaveProperty('threshold');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getLevelTailwindClass
  // ---------------------------------------------------------------------------

  describe('getLevelTailwindClass', () => {
    it('should return bg class by default', () => {
      const className = getLevelTailwindClass(1);
      expect(className).toMatch(/^bg-/);
    });

    it('should return text class when specified', () => {
      const className = getLevelTailwindClass(2, 'text');
      expect(className).toMatch(/^text-/);
    });

    it('should return border class when specified', () => {
      const className = getLevelTailwindClass(3, 'border');
      expect(className).toMatch(/^border-/);
    });

    it('should return correct tailwind color', () => {
      const className = getLevelTailwindClass(1, 'bg');
      expect(className).toBe('bg-slate-400');
    });
  });

  // ---------------------------------------------------------------------------
  // calculateUserLevelState
  // ---------------------------------------------------------------------------

  describe('calculateUserLevelState', () => {
    it('should return complete state for new user', () => {
      const state = calculateUserLevelState(0);

      expect(state).toMatchObject({
        level: 1,
        totalActivityCount: 0,
        progress: 0,
      });
      expect(state.nextLevelThreshold).toBe(30);
      expect(state.levelInfo).toBeDefined();
    });

    it('should return complete state for mid-level user', () => {
      const state = calculateUserLevelState(50);

      expect(state.level).toBe(2);
      expect(state.totalActivityCount).toBe(50);
      expect(state.nextLevelThreshold).toBe(100);
      expect(state.progress).toBeGreaterThan(0);
      expect(state.progress).toBeLessThan(100);
    });

    it('should return null nextLevelThreshold for max level', () => {
      const state = calculateUserLevelState(1500);

      expect(state.level).toBe(5);
      expect(state.nextLevelThreshold).toBeNull();
      expect(state.progress).toBe(100);
    });

    it('should include levelInfo', () => {
      const state = calculateUserLevelState(150);

      expect(state.levelInfo).toHaveProperty('name');
      expect(state.levelInfo).toHaveProperty('icon');
      expect(state.levelInfo).toHaveProperty('color');
      expect(state.levelInfo.level).toBe(state.level);
    });
  });
});
