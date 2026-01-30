/**
 * 화장품 성분 Repository 테스트
 * @description ingredients.ts의 CRUD 및 분석 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getIngredientById,
  searchIngredients,
  getCaution20Ingredients,
  getAllergenIngredients,
  getIngredientsByCategory,
  analyzeProductIngredients,
  ingredientExists,
  getFunctionCounts,
} from '@/lib/products/repositories/ingredients';
import type { CosmeticIngredientRow } from '@/types/ingredient';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockIngredientRow: CosmeticIngredientRow = {
  id: 'ing-001',
  name_ko: '히알루론산',
  name_en: 'Hyaluronic Acid',
  name_inci: 'SODIUM HYALURONATE',
  aliases: ['HA', '소듐히알루로네이트'],
  ewg_score: 1,
  ewg_data_availability: 'good',
  category: 'moisturizer',
  functions: ['보습', '피부장벽강화'],
  is_caution_20: false,
  is_allergen: false,
  allergen_type: null,
  skin_type_caution: {
    oily: 'recommended',
    dry: 'recommended',
    sensitive: 'recommended',
    combination: 'recommended',
    normal: 'recommended',
  },
  description: '피부 수분 유지에 탁월한 보습제',
  benefits: ['강력한 보습', '주름 개선'],
  concerns: [],
  source: 'EWG Skin Deep',
  created_at: '2026-01-04T00:00:00Z',
  updated_at: '2026-01-04T00:00:00Z',
};

const mockCautionIngredientRow: CosmeticIngredientRow = {
  ...mockIngredientRow,
  id: 'ing-002',
  name_ko: '파라벤',
  name_en: 'Paraben',
  name_inci: 'METHYLPARABEN',
  ewg_score: 7,
  category: 'preservative',
  functions: ['방부'],
  is_caution_20: true,
  is_allergen: true,
  allergen_type: '방부제',
};

// =============================================================================
// Supabase 클라이언트 Mock
// =============================================================================

function createMockSupabase() {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOr = vi.fn();
  const mockSingle = vi.fn();
  const mockLimit = vi.fn();
  const mockOrder = vi.fn();

  // 체이닝을 위한 mock 설정
  mockSelect.mockReturnValue({
    eq: mockEq,
    or: mockOr,
    single: mockSingle,
    limit: mockLimit,
    order: mockOrder,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    order: mockOrder,
    limit: mockLimit,
  });

  mockOr.mockReturnValue({
    limit: mockLimit,
    eq: mockEq,
  });

  mockLimit.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
  });

  mockOrder.mockReturnValue({
    limit: mockLimit,
  });

  return {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
    }),
    mockSelect,
    mockEq,
    mockOr,
    mockSingle,
    mockLimit,
    mockOrder,
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('Ingredients Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getIngredientById
  // ---------------------------------------------------------------------------

  describe('getIngredientById', () => {
    it('ID로 성분을 조회하고 변환된 객체를 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockIngredientRow,
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await getIngredientById(mockSupabase, 'ing-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('ing-001');
      expect(result?.nameKo).toBe('히알루론산');
      expect(result?.category).toBe('moisturizer');
      expect(result?.isCaution20).toBe(false);
    });

    it('존재하지 않는 ID는 null을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        }),
      } as any;

      const result = await getIngredientById(mockSupabase, 'non-existent');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // searchIngredients
  // ---------------------------------------------------------------------------

  describe('searchIngredients', () => {
    it('검색어로 성분을 검색해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [mockIngredientRow],
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await searchIngredients(mockSupabase, '히알');

      expect(result).toHaveLength(1);
      expect(result[0].nameKo).toBe('히알루론산');
    });

    it('카테고리 필터를 적용할 수 있어야 함', async () => {
      const mockLimit = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [mockIngredientRow],
          error: null,
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      } as any;

      await searchIngredients(mockSupabase, '보습', { category: 'moisturizer' });

      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it('빈 결과를 처리해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await searchIngredients(mockSupabase, 'xxxxx');
      expect(result).toHaveLength(0);
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any;

      const result = await searchIngredients(mockSupabase, '테스트');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getCaution20Ingredients
  // ---------------------------------------------------------------------------

  describe('getCaution20Ingredients', () => {
    it('주의 성분 목록을 조회해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockCautionIngredientRow],
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await getCaution20Ingredients(mockSupabase);

      expect(result).toHaveLength(1);
      expect(result[0].isCaution20).toBe(true);
      expect(result[0].nameKo).toBe('파라벤');
    });
  });

  // ---------------------------------------------------------------------------
  // getAllergenIngredients
  // ---------------------------------------------------------------------------

  describe('getAllergenIngredients', () => {
    it('알레르기 유발 성분 목록을 조회해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockCautionIngredientRow],
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await getAllergenIngredients(mockSupabase);

      expect(result).toHaveLength(1);
      expect(result[0].isAllergen).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getIngredientsByCategory
  // ---------------------------------------------------------------------------

  describe('getIngredientsByCategory', () => {
    it('카테고리별 성분을 조회해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [mockIngredientRow],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any;

      const result = await getIngredientsByCategory(mockSupabase, 'moisturizer');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('moisturizer');
    });
  });

  // ---------------------------------------------------------------------------
  // ingredientExists
  // ---------------------------------------------------------------------------

  describe('ingredientExists', () => {
    it('존재하는 성분은 true를 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 1,
              error: null,
            }),
          }),
        }),
      } as any;

      const result = await ingredientExists(mockSupabase, '히알루론산');
      expect(result).toBe(true);
    });

    it('존재하지 않는 성분은 false를 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 0,
              error: null,
            }),
          }),
        }),
      } as any;

      const result = await ingredientExists(mockSupabase, '없는성분');
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // getFunctionCounts
  // ---------------------------------------------------------------------------

  describe('getFunctionCounts', () => {
    it('기능별 성분 수를 집계해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { functions: ['보습', '피부장벽강화'] },
              { functions: ['보습', '진정'] },
              { functions: ['미백'] },
            ],
            error: null,
          }),
        }),
      } as any;

      const result = await getFunctionCounts(mockSupabase);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: '보습', count: 2 }),
          expect.objectContaining({ name: '피부장벽강화', count: 1 }),
          expect.objectContaining({ name: '진정', count: 1 }),
          expect.objectContaining({ name: '미백', count: 1 }),
        ])
      );

      // 정렬 확인 (개수 내림차순)
      expect(result[0].count).toBeGreaterThanOrEqual(result[result.length - 1].count);
    });
  });

  // ---------------------------------------------------------------------------
  // analyzeProductIngredients
  // ---------------------------------------------------------------------------

  describe('analyzeProductIngredients', () => {
    it('제품 성분이 없으면 null을 반환해야 함', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await analyzeProductIngredients(mockSupabase, 'product-001');
      expect(result).toBeNull();
    });

    it('성분 분석 결과를 반환해야 함', async () => {
      // getProductIngredients가 성분을 반환하도록 mock
      const mockIngredientData = {
        order_index: 1,
        purpose: '보습',
        concentration_level: 'high',
        ingredient: mockIngredientRow,
      };

      const mockCautionData = {
        order_index: 2,
        purpose: '방부',
        concentration_level: 'low',
        ingredient: mockCautionIngredientRow,
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [mockIngredientData, mockCautionData],
                error: null,
              }),
            }),
          }),
        }),
      } as any;

      const result = await analyzeProductIngredients(mockSupabase, 'product-001');

      expect(result).not.toBeNull();
      expect(result?.productId).toBe('product-001');
      expect(result?.totalCount).toBe(2);
      expect(result?.cautionIngredients).toHaveLength(1);
      expect(result?.allergenIngredients).toHaveLength(1);
      expect(result?.ewgDistribution).toBeDefined();
      expect(result?.skinTypeCompatibility).toBeDefined();
    });
  });
});
