/**
 * 건강식품 Repository 테스트
 * @description healthfood.ts의 CRUD 및 필터 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapHealthFoodRow,
  getHealthFoods,
  getHealthFoodById,
  getRecommendedHealthFoods,
  getHighProteinFoods,
  getHealthFoodBrands,
} from '@/lib/products/repositories/healthfood';
import type { HealthFoodRow } from '@/types/product';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockHealthFoodRow: HealthFoodRow = {
  id: 'healthfood-001',
  name: '프로틴 파우더',
  brand: '마이프로틴',
  category: 'protein_powder',
  subcategory: 'whey',
  price_krw: 45000,
  price_per_serving: 1500,
  serving_size: '30g',
  servings_per_container: 30,
  calories_per_serving: 120,
  protein_g: 24,
  carbs_g: 3,
  sugar_g: 1,
  fat_g: 2,
  fiber_g: 0,
  sodium_mg: 50,
  additional_nutrients: [
    { name: 'BCAA', amount: 5, unit: 'g' },
    { name: 'Glutamine', amount: 3, unit: 'g' },
  ],
  flavor_options: ['초콜릿', '바닐라', '딸기'],
  dietary_info: ['gluten_free', 'sugar_free'],
  allergens: ['milk', 'soy'],
  benefits: ['muscle_gain', 'recovery'],
  best_time: 'post_workout',
  target_users: ['athletes', 'muscle_gain'],
  image_url: 'https://example.com/protein.jpg',
  purchase_url: 'https://example.com/buy',
  affiliate_url: null,
  affiliate_commission: null,
  rating: 4.6,
  review_count: 2500,
  features: ['100% WPI', '저당', '고단백'],
  taste_rating: 4.5,
  mixability_rating: 4.7,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockHealthFoodRow2: HealthFoodRow = {
  ...mockHealthFoodRow,
  id: 'healthfood-002',
  name: '에너지바',
  brand: '퀘스트',
  category: 'protein_bar',
  subcategory: 'protein_bar',
  price_krw: 35000,
  calories_per_serving: 200,
  protein_g: 21,
  carbs_g: 22,
  sugar_g: 1,
  dietary_info: ['vegan', 'organic'],
  benefits: ['energy', 'recovery'],
  target_users: ['general', 'beginners'],
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

describe('HealthFood Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // mapHealthFoodRow
  // ---------------------------------------------------------------------------

  describe('mapHealthFoodRow', () => {
    it('HealthFoodRow를 HealthFood로 변환해야 함', () => {
      const result = mapHealthFoodRow(mockHealthFoodRow);

      expect(result.id).toBe('healthfood-001');
      expect(result.name).toBe('프로틴 파우더');
      expect(result.brand).toBe('마이프로틴');
      expect(result.category).toBe('protein_powder');
      expect(result.priceKrw).toBe(45000);
      expect(result.pricePerServing).toBe(1500);
      expect(result.servingSize).toBe('30g');
      expect(result.caloriesPerServing).toBe(120);
      expect(result.proteinG).toBe(24);
      expect(result.carbsG).toBe(3);
      expect(result.fatG).toBe(2);
      expect(result.dietaryInfo).toEqual(['gluten_free', 'sugar_free']);
      expect(result.benefits).toEqual(['muscle_gain', 'recovery']);
      expect(result.targetUsers).toEqual(['athletes', 'muscle_gain']);
      expect(result.rating).toBe(4.6);
      expect(result.reviewCount).toBe(2500);
      expect(result.tasteRating).toBe(4.5);
      expect(result.mixabilityRating).toBe(4.7);
      expect(result.isActive).toBe(true);
    });

    it('null 값을 undefined로 변환해야 함', () => {
      const rowWithNulls: HealthFoodRow = {
        ...mockHealthFoodRow,
        subcategory: null,
        price_krw: null,
        calories_per_serving: null,
        protein_g: null,
        image_url: null,
        rating: null,
        taste_rating: null,
        additional_nutrients: null,
      };

      const result = mapHealthFoodRow(rowWithNulls);

      expect(result.subcategory).toBeUndefined();
      expect(result.priceKrw).toBeUndefined();
      expect(result.caloriesPerServing).toBeUndefined();
      expect(result.proteinG).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.tasteRating).toBeUndefined();
      expect(result.additionalNutrients).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getHealthFoods
  // ---------------------------------------------------------------------------

  describe('getHealthFoods', () => {
    it('모든 활성 건강식품을 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow, mockHealthFoodRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getHealthFoods();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('프로틴 파우더');
      expect(result[1].name).toBe('에너지바');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('카테고리 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ category: 'protein_powder' });

      expect(mockChain.eq).toHaveBeenCalledWith('category', 'protein_powder');
    });

    it('브랜드 필터를 적용해야 함 (ilike)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ brand: '마이프로틴' });

      expect(mockChain.ilike).toHaveBeenCalledWith('brand', '%마이프로틴%');
    });

    it('가격 필터 (maxPrice)를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ maxPrice: 40000 });

      expect(mockChain.lte).toHaveBeenCalledWith('price_krw', 40000);
    });

    it('칼로리 필터 (maxCalories)를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ maxCalories: 150 });

      expect(mockChain.lte).toHaveBeenCalledWith('calories_per_serving', 150);
    });

    it('단백질 필터 (minProtein)를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ minProtein: 20 });

      expect(mockChain.gte).toHaveBeenCalledWith('protein_g', 20);
    });

    it('benefits overlaps 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ benefits: ['muscle_gain', 'recovery'] });

      expect(mockChain.overlaps).toHaveBeenCalledWith('benefits', ['muscle_gain', 'recovery']);
    });

    it('dietaryInfo contains 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ dietaryInfo: ['vegan'] });

      expect(mockChain.contains).toHaveBeenCalledWith('dietary_info', ['vegan']);
    });

    it('targetUsers overlaps 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoods({ targetUsers: ['athletes'] });

      expect(mockChain.overlaps).toHaveBeenCalledWith('target_users', ['athletes']);
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

      const result = await getHealthFoods();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getHealthFoodById
  // ---------------------------------------------------------------------------

  describe('getHealthFoodById', () => {
    it('ID로 건강식품을 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockHealthFoodRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getHealthFoodById('healthfood-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('healthfood-001');
      expect(result?.name).toBe('프로틴 파우더');
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

      const result = await getHealthFoodById('non-existent');

      expect(result).toBeNull();
    });

    it('is_active = true 조건을 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockHealthFoodRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHealthFoodById('healthfood-001');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'healthfood-001');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  // ---------------------------------------------------------------------------
  // getRecommendedHealthFoods
  // ---------------------------------------------------------------------------

  describe('getRecommendedHealthFoods', () => {
    it('benefits 기반 추천을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedHealthFoods(['muscle_gain']);

      expect(result).toHaveLength(1);
      expect(mockChain.overlaps).toHaveBeenCalledWith('benefits', ['muscle_gain']);
    });

    it('dietaryInfo contains 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        contains: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedHealthFoods(undefined, ['vegan']);

      expect(mockChain.contains).toHaveBeenCalledWith('dietary_info', ['vegan']);
    });

    it('targetUsers 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedHealthFoods(undefined, undefined, ['athletes']);

      expect(mockChain.overlaps).toHaveBeenCalledWith('target_users', ['athletes']);
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

      const result = await getRecommendedHealthFoods();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getHighProteinFoods
  // ---------------------------------------------------------------------------

  describe('getHighProteinFoods', () => {
    it('최소 단백질 기준으로 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getHighProteinFoods(20);

      expect(result).toHaveLength(1);
      expect(mockChain.gte).toHaveBeenCalledWith('protein_g', 20);
    });

    it('기본 최소 단백질 (20g)을 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHighProteinFoods();

      expect(mockChain.gte).toHaveBeenCalledWith('protein_g', 20);
    });

    it('maxCalories 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          data: [mockHealthFoodRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getHighProteinFoods(20, 150);

      expect(mockChain.lte).toHaveBeenCalledWith('calories_per_serving', 150);
    });

    it('에러 시 빈 배열을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getHighProteinFoods();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getHealthFoodBrands
  // ---------------------------------------------------------------------------

  describe('getHealthFoodBrands', () => {
    it('중복 없는 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: '마이프로틴' },
              { brand: '퀘스트' },
              { brand: '마이프로틴' }, // 중복
              { brand: 'BSN' },
            ],
            error: null,
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getHealthFoodBrands();

      expect(result).toHaveLength(3);
      expect(result).toContain('마이프로틴');
      expect(result).toContain('퀘스트');
      expect(result).toContain('BSN');
    });

    it('정렬된 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: '퀘스트' },
              { brand: 'BSN' },
              { brand: '마이프로틴' },
            ],
            error: null,
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getHealthFoodBrands();

      expect(result[0]).toBe('BSN');
      expect(result[1]).toBe('마이프로틴');
      expect(result[2]).toBe('퀘스트');
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

      const result = await getHealthFoodBrands();

      expect(result).toEqual([]);
    });
  });
});
