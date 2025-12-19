'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useNutritionInputStore, type AllergyType } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation } from '@/components/workout/common';
import { X } from 'lucide-react';

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

/**
 * N-1 온보딩 Step 6: 알레르기/기피 음식
 * - 복수 선택 가능
 * - 직접 입력도 가능
 */
export default function NutritionStep6Page() {
  const router = useRouter();
  const {
    allergies,
    dislikedFoods,
    setAllergies,
    setDislikedFoods,
    setStep,
  } = useNutritionInputStore();

  const [newDislikedFood, setNewDislikedFood] = useState('');

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

  // 이전 단계
  const handlePrev = () => {
    setStep(5);
    router.push('/nutrition/onboarding/step5');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(7);
    router.push('/nutrition/onboarding/step7');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={6} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">알레르기 및 기피 음식</h2>
        <p className="text-muted-foreground mt-1">
          피해야 할 음식이 있으면 알려주세요
        </p>
      </div>

      {/* 알레르기/기피 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground/80">
          알레르기/기피 음식
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ALLERGY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectAllergy(option.id)}
              className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                allergies.includes(option.id)
                  ? 'border-red-400 bg-red-50'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="text-sm font-medium text-foreground/80">
                {option.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 직접 입력 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground/80">
          기타 기피 음식 (직접 입력)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDislikedFood}
            onChange={(e) => setNewDislikedFood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDislikedFood()}
            placeholder="예: 고수, 브로콜리"
            className="flex-1 px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={handleAddDislikedFood}
            className="px-4 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors"
          >
            추가
          </button>
        </div>
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

      {/* 안내 */}
      <p className="text-center text-xs text-muted-foreground">
        해당 음식은 추천에서 제외됩니다
      </p>

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={true}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
