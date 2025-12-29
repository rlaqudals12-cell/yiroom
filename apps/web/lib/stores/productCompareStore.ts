/**
 * 제품 비교 스토어
 * @description 비교할 제품 목록 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductType } from '@/types/product';

export interface CompareItem {
  productId: string;
  productType: ProductType;
  name: string;
  brand: string;
  imageUrl?: string;
  priceKrw?: number;
  rating?: number;
  // 화장품 전용
  skinTypes?: string[];
  concerns?: string[];
  keyIngredients?: string[];
  // 영양제 전용
  benefits?: string[];
  mainIngredients?: Array<{ name: string; amount: number; unit: string }>;
}

interface ProductCompareState {
  items: CompareItem[];
  isOpen: boolean;
  addItem: (item: CompareItem) => boolean;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

const MAX_COMPARE_ITEMS = 3;

export const useProductCompareStore = create<ProductCompareState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const state = get();

        // 이미 추가된 경우
        if (state.items.some((i) => i.productId === item.productId)) {
          return false;
        }

        // 최대 개수 초과
        if (state.items.length >= MAX_COMPARE_ITEMS) {
          return false;
        }

        // 다른 타입 제품은 비교 불가
        if (state.items.length > 0 && state.items[0].productType !== item.productType) {
          return false;
        }

        set((s) => ({ items: [...s.items, item] }));
        return true;
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clearAll: () => set({ items: [], isOpen: false }),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      setOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: 'product-compare',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/**
 * 비교 가능 여부 확인
 */
export function canAddToCompare(productType: ProductType): boolean {
  const state = useProductCompareStore.getState();

  if (state.items.length >= MAX_COMPARE_ITEMS) return false;
  if (state.items.length === 0) return true;

  return state.items[0].productType === productType;
}

/**
 * 현재 비교 중인 제품 개수
 */
export function getCompareCount(): number {
  return useProductCompareStore.getState().items.length;
}
