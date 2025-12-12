'use client';

import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 부상/통증 부위 옵션
const INJURIES = [
  { id: 'none', icon: '✅', title: '없음', desc: '특별한 부상이나 통증 없음' },
  { id: 'knee', icon: '🦵', title: '무릎', desc: '무릎 관절 통증' },
  { id: 'back', icon: '🔙', title: '허리', desc: '허리 디스크, 요통' },
  { id: 'shoulder', icon: '💪', title: '어깨', desc: '어깨 통증, 오십견' },
  { id: 'wrist', icon: '🤚', title: '손목', desc: '손목 터널 증후군' },
  { id: 'ankle', icon: '🦶', title: '발목', desc: '발목 염좌, 통증' },
  { id: 'neck', icon: '🦒', title: '목', desc: '거북목, 목 통증' },
];

export default function Step7Page() {
  const router = useRouter();
  const { injuries, setInjuries, setStep } = useWorkoutInputStore();

  // 부상 선택/해제 처리
  const handleSelect = (injuryId: string) => {
    // '없음' 선택 시 다른 선택 모두 해제
    if (injuryId === 'none') {
      setInjuries(['none']);
      return;
    }

    // 다른 항목 선택 시 '없음' 해제
    let newInjuries = injuries.filter((id) => id !== 'none');

    if (newInjuries.includes(injuryId)) {
      // 이미 선택된 경우 해제
      newInjuries = newInjuries.filter((id) => id !== injuryId);
    } else {
      // 새로 선택
      newInjuries = [...newInjuries, injuryId];
    }

    setInjuries(newInjuries);
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(6);
    router.push('/workout/onboarding/step6');
  };

  // 완료 처리
  const handleComplete = () => {
    // 결과 페이지로 이동 (추후 구현)
    router.push('/workout/result');
  };

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={7} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">부상/통증</h2>
        <p className="text-gray-500 mt-1">
          현재 불편한 부위가 있나요? (복수 선택 가능)
        </p>
      </div>

      {/* 부상 선택 카드 */}
      <div className="space-y-3">
        {INJURIES.map((injury) => (
          <SelectionCard
            key={injury.id}
            mode="multiple"
            selected={injuries.includes(injury.id)}
            onSelect={() => handleSelect(injury.id)}
            icon={<span className="text-2xl">{injury.icon}</span>}
            title={injury.title}
            description={injury.desc}
          />
        ))}
      </div>

      {/* 선택 현황 */}
      {injuries.length > 0 && !injuries.includes('none') && (
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-sm text-orange-700">
            <span className="font-medium">{injuries.length}개</span> 부위 선택됨
            <span className="block mt-1 text-orange-600">
              해당 부위에 무리가 가지 않는 운동을 추천해 드릴게요
            </span>
          </p>
        </div>
      )}

      {/* 네비게이션 버튼 - Step 7은 선택 사항이므로 항상 진행 가능 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={true}
        canProceed={true}
        onPrev={handlePrev}
        onNext={handleComplete}
      />
    </div>
  );
}
