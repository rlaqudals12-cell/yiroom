'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Utensils, ChevronDown, ChevronUp, Timer, Droplets, ArrowRight } from 'lucide-react';
import type { NutritionTip, WorkoutType } from '@/lib/workout/nutritionTips';
import {
  getPostWorkoutNutritionTips,
  getQuickNutritionMessage,
  calculateProteinRecommendation,
  estimateCaloriesBurned,
} from '@/lib/workout/nutritionTips';

interface PostWorkoutNutritionCardProps {
  workoutType: WorkoutType;
  durationMinutes: number;
  caloriesBurned?: number;
  bodyWeightKg?: number;
}

// 우선순위별 배지 스타일
const PRIORITY_STYLES = {
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-muted text-muted-foreground border-border',
};

// 팁 카드 컴포넌트
function TipCard({ tip }: { tip: NutritionTip }) {
  return (
    <div
      className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border/50"
      data-testid="nutrition-tip-card"
    >
      <span className="text-xl flex-shrink-0">{tip.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground text-sm">{tip.title}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full border ${PRIORITY_STYLES[tip.priority]}`}
          >
            {tip.priority === 'high' ? '필수' : tip.priority === 'medium' ? '권장' : '팁'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
      </div>
    </div>
  );
}

/**
 * 운동 후 영양 가이드 카드
 * W-1 → N-1 연동 준비: 운동 완료 후 영양/식단 팁 표시
 */
export default function PostWorkoutNutritionCard({
  workoutType,
  durationMinutes,
  caloriesBurned,
  bodyWeightKg = 60,
}: PostWorkoutNutritionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickMessage = getQuickNutritionMessage(workoutType, durationMinutes, caloriesBurned);
  const tips = getPostWorkoutNutritionTips(workoutType, durationMinutes);
  const proteinRec = calculateProteinRecommendation(workoutType, bodyWeightKg);
  const calories = caloriesBurned || estimateCaloriesBurned(workoutType, durationMinutes, bodyWeightKg).total;

  return (
    <div
      data-testid="post-workout-nutrition-card"
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      {/* 헤더 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {quickMessage.title}
              </h3>
              <p className="text-sm text-primary">{quickMessage.message}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-primary"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 확장 영역 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 섭취 타이밍 */}
          <div
            className="flex items-center gap-4 p-3 bg-card/60 rounded-lg"
            data-testid="timing-info"
          >
            <Timer className="w-5 h-5 text-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">섭취 타이밍</p>
              <p className="text-xs text-muted-foreground">
                최적: <span className="font-medium text-orange-600">{tips.timing.optimal}</span>
                {' | '}
                권장: {tips.timing.deadline}
              </p>
            </div>
          </div>

          {/* 단백질 권장량 */}
          <div
            className="p-3 bg-card/60 rounded-lg"
            data-testid="protein-recommendation"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">단백질 권장량</span>
              <span className="text-lg font-bold text-primary">
                {proteinRec.min}-{proteinRec.max}{proteinRec.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              오늘 소모한 {calories}kcal 기준으로 계산된 권장량이에요
            </p>
          </div>

          {/* 단백질 팁 */}
          {tips.proteinTips.length > 0 && (
            <div data-testid="protein-tips">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-foreground/80">단백질 보충</span>
              </div>
              <div className="space-y-2">
                {tips.proteinTips.map((tip, index) => (
                  <TipCard key={`protein-${index}`} tip={tip} />
                ))}
              </div>
            </div>
          )}

          {/* 식사 추천 */}
          {tips.mealTips.length > 0 && (
            <div data-testid="meal-tips">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-foreground/80">식사 추천</span>
              </div>
              <div className="space-y-2">
                {tips.mealTips.map((tip, index) => (
                  <TipCard key={`meal-${index}`} tip={tip} />
                ))}
              </div>
            </div>
          )}

          {/* 수분 보충 */}
          <div data-testid="hydration-tip">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground/80">수분 보충</span>
            </div>
            <TipCard tip={tips.hydrationTip} />
          </div>

          {/* N-1 식단 분석 유도 */}
          <div className="text-center py-4 bg-card/50 rounded-lg" data-testid="nutrition-analysis-cta">
            <p className="text-xs text-muted-foreground mb-3">
              더 정확한 식단 추천을 받고 싶다면?
            </p>
            <Link
              href="/nutrition"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-medium rounded-lg transition-colors"
            >
              식단 분석 받기
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-muted-foreground mt-2">
              * N-1 영양 모듈 출시 예정
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
