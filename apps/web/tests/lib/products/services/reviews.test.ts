/**
 * Sprint 1: 리뷰 시스템 테스트
 * @description 리뷰 서비스 및 타입 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import { getRatingText, getRatingColor } from '@/lib/products/services/reviews';
import {
  toProductReview,
  calculateReviewSummary,
  type ProductReviewRow,
  type ProductReview,
  type Rating,
} from '@/types/review';

// ================================================
// getRatingText 테스트
// ================================================

describe('getRatingText', () => {
  it('별점 5점은 "최고예요"를 반환', () => {
    expect(getRatingText(5)).toBe('최고예요');
  });

  it('별점 4점은 "좋아요"를 반환', () => {
    expect(getRatingText(4)).toBe('좋아요');
  });

  it('별점 3점은 "보통이에요"를 반환', () => {
    expect(getRatingText(3)).toBe('보통이에요');
  });

  it('별점 2점은 "별로예요"를 반환', () => {
    expect(getRatingText(2)).toBe('별로예요');
  });

  it('별점 1점은 "최악이에요"를 반환', () => {
    expect(getRatingText(1)).toBe('최악이에요');
  });
});

// ================================================
// getRatingColor 테스트
// ================================================

describe('getRatingColor', () => {
  it('4.5 이상은 green-500 반환', () => {
    expect(getRatingColor(4.5)).toBe('text-green-500');
    expect(getRatingColor(5)).toBe('text-green-500');
  });

  it('3.5~4.4는 blue-500 반환', () => {
    expect(getRatingColor(3.5)).toBe('text-blue-500');
    expect(getRatingColor(4.4)).toBe('text-blue-500');
  });

  it('2.5~3.4는 yellow-500 반환', () => {
    expect(getRatingColor(2.5)).toBe('text-yellow-500');
    expect(getRatingColor(3.4)).toBe('text-yellow-500');
  });

  it('1.5~2.4는 orange-500 반환', () => {
    expect(getRatingColor(1.5)).toBe('text-orange-500');
    expect(getRatingColor(2.4)).toBe('text-orange-500');
  });

  it('1.5 미만은 red-500 반환', () => {
    expect(getRatingColor(1)).toBe('text-red-500');
    expect(getRatingColor(1.4)).toBe('text-red-500');
  });
});

// ================================================
// toProductReview 테스트
// ================================================

describe('toProductReview', () => {
  const mockRow: ProductReviewRow = {
    id: 'review-1',
    clerk_user_id: 'user-1',
    product_type: 'cosmetic',
    product_id: 'product-1',
    rating: 5,
    title: '좋은 제품',
    content: '피부에 잘 맞아요',
    helpful_count: 10,
    verified_purchase: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  it('DB row를 ProductReview로 변환', () => {
    const result = toProductReview(mockRow);

    expect(result.id).toBe('review-1');
    expect(result.clerkUserId).toBe('user-1');
    expect(result.productType).toBe('cosmetic');
    expect(result.productId).toBe('product-1');
    expect(result.rating).toBe(5);
    expect(result.title).toBe('좋은 제품');
    expect(result.content).toBe('피부에 잘 맞아요');
    expect(result.helpfulCount).toBe(10);
    expect(result.verifiedPurchase).toBe(true);
  });

  it('null 필드를 undefined로 변환', () => {
    const rowWithNulls: ProductReviewRow = {
      ...mockRow,
      title: null,
      content: null,
    };

    const result = toProductReview(rowWithNulls);

    expect(result.title).toBeUndefined();
    expect(result.content).toBeUndefined();
  });

  it('user 정보가 있으면 포함', () => {
    const user = { name: '홍길동', profileImageUrl: 'https://example.com/avatar.jpg' };
    const result = toProductReview(mockRow, user);

    expect(result.user).toEqual(user);
  });

  it('isHelpfulByMe 플래그 설정', () => {
    const result = toProductReview(mockRow, undefined, true);

    expect(result.isHelpfulByMe).toBe(true);
  });
});

// ================================================
// calculateReviewSummary 테스트
// ================================================

describe('calculateReviewSummary', () => {
  it('빈 리뷰 배열에서 0 반환', () => {
    const result = calculateReviewSummary([]);

    expect(result.averageRating).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.ratingDistribution).toEqual({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  });

  it('평균 별점 계산', () => {
    const reviews: ProductReview[] = [
      createMockReview(5),
      createMockReview(4),
      createMockReview(3),
    ];

    const result = calculateReviewSummary(reviews);

    expect(result.averageRating).toBe(4); // (5+4+3)/3 = 4
    expect(result.totalCount).toBe(3);
  });

  it('별점 분포 계산', () => {
    const reviews: ProductReview[] = [
      createMockReview(5),
      createMockReview(5),
      createMockReview(4),
      createMockReview(3),
      createMockReview(1),
    ];

    const result = calculateReviewSummary(reviews);

    expect(result.ratingDistribution).toEqual({
      5: 2,
      4: 1,
      3: 1,
      2: 0,
      1: 1,
    });
  });

  it('평균 별점 소수점 1자리로 반올림', () => {
    const reviews: ProductReview[] = [
      createMockReview(5),
      createMockReview(5),
      createMockReview(4),
    ];

    const result = calculateReviewSummary(reviews);

    // (5+5+4)/3 = 4.666... → 4.7
    expect(result.averageRating).toBe(4.7);
  });
});

// ================================================
// 헬퍼 함수
// ================================================

function createMockReview(rating: Rating): ProductReview {
  return {
    id: `review-${Math.random().toString(36).slice(2)}`,
    clerkUserId: 'user-1',
    productType: 'cosmetic',
    productId: 'product-1',
    rating,
    helpfulCount: 0,
    verifiedPurchase: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}
