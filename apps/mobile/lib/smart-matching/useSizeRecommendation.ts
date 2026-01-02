/**
 * 사이즈 추천 훅
 * 제품 상세 페이지에서 사용자 맞춤 사이즈 추천 제공
 */

import { useAuth } from '@clerk/clerk-expo';
import { useState, useEffect, useCallback } from 'react';

import {
  getSizeRecommendation,
  getConfidenceLabel,
  getBasisDescription,
  type SizeRecommendation,
  type ClothingCategory,
} from './index';

interface UseSizeRecommendationParams {
  brandId: string;
  brandName: string;
  category: ClothingCategory;
  productId?: string;
  enabled?: boolean;
}

interface UseSizeRecommendationResult {
  recommendation: SizeRecommendation | null;
  isLoading: boolean;
  error: string | null;
  confidenceLabel: { label: string; color: 'green' | 'yellow' | 'gray' } | null;
  basisDescription: string;
  refetch: () => Promise<void>;
}

/**
 * 사이즈 추천 훅
 * @param params 추천 요청 파라미터
 * @returns 추천 결과 및 상태
 */
export function useSizeRecommendation({
  brandId,
  brandName,
  category,
  productId,
  enabled = true,
}: UseSizeRecommendationParams): UseSizeRecommendationResult {
  const { getToken, isSignedIn } = useAuth();
  const [recommendation, setRecommendation] =
    useState<SizeRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = useCallback(async () => {
    if (!enabled || !isSignedIn || !brandId || !brandName || !category) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('인증 토큰을 가져올 수 없습니다.');
        return;
      }

      const result = await getSizeRecommendation(token, {
        brandId,
        brandName,
        category,
        productId,
      });

      setRecommendation(result);
    } catch (err) {
      console.error('[Mobile] SizeRecommendation error:', err);
      setError(
        err instanceof Error ? err.message : '사이즈 추천을 불러올 수 없습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isSignedIn, brandId, brandName, category, productId, getToken]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  const confidenceLabel = recommendation
    ? getConfidenceLabel(recommendation.confidence)
    : null;

  const basisDescription = recommendation
    ? getBasisDescription(recommendation.basis)
    : '';

  return {
    recommendation,
    isLoading,
    error,
    confidenceLabel,
    basisDescription,
    refetch: fetchRecommendation,
  };
}

/**
 * Mock 사이즈 추천 (오프라인/테스트용)
 */
export function getMockSizeRecommendation(
  _category: ClothingCategory
): SizeRecommendation {
  return {
    recommendedSize: 'M',
    confidence: 40,
    basis: 'general',
    alternatives: [
      { size: 'S', note: '타이트한 핏을 선호하시면' },
      { size: 'L', note: '여유로운 핏을 선호하시면' },
    ],
    brandInfo: {
      sizeNote: '오프라인 모드: 일반 추정',
    },
  };
}
