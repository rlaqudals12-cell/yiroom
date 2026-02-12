'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import FoodResultCard from '@/components/nutrition/FoodResultCard';
import { FoodResultSkeleton } from '@/components/nutrition/FoodResultSkeleton';
import type { AnalyzedFoodItem } from '@/lib/gemini/prompts/foodAnalysis';

// 식사 타입 라벨
const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

// sessionStorage에서 가져올 데이터 타입
interface FoodAnalysisData {
  result: {
    foods: AnalyzedFoodItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    insight?: string;
  };
  mealType: string;
  usedMock: boolean;
  imageBase64: string;
}

// 각 음식별 양 조절 상태 타입
type PortionMultipliers = Record<number, number>;

/**
 * N-1 음식 분석 결과 페이지 (Task 2.5)
 *
 * 플로우:
 * 1. sessionStorage에서 분석 결과 로드
 * 2. 촬영된 사진 + 음식별 결과 카드 표시
 * 3. 양 조절 기능
 * 4. 저장 시 DB에 기록
 */
export default function FoodResultPage() {
  const router = useRouter();

  const [analysisData, setAnalysisData] = useState<FoodAnalysisData | null>(null);
  const [portionMultipliers, setPortionMultipliers] = useState<PortionMultipliers>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editNotice, setEditNotice] = useState<string | null>(null);

  // sessionStorage에서 데이터 로드
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('foodAnalysisResult');
      if (storedData) {
        const parsed = JSON.parse(storedData) as FoodAnalysisData;
        setAnalysisData(parsed);

        // 모든 음식의 초기 양을 1로 설정
        const initialMultipliers: PortionMultipliers = {};
        parsed.result.foods.forEach((_, index) => {
          initialMultipliers[index] = 1;
        });
        setPortionMultipliers(initialMultipliers);
      }
    } catch (error) {
      console.error('[Food Result] Failed to parse stored data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 양 조절 핸들러
  const handlePortionChange = useCallback((foodIndex: number, multiplier: number) => {
    setPortionMultipliers((prev) => ({
      ...prev,
      [foodIndex]: multiplier,
    }));
  }, []);

  // 조정된 총 영양소 계산
  const calculateAdjustedTotals = useCallback(() => {
    if (!analysisData) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return analysisData.result.foods.reduce(
      (totals, food, index) => {
        const multiplier = portionMultipliers[index] || 1;
        return {
          calories: totals.calories + Math.round(food.calories * multiplier),
          protein: totals.protein + Math.round(food.protein * multiplier * 10) / 10,
          carbs: totals.carbs + Math.round(food.carbs * multiplier * 10) / 10,
          fat: totals.fat + Math.round(food.fat * multiplier * 10) / 10,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [analysisData, portionMultipliers]);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!analysisData) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // 양 조절이 적용된 음식 데이터 생성
      const adjustedFoods = analysisData.result.foods.map((food, index) => {
        const multiplier = portionMultipliers[index] || 1;
        return {
          ...food,
          portion: multiplier === 1 ? food.portion : `${multiplier}인분`,
          calories: Math.round(food.calories * multiplier),
          protein: Math.round(food.protein * multiplier * 10) / 10,
          carbs: Math.round(food.carbs * multiplier * 10) / 10,
          fat: Math.round(food.fat * multiplier * 10) / 10,
        };
      });

      // 식사 기록 저장 API 호출 (양 조절된 데이터 전송)
      const response = await fetch('/api/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foods: adjustedFoods,
          mealType: analysisData.mealType,
          imageBase64: analysisData.imageBase64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '저장에 실패했어요.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '저장에 실패했어요.');
      }

      // sessionStorage 정리
      sessionStorage.removeItem('foodAnalysisResult');

      // 대시보드 또는 식단 기록 페이지로 이동
      router.push('/nutrition');
    } catch (error) {
      console.error('[Food Result] Save error:', error);
      setSaveError(error instanceof Error ? error.message : '저장에 실패했어요.');
    } finally {
      setIsSaving(false);
    }
  }, [analysisData, portionMultipliers, router]);

  // 뒤로 가기
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // 다시 촬영하기
  const handleRetake = useCallback(() => {
    sessionStorage.removeItem('foodAnalysisResult');
    router.push('/nutrition/food-capture');
  }, [router]);

  // 음식 수정 핸들러 (Task 2.11/2.12에서 실제 기능 구현 예정)
  const handleFoodEdit = useCallback((foodName: string) => {
    setEditNotice(`"${foodName}" 수정 기능은 준비 중이에요.`);
    // 3초 후 알림 숨김
    setTimeout(() => setEditNotice(null), 3000);
  }, []);

  // 로딩 상태
  if (isLoading) {
    return <FoodResultSkeleton />;
  }

  // 데이터 없음
  if (!analysisData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">분석 결과</h1>
        </div>

        <div className="bg-yellow-50 rounded-2xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-yellow-900 mb-2">분석 결과가 없어요</h2>
          <p className="text-yellow-700 mb-6">음식 사진을 먼저 촬영해주세요.</p>
          <Button onClick={handleRetake} className="w-full">
            음식 촬영하기
          </Button>
        </div>
      </div>
    );
  }

  const adjustedTotals = calculateAdjustedTotals();
  const mealTypeLabel = MEAL_TYPE_LABELS[analysisData.mealType] || '식사';

  return (
    <div className="space-y-6" data-testid="food-result-page">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{mealTypeLabel} 분석 결과</h1>
      </div>

      {/* 촬영된 사진 */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted">
        <Image
          src={`data:image/jpeg;base64,${analysisData.imageBase64}`}
          alt="촬영된 음식 사진"
          fill
          className="object-cover"
        />
      </div>

      {/* 총 영양소 요약 */}
      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
        <p className="text-sm text-purple-600 font-medium mb-3">총 영양소</p>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-2xl font-bold text-purple-700">{adjustedTotals.calories}</p>
            <p className="text-xs text-purple-600">kcal</p>
          </div>
          <div className="h-8 w-px bg-purple-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-foreground/80">{adjustedTotals.carbs}g</p>
            <p className="text-xs text-muted-foreground">탄수화물</p>
          </div>
          <div className="h-8 w-px bg-purple-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-foreground/80">{adjustedTotals.protein}g</p>
            <p className="text-xs text-muted-foreground">단백질</p>
          </div>
          <div className="h-8 w-px bg-purple-200" />
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-foreground/80">{adjustedTotals.fat}g</p>
            <p className="text-xs text-muted-foreground">지방</p>
          </div>
        </div>
      </div>

      {/* AI 인사이트 */}
      {analysisData.result.insight && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-700">💡 {analysisData.result.insight}</p>
        </div>
      )}

      {/* 음식별 결과 카드 */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-foreground/80">
          🍜 인식된 음식 ({analysisData.result.foods.length}개)
        </h2>
        {analysisData.result.foods.map((food, index) => (
          <FoodResultCard
            key={`${food.name}-${index}`}
            food={food}
            portionMultiplier={portionMultipliers[index] || 1}
            onPortionChange={(multiplier) => handlePortionChange(index, multiplier)}
            onEdit={() => handleFoodEdit(food.name)}
            showDetails={index === 0} // 첫 번째 음식만 펼침
          />
        ))}
      </div>

      {/* 수정 기능 알림 */}
      {editNotice && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-sm text-purple-700 text-center">{editNotice}</p>
        </div>
      )}

      {/* 저장 에러 메시지 */}
      {saveError && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-sm text-red-700">{saveError}</p>
        </div>
      )}

      {/* Mock 데이터 알림 */}
      {analysisData.usedMock && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="text-xs text-amber-700 text-center">
            ⚠️ AI 분석이 일시적으로 사용 불가하여 예시 결과를 표시하고 있어요.
          </p>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-3 pt-4 pb-safe">
        <Button
          onClick={handleRetake}
          variant="outline"
          className="flex-1 h-12"
          disabled={isSaving}
        >
          다시 촬영
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 h-12 bg-purple-600 hover:bg-purple-700"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              저장하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
