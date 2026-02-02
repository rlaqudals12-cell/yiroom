/**
 * 등급 시스템 상수 테스트
 * @see apps/web/lib/levels/constants.ts
 */

import { describe, it, expect } from 'vitest';
import {
  LEVEL_THRESHOLDS,
  LEVEL_COLORS,
  LEVEL_ICONS,
  LEVEL_NAMES,
  ACTIVITY_POINTS,
  MAX_LEVEL,
  DAILY_MAX_COUNT_PER_TYPE,
} from '@/lib/levels/constants';

describe('LEVEL_THRESHOLDS', () => {
  it('should have all 5 levels defined', () => {
    expect(Object.keys(LEVEL_THRESHOLDS)).toHaveLength(5);
  });

  it('should start at 0 for level 1', () => {
    expect(LEVEL_THRESHOLDS[1]).toBe(0);
  });

  it('should have increasing thresholds', () => {
    const levels = [1, 2, 3, 4, 5] as const;
    for (let i = 0; i < levels.length - 1; i++) {
      expect(LEVEL_THRESHOLDS[levels[i]]).toBeLessThan(LEVEL_THRESHOLDS[levels[i + 1]]);
    }
  });

  it('should have specific threshold values', () => {
    expect(LEVEL_THRESHOLDS[1]).toBe(0);
    expect(LEVEL_THRESHOLDS[2]).toBe(30);
    expect(LEVEL_THRESHOLDS[3]).toBe(100);
    expect(LEVEL_THRESHOLDS[4]).toBe(300);
    expect(LEVEL_THRESHOLDS[5]).toBe(1000);
  });
});

describe('LEVEL_COLORS', () => {
  it('should have all 5 levels defined', () => {
    expect(Object.keys(LEVEL_COLORS)).toHaveLength(5);
  });

  it('should have name, hex, and tailwind for each level', () => {
    const levels = [1, 2, 3, 4, 5] as const;
    for (const level of levels) {
      expect(LEVEL_COLORS[level]).toHaveProperty('name');
      expect(LEVEL_COLORS[level]).toHaveProperty('hex');
      expect(LEVEL_COLORS[level]).toHaveProperty('tailwind');
    }
  });

  it('should have valid hex color format', () => {
    const levels = [1, 2, 3, 4, 5] as const;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const level of levels) {
      expect(LEVEL_COLORS[level].hex).toMatch(hexRegex);
    }
  });

  it('should have specific color values', () => {
    expect(LEVEL_COLORS[1].name).toBe('Slate');
    expect(LEVEL_COLORS[5].name).toBe('Amber');
  });
});

describe('LEVEL_ICONS', () => {
  it('should have all 5 levels defined', () => {
    expect(Object.keys(LEVEL_ICONS)).toHaveLength(5);
  });

  it('should have specific icons for progression', () => {
    expect(LEVEL_ICONS[1]).toBe('○'); // 빈 원
    expect(LEVEL_ICONS[2]).toBe('◐'); // 왼쪽 반
    expect(LEVEL_ICONS[3]).toBe('◑'); // 오른쪽 반
    expect(LEVEL_ICONS[4]).toBe('◕'); // 거의 채움
    expect(LEVEL_ICONS[5]).toBe('●'); // 꽉 채움
  });
});

describe('LEVEL_NAMES', () => {
  it('should have all 5 levels defined', () => {
    expect(Object.keys(LEVEL_NAMES)).toHaveLength(5);
  });

  it('should follow Lv.N format', () => {
    const levels = [1, 2, 3, 4, 5] as const;
    for (const level of levels) {
      expect(LEVEL_NAMES[level]).toBe(`Lv.${level}`);
    }
  });
});

describe('ACTIVITY_POINTS', () => {
  it('should have all activity types defined', () => {
    const expectedTypes = ['workout', 'meal', 'water', 'analysis', 'review', 'checkin'];
    for (const type of expectedTypes) {
      expect(ACTIVITY_POINTS).toHaveProperty(type);
    }
  });

  it('should have positive point values', () => {
    Object.values(ACTIVITY_POINTS).forEach((points) => {
      expect(points).toBeGreaterThan(0);
    });
  });

  it('should have specific point values', () => {
    expect(ACTIVITY_POINTS.workout).toBe(1);
    expect(ACTIVITY_POINTS.meal).toBe(1);
    expect(ACTIVITY_POINTS.water).toBe(1);
    expect(ACTIVITY_POINTS.analysis).toBe(2);
    expect(ACTIVITY_POINTS.review).toBe(3);
    expect(ACTIVITY_POINTS.checkin).toBe(1);
  });

  it('should give more points for complex activities', () => {
    // review와 analysis는 단순 활동보다 더 많은 포인트
    expect(ACTIVITY_POINTS.review).toBeGreaterThan(ACTIVITY_POINTS.workout);
    expect(ACTIVITY_POINTS.analysis).toBeGreaterThan(ACTIVITY_POINTS.meal);
  });
});

describe('MAX_LEVEL', () => {
  it('should be 5', () => {
    expect(MAX_LEVEL).toBe(5);
  });

  it('should match the highest level in LEVEL_THRESHOLDS', () => {
    const maxLevelInThresholds = Math.max(...Object.keys(LEVEL_THRESHOLDS).map(Number));
    expect(MAX_LEVEL).toBe(maxLevelInThresholds);
  });
});

describe('DAILY_MAX_COUNT_PER_TYPE', () => {
  it('should be 5', () => {
    expect(DAILY_MAX_COUNT_PER_TYPE).toBe(5);
  });

  it('should be a positive integer', () => {
    expect(DAILY_MAX_COUNT_PER_TYPE).toBeGreaterThan(0);
    expect(Number.isInteger(DAILY_MAX_COUNT_PER_TYPE)).toBe(true);
  });
});
