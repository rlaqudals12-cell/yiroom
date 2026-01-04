'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, ThumbsUp, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { AIIngredientSummary as AIIngredientSummaryType } from '@/lib/products/services/ingredient-analysis';

interface AIIngredientSummaryProps {
  /** AI 분석 결과 */
  summary: AIIngredientSummaryType | null;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * AI 성분 분석 요약 컴포넌트
 * - 핵심 키워드 태그
 * - 한줄 요약
 * - 추천/주의 포인트
 * - 피부타입별 추천도
 */
export function AIIngredientSummary({
  summary,
  isLoading = false,
  className,
}: AIIngredientSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
          'rounded-2xl border border-violet-200 dark:border-violet-800 p-4',
          className
        )}
        data-testid="ai-ingredient-summary-loading"
      >
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
          <span className="font-semibold text-foreground">AI가 성분을 분석하고 있어요...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-violet-200/50 rounded animate-pulse" />
          <div className="h-4 bg-violet-200/50 rounded animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!summary) {
    return null;
  }

  // 피부타입 한글 라벨
  const skinTypeLabels: Record<string, string> = {
    oily: '지성',
    dry: '건성',
    sensitive: '민감성',
    combination: '복합성',
    normal: '중성',
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
        'rounded-2xl border border-violet-200 dark:border-violet-800',
        'overflow-hidden',
        className
      )}
      data-testid="ai-ingredient-summary"
    >
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-violet-200/50 dark:border-violet-800/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI 성분 분석
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 키워드 태그 */}
      <div className="px-4 py-3 border-b border-violet-200/50 dark:border-violet-800/50">
        <div className="flex flex-wrap gap-2">
          {summary.keywords.map((keyword, index) => (
            <span
              key={index}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                'bg-violet-100 dark:bg-violet-900/50',
                'text-violet-700 dark:text-violet-300',
                'border border-violet-200 dark:border-violet-700'
              )}
              title={`신뢰도: ${Math.round(keyword.score * 100)}%`}
            >
              {keyword.label}
            </span>
          ))}
        </div>
      </div>

      {/* 요약 문장 */}
      <div className="px-4 py-3 border-b border-violet-200/50 dark:border-violet-800/50">
        <p className="text-sm text-foreground leading-relaxed">&ldquo;{summary.summary}&rdquo;</p>
      </div>

      {/* 추천/주의 포인트 - 펼침 상태에서만 표시 */}
      {isExpanded && (
        <>
          {/* 추천 포인트 */}
          {summary.recommendPoints.length > 0 && (
            <div className="px-4 py-3 border-b border-violet-200/50 dark:border-violet-800/50">
              <div className="flex items-center gap-1.5 mb-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  추천 포인트
                </span>
              </div>
              <ul className="space-y-1">
                {summary.recommendPoints.map((point, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 주의 포인트 */}
          {summary.cautionPoints.length > 0 && (
            <div className="px-4 py-3 border-b border-violet-200/50 dark:border-violet-800/50">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  주의 포인트
                </span>
              </div>
              <ul className="space-y-1">
                {summary.cautionPoints.map((point, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 피부타입별 추천도 */}
          <div className="px-4 py-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-3">피부타입별 추천도</h4>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(summary.skinTypeRecommendation).map(([type, score]) => {
                const getScoreColor = (s: number) => {
                  if (s >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
                  if (s >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
                  return 'text-red-600 bg-red-100 dark:bg-red-900/30';
                };

                return (
                  <div key={type} className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        'text-sm font-bold',
                        getScoreColor(score)
                      )}
                    >
                      {score}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {skinTypeLabels[type] || type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 펼치기 힌트 */}
      {!isExpanded && (
        <div className="px-4 py-2 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
          >
            자세히 보기
          </button>
        </div>
      )}
    </div>
  );
}

export default AIIngredientSummary;
