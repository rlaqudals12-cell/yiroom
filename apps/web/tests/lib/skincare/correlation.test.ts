import { describe, it, expect } from 'vitest';
import {
  calculatePearson,
  calculateConfidence,
  analyzeCorrelations,
  calculateConditionAverage,
  analyzeTrend,
  interpretTrend,
} from '@/lib/skincare/correlation';
import type { SkinDiaryEntry } from '@/types/skin-diary';

describe('calculatePearson', () => {
  it('returns 0 for empty arrays', () => {
    expect(calculatePearson([], [])).toBe(0);
  });

  it('returns 0 for single element arrays', () => {
    expect(calculatePearson([1], [2])).toBe(0);
  });

  it('returns 1 for perfect positive correlation', () => {
    const result = calculatePearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(result).toBeCloseTo(1, 5);
  });

  it('returns -1 for perfect negative correlation', () => {
    const result = calculatePearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(result).toBeCloseTo(-1, 5);
  });

  it('returns 0 for no correlation', () => {
    const result = calculatePearson([1, 2, 3, 4, 5], [5, 5, 5, 5, 5]);
    expect(result).toBe(0);
  });

  it('handles partial correlation', () => {
    const result = calculatePearson([1, 2, 3, 4, 5], [1, 3, 2, 5, 4]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('returns 0 for mismatched array lengths', () => {
    expect(calculatePearson([1, 2, 3], [1, 2])).toBe(0);
  });
});

describe('calculateConfidence', () => {
  it('returns 30 for less than 7 data points', () => {
    expect(calculateConfidence(5)).toBe(30);
  });

  it('returns 50 for 7-13 data points', () => {
    expect(calculateConfidence(10)).toBe(50);
  });

  it('returns 70 for 14-20 data points', () => {
    expect(calculateConfidence(17)).toBe(70);
  });

  it('returns 85 for 21-29 data points', () => {
    expect(calculateConfidence(25)).toBe(85);
  });

  it('returns 95 for 30+ data points', () => {
    expect(calculateConfidence(35)).toBe(95);
  });
});

describe('analyzeCorrelations', () => {
  const createMockEntry = (
    daysAgo: number,
    skinCondition: number,
    overrides?: Partial<SkinDiaryEntry>
  ): SkinDiaryEntry => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `entry-${daysAgo}`,
      clerkUserId: 'user1',
      entryDate: date,
      skinCondition: skinCondition as 1 | 2 | 3 | 4 | 5,
      morningRoutineCompleted: false,
      eveningRoutineCompleted: false,
      specialTreatments: [],
      createdAt: date,
      updatedAt: date,
      ...overrides,
    };
  };

  it('returns default insights for less than 7 entries', () => {
    const entries = [createMockEntry(0, 3), createMockEntry(1, 4), createMockEntry(2, 3)];
    const result = analyzeCorrelations(entries, '7days');
    expect(result[0].confidence).toBe(0);
  });

  it('returns insights for 7+ entries', () => {
    const entries: SkinDiaryEntry[] = [];
    for (let i = 0; i < 10; i++) {
      entries.push(
        createMockEntry(i, (i % 5) + 1, {
          sleepHours: 5 + (i % 4),
          waterIntakeMl: 1000 + i * 100,
          stressLevel: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
        })
      );
    }
    const result = analyzeCorrelations(entries, '30days');
    expect(result.length).toBeGreaterThan(0);
  });

  it('sorts insights by absolute correlation value', () => {
    const entries: SkinDiaryEntry[] = [];
    for (let i = 0; i < 15; i++) {
      entries.push(
        createMockEntry(i, i < 8 ? 3 : 4, {
          sleepHours: 6 + (i < 8 ? 0 : 2),
          waterIntakeMl: 1500,
        })
      );
    }
    const result = analyzeCorrelations(entries, '30days');
    if (result.length > 1) {
      expect(Math.abs(result[0].correlation)).toBeGreaterThanOrEqual(
        Math.abs(result[1].correlation)
      );
    }
  });

  it('handles entries with missing optional data', () => {
    const entries: SkinDiaryEntry[] = [];
    for (let i = 0; i < 10; i++) {
      entries.push(createMockEntry(i, (i % 5) + 1));
    }
    const result = analyzeCorrelations(entries, '30days');
    expect(result).toBeDefined();
  });
});

describe('calculateConditionAverage', () => {
  it('returns 0 for empty array', () => {
    expect(calculateConditionAverage([])).toBe(0);
  });

  it('calculates average correctly', () => {
    const entries: SkinDiaryEntry[] = [
      {
        id: '1',
        clerkUserId: 'user1',
        entryDate: new Date(),
        skinCondition: 3,
        morningRoutineCompleted: false,
        eveningRoutineCompleted: false,
        specialTreatments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        clerkUserId: 'user1',
        entryDate: new Date(),
        skinCondition: 5,
        morningRoutineCompleted: false,
        eveningRoutineCompleted: false,
        specialTreatments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    expect(calculateConditionAverage(entries)).toBe(4);
  });
});

describe('analyzeTrend', () => {
  const createEntry = (skinCondition: number): SkinDiaryEntry => ({
    id: `entry-${Math.random()}`,
    clerkUserId: 'user1',
    entryDate: new Date(),
    skinCondition: skinCondition as 1 | 2 | 3 | 4 | 5,
    morningRoutineCompleted: false,
    eveningRoutineCompleted: false,
    specialTreatments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('returns 0 for empty array', () => {
    expect(analyzeTrend([])).toBe(0);
  });

  it('returns 0 for single entry', () => {
    expect(analyzeTrend([createEntry(3)])).toBe(0);
  });

  it('returns positive slope for improving trend', () => {
    const entries = [createEntry(2), createEntry(3), createEntry(4), createEntry(5)];
    expect(analyzeTrend(entries)).toBeGreaterThan(0);
  });

  it('returns negative slope for declining trend', () => {
    const entries = [createEntry(5), createEntry(4), createEntry(3), createEntry(2)];
    expect(analyzeTrend(entries)).toBeLessThan(0);
  });

  it('returns near-zero slope for stable trend', () => {
    const entries = [createEntry(3), createEntry(3), createEntry(3), createEntry(3)];
    expect(Math.abs(analyzeTrend(entries))).toBeLessThan(0.1);
  });
});

describe('interpretTrend', () => {
  it('interprets positive slope as improving', () => {
    const result = interpretTrend(0.1);
    expect(result.direction).toBe('improving');
    expect(result.message).toContain('좋아지고');
  });

  it('interprets negative slope as declining', () => {
    const result = interpretTrend(-0.1);
    expect(result.direction).toBe('declining');
    expect(result.message).toContain('저하');
  });

  it('interprets near-zero slope as stable', () => {
    const result = interpretTrend(0.02);
    expect(result.direction).toBe('stable');
    expect(result.message).toContain('안정적');
  });

  it('considers 0.05 as threshold', () => {
    expect(interpretTrend(0.05).direction).toBe('stable');
    expect(interpretTrend(0.06).direction).toBe('improving');
    expect(interpretTrend(-0.06).direction).toBe('declining');
  });
});
