'use client';

import { useRouter } from 'next/navigation';
import {
  useNutritionInputStore,
  type MealStyle,
  type CookingSkill,
  type BudgetLevel,
} from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 식사 스타일 옵션
const MEAL_STYLES: { id: MealStyle; title: string; desc: string }[] = [
  { id: 'korean', title: '한식 위주', desc: '밥, 국, 반찬 구성' },
  { id: 'salad', title: '샐러드/가벼운 식사', desc: '저탄고단 식단' },
  { id: 'western', title: '양식/파스타/빵', desc: '서양식 위주' },
  { id: 'lunchbox', title: '도시락/간편식', desc: '편의점, 도시락' },
  { id: 'delivery', title: '배달/외식 많이', desc: '외식 위주' },
  { id: 'any', title: '다양하게', desc: '특정 선호 없음' },
];

// 요리 스킬 옵션
const COOKING_SKILLS: { id: CookingSkill; title: string; desc: string }[] = [
  { id: 'advanced', title: '고급', desc: '30분+ 레시피' },
  { id: 'intermediate', title: '중급', desc: '15-30분 레시피' },
  { id: 'beginner', title: '초보', desc: '10분 이내' },
  { id: 'none', title: '요리 안 함', desc: '완제품/배달' },
];

// 예산 옵션
const BUDGET_OPTIONS: { id: BudgetLevel; title: string; desc: string }[] = [
  { id: 'economy', title: '가성비 위주', desc: '1식 5천원 이하' },
  { id: 'moderate', title: '적당히', desc: '1식 5천~1만원' },
  { id: 'premium', title: '좋은 재료', desc: '1식 1만원 이상' },
  { id: 'any', title: '상관없음', desc: '예산 제한 없음' },
];

/**
 * N-1 온보딩 Step 2: 라이프스타일 통합
 * - 식사 스타일 + 요리 실력 + 예산
 */
export default function NutritionStep2Page() {
  const router = useRouter();
  const { mealStyle, cookingSkill, budget, setMealStyle, setCookingSkill, setBudget, setStep } =
    useNutritionInputStore();

  // 이전 단계
  const handlePrev = () => {
    setStep(1);
    router.push('/nutrition/onboarding/step1');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(3);
    router.push('/nutrition/onboarding/step3');
  };

  // 진행 가능 조건
  const canProceed = mealStyle && cookingSkill && budget;

  return (
    <div className="space-y-6" data-testid="nutrition-step2-page">
      {/* 진행 표시 - 3단계 중 2단계 */}
      <ProgressIndicator currentStep={2} totalSteps={3} />

      {/* 섹션 1: 식사 스타일 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">
            선호 식사 스타일 <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">평소 어떤 식사를 선호하세요?</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_STYLES.map((style) => (
            <SelectionCard
              key={style.id}
              mode="single"
              selected={mealStyle === style.id}
              onSelect={() => setMealStyle(style.id)}
              title={style.title}
              description={style.desc}
              compact
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 2: 요리 실력 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">
            요리 실력 <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">평소 요리 실력은 어느 정도인가요?</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {COOKING_SKILLS.map((skill) => (
            <SelectionCard
              key={skill.id}
              mode="single"
              selected={cookingSkill === skill.id}
              onSelect={() => setCookingSkill(skill.id)}
              title={skill.title}
              description={skill.desc}
              compact
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 3: 예산 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">
            식비 예산 <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">한 끼 식사에 사용할 예산은?</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_OPTIONS.map((option) => (
            <SelectionCard
              key={option.id}
              mode="single"
              selected={budget === option.id}
              onSelect={() => setBudget(option.id)}
              title={option.title}
              description={option.desc}
              compact
            />
          ))}
        </div>
      </div>

      {/* 선택 현황 */}
      {(mealStyle || cookingSkill || budget) && (
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 space-y-1">
          {mealStyle && (
            <p className="text-sm text-green-700 dark:text-green-300">
              스타일:{' '}
              <span className="font-medium">
                {MEAL_STYLES.find((s) => s.id === mealStyle)?.title}
              </span>
            </p>
          )}
          {cookingSkill && (
            <p className="text-sm text-green-700 dark:text-green-300">
              요리:{' '}
              <span className="font-medium">
                {COOKING_SKILLS.find((s) => s.id === cookingSkill)?.title}
              </span>
            </p>
          )}
          {budget && (
            <p className="text-sm text-green-700 dark:text-green-300">
              예산:{' '}
              <span className="font-medium">
                {BUDGET_OPTIONS.find((b) => b.id === budget)?.title}
              </span>
            </p>
          )}
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={!!canProceed}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
