'use client';

import { cn } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, MessageSquare, Sparkles } from 'lucide-react';

/**
 * 감성 필터 타입
 */
export type SentimentFilterType = 'all' | 'positive' | 'negative' | 'with_photo';

interface SentimentFilterOption {
  value: SentimentFilterType;
  label: string;
  icon: React.ReactNode;
  count?: number;
  color: string;
  activeColor: string;
}

interface ReviewSentimentFilterProps {
  /** 현재 선택된 필터 */
  selected: SentimentFilterType;
  /** 필터 변경 콜백 */
  onChange: (filter: SentimentFilterType) => void;
  /** 각 필터별 리뷰 수 */
  counts?: {
    all: number;
    positive: number;
    negative: number;
    withPhoto: number;
  };
  /** 추가 클래스 */
  className?: string;
}

/**
 * 리뷰 감성 필터 컴포넌트 (글로우픽 스타일)
 * - 전체/긍정/부정/사진 리뷰 필터링
 */
export function ReviewSentimentFilter({
  selected,
  onChange,
  counts,
  className,
}: ReviewSentimentFilterProps) {
  const options: SentimentFilterOption[] = [
    {
      value: 'all',
      label: '전체',
      icon: <MessageSquare className="w-4 h-4" />,
      count: counts?.all,
      color: 'text-muted-foreground bg-muted',
      activeColor: 'text-primary-foreground bg-primary',
    },
    {
      value: 'positive',
      label: '긍정',
      icon: <ThumbsUp className="w-4 h-4" />,
      count: counts?.positive,
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      activeColor: 'text-white bg-green-500',
    },
    {
      value: 'negative',
      label: '부정',
      icon: <ThumbsDown className="w-4 h-4" />,
      count: counts?.negative,
      color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
      activeColor: 'text-white bg-red-500',
    },
    {
      value: 'with_photo',
      label: '포토',
      icon: <Sparkles className="w-4 h-4" />,
      count: counts?.withPhoto,
      color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
      activeColor: 'text-white bg-amber-500',
    },
  ];

  return (
    <div
      className={cn('flex gap-2 overflow-x-auto pb-1', className)}
      role="tablist"
      aria-label="리뷰 감성 필터"
      data-testid="review-sentiment-filter"
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
              isSelected ? option.activeColor : option.color,
              !isSelected && 'hover:opacity-80'
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span className={cn('text-xs', isSelected ? 'opacity-80' : 'opacity-60')}>
                ({option.count.toLocaleString()})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 별점 기반 감성 판단 유틸리티
 * @param rating 1-5 별점
 * @returns 'positive' | 'negative' | 'neutral'
 */
export function getSentimentFromRating(rating: number): 'positive' | 'negative' | 'neutral' {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
}

/**
 * 리뷰 감성별 카운트 계산
 */
export function calculateSentimentCounts(reviews: { rating: number; hasPhoto?: boolean }[]): {
  all: number;
  positive: number;
  negative: number;
  withPhoto: number;
} {
  return reviews.reduce(
    (acc, review) => {
      acc.all++;
      const sentiment = getSentimentFromRating(review.rating);
      if (sentiment === 'positive') acc.positive++;
      if (sentiment === 'negative') acc.negative++;
      if (review.hasPhoto) acc.withPhoto++;
      return acc;
    },
    { all: 0, positive: 0, negative: 0, withPhoto: 0 }
  );
}

export default ReviewSentimentFilter;
