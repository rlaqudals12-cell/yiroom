/**
 * 성분 상호작용 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  INGREDIENT_INTERACTIONS,
  detectInteractions,
  categorizeInteractions,
  calculateInteractionPenalty,
} from '@/lib/scan/ingredient-interactions';

describe('INGREDIENT_INTERACTIONS', () => {
  it('상호작용 규칙 배열 존재', () => {
    expect(Array.isArray(INGREDIENT_INTERACTIONS)).toBe(true);
    expect(INGREDIENT_INTERACTIONS.length).toBeGreaterThan(0);
  });

  it('각 규칙에 필수 필드 존재', () => {
    for (const rule of INGREDIENT_INTERACTIONS) {
      expect(rule.ingredient1).toBeDefined();
      expect(rule.ingredient2).toBeDefined();
      expect(rule.type).toBeDefined();
      expect(['synergy', 'avoid_together', 'caution']).toContain(rule.type);
      expect(rule.reason).toBeDefined();
      expect(rule.recommendation).toBeDefined();
    }
  });
});

describe('detectInteractions', () => {
  it('레티놀 + AHA 조합 감지', () => {
    const ingredients = ['RETINOL', 'GLYCOLIC ACID'];
    const warnings = detectInteractions(ingredients);

    expect(warnings.length).toBeGreaterThan(0);
    const retinolAha = warnings.find(
      (w) => w.ingredients.includes('RETINOL') && w.ingredients.includes('GLYCOLIC ACID')
    );
    expect(retinolAha).toBeDefined();
    expect(retinolAha?.type).toBe('avoid_together');
  });

  it('비타민C + 나이아신아마이드 시너지 감지', () => {
    const ingredients = ['VITAMIN C', 'NIACINAMIDE'];
    const warnings = detectInteractions(ingredients);

    const synergy = warnings.find((w) => w.type === 'synergy');
    expect(synergy).toBeDefined();
  });

  it('비타민C + 비타민E 시너지 감지', () => {
    const ingredients = ['VITAMIN C', 'TOCOPHEROL'];
    const warnings = detectInteractions(ingredients);

    const synergy = warnings.find((w) => w.type === 'synergy');
    expect(synergy).toBeDefined();
  });

  it('상호작용 없는 성분은 빈 배열', () => {
    const ingredients = ['WATER', 'GLYCERIN', 'PANTHENOL'];
    const warnings = detectInteractions(ingredients);

    expect(warnings.length).toBe(0);
  });

  it('중복 조합 제거', () => {
    const ingredients = ['RETINOL', 'AHA', 'RETINOL']; // 중복
    const warnings = detectInteractions(ingredients);

    // 같은 조합은 한 번만 감지
    const count = warnings.filter((w) => w.ingredients.includes('RETINOL')).length;
    expect(count).toBeLessThanOrEqual(1);
  });
});

describe('categorizeInteractions', () => {
  it('타입별로 분류', () => {
    const warnings = [
      {
        ingredients: ['VITAMIN C', 'NIACINAMIDE'] as [string, string],
        type: 'synergy' as const,
        reason: 'test',
        recommendation: 'test',
      },
      {
        ingredients: ['RETINOL', 'AHA'] as [string, string],
        type: 'avoid_together' as const,
        reason: 'test',
        recommendation: 'test',
      },
      {
        ingredients: ['VITAMIN C', 'AHA'] as [string, string],
        type: 'caution' as const,
        reason: 'test',
        recommendation: 'test',
      },
    ];

    const categorized = categorizeInteractions(warnings);

    expect(categorized.synergies.length).toBe(1);
    expect(categorized.avoidTogether.length).toBe(1);
    expect(categorized.cautions.length).toBe(1);
  });

  it('빈 배열 입력 시 빈 카테고리', () => {
    const categorized = categorizeInteractions([]);

    expect(categorized.synergies.length).toBe(0);
    expect(categorized.avoidTogether.length).toBe(0);
    expect(categorized.cautions.length).toBe(0);
  });
});

describe('calculateInteractionPenalty', () => {
  it('avoid_together는 10점 패널티', () => {
    const warnings = [
      {
        ingredients: ['RETINOL', 'AHA'] as [string, string],
        type: 'avoid_together' as const,
        reason: 'test',
        recommendation: 'test',
      },
    ];

    expect(calculateInteractionPenalty(warnings)).toBe(10);
  });

  it('caution은 3점 패널티', () => {
    const warnings = [
      {
        ingredients: ['VITAMIN C', 'AHA'] as [string, string],
        type: 'caution' as const,
        reason: 'test',
        recommendation: 'test',
      },
    ];

    expect(calculateInteractionPenalty(warnings)).toBe(3);
  });

  it('synergy는 패널티 감소 (보너스)', () => {
    const warnings = [
      {
        ingredients: ['VITAMIN C', 'NIACINAMIDE'] as [string, string],
        type: 'synergy' as const,
        reason: 'test',
        recommendation: 'test',
      },
    ];

    // 시너지는 -2점이지만 최소 0
    expect(calculateInteractionPenalty(warnings)).toBe(0);
  });

  it('복합 계산', () => {
    const warnings = [
      {
        ingredients: ['RETINOL', 'AHA'] as [string, string],
        type: 'avoid_together' as const,
        reason: 'test',
        recommendation: 'test',
      },
      {
        ingredients: ['VITAMIN C', 'AHA'] as [string, string],
        type: 'caution' as const,
        reason: 'test',
        recommendation: 'test',
      },
      {
        ingredients: ['VITAMIN C', 'NIACINAMIDE'] as [string, string],
        type: 'synergy' as const,
        reason: 'test',
        recommendation: 'test',
      },
    ];

    // 10 + 3 - 2 = 11
    expect(calculateInteractionPenalty(warnings)).toBe(11);
  });
});
