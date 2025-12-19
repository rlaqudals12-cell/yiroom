'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ReviewCard, ReviewCardSkeleton } from './ReviewCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductReview, ReviewSortBy } from '@/types/review';
import { MessageSquare } from 'lucide-react';

interface ReviewListProps {
  /** 리뷰 목록 */
  reviews: ProductReview[];
  /** 현재 로그인 사용자 ID */
  currentUserId?: string;
  /** 정렬 옵션 */
  sortBy?: ReviewSortBy;
  /** 정렬 변경 핸들러 */
  onSortChange?: (sort: ReviewSortBy) => void;
  /** 더 불러오기 가능 여부 */
  hasMore?: boolean;
  /** 더 불러오기 핸들러 */
  onLoadMore?: () => void;
  /** 로딩 중 여부 */
  isLoading?: boolean;
  /** 도움됨 핸들러 */
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  /** 수정 핸들러 */
  onEdit?: (review: ProductReview) => void;
  /** 삭제 핸들러 */
  onDelete?: (reviewId: string) => void;
  /** 추가 클래스 */
  className?: string;
}

const sortOptions: Array<{ value: ReviewSortBy; label: string }> = [
  { value: 'recent', label: '최신순' },
  { value: 'helpful', label: '도움순' },
  { value: 'rating_high', label: '높은 별점순' },
  { value: 'rating_low', label: '낮은 별점순' },
];

export function ReviewList({
  reviews,
  currentUserId,
  sortBy = 'recent',
  onSortChange,
  hasMore = false,
  onLoadMore,
  isLoading = false,
  onHelpful,
  onEdit,
  onDelete,
  className,
}: ReviewListProps) {
  return (
    <div className={cn('space-y-4', className)} data-testid="review-list">
      {/* 헤더: 정렬 옵션 */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            총 {reviews.length}개의 리뷰
          </span>
          {onSortChange && (
            <Select value={sortBy} onValueChange={(v) => onSortChange(v as ReviewSortBy)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* 리뷰 목록 */}
      {isLoading && reviews.length === 0 ? (
        // 초기 로딩
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReviewCardSkeleton key={i} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        // 빈 상태
        <EmptyReviews />
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={currentUserId}
                onHelpful={onHelpful}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>

          {/* 더 불러오기 */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? '불러오는 중...' : '더 보기'}
              </Button>
            </div>
          )}

          {/* 추가 로딩 스켈레톤 */}
          {isLoading && reviews.length > 0 && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <ReviewCardSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * 빈 리뷰 상태
 */
function EmptyReviews() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium">아직 리뷰가 없어요</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        첫 번째 리뷰를 작성해 주세요!
      </p>
    </div>
  );
}
