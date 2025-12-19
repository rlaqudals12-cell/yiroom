'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Rating, CreateReviewInput, ProductReview } from '@/types/review';
import { getRatingText } from '@/lib/products/services/reviews';

interface ReviewFormProps {
  /** 수정할 리뷰 (없으면 새 리뷰 작성) */
  review?: ProductReview;
  /** 제출 핸들러 */
  onSubmit: (data: Omit<CreateReviewInput, 'productType' | 'productId'>) => Promise<void>;
  /** 취소 핸들러 */
  onCancel?: () => void;
  /** 로딩 중 여부 */
  isLoading?: boolean;
  /** 추가 클래스 */
  className?: string;
}

export function ReviewForm({
  review,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState<Rating>(review?.rating ?? 5);
  const [title, setTitle] = useState(review?.title ?? '');
  const [content, setContent] = useState(review?.content ?? '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!review;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!rating) {
      setError('별점을 선택해 주세요.');
      return;
    }

    try {
      await onSubmit({
        rating,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
      });
    } catch {
      setError('리뷰 등록에 실패했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      data-testid="review-form"
    >
      {/* 별점 선택 */}
      <div className="space-y-2">
        <Label>별점을 선택해 주세요</Label>
        <div className="flex items-center gap-4">
          <StarRating
            rating={rating}
            size="lg"
            editable
            onChange={setRating}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {getRatingText(rating)}
          </span>
        </div>
      </div>

      {/* 제목 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="review-title">
          제목 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="리뷰 제목을 입력해 주세요"
          maxLength={100}
          disabled={isLoading}
        />
      </div>

      {/* 내용 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="review-content">
          내용 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="제품 사용 후기를 자유롭게 작성해 주세요"
          rows={4}
          maxLength={1000}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground text-right">
          {content.length}/1000
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '등록 중...' : isEditing ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  );
}

/**
 * 리뷰 작성 유도 카드
 */
export function ReviewPromptCard({
  onWrite,
  className,
}: {
  onWrite: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed bg-muted/30 p-6 text-center',
        className
      )}
    >
      <h3 className="font-medium">이 제품을 사용해 보셨나요?</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        다른 사용자들에게 도움이 되는 리뷰를 남겨주세요
      </p>
      <Button onClick={onWrite} className="mt-4">
        리뷰 작성하기
      </Button>
    </div>
  );
}
