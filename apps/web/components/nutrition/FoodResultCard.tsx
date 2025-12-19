'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalyzedFoodItem } from '@/lib/gemini/prompts/foodAnalysis';
import { TrafficLightIndicator, TRAFFIC_LIGHT_CONFIG } from './TrafficLight';

// 양 조절 배수 옵션
const PORTION_MULTIPLIERS = [0.5, 1, 1.5, 2] as const;

// 신뢰도 레벨 설정
const CONFIDENCE_CONFIG = {
  high: { label: '높음', color: 'text-green-600' },
  medium: { label: '중간', color: 'text-yellow-600' },
  low: { label: '낮음', color: 'text-red-600' },
} as const;

// 신뢰도 값을 레벨로 변환
function getConfidenceLevel(confidence: number): keyof typeof CONFIDENCE_CONFIG {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
}

interface FoodResultCardProps {
  food: AnalyzedFoodItem;
  portionMultiplier: number;
  onPortionChange: (multiplier: number) => void;
  onEdit?: () => void;
  showDetails?: boolean;
}

/**
 * N-1 음식 분석 결과 카드 컴포넌트
 * Task 2.5: 분석 결과 화면
 */
export default function FoodResultCard({
  food,
  portionMultiplier,
  onPortionChange,
  onEdit,
  showDetails = true,
}: FoodResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const trafficLightStyle = TRAFFIC_LIGHT_CONFIG[food.trafficLight];
  const confidenceLevel = getConfidenceLevel(food.confidence);
  const confidenceStyle = CONFIDENCE_CONFIG[confidenceLevel];

  // 양에 따른 영양소 계산
  const adjustedCalories = Math.round(food.calories * portionMultiplier);
  const adjustedProtein = Math.round(food.protein * portionMultiplier * 10) / 10;
  const adjustedCarbs = Math.round(food.carbs * portionMultiplier * 10) / 10;
  const adjustedFat = Math.round(food.fat * portionMultiplier * 10) / 10;

  return (
    <div
      className={`rounded-2xl border-2 ${trafficLightStyle.borderColor} ${trafficLightStyle.bgColor} overflow-hidden`}
      data-testid="food-result-card"
    >
      {/* 음식명 + 칼로리 헤더 */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TrafficLightIndicator color={food.trafficLight} size="lg" />
              <h3 className="font-bold text-foreground">{food.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{food.portion}</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${trafficLightStyle.textColor}`}>
              {adjustedCalories} kcal
            </p>
            <p className="text-xs text-muted-foreground">
              {portionMultiplier !== 1 && `(${portionMultiplier}인분)`}
            </p>
          </div>
        </div>

        {/* 양 조절 버튼 */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">양 조절</p>
          <div className="flex gap-2">
            {PORTION_MULTIPLIERS.map((multiplier) => (
              <button
                key={multiplier}
                onClick={() => onPortionChange(multiplier)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  portionMultiplier === multiplier
                    ? 'bg-foreground text-background'
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
                aria-pressed={portionMultiplier === multiplier}
              >
                {multiplier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상세 정보 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-1 py-2 bg-card/50 text-sm text-muted-foreground hover:bg-card/80 transition-colors"
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <>
            접기 <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            상세 보기 <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {/* 상세 영양정보 */}
      {isExpanded && (
        <div className="p-4 bg-card border-t border-border">
          {/* 영양소 정보 */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <p className="text-xs text-muted-foreground">탄수화물</p>
              <p className="font-bold text-foreground">{adjustedCarbs}g</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">단백질</p>
              <p className="font-bold text-foreground">{adjustedProtein}g</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">지방</p>
              <p className="font-bold text-foreground">{adjustedFat}g</p>
            </div>
          </div>

          {/* 신뢰도 표시 */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">📊 신뢰도:</span>
              <span className={`text-sm font-medium ${confidenceStyle.color}`}>
                {confidenceStyle.label}
              </span>
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
              >
                ✏️ 수정
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
