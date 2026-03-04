/**
 * 4단계 안전성 파이프라인 테스트
 *
 * @module tests/lib/safety/pipeline
 * @description 5 알레르겐 그룹, 금기사항, 연령 제한, 성분 상호작용, 등급 결정
 */

import { describe, it, expect } from 'vitest';
import { checkProductSafety } from '@/lib/safety/pipeline';
import type { SafetyProfile, SafetyCheckInput } from '@/lib/safety/types';

// =============================================================================
// 테스트 헬퍼
// =============================================================================

function createProfile(overrides: Partial<SafetyProfile> = {}): SafetyProfile {
  return {
    userId: 'user_test',
    allergies: [],
    conditions: [],
    skinConditions: [],
    medications: [],
    age: 25,
    consentGiven: true,
    consentVersion: '1.0',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createInput(
  ingredients: string[],
  profileOverrides: Partial<SafetyProfile> = {}
): SafetyCheckInput {
  return {
    productId: 'product_test',
    ingredients,
    profile: createProfile(profileOverrides),
  };
}

// =============================================================================
// 동의 미완료
// =============================================================================

describe('Consent check', () => {
  it('should return empty report for unconsented user', () => {
    const input = createInput(['retinol', 'niacinamide'], {
      consentGiven: false,
      allergies: ['almond'],
    });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('SAFE');
    expect(report.score).toBe(100);
    expect(report.alerts).toHaveLength(0);
    expect(report.blockedIngredients).toHaveLength(0);
  });
});

// =============================================================================
// Step 1: 알레르겐 교차반응 (Level 1, BLOCK)
// =============================================================================

describe('Step 1: Allergen cross-reactivity', () => {
  // 견과류 그룹
  it('should BLOCK tree nut cross-reactive ingredients', () => {
    const input = createInput(['sweet almond oil', 'niacinamide'], { allergies: ['walnut'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('DANGER');
    expect(report.blockedIngredients).toContain('sweet almond oil');
    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 1,
          type: 'ALLERGEN',
          action: 'BLOCK',
          ingredient: 'sweet almond oil',
        }),
      ])
    );
  });

  // 라텍스-과일 그룹
  it('should BLOCK latex-fruit cross-reactive ingredients', () => {
    const input = createInput(['avocado oil', 'hyaluronic acid'], { allergies: ['latex'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('DANGER');
    expect(report.blockedIngredients).toContain('avocado oil');
  });

  // 국화과 그룹
  it('should BLOCK asteraceae cross-reactive ingredients', () => {
    const input = createInput(['chamomile extract', 'aloe vera'], { allergies: ['arnica'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('DANGER');
    expect(report.blockedIngredients).toContain('chamomile extract');
  });

  // 프로폴리스-발삼 그룹
  it('should BLOCK propolis-balsam cross-reactive ingredients', () => {
    const input = createInput(['propolis extract', 'vitamin e'], { allergies: ['peru balsam'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('DANGER');
    expect(report.blockedIngredients).toContain('propolis extract');
  });

  // 니켈-금속 그룹
  it('should BLOCK nickel-metal cross-reactive ingredients', () => {
    const input = createInput(['cobalt chloride', 'zinc oxide'], { allergies: ['nickel'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('DANGER');
    expect(report.blockedIngredients).toContain('cobalt chloride');
  });

  // 알레르기 없으면 통과
  it('should pass when no allergies match', () => {
    const input = createInput(
      ['sweet almond oil', 'niacinamide'],
      { allergies: ['latex'] } // 견과류 아닌 다른 그룹
    );

    const report = checkProductSafety(input);

    expect(report.blockedIngredients).not.toContain('sweet almond oil');
  });

  // 대소문자 무시
  it('should match case-insensitively', () => {
    const input = createInput(['Sweet Almond Oil'], { allergies: ['WALNUT'] });

    const report = checkProductSafety(input);

    expect(report.blockedIngredients).toContain('sweet almond oil');
  });

  // 중복 차단 방지
  it('should not duplicate blocked ingredients', () => {
    const input = createInput(
      ['almond', 'walnut'], // 같은 그룹 2개
      { allergies: ['cashew'] }
    );

    const report = checkProductSafety(input);

    const almondBlocks = report.blockedIngredients.filter((i) => i === 'almond');
    expect(almondBlocks).toHaveLength(1);
  });

  // 알레르기 빈 배열이면 스킵
  it('should skip when allergies is empty', () => {
    const input = createInput(['sweet almond oil'], { allergies: [] });

    const report = checkProductSafety(input);

    expect(report.blockedIngredients).toHaveLength(0);
  });
});

// =============================================================================
// Step 2: 금기사항 (Level 2, WARN)
// =============================================================================

describe('Step 2: Contraindications', () => {
  // 임신 + 레티노이드
  it('should WARN for retinol during pregnancy', () => {
    const input = createInput(['retinol', 'niacinamide'], { conditions: ['pregnancy'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 2,
          type: 'CONTRAINDICATION',
          action: 'WARN',
          ingredient: 'retinol',
        }),
      ])
    );
  });

  // 임신 + 살리실산
  it('should WARN for salicylic acid during pregnancy', () => {
    const input = createInput(['salicylic acid', 'glycerin'], { conditions: ['pregnancy'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'salicylic acid',
        }),
      ])
    );
  });

  // 임신 + 하이드로퀴논
  it('should WARN for hydroquinone during pregnancy', () => {
    const input = createInput(['hydroquinone'], { conditions: ['pregnancy'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'hydroquinone',
        }),
      ])
    );
  });

  // 아토피 + 향료
  it('should WARN for fragrance with atopy', () => {
    const input = createInput(['fragrance', 'glycerin'], { skinConditions: ['atopy'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'fragrance',
        }),
      ])
    );
  });

  // 아토피 + SLS
  it('should WARN for SLS with atopy', () => {
    const input = createInput(['sodium lauryl sulfate'], { conditions: ['atopy'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'sodium lauryl sulfate',
        }),
      ])
    );
  });

  // 건선 + 알코올
  it('should WARN for alcohol with psoriasis', () => {
    const input = createInput(['alcohol denat'], { conditions: ['psoriasis'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'alcohol denat',
        }),
      ])
    );
  });

  // 로사시아 + 멘톨
  it('should WARN for menthol with rosacea', () => {
    const input = createInput(['menthol', 'aloe vera'], { skinConditions: ['rosacea'] });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'menthol',
        }),
      ])
    );
  });

  // 해당 없는 조건이면 통과
  it('should pass when condition does not match', () => {
    const input = createInput(
      ['retinol'],
      { conditions: ['diabetes'] } // 규칙에 없는 조건
    );

    const report = checkProductSafety(input);

    const contraindicationAlerts = report.alerts.filter((a) => a.type === 'CONTRAINDICATION');
    expect(contraindicationAlerts).toHaveLength(0);
  });
});

