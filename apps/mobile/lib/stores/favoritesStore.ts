/**
 * 즐겨찾기(북마크) 스토어
 * @description AsyncStorage 기반 제품 즐겨찾기 관리
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FavoriteProductType =
  | 'cosmetic'
  | 'supplement'
  | 'equipment'
  | 'healthfood';

export interface FavoriteItem {
  productId: string;
  productType: FavoriteProductType;
  name: string;
  brand: string;
  imageUrl?: string;
  priceKrw?: number;
  addedAt: number;
}

interface FavoritesState {
  items: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  clearAll: () => void;
  getFavoritesByType: (productType: FavoriteProductType) => FavoriteItem[];
}

const MAX_FAVORITES = 100;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      addFavorite: (item) =>
        set((state) => {
          // 이미 있는 항목인지 확인
          if (state.items.some((i) => i.productId === item.productId)) {
            return state;
          }

          // 새 항목 추가
          const newItem: FavoriteItem = {
            ...item,
            addedAt: Date.now(),
          };

          // 최대 개수 유지 (오래된 것 제거)
          const updated = [newItem, ...state.items].slice(0, MAX_FAVORITES);

          return { items: updated };
        }),

      removeFavorite: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      isFavorite: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clearAll: () => set({ items: [] }),

      getFavoritesByType: (productType) => {
        return get().items.filter((i) => i.productType === productType);
      },
    }),
    {
      name: 'yiroom-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * 즐겨찾기 개수 가져오기
 */
export function getFavoritesCount(): number {
  return useFavoritesStore.getState().items.length;
}

/**
 * 타입별 즐겨찾기 개수
 */
export function getFavoritesCountByType(
  productType: FavoriteProductType
): number {
  return useFavoritesStore
    .getState()
    .items.filter((i) => i.productType === productType).length;
}
