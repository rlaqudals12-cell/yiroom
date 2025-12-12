'use client';

import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 운동 장소 옵션
const LOCATIONS = [
  { id: 'home', icon: '🏠', title: '집', desc: '홈트레이닝' },
  { id: 'gym', icon: '🏋️', title: '헬스장', desc: '피트니스 센터' },
  { id: 'outdoor', icon: '🌳', title: '야외', desc: '공원, 운동장 등' },
];

// 장비 옵션
const EQUIPMENT = [
  { id: 'none', icon: '🤸', title: '맨몸', desc: '장비 없이' },
  { id: 'dumbbell', icon: '🏋️', title: '덤벨', desc: '아령, 케틀벨' },
  { id: 'band', icon: '🎗️', title: '밴드', desc: '저항 밴드' },
  { id: 'mat', icon: '🧘', title: '매트', desc: '요가 매트' },
  { id: 'machine', icon: '🏃', title: '머신', desc: '헬스장 기구' },
];

export default function Step5Page() {
  const router = useRouter();
  const { location, equipment, setLocation, setEquipment, setStep } = useWorkoutInputStore();

  // 장소 선택 처리 (단일 선택)
  const handleLocationSelect = (locationId: string) => {
    setLocation(locationId);
  };

  // 장비 선택/해제 처리 (복수 선택)
  const handleEquipmentSelect = (equipmentId: string) => {
    if (equipment.includes(equipmentId)) {
      setEquipment(equipment.filter((id) => id !== equipmentId));
    } else {
      setEquipment([...equipment, equipmentId]);
    }
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(4);
    router.push('/workout/onboarding/step4');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(6);
    router.push('/workout/onboarding/step6');
  };

  // 진행 가능 조건: 장소 선택됨 AND 장비 1개 이상 선택됨
  const canProceed = !!location && equipment.length > 0;

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={5} totalSteps={7} />

      {/* 장소 선택 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">운동 장소</h2>
          <p className="text-gray-500 mt-1">주로 어디서 운동하시나요?</p>
        </div>
        <div className="space-y-3">
          {LOCATIONS.map((loc) => (
            <SelectionCard
              key={loc.id}
              mode="single"
              selected={location === loc.id}
              onSelect={() => handleLocationSelect(loc.id)}
              icon={<span className="text-2xl">{loc.icon}</span>}
              title={loc.title}
              description={loc.desc}
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-200" />

      {/* 장비 선택 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">사용 가능한 장비</h2>
          <p className="text-gray-500 mt-1">사용할 수 있는 장비를 모두 선택해 주세요</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT.map((eq) => (
            <SelectionCard
              key={eq.id}
              mode="multiple"
              selected={equipment.includes(eq.id)}
              onSelect={() => handleEquipmentSelect(eq.id)}
              icon={<span className="text-xl">{eq.icon}</span>}
              title={eq.title}
              description={eq.desc}
              compact
            />
          ))}
        </div>
      </div>

      {/* 선택 현황 */}
      {(location || equipment.length > 0) && (
        <div className="bg-blue-50 rounded-xl p-4 space-y-1">
          {location && (
            <p className="text-sm text-blue-700">
              장소: <span className="font-medium">{LOCATIONS.find((l) => l.id === location)?.title}</span>
            </p>
          )}
          {equipment.length > 0 && (
            <p className="text-sm text-blue-700">
              장비: <span className="font-medium">{equipment.length}개</span> 선택됨
            </p>
          )}
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={false}
        isLastStep={false}
        canProceed={canProceed}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  );
}
