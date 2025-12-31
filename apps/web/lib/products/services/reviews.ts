/**
 * 제품 리뷰 Service
 * @description 리뷰 CRUD + 도움됨 기능 + 요약 통계
 */

import { supabase } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { productLogger } from '@/lib/utils/logger';
import type {
  ProductReview,
  ProductReviewRow,
  ReviewSummary,
  ReviewQueryOptions,
  ReviewProductType,
  CreateReviewInput,
  UpdateReviewInput,
  Rating,
} from '@/types/review';

// ================================================
// 읽기 함수 (공개)
// ================================================

/**
 * 제품별 리뷰 목록 조회
 * @param productType 제품 타입
 * @param productId 제품 ID
 * @param options 조회 옵션
 * @param currentUserId 현재 로그인 사용자 ID (도움됨 표시 확인용)
 */
export async function getProductReviews(
  productType: ReviewProductType,
  productId: string,
  options?: ReviewQueryOptions,
  currentUserId?: string
): Promise<ProductReview[]> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const sortBy = options?.sortBy ?? 'recent';

  // 정렬 컬럼 결정
  let orderColumn: string;
  let ascending = false;
  switch (sortBy) {
    case 'helpful':
      orderColumn = 'helpful_count';
      break;
    case 'rating_high':
      orderColumn = 'rating';
      break;
    case 'rating_low':
      orderColumn = 'rating';
      ascending = true;
      break;
    case 'recent':
    default:
      orderColumn = 'created_at';
      break;
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_type', productType)
    .eq('product_id', productId)
    .order(orderColumn, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    productLogger.error('리뷰 Failed to fetch reviews:', error);
    return [];
  }

  const reviews = data as ProductReviewRow[];

  // 현재 사용자의 도움됨 표시 확인
  let helpfulReviewIds: Set<string> = new Set();
  if (currentUserId && reviews.length > 0) {
    const reviewIds = reviews.map((r) => r.id);
    const { data: helpfulData } = await supabase
      .from('review_helpful')
      .select('review_id')
      .eq('clerk_user_id', currentUserId)
      .in('review_id', reviewIds);

    if (helpfulData) {
      helpfulReviewIds = new Set(helpfulData.map((h) => h.review_id));
    }
  }

  return reviews.map((row) => mapReviewRow(row, helpfulReviewIds.has(row.id)));
}

/**
 * 제품별 리뷰 요약 조회 (평균 별점, 분포)
 * @param productType 제품 타입
 * @param productId 제품 ID
 */
