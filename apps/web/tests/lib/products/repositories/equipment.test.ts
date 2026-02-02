/**
 * 운동 기구 Repository 테스트
 * @description equipment.ts의 CRUD 및 필터 함수 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mapWorkoutEquipmentRow,
  getWorkoutEquipment,
  getWorkoutEquipmentById,
  getRecommendedEquipment,
  getWorkoutEquipmentBrands,
} from '@/lib/products/repositories/equipment';
import type { WorkoutEquipmentRow } from '@/types/product';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockEquipmentRow: WorkoutEquipmentRow = {
  id: 'equipment-001',
  name: '조절식 덤벨',
  brand: 'Bowflex',
  category: 'dumbbell',
  subcategory: 'adjustable',
  price_krw: 350000,
  price_range: 'high',
  weight_kg: 24,
  weight_range: '2-24kg',
  material: 'steel',
  size: '43x21x23cm',
  color_options: ['black', 'silver'],
  target_muscles: ['arms', 'shoulders', 'chest'],
  exercise_types: ['strength'],
  skill_level: 'all',
  use_location: 'home',
  image_url: 'https://example.com/dumbbell.jpg',
  purchase_url: 'https://example.com/buy',
  affiliate_url: null,
  affiliate_commission: null,
  rating: 4.7,
  review_count: 850,
  features: ['무게 조절 가능', '컴팩트 디자인'],
  pros: ['공간 절약', '다양한 무게'],
  cons: ['가격이 비쌈'],
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

const mockEquipmentRow2: WorkoutEquipmentRow = {
  ...mockEquipmentRow,
  id: 'equipment-002',
  name: '요가매트',
  brand: 'Manduka',
  category: 'mat',
  subcategory: 'yoga',
  price_range: 'mid',
  price_krw: 89000,
  target_muscles: ['core', 'full_body'],
  exercise_types: ['flexibility', 'balance'],
  skill_level: 'beginner',
  use_location: 'all',
  rating: 4.9,
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

describe('Equipment Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // mapWorkoutEquipmentRow
  // ---------------------------------------------------------------------------

  describe('mapWorkoutEquipmentRow', () => {
    it('WorkoutEquipmentRow를 WorkoutEquipment로 변환해야 함', () => {
      const result = mapWorkoutEquipmentRow(mockEquipmentRow);

      expect(result.id).toBe('equipment-001');
      expect(result.name).toBe('조절식 덤벨');
      expect(result.brand).toBe('Bowflex');
      expect(result.category).toBe('dumbbell');
      expect(result.priceKrw).toBe(350000);
      expect(result.priceRange).toBe('high');
      expect(result.weightKg).toBe(24);
      expect(result.targetMuscles).toEqual(['arms', 'shoulders', 'chest']);
      expect(result.exerciseTypes).toEqual(['strength']);
      expect(result.skillLevel).toBe('all');
      expect(result.useLocation).toBe('home');
      expect(result.rating).toBe(4.7);
      expect(result.reviewCount).toBe(850);
      expect(result.isActive).toBe(true);
    });

    it('null 값을 undefined로 변환해야 함', () => {
      const rowWithNulls: WorkoutEquipmentRow = {
        ...mockEquipmentRow,
        subcategory: null,
        price_krw: null,
        weight_kg: null,
        image_url: null,
        rating: null,
        review_count: null,
        features: null,
      };

      const result = mapWorkoutEquipmentRow(rowWithNulls);

      expect(result.subcategory).toBeUndefined();
      expect(result.priceKrw).toBeUndefined();
      expect(result.weightKg).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
      expect(result.rating).toBeUndefined();
      expect(result.reviewCount).toBeUndefined();
      expect(result.features).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // getWorkoutEquipment
  // ---------------------------------------------------------------------------

  describe('getWorkoutEquipment', () => {
    it('모든 활성 운동 기구를 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow, mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getWorkoutEquipment();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('조절식 덤벨');
      expect(result[1].name).toBe('요가매트');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('카테고리 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ category: 'dumbbell' });

      expect(mockChain.eq).toHaveBeenCalledWith('category', 'dumbbell');
    });

    it('브랜드 필터를 적용해야 함 (ilike)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ brand: 'Bowflex' });

      expect(mockChain.ilike).toHaveBeenCalledWith('brand', '%Bowflex%');
    });

    it('가격 필터 (maxPrice)를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ maxPrice: 100000 });

      expect(mockChain.lte).toHaveBeenCalledWith('price_krw', 100000);
    });

    it('skillLevel 필터를 적용해야 함 (or 조건)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ skillLevel: 'beginner' });

      expect(mockChain.or).toHaveBeenCalledWith('skill_level.eq.beginner,skill_level.eq.all');
    });

    it('useLocation 필터를 적용해야 함 (or 조건)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ useLocation: 'home' });

      expect(mockChain.or).toHaveBeenCalledWith('use_location.eq.home,use_location.eq.all');
    });

    it('targetMuscles overlaps 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ targetMuscles: ['arms', 'shoulders'] });

      expect(mockChain.overlaps).toHaveBeenCalledWith('target_muscles', ['arms', 'shoulders']);
    });

    it('exerciseTypes overlaps 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ exerciseTypes: ['flexibility'] });

      expect(mockChain.overlaps).toHaveBeenCalledWith('exercise_types', ['flexibility']);
    });

    it('minRating 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipment({ minRating: 4.8 });

      expect(mockChain.gte).toHaveBeenCalledWith('rating', 4.8);
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

      const result = await getWorkoutEquipment();

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

      await getWorkoutEquipment(undefined, 100);

      expect(mockChain.limit).toHaveBeenCalledWith(100);
    });
  });

  // ---------------------------------------------------------------------------
  // getWorkoutEquipmentById
  // ---------------------------------------------------------------------------

  describe('getWorkoutEquipmentById', () => {
    it('ID로 운동 기구를 조회해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEquipmentRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getWorkoutEquipmentById('equipment-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('equipment-001');
      expect(result?.name).toBe('조절식 덤벨');
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

      const result = await getWorkoutEquipmentById('non-existent');

      expect(result).toBeNull();
    });

    it('is_active = true 조건을 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEquipmentRow,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getWorkoutEquipmentById('equipment-001');

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'equipment-001');
      expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  // ---------------------------------------------------------------------------
  // getRecommendedEquipment
  // ---------------------------------------------------------------------------

  describe('getRecommendedEquipment', () => {
    it('타겟 근육군 기반 추천을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getRecommendedEquipment(['arms']);

      expect(result).toHaveLength(1);
      expect(mockChain.overlaps).toHaveBeenCalledWith('target_muscles', ['arms']);
    });

    it('운동 타입 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        overlaps: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedEquipment(undefined, ['flexibility', 'balance']);

      expect(mockChain.overlaps).toHaveBeenCalledWith('exercise_types', ['flexibility', 'balance']);
    });

    it('스킬 레벨 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow2],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedEquipment(undefined, undefined, 'beginner');

      expect(mockChain.or).toHaveBeenCalledWith('skill_level.eq.beginner,skill_level.eq.all');
    });

    it('사용 장소 필터를 적용해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({
          data: [mockEquipmentRow],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      await getRecommendedEquipment(undefined, undefined, undefined, 'home');

      expect(mockChain.or).toHaveBeenCalledWith('use_location.eq.home,use_location.eq.all');
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

      const result = await getRecommendedEquipment();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getWorkoutEquipmentBrands
  // ---------------------------------------------------------------------------

  describe('getWorkoutEquipmentBrands', () => {
    it('중복 없는 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: 'Bowflex' },
              { brand: 'Manduka' },
              { brand: 'Bowflex' }, // 중복
              { brand: 'TRX' },
            ],
            error: null,
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getWorkoutEquipmentBrands();

      expect(result).toHaveLength(3);
      expect(result).toContain('Bowflex');
      expect(result).toContain('Manduka');
      expect(result).toContain('TRX');
    });

    it('정렬된 브랜드 목록을 반환해야 함', async () => {
      const mockChain = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { brand: 'TRX' },
              { brand: 'Bowflex' },
              { brand: 'Manduka' },
            ],
            error: null,
          }),
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockChain as any);

      const result = await getWorkoutEquipmentBrands();

      expect(result[0]).toBe('Bowflex');
      expect(result[1]).toBe('Manduka');
      expect(result[2]).toBe('TRX');
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

      const result = await getWorkoutEquipmentBrands();

      expect(result).toEqual([]);
    });
  });
});
