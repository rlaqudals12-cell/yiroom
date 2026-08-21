/**
 * 인증 위시리스트 웹 API 클라이언트
 *
 * 모바일은 user_wishlists를 직접 읽거나 쓰지 않고 Clerk JWT를 웹 정본 API에 전달한다.
 */

import { missingSmartMatchingApi, requestSmartMatching } from '@/lib/smart-matching/api-client';
import type { ProductType } from '@/types/product';

export interface WishlistItem {
  id: string;
  clerkUserId: string;
  productType: ProductType;
  productId: string;
  createdAt: string;
  /** 웹 API가 실제 제품 테이블에서 확인한 경우에만 제공된다. */
  name?: string;
  brand?: string;
  priceKrw?: number;
}

export interface AddToWishlistInput {
  productType: ProductType;
  productId: string;
}

interface ApiEnvelope<T> {
  success: true;
  data: T;
}

export async function getWishlist(
  clerkToken: string,
  productType?: ProductType
): Promise<WishlistItem[]> {
  const query = productType ? `?productType=${encodeURIComponent(productType)}` : '';
  const payload = await requestSmartMatching<ApiEnvelope<{ items: WishlistItem[] }>>(
    `/api/wishlist${query}`,
    clerkToken,
    { method: 'GET' }
  );
  return payload.data.items;
}

export async function isInWishlist(
  clerkToken: string,
  productType: ProductType,
  productId: string
): Promise<boolean> {
  const query = new URLSearchParams({ productType, productId });
  const payload = await requestSmartMatching<ApiEnvelope<{ isWishlisted: boolean }>>(
    `/api/wishlist?${query.toString()}`,
    clerkToken,
    { method: 'GET' }
  );
  return payload.data.isWishlisted;
}

export async function getWishlistCount(clerkToken: string): Promise<number> {
  const items = await getWishlist(clerkToken);
  return items.length;
}

export async function addToWishlist(
  clerkToken: string,
  input: AddToWishlistInput
): Promise<boolean> {
  const payload = await requestSmartMatching<ApiEnvelope<{ isWishlisted: boolean }>>(
    '/api/wishlist',
    clerkToken,
    { method: 'POST', body: JSON.stringify(input) }
  );
  return payload.data.isWishlisted;
}

export async function removeFromWishlist(
  clerkToken: string,
  productType: ProductType,
  productId: string
): Promise<boolean> {
  const payload = await requestSmartMatching<ApiEnvelope<{ isWishlisted: boolean }>>(
    '/api/wishlist',
    clerkToken,
    {
      method: 'DELETE',
      body: JSON.stringify({ productType, productId }),
    }
  );
  return !payload.data.isWishlisted;
}

export async function toggleWishlist(
  clerkToken: string,
  productType: ProductType,
  productId: string
): Promise<boolean> {
  const current = await isInWishlist(clerkToken, productType, productId);
  if (current) {
    await removeFromWishlist(clerkToken, productType, productId);
    return false;
  }
  await addToWishlist(clerkToken, { productType, productId });
  return true;
}

/** 메모 필드는 DB/API 계약에 없으므로 로컬 성공으로 위장하지 않는다. */
export async function updateWishlistNote(): Promise<void> {
  return missingSmartMatchingApi('위시리스트 메모 저장');
}
