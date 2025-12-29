/**
 * N-1 식단 기록 메인 페이지 (Task 2.7, 2.9, 3.7, 3.8, 3.9)
 *
 * 오늘의 식단 현황을 표시하는 메인 대시보드
 * - 상단: 오늘의 칼로리 요약 (원형 차트)
 * - 중단: 식사별 기록 (아침/점심/저녁/간식)
 * - 중단: 수분 섭취 현황 (Task 2.9)
 * - 중단: S-1 피부 연동 인사이트 (Task 3.7)
 * - 중단: W-1 운동 연동 인사이트 (Task 3.8)
 * - 중단: C-1 체형 연동 인사이트 (Task 3.9)
 * - 하단: 빠른 액션 버튼 바
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, AlertCircle, Utensils, Loader2 } from 'lucide-react';
import {
  DailyCalorieSummary,
  MealSectionList,
  QuickActionBar,
  FloatingCameraButton,
  WaterIntakeCard,
  CalorieSurplusAlert,
  type DrinkType,
  type ManualFoodData,
  HYDRATION_FACTORS,
} from '@/components/nutrition';
import {
  WaterInputSheetDynamic,
  ManualFoodInputSheetDynamic,
  FastingTimerDynamic,
  SkinInsightCardDynamic,
  WorkoutInsightCardDynamic,
  BodyInsightCardDynamic,
  MealSuggestionCardDynamic,
} from '@/components/nutrition/dynamic';
import type { NutritionGoal } from '@/types/nutrition';
import { Button } from '@/components/ui/button';
import {
  convertSkinMetricsToSummary,
  type SkinAnalysisSummary,
} from '@/lib/nutrition/skinInsight';
import {
  createWorkoutSummary,
  type WorkoutSummary,
} from '@/lib/nutrition/workoutInsight';
import {
  convertBodyAnalysisToData,
  type BodyAnalysisData,
} from '@/lib/nutrition/bodyInsight';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { MetricStatus } from '@/lib/mock/skin-analysis';

// API 응답 타입
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
  ai_recognized_food?: string;
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

interface DailyMealsResponse {
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

// 기본 목표 (향후 nutrition_settings에서 가져올 예정)
const DEFAULT_CALORIE_GOAL = 2000;
const DEFAULT_WATER_GOAL = 2000; // ml

export default function NutritionPage() {
  const router = useRouter();

  // 온보딩 완료 여부 상태
  const [hasSettings, setHasSettings] = useState<boolean | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  const [data, setData] = useState<DailyMealsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waterAmount, setWaterAmount] = useState(0); // 오늘 물 섭취량 (ml)
  const [isWaterSheetOpen, setIsWaterSheetOpen] = useState(false); // 수분 입력 시트 열림 상태
  const [isWaterLoading, setIsWaterLoading] = useState(false); // 수분 데이터 로딩 상태
  const [isWaterSaving, setIsWaterSaving] = useState(false); // 수분 저장 중 상태
  const [isManualInputOpen, setIsManualInputOpen] = useState(false); // 음식 직접 입력 시트 열림 상태 (Task 2.11)
  const [isManualSaving, setIsManualSaving] = useState(false); // 음식 직접 입력 저장 중 상태
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 향후 MealSection에서 직접 입력 연결 시 사용
  const [selectedMealTypeForManual, setSelectedMealTypeForManual] = useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack'
  >('lunch'); // 직접 입력 시 선택된 식사 타입

  // 간헐적 단식 설정 상태 (Task 2.17)
  const [fastingSettings, setFastingSettings] = useState<{
    enabled: boolean;
    fastingType: '16:8' | '18:6' | '20:4' | 'custom' | null;
    fastingStartTime: string | null;
    eatingWindowHours: number | null;
  }>({
    enabled: false,
    fastingType: null,
    fastingStartTime: null,
    eatingWindowHours: null,
  });

  // S-1 피부 연동 인사이트 상태 (Task 3.7)
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisSummary | null>(null);
  const [isSkinLoading, setIsSkinLoading] = useState(false);

  // W-1 운동 연동 인사이트 상태 (Task 3.8)
  const [workoutSummary, setWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [isWorkoutLoading, setIsWorkoutLoading] = useState(false);

  // C-1 체형 연동 인사이트 상태 (Task 3.9)
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysisData | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [isBodyLoading, setIsBodyLoading] = useState(false);

  // 영양 목표 상태 (오늘 뭐 먹지? 연동용)
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>('health');

  const supabase = useClerkSupabaseClient();

  // 오늘의 식단 데이터 로드
  const fetchTodayMeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nutrition/meals');

      if (!response.ok) {
        if (response.status === 401) {
          // 인증 필요
          router.push('/sign-in');
          return;
        }
        throw new Error('식단 정보를 불러오는데 실패했습니다.');
      }

      const result: DailyMealsResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error('[Nutrition Page] Fetch error:', err);
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // 오늘의 수분 섭취 데이터 로드
  const fetchTodayWater = useCallback(async () => {
    setIsWaterLoading(true);
    try {
      const response = await fetch('/api/nutrition/water');
      if (response.ok) {
        const result = await response.json();
        setWaterAmount(result.totalEffectiveMl || 0);
      }
    } catch (err) {
      console.error('[Nutrition Page] Water fetch error:', err);
    } finally {
      setIsWaterLoading(false);
    }
  }, []);

  // 영양 설정 및 간헐적 단식 설정 로드 (Task 2.17 + P3-2.2)
  const fetchNutritionSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const response = await fetch('/api/nutrition/settings');
      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        if (data) {
          // 설정이 존재함 (온보딩 완료)
          setHasSettings(true);
          setFastingSettings({
            enabled: data.fasting_enabled ?? false,
            fastingType: data.fasting_type ?? null,
            fastingStartTime: data.fasting_start_time ?? null,
            eatingWindowHours: data.eating_window_hours ?? null,
          });
          // 영양 목표 설정 (오늘 뭐 먹지? 연동용)
          if (data.goal) {
            setNutritionGoal(data.goal as NutritionGoal);
          }
        } else {
          // 설정이 없음 (온보딩 미완료)
          setHasSettings(false);
        }
      } else if (response.status === 404) {
        // 설정이 없음 (온보딩 미완료)
        setHasSettings(false);
      }
    } catch (err) {
      console.error('[Nutrition Page] Settings fetch error:', err);
      setHasSettings(false);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // S-1 피부 분석 데이터 로드 (Task 3.7)
  const fetchSkinAnalysis = useCallback(async () => {
    setIsSkinLoading(true);
    try {
      const { data: skinData, error } = await supabase
        .from('skin_analyses')
        .select('metrics')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !skinData) {
        // 피부 분석 없음
        setSkinAnalysis(null);
        return;
      }

      // metrics 배열을 SkinAnalysisSummary로 변환
      if (skinData.metrics && Array.isArray(skinData.metrics)) {
        const metricsArray = skinData.metrics as Array<{ id: string; status: MetricStatus }>;
        const summary = convertSkinMetricsToSummary(metricsArray);
        setSkinAnalysis(summary);
      }
    } catch (err) {
      console.error('[Nutrition Page] Skin analysis fetch error:', err);
      setSkinAnalysis(null);
    } finally {
      setIsSkinLoading(false);
    }
  }, [supabase]);

  // W-1 운동 기록 데이터 로드 (Task 3.8)
  const fetchWorkoutData = useCallback(async () => {
    setIsWorkoutLoading(true);
    try {
      // 오늘 날짜의 운동 기록 조회
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data: workoutLogs, error } = await supabase
        .from('workout_logs')
        .select('completed_at, actual_duration, actual_calories')
        .gte('completed_at', startOfDay)
        .lt('completed_at', endOfDay);

      if (error || !workoutLogs) {
        setWorkoutSummary(null);
        return;
      }

      // 운동 기록을 요약으로 변환
      const summary = createWorkoutSummary(workoutLogs);
      setWorkoutSummary(summary);
    } catch (err) {
      console.error('[Nutrition Page] Workout data fetch error:', err);
      setWorkoutSummary(null);
    } finally {
      setIsWorkoutLoading(false);
    }
  }, [supabase]);

  // C-1 체형 분석 데이터 로드 (Task 3.9)
  const fetchBodyAnalysis = useCallback(async () => {
    setIsBodyLoading(true);
    try {
      // body_analyses 테이블의 실제 컬럼만 조회
      const { data: bodyData, error } = await supabase
        .from('body_analyses')
        .select('body_type, height, weight, shoulder, waist, hip, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !bodyData) {
        // 체형 분석 없음
        setBodyAnalysis(null);
        setCurrentWeight(null);
        return;
      }

      // DB 결과를 BodyAnalysisData로 변환
      const analysisData = convertBodyAnalysisToData(bodyData);
      setBodyAnalysis(analysisData);

      // 체형 분석 시 입력한 체중을 현재 체중으로 사용
      if (bodyData.weight) {
        setCurrentWeight(bodyData.weight);
      } else {
        setCurrentWeight(null);
      }
    } catch (err) {
      console.error('[Nutrition Page] Body analysis fetch error:', err);
      setBodyAnalysis(null);
      setCurrentWeight(null);
    } finally {
      setIsBodyLoading(false);
    }
  }, [supabase]);

  // 수분 추가 핸들러 (빠른 추가)
  const handleWaterQuickAdd = useCallback(
    async (amount: number, drinkType: DrinkType) => {
      const hydrationFactor = HYDRATION_FACTORS[drinkType];
      const effectiveMl = Math.round(amount * hydrationFactor);

      try {
        const response = await fetch('/api/nutrition/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drinkType,
            amountMl: amount,
          }),
        });

        if (response.ok) {
          // 성공 시 수분량 업데이트
          setWaterAmount((prev) => prev + effectiveMl);
        } else {
          console.error('[Nutrition Page] Water add failed');
        }
      } catch (err) {
        console.error('[Nutrition Page] Water add error:', err);
      }
    },
    []
  );

  // 수분 추가 핸들러 (직접 입력 시트)
  const handleWaterAdd = useCallback(
    async (amount: number, drinkType: DrinkType, effectiveMl: number) => {
      setIsWaterSaving(true);
      try {
        const response = await fetch('/api/nutrition/water', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drinkType,
            amountMl: amount,
          }),
        });

        if (response.ok) {
          setWaterAmount((prev) => prev + effectiveMl);
          setIsWaterSheetOpen(false);
        } else {
          console.error('[Nutrition Page] Water add failed');
        }
      } catch (err) {
        console.error('[Nutrition Page] Water add error:', err);
      } finally {
        setIsWaterSaving(false);
      }
    },
    []
  );

  // 음식 직접 입력 저장 핸들러 (Task 2.11)
  const handleManualFoodSave = useCallback(
    async (foodData: ManualFoodData) => {
      setIsManualSaving(true);
      try {
        const response = await fetch('/api/nutrition/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordType: 'manual',
            mealType: foodData.mealType,
            foods: [
              {
                name: foodData.name,
                portion: foodData.portion,
                calories: foodData.calories,
                protein: foodData.protein,
                carbs: foodData.carbs,
                fat: foodData.fat,
                trafficLight: foodData.trafficLight,
              },
            ],
          }),
        });

        if (response.ok) {
          // TODO: Task 2.15에서 saveAsFavorite 처리 구현
          // if (foodData.saveAsFavorite) {
          //   await fetch('/api/nutrition/favorites', { method: 'POST', ... });
          // }
          setIsManualInputOpen(false);
          // 식단 데이터 새로고침
          fetchTodayMeals();
        } else {
          console.error('[Nutrition Page] Manual food save failed');
        }
      } catch (err) {
        console.error('[Nutrition Page] Manual food save error:', err);
      } finally {
        setIsManualSaving(false);
      }
    },
    [fetchTodayMeals]
  );

  // 초기 데이터 로드
  useEffect(() => {
    fetchNutritionSettings();
    fetchTodayMeals();
    fetchTodayWater();
    fetchSkinAnalysis();
    fetchWorkoutData();
    fetchBodyAnalysis();
  }, [fetchNutritionSettings, fetchTodayMeals, fetchTodayWater, fetchSkinAnalysis, fetchWorkoutData, fetchBodyAnalysis]);

  // 식사 기록 추가 핸들러
  const handleAddRecord = useCallback(
    (mealType: string) => {
      // 식사 타입을 세션에 저장하고 사진 촬영 페이지로 이동
      sessionStorage.setItem('selectedMealType', mealType);
      router.push('/nutrition/food-capture');
    },
    [router]
  );

  // 기록 클릭 핸들러 (상세 보기)
  const handleRecordClick = useCallback(
    (record: MealRecord) => {
      // 향후 기록 상세/수정 페이지로 이동
      console.log('[Nutrition Page] Record clicked:', record.id);
      // router.push(`/nutrition/record/${record.id}`);
    },
    []
  );

  // 빠른 액션 핸들러
  const handleQuickAction = useCallback(
    (type: 'camera' | 'search' | 'barcode' | 'water') => {
      switch (type) {
        case 'camera':
          router.push('/nutrition/food-capture');
          break;
        case 'search':
          // 음식 직접 입력 시트 열기 (Task 2.11)
          setIsManualInputOpen(true);
          break;
        case 'barcode':
          // 바코드 스캔 페이지로 이동
          router.push('/nutrition/barcode');
          break;
        case 'water':
          // 물 빠른 추가 (250ml)
          handleWaterQuickAdd(250, 'water');
          break;
      }
    },
    [router, handleWaterQuickAdd]
  );

  // 플로팅 카메라 버튼 핸들러
  const handleCameraClick = useCallback(() => {
    router.push('/nutrition/food-capture');
  }, [router]);

  // 설정 로딩 상태
  if (isSettingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" data-testid="nutrition-page-loading">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 온보딩 미완료 시 유도 UI
  if (hasSettings === false) {
    return <NutritionOnboardingPrompt />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-6" data-testid="nutrition-page-error">
        <div className="bg-red-50 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-red-900 mb-2">
            데이터를 불러올 수 없습니다
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchTodayMeals} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20" data-testid="nutrition-page">
      {/* 오늘의 칼로리 요약 */}
      <DailyCalorieSummary
        summary={
          data?.summary || {
            totalCalories: 0,
            totalProtein: 0,
            totalCarbs: 0,
            totalFat: 0,
          }
        }
        goal={{ calories: DEFAULT_CALORIE_GOAL }}
        isLoading={isLoading}
      />

      {/* 칼로리 초과 알림 배너 (P3-5.1) */}
      <CalorieSurplusAlert
        workoutSummary={workoutSummary}
        intakeCalories={data?.summary?.totalCalories || 0}
        targetCalories={DEFAULT_CALORIE_GOAL}
        onNavigateToWorkout={() => router.push('/workout')}
        isLoading={isLoading || isWorkoutLoading}
      />

      {/* 오늘 뭐 먹지? AI 식단 추천 */}
      <MealSuggestionCardDynamic
        goal={nutritionGoal}
        consumedCalories={data?.summary?.totalCalories || 0}
        targetCalories={DEFAULT_CALORIE_GOAL}
        skinConcerns={skinAnalysis ? Object.entries(skinAnalysis)
          .filter(([, status]) => status === 'warning')
          .map(([key]) => key) : []}
        bodyType={bodyAnalysis?.bodyType}
      />

      {/* 식사별 기록 섹션 */}
      {isLoading ? (
        // 로딩 스켈레톤
        <div className="space-y-3" data-testid="meal-sections-loading">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="w-20 h-5 bg-muted animate-pulse rounded" />
              </div>
              <div className="w-full h-12 bg-muted/50 animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      ) : data?.meals ? (
        <MealSectionList
          meals={data.meals}
          onAddRecord={handleAddRecord}
          onRecordClick={handleRecordClick}
        />
      ) : null}

      {/* 수분 섭취 현황 (Task 2.9) */}
      <WaterIntakeCard
        currentAmount={waterAmount}
        goalAmount={DEFAULT_WATER_GOAL}
        isLoading={isWaterLoading}
        onQuickAdd={handleWaterQuickAdd}
        onCustomAdd={() => setIsWaterSheetOpen(true)}
      />

      {/* 간헐적 단식 타이머 (Task 2.17) - Dynamic Import */}
      <FastingTimerDynamic
        enabled={fastingSettings.enabled}
        fastingType={fastingSettings.fastingType}
        fastingStartTime={fastingSettings.fastingStartTime}
        eatingWindowHours={fastingSettings.eatingWindowHours}
      />

      {/* S-1 피부 연동 인사이트 (Task 3.7) - Dynamic Import */}
      <SkinInsightCardDynamic
        skinAnalysis={skinAnalysis}
        currentWaterMl={waterAmount}
        isLoading={isSkinLoading}
        onNavigateToSkinAnalysis={() => router.push('/analysis/skin')}
      />

      {/* W-1 운동 연동 인사이트 (Task 3.8) - Dynamic Import */}
      <WorkoutInsightCardDynamic
        workoutSummary={workoutSummary}
        intakeCalories={data?.summary?.totalCalories || 0}
        targetCalories={DEFAULT_CALORIE_GOAL}
        isLoading={isWorkoutLoading}
        onNavigateToWorkout={() => router.push('/workout')}
      />

      {/* C-1 체형 연동 인사이트 (Task 3.9) - Dynamic Import */}
      <BodyInsightCardDynamic
        bodyAnalysis={bodyAnalysis}
        currentWeight={currentWeight}
        baseCalories={DEFAULT_CALORIE_GOAL}
        isLoading={isBodyLoading}
        onNavigateToBodyAnalysis={() => router.push('/analysis/body')}
        onReanalysisClick={() => router.push('/analysis/body')}
      />

      {/* 새로고침 버튼 */}
      <div className="flex justify-center py-2">
        <button
          onClick={() => {
            fetchTodayMeals();
            fetchTodayWater();
            fetchNutritionSettings();
            fetchSkinAnalysis();
            fetchWorkoutData();
            fetchBodyAnalysis();
          }}
          disabled={isLoading || isWaterLoading || isSkinLoading || isWorkoutLoading || isBodyLoading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          aria-label="식단 정보 새로고침"
          data-testid="refresh-button"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading || isWaterLoading || isSkinLoading || isWorkoutLoading || isBodyLoading ? 'animate-spin' : ''}`}
          />
          <span>새로고침</span>
        </button>
      </div>

      {/* 하단 빠른 액션 바 */}
      <QuickActionBar
        onAction={handleQuickAction}
        waterAmount={waterAmount}
        waterGoal={2000}
      />

      {/* 플로팅 카메라 버튼 */}
      <FloatingCameraButton onClick={handleCameraClick} />

      {/* 수분 직접 입력 시트 (Task 2.9) - Dynamic Import */}
      <WaterInputSheetDynamic
        isOpen={isWaterSheetOpen}
        onClose={() => setIsWaterSheetOpen(false)}
        onAdd={handleWaterAdd}
        isSaving={isWaterSaving}
      />

      {/* 음식 직접 입력 시트 (Task 2.11) - Dynamic Import */}
      <ManualFoodInputSheetDynamic
        isOpen={isManualInputOpen}
        onClose={() => setIsManualInputOpen(false)}
        onSave={handleManualFoodSave}
        defaultMealType={selectedMealTypeForManual}
        isSaving={isManualSaving}
      />
    </div>
  );
}

/**
 * 온보딩 유도 컴포넌트 (P3-2.2)
 * - 영양 설정이 없을 때 표시
 * - workout/page.tsx의 OnboardingPrompt 패턴 참고
 */
function NutritionOnboardingPrompt() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-8" data-testid="nutrition-onboarding-prompt">
      <div className="text-center space-y-6">
        {/* 아이콘 */}
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <Utensils className="h-10 w-10 text-green-500" />
        </div>

        {/* 텍스트 */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            나만의 식단 관리
          </h2>
          <p className="text-muted-foreground">
            목표에 맞는 맞춤 칼로리와 영양소를 설정해요
          </p>
        </div>

        {/* 시작 버튼 */}
        <Link
          href="/nutrition/onboarding/step1"
          className="block w-full py-4 bg-green-500 hover:bg-green-600 text-white text-center font-medium rounded-xl transition-colors"
        >
          식단 설정 시작하기
        </Link>

        {/* 설명 */}
        <div className="text-left bg-muted rounded-xl p-4">
          <p className="text-sm text-muted-foreground font-medium mb-2">이런 기능을 사용할 수 있어요:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ 내 목표에 맞는 칼로리 계산</li>
            <li>✓ AI 음식 인식 및 영양 분석</li>
            <li>✓ 수분 섭취 트래킹</li>
            <li>✓ 간헐적 단식 타이머</li>
            <li>✓ 주간/월간 영양 리포트</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
