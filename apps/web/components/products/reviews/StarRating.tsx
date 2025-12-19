'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { Rating } from '@/types/review';

interface StarRatingProps {
  /** 현재 별점 */
  rating: number;
  /** 최대 별점 */
  maxRating?: number;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 편집 가능 여부 */
  editable?: boolean;
  /** 별점 변경 핸들러 */
  onChange?: (rating: Rating) => void;
  /** 리뷰 개수 표시 */
  showCount?: boolean;
  /** 리뷰 개수 */
  reviewCount?: number;
  /** 추가 클래스 */
  className?: string;
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  editable = false,
  onChange,
  showCount = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (editable && onChange) {
      const newRating = (index + 1) as Rating;
      onChange(newRating);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (editable && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const newRating = (index + 1) as Rating;
      onChange(newRating);
    }
  };

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      data-testid="star-rating"
    >
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = index < Math.floor(rating);
        const isHalf = index === Math.floor(rating) && rating % 1 >= 0.5;

        return (
          <button
            key={index}
            type="button"
            disabled={!editable}
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'relative transition-colors',
              editable
                ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded'
                : 'cursor-default'
            )}
            aria-label={`${index + 1}점`}
          >
            {/* 배경 별 (빈 별) */}
            <Star
              className={cn(
                sizeClasses[size],
                'text-muted-foreground/30'
              )}
            />
            {/* 채워진 별 */}
            {(isFilled || isHalf) && (
              <Star
                className={cn(
                  sizeClasses[size],
                  'absolute inset-0 fill-yellow-400 text-yellow-400',
                  isHalf && 'clip-path-half'
                )}
                style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </button>
        );
      })}

      {showCount && reviewCount !== undefined && (
        <span className="ml-1.5 text-sm text-muted-foreground">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}

/**
 * 별점 평균 표시용 컴포넌트
 */
export function RatingBadge({
  rating,
  size = 'sm',
  className,
}: {
  rating: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30',
        sizeClasses[size],
        className
      )}
    >
      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-yellow-700 dark:text-yellow-400">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
