'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 운동 목표 옵션
const GOALS = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '건강하게 살 빼기' },
  { id: 'strength', icon: '💪', title: '근력 강화', desc: '근육량 늘리기' },
  { id: 'endurance', icon: '🏃', title: '체력 향상', desc: '지구력 키우기' },
  { id: 'stress', icon: '😌', title: '스트레스 해소', desc: '마음 건강 챙기기' },
  { id: 'posture', icon: '🧘', title: '체형 교정', desc: '바른 자세 만들기' },
];

const MAX_SELECTIONS = 2;

export default function Step2Page() {
  const router = useRouter();
  const { goals, setGoals, setStep } = useWorkoutInputStore();

  // 목표 선택/해제 처리
  const handleSelect = (goalId: string) => {
    if (goals.includes(goalId)) {
      // 이미 선택된 경우 해제
      setGoals(goals.filter((id) => id !== goalId));
    } else {
      // 새로 선택
      if (goals.length >= MAX_SELECTIONS) {
        toast.warning(`최대 ${MAX_SELECTIONS}개까지 선택 가능합니다`);
        return;
      }
      setGoals([...goals, goalId]);
    }
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(1);
    router.push('/workout/onboarding/step1');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(3);
    router.push('/workout/onboarding/step3');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={2} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">운동 목표</h2>
        <p className="text-muted-foreground mt-1">
          원하는 목표를 선택해 주세요 (최대 {MAX_SELECTIONS}개)
        </p>
      </div>

      {/* 목표 선택 카드 */}
      <div className="space-y-3">
        {GOALS.map((goal) => (
          <SelectionCard
            key={goal.id}
            mode="multiple"
            selected={goals.includes(goal.id)}
            onSelect={() => handleSelect(goal.id)}
            icon={<span>{goal.icon}</span>}
            title={goal.title}
            description={goal.desc}
          />
        ))}
      </div>

      {/* 선택 현황 */}
      {goals.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">{goals.length}개</span> 선택됨
            {goals.length < MAX_SELECTIONS && (
              <span className="text-indigo-500 ml-1">
                (1개 더 선택 가능)
              </span>
            )}
          </p>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={goals.length > 0}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
