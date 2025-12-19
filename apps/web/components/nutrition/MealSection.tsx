/**
 * N-1 식사별 기록 섹션 컴포넌트 (Task 2.7)
 *
 * 아침/점심/저녁/간식 식사별 기록을 표시
 * - 기록이 있으면 음식 목록 표시
 * - 기록이 없으면 "+ 기록하기" 버튼 표시
 */

'use client';

import { Plus, ChevronRight } from 'lucide-react';
import { TrafficLightIndicator, type TrafficLightColor } from './TrafficLight';

// 음식 아이템 타입 (DB에서 foods JSONB 배열)
interface FoodItem {
  food_name: string;
  portion?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  traffic_light?: TrafficLightColor;
}

// 식사 기록 타입
interface MealRecord {
  id: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  foods: FoodItem[];
  created_at: string;
  ai_recognized_food?: string;
}

// 식사 섹션 데이터 타입
interface MealData {
  type: string;
  label: string;
  icon: string;
  order: number;
  records: MealRecord[];
  subtotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealSectionProps {
  /** 식사 데이터 */
  meal: MealData;
  /** 기록하기 버튼 클릭 핸들러 */
  onAddRecord?: (mealType: string) => void;
  /** 기록 클릭 핸들러 */
  onRecordClick?: (record: MealRecord) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * 스켈레톤 로딩 UI
 */
function LoadingSkeleton() {
  return (
    <div
      className="bg-card rounded-2xl p-4 shadow-sm border border-border"
      data-testid="meal-section-loading"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="w-20 h-5 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        <div className="w-full h-12 bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  );
}

export default function MealSection({
  meal,
  onAddRecord,
  onRecordClick,
  isLoading = false,
}: MealSectionProps) {
  const hasRecords = meal.records && meal.records.length > 0;

  // 로딩 상태
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className="bg-card rounded-2xl p-4 shadow-sm border border-border"
      data-testid={`meal-section-${meal.type}`}
    >
      {/* 헤더: 아이콘 + 라벨 + 칼로리 합계 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-hidden="true">
            {meal.icon}
          </span>
          <span className="text-base font-semibold text-foreground">
            {meal.label}
          </span>
        </div>
        {hasRecords && (
          <span
            className="text-sm font-medium text-muted-foreground"
            data-testid={`meal-calories-${meal.type}`}
          >
            {meal.subtotal.calories.toLocaleString()} kcal
          </span>
        )}
      </div>

      {/* 기록 목록 또는 기록하기 버튼 */}
      {hasRecords ? (
        <div className="space-y-2">
          {/* 음식 아이템 목록 */}
          {meal.records.map((record) => (
            <div key={record.id}>
              {record.foods?.map((food, idx) => (
                <button
                  key={`${record.id}-${idx}`}
                  onClick={() => onRecordClick?.(record)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
                  data-testid={`food-item-${meal.type}-${idx}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 신호등 */}
                    {food.traffic_light && (
                      <TrafficLightIndicator
                        color={food.traffic_light}
                        size="sm"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {food.food_name}
                      </p>
                      {food.portion && (
                        <p className="text-xs text-muted-foreground">{food.portion}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {food.calories.toLocaleString()} kcal
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ))}

          {/* 추가 기록하기 버튼 */}
          <button
            onClick={() => onAddRecord?.(meal.type)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            data-testid={`add-more-${meal.type}`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">추가 기록하기</span>
          </button>
        </div>
      ) : (
        /* 기록 없을 때: 기록하기 버튼 */
        <button
          onClick={() => onAddRecord?.(meal.type)}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-muted border border-dashed border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
          data-testid={`add-record-${meal.type}`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">기록하기</span>
        </button>
      )}
    </div>
  );
}

/**
 * 식사 섹션 리스트 컴포넌트
 * 모든 식사 타입을 순서대로 렌더링
 */
export function MealSectionList({
  meals,
  onAddRecord,
  onRecordClick,
  isLoading = false,
}: {
  meals: MealData[];
  onAddRecord?: (mealType: string) => void;
  onRecordClick?: (record: MealRecord) => void;
  isLoading?: boolean;
}) {
  // 순서대로 정렬
  const sortedMeals = [...meals].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3" data-testid="meal-section-list">
      {sortedMeals.map((meal) => (
        <MealSection
          key={meal.type}
          meal={meal}
          onAddRecord={onAddRecord}
          onRecordClick={onRecordClick}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
