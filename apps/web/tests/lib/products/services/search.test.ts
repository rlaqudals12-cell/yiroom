/**
 * 제품 검색 서비스 테스트
 *
 * @module tests/lib/products/services/search
 * @description 제품 검색, 정렬, 타입 변환 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  PRODUCT_CATEGORIES,
  getProductType,
  productTypeToPath,
  pathToProductType,
} from '@/lib/products/services/search';
import type { CosmeticProduct, SupplementProduct, WorkoutEquipment, HealthFood } from '@/types/product';

describe('lib/products/services/search', () => {
  // =========================================
  // PRODUCT_CATEGORIES 상수 테스트
  // =========================================

  describe('PRODUCT_CATEGORIES', () => {
    it('모든 카테고리가 정의되어 있다', () => {
      expect(PRODUCT_CATEGORIES).toHaveLength(6);
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('all');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('skincare');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('makeup');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('supplement');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('equipment');
      expect(PRODUCT_CATEGORIES.map((c) => c.id)).toContain('healthfood');
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
    it('화장품을 cosmetic으로 판별한다', () => {
      const cosmetic: Partial<CosmeticProduct> = {
        id: 'test-1',
        name: '테스트 세럼',
        skinTypes: ['dry'],
        personalColorSeasons: ['Spring'],
      };
      expect(getProductType(cosmetic as CosmeticProduct)).toBe('cosmetic');
    });

    it('skinTypes만 있어도 cosmetic으로 판별한다', () => {
      const cosmetic: Partial<CosmeticProduct> = {
        id: 'test-2',
        name: '테스트 로션',
        skinTypes: ['oily'],
      };
      expect(getProductType(cosmetic as CosmeticProduct)).toBe('cosmetic');
    });

    it('personalColorSeasons만 있어도 cosmetic으로 판별한다', () => {
      const cosmetic: Partial<CosmeticProduct> = {
        id: 'test-3',
        name: '테스트 립스틱',
        personalColorSeasons: ['Summer'],
      };
      expect(getProductType(cosmetic as CosmeticProduct)).toBe('cosmetic');
    });

    it('영양제를 supplement로 판별한다', () => {
      const supplement: Partial<SupplementProduct> = {
        id: 'test-4',
        name: '비타민 C',
        benefits: ['immunity'],
        mainIngredients: [{ name: '아스코르브산', amount: 500, unit: 'mg' }],
      };
      expect(getProductType(supplement as SupplementProduct)).toBe('supplement');
    });

    it('운동기구를 workout_equipment로 판별한다', () => {
      const equipment: Partial<WorkoutEquipment> = {
        id: 'test-5',
        name: '덤벨',
        targetMuscles: ['arms'],
      };
      expect(getProductType(equipment as WorkoutEquipment)).toBe('workout_equipment');
    });

    it('exerciseTypes가 있으면 workout_equipment로 판별한다', () => {
      const equipment: Partial<WorkoutEquipment> = {
        id: 'test-6',
        name: '요가매트',
        exerciseTypes: ['flexibility'],
      };
      expect(getProductType(equipment as WorkoutEquipment)).toBe('workout_equipment');
    });

    it('건강식품을 health_food로 판별한다', () => {
      const healthFood: Partial<HealthFood> = {
        id: 'test-7',
        name: '단백질 쉐이크',
        caloriesPerServing: 200,
        proteinG: 25,
      };
      expect(getProductType(healthFood as HealthFood)).toBe('health_food');
    });

    it('caloriesPerServing만 있어도 health_food로 판별한다', () => {
      const healthFood: Partial<HealthFood> = {
        id: 'test-8',
        name: '에너지바',
        caloriesPerServing: 150,
      };
      expect(getProductType(healthFood as HealthFood)).toBe('health_food');
    });

    it('판별 불가능한 경우 기본값 cosmetic을 반환한다', () => {
      const unknown = {
        id: 'test-9',
        name: '알 수 없는 제품',
      };
      expect(getProductType(unknown as CosmeticProduct)).toBe('cosmetic');
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
  // 왕복 변환 테스트
  // =========================================

  describe('타입 변환 왕복 테스트', () => {
    const productTypes = ['cosmetic', 'supplement', 'workout_equipment', 'health_food'] as const;

    it.each(productTypes)('%s 타입은 경로 변환 후 다시 원래 타입으로 복원된다', (type) => {
      const path = productTypeToPath(type);
      const restored = pathToProductType(path);
      expect(restored).toBe(type);
    });
  });
});
