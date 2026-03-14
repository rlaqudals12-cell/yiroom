/**
 * 화장품 Repository 테스트
 * @description cosmetic.ts의 CRUD 및 필터 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapCosmeticRow,
  getCosmeticProducts,
  getCosmeticProductById,
  getRecommendedCosmetics,
  getCosmeticBrands,
} from '@/lib/products/repositories/cosmetic';
import type { CosmeticProductRow } from '@/types/product';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockCosmeticRow: CosmeticProductRow = {
  id: 'cosmetic-001',
  name: '수분 크림',
  brand: '이니스프리',
  category: 'moisturizer',
  subcategory: 'moisturizer',
  price_range: 'mid',
  price_krw: 25000,
  skin_types: ['dry', 'normal'],
  concerns: ['hydration', 'pore'],
  key_ingredients: ['히알루론산', '세라마이드'],
  avoid_ingredients: [],
  personal_color_seasons: ['Spring', 'Summer'],
  hair_types: null,
  scalp_types: null,
  face_shapes: null,
  undertones: null,
  image_url: 'https://example.com/image.jpg',
  purchase_url: 'https://example.com/buy',
  affiliate_url: null,
  affiliate_commission: null,
  rating: 4.5,
  review_count: 1250,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockCosmeticRow2: CosmeticProductRow = {
  ...mockCosmeticRow,
  id: 'cosmetic-002',
  name: '진정 토너',
  brand: '아이오페',
  category: 'toner',
  subcategory: 'toner',
  price_range: 'high',
  price_krw: 45000,
  skin_types: ['sensitive', 'combination'],
  concerns: ['redness', 'acne'],
  key_ingredients: ['녹차', '병풀'],
  rating: 4.8,
};

// =============================================================================
// Supabase 클라이언트 Mock
// =============================================================================

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  productLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase/client';

// 체이닝 mock 헬퍼: 모든 Supabase 쿼리 메서드를 mockReturnThis()로 연결
function createChainMock(
  overrides: Record<string, unknown> = {}
): Record<string, ReturnType<typeof vi.fn>> {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    'select',
    'eq',
    'ilike',
    'gte',
    'contains',
    'overlaps',
    'order',
    'limit',
    'single',
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // 오버라이드 적용 (최종 반환값 설정 등)
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'function') {
      chain[key] = value as ReturnType<typeof vi.fn>;
    } else {
      chain[key] = vi.fn().mockReturnValue(value);
    }
  }
  return chain;
}

// =============================================================================
// 테스트
// =============================================================================

describe('Cosmetic Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // mapCosmeticRow
  // ---------------------------------------------------------------------------

  describe('mapCosmeticRow', () => {
    it('CosmeticProductRow를 CosmeticProduct로 변환해야 함', () => {
      const result = mapCosmeticRow(mockCosmeticRow);

      expect(result.id).toBe('cosmetic-001');
      expect(result.name).toBe('수분 크림');
      expect(result.brand).toBe('이니스프리');
      expect(result.category).toBe('moisturizer');
      expect(result.subcategory).toBe('moisturizer');
      expect(result.priceRange).toBe('mid');
      expect(result.priceKrw).toBe(25000);
      expect(result.skinTypes).toEqual(['dry', 'normal']);
      expect(result.concerns).toEqual(['hydration', 'pore']);
      expect(result.keyIngredients).toEqual(['히알루론산', '세라마이드']);
      expect(result.imageUrl).toBe('https://example.com/image.jpg');
      expect(result.purchaseUrl).toBe('https://example.com/buy');
      expect(result.rating).toBe(4.5);
      expect(result.reviewCount).toBe(1250);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
      expect(result.updatedAt).toBe('2026-01-15T00:00:00Z');
    });

    it('null 값을 undefined로 변환해야 함', () => {
      const rowWithNulls: CosmeticProductRow = {
        ...mockCosmeticRow,
        subcategory: null,
        price_krw: null,
        image_url: null,
        purchase_url: null,
        rating: null,
        review_count: null,
        hair_types: null,
        scalp_types: null,
        face_shapes: null,
        undertones: null,
        key_ingredients: null,
        avoid_ingredients: null,
      };

      const result = mapCosmeticRow(rowWithNulls);

      expect(result.subcategory).toBeUndefined();
      expect(result.priceKrw).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
      expect(result.purchaseUrl).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.reviewCount).toBeUndefined();
      expect(result.hairTypes).toBeNull();
      expect(result.scalpTypes).toBeNull();
      expect(result.faceShapes).toBeNull();
      expect(result.undertones).toBeNull();
      expect(result.keyIngredients).toBeUndefined();
      expect(result.avoidIngredients).toBeUndefined();
    });

    it('personalColorSeasons 필드를 올바르게 매핑해야 함', () => {
      const result = mapCosmeticRow(mockCosmeticRow);
      expect(result.personalColorSeasons).toEqual(['Spring', 'Summer']);
    });
  });

  // ---------------------------------------------------------------------------
  // getCosmeticProducts
  // ---------------------------------------------------------------------------

  describe('getCosmeticProducts', () => {
    it('필터 없이 모든 활성 화장품을 조회해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({
        data: [mockCosmeticRow, mockCosmeticRow2],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProducts();

      expect(supabase.from).toHaveBeenCalledWith('cosmetic_products');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('수분 크림');
      expect(result[1].name).toBe('진정 토너');
    });

    it('카테고리 필터를 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ category: 'moisturizer' });

      expect(mockChain.eq).toHaveBeenCalledWith('category', 'moisturizer');
    });

    it('서브카테고리 필터를 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ subcategory: 'moisturizer' });

      expect(mockChain.eq).toHaveBeenCalledWith('subcategory', 'moisturizer');
    });

    it('브랜드 필터를 ilike로 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ brand: '이니스프리' });

      expect(mockChain.ilike).toHaveBeenCalledWith('brand', '%이니스프리%');
    });

    it('가격대 필터를 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ priceRange: 'mid' });

      expect(mockChain.eq).toHaveBeenCalledWith('price_range', 'mid');
    });

    it('최소 평점 필터를 gte로 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ minRating: 4.0 });

      expect(mockChain.gte).toHaveBeenCalledWith('rating', 4.0);
    });

    it('피부 타입 배열 필터를 contains로 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ skinTypes: ['dry', 'normal'] });

      expect(mockChain.contains).toHaveBeenCalledWith('skin_types', ['dry', 'normal']);
    });

    it('피부 고민 배열 필터를 contains로 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ concerns: ['hydration'] });

      expect(mockChain.contains).toHaveBeenCalledWith('concerns', ['hydration']);
    });

    it('퍼스널 컬러 시즌 필터를 contains로 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [mockCosmeticRow], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ personalColorSeasons: ['Spring'] });

      expect(mockChain.contains).toHaveBeenCalledWith('personal_color_seasons', ['Spring']);
    });

    it('헤어 타입 배열 필터를 contains로 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ hairTypes: ['straight'] });

      expect(mockChain.contains).toHaveBeenCalledWith('hair_types', ['straight']);
    });

    it('빈 배열 필터는 contains를 호출하지 않아야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ skinTypes: [], concerns: [], hairTypes: [] });

      expect(mockChain.contains).not.toHaveBeenCalled();
    });

    it('limit 파라미터를 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts(undefined, 100);

      expect(mockChain.limit).toHaveBeenCalledWith(100);
    });

    it('기본 limit은 50이어야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts();

      expect(mockChain.limit).toHaveBeenCalledWith(50);
    });

    it('rating 내림차순으로 정렬해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts();

      expect(mockChain.order).toHaveBeenCalledWith('rating', { ascending: false });
    });

    it('DB 에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProducts();

      expect(result).toEqual([]);
    });

    it('빈 결과는 빈 배열을 반환해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.order = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProducts();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getCosmeticProductById
  // ---------------------------------------------------------------------------

  describe('getCosmeticProductById', () => {
    it('ID로 화장품을 조회하여 반환해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.single = vi.fn().mockResolvedValue({ data: mockCosmeticRow, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProductById('cosmetic-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cosmetic-001');
      expect(result?.name).toBe('수분 크림');
      expect(result?.brand).toBe('이니스프리');
    });

    it('존재하지 않는 ID는 null을 반환해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProductById('non-existent');

      expect(result).toBeNull();
    });

    it('DB 에러 시 null을 반환해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProductById('cosmetic-001');

      expect(result).toBeNull();
    });

    it('is_active = true 조건과 id 조건을 모두 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.single = vi.fn().mockResolvedValue({ data: mockCosmeticRow, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProductById('cosmetic-001');

      expect(supabase.from).toHaveBeenCalledWith('cosmetic_products');
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'cosmetic-001');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  // ---------------------------------------------------------------------------
  // getRecommendedCosmetics
  // ---------------------------------------------------------------------------

  describe('getRecommendedCosmetics', () => {
    it('피부 타입으로 필터링하고 is_active 조건을 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.limit = vi.fn().mockResolvedValue({
        data: [mockCosmeticRow],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedCosmetics('dry');

      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockChain.contains).toHaveBeenCalledWith('skin_types', ['dry']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('수분 크림');
    });

    it('concerns 배열이 있으면 overlaps 필터를 적용해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.overlaps = vi.fn().mockResolvedValue({
        data: [mockCosmeticRow],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedCosmetics('sensitive', ['redness', 'acne']);

      expect(mockChain.overlaps).toHaveBeenCalledWith('concerns', ['redness', 'acne']);
    });

    it('퍼스널 컬러가 있으면 contains 필터를 추가 적용해야 함', async () => {
      // personalColor 필터는 limit 이후에 체인됨 — thenable 패턴 사용
      const mockChain: Record<string, ReturnType<typeof vi.fn>> = {};
      const methods = ['select', 'eq', 'contains', 'order', 'limit', 'overlaps'];
      for (const m of methods) {
        mockChain[m] = vi.fn().mockReturnValue(mockChain);
      }
      // 최종 await를 위한 thenable
      mockChain.then = vi
        .fn()
        .mockImplementation((resolve: (v: unknown) => void) =>
          resolve({ data: [mockCosmeticRow], error: null })
        );
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedCosmetics('normal', undefined, 'Spring');

      expect(mockChain.contains).toHaveBeenCalledWith('skin_types', ['normal']);
      expect(mockChain.contains).toHaveBeenCalledWith('personal_color_seasons', ['Spring']);
    });

    it('rating 내림차순 정렬 + 20개 제한이어야 함', async () => {
      const mockChain = createChainMock();
      mockChain.limit = vi.fn().mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedCosmetics('oily');

      expect(mockChain.order).toHaveBeenCalledWith('rating', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(20);
    });

    it('DB 에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = createChainMock();
      mockChain.limit = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedCosmetics('oily');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getCosmeticBrands
  // ---------------------------------------------------------------------------

  describe('getCosmeticBrands', () => {
    it('중복 제거된 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: '이니스프리' },
              { brand: '아이오페' },
              { brand: '이니스프리' },
              { brand: '설화수' },
            ],
            error: null,
          }),
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticBrands();

      expect(result).toHaveLength(3);
      expect(result).toContain('이니스프리');
      expect(result).toContain('아이오페');
      expect(result).toContain('설화수');
    });

    it('정렬된 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ brand: '설화수' }, { brand: '아이오페' }, { brand: '이니스프리' }],
            error: null,
          }),
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticBrands();

      expect(result[0]).toBe('설화수');
      expect(result[1]).toBe('아이오페');
      expect(result[2]).toBe('이니스프리');
    });

    it('DB 에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticBrands();

      expect(result).toEqual([]);
    });

    it('brand 필드만 select해야 함', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockChain = { select: mockSelect };
      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticBrands();

      expect(mockSelect).toHaveBeenCalledWith('brand');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });
  });
});