// =============================================================================
// Step 2: 연령 제한
// =============================================================================

describe('Step 2: Age restrictions', () => {
  it('should WARN for AHA under age 12', () => {
    const input = createInput(['aha'], { age: 10 });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'aha',
        }),
      ])
    );
  });

  it('should WARN for retinol under age 16', () => {
    const input = createInput(['retinol'], { age: 14 });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'CONTRAINDICATION',
          ingredient: 'retinol',
        }),
      ])
    );
  });

  it('should pass for retinol at age 16', () => {
    const input = createInput(['retinol'], { age: 16 });

    const report = checkProductSafety(input);

    const ageAlerts = report.alerts.filter(
      (a) => a.type === 'CONTRAINDICATION' && a.ingredient === 'retinol'
    );
    expect(ageAlerts).toHaveLength(0);
  });

  it('should skip age check when age is null', () => {
    const input = createInput(['aha'], { age: null });

    const report = checkProductSafety(input);

    const ageAlerts = report.alerts.filter((a) => a.source?.includes('연령'));
    expect(ageAlerts).toHaveLength(0);
  });

  it('should WARN for benzoyl peroxide under 12', () => {
    const input = createInput(['benzoyl peroxide'], { age: 8 });

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ingredient: 'benzoyl peroxide',
        }),
      ])
    );
  });
});

// =============================================================================
// Step 3: 성분 상호작용 (Level 2-3, WARN/INFORM)
// =============================================================================

