'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MoreVertical, Edit2, Trash2, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ProductReview } from '@/types/review';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReviewCardProps {
  /** 리뷰 데이터 */
  review: ProductReview;
  /** 현재 로그인 사용자 ID */
  currentUserId?: string;
  /** 도움됨 클릭 핸들러 */
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  /** 수정 클릭 핸들러 */
  onEdit?: (review: ProductReview) => void;
  /** 삭제 클릭 핸들러 */
  onDelete?: (reviewId: string) => void;
  /** 추가 클래스 */
  className?: string;
}

export function ReviewCard({
  review,
  currentUserId,
  onHelpful,
  onEdit,
  onDelete,
  className,
}: ReviewCardProps) {
  const [isHelpful, setIsHelpful] = useState(review.isHelpfulByMe ?? false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentUserId === review.clerkUserId;
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const handleHelpful = async () => {
    if (!currentUserId || !onHelpful || isLoading) return;

    setIsLoading(true);
    const newIsHelpful = !isHelpful;

    // 낙관적 업데이트
    setIsHelpful(newIsHelpful);
    setHelpfulCount((prev) => (newIsHelpful ? prev + 1 : prev - 1));

    try {
      await onHelpful(review.id, newIsHelpful);
    } catch {
      // 실패 시 롤백
      setIsHelpful(!newIsHelpful);
      setHelpfulCount((prev) => (newIsHelpful ? prev - 1 : prev + 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article
      className={cn(
        'rounded-lg border bg-card p-4',
        className
      )}
      data-testid="review-card"
    >
      {/* 헤더: 사용자 정보 + 별점 + 시간 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* 사용자 아바타 */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {review.user?.name?.charAt(0) ?? 'U'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {review.user?.name ?? '익명'}
              </span>
              {review.verifiedPurchase && (
                <span className="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  구매 인증
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* 더보기 메뉴 (본인 리뷰만) */}
        {isOwner && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">더보기</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(review)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  수정
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(review.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* 제목 */}
      {review.title && (
        <h4 className="mt-3 font-medium">{review.title}</h4>
      )}

      {/* 본문 */}
      {review.content && (
        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
          {review.content}
        </p>
      )}

      {/* 도움됨 버튼 */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleHelpful}
          disabled={!currentUserId || isOwner || isLoading}
          className={cn(
            'h-8 gap-1.5',
            isHelpful && 'text-primary'
          )}
        >
          <ThumbsUp
            className={cn('h-4 w-4', isHelpful && 'fill-current')}
          />
          <span>도움됨</span>
          {helpfulCount > 0 && (
            <span className="text-xs">({helpfulCount})</span>
          )}
        </Button>
      </div>
    </article>
  );
}

/**
 * 로딩 스켈레톤
 */
export function ReviewCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded mt-1.5" />
        </div>
      </div>
      <div className="h-4 w-3/4 bg-muted rounded mt-3" />
      <div className="h-16 w-full bg-muted rounded mt-2" />
      <div className="h-8 w-20 bg-muted rounded mt-4" />
    </div>
  );
}
