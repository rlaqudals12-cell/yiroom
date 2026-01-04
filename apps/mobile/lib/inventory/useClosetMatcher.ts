/**
 * 옷장 매칭 훅
 * 퍼스널컬러, 체형, 날씨 기반 코디 추천
 */

import { useCallback, useMemo } from 'react';

import type {
  BodyType3,
  PersonalColorSeason,
  MatchOptions,
  ClosetRecommendation,
  OutfitSuggestion,
  RecommendationSummary,
} from './closetMatcher';
import {
  recommendFromCloset,
  suggestOutfitFromCloset,
  getRecommendationSummary,
} from './closetMatcher';
import { useCloset } from './useInventory';

import type { ClothingCategory, InventoryItem } from './index';

interface UseClosetMatcherProps {
  personalColor?: PersonalColorSeason | null;
  bodyType?: BodyType3 | null;
}

interface UseClosetMatcherResult {
  /** 옷장 아이템 */
  items: InventoryItem[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 추천 요약 */
  summary: RecommendationSummary;
  /** 카테고리별 추천 가져오기 */
  getRecommendations: (
    options?: Partial<MatchOptions> & {
      category?: ClothingCategory;
      limit?: number;
    }
  ) => ClosetRecommendation[];
  /** 코디 조합 추천 */
  getOutfitSuggestion: (
    options?: Partial<MatchOptions>
  ) => OutfitSuggestion | null;
  /** 날씨 기반 추천 */
  getWeatherBasedRecommendations: (
    temp: number,
    category?: ClothingCategory
  ) => ClosetRecommendation[];
  /** 상황(TPO)별 추천 */
  getOccasionRecommendations: (
    occasion: 'casual' | 'formal' | 'workout' | 'date' | 'travel',
    category?: ClothingCategory
  ) => ClosetRecommendation[];
  /** 데이터 새로고침 */
  refetch: () => Promise<void>;
}

/**
 * 옷장 매칭 훅
 * 사용자의 퍼스널컬러와 체형을 기반으로 옷장에서 어울리는 아이템 추천
 */
export function useClosetMatcher(
  props?: UseClosetMatcherProps
): UseClosetMatcherResult {
  const { personalColor = null, bodyType = null } = props || {};
  const { items, isLoading, error, refetch } = useCloset();

  // 기본 매칭 옵션
  const baseOptions: MatchOptions = useMemo(
    () => ({
      personalColor,
      bodyType,
    }),
    [personalColor, bodyType]
  );

  // 추천 요약
  const summary = useMemo(() => {
    return getRecommendationSummary(items, baseOptions);
  }, [items, baseOptions]);

  // 카테고리별 추천
  const getRecommendations = useCallback(
    (
      options?: Partial<MatchOptions> & {
        category?: ClothingCategory;
        limit?: number;
      }
    ): ClosetRecommendation[] => {
      return recommendFromCloset(items, {
        ...baseOptions,
        ...options,
      });
    },
    [items, baseOptions]
  );

  // 코디 조합 추천
  const getOutfitSuggestion = useCallback(
    (options?: Partial<MatchOptions>): OutfitSuggestion | null => {
      return suggestOutfitFromCloset(items, {
        ...baseOptions,
        ...options,
      });
    },
    [items, baseOptions]
  );

  // 날씨 기반 추천
  const getWeatherBasedRecommendations = useCallback(
    (temp: number, category?: ClothingCategory): ClosetRecommendation[] => {
      return recommendFromCloset(items, {
        ...baseOptions,
        temp,
        category,
        limit: 5,
      });
    },
    [items, baseOptions]
  );

  // 상황별 추천
  const getOccasionRecommendations = useCallback(
    (
      occasion: 'casual' | 'formal' | 'workout' | 'date' | 'travel',
      category?: ClothingCategory
    ): ClosetRecommendation[] => {
      return recommendFromCloset(items, {
        ...baseOptions,
        occasion,
        category,
        limit: 5,
      });
    },
    [items, baseOptions]
  );

  return {
    items,
    isLoading,
    error,
    summary,
    getRecommendations,
    getOutfitSuggestion,
    getWeatherBasedRecommendations,
    getOccasionRecommendations,
    refetch,
  };
}

// Re-export types for convenience
export type {
  BodyType3,
  PersonalColorSeason,
  MatchOptions,
  ClosetRecommendation,
  OutfitSuggestion,
  RecommendationSummary,
};
