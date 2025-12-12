/**
 * N-1 C-1 체형 연동 인사이트 카드 컴포넌트 (Task 3.9)
 *
 * 체형 분석 결과에 기반한 영양 추천을 표시
 * - 체중 변화 감지 및 표시
 * - 체형 재분석 유도
 * - 체형 기반 칼로리 목표 조정
 */

'use client';

import { useMemo } from 'react';
import { Scale, ChevronRight, AlertCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getBodyNutritionInsight,
  type BodyAnalysisData,
  type WeightChangeInsight,
  type ReanalysisPrompt,
  type BodyCalorieAdjustment,
} from '@/lib/nutrition/bodyInsight';

export interface BodyInsightCardProps {
  /** C-1 체형 분석 데이터 */
  bodyAnalysis: BodyAnalysisData | null;
  /** 현재 체중 (kg) */
  currentWeight?: number | null;
  /** 기본 칼로리 목표 */
  baseCalories?: number;
  /** 영양 목표 */
  nutritionGoal?: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** C-1 분석 페이지로 이동 핸들러 */
  onNavigateToBodyAnalysis?: () => void;
  /** 재분석 버튼 클릭 핸들러 */
  onReanalysisClick?: () => void;
}

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton() {
  return (
    <div
      className="bg-module-body-light rounded-2xl p-4 shadow-sm border border-module-body/20"
      data-testid="body-insight-card-loading"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-module-body/30 animate-pulse" />
        <div className="w-32 h-5 bg-module-body/30 animate-pulse rounded" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-16 bg-module-body/20 animate-pulse rounded-xl" />
        <div className="w-full h-12 bg-module-body/20 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

/**
 * C-1 분석 유도 카드
 */
function NoAnalysisCard({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <div
      className="bg-module-body-light rounded-2xl p-4 shadow-sm border border-module-body/20"
      data-testid="body-insight-card-empty"
    >
      <div className="flex items-center gap-2 mb-3">
        <Scale className="w-5 h-5 text-module-body" />
        <h3 className="text-sm font-semibold text-gray-900">체형 연동 인사이트</h3>
      </div>

      <div className="bg-white/60 rounded-xl p-4 text-center">
        <AlertCircle className="w-10 h-10 text-module-body/50 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-3">
          C-1 체형 분석을 완료하면
          <br />
          맞춤 칼로리 목표를 설정할 수 있어요!
        </p>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="inline-flex items-center gap-1 px-4 py-2 bg-module-body text-white text-sm font-medium rounded-lg hover:bg-module-body-dark transition-colors"
            data-testid="navigate-body-analysis"
          >
            체형 분석하러 가기
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 체중 변화 섹션
 */
export function WeightChangeSection({
  insight,
}: {
  insight: WeightChangeInsight;
}) {
  const getTrendIcon = () => {
    if (insight.weightChange < -0.5) {
      return <TrendingDown className="w-5 h-5 text-green-500" />;
    }
    if (insight.weightChange > 0.5) {
      return <TrendingUp className="w-5 h-5 text-red-500" />;
    }
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    switch (insight.status) {
      case 'significant_loss':
      case 'slight_loss':
        return 'bg-green-50 border-green-200';
      case 'significant_gain':
      case 'slight_gain':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatWeight = (kg: number) => {
    const sign = kg >= 0 ? '+' : '';
    return `${sign}${kg.toFixed(1)}kg`;
  };

  return (
    <div
      className={cn('rounded-xl p-3 border', getStatusColor())}
      data-testid="weight-change-section"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <div>
            <p className="text-sm font-medium text-gray-900">체중 변화</p>
            <p className="text-xs text-gray-500">
              {insight.daysSinceAnalysis}일 전 분석 대비
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'text-lg font-bold',
              insight.weightChange < 0 ? 'text-green-600' : insight.weightChange > 0 ? 'text-red-600' : 'text-gray-600'
            )}
          >
            {formatWeight(insight.weightChange)}
          </p>
          <p className="text-xs text-gray-500">({insight.changePercentage}%)</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">{insight.message}</p>
    </div>
  );
}

/**
 * 체형 재분석 유도 섹션
 */
export function ReanalysisPromptSection({
  prompt,
  onReanalysisClick,
}: {
  prompt: ReanalysisPrompt;
  onReanalysisClick?: () => void;
}) {
  if (!prompt.shouldPrompt) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 border',
        prompt.isPositive
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
      )}
      data-testid="reanalysis-prompt-section"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-hidden="true">
          {prompt.icon}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{prompt.title}</p>
          <p className="text-xs text-gray-600 mt-1">{prompt.description}</p>
          {onReanalysisClick && (
            <button
              onClick={onReanalysisClick}
              className={cn(
                'mt-3 inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                prompt.isPositive
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              )}
              data-testid="reanalysis-button"
            >
              체형 재분석 받기
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 칼로리 조정 정보 섹션
 */
export function CalorieAdjustmentSection({
  adjustment,
}: {
  adjustment: BodyCalorieAdjustment;
}) {
  const hasAdjustment = adjustment.baseCalories !== adjustment.adjustedCalories;
  const diff = adjustment.adjustedCalories - adjustment.baseCalories;

  return (
    <div
      className="bg-white/60 rounded-xl p-3 border border-module-body/20"
      data-testid="calorie-adjustment-section"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">체형 맞춤 칼로리</p>
        <div className="text-right">
          <p className="text-lg font-bold text-module-body">
            {adjustment.adjustedCalories.toLocaleString()}kcal
          </p>
          {hasAdjustment && (
            <p className="text-xs text-gray-500">
              기본 {adjustment.baseCalories.toLocaleString()}kcal {diff > 0 ? `+${diff}` : diff}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-600">{adjustment.bodyTypeMessage}</p>
      {adjustment.adjustmentReason && (
        <p className="text-xs text-module-body mt-1">{adjustment.adjustmentReason}</p>
      )}
    </div>
  );
}

/**
 * BodyInsightCard 컴포넌트
 */
export default function BodyInsightCard({
  bodyAnalysis,
  currentWeight = null,
  baseCalories = 2000,
  nutritionGoal,
  isLoading = false,
  onNavigateToBodyAnalysis,
  onReanalysisClick,
}: BodyInsightCardProps) {
  // 인사이트 계산
  const insight = useMemo(
    () => getBodyNutritionInsight(bodyAnalysis, currentWeight, baseCalories, nutritionGoal),
    [bodyAnalysis, currentWeight, baseCalories, nutritionGoal]
  );

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // 체형 분석 없음
  if (!insight.hasAnalysis) {
    return <NoAnalysisCard onNavigate={onNavigateToBodyAnalysis} />;
  }

  return (
    <div
      className="bg-module-body-light rounded-2xl p-4 shadow-sm border border-module-body/20"
      data-testid="body-insight-card"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-module-body" />
          <h3 className="text-sm font-semibold text-gray-900">체형 연동 인사이트</h3>
        </div>
        <span className="text-xs text-module-body bg-module-body/20 px-2 py-0.5 rounded-full">
          C-1 연동
        </span>
      </div>

      {/* 요약 메시지 */}
      <p className="text-xs text-gray-600 mb-3">{insight.summaryMessage}</p>

      {/* 체중 변화 섹션 */}
      {insight.weightChangeInsight && (
        <div className="mb-3">
          <WeightChangeSection insight={insight.weightChangeInsight} />
        </div>
      )}

      {/* 재분석 유도 섹션 */}
      {insight.reanalysisPrompt.shouldPrompt && (
        <div className="mb-3">
          <ReanalysisPromptSection
            prompt={insight.reanalysisPrompt}
            onReanalysisClick={onReanalysisClick}
          />
        </div>
      )}

      {/* 칼로리 조정 정보 */}
      <CalorieAdjustmentSection adjustment={insight.calorieAdjustment} />
    </div>
  );
}

// 하위 컴포넌트 내보내기 (테스트용)
export { NoAnalysisCard };
