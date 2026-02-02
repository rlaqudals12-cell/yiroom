/**
 * 영양제 Repository 테스트
 * @description supplement.ts의 CRUD 및 필터 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapSupplementRow,
  getSupplementProducts,
  getSupplementProductById,
  getRecommendedSupplements,
  getSupplementBrands,
} from '@/lib/products/repositories/supplement';
import type { SupplementProductRow } from '@/types/product';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockSupplementRow: SupplementProductRow = {
  id: 'supplement-001',
  name: '멀티 비타민',
  brand: '뉴트리데이',
  category: 'vitamin',
  benefits: ['immunity', 'energy'],
  main_ingredients: [
    { name: '비타민C', amount: 500, unit: 'mg' },
    { name: '비타민D', amount: 1000, unit: 'IU' },
    { name: '아연', amount: 15, unit: 'mg' },
  ],
  target_concerns: ['피로', '면역력'],
  price_krw: 35000,
  dosage: '1일 1정',
  serving_size: 1,
  total_servings: 90,
  image_url: 'https://example.com/vitamin.jpg',
  purchase_url: 'https://example.com/buy',
  affiliate_url: null,
  affiliate_commission: null,
  rating: 4.7,
  review_count: 3500,
  warnings: ['임산부 섭취 전 전문가 상담'],
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockSupplementRow2: SupplementProductRow = {
  ...mockSupplementRow,
  id: 'supplement-002',
  name: '오메가3',
  brand: '유한양행',
  category: 'omega',
  benefits: ['heart-health', 'brain-health'],
  main_ingredients: [
    { name: 'EPA', amount: 500, unit: 'mg' },
    { name: 'DHA', amount: 500, unit: 'mg' },
  ],
  target_concerns: ['혈행', '눈건강'],
  price_krw: 45000,
  rating: 4.5,
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

describe('Supplement Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // mapSupplementRow
  // ---------------------------------------------------------------------------

  describe('mapSupplementRow', () => {
    it('SupplementProductRow를 SupplementProduct로 변환해야 함', () => {
      const result = mapSupplementRow(mockSupplementRow);

      expect(result.id).toBe('supplement-001');
      expect(result.name).toBe('멀티 비타민');
      expect(result.brand).toBe('뉴트리데이');
      expect(result.category).toBe('vitamin');
      expect(result.benefits).toEqual(['immunity', 'energy']);
      expect(result.mainIngredients).toEqual([
        { name: '비타민C', amount: 500, unit: 'mg' },
        { name: '비타민D', amount: 1000, unit: 'IU' },
        { name: '아연', amount: 15, unit: 'mg' },
      ]);
      expect(result.targetConcerns).toEqual(['피로', '면역력']);
      expect(result.priceKrw).toBe(35000);
      expect(result.dosage).toBe('1일 1정');
      expect(result.servingSize).toBe(1);
      expect(result.totalServings).toBe(90);
      expect(result.rating).toBe(4.7);
      expect(result.warnings).toContain('임산부 섭취 전 전문가 상담');
      expect(result.isActive).toBe(true);
    });

    it('null 값을 undefined로 변환해야 함', () => {
      const rowWithNulls: SupplementProductRow = {
        ...mockSupplementRow,
        main_ingredients: null,
        price_krw: null,
        dosage: null,
        image_url: null,
        rating: null,
        warnings: null,
      };

      const result = mapSupplementRow(rowWithNulls);

      expect(result.mainIngredients).toBeUndefined();
      expect(result.priceKrw).toBeUndefined();
      expect(result.dosage).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getSupplementProducts
  // ---------------------------------------------------------------------------

  describe('getSupplementProducts', () => {
    it('모든 활성 영양제를 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockSupplementRow, mockSupplementRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getSupplementProducts();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('멀티 비타민');
      expect(result[1].name).toBe('오메가3');
    });

    it('카테고리 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getSupplementProducts({ category: 'vitamin' });

      expect(mockChain.eq).toHaveBeenCalledWith('category', 'vitamin');
    });

    it('benefits contains 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getSupplementProducts({ benefits: ['immunity'] });

      expect(mockChain.contains).toHaveBeenCalledWith('benefits', ['immunity']);
    });

    it('가격 필터 (maxPrice)를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getSupplementProducts({ maxPrice: 40000 });

      expect(mockChain.lte).toHaveBeenCalledWith('price_krw', 40000);
    });

    it('targetConcerns overlaps 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getSupplementProducts({ targetConcerns: ['피로', '면역력'] });

      expect(mockChain.overlaps).toHaveBeenCalledWith('target_concerns', ['피로', '면역력']);
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

      const result = await getSupplementProducts();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getSupplementProductById
  // ---------------------------------------------------------------------------

  describe('getSupplementProductById', () => {
    it('ID로 영양제를 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSupplementRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getSupplementProductById('supplement-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('supplement-001');
      expect(result?.name).toBe('멀티 비타민');
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

      const result = await getSupplementProductById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getRecommendedSupplements
  // ---------------------------------------------------------------------------

  describe('getRecommendedSupplements', () => {
    it('concerns 기반 추천을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedSupplements(['피로']);

      expect(result).toHaveLength(1);
      expect(mockChain.overlaps).toHaveBeenCalledWith('target_concerns', ['피로']);
    });

    it('benefits contains 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        contains: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedSupplements(undefined, ['immunity']);

      expect(mockChain.contains).toHaveBeenCalledWith('benefits', ['immunity']);
    });

    it('concerns와 benefits 모두 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        contains: vi.fn().mockResolvedValue({
          data: [mockSupplementRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedSupplements(['피로'], ['immunity']);

      expect(mockChain.overlaps).toHaveBeenCalledWith('target_concerns', ['피로']);
      expect(mockChain.contains).toHaveBeenCalledWith('benefits', ['immunity']);
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedSupplements();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getSupplementBrands
  // ---------------------------------------------------------------------------

  describe('getSupplementBrands', () => {
    it('중복 없는 브랜드 목록을 반환해야 함', async () => {
      // select('brand').eq('is_active', true) 순서로 호출됨
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: '뉴트리데이' },
              { brand: '유한양행' },
              { brand: '뉴트리데이' }, // 중복
              { brand: '정관장' },
            ],
            error: null,
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getSupplementBrands();

      expect(result).toHaveLength(3);
      expect(result).toContain('뉴트리데이');
      expect(result).toContain('유한양행');
      expect(result).toContain('정관장');
    });

    it('정렬된 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: '정관장' },
              { brand: '뉴트리데이' },
              { brand: '유한양행' },
            ],
            error: null,
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getSupplementBrands();

      // 한글 정렬 확인
      expect(result[0]).toBe('뉴트리데이');
      expect(result[1]).toBe('유한양행');
      expect(result[2]).toBe('정관장');
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

      const result = await getSupplementBrands();

      expect(result).toEqual([]);
    });
  });
});
