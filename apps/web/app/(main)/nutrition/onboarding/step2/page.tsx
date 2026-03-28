'use client';

import { useRouter } from 'next/navigation';
import {
  useNutritionInputStore,
  type MealStyle,
  type CookingSkill,
  type BudgetLevel,
} from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { useTranslations } from 'next-intl';

// 식사 스타일 옵션
const MEAL_STYLE_IDS: MealStyle[] = ['korean', 'salad', 'western', 'lunchbox', 'delivery', 'any'];

// 요리 스킬 옵션
const COOKING_SKILL_IDS: CookingSkill[] = ['advanced', 'intermediate', 'beginner', 'none'];

// 예산 옵션
const BUDGET_IDS: BudgetLevel[] = ['economy', 'moderate', 'premium', 'any'];

/**
 * N-1 온보딩 Step 2: 라이프스타일 통합
 * - 식사 스타일 + 요리 실력 + 예산
 */
export default function NutritionStep2Page() {
  const t = useTranslations('nutritionOnboarding');
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
            {t('step2MealStyleTitle')} <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step2MealStyleDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_STYLE_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="single"
              selected={mealStyle === id}
              onSelect={() => setMealStyle(id)}
              title={t(`mealStyle_${id}`)}
              description={t(`mealStyle_${id}_desc`)}
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
            {t('step2CookingSkillTitle')} <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step2CookingSkillDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {COOKING_SKILL_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="single"
              selected={cookingSkill === id}
              onSelect={() => setCookingSkill(id)}
              title={t(`cookingSkill_${id}`)}
              description={t(`cookingSkill_${id}_desc`)}
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
            {t('step2BudgetTitle')} <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step2BudgetDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="single"
              selected={budget === id}
              onSelect={() => setBudget(id)}
              title={t(`budget_${id}`)}
              description={t(`budget_${id}_desc`)}
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
              {t('summaryStyle')} <span className="font-medium">{t(`mealStyle_${mealStyle}`)}</span>
            </p>
          )}
          {cookingSkill && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('summaryCooking')}{' '}
              <span className="font-medium">{t(`cookingSkill_${cookingSkill}`)}</span>
            </p>
          )}
          {budget && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('summaryBudget')} <span className="font-medium">{t(`budget_${budget}`)}</span>
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
