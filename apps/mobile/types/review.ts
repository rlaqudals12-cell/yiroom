/**
 * Product Review TypeScript 타입 정의
 * @description 사용자 리뷰 시스템 타입
 * @version 1.0
 * @date 2025-12-19
 */

// ================================================
// 리뷰 타입
// ================================================

/** 제품 타입 (리뷰용) */
export type ReviewProductType = 'cosmetic' | 'supplement' | 'equipment' | 'healthfood';

/** 별점 타입 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/** 리뷰 정렬 옵션 */
export type ReviewSortBy = 'recent' | 'helpful' | 'rating_high' | 'rating_low';

/** 제품 리뷰 */
export interface ProductReview {
  id: string;
  clerkUserId: string;
  productType: ReviewProductType;
  productId: string;
  rating: Rating;
  title?: string;
  content?: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;

  // 조인 데이터 (Clerk 사용자 정보)
  user?: {
    name: string;
    profileImageUrl?: string;
  };

  // 현재 사용자가 도움됨 표시했는지
  isHelpfulByMe?: boolean;
}

/** 리뷰 작성 입력 */
export interface CreateReviewInput {
  productType: ReviewProductType;
  productId: string;
  rating: Rating;
  title?: string;
  content?: string;
}

/** 리뷰 수정 입력 */
export interface UpdateReviewInput {
  rating?: Rating;
  title?: string;
  content?: string;
}

/** 리뷰 요약 (평균, 분포) */
export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/** 리뷰 조회 옵션 */
export interface ReviewQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: ReviewSortBy;
}

// ================================================
// Supabase 테이블 Row 타입
// ================================================

/** product_reviews 테이블 row */
export interface ProductReviewRow {
  id: string;
  clerk_user_id: string;
  product_type: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

/** review_helpful 테이블 row */
export interface ReviewHelpfulRow {
  id: string;
  review_id: string;
  clerk_user_id: string;
  created_at: string;
}

// ================================================
// 변환 함수
// ================================================

/** DB row → 프론트엔드 타입 변환 */
export function toProductReview(
  row: ProductReviewRow,
  user?: { name: string; profileImageUrl?: string },
  isHelpfulByMe?: boolean
): ProductReview {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    productType: row.product_type as ReviewProductType,
    productId: row.product_id,
    rating: row.rating as Rating,
    title: row.title ?? undefined,
    content: row.content ?? undefined,
    helpfulCount: row.helpful_count,
    verifiedPurchase: row.verified_purchase,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user,
    isHelpfulByMe,
  };
}

/** 리뷰 요약 계산 */
export function calculateReviewSummary(reviews: ProductReview[]): ReviewSummary {
  const totalCount = reviews.length;

  if (totalCount === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  for (const review of reviews) {
    totalRating += review.rating;
    ratingDistribution[review.rating]++;
  }

  return {
    averageRating: Math.round((totalRating / totalCount) * 10) / 10,
    totalCount,
    ratingDistribution,
  };
}
