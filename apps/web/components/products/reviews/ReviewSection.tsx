'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { ReviewSummary, ReviewSummarySkeleton } from './ReviewSummary';
import { ReviewList } from './ReviewList';
import { ReviewForm, ReviewPromptCard } from './ReviewForm';
import { ReviewAIKeywords, generateMockAISummary } from './ReviewAIKeywords';
import { ReviewSentimentFilter, type SentimentFilterType } from './ReviewSentimentFilter';
import { ReviewPointsBadge } from './ReviewPointsBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  getProductReviews,
  getReviewSummary,
  hasUserReviewed,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewHelpful,
} from '@/lib/products/services/reviews';
import type {
  ProductReview,
  ReviewSummary as ReviewSummaryType,
  ReviewSortBy,
  ReviewProductType,
  CreateReviewInput,
} from '@/types/review';
import { toast } from 'sonner';

interface ReviewSectionProps {
  /** 제품 타입 */
  productType: ReviewProductType;
  /** 제품 ID */
  productId: string;
  /** 추가 클래스 */
  className?: string;
}

const REVIEWS_PER_PAGE = 10;

export function ReviewSection({ productType, productId, className }: ReviewSectionProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // 상태
  const [summary, setSummary] = useState<ReviewSummaryType | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [sortBy, setSortBy] = useState<ReviewSortBy>('recent');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterType>('all');
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 리뷰 작성/수정 모달
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // 삭제 확인 다이얼로그
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI 요약 (Mock 데이터 - 추후 API 연동)
  const aiSummary = useMemo(() => {
    if (!summary || summary.totalCount < 5) return null;
    return generateMockAISummary(summary.totalCount);
  }, [summary]);

  // 감성별 리뷰 수 계산
  const sentimentCounts = useMemo(() => {
    return {
      all: reviews.length,
      positive: reviews.filter((r) => r.rating >= 4).length,
      negative: reviews.filter((r) => r.rating <= 2).length,
      withPhoto: 0, // 추후 사진 리뷰 지원 시 연동
    };
  }, [reviews]);

  // 감성 필터링된 리뷰
  const filteredReviews = useMemo(() => {
    if (sentimentFilter === 'all') return reviews;
    if (sentimentFilter === 'positive') return reviews.filter((r) => r.rating >= 4);
    if (sentimentFilter === 'negative') return reviews.filter((r) => r.rating <= 2);
    return reviews; // with_photo는 추후 지원
  }, [reviews, sentimentFilter]);

  // 초기 데이터 로드
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryData, reviewsData] = await Promise.all([
        getReviewSummary(productType, productId),
        getProductReviews(
          productType,
          productId,
          {
            limit: REVIEWS_PER_PAGE,
            sortBy,
          },
          user?.id
        ),
      ]);

      setSummary(summaryData);
      setReviews(reviewsData);
      setHasMore(reviewsData.length >= REVIEWS_PER_PAGE);

      // 사용자 리뷰 여부 확인
      if (user?.id) {
        const hasReviewed = await hasUserReviewed(productType, productId, user.id);
        setUserHasReviewed(hasReviewed);
      }
    } catch (error) {
      console.error('[ReviewSection] Failed to load reviews:', error);
      toast.error('리뷰를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [productType, productId, sortBy, user?.id]);

  useEffect(() => {
    if (isUserLoaded) {
      loadInitialData();
    }
  }, [loadInitialData, isUserLoaded]);

  // 정렬 변경
  const handleSortChange = async (newSort: ReviewSortBy) => {
    setSortBy(newSort);
    setIsLoading(true);
    try {
      const reviewsData = await getProductReviews(
        productType,
        productId,
        {
          limit: REVIEWS_PER_PAGE,
          sortBy: newSort,
        },
        user?.id
      );
      setReviews(reviewsData);
      setHasMore(reviewsData.length >= REVIEWS_PER_PAGE);
    } catch (error) {
      console.error('[ReviewSection] Failed to reload reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 더 불러오기
  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const moreReviews = await getProductReviews(
        productType,
        productId,
        {
          limit: REVIEWS_PER_PAGE,
          offset: reviews.length,
          sortBy,
        },
        user?.id
      );
      setReviews((prev) => [...prev, ...moreReviews]);
      setHasMore(moreReviews.length >= REVIEWS_PER_PAGE);
    } catch (error) {
      console.error('[ReviewSection] Failed to load more reviews:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 리뷰 작성
  const handleSubmit = async (data: Omit<CreateReviewInput, 'productType' | 'productId'>) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReview) {
        // 수정
        const updated = await updateReview(supabase, editingReview.id, data);
        if (updated) {
          setReviews((prev) =>
            prev.map((r) => (r.id === editingReview.id ? { ...r, ...updated } : r))
          );
          toast.success('리뷰가 수정되었습니다.');
        }
      } else {
        // 새 리뷰 작성
        const created = await createReview(supabase, user.id, {
          productType,
          productId,
          ...data,
        });
        if (created) {
          setReviews((prev) => [created, ...prev]);
          setUserHasReviewed(true);
          // 요약 업데이트
          const newSummary = await getReviewSummary(productType, productId);
          setSummary(newSummary);
          toast.success('리뷰가 등록되었습니다.');
        }
      }
      setIsFormOpen(false);
      setEditingReview(null);
    } catch (error) {
      console.error('[ReviewSection] Failed to submit review:', error);
      toast.error('리뷰 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 리뷰 삭제
  const handleDelete = async () => {
    if (!deleteReviewId) return;

    setIsDeleting(true);
    try {
      const success = await deleteReview(supabase, deleteReviewId);
      if (success) {
        setReviews((prev) => prev.filter((r) => r.id !== deleteReviewId));
        setUserHasReviewed(false);
        // 요약 업데이트
        const newSummary = await getReviewSummary(productType, productId);
        setSummary(newSummary);
        toast.success('리뷰가 삭제되었습니다.');
      }
    } catch (error) {
      console.error('[ReviewSection] Failed to delete review:', error);
      toast.error('리뷰 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteReviewId(null);
    }
  };

  // 도움됨 토글
  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      await toggleReviewHelpful(supabase, reviewId, user.id, isHelpful);
    } catch (error) {
      console.error('[ReviewSection] Failed to toggle helpful:', error);
      throw error; // ReviewCard에서 롤백 처리
    }
  };

  // 리뷰 작성 버튼 클릭
  const handleWriteClick = () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    setEditingReview(null);
    setIsFormOpen(true);
  };

  // 리뷰 수정 클릭
  const handleEdit = (review: ProductReview) => {
    setEditingReview(review);
    setIsFormOpen(true);
  };

  return (
    <Card className={cn(className)} data-testid="review-section">
      <CardHeader>
        <CardTitle>리뷰</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 리뷰 요약 */}
        {isLoading ? (
          <ReviewSummarySkeleton />
        ) : summary && summary.totalCount > 0 ? (
          <ReviewSummary summary={summary} />
        ) : null}

        {/* AI 리뷰 분석 (리뷰 5개 이상일 때) */}
        {!isLoading && aiSummary && (
          <ReviewAIKeywords
            aiSummary={aiSummary}
            onKeywordClick={(keyword, sentiment) => {
              // 키워드 클릭 시 해당 감성으로 필터 + 검색 (추후 구현)
              setSentimentFilter(sentiment);
            }}
          />
        )}

        {/* 감성 필터 */}
        {!isLoading && summary && summary.totalCount > 0 && (
          <ReviewSentimentFilter
            selected={sentimentFilter}
            onChange={setSentimentFilter}
            counts={sentimentCounts}
          />
        )}

        {/* 리뷰 작성 포인트 안내 */}
        {!isLoading && user && !userHasReviewed && (
          <ReviewPointsBadge
            isFirstReview={summary?.totalCount === 0}
            onWriteClick={handleWriteClick}
          />
        )}

        {/* 리뷰 작성 유도 / 작성 버튼 (비로그인 시) */}
        {!isLoading && !user && <ReviewPromptCard onWrite={handleWriteClick} />}

        {/* 리뷰 목록 */}
        <ReviewList
          reviews={filteredReviews}
          currentUserId={user?.id}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          isLoading={isLoading || isLoadingMore}
          onHelpful={handleHelpful}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteReviewId(id)}
        />
      </CardContent>

      {/* 리뷰 작성/수정 모달 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReview ? '리뷰 수정' : '리뷰 작성'}</DialogTitle>
          </DialogHeader>
          <ReviewForm
            review={editingReview ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리뷰를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제된 리뷰는 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/**
 * 로딩 스켈레톤
 */
export function ReviewSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>리뷰</CardTitle>
      </CardHeader>
      <CardContent>
        <ReviewSummarySkeleton />
      </CardContent>
    </Card>
  );
}