describe('Step 3: Ingredient interactions', () => {
  // pH 충돌
  it('should INFORM for vitamin C + niacinamide pH conflict', () => {
    const input = createInput(['vitamin c', 'niacinamide']);

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'INTERACTION',
          action: 'INFORM',
          ingredient: 'vitamin c + niacinamide',
        }),
      ])
    );
  });

  // 산화 비호환 (Level 2)
  it('should WARN for retinol + benzoyl peroxide', () => {
    const input = createInput(['retinol', 'benzoyl peroxide']);

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'INTERACTION',
          action: 'WARN',
          ingredient: 'retinol + benzoyl peroxide',
        }),
      ])
    );
  });

  // 산화 비호환 (Level 3)
  it('should INFORM for retinol + vitamin c', () => {
    const input = createInput(['retinol', 'vitamin c']);

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'INTERACTION',
          action: 'INFORM',
          ingredient: 'retinol + vitamin c',
        }),
      ])
    );
  });

  // AHA + 레티놀
  it('should WARN for AHA + retinol', () => {
    const input = createInput(['aha', 'retinol']);

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'INTERACTION',
          action: 'WARN',
        }),
      ])
    );
  });

  // 킬레이션
  it('should INFORM for EDTA + zinc oxide chelation', () => {
    const input = createInput(['edta', 'zinc oxide']);

    const report = checkProductSafety(input);

    expect(report.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'INTERACTION',
          action: 'INFORM',
          ingredient: 'edta + zinc oxide',
        }),
      ])
    );
  });

  // 한쪽만 있으면 통과
  it('should pass when only one interaction ingredient is present', () => {
    const input = createInput(['retinol', 'glycerin']);

    const report = checkProductSafety(input);

    const interactionAlerts = report.alerts.filter((a) => a.type === 'INTERACTION');
    expect(interactionAlerts).toHaveLength(0);
  });
});

// =============================================================================
// 등급 결정 + 점수
// =============================================================================

describe('Grade determination', () => {
  it('should be SAFE for clean product with no issues', () => {
    const input = createInput(['glycerin', 'hyaluronic acid', 'aloe vera']);

    const report = checkProductSafety(input);

    expect(report.grade).toBe('SAFE');
    expect(report.score).toBe(100);
  });

  it('should be DANGER when blocked ingredients exist', () => {
    const input = createInput(['walnut extract'], { allergies: ['almond'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('DANGER');
  });

  it('should be CAUTION with multiple warnings', () => {
    const input = createInput(['retinol', 'benzoyl peroxide', 'aha'], {
      conditions: ['pregnancy'],
    });

    const report = checkProductSafety(input);

    // 임신 + 레티놀 (-30) + 레티놀+벤조일 (-15) + AHA+레티놀 (-15)
    // + 임신 + adapalene은 없음 → 점수 하락
    expect(report.score).toBeLessThan(80);
  });

  it('should clamp score to minimum 0', () => {
    // 많은 알레르겐으로 점수 대폭 하락
    const input = createInput(
      ['almond', 'walnut', 'cashew', 'pistachio'],
      { allergies: ['almond'] } // 견과류 그룹
    );

    const report = checkProductSafety(input);

    expect(report.score).toBeGreaterThanOrEqual(0);
  });

  it('should include disclaimer in report', () => {
    const input = createInput(['walnut extract'], { allergies: ['almond'] });

    const report = checkProductSafety(input);

    expect(report.disclaimer).toBeTruthy();
    expect(report.disclaimer.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 복합 시나리오
// =============================================================================

describe('Complex scenarios', () => {
  it('should handle multiple issues simultaneously', () => {
    const input = createInput(['retinol', 'sweet almond oil', 'vitamin c', 'fragrance'], {
      allergies: ['walnut'], // 견과류 → sweet almond oil BLOCK
      conditions: ['pregnancy'], // 임신 → retinol WARN
      skinConditions: ['atopy'], // 아토피 → fragrance WARN
    });

    const report = checkProductSafety(input);

    // 교차반응 차단
    expect(report.blockedIngredients).toContain('sweet almond oil');
    // 금기사항 경고
    expect(
      report.alerts.some((a) => a.type === 'CONTRAINDICATION' && a.ingredient === 'retinol')
    ).toBe(true);
    expect(
      report.alerts.some((a) => a.type === 'CONTRAINDICATION' && a.ingredient === 'fragrance')
    ).toBe(true);
    // 상호작용
    expect(report.alerts.some((a) => a.type === 'INTERACTION')).toBe(true);
    // DANGER (BLOCK 있음)
    expect(report.grade).toBe('DANGER');
  });

  it('should handle empty ingredients list', () => {
    const input = createInput([], { allergies: ['walnut'] });

    const report = checkProductSafety(input);

    expect(report.grade).toBe('SAFE');
    expect(report.alerts).toHaveLength(0);
  });

  it('should normalize ingredient case', () => {
    const input = createInput(['RETINOL', 'Benzoyl Peroxide']);

    const report = checkProductSafety(input);

    // 대소문자 정규화 후 상호작용 감지
    expect(report.alerts.some((a) => a.type === 'INTERACTION')).toBe(true);
  });
});
