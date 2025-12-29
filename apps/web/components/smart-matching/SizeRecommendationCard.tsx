'use client';

/**
 * 사이즈 추천 카드
 * @description 추천 사이즈와 신뢰도, 대안 표시
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SizeRecommendation } from '@/types/smart-matching';
import {
  getConfidenceLabel,
  getBasisDescription,
} from '@/lib/smart-matching/size-recommend';

interface SizeRecommendationCardProps {
  recommendation: SizeRecommendation;
  onSelectSize?: (size: string) => void;
  selectedSize?: string;
  showFeedback?: boolean;
  onFeedbackClick?: () => void;
  className?: string;
}

export function SizeRecommendationCard({
  recommendation,
  onSelectSize,
  selectedSize,
  showFeedback = true,
  onFeedbackClick,
  className,
}: SizeRecommendationCardProps) {
  const { recommendedSize, confidence, basis, alternatives, brandInfo } = recommendation;
  const confidenceInfo = getConfidenceLabel(confidence);
  const basisText = getBasisDescription(basis);

  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm',
        className
      )}
      data-testid="size-recommendation-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">추천 사이즈</h3>
        <Badge
          variant="secondary"
          className={cn(
            'text-xs',
            confidenceInfo.color === 'green' && 'bg-green-100 text-green-700',
            confidenceInfo.color === 'yellow' && 'bg-yellow-100 text-yellow-700',
            confidenceInfo.color === 'gray' && 'bg-gray-100 text-gray-600'
          )}
        >
          {confidenceInfo.label} ({confidence}%)
        </Badge>
      </div>

      {/* 추천 사이즈 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => onSelectSize?.(recommendedSize)}
          className={cn(
            'w-16 h-16 rounded-lg border-2 flex items-center justify-center',
            'text-2xl font-bold transition-all',
            selectedSize === recommendedSize
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50'
          )}
        >
          {recommendedSize}
        </button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{basisText}</p>
          {brandInfo?.sizeNote && (
            <p className="text-xs text-muted-foreground mt-1">
              {brandInfo.sizeNote}
            </p>
          )}
          {brandInfo?.fitStyle && (
            <Badge variant="outline" className="mt-1 text-xs">
              {brandInfo.fitStyle === 'slim' && '슬림핏'}
              {brandInfo.fitStyle === 'regular' && '레귤러핏'}
              {brandInfo.fitStyle === 'oversized' && '오버사이즈'}
            </Badge>
          )}
        </div>
      </div>

      {/* 대안 사이즈 */}
      {alternatives.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>다른 사이즈 보기</span>
            <svg
              className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expanded && (
            <div className="mt-2 space-y-2">
              {alternatives.map((alt) => (
                <div key={alt.size} className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectSize?.(alt.size)}
                    className={cn(
                      'w-12 h-12 rounded-lg border flex items-center justify-center',
                      'text-lg font-medium transition-all shrink-0',
                      selectedSize === alt.size
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {alt.size}
                  </button>
                  <span className="text-xs text-muted-foreground">{alt.note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 피드백 버튼 */}
      {showFeedback && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={onFeedbackClick}
        >
          사이즈 피드백 남기기
        </Button>
      )}
    </div>
  );
}
