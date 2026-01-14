/**
 * 즐겨찾기 스토어 테스트
 */

import {
  useFavoritesStore,
  getFavoritesCount,
  getFavoritesCountByType,
} from '@/lib/stores';

describe('useFavoritesStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useFavoritesStore.getState().clearAll();
  });

  describe('addFavorite', () => {
    it('새 제품을 즐겨찾기에 추가해야 함', () => {
      const { addFavorite, items } = useFavoritesStore.getState();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 세럼',
        brand: '테스트 브랜드',
        priceKrw: 35000,
      });

      expect(useFavoritesStore.getState().items).toHaveLength(1);
      expect(useFavoritesStore.getState().items[0].productId).toBe('product_1');
    });

    it('중복 제품은 추가하지 않아야 함', () => {
      const { addFavorite } = useFavoritesStore.getState();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 세럼',
        brand: '테스트 브랜드',
      });

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 세럼',
        brand: '테스트 브랜드',
      });

      expect(useFavoritesStore.getState().items).toHaveLength(1);
    });

    it('addedAt 타임스탬프가 설정되어야 함', () => {
      const { addFavorite } = useFavoritesStore.getState();
      const before = Date.now();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 세럼',
        brand: '테스트 브랜드',
      });

      const after = Date.now();
      const item = useFavoritesStore.getState().items[0];

      expect(item.addedAt).toBeGreaterThanOrEqual(before);
      expect(item.addedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('removeFavorite', () => {
    it('제품을 즐겨찾기에서 제거해야 함', () => {
      const { addFavorite, removeFavorite } = useFavoritesStore.getState();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 세럼',
        brand: '테스트 브랜드',
      });

      expect(useFavoritesStore.getState().items).toHaveLength(1);

      removeFavorite('product_1');

      expect(useFavoritesStore.getState().items).toHaveLength(0);
    });

    it('존재하지 않는 제품 제거 시 에러가 발생하지 않아야 함', () => {
      const { removeFavorite } = useFavoritesStore.getState();

      expect(() => removeFavorite('non_existent')).not.toThrow();
    });
  });

  describe('isFavorite', () => {
    it('즐겨찾기에 있는 제품은 true 반환', () => {
      const { addFavorite, isFavorite } = useFavoritesStore.getState();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 세럼',
        brand: '테스트 브랜드',
      });

      expect(useFavoritesStore.getState().isFavorite('product_1')).toBe(true);
    });

    it('즐겨찾기에 없는 제품은 false 반환', () => {
      const { isFavorite } = useFavoritesStore.getState();

      expect(isFavorite('non_existent')).toBe(false);
    });
  });

  describe('getFavoritesByType', () => {
    it('특정 타입의 즐겨찾기만 반환해야 함', () => {
      const { addFavorite, getFavoritesByType } = useFavoritesStore.getState();

      addFavorite({
        productId: 'cosmetic_1',
        productType: 'cosmetic',
        name: '세럼',
        brand: '브랜드A',
      });

      addFavorite({
        productId: 'supplement_1',
        productType: 'supplement',
        name: '비타민',
        brand: '브랜드B',
      });

      const cosmetics = useFavoritesStore
        .getState()
        .getFavoritesByType('cosmetic');
      expect(cosmetics).toHaveLength(1);
      expect(cosmetics[0].productId).toBe('cosmetic_1');
    });
  });

  describe('clearAll', () => {
    it('모든 즐겨찾기를 삭제해야 함', () => {
      const { addFavorite, clearAll } = useFavoritesStore.getState();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 1',
        brand: '브랜드',
      });

      addFavorite({
        productId: 'product_2',
        productType: 'supplement',
        name: '테스트 2',
        brand: '브랜드',
      });

      expect(useFavoritesStore.getState().items).toHaveLength(2);

      clearAll();

      expect(useFavoritesStore.getState().items).toHaveLength(0);
    });
  });

  describe('유틸리티 함수', () => {
    it('getFavoritesCount가 총 개수를 반환해야 함', () => {
      const { addFavorite } = useFavoritesStore.getState();

      addFavorite({
        productId: 'product_1',
        productType: 'cosmetic',
        name: '테스트 1',
        brand: '브랜드',
      });

      addFavorite({
        productId: 'product_2',
        productType: 'supplement',
        name: '테스트 2',
        brand: '브랜드',
      });

      expect(getFavoritesCount()).toBe(2);
    });

    it('getFavoritesCountByType이 타입별 개수를 반환해야 함', () => {
      const { addFavorite } = useFavoritesStore.getState();

      addFavorite({
        productId: 'cosmetic_1',
        productType: 'cosmetic',
        name: '테스트 1',
        brand: '브랜드',
      });

      addFavorite({
        productId: 'cosmetic_2',
        productType: 'cosmetic',
        name: '테스트 2',
        brand: '브랜드',
      });

      addFavorite({
        productId: 'supplement_1',
        productType: 'supplement',
        name: '테스트 3',
        brand: '브랜드',
      });

      expect(getFavoritesCountByType('cosmetic')).toBe(2);
      expect(getFavoritesCountByType('supplement')).toBe(1);
      expect(getFavoritesCountByType('equipment')).toBe(0);
    });
  });
});
