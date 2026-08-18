/**
 * 사용자 피드백 API 클라이언트
 * @description 구매 후기, 사이즈 피드백, 추천 평가 관리를 웹 정본 API에 위임
 */

import type { UserFeedback, FeedbackType, SizeFit, ColorAccuracy } from '@/types/smart-matching';

import { missingSmartMatchingApi, requestSmartMatching } from './api-client';

type SerializedFeedback = Omit<UserFeedback, 'createdAt'> & { createdAt: string };

function toFeedback(payload: SerializedFeedback): UserFeedback {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
  };
}

/**
 * 사용자의 피드백 목록 조회
 */
export async function getFeedbackList(
  _clerkUserId: string,
  options?: {
    type?: FeedbackType;
    productId?: string;
    limit?: number;
  },
  clerkToken?: string
): Promise<UserFeedback[]> {
  const query = new URLSearchParams();
  if (options?.type) query.set('type', options.type);
  if (options?.productId) query.set('productId', options.productId);
  const queryString = query.toString();
  const suffix = queryString ? `?${queryString}` : '';

  const payload = await requestSmartMatching<SerializedFeedback[]>(
    `/api/smart-matching/feedback${suffix}`,
    clerkToken,
    { method: 'GET' }
  );
  const feedback = payload.map(toFeedback);
  return options?.limit ? feedback.slice(0, options.limit) : feedback;
}

/**
 * 특정 피드백 조회
 */
export async function getFeedback(
  _feedbackId: string,
  _clerkToken?: string
): Promise<UserFeedback | null> {
  return missingSmartMatchingApi('개별 피드백 조회');
}

/**
 * 피드백 생성
 */
export async function createFeedback(
  input: {
    clerkUserId: string;
    feedbackType: FeedbackType;
    productId?: string;
    recommendationId?: string;
    rating?: number;
    sizeFit?: SizeFit;
    colorAccuracy?: ColorAccuracy;
    wouldRecommend?: boolean;
    comment?: string;
    pros?: string[];
    cons?: string[];
    photos?: string[];
  },
  clerkToken?: string
): Promise<UserFeedback | null> {
  const payload = await requestSmartMatching<SerializedFeedback>(
    '/api/smart-matching/feedback',
    clerkToken,
    {
      method: 'POST',
      body: JSON.stringify({ ...input, clerkUserId: undefined }),
    }
  );
  return toFeedback(payload);
}

/**
 * 피드백 업데이트
 */
export async function updateFeedback(
  feedbackId: string,
  updates: Partial<{
    rating: number;
    sizeFit: SizeFit;
    colorAccuracy: ColorAccuracy;
    wouldRecommend: boolean;
    comment: string;
    pros: string[];
    cons: string[];
    photos: string[];
  }>,
  clerkToken?: string
): Promise<boolean> {
  const payload = await requestSmartMatching<{ success: boolean }>(
    `/api/smart-matching/feedback/${encodeURIComponent(feedbackId)}`,
    clerkToken,
    { method: 'PATCH', body: JSON.stringify(updates) }
  );
  return payload.success;
}

/**
 * 피드백 삭제
 */
export async function deleteFeedback(feedbackId: string, clerkToken?: string): Promise<boolean> {
  const payload = await requestSmartMatching<{ success: boolean }>(
    `/api/smart-matching/feedback/${encodeURIComponent(feedbackId)}`,
    clerkToken,
    { method: 'DELETE' }
  );
  return payload.success;
}

/**
 * 제품별 평균 평점 조회
 */
export async function getProductAverageRating(
  _productId: string,
  _clerkToken?: string
): Promise<{
  averageRating: number;
  totalCount: number;
} | null> {
  return missingSmartMatchingApi('제품 전체 평균 평점 조회');
}

/**
 * 제품별 사이즈 핏 통계 조회
 */
export async function getProductSizeFitStats(
  _productId: string,
  _clerkToken?: string
): Promise<{
  small: number;
  perfect: number;
  large: number;
  total: number;
} | null> {
  return missingSmartMatchingApi('제품 전체 사이즈 핏 통계 조회');
}

/**
 * 추천 정확도 통계 조회
 */
export async function getRecommendationAccuracy(
  _clerkUserId: string,
  clerkToken?: string
): Promise<{
  totalRecommendations: number;
  positiveRatings: number;
  accuracyPercent: number;
} | null> {
  const payload = await requestSmartMatching<{
    accuracy: {
      totalRecommendations: number;
      positiveRatings: number;
      accuracyPercent: number;
    } | null;
  }>('/api/smart-matching/feedback?stats=true', clerkToken, { method: 'GET' });
  return payload.accuracy;
}
