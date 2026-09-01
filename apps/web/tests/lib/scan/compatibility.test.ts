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

  it('영문 색 이름은 HEX 필요 고지만 제공하고 점수·overall에 영향을 주지 않는다', async () => {
    const result = await analyzeCompatibility(mockIngredients, 'makeup', 'coral', mockUserAnalysis);
    const baseline = await analyzeCompatibility(
      mockIngredients,
      'makeup',
      undefined,
      mockUserAnalysis
    );

    expect(result.colorMatch?.reason).toContain('색상 HEX');
    expect(result.colorMatch?.matchScore).toBeUndefined();
    expect(result.colorMatch?.isRecommended).toBeUndefined();
    expect(result.overallScore).toBe(baseline.overallScore);
  });

  it('한국어 색상명도 정성 참고만 제공하고 추천 점수를 만들지 않는다', async () => {
    const warmUser: UserAnalysisData = {
      personalColor: { seasonType: 'spring', tone: 'warm' },
    };
    const result = await analyzeCompatibility(mockIngredients, 'makeup', '코랄 레드', warmUser);
    expect(result.colorMatch?.reason).toContain('웜 계열 색 이름');
    expect(result.colorMatch?.reason).toContain('색상 HEX');
    expect(result.colorMatch?.matchScore).toBeUndefined();
    expect(result.colorMatch?.isRecommended).toBeUndefined();
  });

  it('12톤과 HEX가 있으면 키워드보다 CIEDE2000 엔진을 우선한다', async () => {
    const userWithTwelveTone: UserAnalysisData = {
      personalColor: {
        seasonType: 'summer',
        tone: 'cool',
        twelveTone: 'true-summer',
      },
    };
    const result = await analyzeCompatibility(
      mockIngredients,
      'makeup',
      '#87CEEB',
      userWithTwelveTone
    );
    const baseline = await analyzeCompatibility(
      mockIngredients,
      'makeup',
      undefined,
      userWithTwelveTone
    );
    expect(result.colorMatch).toMatchObject({
      isRecommended: true,
      matchScore: 95,
      reason: '이 색상은 당신의 퍼스널 컬러와 완벽하게 어울립니다.',
    });
    expect(result.overallScore).toBe(baseline.overallScore + 5);
  });

  it('3자리 HEX는 colorMatch와 종합점수 보너스를 만들지 않는다', async () => {
    const userWithTwelveTone: UserAnalysisData = {
      personalColor: {
        seasonType: 'summer',
        tone: 'cool',
        twelveTone: 'true-summer',
      },
    };
    const result = await analyzeCompatibility(mockIngredients, 'makeup', '#abc', {
      ...userWithTwelveTone,
    });
    const baseline = await analyzeCompatibility(
      mockIngredients,
      'makeup',
      undefined,
      userWithTwelveTone
    );
    expect(result.colorMatch).toBeUndefined();
    expect(result.overallScore).toBe(baseline.overallScore);
  });

  it('정확한 HEX라도 12톤이 없으면 colorMatch와 보너스를 만들지 않는다', async () => {
    const result = await analyzeCompatibility(mockIngredients, 'lip', '#87CEEB', mockUserAnalysis);
    const baseline = await analyzeCompatibility(
      mockIngredients,
      'lip',
      undefined,
      mockUserAnalysis
    );
    expect(result.colorMatch).toBeUndefined();
    expect(result.overallScore).toBe(baseline.overallScore);
  });

  it('미분류 색 이름은 colorMatch를 만들지 않는다', async () => {
    const result = await analyzeCompatibility(
      mockIngredients,
      'lip',
      '루비우 13호',
      mockUserAnalysis
    );
    expect(result.colorMatch).toBeUndefined();
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
