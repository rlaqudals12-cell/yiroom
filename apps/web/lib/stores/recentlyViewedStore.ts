/**
 * 최근 본 제품 스토어
 * @description localStorage 기반 최근 본 제품 관리
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductType } from '@/types/product';

export interface RecentlyViewedItem {
  productId: string;
  productType: ProductType;
  name: string;
  brand: string;
  imageUrl?: string;
  priceKrw?: number;
  viewedAt: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, 'viewedAt'>) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
}

const MAX_ITEMS = 20;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          // 이미 있는 항목 제거
          const filtered = state.items.filter((i) => i.productId !== item.productId);

          // 새 항목 추가 (최신순)
          const newItem: RecentlyViewedItem = {
            ...item,
            viewedAt: Date.now(),
          };

          // 최대 개수 유지
          const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);

          return { items: updated };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'recently-viewed-products',
    }
  )
);

/**
 * 최근 본 제품 가져오기 (최대 n개)
 */
export function getRecentlyViewed(limit: number = 10): RecentlyViewedItem[] {
  return useRecentlyViewedStore.getState().items.slice(0, limit);
}
