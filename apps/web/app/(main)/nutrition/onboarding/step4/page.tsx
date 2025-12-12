'use client';

import { useRouter } from 'next/navigation';
import { useNutritionInputStore, type CookingSkill } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 요리 스킬 옵션
const COOKING_SKILLS: { id: CookingSkill; icon: string; title: string; desc: string }[] = [
  {
    id: 'advanced',
    icon: '⭐',
    title: '고급',
    desc: '복잡한 요리도 문제없어요 (30분+ 레시피)',
  },
  {
    id: 'intermediate',
    icon: '👨‍🍳',
    title: '중급',
    desc: '대부분의 요리를 할 수 있어요 (15-30분)',
  },
  {
    id: 'beginner',
    icon: '🍳',
    title: '초보',
    desc: '간단한 요리만 가능해요 (10분 이내)',
  },
  {
    id: 'none',
    icon: '🚫',
    title: '요리 안 함',
    desc: '완제품이나 배달만 이용해요',
  },
];

/**
 * N-1 온보딩 Step 4: 요리 스킬
 * - 단일 선택
 */
export default function NutritionStep4Page() {
  const router = useRouter();
  const { cookingSkill, setCookingSkill, setStep } = useNutritionInputStore();

  // 선택 처리
  const handleSelect = (skill: CookingSkill) => {
    setCookingSkill(skill);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(3);
    router.push('/nutrition/onboarding/step3');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(5);
    router.push('/nutrition/onboarding/step5');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={4} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">요리 실력</h2>
        <p className="text-gray-500 mt-1">
          평소 요리 실력은 어느 정도인가요?
        </p>
      </div>

      {/* 요리 스킬 선택 카드 */}
      <div className="space-y-3">
        {COOKING_SKILLS.map((skill) => (
          <SelectionCard
            key={skill.id}
            mode="single"
            selected={cookingSkill === skill.id}
            onSelect={() => handleSelect(skill.id)}
            icon={<span>{skill.icon}</span>}
            title={skill.title}
            description={skill.desc}
          />
        ))}
      </div>

      {/* 안내 */}
      <p className="text-center text-xs text-gray-400">
        요리 실력에 맞는 레시피를 추천해 드려요
      </p>

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={!!cookingSkill}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
