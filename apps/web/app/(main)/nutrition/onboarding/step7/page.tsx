'use client';

import { useRouter } from 'next/navigation';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation } from '@/components/workout/common';
import { calculateAll } from '@/lib/nutrition/calculateBMR';

// 식사 횟수 옵션
const MEAL_COUNT_OPTIONS = [
  { count: 2, icon: '🍽️', title: '2끼', desc: '간헐적 단식 또는 바쁜 일상' },
  { count: 3, icon: '🍽️🍽️', title: '3끼', desc: '일반적인 식사 패턴' },
  { count: 4, icon: '🍽️🍽️🍽️', title: '4끼', desc: '운동하는 분에게 추천' },
  { count: 5, icon: '🍽️🍽️🍽️🍽️', title: '5끼', desc: '소량씩 자주 먹기' },
  { count: 6, icon: '🍽️🍽️🍽️🍽️🍽️', title: '6끼', desc: '보디빌더 식단' },
];

/**
 * N-1 온보딩 Step 7: 식사 횟수
 * - 하루 식사 횟수 선택
 * - 완료 시 BMR/TDEE 계산 및 결과 페이지로 이동
 */
export default function NutritionStep7Page() {
  const router = useRouter();
  const {
    mealCount,
    setMealCount,
    setBMR,
    setTDEE,
    setStep,
    // 계산에 필요한 데이터
    gender,
    weight,
    height,
    birthDate,
    activityLevel,
    goal,
  } = useNutritionInputStore();

  // 선택 처리
  const handleSelect = (count: number) => {
    setMealCount(count);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(6);
    router.push('/nutrition/onboarding/step6');
  };

  // 완료 처리
  const handleComplete = () => {
    // BMR/TDEE 계산
    if (gender && weight && height && birthDate && activityLevel && goal) {
      const result = calculateAll(
        gender,
        weight,
        height,
        birthDate,
        activityLevel,
        goal
      );
      setBMR(result.bmr);
      setTDEE(result.tdee);
    }

    // 결과 페이지로 이동
    router.push('/nutrition/result');
  };

  // BMR/TDEE 미리보기 계산
  const previewCalories = (() => {
    if (!gender || !weight || !height || !birthDate || !activityLevel || !goal) {
      return null;
    }

    const result = calculateAll(
      gender,
      weight,
      height,
      birthDate,
      activityLevel,
      goal
    );
    return result;
  })();

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={7} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">하루 식사 횟수</h2>
        <p className="text-gray-500 mt-1">
          하루에 몇 번 식사하시나요?
        </p>
      </div>

      {/* 식사 횟수 선택 */}
      <div className="space-y-3">
        {MEAL_COUNT_OPTIONS.map((option) => (
          <button
            key={option.count}
            onClick={() => handleSelect(option.count)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              mealCount === option.count
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xl">{option.icon}</span>
              <div>
                <p className="font-bold text-gray-900">{option.title}</p>
                <p className="text-sm text-gray-500">{option.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 칼로리 미리보기 */}
      {previewCalories && (
        <div className="bg-green-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">일일 권장 칼로리</p>
          <p className="text-3xl font-bold text-green-600">
            {previewCalories.dailyCalorieTarget.toLocaleString()} kcal
          </p>
          <div className="text-xs text-green-700 space-x-4">
            <span>기초대사량: {previewCalories.bmr.toLocaleString()} kcal</span>
            <span>활동대사량: {previewCalories.tdee.toLocaleString()} kcal</span>
          </div>
          {mealCount > 0 && (
            <p className="text-sm text-green-700 pt-2 border-t border-green-200">
              한 끼당 약{' '}
              <span className="font-bold">
                {Math.round(previewCalories.dailyCalorieTarget / mealCount).toLocaleString()} kcal
              </span>
            </p>
          )}
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={true}
        canProceed={mealCount >= 2}
        onPrev={handlePrev}
        onNext={handleComplete}
      />
    </div>
  );
}
