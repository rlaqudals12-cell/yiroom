'use client';

import { cn } from '@/lib/utils';
import { StarRating } from './StarRating';
import type { ReviewSummary as ReviewSummaryType } from '@/types/review';

interface ReviewSummaryProps {
  /** 리뷰 요약 데이터 */
  summary: ReviewSummaryType;
  /** 추가 클래스 */
  className?: string;
}

export function ReviewSummary({ summary, className }: ReviewSummaryProps) {
  const { averageRating, totalCount, ratingDistribution } = summary;

  // 가장 많은 리뷰 수 (막대 그래프 비율 계산용)
  const maxCount = Math.max(...Object.values(ratingDistribution), 1);

  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:gap-8', className)}
      data-testid="review-summary"
    >
      {/* 평균 별점 */}
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
        <StarRating rating={averageRating} size="md" />
        <span className="text-sm text-muted-foreground">
          {totalCount.toLocaleString()}개의 리뷰
        </span>
      </div>

      {/* 별점 분포 */}
      <div className="flex-1">
        <div className="space-y-2">
          {([5, 4, 3, 2, 1] as const).map((rating) => {
            const count = ratingDistribution[rating];
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const barWidth = (count / maxCount) * 100;

            return (
              <div key={rating} className="flex items-center gap-2">
                {/* 별점 라벨 */}
                <span className="w-6 text-right text-sm text-muted-foreground">
                  {rating}점
                </span>

                {/* 막대 그래프 */}
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      rating >= 4
                        ? 'bg-green-500'
                        : rating >= 3
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* 개수/비율 */}
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {count > 0 ? `${percentage.toFixed(0)}%` : '-'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 로딩 스켈레톤
 */
export function ReviewSummarySkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-8 animate-pulse">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="h-10 w-16 bg-muted rounded" />
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-2">
            <div className="w-6 h-4 bg-muted rounded" />
            <div className="flex-1 h-2 bg-muted rounded-full" />
            <div className="w-16 h-4 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
