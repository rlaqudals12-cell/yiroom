/**
 * 어필리에이트 유틸리티 함수
 * @description 가격 포맷, 시즌 라벨, 매칭 점수 계산
 */

import type { AffiliateProduct } from './types';

/**
 * 가격 포맷 (한국 원화)
 */
export function formatPrice(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`;
}

/**
 * 퍼스널 컬러 시즌 라벨
 */
export function getSeasonLabel(season: string): string {
  const labels: Record<string, string> = {
    Spring: '봄 웜톤',
    Summer: '여름 쿨톤',
    Autumn: '가을 웜톤',
    Winter: '겨울 쿨톤',
    spring_warm: '봄 웜톤',
    summer_cool: '여름 쿨톤',
    autumn_warm: '가을 웜톤',
    winter_cool: '겨울 쿨톤',
  };
  return labels[season] || season;
}

/**
 * 카테고리 라벨
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    skincare: '스킨케어',
    makeup: '메이크업',
    supplement: '영양제',
    equipment: '운동용품',
    all: '전체',
  };
  return labels[category] || category;
}

/**
 * 카테고리 이모지
 */
export function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    skincare: '🧴',
    makeup: '💄',
    supplement: '💊',
    equipment: '🏋️',
  };
  return emojis[category] || '📦';
}

/**
 * 피부 타입 기반 매칭 점수 계산
 */
export function calculateSkinMatchScore(
  product: Pick<AffiliateProduct, 'skinTypes'>,
  userSkinType: string | undefined
): number {
  if (!userSkinType || !product.skinTypes) return 0;
  return product.skinTypes.includes(
    userSkinType as 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal'
  )
    ? 15
    : 0;
}

/**
 * 퍼스널 컬러 기반 매칭 점수 계산
 */
export function calculateColorMatchScore(
  product: Pick<AffiliateProduct, 'personalColors'>,
  userSeason: string | undefined
): number {
  if (!userSeason || !product.personalColors) return 0;

  const seasonMap: Record<string, string> = {
    Spring: 'spring_warm',
    Summer: 'summer_cool',
    Autumn: 'autumn_warm',
    Winter: 'winter_cool',
  };

  const colorKey = seasonMap[userSeason] || userSeason;
  return product.personalColors.includes(
    colorKey as 'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool'
  )
    ? 15
    : 0;
}

/**
 * 평점 기반 보너스 점수
 */
export function calculateRatingBonus(rating: number | undefined): number {
  if (!rating) return 0;
  return rating >= 4.5 ? 5 : 0;
}

/**
 * 제품 종합 매칭 점수 계산
 * 기본 점수 70점 + 피부 타입 15점 + 퍼스널 컬러 15점 + 평점 5점 = 최대 100점
 */
export function calculateProductMatchScore(
  product: Pick<AffiliateProduct, 'skinTypes' | 'personalColors' | 'rating'>,
  userSkinType?: string,
  userSeason?: string
): number {
  const baseScore = 70;
  const skinBonus = calculateSkinMatchScore(product, userSkinType);
  const colorBonus = calculateColorMatchScore(product, userSeason);
  const ratingBonus = calculateRatingBonus(product.rating);

  return Math.min(baseScore + skinBonus + colorBonus + ratingBonus, 100);
}

/**
 * 할인율 계산
 */
export function calculateDiscountRate(
  originalPrice: number | undefined,
  currentPrice: number
): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * 제품 정렬
 */
export function sortProducts<
  T extends { matchScore?: number; rating?: number; price?: number },
>(
  products: T[],
  sortBy: 'match' | 'rating' | 'price_asc' | 'price_desc' = 'match'
): T[] {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'match':
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'price_asc':
        return (a.price ?? 0) - (b.price ?? 0);
      case 'price_desc':
        return (b.price ?? 0) - (a.price ?? 0);
      default:
        return 0;
    }
  });
}
