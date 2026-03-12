/**
 * recommendSizeEnhanced 11체형 × 카테고리 조합 테스트
 * 체형별 사이즈 조정 규칙의 정확성 검증
 */

import { describe, it, expect } from 'vitest';
import { recommendSizeEnhanced } from '@/lib/smart-matching/size-recommend';

// BMI 22 기준 (M 기본 사이즈), 170cm/63.5kg
const BASE_PROFILE = {
  height: 170,
  weight: 63.5,
  preferredFit: 'regular' as const,
};

// 11체형 조정 기대값
// +1 = 사이즈 업 (M→L), -1 = 사이즈 다운 (M→S), 0 = 유지 (M)
const EXPECTED_ADJUSTMENTS: Record<string, { top: number; bottom: number; outer: number }> = {
  S: { top: 0, bottom: 0, outer: 0 },
  W: { top: 0, bottom: 1, outer: 0 },
  N: { top: 1, bottom: 0, outer: 1 },
  X: { top: 0, bottom: 0, outer: 0 },
  A: { top: -1, bottom: 1, outer: -1 },
  V: { top: 1, bottom: -1, outer: 1 },
  H: { top: 0, bottom: 0, outer: 0 },
  O: { top: 1, bottom: 1, outer: 1 },
  I: { top: 0, bottom: 0, outer: 0 },
  Y: { top: 1, bottom: 0, outer: 1 },
  '8': { top: 0, bottom: 0, outer: 0 },
};

// 조정값에 따른 예상 사이즈 (기본 M 기준)
function expectedSize(adjustment: number): string {
  if (adjustment > 0) return 'L';
  if (adjustment < 0) return 'S';
  return 'M';
}

describe('recommendSizeEnhanced - 11체형 × 3카테고리 조합', () => {
  const BODY_TYPES = Object.keys(EXPECTED_ADJUSTMENTS);
  const CATEGORIES = ['top', 'bottom', 'outer'] as const;

  for (const bodyType of BODY_TYPES) {
    describe(`체형 ${bodyType}`, () => {
      for (const category of CATEGORIES) {
        const adj = EXPECTED_ADJUSTMENTS[bodyType][category];
        const expected = expectedSize(adj);
        let adjLabel = '0 (유지)';
        if (adj > 0) adjLabel = `+${adj} (업)`;
        else if (adj < 0) adjLabel = `${adj} (다운)`;

        it(`${category} 카테고리: 조정 ${adjLabel} → ${expected}`, () => {
          const result = recommendSizeEnhanced(
            { category },
            { ...BASE_PROFILE, bodyType: bodyType as any }
          );

          expect(result.size).toBe(expected);

          // 조정이 있는 경우 adjustments 기록 확인
          if (adj !== 0) {
            expect(result.adjustments).toBeDefined();
            expect(result.adjustments?.fromSize).toBe('M');
            expect(result.adjustments?.toSize).toBe(expected);
          }
        });
      }
    });
  }
});

describe('recommendSizeEnhanced - 핏 선호도 반영', () => {
  it('loose 선호 시 한 사이즈 업', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { ...BASE_PROFILE, bodyType: 'S', preferredFit: 'loose' }
    );

    // S체형(조정 0) + loose(+1) = L
    expect(result.size).toBe('L');
  });

  it('tight 선호 시 한 사이즈 다운', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { ...BASE_PROFILE, bodyType: 'S', preferredFit: 'tight' }
    );

    // S체형(조정 0) + tight(-1) = S
    expect(result.size).toBe('S');
  });

  it('regular 선호 시 조정 없음', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { ...BASE_PROFILE, bodyType: 'S', preferredFit: 'regular' }
    );

    // S체형(조정 0) + regular(0) = M
    expect(result.size).toBe('M');
  });
});

describe('recommendSizeEnhanced - 체형 + 핏 복합 조정', () => {
  it('V체형 + loose 선호: 상의 2단계 업 (M→XL)', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { ...BASE_PROFILE, bodyType: 'V', preferredFit: 'loose' }
    );

    // V체형(+1) + loose(+1) = +2 → XL
    expect(result.size).toBe('XL');
  });

  it('A체형 + tight 선호: 상의 2단계 다운 (M→XS)', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { ...BASE_PROFILE, bodyType: 'A', preferredFit: 'tight' }
    );

    // A체형(-1) + tight(-1) = -2 → XS
    expect(result.size).toBe('XS');
  });

  it('O체형 + loose 선호: 하의 2단계 업', () => {
    const result = recommendSizeEnhanced(
      { category: 'bottom' },
      { ...BASE_PROFILE, bodyType: 'O', preferredFit: 'loose' }
    );

    // O체형(+1) + loose(+1) = +2 → XL
    expect(result.size).toBe('XL');
  });
});

describe('recommendSizeEnhanced - 결과 구조 검증', () => {
  it('결과에 size, confidence, reasoning 필드가 포함된다', () => {
    const result = recommendSizeEnhanced({ category: 'top' }, { ...BASE_PROFILE, bodyType: 'S' });

    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('reasoning');
    expect(typeof result.size).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.reasoning).toBe('string');
  });

  it('confidence는 0-100 범위이다', () => {
    const result = recommendSizeEnhanced({ category: 'top' }, { ...BASE_PROFILE, bodyType: 'W' });

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('reasoning에 BMI 정보가 포함된다', () => {
    const result = recommendSizeEnhanced({ category: 'top' }, { ...BASE_PROFILE, bodyType: 'N' });

    expect(result.reasoning).toMatch(/BMI/);
  });

  it('체형 조정이 있으면 reasoning에 체형명이 포함된다', () => {
    const result = recommendSizeEnhanced({ category: 'top' }, { ...BASE_PROFILE, bodyType: 'N' });

    // N(내추럴) 체형은 상의 +1 조정
    expect(result.reasoning).toMatch(/내추럴/);
  });
});

describe('recommendSizeEnhanced - BMI 경계값', () => {
  it('저체중 BMI(< 18.5)는 S 기본 사이즈', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { height: 170, weight: 50, bodyType: 'S', preferredFit: 'regular' }
    );

    // BMI ~17.3 → S 기본
    expect(result.size).toBe('S');
  });

  it('과체중 BMI(≥ 27)는 XL 기본 사이즈', () => {
    const result = recommendSizeEnhanced(
      { category: 'top' },
      { height: 170, weight: 85, bodyType: 'S', preferredFit: 'regular' }
    );

    // BMI ~29.4 → XL 기본
    expect(result.size).toBe('XL');
  });
});
