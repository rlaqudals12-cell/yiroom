/**
 * N-1 영양 대시보드 페이지 (Task 3.1)
 *
 * 상세 영양 분석 대시보드:
 * - 영양소별 진행률 (칼로리, 탄수화물, 단백질, 지방)
 * - 음식 신호등 현황 (초록/노랑/빨강 비율)
 * - 수분 섭취 현황
 * - AI 영양 인사이트 (향후 구현)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Droplets, Utensils, AlertCircle, Plus, Coffee } from 'lucide-react';

// 영양소 진행률 타입
interface NutritionProgress {
  current: number;
  target: number;
  percentage: number;
}

// 신호등 요약 타입
interface TrafficLightSummary {
  green: number;
  yellow: number;
  red: number;
  total: number;
}

// 대시보드 데이터 타입
interface DashboardData {
  calories: NutritionProgress;
  carbs: NutritionProgress;
  protein: NutritionProgress;
  fat: NutritionProgress;
  trafficLight: TrafficLightSummary;
  water: {
    current: number;
    target: number;
    percentage: number;
  };
}

// 기본 목표값
const DEFAULT_TARGETS = {
  calories: 2000,
  carbs: 250,
  protein: 80,
  fat: 65,
  water: 2000,
};

export default function NutritionDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingWater, setIsAddingWater] = useState(false);

  // 대시보드 데이터 로드
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 병렬로 API 호출
      const [mealsRes, waterRes, settingsRes] = await Promise.all([
        fetch('/api/nutrition/meals'),
        fetch('/api/nutrition/water'),
        fetch('/api/nutrition/settings'),
      ]);

      if (!mealsRes.ok || !waterRes.ok) {
        throw new Error('데이터를 불러오지 못했어요');
      }

      const mealsData = await mealsRes.json();
      const waterData = await waterRes.json();
      const settingsData = settingsRes.ok ? await settingsRes.json() : null;

      // 목표값 설정 (설정이 있으면 사용, 없으면 기본값)
      const targets = {
        calories: settingsData?.data?.daily_calorie_target || DEFAULT_TARGETS.calories,
        carbs: settingsData?.data?.carbs_target || DEFAULT_TARGETS.carbs,
        protein: settingsData?.data?.protein_target || DEFAULT_TARGETS.protein,
        fat: settingsData?.data?.fat_target || DEFAULT_TARGETS.fat,
        water: DEFAULT_TARGETS.water,
      };

      // 영양소 요약
      const summary = mealsData.summary || {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };

      // 신호등 요약 계산
      const trafficLight: TrafficLightSummary = mealsData.trafficLightSummary || {
        green: 0,
        yellow: 0,
        red: 0,
        total: 0,
      };

      // 신호등이 없으면 meals에서 계산
      if (trafficLight.total === 0 && mealsData.meals) {
        mealsData.meals.forEach(
          (meal: { records: Array<{ foods: Array<{ traffic_light?: string }> }> }) => {
            meal.records?.forEach((record) => {
              record.foods?.forEach((food) => {
                if (food.traffic_light === 'green') trafficLight.green++;
                else if (food.traffic_light === 'yellow') trafficLight.yellow++;
                else if (food.traffic_light === 'red') trafficLight.red++;
                trafficLight.total++;
              });
            });
          }
        );
      }

      // 진행률 계산 함수
      const calcProgress = (current: number, target: number): NutritionProgress => ({
        current,
        target,
        percentage: target > 0 ? Math.round((current / target) * 100) : 0,
      });

      // 대시보드 데이터 구성
      setData({
        calories: calcProgress(summary.totalCalories, targets.calories),
        carbs: calcProgress(summary.totalCarbs, targets.carbs),
        protein: calcProgress(summary.totalProtein, targets.protein),
        fat: calcProgress(summary.totalFat, targets.fat),
        trafficLight,
        water: {
          current: waterData.totalEffectiveMl || 0,
          target: targets.water,
          percentage: Math.round(((waterData.totalEffectiveMl || 0) / targets.water) * 100),
        },
      });
    } catch (err) {
      console.error(
        '[Dashboard] Fetch error:',
        err instanceof Error ? err.message : 'Unknown error'
      );
      setError('데이터를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 수분 섭취 빠른 추가
  const handleAddWater = useCallback(
    async (drinkType: string, amountMl: number) => {
      if (isAddingWater) return;
      setIsAddingWater(true);

      try {
        const res = await fetch('/api/nutrition/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drinkType, amountMl }),
        });

        if (!res.ok) {
          throw new Error('수분 기록 추가에 실패했어요');
        }

        // 데이터 새로고침
        await fetchDashboardData();
      } catch (err) {
        console.error(
          '[Dashboard] Add water error:',
          err instanceof Error ? err.message : 'Unknown error'
        );
      } finally {
        setIsAddingWater(false);
      }
    },
    [isAddingWater, fetchDashboardData]
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div data-testid="dashboard-loading" className="min-h-screen bg-muted p-4">
        <div className="mx-auto max-w-md space-y-4">
          {/* 헤더 스켈레톤 */}
          <div className="h-12 bg-muted-foreground/20 rounded-lg animate-pulse" />
          {/* 카드 스켈레톤 */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted-foreground/20 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div data-testid="nutrition-dashboard" className="min-h-screen bg-muted p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-red-50 dark:bg-red-950/50 p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
            <h2 className="mb-2 text-lg font-bold text-red-900 dark:text-red-100">
              데이터를 불러오지 못했어요
            </h2>
            <p className="mb-4 text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="rounded-lg bg-red-500 dark:bg-red-600 px-4 py-2 text-white hover:bg-red-600 dark:hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="nutrition-dashboard" className="min-h-screen bg-muted">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              aria-label="뒤로가기"
              className="rounded-full p-2 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">영양 대시보드</h1>
          </div>
          <button
            onClick={fetchDashboardData}
            aria-label="새로고침"
            className="rounded-full p-2 hover:bg-muted"
          >
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* 콘텐츠 */}
      <div className="mx-auto max-w-md space-y-4 p-4">
        {/* 영양소 진행률 섹션 */}
        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <span>📊</span> 오늘의 영양 분석
          </h2>

          <div className="space-y-4">
            {/* 칼로리 */}
            <NutritionProgressBar
              testId="calorie-progress"
              label="칼로리"
              current={data?.calories.current || 0}
              target={data?.calories.target || DEFAULT_TARGETS.calories}
              unit="kcal"
              color="green"
            />

            {/* 탄수화물 */}
            <NutritionProgressBar
              testId="carbs-progress"
              label="탄수화물"
              current={data?.carbs.current || 0}
              target={data?.carbs.target || DEFAULT_TARGETS.carbs}
              unit="g"
              color="amber"
            />

            {/* 단백질 */}
            <NutritionProgressBar
              testId="protein-progress"
              label="단백질"
              current={data?.protein.current || 0}
              target={data?.protein.target || DEFAULT_TARGETS.protein}
              unit="g"
              color="blue"
              warning={data?.protein.percentage !== undefined && data.protein.percentage < 60}
            />

            {/* 지방 */}
            <NutritionProgressBar
              testId="fat-progress"
              label="지방"
              current={data?.fat.current || 0}
              target={data?.fat.target || DEFAULT_TARGETS.fat}
              unit="g"
              color="rose"
            />
          </div>

          {/* AI 인사이트 (단백질 부족 시) */}
          {data?.protein.percentage !== undefined && data.protein.percentage < 60 && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                💡 단백질이 부족해요! 닭가슴살 100g 또는 계란 2개를 추가해보세요.
              </p>
            </div>
          )}
        </section>

        {/* 음식 신호등 현황 */}
        <section data-testid="traffic-light-summary" className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <span>🚦</span> 오늘의 음식 신호등
          </h2>

          {data?.trafficLight.total === 0 ? (
            <p className="text-center text-muted-foreground py-4">아직 기록된 음식이 없어요</p>
          ) : (
            <>
              {/* 신호등 바 */}
              <div
                className="mb-4 flex h-6 overflow-hidden rounded-full"
                role="img"
                aria-label={`음식 신호등: 초록 ${data?.trafficLight.green || 0}개, 노랑 ${data?.trafficLight.yellow || 0}개, 빨강 ${data?.trafficLight.red || 0}개`}
              >
                {data?.trafficLight.green && data.trafficLight.green > 0 && (
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(data.trafficLight.green / data.trafficLight.total) * 100}%`,
                    }}
                  />
                )}
                {data?.trafficLight.yellow && data.trafficLight.yellow > 0 && (
                  <div
                    className="bg-yellow-400"
                    style={{
                      width: `${(data.trafficLight.yellow / data.trafficLight.total) * 100}%`,
                    }}
                  />
                )}
                {data?.trafficLight.red && data.trafficLight.red > 0 && (
                  <div
                    className="bg-red-500"
                    style={{
                      width: `${(data.trafficLight.red / data.trafficLight.total) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* 신호등 레이블 */}
              <div className="flex justify-around text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-foreground/80">
                    초록 {data?.trafficLight.green || 0}개
                    <span className="ml-1 text-muted-foreground">
                      (
                      {Math.round(
                        ((data?.trafficLight.green || 0) / (data?.trafficLight.total || 1)) * 100
                      )}
                      %)
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="text-foreground/80">
                    노랑 {data?.trafficLight.yellow || 0}개
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-foreground/80">빨강 {data?.trafficLight.red || 0}개</span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 수분 섭취 현황 */}
        <section data-testid="water-intake-section" className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <Droplets className="h-5 w-5 text-blue-500" />
            수분 섭취
          </h2>

          {/* 물방울 아이콘 표시 */}
          <div
            className="mb-3 flex justify-center gap-1"
            role="img"
            aria-label={`수분 섭취 진행률 ${data?.water.percentage || 0}%`}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={`text-2xl ${
                  i < Math.ceil((data?.water.percentage || 0) / 10) ? 'opacity-100' : 'opacity-30'
                }`}
              >
                💧
              </span>
            ))}
          </div>

          {/* 수분 수치 */}
          <p className="mb-4 text-center text-lg font-semibold text-foreground">
            {(data?.water.current || 0).toLocaleString()}mL /{' '}
            {(data?.water.target || DEFAULT_TARGETS.water).toLocaleString()}mL
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({data?.water.percentage || 0}%)
            </span>
          </p>

          {/* 수분 빠른 추가 버튼 */}
          <div data-testid="water-quick-add" className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAddWater('water', 250)}
              disabled={isAddingWater}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />물 1컵 (250mL)
            </button>
            <button
              onClick={() => handleAddWater('water', 500)}
              disabled={isAddingWater}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              <Plus className="h-4 w-4" />물 1병 (500mL)
            </button>
            <button
              onClick={() => handleAddWater('coffee', 200)}
              disabled={isAddingWater}
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              <Coffee className="h-4 w-4" />
              커피 1잔
            </button>
            <button
              onClick={() => router.push('/nutrition/water')}
              className="flex items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              직접 입력
            </button>
          </div>
        </section>

        {/* 식단 기록 바로가기 */}
        <button
          onClick={() => router.push('/nutrition')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 font-semibold text-white shadow-sm transition-colors hover:bg-green-600"
        >
          <Utensils className="h-5 w-5" />
          식단 기록하기
        </button>
      </div>
    </div>
  );
}

/**
 * 영양소 진행률 바 컴포넌트
 */
function NutritionProgressBar({
  testId,
  label,
  current,
  target,
  unit,
  color,
  warning = false,
}: {
  testId: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  color: 'green' | 'amber' | 'blue' | 'rose';
  warning?: boolean;
}) {
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  const colorClasses = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
  };

  return (
    <div data-testid={testId}>
      <div className="mb-1 flex items-center justify-between">
        <span id={`${testId}-label`} className="text-sm font-medium text-foreground/80">
          {label}
          {warning && (
            <span className="ml-1 text-amber-500" aria-label="부족">
              ⚠️
            </span>
          )}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(current)}
          {unit} / {target}
          {unit} ({percentage}%)
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={`${testId}-label`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
