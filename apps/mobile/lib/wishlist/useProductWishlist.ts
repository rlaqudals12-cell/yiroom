import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import type { ProductType } from '@/types/product';

import { addToWishlist, isInWishlist, removeFromWishlist } from './index';

export function useProductWishlist(
  productId: string | undefined,
  productType: ProductType
): {
  isWishlisted: boolean;
  isUpdating: boolean;
  toggle: () => Promise<void>;
} {
  const { getToken, isSignedIn } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [checkedKey, setCheckedKey] = useState<string | null>(null);
  const checkKey = useMemo(
    () => (productId && isSignedIn ? `${productType}:${productId}` : null),
    [isSignedIn, productId, productType]
  );
  const isChecking = checkKey !== null && checkedKey !== checkKey;

  useEffect(() => {
    let active = true;
    if (!productId || !checkKey) {
      setIsWishlisted(false);
      setCheckedKey(null);
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const saved = await isInWishlist(token, productType, productId);
        if (active) {
          setIsWishlisted(saved);
          setCheckedKey(checkKey);
        }
      } catch {
        // 왜: 조회 실패를 미저장으로 확정하지 않고 현재 화면의 기본 상태만 유지한다.
        if (active) setCheckedKey(checkKey);
      }
    })();

    return () => {
      active = false;
    };
  }, [checkKey, getToken, productId, productType]);

  const toggle = useCallback(async (): Promise<void> => {
    if (!productId || isUpdating || isChecking) return;
    const token = await getToken();
    if (!token) {
      Alert.alert('로그인이 필요해요', '제품을 찜하려면 먼저 로그인해주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(token, productType, productId);
        setIsWishlisted(false);
      } else {
        await addToWishlist(token, { productType, productId });
        setIsWishlisted(true);
      }
    } catch {
      Alert.alert('저장하지 못했어요', '네트워크 연결을 확인한 뒤 다시 시도해주세요.');
    } finally {
      setIsUpdating(false);
    }
  }, [getToken, isChecking, isUpdating, isWishlisted, productId, productType]);

  return { isWishlisted, isUpdating: isUpdating || isChecking, toggle };
}
