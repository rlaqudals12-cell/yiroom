'use client';

import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';

// 운동 빈도 옵션
const FREQUENCIES = [
  { id: '1-2', title: '주 1-2회', desc: '가볍게 시작하기', icon: '🌱' },
  { id: '3-4', title: '주 3-4회', desc: '규칙적인 운동', icon: '🌿' },
  { id: '5-6', title: '주 5-6회', desc: '적극적인 운동', icon: '🌳' },
  { id: 'daily', title: '매일', desc: '꾸준한 루틴', icon: '🌲' },
];

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

export default function Step2Page() {
  const router = useRouter();
  const { frequency, location, equipment, setFrequency, setLocation, setEquipment, setStep } =
    useWorkoutInputStore();

  // 빈도 선택 처리 (단일 선택)
  const handleFrequencySelect = (frequencyId: string) => {
    setFrequency(frequencyId);
  };

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
    setStep(1);
    router.push('/workout/onboarding/step1');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(3);
    router.push('/workout/onboarding/step3');
  };

  // 진행 가능 조건: 빈도 선택됨 AND 장소 선택됨 AND 장비 1개 이상 선택됨
  const canProceed = !!frequency && !!location && equipment.length > 0;

  return (
    <div className="space-y-6">
      {/* 진행 표시 - 3단계 중 2단계 */}
      <ProgressIndicator currentStep={2} totalSteps={3} />

      {/* 섹션 1: 운동 빈도 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">운동 빈도</h2>
          <p className="text-muted-foreground text-sm mt-1">일주일에 몇 번 운동하실 수 있나요?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FREQUENCIES.map((freq) => (
            <SelectionCard
              key={freq.id}
              mode="single"
              selected={frequency === freq.id}
              onSelect={() => handleFrequencySelect(freq.id)}
              icon={<span className="text-xl">{freq.icon}</span>}
              title={freq.title}
              description={freq.desc}
              compact
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 2: 운동 장소 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">운동 장소</h2>
          <p className="text-muted-foreground text-sm mt-1">주로 어디서 운동하시나요?</p>
        </div>
        <div className="space-y-2">
          {LOCATIONS.map((loc) => (
            <SelectionCard
              key={loc.id}
              mode="single"
              selected={location === loc.id}
              onSelect={() => handleLocationSelect(loc.id)}
              icon={<span className="text-xl">{loc.icon}</span>}
              title={loc.title}
              description={loc.desc}
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 3: 사용 가능한 장비 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">사용 가능한 장비</h2>
          <p className="text-muted-foreground text-sm mt-1">
            사용할 수 있는 장비를 모두 선택해 주세요
          </p>
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
      {(frequency || location || equipment.length > 0) && (
        <div className="bg-blue-50 rounded-xl p-4 space-y-1">
          {frequency && (
            <p className="text-sm text-blue-700">
              빈도:{' '}
              <span className="font-medium">
                {FREQUENCIES.find((f) => f.id === frequency)?.title}
              </span>
            </p>
          )}
          {location && (
            <p className="text-sm text-blue-700">
              장소:{' '}
              <span className="font-medium">{LOCATIONS.find((l) => l.id === location)?.title}</span>
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
