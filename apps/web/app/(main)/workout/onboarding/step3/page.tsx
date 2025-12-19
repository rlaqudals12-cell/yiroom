'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 신체 고민 옵션 (8개)
const CONCERNS = [
  { id: 'belly', icon: '🫃', title: '뱃살', desc: '복부 지방 감소' },
  { id: 'thigh', icon: '🦵', title: '허벅지', desc: '하체 라인 정리' },
  { id: 'arm', icon: '💪', title: '팔뚝', desc: '팔 라인 탄력' },
  { id: 'back', icon: '🔙', title: '등살', desc: '등 라인 정리' },
  { id: 'waist', icon: '⏳', title: '허리', desc: '허리 라인 만들기' },
  { id: 'hip', icon: '🍑', title: '엉덩이', desc: '힙업 및 탄력' },
  { id: 'calf', icon: '🦶', title: '종아리', desc: '종아리 라인' },
  { id: 'posture', icon: '🧍', title: '자세 교정', desc: '거북목, 굽은 등' },
];

const MAX_SELECTIONS = 3;

export default function Step3Page() {
  const router = useRouter();
  const { concerns, setConcerns, setStep } = useWorkoutInputStore();

  // 고민 선택/해제 처리
  const handleSelect = (concernId: string) => {
    if (concerns.includes(concernId)) {
      // 이미 선택된 경우 해제
      setConcerns(concerns.filter((id) => id !== concernId));
    } else {
      // 새로 선택
      if (concerns.length >= MAX_SELECTIONS) {
        toast.warning(`최대 ${MAX_SELECTIONS}개까지 선택 가능합니다`);
        return;
      }
      setConcerns([...concerns, concernId]);
    }
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(2);
    router.push('/workout/onboarding/step2');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(4);
    router.push('/workout/onboarding/step4');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={3} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">신체 고민</h2>
        <p className="text-muted-foreground mt-1">
          개선하고 싶은 부위를 선택해 주세요 (최대 {MAX_SELECTIONS}개)
        </p>
      </div>

      {/* 고민 선택 카드 - 2열 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {CONCERNS.map((concern) => (
          <SelectionCard
            key={concern.id}
            mode="multiple"
            selected={concerns.includes(concern.id)}
            onSelect={() => handleSelect(concern.id)}
            icon={<span className="text-2xl">{concern.icon}</span>}
            title={concern.title}
            description={concern.desc}
            compact
          />
        ))}
      </div>

      {/* 선택 현황 */}
      {concerns.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">{concerns.length}개</span> 선택됨
            {concerns.length < MAX_SELECTIONS && (
              <span className="text-indigo-500 ml-1">
                ({MAX_SELECTIONS - concerns.length}개 더 선택 가능)
              </span>
            )}
          </p>
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={concerns.length > 0}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
