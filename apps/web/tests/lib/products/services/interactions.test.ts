/**
 * 성분 상호작용 서비스 테스트
 * @description interactions.ts의 모든 exported 함수 테스트
 *   - getInteractionBetween: 양방향 성분 쌍 조회
 *   - getIngredientInteractions: 단일 성분 전체 상호작용
 *   - getInteractionsByType: 유형별 필터링
 *   - checkProductInteractions: 제품 쌍별 상호작용 검사
 *   - summarizeInteractions: 요약 통계
 *   - filterWarningsOnly / filterSynergiesOnly: 필터링
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInteractionBetween,
  getIngredientInteractions,
  getInteractionsByType,
  checkProductInteractions,
  summarizeInteractions,
  filterWarningsOnly,
  filterSynergiesOnly,
} from '@/lib/products/services/interactions';
import type {
  IngredientInteraction,
  IngredientInteractionRow,
  ProductInteractionWarning,
  Severity,
} from '@/types/interaction';

// ================================================
// Supabase Mock
// ================================================

let mockData: IngredientInteractionRow[] | null = [];
let mockError: { message: string } | null = null;

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  limit: vi.fn(() => ({ data: mockData, error: mockError })),
};

// select()가 직접 결과를 반환하는 경우 (checkProductInteractions에서 .select('*') 후 체인 없이 사용)
// 각 체인 메서드가 최종적으로 { data, error }를 반환하도록 설정
mockSupabase.or.mockImplementation(() => ({ data: mockData, error: mockError }));
mockSupabase.select.mockImplementation(() => {
  // 체인이 계속될 수 있으므로 this 반환, 하지만 data/error도 포함
  const chainable = {
    or: vi.fn(() => ({ data: mockData, error: mockError })),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn(() => ({ data: mockData, error: mockError })),
    data: mockData,
    error: mockError,
  };
  return chainable;
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => {
      return {
        select: vi.fn(() => {
          // 마지막 호출 결과를 위한 프록시 객체
          const result = { data: mockData, error: mockError };
          return {
            ...result,
            or: vi.fn(() => ({ data: mockData, error: mockError })),
            eq: vi.fn(() => ({
              ...result,
              limit: vi.fn(() => ({ data: mockData, error: mockError })),
            })),
            in: vi.fn(() => ({ data: mockData, error: mockError })),
            limit: vi.fn(() => ({ data: mockData, error: mockError })),
          };
        }),
      };
    }),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  productLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ================================================
// 테스트 헬퍼
// ================================================

function createMockRow(
  overrides: Partial<IngredientInteractionRow> = {}
): IngredientInteractionRow {
  return {
    id: `int-${Math.random().toString(36).slice(2, 8)}`,
    ingredient_a: '비타민 C',
    ingredient_b: '철분',
    interaction_type: 'caution',
    severity: 'medium',
    description: '비타민 C가 철분 흡수를 증가시킴',
    recommendation: '함께 복용 시 주의',
    source: '논문 A',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockInteraction(
  interactionType: IngredientInteraction['interactionType'],
  severity: Severity
): IngredientInteraction {
  return {
    id: `int-${Math.random().toString(36).slice(2, 8)}`,
    ingredientA: '성분 A',
    ingredientB: '성분 B',
    interactionType,
    severity,
    description: '테스트 설명',
    createdAt: '2025-01-01T00:00:00Z',
  };
}

function createMockWarning(
  interactions: IngredientInteraction[],
  overrides: Partial<ProductInteractionWarning> = {}
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
    ...overrides,
  };
}

// ================================================
// getInteractionBetween 테스트
// ================================================

describe('getInteractionBetween', () => {
  beforeEach(() => {
    mockData = [];
    mockError = null;
  });

  it('A-B 또는 B-A 매칭되는 상호작용을 반환한다', async () => {
    const row = createMockRow({
      ingredient_a: '비타민 C',
      ingredient_b: '철분',
    });
    mockData = [row];

    const result = await getInteractionBetween('비타민 C', '철분');

    expect(result).toHaveLength(1);
    expect(result[0].ingredientA).toBe('비타민 C');
    expect(result[0].ingredientB).toBe('철분');
  });

  it('매칭되는 상호작용이 없으면 빈 배열을 반환한다', async () => {
    mockData = [];

    const result = await getInteractionBetween('없는성분A', '없는성분B');

    expect(result).toEqual([]);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    mockError = { message: 'DB connection error' };
    mockData = null;

    const result = await getInteractionBetween('비타민 C', '철분');

    expect(result).toEqual([]);
  });

  it('여러 매칭 결과를 모두 반환한다', async () => {
    mockData = [
      createMockRow({ id: 'int-1', interaction_type: 'caution' }),
      createMockRow({ id: 'int-2', interaction_type: 'timing' }),
    ];

    const result = await getInteractionBetween('비타민 C', '철분');

    expect(result).toHaveLength(2);
  });
});

// ================================================
// getIngredientInteractions 테스트
// ================================================

describe('getIngredientInteractions', () => {
  beforeEach(() => {
    mockData = [];
    mockError = null;
  });

  it('해당 성분과 관련된 모든 상호작용을 반환한다', async () => {
    mockData = [
      createMockRow({ ingredient_a: '비타민 C', ingredient_b: '철분' }),
      createMockRow({ ingredient_a: '칼슘', ingredient_b: '비타민 C' }),
    ];

    const result = await getIngredientInteractions('비타민 C');

    expect(result).toHaveLength(2);
  });

  it('매칭이 없으면 빈 배열을 반환한다', async () => {
    mockData = [];

    const result = await getIngredientInteractions('존재하지않는성분');

    expect(result).toEqual([]);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    mockError = { message: 'DB error' };
    mockData = null;

    const result = await getIngredientInteractions('비타민 C');

    expect(result).toEqual([]);
  });
});

// ================================================
// getInteractionsByType 테스트
// ================================================

describe('getInteractionsByType', () => {
  beforeEach(() => {
    mockData = [];
    mockError = null;
  });

  it('지정된 유형의 상호작용만 반환한다', async () => {
    mockData = [createMockRow({ interaction_type: 'contraindication', severity: 'high' })];

    const result = await getInteractionsByType('contraindication');

    expect(result).toHaveLength(1);
    expect(result[0].interactionType).toBe('contraindication');
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    mockError = { message: 'DB error' };
    mockData = null;

    const result = await getInteractionsByType('synergy');

    expect(result).toEqual([]);
  });

  it('결과가 없으면 빈 배열을 반환한다', async () => {
    mockData = [];

    const result = await getInteractionsByType('timing');

    expect(result).toEqual([]);
  });
});

// ================================================
// checkProductInteractions 테스트
// ================================================

describe('checkProductInteractions', () => {
  beforeEach(() => {
    mockData = [];
    mockError = null;
  });

  it('제품이 2개 미만이면 빈 배열을 반환한다', async () => {
    const result = await checkProductInteractions([{ id: 'p1', name: '제품1' } as never]);

    expect(result).toEqual([]);
  });

  it('빈 배열이면 빈 배열을 반환한다', async () => {
    const result = await checkProductInteractions([]);

    expect(result).toEqual([]);
  });

  it('성분이 없는 제품들이면 빈 배열을 반환한다', async () => {
    mockData = [];

    const result = await checkProductInteractions([
      { id: 'p1', name: '제품1' } as never,
      { id: 'p2', name: '제품2' } as never,
    ]);

    expect(result).toEqual([]);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    mockError = { message: 'DB error' };
    mockData = null;

    const products = [
      {
        id: 'p1',
        name: '비타민C 보충제',
        mainIngredients: [{ name: '비타민 C' }],
      } as never,
      {
        id: 'p2',
        name: '철분 보충제',
        mainIngredients: [{ name: '철분' }],
      } as never,
    ];

    const result = await checkProductInteractions(products);

    expect(result).toEqual([]);
  });
});

// ================================================
// summarizeInteractions 테스트
// ================================================

describe('summarizeInteractions', () => {
  it('빈 배열에서 모든 카운트가 0인 요약을 반환한다', () => {
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

  it('경고 수 및 유형별 집계를 정확히 계산한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('contraindication', 'high'),
      ]),
      createMockWarning([createMockInteraction('synergy', 'low')]),
    ];

    const result = summarizeInteractions(warnings);

    expect(result.totalWarnings).toBe(2);
    expect(result.byType.caution).toBe(1);
    expect(result.byType.contraindication).toBe(1);
    expect(result.byType.synergy).toBe(1);
    expect(result.byType.timing).toBe(0);
    expect(result.bySeverity.high).toBe(1);
    expect(result.bySeverity.medium).toBe(1);
    expect(result.bySeverity.low).toBe(1);
  });

  it('같은 유형의 여러 상호작용을 올바르게 집계한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('caution', 'high'),
        createMockInteraction('caution', 'low'),
      ]),
    ];

    const result = summarizeInteractions(warnings);

    expect(result.byType.caution).toBe(3);
    expect(result.totalWarnings).toBe(1);
  });

  it('severity가 없는 상호작용은 bySeverity에 포함하지 않는다', () => {
    const interactionNoSeverity: IngredientInteraction = {
      id: 'int-x',
      ingredientA: 'A',
      ingredientB: 'B',
      interactionType: 'synergy',
      description: '시너지',
      createdAt: '2025-01-01T00:00:00Z',
      // severity 없음
    };

    const warnings: ProductInteractionWarning[] = [createMockWarning([interactionNoSeverity])];

    const result = summarizeInteractions(warnings);

    expect(result.byType.synergy).toBe(1);
    expect(result.bySeverity.high).toBe(0);
    expect(result.bySeverity.medium).toBe(0);
    expect(result.bySeverity.low).toBe(0);
  });

  it('모든 유형과 심각도가 포함된 복합 시나리오를 처리한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('contraindication', 'high'),
        createMockInteraction('caution', 'medium'),
      ]),
      createMockWarning([
        createMockInteraction('timing', 'medium'),
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = summarizeInteractions(warnings);

    expect(result.totalWarnings).toBe(2);
    expect(result.byType.contraindication).toBe(1);
    expect(result.byType.caution).toBe(1);
    expect(result.byType.timing).toBe(1);
    expect(result.byType.synergy).toBe(1);
    expect(result.bySeverity.high).toBe(1);
    expect(result.bySeverity.medium).toBe(2);
    expect(result.bySeverity.low).toBe(1);
  });
});

// ================================================
// filterWarningsOnly 테스트
// ================================================

describe('filterWarningsOnly', () => {
  it('시너지를 제외한 상호작용만 반환한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = filterWarningsOnly(warnings);

    expect(result).toHaveLength(1);
    expect(result[0].interactions).toHaveLength(1);
    expect(result[0].interactions[0].interactionType).toBe('caution');
  });

  it('시너지만 있는 경고는 제거한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([createMockInteraction('synergy', 'low')]),
    ];

    const result = filterWarningsOnly(warnings);

    expect(result).toHaveLength(0);
  });

  it('경고만 있는 항목은 그대로 유지한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('contraindication', 'high'),
        createMockInteraction('timing', 'medium'),
      ]),
    ];

    const result = filterWarningsOnly(warnings);

    expect(result).toHaveLength(1);
    expect(result[0].interactions).toHaveLength(2);
  });

  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(filterWarningsOnly([])).toEqual([]);
  });

  it('contraindication, caution, timing 유형을 모두 유지한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('contraindication', 'high'),
        createMockInteraction('caution', 'medium'),
        createMockInteraction('timing', 'low'),
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = filterWarningsOnly(warnings);

    expect(result[0].interactions).toHaveLength(3);
    const types = result[0].interactions.map((i) => i.interactionType);
    expect(types).toContain('contraindication');
    expect(types).toContain('caution');
    expect(types).toContain('timing');
    expect(types).not.toContain('synergy');
  });
});

// ================================================
// filterSynergiesOnly 테스트
// ================================================

describe('filterSynergiesOnly', () => {
  it('시너지 상호작용만 반환한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('caution', 'medium'),
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = filterSynergiesOnly(warnings);

    expect(result).toHaveLength(1);
    expect(result[0].interactions).toHaveLength(1);
    expect(result[0].interactions[0].interactionType).toBe('synergy');
  });

  it('시너지가 없는 경고는 제거한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([createMockInteraction('contraindication', 'high')]),
    ];

    const result = filterSynergiesOnly(warnings);

    expect(result).toHaveLength(0);
  });

  it('여러 시너지가 있는 항목을 유지한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([
        createMockInteraction('synergy', 'low'),
        createMockInteraction('synergy', 'low'),
      ]),
    ];

    const result = filterSynergiesOnly(warnings);

    expect(result).toHaveLength(1);
    expect(result[0].interactions).toHaveLength(2);
  });

  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(filterSynergiesOnly([])).toEqual([]);
  });

  it('여러 경고에서 시너지가 있는 것만 필터링한다', () => {
    const warnings: ProductInteractionWarning[] = [
      createMockWarning([createMockInteraction('caution', 'medium')], {
        productA: { id: 'pa', name: '제품A', type: 'supplement' },
      }),
      createMockWarning([createMockInteraction('synergy', 'low')], {
        productA: { id: 'pb', name: '제품B', type: 'supplement' },
      }),
      createMockWarning(
        [
          createMockInteraction('contraindication', 'high'),
          createMockInteraction('synergy', 'low'),
        ],
        { productA: { id: 'pc', name: '제품C', type: 'supplement' } }
      ),
    ];

    const result = filterSynergiesOnly(warnings);

    expect(result).toHaveLength(2);
    // 모든 결과의 상호작용이 synergy만 포함
    for (const w of result) {
      for (const i of w.interactions) {
        expect(i.interactionType).toBe('synergy');
      }
    }
  });
});
