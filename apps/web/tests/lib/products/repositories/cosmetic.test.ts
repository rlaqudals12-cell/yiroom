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
  face_shapes: null,
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
  },
}));

import { supabase } from '@/lib/supabase/client';

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
      expect(result.rating).toBe(4.5);
      expect(result.reviewCount).toBe(1250);
      expect(result.isActive).toBe(true);
    });

    it('null 값을 undefined로 변환해야 함', () => {
      const rowWithNulls: CosmeticProductRow = {
        ...mockCosmeticRow,
        subcategory: null,
        price_krw: null,
        image_url: null,
        rating: null,
        review_count: null,
      };

      const result = mapCosmeticRow(rowWithNulls);

      expect(result.subcategory).toBeUndefined();
      expect(result.priceKrw).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.reviewCount).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getCosmeticProducts
  // ---------------------------------------------------------------------------

  describe('getCosmeticProducts', () => {
    it('모든 활성 화장품을 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCosmeticRow, mockCosmeticRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProducts();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('수분 크림');
      expect(result[1].name).toBe('진정 토너');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('카테고리 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCosmeticRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ category: 'moisturizer' });

      expect(mockChain.eq).toHaveBeenCalledWith('category', 'moisturizer');
    });

    it('피부 타입 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCosmeticRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ skinTypes: ['dry'] });

      expect(mockChain.contains).toHaveBeenCalledWith('skin_types', ['dry']);
    });

    it('브랜드 필터를 적용해야 함 (ilike)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockCosmeticRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts({ brand: '이니스프리' });

      expect(mockChain.ilike).toHaveBeenCalledWith('brand', '%이니스프리%');
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProducts();

      expect(result).toEqual([]);
    });

    it('limit 파라미터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProducts(undefined, 100);

      expect(mockChain.limit).toHaveBeenCalledWith(100);
    });
  });

  // ---------------------------------------------------------------------------
  // getCosmeticProductById
  // ---------------------------------------------------------------------------

  describe('getCosmeticProductById', () => {
    it('ID로 화장품을 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCosmeticRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProductById('cosmetic-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cosmetic-001');
      expect(result?.name).toBe('수분 크림');
    });

    it('존재하지 않는 ID는 null을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getCosmeticProductById('non-existent');

      expect(result).toBeNull();
    });

    it('is_active = true 조건을 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCosmeticRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getCosmeticProductById('cosmetic-001');

      // eq가 id와 is_active 모두 호출되어야 함
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'cosmetic-001');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  // ---------------------------------------------------------------------------
  // getRecommendedCosmetics
  // ---------------------------------------------------------------------------

  describe('getRecommendedCosmetics', () => {
    it('피부 타입 기반 추천을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockCosmeticRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedCosmetics('dry', ['hydration']);

      expect(result).toHaveLength(1);
      expect(result[0].skinTypes).toContain('dry');
    });

    it('퍼스널 컬러 필터를 적용해야 함', async () => {
      // limit 후에도 contains가 호출될 수 있도록 모든 메서드가 mockChain 반환
      const mockChain: any = {};
      mockChain.select = vi.fn().mockReturnValue(mockChain);
      mockChain.eq = vi.fn().mockReturnValue(mockChain);
      mockChain.contains = vi.fn().mockReturnValue(mockChain);
      mockChain.order = vi.fn().mockReturnValue(mockChain);
      mockChain.limit = vi.fn().mockReturnValue(mockChain);
      // 최종 await 시 결과 반환 (thenable)
      mockChain.then = vi
        .fn()
        .mockImplementation((resolve) => resolve({ data: [mockCosmeticRow], error: null }));

      vi.mocked(supabase.from).mockReturnValue(mockChain);

      await getRecommendedCosmetics('normal', undefined, 'Spring');

      // contains가 skin_types와 personal_color_seasons 모두 호출되어야 함
      expect(mockChain.contains).toHaveBeenCalledWith('skin_types', ['normal']);
      expect(mockChain.contains).toHaveBeenCalledWith('personal_color_seasons', ['Spring']);
    });

    it('concerns overlaps 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockCosmeticRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedCosmetics('sensitive', ['redness', 'acne']);

      expect(mockChain.overlaps).toHaveBeenCalledWith('concerns', ['redness', 'acne']);
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedCosmetics('oily');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getCosmeticBrands
  // ---------------------------------------------------------------------------

  describe('getCosmeticBrands', () => {
    it('중복 없는 브랜드 목록을 반환해야 함', async () => {
      // select('brand').eq('is_active', true) 순서로 호출됨
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: '이니스프리' },
              { brand: '아이오페' },
              { brand: '이니스프리' }, // 중복
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

      // 한글 정렬 확인
      expect(result[0]).toBe('설화수');
      expect(result[1]).toBe('아이오페');
      expect(result[2]).toBe('이니스프리');
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
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
  });
});
