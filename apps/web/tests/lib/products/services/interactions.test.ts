/**
 * Sprint 2: 성분 상호작용 테스트
 * @description 상호작용 서비스 및 타입 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  summarizeInteractions,
  filterWarningsOnly,
  filterSynergiesOnly,
} from '@/lib/products/services/interactions';
import {
  toIngredientInteraction,
  getInteractionTypeLabel,
  getInteractionTypeColor,
  getInteractionTypeBgColor,
  getSeverityLabel,
  getSeverityColor,
  type IngredientInteractionRow,
  type IngredientInteraction,
  type ProductInteractionWarning,
  type Severity,
} from '@/types/interaction';

// ================================================
// toIngredientInteraction 테스트
// ================================================

describe('toIngredientInteraction', () => {
  const mockRow: IngredientInteractionRow = {
    id: 'int-1',
    ingredient_a: '비타민 C',
    ingredient_b: '철분',
    interaction_type: 'caution',
    severity: 'medium',
    description: '비타민 C가 철분 흡수를 증가시킴',
    recommendation: '함께 복용 시 주의',
    source: '논문 A',
    created_at: '2025-01-01T00:00:00Z',
  };

  it('DB row를 IngredientInteraction으로 변환', () => {
    const result = toIngredientInteraction(mockRow);

    expect(result.id).toBe('int-1');
    expect(result.ingredientA).toBe('비타민 C');
    expect(result.ingredientB).toBe('철분');
    expect(result.interactionType).toBe('caution');
    expect(result.severity).toBe('medium');
    expect(result.description).toBe('비타민 C가 철분 흡수를 증가시킴');
    expect(result.recommendation).toBe('함께 복용 시 주의');
    expect(result.source).toBe('논문 A');
  });

  it('null 필드를 undefined로 변환', () => {
    const rowWithNulls: IngredientInteractionRow = {
      ...mockRow,
      severity: null,
      recommendation: null,
      source: null,
    };

    const result = toIngredientInteraction(rowWithNulls);

    expect(result.severity).toBeUndefined();
    expect(result.recommendation).toBeUndefined();
    expect(result.source).toBeUndefined();
  });
});

// ================================================
// getInteractionTypeLabel 테스트
// ================================================

describe('getInteractionTypeLabel', () => {
  it('contraindication은 "금기" 반환', () => {
    expect(getInteractionTypeLabel('contraindication')).toBe('금기');
  });

  it('caution은 "주의" 반환', () => {
    expect(getInteractionTypeLabel('caution')).toBe('주의');
  });

  it('synergy는 "시너지" 반환', () => {
    expect(getInteractionTypeLabel('synergy')).toBe('시너지');
  });

  it('timing은 "시간 분리" 반환', () => {
    expect(getInteractionTypeLabel('timing')).toBe('시간 분리');
  });
});

// ================================================
// getInteractionTypeColor 테스트
// ================================================

describe('getInteractionTypeColor', () => {
  it('contraindication은 red 반환', () => {
    expect(getInteractionTypeColor('contraindication')).toContain('red');
  });

  it('caution은 orange 반환', () => {
    expect(getInteractionTypeColor('caution')).toContain('orange');
  });

  it('synergy는 green 반환', () => {
    expect(getInteractionTypeColor('synergy')).toContain('green');
  });

  it('timing은 blue 반환', () => {
    expect(getInteractionTypeColor('timing')).toContain('blue');
  });
});

// ================================================
// getInteractionTypeBgColor 테스트
// ================================================

describe('getInteractionTypeBgColor', () => {
  it('contraindication은 red 배경 반환', () => {
    expect(getInteractionTypeBgColor('contraindication')).toContain('red');
  });

  it('caution은 orange 배경 반환', () => {
    expect(getInteractionTypeBgColor('caution')).toContain('orange');
  });

  it('synergy는 green 배경 반환', () => {
    expect(getInteractionTypeBgColor('synergy')).toContain('green');
  });

  it('timing은 blue 배경 반환', () => {
    expect(getInteractionTypeBgColor('timing')).toContain('blue');
  });
});

// ================================================
// getSeverityLabel 테스트
// ================================================

describe('getSeverityLabel', () => {
  it('high는 "높음" 반환', () => {
    expect(getSeverityLabel('high')).toBe('높음');
  });

  it('medium은 "보통" 반환', () => {
    expect(getSeverityLabel('medium')).toBe('보통');
  });

  it('low는 "낮음" 반환', () => {
    expect(getSeverityLabel('low')).toBe('낮음');
  });
});

// ================================================
// getSeverityColor 테스트
// ================================================

describe('getSeverityColor', () => {
  it('high는 red 반환', () => {
    expect(getSeverityColor('high')).toContain('red');
  });

  it('medium은 yellow 반환', () => {
    expect(getSeverityColor('medium')).toContain('yellow');
  });

  it('low는 green 반환', () => {
    expect(getSeverityColor('low')).toContain('green');
  });
});

// ================================================
// summarizeInteractions 테스트
// ================================================

describe('summarizeInteractions', () => {
  it('빈 배열에서 0 반환', () => {
    const result = summarizeInteractions([]);

    expect(result.totalWarnings).toBe(0);
    expect(result.byType).toEqual({
      contraindication: 0,
      caution: 0,
      timing: 0,
      synergy: 0,
    });
    expect(result.bySeverity).toEqual({
      high: 0,
      medium: 0,
      low: 0,
    });
  });

  it('경고 수 및 유형별 집계', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('contraindication', 'high'),
      ]),
      createMockWarning([
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = summarizeInteractions(warnings);

    expect(result.totalWarnings).toBe(2);
    expect(result.byType.caution).toBe(1);
    expect(result.byType.contraindication).toBe(1);
    expect(result.byType.synergy).toBe(1);
    expect(result.bySeverity.high).toBe(1);
    expect(result.bySeverity.medium).toBe(1);
    expect(result.bySeverity.low).toBe(1);
  });
});

// ================================================
// filterWarningsOnly 테스트
// ================================================

describe('filterWarningsOnly', () => {
  it('시너지를 제외하고 반환', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('synergy', 'low'),
      ]),
      createMockWarning([
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = filterWarningsOnly(warnings);

    expect(result.length).toBe(1);
    expect(result[0].interactions.length).toBe(1);
    expect(result[0].interactions[0].interactionType).toBe('caution');
  });

  it('경고만 있는 항목 유지', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('contraindication', 'high'),
        createMockInteraction('timing', 'medium'),
      ]),
    ];

    const result = filterWarningsOnly(warnings);

    expect(result.length).toBe(1);
    expect(result[0].interactions.length).toBe(2);
  });
});

// ================================================
// filterSynergiesOnly 테스트
// ================================================

describe('filterSynergiesOnly', () => {
  it('시너지만 반환', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('synergy', 'low'),
      ]),
      createMockWarning([
        createMockInteraction('contraindication', 'high'),
      ]),
    ];

    const result = filterSynergiesOnly(warnings);

    expect(result.length).toBe(1);
    expect(result[0].interactions.length).toBe(1);
    expect(result[0].interactions[0].interactionType).toBe('synergy');
  });

  it('시너지만 있는 항목 유지', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('synergy', 'low'),
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = filterSynergiesOnly(warnings);

    expect(result.length).toBe(1);
    expect(result[0].interactions.length).toBe(2);
  });
});

// ================================================
// 헬퍼 함수
// ================================================

function createMockInteraction(
  interactionType: IngredientInteraction['interactionType'],
  severity: Severity
): IngredientInteraction {
  return {
    id: `int-${Math.random().toString(36).slice(2)}`,
    ingredientA: '성분 A',
    ingredientB: '성분 B',
    interactionType,
    severity,
    description: '테스트 설명',
    createdAt: '2025-01-01T00:00:00Z',
  };
}

function createMockWarning(
  interactions: IngredientInteraction[]
): ProductInteractionWarning {
  const severityOrder: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
  let maxSeverity: Severity = 'low';

  for (const int of interactions) {
    if (int.severity && severityOrder[int.severity] > severityOrder[maxSeverity]) {
      maxSeverity = int.severity;
    }
  }

  return {
    productA: { id: 'product-a', name: '제품 A', type: 'supplement' },
    productB: { id: 'product-b', name: '제품 B', type: 'supplement' },
    interactions,
    maxSeverity,
  };
}
