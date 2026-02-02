import { describe, it, expect } from 'vitest';

// 레벨 타입
type Level = 1 | 2 | 3;

// 레벨 계산 함수 (컴포넌트에서 추출)
function calculateLevel(count: number): Level {
  if (count >= 5) return 3;
  if (count >= 3) return 2;
  return 1;
}

// 레벨 기준
const LEVEL_THRESHOLDS = {
  1: { min: 0, max: 2, label: 'Level 1', description: '기본' },
  2: { min: 3, max: 4, label: 'Level 2', description: '활성' },
  3: { min: 5, max: 5, label: 'Level 3', description: '완전' },
};

describe('calculateLevel', () => {
  describe('Level 1 (0-2개 분석)', () => {
    it('0개 분석 시 Level 1 반환', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('1개 분석 시 Level 1 반환', () => {
      expect(calculateLevel(1)).toBe(1);
    });

    it('2개 분석 시 Level 1 반환', () => {
      expect(calculateLevel(2)).toBe(1);
    });
  });

  describe('Level 2 (3-4개 분석)', () => {
    it('3개 분석 시 Level 2 반환', () => {
      expect(calculateLevel(3)).toBe(2);
    });

    it('4개 분석 시 Level 2 반환', () => {
      expect(calculateLevel(4)).toBe(2);
    });
  });

  describe('Level 3 (5개 분석)', () => {
    it('5개 분석 시 Level 3 반환', () => {
      expect(calculateLevel(5)).toBe(3);
    });

    it('5개 초과 시에도 Level 3 반환', () => {
      expect(calculateLevel(6)).toBe(3);
      expect(calculateLevel(10)).toBe(3);
    });
  });

  describe('경계값 테스트', () => {
    it('Level 1 → Level 2 경계 (2 → 3)', () => {
      expect(calculateLevel(2)).toBe(1);
      expect(calculateLevel(3)).toBe(2);
    });

    it('Level 2 → Level 3 경계 (4 → 5)', () => {
      expect(calculateLevel(4)).toBe(2);
      expect(calculateLevel(5)).toBe(3);
    });
  });
});

describe('LEVEL_THRESHOLDS', () => {
  it('Level 1 임계값이 올바름', () => {
    expect(LEVEL_THRESHOLDS[1].min).toBe(0);
    expect(LEVEL_THRESHOLDS[1].max).toBe(2);
  });

  it('Level 2 임계값이 올바름', () => {
    expect(LEVEL_THRESHOLDS[2].min).toBe(3);
    expect(LEVEL_THRESHOLDS[2].max).toBe(4);
  });

  it('Level 3 임계값이 올바름', () => {
    expect(LEVEL_THRESHOLDS[3].min).toBe(5);
    expect(LEVEL_THRESHOLDS[3].max).toBe(5);
  });

  it('레벨 간 간격이 연속적임', () => {
    // Level 1 max + 1 = Level 2 min
    expect(LEVEL_THRESHOLDS[1].max + 1).toBe(LEVEL_THRESHOLDS[2].min);
    // Level 2 max + 1 = Level 3 min
    expect(LEVEL_THRESHOLDS[2].max + 1).toBe(LEVEL_THRESHOLDS[3].min);
  });
});

describe('NextLevelCard 통합 로직', () => {
  it('다음 레벨 필요 분석 수 계산이 올바름', () => {
    // completedCount = 2, currentLevel = 1, nextLevel = 2
    // analysisNeeded = LEVEL_THRESHOLDS[2].min - 2 = 3 - 2 = 1
    const completedCount = 2;
    const currentLevel = calculateLevel(completedCount);
    const nextLevel = Math.min(currentLevel + 1, 3) as Level;
    const analysisNeeded = LEVEL_THRESHOLDS[nextLevel].min - completedCount;

    expect(currentLevel).toBe(1);
    expect(nextLevel).toBe(2);
    expect(analysisNeeded).toBe(1);
  });

  it('Level 3 도달 시 다음 레벨 계산이 3 유지', () => {
    const completedCount = 5;
    const currentLevel = calculateLevel(completedCount);
    const nextLevel = Math.min(currentLevel + 1, 3) as Level;

    expect(currentLevel).toBe(3);
    expect(nextLevel).toBe(3); // Math.min(4, 3) = 3
  });

  it('진행도 바 퍼센티지 계산이 올바름', () => {
    // completedCount = 1, currentLevel = 1
    // nextLevel = 2, nextLevelThreshold.min = 3
    // progress = (1 - 0) / (3 - 0) * 100 = 33.33%
    const completedCount = 1;
    const currentLevel = calculateLevel(completedCount);
    const nextLevel = Math.min(currentLevel + 1, 3) as Level;
    const currentMin = LEVEL_THRESHOLDS[currentLevel].min;
    const nextMin = LEVEL_THRESHOLDS[nextLevel].min;
    const progress = ((completedCount - currentMin) / (nextMin - currentMin)) * 100;

    expect(progress).toBeCloseTo(33.33, 1);
  });
});
