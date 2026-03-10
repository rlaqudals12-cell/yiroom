/**
 * 사용자 피드백 Repository
 * @description 구매 후기, 사이즈 피드백, 추천 평가 관리
 */

import { supabase } from '@/lib/supabase/client';
import { smartMatchingLogger } from '@/lib/utils/logger';
import type {
  UserFeedback,
  UserFeedbackDB,
  FeedbackType,
  SizeFit,
  ColorAccuracy,
} from '@/types/smart-matching';
import { mapFeedbackRow } from '@/types/smart-matching';

/**
 * 사용자의 피드백 목록 조회
 */
export async function getFeedbackList(
  clerkUserId: string,
  options?: {
    type?: FeedbackType;
    productId?: string;
    limit?: number;
  }
): Promise<UserFeedback[]> {
  let query = supabase.from('user_feedback').select('*').eq('clerk_user_id', clerkUserId);

  if (options?.type) {
    query = query.eq('feedback_type', options.type);
  }

  if (options?.productId) {
    query = query.eq('product_id', options.productId);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as UserFeedbackDB[]).map(mapFeedbackRow);
}

/**
 * 특정 피드백 조회
 */
export async function getFeedback(feedbackId: string): Promise<UserFeedback | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('id', feedbackId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapFeedbackRow(data as UserFeedbackDB);
}

/**
 * 피드백 생성
 */
export async function createFeedback(input: {
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
}): Promise<UserFeedback | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .insert({
      clerk_user_id: input.clerkUserId,
      feedback_type: input.feedbackType,
      product_id: input.productId ?? null,
      recommendation_id: input.recommendationId ?? null,
      rating: input.rating ?? null,
      size_fit: input.sizeFit ?? null,
      color_accuracy: input.colorAccuracy ?? null,
      would_recommend: input.wouldRecommend ?? null,
      comment: input.comment ?? null,
      pros: input.pros ?? null,
      cons: input.cons ?? null,
      photos: input.photos ?? null,
    })
    .select()
    .single();

  if (error) {
    smartMatchingLogger.error('피드백 생성 실패:', error);
    return null;
  }

  return mapFeedbackRow(data as UserFeedbackDB);
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
  }>
): Promise<boolean> {
  const updateData: Record<string, unknown> = {};

  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.sizeFit !== undefined) updateData.size_fit = updates.sizeFit;
  if (updates.colorAccuracy !== undefined) updateData.color_accuracy = updates.colorAccuracy;
  if (updates.wouldRecommend !== undefined) updateData.would_recommend = updates.wouldRecommend;
  if (updates.comment !== undefined) updateData.comment = updates.comment;
  if (updates.pros !== undefined) updateData.pros = updates.pros;
  if (updates.cons !== undefined) updateData.cons = updates.cons;
  if (updates.photos !== undefined) updateData.photos = updates.photos;

  const { error } = await supabase.from('user_feedback').update(updateData).eq('id', feedbackId);

  if (error) {
    smartMatchingLogger.error('피드백 업데이트 실패:', error);
    return false;
  }

  return true;
}

/**
 * 피드백 삭제
 */
export async function deleteFeedback(feedbackId: string): Promise<boolean> {
  const { error } = await supabase.from('user_feedback').delete().eq('id', feedbackId);

  if (error) {
    smartMatchingLogger.error('피드백 삭제 실패:', error);
    return false;
  }

  return true;
}

/**
 * 제품별 평균 평점 조회
 */
export async function getProductAverageRating(productId: string): Promise<{
  averageRating: number;
  totalCount: number;
} | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('rating')
    .eq('product_id', productId)
    .eq('feedback_type', 'purchase_review')
    .not('rating', 'is', null);

  if (error || !data || data.length === 0) {
    return null;
  }

  const ratings = data.map((d) => d.rating as number);
  const sum = ratings.reduce((a, b) => a + b, 0);

  return {
    averageRating: sum / ratings.length,
    totalCount: ratings.length,
  };
}

/**
 * 제품별 사이즈 핏 통계 조회
 */
export async function getProductSizeFitStats(productId: string): Promise<{
  small: number;
  perfect: number;
  large: number;
  total: number;
} | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('size_fit')
    .eq('product_id', productId)
    .eq('feedback_type', 'size_feedback')
    .not('size_fit', 'is', null);

  if (error || !data || data.length === 0) {
    return null;
  }

  const stats = {
    small: 0,
    perfect: 0,
    large: 0,
    total: data.length,
  };

  data.forEach((d) => {
    if (d.size_fit === 'small') stats.small++;
    else if (d.size_fit === 'perfect') stats.perfect++;
    else if (d.size_fit === 'large') stats.large++;
  });

  return stats;
}

/**
 * 추천 정확도 통계 조회
 */
export async function getRecommendationAccuracy(clerkUserId: string): Promise<{
  totalRecommendations: number;
  positiveRatings: number;
  accuracyPercent: number;
} | null> {
  const { data, error } = await supabase
    .from('user_feedback')
    .select('rating, would_recommend')
    .eq('clerk_user_id', clerkUserId)
    .eq('feedback_type', 'match_feedback');

  if (error || !data || data.length === 0) {
    return null;
  }

  const positive = data.filter(
    (d) => d.would_recommend === true || (d.rating && d.rating >= 4)
  ).length;

  return {
    totalRecommendations: data.length,
    positiveRatings: positive,
    accuracyPercent: (positive / data.length) * 100,
  };
}
