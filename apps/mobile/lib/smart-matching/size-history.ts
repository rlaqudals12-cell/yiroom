/**
 * 사이즈 기록 API 클라이언트
 * @description 브랜드별 사이즈 구매/착용 기록 관리를 웹 정본 API에 위임
 */

import type { UserSizeHistory, SizeFit } from '@/types/smart-matching';

import { requestSmartMatching } from './api-client';

type SerializedSizeHistory = Omit<UserSizeHistory, 'purchaseDate' | 'createdAt'> & {
  purchaseDate?: string;
  createdAt: string;
};

function toSizeHistory(payload: SerializedSizeHistory): UserSizeHistory {
  return {
    ...payload,
    purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : undefined,
    createdAt: new Date(payload.createdAt),
  };
}

async function fetchSizeHistory(query: string, clerkToken?: string): Promise<UserSizeHistory[]> {
  const payload = await requestSmartMatching<SerializedSizeHistory[]>(
    `/api/smart-matching/size-history${query}`,
    clerkToken,
    { method: 'GET' }
  );
  return payload.map(toSizeHistory);
}

/**
 * 사용자의 전체 사이즈 기록 조회
 */
export async function getSizeHistory(
  _clerkUserId: string,
  clerkToken?: string
): Promise<UserSizeHistory[]> {
  return fetchSizeHistory('', clerkToken);
}

/**
 * 브랜드별 사이즈 기록 조회
 */
export async function getSizeHistoryByBrand(
  _clerkUserId: string,
  brandId: string,
  clerkToken?: string
): Promise<UserSizeHistory[]> {
  return fetchSizeHistory(`?brandId=${encodeURIComponent(brandId)}`, clerkToken);
}

/**
 * 카테고리별 사이즈 기록 조회
 */
export async function getSizeHistoryByCategory(
  _clerkUserId: string,
  category: string,
  clerkToken?: string
): Promise<UserSizeHistory[]> {
  return fetchSizeHistory(`?category=${encodeURIComponent(category)}`, clerkToken);
}

/**
 * 사이즈 기록 추가
 */
export async function addSizeHistory(
  input: {
    clerkUserId: string;
    brandId: string;
    brandName: string;
    category: string;
    size: string;
    fit?: SizeFit;
    productId?: string;
    purchaseDate?: Date;
  },
  clerkToken?: string
): Promise<UserSizeHistory | null> {
  const payload = await requestSmartMatching<SerializedSizeHistory>(
    '/api/smart-matching/size-history',
    clerkToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        clerkUserId: undefined,
        purchaseDate: input.purchaseDate?.toISOString(),
      }),
    }
  );
  return toSizeHistory(payload);
}

/**
 * 사이즈 핏 피드백 업데이트
 */
export async function updateSizeFit(
  historyId: string,
  fit: SizeFit,
  clerkToken?: string
): Promise<boolean> {
  const payload = await requestSmartMatching<{ success: boolean }>(
    `/api/smart-matching/size-history/${encodeURIComponent(historyId)}`,
    clerkToken,
    { method: 'PATCH', body: JSON.stringify({ fit }) }
  );
  return payload.success;
}

/**
 * 사이즈 기록 삭제
 */
export async function deleteSizeHistory(historyId: string, clerkToken?: string): Promise<boolean> {
  const payload = await requestSmartMatching<{ success: boolean }>(
    `/api/smart-matching/size-history/${encodeURIComponent(historyId)}`,
    clerkToken,
    { method: 'DELETE' }
  );
  return payload.success;
}

/**
 * 브랜드별 가장 최근 사이즈 조회
 * @description 사이즈 추천에 활용
 */
export async function getLatestSizeByBrand(
  clerkUserId: string,
  brandId: string,
  category: string,
  clerkToken?: string
): Promise<UserSizeHistory | null> {
  const history = await getSizeHistoryByBrand(clerkUserId, brandId, clerkToken);
  return history.find((item) => item.category === category) ?? null;
}

/**
 * 핏이 좋았던 사이즈 기록들 조회
 * @description 사이즈 추천 정확도 향상용
 */
export async function getPerfectFitHistory(
  clerkUserId: string,
  category?: string,
  clerkToken?: string
): Promise<UserSizeHistory[]> {
  const history = category
    ? await getSizeHistoryByCategory(clerkUserId, category, clerkToken)
    : await getSizeHistory(clerkUserId, clerkToken);
  return history.filter((item) => item.fit === 'perfect');
}
