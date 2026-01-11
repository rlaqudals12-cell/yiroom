/**
 * 호환성 분석 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeCompatibility,
  generateMockCompatibilityResult,
  type UserAnalysisData,
} from '@/lib/scan/compatibility';
import type { ProductIngredient } from '@/types/scan';

const mockIngredients: ProductIngredient[] = [
  { order: 1, inciName: 'WATER', nameKo: '정제수' },
  { order: 2, inciName: 'NIACINAMIDE', nameKo: '나이아신아마이드' },
  { order: 3, inciName: 'HYALURONIC ACID', nameKo: '히알루론산' },
  { order: 4, inciName: 'SALICYLIC ACID', nameKo: '살리실릭애씨드' },
];

const mockUserAnalysis: UserAnalysisData = {
  skinAnalysis: {
    skinType: 'oily',
    concerns: ['acne', 'pores'],
    sensitivity: 'low',
  },
  personalColor: {
    seasonType: 'summer',
    tone: 'cool',
  },
};

describe('analyzeCompatibility', () => {
  it('피부 분석 데이터 있을 때 호환성 계산', async () => {
    const result = await analyzeCompatibility(
      mockIngredients,
      'skincare',
      undefined,
      mockUserAnalysis
    );

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.skinCompatibility).toBeDefined();
    expect(result.skinCompatibility.score).toBeGreaterThan(0);
    expect(result.hasUserAnalysis.skinAnalysis).toBe(true);
  });

  it('지성 피부에 지성 추천 성분 높은 점수', async () => {
    const result = await analyzeCompatibility(
      mockIngredients,
      'skincare',
      undefined,
      mockUserAnalysis
    );

    // 나이아신아마이드, 살리실릭애씨드는 지성에 좋음
    expect(result.skinCompatibility.goodPoints.length).toBeGreaterThan(0);
    expect(result.ingredientAnalysis.beneficial.length).toBeGreaterThan(0);
  });

  it('분석 데이터 없을 때 기본 점수', async () => {
    const result = await analyzeCompatibility(mockIngredients, 'skincare', undefined, {});

    expect(result.overallScore).toBe(75); // 기본 점수
    expect(result.hasUserAnalysis.skinAnalysis).toBe(false);
    expect(result.hasUserAnalysis.personalColor).toBe(false);
  });

  it('성분 상호작용 감지', async () => {
    const ingredientsWithInteraction: ProductIngredient[] = [
      { order: 1, inciName: 'VITAMIN C', nameKo: '비타민C' },
      { order: 2, inciName: 'NIACINAMIDE', nameKo: '나이아신아마이드' },
    ];

    const result = await analyzeCompatibility(
      ingredientsWithInteraction,
      'skincare',
      undefined,
      mockUserAnalysis
    );

    // 비타민C + 나이아신아마이드는 시너지
    const hasSynergy = result.ingredientAnalysis.interactions.some((i) => i.type === 'synergy');
    expect(hasSynergy).toBe(true);
  });

  it('민감 피부에 자극 성분 경고', async () => {
    const sensitiveUserAnalysis: UserAnalysisData = {
      skinAnalysis: {
        skinType: 'sensitive',
        concerns: ['redness'],
        sensitivity: 'high',
      },
    };

    const ingredientsWithFragrance: ProductIngredient[] = [
      { order: 1, inciName: 'WATER', nameKo: '정제수' },
      { order: 2, inciName: 'FRAGRANCE', nameKo: '향료' },
    ];

    const result = await analyzeCompatibility(
      ingredientsWithFragrance,
      'skincare',
      undefined,
      sensitiveUserAnalysis
    );

    expect(result.skinCompatibility.warnings.length).toBeGreaterThan(0);
    expect(result.ingredientAnalysis.caution.length).toBeGreaterThan(0);
  });

  it('색조 제품에 퍼스널 컬러 매칭', async () => {
    const result = await analyzeCompatibility(mockIngredients, 'makeup', 'coral', mockUserAnalysis);

    expect(result.colorMatch).toBeDefined();
    // 쿨톤에 coral(웜 컬러)은 비추천
    expect(result.colorMatch?.isRecommended).toBe(false);
  });

  it('비색조 제품은 컬러 매칭 없음', async () => {
    const result = await analyzeCompatibility(
      mockIngredients,
      'skincare',
      undefined,
      mockUserAnalysis
    );

    expect(result.colorMatch).toBeUndefined();
  });
});

describe('generateMockCompatibilityResult', () => {
  it('Mock 결과 생성', () => {
    const mock = generateMockCompatibilityResult();

    expect(mock.overallScore).toBeDefined();
    expect(mock.skinCompatibility).toBeDefined();
    expect(mock.skinCompatibility.goodPoints.length).toBeGreaterThan(0);
    expect(mock.ingredientAnalysis).toBeDefined();
    expect(mock.ingredientAnalysis.beneficial.length).toBeGreaterThan(0);
  });

  it('Mock 결과 구조 유효', () => {
    const mock = generateMockCompatibilityResult();

    expect(typeof mock.overallScore).toBe('number');
    expect(typeof mock.skinCompatibility.score).toBe('number');
    expect(Array.isArray(mock.skinCompatibility.goodPoints)).toBe(true);
    expect(Array.isArray(mock.skinCompatibility.warnings)).toBe(true);
  });
});
