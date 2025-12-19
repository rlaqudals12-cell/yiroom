'use client';

import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 운동 빈도 옵션 (4개)
const FREQUENCIES = [
  { id: '1-2', title: '주 1-2회', desc: '가볍게 시작하기', icon: '🌱' },
  { id: '3-4', title: '주 3-4회', desc: '규칙적인 운동', icon: '🌿' },
  { id: '5-6', title: '주 5-6회', desc: '적극적인 운동', icon: '🌳' },
  { id: 'daily', title: '매일', desc: '꾸준한 루틴', icon: '🌲' },
];

export default function Step4Page() {
  const router = useRouter();
  const { frequency, setFrequency, setStep } = useWorkoutInputStore();

  // 빈도 선택 처리 (단일 선택)
  const handleSelect = (frequencyId: string) => {
    setFrequency(frequencyId);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(3);
    router.push('/workout/onboarding/step3');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(5);
    router.push('/workout/onboarding/step5');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={4} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">운동 빈도</h2>
        <p className="text-muted-foreground mt-1">
          일주일에 몇 번 운동하실 수 있나요?
        </p>
      </div>

      {/* 빈도 선택 카드 */}
      <div className="space-y-3">
        {FREQUENCIES.map((freq) => (
          <SelectionCard
            key={freq.id}
            mode="single"
            selected={frequency === freq.id}
            onSelect={() => handleSelect(freq.id)}
            icon={<span className="text-2xl">{freq.icon}</span>}
            title={freq.title}
            description={freq.desc}
          />
        ))}
      </div>

      {/* 선택 안내 */}
      {frequency && (
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-700">
            <span className="font-medium">
              {FREQUENCIES.find((f) => f.id === frequency)?.title}
            </span>
            를 선택하셨습니다
          </p>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={!!frequency}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
