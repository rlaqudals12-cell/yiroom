'use client';

import { useRouter } from 'next/navigation';
import { useNutritionInputStore, type MealStyle } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 식사 스타일 옵션 (스펙 기준)
const MEAL_STYLES: { id: MealStyle; icon: string; title: string; desc: string }[] = [
  { id: 'korean', icon: '🍚', title: '한식 위주', desc: '밥, 국, 반찬 구성' },
  { id: 'salad', icon: '🥗', title: '샐러드/가벼운 식사', desc: '저탄고단 식단' },
  { id: 'western', icon: '🍝', title: '양식/파스타/빵', desc: '서양식 위주' },
  { id: 'lunchbox', icon: '🍱', title: '도시락/간편식', desc: '편의점, 도시락' },
  { id: 'delivery', icon: '🥡', title: '배달/외식 많이', desc: '외식 위주' },
  { id: 'any', icon: '🔀', title: '다양하게', desc: '특정 선호 없음' },
];

/**
 * N-1 온보딩 Step 3: 식사 스타일
 * - 단일 선택
 */
export default function NutritionStep3Page() {
  const router = useRouter();
  const { mealStyle, setMealStyle, setStep } = useNutritionInputStore();

  // 선택 처리
  const handleSelect = (styleId: MealStyle) => {
    setMealStyle(styleId);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(2);
    router.push('/nutrition/onboarding/step2');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(4);
    router.push('/nutrition/onboarding/step4');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={3} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">선호 식사 스타일</h2>
        <p className="text-gray-500 mt-1">
          평소 어떤 식사를 선호하세요?
        </p>
      </div>

      {/* 식사 스타일 선택 카드 */}
      <div className="space-y-3">
        {MEAL_STYLES.map((style) => (
          <SelectionCard
            key={style.id}
            mode="single"
            selected={mealStyle === style.id}
            onSelect={() => handleSelect(style.id)}
            icon={<span>{style.icon}</span>}
            title={style.title}
            description={style.desc}
          />
        ))}
      </div>

      {/* 안내 */}
      <p className="text-center text-xs text-gray-400">
        선호하는 스타일에 맞는 식단을 추천해 드려요
      </p>

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={!!mealStyle}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
