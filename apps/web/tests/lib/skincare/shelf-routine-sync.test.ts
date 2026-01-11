/**
 * 제품함-루틴 연동 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  detectProductCategory,
  sortByLayeringOrder,
  generateRoutineFromShelf,
  shouldRefreshRoutine,
} from '@/lib/skincare/shelf-routine-sync';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import type { RoutineStep } from '@/types/skincare-routine';

// 테스트용 Mock ShelfItem 생성
function createMockShelfItem(overrides: Partial<ShelfItem> = {}): ShelfItem {
  return {
    id: 'test-id-1',
    clerkUserId: 'user-1',
    productName: 'Test Product',
    productIngredients: [],
    scannedAt: new Date(),
    scanMethod: 'barcode',
    status: 'owned',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('shelf-routine-sync', () => {
  describe('detectProductCategory', () => {
    it('클렌저 제품을 감지해야 함', () => {
      const product = createMockShelfItem({ productName: 'Gentle Foam Cleanser' });
      expect(detectProductCategory(product)).toBe('cleanser');
    });

    it('토너 제품을 감지해야 함', () => {
      const product = createMockShelfItem({ productName: '미백 토너' });
      expect(detectProductCategory(product)).toBe('toner');
    });

    it('선크림 제품을 감지해야 함', () => {
      const product = createMockShelfItem({ productName: 'SPF50 자외선 차단제' });
      expect(detectProductCategory(product)).toBe('sunscreen');
    });

    it('아이크림 제품을 감지해야 함', () => {
      const product = createMockShelfItem({ productName: '아이 리페어 크림' });
      expect(detectProductCategory(product)).toBe('eye_cream');
    });

    it('세럼 제품을 감지해야 함', () => {
      const product = createMockShelfItem({ productName: 'Vitamin C Serum' });
      expect(detectProductCategory(product)).toBe('serum');
    });

    it('알 수 없는 제품은 null을 반환해야 함', () => {
      const product = createMockShelfItem({ productName: 'Unknown Product XYZ' });
      expect(detectProductCategory(product)).toBeNull();
    });

    it('브랜드명에서도 카테고리를 감지해야 함', () => {
      const product = createMockShelfItem({
        productName: 'Special Formula',
        productBrand: 'Sunscreen Brand SPF',
      });
      expect(detectProductCategory(product)).toBe('sunscreen');
    });
  });

  describe('sortByLayeringOrder', () => {
    it('아침 루틴 순서대로 정렬해야 함', () => {
      const products = [
        createMockShelfItem({ id: '1', productName: 'Sunscreen SPF50' }),
        createMockShelfItem({ id: '2', productName: 'Gentle Toner' }),
        createMockShelfItem({ id: '3', productName: 'Foam Cleanser' }),
        createMockShelfItem({ id: '4', productName: 'Moisturizing Cream' }),
      ];

      const sorted = sortByLayeringOrder(products, 'morning');

      // 아침 순서: cleanser → toner → cream → sunscreen
      expect(sorted[0].category).toBe('cleanser');
      expect(sorted[1].category).toBe('toner');
      expect(sorted[2].category).toBe('cream');
      expect(sorted[3].category).toBe('sunscreen');
    });

    it('저녁 루틴 순서대로 정렬해야 함', () => {
      const products = [
        createMockShelfItem({ id: '1', productName: 'Night Cream' }),
        createMockShelfItem({ id: '2', productName: 'Spot Treatment Acne' }),
        createMockShelfItem({ id: '3', productName: 'Toner Skin' }),
        createMockShelfItem({ id: '4', productName: 'Foam Cleanser' }),
      ];

      const sorted = sortByLayeringOrder(products, 'evening');

      // 저녁 순서: cleanser → toner → cream → spot_treatment
      expect(sorted[0].category).toBe('cleanser');
      expect(sorted[1].category).toBe('toner');
      expect(sorted[2].category).toBe('cream');
      expect(sorted[3].category).toBe('spot_treatment');
    });

    it('레이어링 이유가 포함되어야 함', () => {
      const products = [createMockShelfItem({ productName: 'Sunscreen SPF50' })];

      const sorted = sortByLayeringOrder(products, 'morning');

      expect(sorted[0].layeringReason).toBeDefined();
      expect(sorted[0].layeringReason).toContain('보호');
    });
  });

  describe('generateRoutineFromShelf', () => {
    it('보유 제품으로 루틴을 생성해야 함', () => {
      const shelfItems = [
        createMockShelfItem({ id: '1', productName: 'Foam Cleanser', status: 'owned' }),
        createMockShelfItem({ id: '2', productName: 'Hydrating Toner', status: 'owned' }),
        createMockShelfItem({ id: '3', productName: 'Moisturizing Cream', status: 'owned' }),
      ];

      const result = generateRoutineFromShelf(shelfItems, 'normal', 'morning');

      expect(result.generatedRoutine.length).toBe(3);
      expect(result.usedProducts.length).toBe(3);
    });

    it('위시리스트 제품은 제외해야 함', () => {
      const shelfItems = [
        createMockShelfItem({ id: '1', productName: 'Foam Cleanser', status: 'owned' }),
        createMockShelfItem({ id: '2', productName: 'Hydrating Toner', status: 'wishlist' }),
      ];

      const result = generateRoutineFromShelf(shelfItems, 'normal', 'morning');

      expect(result.generatedRoutine.length).toBe(1);
    });

    it('누락된 필수 카테고리를 반환해야 함', () => {
      const shelfItems = [
        createMockShelfItem({ id: '1', productName: 'Foam Cleanser', status: 'owned' }),
        // 토너, 크림, 선크림 없음
      ];

      const result = generateRoutineFromShelf(shelfItems, 'normal', 'morning');

      expect(result.missingCategories).toContain('toner');
      expect(result.missingCategories).toContain('cream');
      expect(result.missingCategories).toContain('sunscreen');
    });

    it('shelfProductId가 루틴 단계에 포함되어야 함', () => {
      const shelfItems = [
        createMockShelfItem({ id: 'product-123', productName: 'Foam Cleanser', status: 'owned' }),
      ];

      const result = generateRoutineFromShelf(shelfItems, 'normal', 'morning');

      expect(result.generatedRoutine[0].shelfProductId).toBe('product-123');
    });

    it('개인화 노트가 생성되어야 함', () => {
      const shelfItems = [
        createMockShelfItem({ id: '1', productName: 'Foam Cleanser', status: 'owned' }),
      ];

      const result = generateRoutineFromShelf(shelfItems, 'normal', 'morning');

      expect(result.personalizationNote).toBeDefined();
      expect(result.personalizationNote).toContain('1개 제품');
    });
  });

  describe('shouldRefreshRoutine', () => {
    it('새 제품이 추가되면 true를 반환해야 함', () => {
      const currentRoutine: RoutineStep[] = [
        {
          order: 1,
          category: 'cleanser',
          name: '클렌저',
          purpose: '',
          tips: [],
          isOptional: false,
          shelfProductId: 'product-1',
        },
      ];

      const shelfItems = [
        createMockShelfItem({ id: 'product-1', productName: 'Cleanser', status: 'owned' }),
        createMockShelfItem({ id: 'product-2', productName: 'Toner', status: 'owned' }), // 새 제품
      ];

      expect(shouldRefreshRoutine(currentRoutine, shelfItems)).toBe(true);
    });

    it('제품이 삭제되면 true를 반환해야 함', () => {
      const currentRoutine: RoutineStep[] = [
        {
          order: 1,
          category: 'cleanser',
          name: '클렌저',
          purpose: '',
          tips: [],
          isOptional: false,
          shelfProductId: 'product-1',
        },
        {
          order: 2,
          category: 'toner',
          name: '토너',
          purpose: '',
          tips: [],
          isOptional: false,
          shelfProductId: 'product-2', // 이 제품이 제품함에서 삭제됨
        },
      ];

      const shelfItems = [
        createMockShelfItem({ id: 'product-1', productName: 'Cleanser', status: 'owned' }),
        // product-2 없음
      ];

      expect(shouldRefreshRoutine(currentRoutine, shelfItems)).toBe(true);
    });

    it('변경이 없으면 false를 반환해야 함', () => {
      const currentRoutine: RoutineStep[] = [
        {
          order: 1,
          category: 'cleanser',
          name: '클렌저',
          purpose: '',
          tips: [],
          isOptional: false,
          shelfProductId: 'product-1',
        },
      ];

      const shelfItems = [
        createMockShelfItem({ id: 'product-1', productName: 'Cleanser', status: 'owned' }),
      ];

      expect(shouldRefreshRoutine(currentRoutine, shelfItems)).toBe(false);
    });
  });
});
