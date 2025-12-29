/**
 * 최근 본 제품 스토어 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useRecentlyViewedStore, getRecentlyViewed } from '@/lib/stores/recentlyViewedStore';

describe('recentlyViewedStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useRecentlyViewedStore.setState({ items: [] });
  });

  describe('addItem', () => {
    it('제품을 추가한다', () => {
      const { addItem } = useRecentlyViewedStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '테스트 제품',
        brand: '테스트 브랜드',
      });

      const state = useRecentlyViewedStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].productId).toBe('prod-1');
      expect(state.items[0].viewedAt).toBeDefined();
    });

    it('중복 제품은 최신으로 이동한다', () => {
      const { addItem } = useRecentlyViewedStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드 1',
      });

      addItem({
        productId: 'prod-2',
        productType: 'cosmetic',
        name: '제품 2',
        brand: '브랜드 2',
      });

      // prod-1 다시 추가
      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1 (업데이트)',
        brand: '브랜드 1',
      });

      const state = useRecentlyViewedStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].productId).toBe('prod-1'); // 최신이 첫번째
      expect(state.items[0].name).toBe('제품 1 (업데이트)');
    });

    it('최대 20개까지만 저장한다', () => {
      const { addItem } = useRecentlyViewedStore.getState();

      // 25개 추가
      for (let i = 0; i < 25; i++) {
        addItem({
          productId: `prod-${i}`,
          productType: 'cosmetic',
          name: `제품 ${i}`,
          brand: '브랜드',
        });
      }

      const state = useRecentlyViewedStore.getState();
      expect(state.items).toHaveLength(20);
      expect(state.items[0].productId).toBe('prod-24'); // 최신
    });
  });

  describe('removeItem', () => {
    it('제품을 제거한다', () => {
      const { addItem, removeItem } = useRecentlyViewedStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드',
      });

      removeItem('prod-1');

      const state = useRecentlyViewedStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('모든 제품을 제거한다', () => {
      const { addItem, clearAll } = useRecentlyViewedStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드',
      });

      addItem({
        productId: 'prod-2',
        productType: 'cosmetic',
        name: '제품 2',
        brand: '브랜드',
      });

      clearAll();

      const state = useRecentlyViewedStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('getRecentlyViewed', () => {
    it('최근 본 제품을 가져온다', () => {
      const { addItem } = useRecentlyViewedStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드',
      });

      const items = getRecentlyViewed(10);
      expect(items).toHaveLength(1);
    });

    it('limit에 맞게 가져온다', () => {
      const { addItem } = useRecentlyViewedStore.getState();

      for (let i = 0; i < 10; i++) {
        addItem({
          productId: `prod-${i}`,
          productType: 'cosmetic',
          name: `제품 ${i}`,
          brand: '브랜드',
        });
      }

      const items = getRecentlyViewed(5);
      expect(items).toHaveLength(5);
    });
  });
});
