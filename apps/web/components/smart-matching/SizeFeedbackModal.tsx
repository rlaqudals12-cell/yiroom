'use client';

/**
 * 사이즈 피드백 모달
 * @description 구매 후 사이즈 핏 피드백 수집
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import type { SizeFit } from '@/types/smart-matching';

interface SizeFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  brandName: string;
  size: string;
  onSubmit: (feedback: {
    fit: SizeFit;
    comment?: string;
  }) => void;
  isLoading?: boolean;
}

const FIT_OPTIONS: { value: SizeFit; label: string; emoji: string; description: string }[] = [
  {
    value: 'small',
    label: '작아요',
    emoji: '😣',
    description: '다음엔 한 사이즈 업을 추천해드릴게요',
  },
  {
    value: 'perfect',
    label: '딱 맞아요',
    emoji: '😊',
    description: '이 사이즈를 기억할게요',
  },
  {
    value: 'large',
    label: '커요',
    emoji: '😅',
    description: '다음엔 한 사이즈 다운을 추천해드릴게요',
  },
];

export function SizeFeedbackModal({
  open,
  onOpenChange,
  productName,
  brandName,
  size,
  onSubmit,
  isLoading = false,
}: SizeFeedbackModalProps) {
  const [selectedFit, setSelectedFit] = useState<SizeFit | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!selectedFit) return;

    onSubmit({
      fit: selectedFit,
      comment: comment.trim() || undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // 모달 닫을 때 상태 초기화
      setSelectedFit(null);
      setComment('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="size-feedback-modal">
        <DialogHeader>
          <DialogTitle>사이즈 피드백</DialogTitle>
          <VisuallyHidden asChild>
            <DialogDescription>
              {brandName} {productName} {size} 사이즈에 대한 피드백
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제품 정보 */}
          <div className="text-center py-2 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{brandName}</p>
            <p className="font-medium">{productName}</p>
            <p className="text-lg font-bold text-primary">{size}</p>
          </div>

          {/* 핏 선택 */}
          <div>
            <p className="text-sm font-medium mb-3">사이즈가 어떠셨나요?</p>
            <div className="grid grid-cols-3 gap-2">
              {FIT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFit(option.value)}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg border-2 transition-all',
                    selectedFit === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl mb-1">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            {selectedFit && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {FIT_OPTIONS.find((o) => o.value === selectedFit)?.description}
              </p>
            )}
          </div>

          {/* 추가 코멘트 */}
          <div>
            <p className="text-sm font-medium mb-2">추가 의견 (선택)</p>
            <Textarea
              placeholder="예: 팔 길이가 조금 짧았어요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedFit || isLoading}
            >
              {isLoading ? '저장 중...' : '피드백 저장'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            피드백을 남기시면 다음 추천이 더 정확해져요
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
