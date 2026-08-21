import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { WISHLIST_TYPE_LABELS } from './wishlist-screen.constants';
import { getWishlist, removeFromWishlist, type WishlistItem } from '../../lib/wishlist';
import type { ProductType } from '../../types/product';

export interface WishlistDisplayItem extends WishlistItem {
  name?: string;
  brand?: string;
  priceKrw?: number;
}

export function useWishlistScreen(): {
  items: WishlistDisplayItem[];
  isLoading: boolean;
  error: string | null;
  typeCounts: Partial<Record<ProductType, number>>;
  loadWishlist: () => Promise<void>;
  removeItem: (item: WishlistDisplayItem) => void;
  clearItems: () => void;
} {
  const { getToken } = useAuth();
  const [items, setItems] = useState<WishlistDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      // 메타는 웹 API가 실제 제품 테이블에서 확인한 값만 사용한다.
      setItems(await getWishlist(token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '찜 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  const removeItem = useCallback(
    (item: WishlistDisplayItem): void => {
      const label = item.name ?? `${WISHLIST_TYPE_LABELS[item.productType]} 제품`;
      Alert.alert('즐겨찾기 삭제', `"${label}"을(를) 즐겨찾기에서 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const token = await getToken();
                if (!token) throw new Error('로그인이 필요합니다.');
                await removeFromWishlist(token, item.productType, item.productId);
                setItems((current) => current.filter((saved) => saved.id !== item.id));
              } catch {
                Alert.alert('삭제하지 못했어요', '네트워크 연결을 확인한 뒤 다시 시도해주세요.');
              }
            })();
          },
        },
      ]);
    },
    [getToken]
  );

  const clearItems = useCallback((): void => {
    if (items.length === 0) return;
    Alert.alert('전체 삭제', '모든 즐겨찾기를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              const token = await getToken();
              if (!token) throw new Error('로그인이 필요합니다.');
              await Promise.all(
                items.map((item) => removeFromWishlist(token, item.productType, item.productId))
              );
              setItems([]);
            } catch {
              Alert.alert('삭제하지 못했어요', '네트워크 연결을 확인한 뒤 다시 시도해주세요.');
              void loadWishlist();
            }
          })();
        },
      },
    ]);
  }, [getToken, items, loadWishlist]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<ProductType, number>> = {};
    items.forEach((item) => {
      counts[item.productType] = (counts[item.productType] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  return { items, isLoading, error, typeCounts, loadWishlist, removeItem, clearItems };
}
