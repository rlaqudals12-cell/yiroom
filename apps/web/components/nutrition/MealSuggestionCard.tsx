/**
 * N-1 "오늘 뭐 먹지?" AI 식단 추천 카드
 *
 * 통합 컨텍스트 기반 맞춤 식사 추천:
 * - 피부 분석(S-1) + 체형 분석(C-1) 연동
 * - 대중적이고 구하기 쉬운 한국 음식 위주
 * - 가성비 좋은 메뉴 추천
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles,
  ChefHat,
  Loader2,
  RefreshCw,
  ThumbsUp,
  Clock,
  Flame,
  Leaf,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import type { NutritionGoal, MealType, TrafficLight } from '@/types/nutrition';

// 추천 음식 타입
interface SuggestedFood {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
  reason: string;
  whereToGet: string; // 어디서 구할 수 있는지
  priceRange: '저렴' | '보통' | '비쌈';
  cookingTime?: string;
  tags: string[];
}

// 추천 결과 타입
interface MealSuggestionResult {
  mealType: MealType;
  suggestions: SuggestedFood[];
  contextMessage: string; // "피부 수분 부족 → 수분 많은 음식 추천" 등
  totalCalories: number;
}

export interface MealSuggestionCardProps {
  /** 영양 목표 */
  goal: NutritionGoal;
  /** 현재 섭취 칼로리 */
  consumedCalories: number;
  /** 목표 칼로리 */
  targetCalories: number;
  /** 알레르기 */
  allergies?: string[];
  /** 피부 고민 (S-1 연동) */
  skinConcerns?: string[];
  /** 체형 타입 (C-1 연동) */
  bodyType?: string;
}

// 신호등별 색상
const TRAFFIC_LIGHT_COLORS: Record<TrafficLight, string> = {
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-amber-100 text-amber-700 border-amber-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

// 가격대 아이콘
const PRICE_ICONS: Record<string, string> = {
  저렴: '💰',
  보통: '💰💰',
  비쌈: '💰💰💰',
};

/**
 * 추천 음식 아이템
 */
function SuggestedFoodItem({ food }: { food: SuggestedFood }) {
  return (
    <div
      className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
      data-testid={`suggested-food-${food.name}`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-semibold text-foreground">{food.name}</h4>
          <p className="text-xs text-muted-foreground">{food.description}</p>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border',
            TRAFFIC_LIGHT_COLORS[food.trafficLight]
          )}
        >
          {selectByKey(food.trafficLight, { green: '좋음', yellow: '보통' }, '주의')}
        </span>
      </div>

      {/* 영양 정보 */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-500" />
          {food.calories}kcal
        </span>
        <span>단백질 {food.protein}g</span>
        <span>탄수화물 {food.carbs}g</span>
      </div>

      {/* 추천 이유 */}
      <div className="flex items-start gap-1 text-xs text-green-600 bg-green-50 rounded-lg p-2 mb-2">
        <ThumbsUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>{food.reason}</span>
      </div>

      {/* 구하기 정보 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">📍 {food.whereToGet}</span>
        <span className="text-muted-foreground">
          {PRICE_ICONS[food.priceRange]} {food.priceRange}
        </span>
      </div>

      {/* 조리 시간 (있는 경우) */}
      {food.cookingTime && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Clock className="w-3 h-3" />
          <span>조리시간: {food.cookingTime}</span>
        </div>
      )}

      {/* 태그 */}
      {food.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {food.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MealSuggestionCard 메인 컴포넌트
 */
export default function MealSuggestionCard({
  goal,
  consumedCalories,
  targetCalories,
  allergies = [],
  skinConcerns = [],
  bodyType,
}: MealSuggestionCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MealSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remainingCalories = targetCalories - consumedCalories;

  // 현재 식사 시간대 추론
  const getCurrentMealType = (): MealType => {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 20) return 'dinner';
    return 'snack';
  };

  // AI 추천 요청
  const handleGetSuggestion = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mealType = getCurrentMealType();

      const response = await fetch('/api/nutrition/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          mealType,
          remainingCalories,
          allergies,
          skinConcerns,
          bodyType,
        }),
      });

      if (!response.ok) {
        throw new Error('추천을 불러오는데 실패했어요');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('[MealSuggestionCard] Error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요');
    } finally {
      setIsLoading(false);
    }
  }, [goal, remainingCalories, allergies, skinConcerns, bodyType]);

  // 아직 추천 요청 전
  if (!result && !isLoading && !error) {
    return (
      <div
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-indigo-100"
        data-testid="meal-suggestion-card"
      >
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-full mb-3">
            <ChefHat className="w-7 h-7 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">오늘 뭐 먹지?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            남은 칼로리:{' '}
            <span className="font-medium text-indigo-600">
              {remainingCalories.toLocaleString()}kcal
            </span>
          </p>

          {/* 연동 컨텍스트 표시 */}
          {(skinConcerns.length > 0 || bodyType) && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {skinConcerns.length > 0 && (
                <span className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full">
                  ✨ 피부 고민 반영
                </span>
              )}
              {bodyType && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                  💪 체형 맞춤
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleGetSuggestion}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            AI 추천 받기
          </button>

          <p className="text-xs text-muted-foreground mt-3">
            🍚 구하기 쉽고 가성비 좋은 음식을 추천해 드려요
          </p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 shadow-sm border border-indigo-100"
        data-testid="meal-suggestion-loading"
      >
        <div className="text-center py-8">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">맞춤 메뉴를 찾고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div
        className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 shadow-sm border border-red-100"
        data-testid="meal-suggestion-error"
      >
        <div className="text-center py-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={handleGetSuggestion}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 결과 표시
  if (result) {
    const mealTypeLabels: Record<MealType, string> = {
      breakfast: '아침',
      lunch: '점심',
      dinner: '저녁',
      snack: '간식',
    };

    return (
      <div
        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 shadow-sm border border-indigo-100"
        data-testid="meal-suggestion-result"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-foreground">
              {mealTypeLabels[result.mealType]} 추천
            </h3>
          </div>
          <button
            onClick={handleGetSuggestion}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
            disabled={isLoading}
          >
            <RefreshCw className="w-3 h-3" />
            다시 추천
          </button>
        </div>

        {/* 컨텍스트 메시지 */}
        {result.contextMessage && (
          <div className="flex items-start gap-2 text-xs text-indigo-600 bg-indigo-100/50 rounded-lg p-2 mb-3">
            <Leaf className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{result.contextMessage}</span>
          </div>
        )}

        {/* 추천 음식 목록 */}
        <div className="space-y-3">
          {result.suggestions.map((food, index) => (
            <SuggestedFoodItem key={`${food.name}-${index}`} food={food} />
          ))}
        </div>

        {/* 총 칼로리 */}
        <div className="mt-3 pt-3 border-t border-indigo-200/50 text-center">
          <span className="text-sm text-muted-foreground">
            총{' '}
            <span className="font-medium text-indigo-600">
              {result.totalCalories.toLocaleString()}kcal
            </span>{' '}
            / 남은 {remainingCalories.toLocaleString()}kcal
          </span>
        </div>

        {/* 안내 */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          💡 편의점, 마트, 식당에서 쉽게 구할 수 있는 메뉴예요
        </p>
      </div>
    );
  }

  return null;
}
