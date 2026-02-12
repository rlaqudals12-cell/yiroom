/**
 * N-1 식단 히스토리 페이지 (Task 2.13)
 *
 * 과거 식단 기록을 조회하는 화면
 * - 날짜 선택 및 네비게이션
 * - 일일 영양 요약
 * - 식사별 기록 표시
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common';
import { cn } from '@/lib/utils';

// 타입 정의
interface MealFood {
  food_name: string;
  portion?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  traffic_light?: 'green' | 'yellow' | 'red';
}

interface MealRecord {
  id: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  foods: MealFood[];
  created_at: string;
}

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

interface HistoryResponse {
  date: string;
  summary: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    mealCount: number;
  };
  meals: MealData[];
}

// 날짜 포맷 함수
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (formatDate(date) === formatDate(today)) {
    return '오늘';
  }
  if (formatDate(date) === formatDate(yesterday)) {
    return '어제';
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];

  return `${month}월 ${day}일 (${weekday})`;
}

export default function NutritionHistoryPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 오늘 날짜인지 확인
  const isToday = useMemo(() => {
    return formatDate(selectedDate) === formatDate(new Date());
  }, [selectedDate]);

  // 히스토리 데이터 로드
  const fetchHistory = useCallback(
    async (date: Date) => {
      setIsLoading(true);
      setError(null);

      try {
        const dateStr = formatDate(date);
        const response = await fetch(`/api/nutrition/meals?date=${dateStr}`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/sign-in');
            return;
          }
          throw new Error('데이터를 불러오는 데 실패했어요.');
        }

        const result: HistoryResponse = await response.json();
        setData(result);
      } catch (err) {
        console.error('[History Page] Fetch error:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // 초기 데이터 로드
  useEffect(() => {
    fetchHistory(selectedDate);
  }, [fetchHistory, selectedDate]);

  // 이전 날짜로 이동
  const handlePrevDate = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  // 다음 날짜로 이동
  const handleNextDate = useCallback(() => {
    if (isToday) return;
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, [isToday]);

  // 뒤로가기
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // 기록 있는 식사만 필터링
  const mealsWithRecords = useMemo(() => {
    if (!data?.meals) return [];
    return data.meals.filter((meal) => meal.records.length > 0);
  }, [data]);

  // 기록이 없는지 확인
  const hasNoRecords = useMemo(() => {
    return data?.summary?.mealCount === 0;
  }, [data]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="history-loading">
        {/* 헤더 스켈레톤 */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
          <div className="w-32 h-6 bg-muted animate-pulse rounded" />
          <div className="w-8 h-8" /> {/* 균형 맞추기 */}
        </div>

        {/* 날짜 스켈레톤 */}
        <div className="flex items-center justify-center gap-4">
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
          <div className="w-40 h-8 bg-muted animate-pulse rounded" />
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
        </div>

        {/* 요약 스켈레톤 */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
          <div className="w-32 h-10 bg-muted animate-pulse rounded mx-auto mb-4" />
          <div className="flex justify-around">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-16 h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>

        {/* 식사 섹션 스켈레톤 */}
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="w-20 h-5 bg-muted animate-pulse rounded" />
              </div>
              <div className="w-full h-12 bg-muted animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-6" data-testid="nutrition-history-page">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">식단 히스토리</h1>
          <div className="w-9" /> {/* 균형 맞추기 */}
        </div>

        {/* 에러 메시지 */}
        <div className="bg-red-50 dark:bg-red-950/50 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            데이터를 불러올 수 없어요
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">오류가 발생했어요.</p>
          <Button onClick={() => fetchHistory(selectedDate)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6" data-testid="nutrition-history-page">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">식단 히스토리</h1>
        <div className="w-9" /> {/* 균형 맞추기 */}
      </div>

      {/* 날짜 네비게이션 */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handlePrevDate}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="이전 날짜"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          className="px-6 py-2 bg-muted rounded-full font-medium min-w-[160px] text-center"
          data-testid="selected-date"
        >
          {formatDisplayDate(formatDate(selectedDate))}
        </div>

        <button
          onClick={handleNextDate}
          className={cn(
            'p-2 rounded-full transition-colors',
            isToday ? 'text-muted-foreground/50 cursor-not-allowed' : 'hover:bg-muted'
          )}
          aria-label="다음 날짜"
          disabled={isToday}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* 일일 요약 */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-foreground">
            {data?.summary?.totalCalories?.toLocaleString() || 0}
            <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {data?.summary?.mealCount || 0}끼 식사
          </div>
        </div>

        {/* 영양소 막대 */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">탄수화물</div>
            <div className="font-semibold text-foreground">{data?.summary?.totalCarbs || 0}g</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">단백질</div>
            <div className="font-semibold text-foreground">{data?.summary?.totalProtein || 0}g</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">지방</div>
            <div className="font-semibold text-foreground">{data?.summary?.totalFat || 0}g</div>
          </div>
        </div>
      </div>

      {/* 기록이 없는 경우 */}
      {hasNoRecords ? (
        <EmptyState
          type="nutrition"
          title="이 날에는 기록이 없어요"
          description="식단을 기록하면 영양 분석을 받을 수 있어요"
          ctaText="식단 기록하기"
          ctaHref="/nutrition"
        />
      ) : (
        /* 식사별 기록 */
        <div className="space-y-3">
          {mealsWithRecords.map((meal) => (
            <div
              key={meal.type}
              className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
            >
              {/* 식사 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meal.icon}</span>
                  <span className="font-medium">{meal.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {meal.subtotal.calories.toLocaleString()} kcal
                </span>
              </div>

              {/* 음식 목록 */}
              <div className="space-y-2">
                {meal.records.flatMap((record) =>
                  record.foods.map((food, idx) => (
                    <div
                      key={`${record.id}-${idx}`}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        {food.traffic_light && (
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              food.traffic_light === 'green' && 'bg-green-500',
                              food.traffic_light === 'yellow' && 'bg-yellow-500',
                              food.traffic_light === 'red' && 'bg-red-500'
                            )}
                          />
                        )}
                        <span className="text-foreground">{food.food_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{food.calories} kcal</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
