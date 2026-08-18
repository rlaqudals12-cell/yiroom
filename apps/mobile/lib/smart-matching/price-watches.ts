/**
 * 가격 모니터링 API 클라이언트
 * @description 가격 알림 관리를 웹 정본 API에 위임
 */

import type { PriceWatch, PriceHistory } from '@/types/smart-matching';

import { missingSmartMatchingApi, requestSmartMatching } from './api-client';

type SerializedPriceWatch = Omit<PriceWatch, 'notifiedAt' | 'createdAt' | 'expiresAt'> & {
  notifiedAt?: string;
  createdAt: string;
  expiresAt?: string;
};

function toPriceWatch(payload: SerializedPriceWatch): PriceWatch {
  return {
    ...payload,
    notifiedAt: payload.notifiedAt ? new Date(payload.notifiedAt) : undefined,
    createdAt: new Date(payload.createdAt),
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
  };
}

// ============================================
// 가격 알림
// ============================================

/**
 * 사용자의 가격 알림 목록 조회
 */
export async function getPriceWatches(
  _clerkUserId: string,
  clerkToken?: string
): Promise<PriceWatch[]> {
  const payload = await requestSmartMatching<SerializedPriceWatch[]>(
    '/api/smart-matching/price-watches',
    clerkToken,
    { method: 'GET' }
  );
  return payload.map(toPriceWatch);
}

/**
 * 제품별 가격 알림 조회
 */
export async function getPriceWatchByProduct(
  _clerkUserId: string,
  productId: string,
  clerkToken?: string
): Promise<PriceWatch | null> {
  const payload = await requestSmartMatching<SerializedPriceWatch | null>(
    `/api/smart-matching/price-watches?productId=${encodeURIComponent(productId)}`,
    clerkToken,
    { method: 'GET' }
  );
  return payload ? toPriceWatch(payload) : null;
}

/**
 * 가격 알림 생성
 */
export async function createPriceWatch(
  input: {
    clerkUserId: string;
    productId: string;
    targetPrice?: number;
    percentDrop?: number;
    platforms?: string[];
    expiresAt?: Date;
  },
  clerkToken?: string
): Promise<PriceWatch | null> {
  const payload = await requestSmartMatching<SerializedPriceWatch>(
    '/api/smart-matching/price-watches',
    clerkToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        clerkUserId: undefined,
        expiresAt: input.expiresAt?.toISOString(),
      }),
    }
  );
  return toPriceWatch(payload);
}

/**
 * 가격 알림 조건 업데이트
 */
export async function updatePriceWatch(
  watchId: string,
  updates: {
    targetPrice?: number;
    percentDrop?: number;
    platforms?: string[];
    expiresAt?: Date;
  },
  clerkToken?: string
): Promise<boolean> {
  const payload = await requestSmartMatching<{ success: boolean }>(
    `/api/smart-matching/price-watches/${encodeURIComponent(watchId)}`,
    clerkToken,
    {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        expiresAt: updates.expiresAt?.toISOString(),
      }),
    }
  );
  return payload.success;
}

/**
 * 현재 최저가 업데이트
 */
export async function updateCurrentPrice(
  _watchId: string,
  _lowestPrice: number,
  _platform: string,
  _clerkToken?: string
): Promise<boolean> {
  return missingSmartMatchingApi('가격 알림 최저가 갱신');
}

/**
 * 알림 발송 완료 처리
 */
export async function markAsNotified(_watchId: string, _clerkToken?: string): Promise<boolean> {
  return missingSmartMatchingApi('가격 알림 발송 완료 처리');
}

/**
 * 가격 알림 삭제
 */
export async function deletePriceWatch(watchId: string, clerkToken?: string): Promise<boolean> {
  const payload = await requestSmartMatching<{ success: boolean }>(
    `/api/smart-matching/price-watches/${encodeURIComponent(watchId)}`,
    clerkToken,
    { method: 'DELETE' }
  );
  return payload.success;
}

/**
 * 만료된 알림 정리
 */
export async function cleanupExpiredWatches(): Promise<number> {
  return missingSmartMatchingApi('만료 가격 알림 정리');
}

// ============================================
// 가격 히스토리
// ============================================

/**
 * 제품 가격 히스토리 조회
 */
export async function getPriceHistory(
  _productId: string,
  _options?: {
    platform?: string;
    days?: number;
    limit?: number;
  },
  _clerkToken?: string
): Promise<PriceHistory[]> {
  return missingSmartMatchingApi('가격 이력 조회');
}

/**
 * 가격 히스토리 기록
 */
export async function recordPrice(
  input: {
    productId: string;
    platform: string;
    price: number;
    originalPrice?: number;
  },
  _clerkToken?: string
): Promise<PriceHistory | null> {
  void input;
  return missingSmartMatchingApi('가격 이력 기록');
}

/**
 * 제품의 역대 최저가 조회
 */
export async function getLowestPrice(
  _productId: string,
  _platform?: string,
  _clerkToken?: string
): Promise<{ price: number; platform: string; recordedAt: Date } | null> {
  return missingSmartMatchingApi('역대 최저가 조회');
}

/**
 * 가격 변동률 계산
 */
export async function getPriceChangePercent(
  _productId: string,
  _days: number = 7,
  _clerkToken?: string
): Promise<number | null> {
  return missingSmartMatchingApi('가격 변동률 조회');
}