export async function getReviewSummary(
  productType: ReviewProductType,
  productId: string
): Promise<ReviewSummary> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('rating')
    .eq('product_type', productType)
    .eq('product_id', productId);

  if (error || !data) {
    productLogger.error('리뷰 Failed to fetch review summary:', error);
    return {
      averageRating: 0,
      totalCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const ratings = data.map((r) => r.rating as Rating);
  const totalCount = ratings.length;

  if (totalCount === 0) {
    return {
      averageRating: 0,
      totalCount: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const ratingDistribution: ReviewSummary['ratingDistribution'] = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };
  let totalRating = 0;

  for (const rating of ratings) {
    totalRating += rating;
    ratingDistribution[rating as keyof typeof ratingDistribution]++;
  }

  return {
    averageRating: Math.round((totalRating / totalCount) * 10) / 10,
    totalCount,
    ratingDistribution,
  };
}

/**
 * 사용자가 특정 제품에 리뷰를 작성했는지 확인
 * @param productType 제품 타입
 * @param productId 제품 ID
 * @param clerkUserId 사용자 ID
 */
export async function hasUserReviewed(
  productType: ReviewProductType,
  productId: string,
  clerkUserId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('product_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('product_type', productType)
    .eq('product_id', productId)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    productLogger.error('리뷰 Failed to check user review:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * 사용자의 리뷰 목록 조회
 * @param clerkUserId 사용자 ID
 * @param limit 최대 개수
 */
export async function getUserReviews(clerkUserId: string, limit = 20): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    productLogger.error('리뷰 Failed to fetch user reviews:', error);
    return [];
  }

  return (data as ProductReviewRow[]).map((row) => mapReviewRow(row));
}

// ================================================
// 쓰기 함수 (인증 필요 - Server Actions에서 호출)
// ================================================

/**
 * 리뷰 작성
 * 주의: 이 함수는 RLS가 적용된 클라이언트로 호출해야 함
 * @param supabaseClient 인증된 Supabase 클라이언트
 * @param clerkUserId 사용자 ID
 * @param input 리뷰 입력
 */
export async function createReview(
  supabaseClient: SupabaseClient,
  clerkUserId: string,
  input: CreateReviewInput
): Promise<ProductReview | null> {
  const { data, error } = await supabaseClient
    .from('product_reviews')
    .insert({
      clerk_user_id: clerkUserId,
      product_type: input.productType,
      product_id: input.productId,
      rating: input.rating,
      title: input.title ?? null,
      content: input.content ?? null,
    })
    .select()
    .single();

  if (error) {
    productLogger.error('리뷰 Failed to create review:', error);
    return null;
  }

  return mapReviewRow(data as ProductReviewRow);
}

/**
 * 리뷰 수정
 * 주의: 이 함수는 RLS가 적용된 클라이언트로 호출해야 함
 * @param supabaseClient 인증된 Supabase 클라이언트
 * @param reviewId 리뷰 ID
 * @param updates 수정 내용
 */
export async function updateReview(
  supabaseClient: SupabaseClient,
  reviewId: string,
  updates: UpdateReviewInput
): Promise<ProductReview | null> {
  const updateData: Record<string, unknown> = {};
  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.title !== undefined) updateData.title = updates.title || null;
  if (updates.content !== undefined) updateData.content = updates.content || null;

  const { data, error } = await supabaseClient
    .from('product_reviews')
    .update(updateData)
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    productLogger.error('리뷰 Failed to update review:', error);
    return null;
  }

  return mapReviewRow(data as ProductReviewRow);
}

/**
 * 리뷰 삭제
 * 주의: 이 함수는 RLS가 적용된 클라이언트로 호출해야 함
 * @param supabaseClient 인증된 Supabase 클라이언트
 * @param reviewId 리뷰 ID
 */
export async function deleteReview(
  supabaseClient: SupabaseClient,
  reviewId: string
): Promise<boolean> {
  const { error } = await supabaseClient.from('product_reviews').delete().eq('id', reviewId);

  if (error) {
    productLogger.error('리뷰 Failed to delete review:', error);
    return false;
  }

  return true;
}

/**
 * 리뷰 도움됨 표시/해제
 * 주의: 이 함수는 RLS가 적용된 클라이언트로 호출해야 함
 * @param supabaseClient 인증된 Supabase 클라이언트
 * @param reviewId 리뷰 ID
 * @param clerkUserId 사용자 ID
 * @param isHelpful true면 도움됨 추가, false면 제거
 */
export async function toggleReviewHelpful(
  supabaseClient: SupabaseClient,
  reviewId: string,
  clerkUserId: string,
  isHelpful: boolean
): Promise<boolean> {
  if (isHelpful) {
    // 도움됨 추가
    const { error } = await supabaseClient.from('review_helpful').insert({
      review_id: reviewId,
      clerk_user_id: clerkUserId,
    });

    if (error) {
      // 이미 존재하는 경우 무시
      if (error.code === '23505') {
        return true;
      }
      productLogger.error('리뷰 Failed to mark helpful:', error);
      return false;
    }
  } else {
    // 도움됨 제거
    const { error } = await supabaseClient
      .from('review_helpful')
      .delete()
      .eq('review_id', reviewId)
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      productLogger.error('리뷰 Failed to unmark helpful:', error);
      return false;
    }
  }

  return true;
}

// ================================================
// 유틸리티 함수
// ================================================

/**
 * DB row → ProductReview 변환
 */
function mapReviewRow(row: ProductReviewRow, isHelpfulByMe = false): ProductReview {
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
    isHelpfulByMe,
  };
}

/**
 * 별점 텍스트 변환
 */
export function getRatingText(rating: Rating): string {
  switch (rating) {
    case 5:
      return '최고예요';
    case 4:
      return '좋아요';
    case 3:
      return '보통이에요';
    case 2:
      return '별로예요';
    case 1:
      return '최악이에요';
    default:
      return '';
  }
}

/**
 * 별점 색상 클래스
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-500';
  if (rating >= 3.5) return 'text-blue-500';
  if (rating >= 2.5) return 'text-yellow-500';
  if (rating >= 1.5) return 'text-orange-500';
  return 'text-red-500';
}
