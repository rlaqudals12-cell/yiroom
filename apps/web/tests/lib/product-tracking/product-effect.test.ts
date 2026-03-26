import { describe, it, expect } from 'vitest';
import {
  analyzeProductEffect,
  estimateContribution,
  type TrackedProduct,
  type ScoreSnapshot,
} from '@/lib/product-tracking';

const mockProduct: TrackedProduct = {
  id: 'tp-1',
  productId: 'prod-123',
  productName: '세라마이드 크림',
  productBrand: '이니스프리',
  category: 'skincare',
  startDate: '2026-02-01',
  isActive: true,
};

const startSnapshot: ScoreSnapshot = {
  date: '2026-02-01',
  skin: {
    hydration: 55,
    oil: 50,
    pores: 60,
    wrinkles: 70,
    elasticity: 65,
    pigmentation: 72,
    trouble: 68,
    overallScore: 62,
  },
};

const currentSnapshot: ScoreSnapshot = {
  date: '2026-03-01',
  skin: {
    hydration: 71,
    oil: 48,
    pores: 62,
    wrinkles: 72,
    elasticity: 70,
    pigmentation: 74,
    trouble: 70,
    overallScore: 76,
  },
};

describe('analyzeProductEffect', () => {
  it('피부 지표 변화를 정확히 계산한다', () => {
    const result = analyzeProductEffect(mockProduct, startSnapshot, currentSnapshot);
    const hydrationChange = result.changes.find((c) => c.metricId === 'hydration');
    expect(hydrationChange).toBeDefined();
    expect(hydrationChange!.before).toBe(55);
    expect(hydrationChange!.after).toBe(71);
    expect(hydrationChange!.change).toBe(16);
    expect(hydrationChange!.trend).toBe('improved');
  });

  it('사용 기간을 정확히 계산한다', () => {
    const result = analyzeProductEffect(mockProduct, startSnapshot, currentSnapshot);
    expect(result.durationDays).toBe(28);
  });

  it('4주 이상 사용 시 신뢰도 high', () => {
    const result = analyzeProductEffect(mockProduct, startSnapshot, currentSnapshot);
    expect(result.reliability).toBe('high');
  });

  it('2주 미만 사용 시 신뢰도 low', () => {
    const shortSnapshot: ScoreSnapshot = { date: '2026-02-10', skin: currentSnapshot.skin };
    const result = analyzeProductEffect(mockProduct, startSnapshot, shortSnapshot);
    expect(result.reliability).toBe('low');
  });

  it('변화 3점 미만은 stable로 판정', () => {
    const result = analyzeProductEffect(mockProduct, startSnapshot, currentSnapshot);
    const oilChange = result.changes.find((c) => c.metricId === 'oil');
    expect(oilChange!.trend).toBe('stable'); // 50→48, 차이 -2
  });

  it('요약 문자열을 생성한다', () => {
    const result = analyzeProductEffect(mockProduct, startSnapshot, currentSnapshot);
    expect(result.summary).toContain('세라마이드 크림');
    expect(result.summary).toContain('28일');
  });

  it('헤어 제품은 hair 지표를 추적한다', () => {
    const hairProduct: TrackedProduct = { ...mockProduct, category: 'haircare' };
    const hairStart: ScoreSnapshot = {
      date: '2026-02-01',
      hair: { hydration: 50, shine: 40, overallScore: 55 },
    };
    const hairCurrent: ScoreSnapshot = {
      date: '2026-03-01',
      hair: { hydration: 65, shine: 58, overallScore: 68 },
    };
    const result = analyzeProductEffect(hairProduct, hairStart, hairCurrent);
    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.changes.find((c) => c.metricId === 'shine')?.trend).toBe('improved');
  });
});

describe('estimateContribution', () => {
  it('기여도 높은 순으로 정렬한다', () => {
    const effect1 = analyzeProductEffect(mockProduct, startSnapshot, currentSnapshot);
    const effect2 = analyzeProductEffect({ ...mockProduct, productName: '토너' }, startSnapshot, {
      date: '2026-03-01',
      skin: { ...startSnapshot.skin!, hydration: 58 },
    });
    const contributions = estimateContribution([effect1, effect2]);
    expect(contributions[0].productName).toBe('세라마이드 크림');
    expect(contributions[0].estimatedContribution).toBeGreaterThan(
      contributions[1].estimatedContribution
    );
  });
});
