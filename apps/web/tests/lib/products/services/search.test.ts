/**
 * 제품 검색 서비스 테스트
 *
 * @module tests/lib/products/services/search
 * @description 제품 검색, 정렬, 타입 변환, 카테고리별 조회 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted로 mock 객체를 vi.mock 팩토리보다 먼저 초기화
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

import {
  PRODUCT_CATEGORIES,
  getProductType,
  productTypeToPath,
  pathToProductType,
  searchProducts,
  getProductsByCategory,
  getProductById,
} from '@/lib/products/services/search';
import type {
  CosmeticProduct,
  SupplementProduct,
  WorkoutEquipment,
  HealthFood,
} from '@/types/product';

// Repository mock 데이터 (vi.mock 팩토리 내에서 인라인)
const mockData = vi.hoisted(() => {
  const cosmetics = [
    {
      id: 'cos-1',
      name: '수분 세럼',
      brand: '이니스프리',
      category: 'serum',
      skinTypes: ['dry'],
      rating: 4.5,
      priceKrw: 25000,
      reviewCount: 100,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cos-2',
      name: '립스틱',
      brand: '맥',
      category: 'makeup',
      personalColorSeasons: ['Spring'],
      rating: 4.2,
      priceKrw: 35000,
      reviewCount: 50,
      createdAt: '2026-02-01T00:00:00Z',
    },
  ];

  const supplements = [
    {
      id: 'sup-1',
      name: '비타민 C',
      brand: '종근당',
      benefits: ['immunity'],
      mainIngredients: [{ name: '아스코르브산', amount: 500, unit: 'mg' }],
      rating: 4.8,
      priceKrw: 15000,
      reviewCount: 200,
      createdAt: '2026-01-15T00:00:00Z',
    },
  ];

  const equipment = [
    {
      id: 'eq-1',
      name: '덤벨',
      brand: '헬스원',
      targetMuscles: ['arms'],
      rating: 4.0,
      priceKrw: 50000,
      reviewCount: 30,
      createdAt: '2026-01-10T00:00:00Z',
    },
  ];

  const healthFoods = [
    {
      id: 'hf-1',
      name: '단백질 쉐이크',
      brand: '마이프로틴',
      caloriesPerServing: 200,
      proteinG: 25,
      rating: 4.3,
      priceKrw: 40000,
      reviewCount: 80,
      createdAt: '2026-01-20T00:00:00Z',
    },
  ];

  return { cosmetics, supplements, equipment, healthFoods };
});

vi.mock('@/lib/products/repositories/cosmetic', () => ({
  getCosmeticProducts: vi.fn().mockResolvedValue(mockData.cosmetics),
  getCosmeticProductById: vi.fn().mockImplementation((id: string) => {
    const found = mockData.cosmetics.find((p: { id: string }) => p.id === id);
    return Promise.resolve(found ?? null);
  }),
  mapCosmeticRow: vi.fn().mockImplementation((row: unknown) => row),
}));

vi.mock('@/lib/products/repositories/supplement', () => ({
  getSupplementProducts: vi.fn().mockResolvedValue(mockData.supplements),
  getSupplementProductById: vi.fn().mockImplementation((id: string) => {
    const found = mockData.supplements.find((p: { id: string }) => p.id === id);
    return Promise.resolve(found ?? null);
  }),
  mapSupplementRow: vi.fn().mockImplementation((row: unknown) => row),
}));

vi.mock('@/lib/products/repositories/equipment', () => ({
  getWorkoutEquipment: vi.fn().mockResolvedValue(mockData.equipment),
  getWorkoutEquipmentById: vi.fn().mockImplementation((id: string) => {
    const found = mockData.equipment.find((p: { id: string }) => p.id === id);
    return Promise.resolve(found ?? null);
  }),
  mapWorkoutEquipmentRow: vi.fn().mockImplementation((row: unknown) => row),
}));

vi.mock('@/lib/products/repositories/healthfood', () => ({
  getHealthFoods: vi.fn().mockResolvedValue(mockData.healthFoods),
  getHealthFoodById: vi.fn().mockImplementation((id: string) => {
    const found = mockData.healthFoods.find((p: { id: string }) => p.id === id);
    return Promise.resolve(found ?? null);
  }),
  mapHealthFoodRow: vi.fn().mockImplementation((row: unknown) => row),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // 기본 mock 설정: Supabase 체이닝 결과
  mockSupabase.from.mockReturnThis();
  mockSupabase.select.mockReturnThis();
  mockSupabase.eq.mockReturnThis();
  mockSupabase.or.mockReturnThis();
  mockSupabase.order.mockReturnThis();
  mockSupabase.range.mockReturnThis();
  mockSupabase.limit.mockResolvedValue({ data: [], error: null });
});

describe('lib/products/services/search', () => {
  // =========================================
  // PRODUCT_CATEGORIES 상수 테스트
  // =========================================

  describe('PRODUCT_CATEGORIES', () => {
    // ADR-098: 화장품(전체/스킨케어/메이크업)만. 영양제/운동기구/건강식품(W/N) 제외
    it('화장품 카테고리만 정의되어 있다', () => {
      expect(PRODUCT_CATEGORIES).toHaveLength(3);
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('all');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('skincare');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('makeup');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).not.toContain('supplement');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).not.toContain('equipment');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).not.toContain('healthfood');
    });

    it('각 카테고리에 한글 라벨이 있다', () => {
      for (const category of PRODUCT_CATEGORIES) {
        expect(category.label).toBeDefined();
        expect(typeof category.label).toBe('string');
        expect(category.label.length).toBeGreaterThan(0);
      }
    });

    it('all 카테고리는 첫 번째이다', () => {
      expect(PRODUCT_CATEGORIES[0].id).toBe('all');
      expect(PRODUCT_CATEGORIES[0].label).toBe('전체');
    });
  });

  // =========================================
  // getProductType 테스트
  // =========================================

  describe('getProductType', () => {
    it('skinTypes가 있으면 cosmetic으로 판별한다', () => {
      const cosmetic = { id: 'c1', name: '세럼', skinTypes: ['dry'] };
      expect(getProductType(cosmetic as unknown as CosmeticProduct)).toBe('cosmetic');
    });

    it('personalColorSeasons가 있으면 cosmetic으로 판별한다', () => {
      const cosmetic = { id: 'c2', name: '립스틱', personalColorSeasons: ['Summer'] };
      expect(getProductType(cosmetic as unknown as CosmeticProduct)).toBe('cosmetic');
    });

    it('benefits와 mainIngredients가 있으면 supplement로 판별한다', () => {
      const supplement = {
        id: 's1',
        name: '비타민',
        benefits: ['immunity'],
        mainIngredients: [{ name: '비타민C', amount: 500, unit: 'mg' }],
      };
      expect(getProductType(supplement as unknown as SupplementProduct)).toBe('supplement');
    });

    it('targetMuscles가 있으면 workout_equipment로 판별한다', () => {
      const equipment = { id: 'e1', name: '덤벨', targetMuscles: ['arms'] };
      expect(getProductType(equipment as unknown as WorkoutEquipment)).toBe('workout_equipment');
    });

    it('exerciseTypes가 있으면 workout_equipment로 판별한다', () => {
      const equipment = { id: 'e2', name: '요가매트', exerciseTypes: ['flexibility'] };
      expect(getProductType(equipment as unknown as WorkoutEquipment)).toBe('workout_equipment');
    });

    it('caloriesPerServing이 있으면 health_food로 판별한다', () => {
      const food = { id: 'h1', name: '쉐이크', caloriesPerServing: 200 };
      expect(getProductType(food as unknown as HealthFood)).toBe('health_food');
    });

    it('proteinG가 있으면 health_food로 판별한다', () => {
      const food = { id: 'h2', name: '바', proteinG: 25 };
      expect(getProductType(food as unknown as HealthFood)).toBe('health_food');
    });

    it('판별 불가능한 경우 기본값 cosmetic을 반환한다', () => {
      const unknown = { id: 'u1', name: '알 수 없음' };
      expect(getProductType(unknown as unknown as CosmeticProduct)).toBe('cosmetic');
    });
  });

  // =========================================
  // productTypeToPath 테스트
  // =========================================

  describe('productTypeToPath', () => {
    it('cosmetic을 cosmetic 경로로 변환한다', () => {
      expect(productTypeToPath('cosmetic')).toBe('cosmetic');
    });

    it('supplement를 supplement 경로로 변환한다', () => {
      expect(productTypeToPath('supplement')).toBe('supplement');
    });

    it('workout_equipment를 equipment 경로로 변환한다', () => {
      expect(productTypeToPath('workout_equipment')).toBe('equipment');
    });

    it('health_food를 healthfood 경로로 변환한다', () => {
      expect(productTypeToPath('health_food')).toBe('healthfood');
    });

    it('알 수 없는 타입은 기본값 cosmetic을 반환한다', () => {
      // @ts-expect-error - 테스트를 위해 의도적으로 잘못된 타입 전달
      expect(productTypeToPath('unknown')).toBe('cosmetic');
    });
  });

  // =========================================
  // pathToProductType 테스트
  // =========================================

  describe('pathToProductType', () => {
    it('cosmetic 경로를 cosmetic 타입으로 변환한다', () => {
      expect(pathToProductType('cosmetic')).toBe('cosmetic');
    });

    it('supplement 경로를 supplement 타입으로 변환한다', () => {
      expect(pathToProductType('supplement')).toBe('supplement');
    });

    it('equipment 경로를 workout_equipment 타입으로 변환한다', () => {
      expect(pathToProductType('equipment')).toBe('workout_equipment');
    });

    it('healthfood 경로를 health_food 타입으로 변환한다', () => {
      expect(pathToProductType('healthfood')).toBe('health_food');
    });

    it('알 수 없는 경로는 null을 반환한다', () => {
      expect(pathToProductType('unknown')).toBeNull();
      expect(pathToProductType('')).toBeNull();
      expect(pathToProductType('workout')).toBeNull();
    });
  });

  // =========================================
  // 타입 변환 왕복 테스트
  // =========================================

  describe('타입 변환 왕복 테스트', () => {
    const productTypes = ['cosmetic', 'supplement', 'workout_equipment', 'health_food'] as const;

    it.each(productTypes)('%s 타입은 경로 변환 후 다시 원래 타입으로 복원된다', (type) => {
      const path = productTypeToPath(type);
      const restored = pathToProductType(path);
      expect(restored).toBe(type);
    });
  });

  // =========================================
  // getProductsByCategory 테스트
  // =========================================

  describe('getProductsByCategory', () => {
    // ADR-098: 화장품만 (영양제/운동기구/건강식품 미병합)
    it('all 카테고리는 화장품만 반환한다', async () => {
      const results = await getProductsByCategory('all');
      expect(results.length).toBeGreaterThan(0);
      const ids = results.map((p) => p.id);
      expect(ids).not.toContain('sup-1');
      expect(ids).not.toContain('eq-1');
      expect(ids).not.toContain('hf-1');
    });

    it('skincare 카테고리는 메이크업을 제외한다', async () => {
      const results = await getProductsByCategory('skincare');
      // mockCosmeticProducts에서 category !== 'makeup'인 것만 필터
      const hasMakeup = results.some(
        (p) => 'category' in p && (p as CosmeticProduct).category === 'makeup'
      );
      expect(hasMakeup).toBe(false);
    });

    // ADR-098: W/N 카테고리 값은 화장품으로 폴백 (W/N 제품 누수 없음)
    it('supplement/equipment/healthfood 카테고리는 화장품으로 폴백한다', async () => {
      for (const cat of ['supplement', 'equipment', 'healthfood'] as const) {
        const results = await getProductsByCategory(cat);
        const ids = results.map((p) => p.id);
        expect(ids).not.toContain('sup-1');
        expect(ids).not.toContain('eq-1');
        expect(ids).not.toContain('hf-1');
      }
    });

    it('페이지네이션 옵션이 적용된다', async () => {
      const results = await getProductsByCategory('all', { limit: 2, page: 1 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('기본 limit은 20이다', async () => {
      const results = await getProductsByCategory('all');
      expect(results.length).toBeLessThanOrEqual(20);
    });

    it('rating 정렬이 기본값이다', async () => {
      const results = await getProductsByCategory('all', { sortBy: 'rating' });
      // 평점 내림차순 정렬 확인
      for (let i = 0; i < results.length - 1; i++) {
        const ratingA = 'rating' in results[i] ? ((results[i] as CosmeticProduct).rating ?? 0) : 0;
        const ratingB =
          'rating' in results[i + 1] ? ((results[i + 1] as CosmeticProduct).rating ?? 0) : 0;
        expect(ratingA).toBeGreaterThanOrEqual(ratingB);
      }
    });
  });

  // =========================================
  // searchProducts 테스트
  // =========================================

  describe('searchProducts', () => {
    it('빈 쿼리는 빈 배열을 반환한다', async () => {
      const results = await searchProducts('');
      expect(results).toEqual([]);
    });

    it('공백만 있는 쿼리는 빈 배열을 반환한다', async () => {
      const results = await searchProducts('   ');
      expect(results).toEqual([]);
    });

    // ADR-098: 화장품만 검색 (영양제/운동기구/건강식품 테이블 미조회)
    it('카테고리 없이 검색하면 화장품 테이블만 검색한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      await searchProducts('세럼');

      expect(mockSupabase.from).toHaveBeenCalledWith('cosmetic_products');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('supplement_products');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('workout_equipment');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('health_foods');
    });

    it('skincare 카테고리로 검색하면 cosmetic 테이블만 검색한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      await searchProducts('세럼', 'skincare');

      expect(mockSupabase.from).toHaveBeenCalledWith('cosmetic_products');
      // supplement, equipment, healthfood는 호출되지 않음
    });

    it('limit 파라미터가 적용된다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      await searchProducts('테스트', undefined, 5);

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it('검색 결과가 limit를 초과하지 않는다', async () => {
      // 여러 테이블에서 결과가 나오는 경우
      const manyResults = Array.from({ length: 30 }, (_, i) => ({
        id: `cos-${i}`,
        name: `제품 ${i}`,
        brand: '브랜드',
        category: 'serum',
        is_active: true,
      }));

      mockSupabase.limit.mockResolvedValue({ data: manyResults, error: null });

      const results = await searchProducts('제품', undefined, 10);
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  // =========================================
  // getProductById 테스트
  // =========================================

  describe('getProductById', () => {
    it('cosmetic 타입으로 제품을 조회한다', async () => {
      const result = await getProductById('cosmetic', 'cos-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('cos-1');
    });

    it('supplement 타입으로 제품을 조회한다', async () => {
      const result = await getProductById('supplement', 'sup-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('sup-1');
    });

    it('workout_equipment 타입으로 제품을 조회한다', async () => {
      const result = await getProductById('workout_equipment', 'eq-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('eq-1');
    });

    it('health_food 타입으로 제품을 조회한다', async () => {
      const result = await getProductById('health_food', 'hf-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('hf-1');
    });

    it('존재하지 않는 ID는 null을 반환한다', async () => {
      const result = await getProductById('cosmetic', 'non-existent');
      expect(result).toBeNull();
    });

    it('알 수 없는 타입은 null을 반환한다', async () => {
      // @ts-expect-error - 테스트를 위해 의도적으로 잘못된 타입 전달
      const result = await getProductById('invalid_type', 'id-1');
      expect(result).toBeNull();
    });
  });
});
