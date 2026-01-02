'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useNutritionInputStore, type AllergyType } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation } from '@/components/workout/common';
import { calculateAll } from '@/lib/nutrition/calculateBMR';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// 알레르기/기피 음식 옵션
const ALLERGY_OPTIONS: { id: AllergyType; icon: string; title: string }[] = [
  { id: 'dairy', icon: '🥛', title: '유제품' },
  { id: 'eggs', icon: '🥚', title: '달걀' },
  { id: 'nuts', icon: '🥜', title: '견과류' },
  { id: 'seafood', icon: '🦐', title: '해산물' },
  { id: 'gluten', icon: '🌾', title: '글루텐' },
  { id: 'soy', icon: '🫘', title: '대두' },
  { id: 'pork', icon: '🐷', title: '돼지고기' },
  { id: 'beef', icon: '🐄', title: '소고기' },
  { id: 'spicy', icon: '🌶️', title: '매운 음식' },
  { id: 'raw', icon: '🍣', title: '날 음식' },
];

// 식사 횟수 옵션
const MEAL_COUNT_OPTIONS = [
  { count: 2, title: '2끼', desc: '간헐적 단식' },
  { count: 3, title: '3끼', desc: '일반적' },
  { count: 4, title: '4끼', desc: '운동하시는 분' },
  { count: 5, title: '5끼+', desc: '소량씩 자주' },
];

/**
 * N-1 온보딩 Step 3: 개인화 통합
 * - 알레르기/기피 (선택) + 식사 횟수 (필수) + 칼로리 미리보기
 */
export default function NutritionStep3Page() {
  const router = useRouter();
  const {
    allergies,
    dislikedFoods,
    mealCount,
    setAllergies,
    setDislikedFoods,
    setMealCount,
    setBMR,
    setTDEE,
    setStep,
    applyDefaults,
    // 계산에 필요한 데이터
    gender,
    weight,
    height,
    birthDate,
    activityLevel,
    goal,
  } = useNutritionInputStore();

  const [newDislikedFood, setNewDislikedFood] = useState('');
  const [showAllergies, setShowAllergies] = useState(false);

  // 알레르기 선택/해제 처리
  const handleSelectAllergy = (allergyId: AllergyType) => {
    if (allergies.includes(allergyId)) {
      setAllergies(allergies.filter((id) => id !== allergyId));
    } else {
      setAllergies([...allergies, allergyId]);
    }
  };

  // 기피 음식 추가
  const handleAddDislikedFood = () => {
    const trimmed = newDislikedFood.trim();
    if (!trimmed) return;

    if (dislikedFoods.includes(trimmed)) {
      toast.warning('이미 추가된 음식입니다');
      return;
    }

    if (dislikedFoods.length >= 10) {
      toast.warning('최대 10개까지 추가 가능합니다');
      return;
    }

    setDislikedFoods([...dislikedFoods, trimmed]);
    setNewDislikedFood('');
  };

  // 기피 음식 삭제
  const handleRemoveDislikedFood = (food: string) => {
    setDislikedFoods(dislikedFoods.filter((f) => f !== food));
  };

  // 식사 횟수 선택 처리
  const handleMealCountSelect = (count: number) => {
    setMealCount(count);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(2);
    router.push('/nutrition/onboarding/step2');
  };

  // 완료 처리
  const handleComplete = () => {
    // BMR/TDEE 계산
    if (gender && weight && height && birthDate && activityLevel && goal) {
      const result = calculateAll(gender, weight, height, birthDate, activityLevel, goal);
      setBMR(result.bmr);
      setTDEE(result.tdee);
    }

    // 결과 페이지로 이동
    router.push('/nutrition/result');
  };

  // 건너뛰기 처리
  const handleSkip = () => {
    applyDefaults();

    // BMR/TDEE 계산
    if (gender && weight && height && birthDate && activityLevel && goal) {
      const result = calculateAll(gender, weight, height, birthDate, activityLevel, goal);
      setBMR(result.bmr);
      setTDEE(result.tdee);
    }

    router.push('/nutrition/result');
  };

  // BMR/TDEE 미리보기 계산
  const previewCalories = (() => {
    if (!gender || !weight || !height || !birthDate || !activityLevel || !goal) {
      return null;
    }

    const result = calculateAll(gender, weight, height, birthDate, activityLevel, goal);
    return result;
  })();

  return (
    <div className="space-y-6">
      {/* 진행 표시 - 3단계 중 3단계 */}
      <ProgressIndicator currentStep={3} totalSteps={3} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">개인화 설정</h2>
        <p className="text-muted-foreground mt-1">거의 다 왔어요! 마지막 단계입니다</p>
      </div>

      {/* 건너뛰기 버튼 */}
      <button
        onClick={handleSkip}
        className="w-full py-3 text-green-600 text-sm font-medium hover:bg-green-50 rounded-xl transition-colors"
      >
        건너뛰고 바로 시작하기
      </button>

      {/* 섹션 1: 식사 횟수 (필수) */}
      <div>
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-foreground">하루 식사 횟수</h3>
          <p className="text-muted-foreground text-sm mt-1">하루에 몇 번 식사하시나요?</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_COUNT_OPTIONS.map((option) => (
            <button
              key={option.count}
              onClick={() => handleMealCountSelect(option.count)}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                mealCount === option.count
                  ? 'border-green-500 bg-green-50'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <p className="font-bold text-foreground">{option.title}</p>
              <p className="text-xs text-muted-foreground">{option.desc}</p>
            </button>
          ))}
        </div>
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
          {mealCount >= 2 && (
            <p className="text-sm text-green-700 pt-2 border-t border-green-200">
              한 끼당 약{' '}
              <span className="font-bold">
                {Math.round(previewCalories.dailyCalorieTarget / mealCount).toLocaleString()} kcal
              </span>
            </p>
          )}
        </div>
      )}

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 2: 알레르기/기피 (선택, 접이식) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowAllergies(!showAllergies)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">알레르기/기피 음식</p>
            <p className="text-sm text-muted-foreground">
              {allergies.length + dislikedFoods.length > 0
                ? `${allergies.length + dislikedFoods.length}개 선택됨`
                : '선택사항'}
            </p>
          </div>
          {showAllergies ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {showAllergies && (
          <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
            {/* 알레르기 선택 */}
            <div className="grid grid-cols-5 gap-2">
              {ALLERGY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAllergy(option.id)}
                  className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center ${
                    allergies.includes(option.id)
                      ? 'border-red-400 bg-red-50'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-xs text-foreground/80">{option.title}</span>
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newDislikedFood}
                onChange={(e) => setNewDislikedFood(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDislikedFood()}
                placeholder="기타 기피 음식 직접 입력"
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleAddDislikedFood}
                className="px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
              >
                추가
              </button>
            </div>

            {/* 추가된 기피 음식 목록 */}
            {dislikedFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dislikedFoods.map((food) => (
                  <span
                    key={food}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-muted rounded-full text-sm text-foreground/80"
                  >
                    {food}
                    <button
                      onClick={() => handleRemoveDislikedFood(food)}
                      className="p-0.5 hover:bg-muted/80 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 안내 문구 */}
      <p className="text-center text-xs text-muted-foreground">
        알레르기와 기피 음식은 추천에서 제외됩니다
      </p>

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
