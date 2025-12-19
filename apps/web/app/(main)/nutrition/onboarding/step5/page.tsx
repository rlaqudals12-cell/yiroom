'use client';

import { useRouter } from 'next/navigation';
import { useNutritionInputStore, type BudgetLevel } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 예산 옵션
const BUDGET_OPTIONS: { id: BudgetLevel; icon: string; title: string; desc: string }[] = [
  {
    id: 'economy',
    icon: '💰',
    title: '가성비 위주',
    desc: '최대한 저렴하게 (1식 5천원 이하)',
  },
  {
    id: 'moderate',
    icon: '⚖️',
    title: '적당히',
    desc: '적당한 비용으로 (1식 5천~1만원)',
  },
  {
    id: 'premium',
    icon: '💎',
    title: '좋은 재료 선호',
    desc: '품질 우선 (1식 1만원 이상)',
  },
  {
    id: 'any',
    icon: '🔀',
    title: '상관없음',
    desc: '예산 제한 없이 추천받기',
  },
];

/**
 * N-1 온보딩 Step 5: 예산 선택
 * - 단일 선택
 */
export default function NutritionStep5Page() {
  const router = useRouter();
  const { budget, setBudget, setStep } = useNutritionInputStore();

  // 선택 처리
  const handleSelect = (budgetLevel: BudgetLevel) => {
    setBudget(budgetLevel);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(4);
    router.push('/nutrition/onboarding/step4');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(6);
    router.push('/nutrition/onboarding/step6');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={5} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">식비 예산</h2>
        <p className="text-muted-foreground mt-1">
          한 끼 식사에 사용할 예산은 어느 정도인가요?
        </p>
      </div>

      {/* 예산 선택 카드 */}
      <div className="space-y-3">
        {BUDGET_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            mode="single"
            selected={budget === option.id}
            onSelect={() => handleSelect(option.id)}
            icon={<span>{option.icon}</span>}
            title={option.title}
            description={option.desc}
          />
        ))}
      </div>

      {/* 안내 */}
      <p className="text-center text-xs text-muted-foreground">
        예산에 맞는 식재료와 레시피를 추천해 드려요
      </p>

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={!!budget}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
