'use client';

import { useRouter } from 'next/navigation';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import type { NutritionGoal } from '@/types/nutrition';

// 영양 목표 옵션
const NUTRITION_GOALS: { id: NutritionGoal; icon: string; title: string; desc: string }[] = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '칼로리 적자 식단' },
  { id: 'maintain', icon: '⚖️', title: '체중 유지', desc: '균형 잡힌 식단' },
  { id: 'muscle', icon: '💪', title: '근육 증가', desc: '고단백 식단' },
  { id: 'skin', icon: '✨', title: '피부 개선', desc: '피부 친화 식단 (S-1 연동)' },
  { id: 'health', icon: '❤️', title: '건강 관리', desc: '균형 영양 식단' },
];

/**
 * N-1 온보딩 Step 1: 식사 목표 선택
 * - 5가지 목표 중 단일 선택
 */
export default function NutritionStep1Page() {
  const router = useRouter();
  const { goal, setGoal, setStep } = useNutritionInputStore();

  // 목표 선택 처리
  const handleSelect = (goalId: NutritionGoal) => {
    setGoal(goalId);
  };

  // 다음 단계
  const handleNext = () => {
    setStep(2);
    router.push('/nutrition/onboarding/step2');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={1} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">식사 목표</h2>
        <p className="text-gray-500 mt-1">
          원하는 목표를 선택해 주세요
        </p>
      </div>

      {/* 면책 조항 */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-medium">서비스 이용 안내</span>
          <br />
          <br />
          본 서비스는 전문 의료 조언을 대체하지 않습니다. 특정 질환이 있거나 임신 중인 경우 전문가와 상담 후 이용하세요.
        </p>
      </div>

      {/* 목표 선택 카드 */}
      <div className="space-y-3">
        {NUTRITION_GOALS.map((item) => (
          <SelectionCard
            key={item.id}
            mode="single"
            selected={goal === item.id}
            onSelect={() => handleSelect(item.id)}
            icon={<span>{item.icon}</span>}
            title={item.title}
            description={item.desc}
          />
        ))}
      </div>

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={true}
        isLastStep={false}
        canProceed={!!goal}
        onPrev={() => {}}
        onNext={handleNext}
      />
    </div>
  );
}
