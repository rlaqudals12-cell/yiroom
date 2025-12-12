/**
 * N-1 S-1 피부 연동 인사이트 카드 컴포넌트 (Task 3.7)
 *
 * 피부 분석 결과에 기반한 영양 추천을 표시
 * - 피부 친화 음식 추천
 * - 수분 섭취 연동 인사이트
 */

'use client';

import { useMemo } from 'react';
import { Sparkles, Droplets, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSkinNutritionInsight,
  type SkinAnalysisSummary,
  type SkinFoodRecommendation,
  type HydrationInsight,
} from '@/lib/nutrition/skinInsight';

export interface SkinInsightCardProps {
  /** S-1 피부 분석 요약 데이터 */
  skinAnalysis: SkinAnalysisSummary | null;
  /** 현재 수분 섭취량 (ml) */
  currentWaterMl?: number;
  /** 영양 목표 (피부 개선 목표 시 추가 메시지) */
  nutritionGoal?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** S-1 분석 페이지로 이동 핸들러 */
  onNavigateToSkinAnalysis?: () => void;
  /** 음식 추천 클릭 핸들러 */
  onFoodRecommendationClick?: (recommendation: SkinFoodRecommendation) => void;
}

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton() {
  return (
    <div
      className="bg-module-skin-light rounded-2xl p-4 shadow-sm border border-module-skin/20"
      data-testid="skin-insight-card-loading"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-module-skin/30 animate-pulse" />
        <div className="w-32 h-5 bg-module-skin/30 animate-pulse rounded" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-16 bg-module-skin/20 animate-pulse rounded-xl" />
        <div className="w-full h-16 bg-module-skin/20 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

/**
 * S-1 분석 유도 카드
 */
function NoAnalysisCard({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <div
      className="bg-module-skin-light rounded-2xl p-4 shadow-sm border border-module-skin/20"
      data-testid="skin-insight-card-empty"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-module-skin" />
        <h3 className="text-sm font-semibold text-gray-900">피부 연동 인사이트</h3>
      </div>

      <div className="bg-white/60 rounded-xl p-4 text-center">
        <AlertCircle className="w-10 h-10 text-module-skin/50 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-3">
          S-1 피부 분석을 완료하면
          <br />
          맞춤 영양 추천을 받을 수 있어요!
        </p>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="inline-flex items-center gap-1 px-4 py-2 bg-module-skin text-white text-sm font-medium rounded-lg hover:bg-module-skin-dark transition-colors"
            data-testid="navigate-skin-analysis"
          >
            피부 분석하러 가기
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 음식 추천 아이템
 */
function FoodRecommendationItem({
  recommendation,
  onClick,
}: {
  recommendation: SkinFoodRecommendation;
  onClick?: () => void;
}) {
  const priorityColors = {
    high: 'border-l-red-400 bg-red-50/50',
    medium: 'border-l-amber-400 bg-amber-50/50',
    low: 'border-l-green-400 bg-green-50/50',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-xl border-l-4 transition-all hover:shadow-sm',
        priorityColors[recommendation.priority]
      )}
      data-testid={`food-recommendation-${recommendation.relatedMetric}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-hidden="true">
          {recommendation.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{recommendation.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
            {recommendation.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {recommendation.foods.slice(0, 4).map((food) => (
              <span
                key={food}
                className="inline-block px-2 py-0.5 bg-white rounded-full text-xs text-gray-700 border border-gray-200"
              >
                {food}
              </span>
            ))}
            {recommendation.foods.length > 4 && (
              <span className="inline-block px-2 py-0.5 text-xs text-gray-500">
                +{recommendation.foods.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * 수분 인사이트 섹션
 */
function HydrationInsightSection({
  insight,
}: {
  insight: HydrationInsight;
}) {
  const percentage = insight.currentMl
    ? Math.min(100, Math.round((insight.currentMl / insight.targetMl) * 100))
    : 0;

  const priorityColors = {
    high: 'from-blue-500 to-cyan-500',
    medium: 'from-blue-400 to-cyan-400',
    low: 'from-blue-300 to-cyan-300',
  };

  return (
    <div
      className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100"
      data-testid="hydration-insight"
    >
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-medium text-blue-700">수분 × 피부 연동</span>
      </div>
      <p className="text-sm text-gray-700">{insight.message}</p>

      {insight.currentMl !== undefined && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{insight.currentMl.toLocaleString()}ml</span>
            <span>{insight.targetMl.toLocaleString()}ml</span>
          </div>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                priorityColors[insight.priority]
              )}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`수분 섭취 ${percentage}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SkinInsightCard 컴포넌트
 */
export default function SkinInsightCard({
  skinAnalysis,
  currentWaterMl,
  nutritionGoal,
  isLoading = false,
  onNavigateToSkinAnalysis,
  onFoodRecommendationClick,
}: SkinInsightCardProps) {
  // 인사이트 계산
  const insight = useMemo(
    () => getSkinNutritionInsight(skinAnalysis, currentWaterMl, nutritionGoal),
    [skinAnalysis, currentWaterMl, nutritionGoal]
  );

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 피부 분석 없음
  if (!insight.hasAnalysis) {
    return <NoAnalysisCard onNavigate={onNavigateToSkinAnalysis} />;
  }

  // 추천이 없는 경우 (피부 상태가 모두 좋음)
  if (insight.foodRecommendations.length === 0) {
    return (
      <div
        className="bg-module-skin-light rounded-2xl p-4 shadow-sm border border-module-skin/20"
        data-testid="skin-insight-card"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-module-skin" />
          <h3 className="text-sm font-semibold text-gray-900">피부 연동 인사이트</h3>
        </div>

        <div className="bg-white/60 rounded-xl p-4 text-center">
          <span className="text-3xl">✨</span>
          <p className="text-sm text-gray-600 mt-2">{insight.summaryMessage}</p>
        </div>

        {insight.hydrationInsight && (
          <div className="mt-3">
            <HydrationInsightSection insight={insight.hydrationInsight} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="bg-module-skin-light rounded-2xl p-4 shadow-sm border border-module-skin/20"
      data-testid="skin-insight-card"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-module-skin" />
        <h3 className="text-sm font-semibold text-gray-900">피부 연동 인사이트</h3>
      </div>

      {/* 요약 메시지 */}
      <p className="text-xs text-gray-600 mb-3">{insight.summaryMessage}</p>

      {/* 음식 추천 목록 */}
      <div className="space-y-2">
        {insight.foodRecommendations.map((rec) => (
          <FoodRecommendationItem
            key={rec.relatedMetric}
            recommendation={rec}
            onClick={() => onFoodRecommendationClick?.(rec)}
          />
        ))}
      </div>

      {/* 수분 인사이트 */}
      {insight.hydrationInsight && (
        <div className="mt-3">
          <HydrationInsightSection insight={insight.hydrationInsight} />
        </div>
      )}
    </div>
  );
}

// 하위 컴포넌트 내보내기 (테스트용)
export { FoodRecommendationItem, HydrationInsightSection, NoAnalysisCard };
