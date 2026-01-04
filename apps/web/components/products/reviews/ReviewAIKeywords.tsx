'use client';

import { useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * AI 추출 키워드 타입
 */
interface AIKeyword {
  text: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

/**
 * AI 리뷰 요약 데이터
 */
export interface ReviewAISummary {
  /** 긍정 키워드 TOP 5 */
  positiveKeywords: AIKeyword[];
  /** 부정 키워드 TOP 5 */
  negativeKeywords: AIKeyword[];
  /** 리뷰 핵심 요약 (1-2문장) */
  summary: string;
  /** 추천 포인트 */
  recommendPoints: string[];
  /** 주의 포인트 */
  cautionPoints: string[];
  /** 분석된 리뷰 수 */
  analyzedCount: number;
  /** 마지막 분석 시간 */
  lastAnalyzedAt: string;
}

interface ReviewAIKeywordsProps {
  /** AI 요약 데이터 */
  aiSummary: ReviewAISummary;
  /** 키워드 클릭 시 해당 키워드 포함 리뷰로 필터링 */
  onKeywordClick?: (keyword: string, sentiment: 'positive' | 'negative') => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 리뷰 AI 요약 키워드 컴포넌트 (화해 스타일)
 * - 긍정/부정 키워드 표시
 * - AI 요약 문장
 * - 추천/주의 포인트
 */
export function ReviewAIKeywords({ aiSummary, onKeywordClick, className }: ReviewAIKeywordsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    positiveKeywords,
    negativeKeywords,
    summary,
    recommendPoints,
    cautionPoints,
    analyzedCount,
  } = aiSummary;

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl border border-violet-200 dark:border-violet-800/30 overflow-hidden',
        className
      )}
      data-testid="review-ai-keywords"
    >
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-200">
              AI 리뷰 분석
            </h3>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              {analyzedCount}개 리뷰 분석 결과
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-violet-200/50 dark:hover:bg-violet-800/30 transition-colors"
          aria-label={isExpanded ? '접기' : '펼치기'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          )}
        </button>
      </div>

      {/* AI 요약 문장 */}
      <div className="px-4 py-3 border-b border-violet-200/50 dark:border-violet-800/30">
        <p className="text-sm text-foreground leading-relaxed">&ldquo;{summary}&rdquo;</p>
      </div>

      {/* 키워드 섹션 */}
      <div className="px-4 py-3 space-y-3">
        {/* 긍정 키워드 */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ThumbsUp className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">좋아요</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {positiveKeywords.map((keyword) => (
              <button
                key={keyword.text}
                onClick={() => onKeywordClick?.(keyword.text, 'positive')}
                className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors flex items-center gap-1"
              >
                {keyword.text}
                <span className="text-green-500 dark:text-green-400 font-medium">
                  {keyword.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 부정 키워드 */}
        {negativeKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ThumbsDown className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">아쉬워요</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {negativeKeywords.map((keyword) => (
                <button
                  key={keyword.text}
                  onClick={() => onKeywordClick?.(keyword.text, 'negative')}
                  className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors flex items-center gap-1"
                >
                  {keyword.text}
                  <span className="text-red-500 dark:text-red-400 font-medium">
                    {keyword.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 확장 섹션: 추천/주의 포인트 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-violet-200/50 dark:border-violet-800/30 pt-3">
          {/* 추천 포인트 */}
          {recommendPoints.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  추천 포인트
                </span>
              </div>
              <ul className="space-y-1">
                {recommendPoints.map((point, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-green-500 shrink-0">+</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 주의 포인트 */}
          {cautionPoints.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  주의 포인트
                </span>
              </div>
              <ul className="space-y-1">
                {cautionPoints.map((point, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-orange-500 shrink-0">!</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mock AI 요약 데이터 생성 (개발/테스트용)
 */
export function generateMockAISummary(totalReviews: number): ReviewAISummary {
  return {
    positiveKeywords: [
      { text: '촉촉함', count: 128, sentiment: 'positive' },
      { text: '흡수력', count: 95, sentiment: 'positive' },
      { text: '순한 성분', count: 82, sentiment: 'positive' },
      { text: '가성비', count: 67, sentiment: 'positive' },
      { text: '피부결 개선', count: 54, sentiment: 'positive' },
    ],
    negativeKeywords: [
      { text: '끈적임', count: 23, sentiment: 'negative' },
      { text: '향이 강함', count: 18, sentiment: 'negative' },
      { text: '용량 적음', count: 12, sentiment: 'negative' },
    ],
    summary:
      '대부분의 사용자가 촉촉한 보습력과 빠른 흡수력에 만족했으며, 민감한 피부에도 자극 없이 사용 가능하다는 평가가 많습니다.',
    recommendPoints: [
      '건성/민감성 피부에 특히 추천',
      '아침 스킨케어 루틴에 적합',
      '가벼운 텍스처로 여름에도 부담 없음',
    ],
    cautionPoints: ['지성 피부는 끈적일 수 있음', '향에 민감한 분은 테스트 권장'],
    analyzedCount: totalReviews,
    lastAnalyzedAt: new Date().toISOString(),
  };
}

export default ReviewAIKeywords;
