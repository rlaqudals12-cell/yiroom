/**
 * 제품 비교 스토어 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useProductCompareStore,
  canAddToCompare,
  getCompareCount,
} from '@/lib/stores/productCompareStore';

describe('productCompareStore', () => {
  beforeEach(() => {
    useProductCompareStore.setState({ items: [], isOpen: false });
  });

  describe('addItem', () => {
    it('제품을 추가한다', () => {
      const { addItem } = useProductCompareStore.getState();

      const result = addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드 1',
      });

      expect(result).toBe(true);
      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(1);
    });

    it('중복 제품은 추가하지 않는다', () => {
      const { addItem } = useProductCompareStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드 1',
      });

      const result = addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드 1',
      });

      expect(result).toBe(false);
      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(1);
    });

    it('최대 3개까지만 추가한다', () => {
      const { addItem } = useProductCompareStore.getState();

      addItem({ productId: 'prod-1', productType: 'cosmetic', name: '1', brand: 'b' });
      addItem({ productId: 'prod-2', productType: 'cosmetic', name: '2', brand: 'b' });
      addItem({ productId: 'prod-3', productType: 'cosmetic', name: '3', brand: 'b' });

      const result = addItem({
        productId: 'prod-4',
        productType: 'cosmetic',
        name: '4',
        brand: 'b',
      });

      expect(result).toBe(false);
      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(3);
    });

    it('다른 타입 제품은 추가하지 않는다', () => {
      const { addItem } = useProductCompareStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '화장품',
        brand: '브랜드',
      });

      const result = addItem({
        productId: 'prod-2',
        productType: 'supplement',
        name: '영양제',
        brand: '브랜드',
      });

      expect(result).toBe(false);
      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(1);
    });
  });

  describe('removeItem', () => {
    it('제품을 제거한다', () => {
      const { addItem, removeItem } = useProductCompareStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '제품 1',
        brand: '브랜드',
      });

      removeItem('prod-1');

      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('모든 제품을 제거하고 시트를 닫는다', () => {
      const { addItem, setOpen, clearAll } = useProductCompareStore.getState();

      addItem({ productId: 'prod-1', productType: 'cosmetic', name: '1', brand: 'b' });
      setOpen(true);

      clearAll();

      const state = useProductCompareStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.isOpen).toBe(false);
    });
  });

  describe('canAddToCompare', () => {
    it('빈 상태에서는 모든 타입 추가 가능', () => {
      expect(canAddToCompare('cosmetic')).toBe(true);
      expect(canAddToCompare('supplement')).toBe(true);
    });

    it('같은 타입만 추가 가능', () => {
      const { addItem } = useProductCompareStore.getState();

      addItem({
        productId: 'prod-1',
        productType: 'cosmetic',
        name: '화장품',
        brand: '브랜드',
      });

      expect(canAddToCompare('cosmetic')).toBe(true);
      expect(canAddToCompare('supplement')).toBe(false);
    });

    it('3개 이상이면 추가 불가', () => {
      const { addItem } = useProductCompareStore.getState();

      addItem({ productId: 'prod-1', productType: 'cosmetic', name: '1', brand: 'b' });
      addItem({ productId: 'prod-2', productType: 'cosmetic', name: '2', brand: 'b' });
      addItem({ productId: 'prod-3', productType: 'cosmetic', name: '3', brand: 'b' });

      expect(canAddToCompare('cosmetic')).toBe(false);
    });
  });

  describe('getCompareCount', () => {
    it('비교 제품 수를 반환한다', () => {
      const { addItem } = useProductCompareStore.getState();

      expect(getCompareCount()).toBe(0);

      addItem({ productId: 'prod-1', productType: 'cosmetic', name: '1', brand: 'b' });
      expect(getCompareCount()).toBe(1);

      addItem({ productId: 'prod-2', productType: 'cosmetic', name: '2', brand: 'b' });
      expect(getCompareCount()).toBe(2);
    });
  });

  describe('toggleOpen / setOpen', () => {
    it('시트 상태를 토글한다', () => {
      const { toggleOpen } = useProductCompareStore.getState();

      toggleOpen();
      expect(useProductCompareStore.getState().isOpen).toBe(true);

      toggleOpen();
      expect(useProductCompareStore.getState().isOpen).toBe(false);
    });

    it('시트 상태를 설정한다', () => {
      const { setOpen } = useProductCompareStore.getState();

      setOpen(true);
      expect(useProductCompareStore.getState().isOpen).toBe(true);

      setOpen(false);
      expect(useProductCompareStore.getState().isOpen).toBe(false);
    });
  });
});
