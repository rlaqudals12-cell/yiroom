'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

export default function Step3Page() {
  const router = useRouter();
  const {
    injuries,
    targetWeight,
    targetDate,
    setInjuries,
    setTargetWeight,
    setTargetDate,
    setStep,
    applyDefaults,
  } = useWorkoutInputStore();

  // 로컬 상태 (입력 중인 값)
  const [weightInput, setWeightInput] = useState(targetWeight?.toString() || '');
  const [dateInput, setDateInput] = useState(targetDate || '');
  const [showTargetSection, setShowTargetSection] = useState(false);

  // 부상 선택/해제 처리
  const handleInjurySelect = (injuryId: string) => {
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

  // 목표 체중 입력 처리
  const handleWeightChange = (value: string) => {
    setWeightInput(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setTargetWeight(num);
    } else {
      setTargetWeight(undefined);
    }
  };

  // 목표 날짜 입력 처리
  const handleDateChange = (value: string) => {
    setDateInput(value);
    if (value) {
      setTargetDate(value);
    } else {
      setTargetDate(undefined);
    }
  };

  // 이전 단계
  const handlePrev = () => {
    setStep(2);
    router.push('/workout/onboarding/step2');
  };

  // 완료 처리
  const handleComplete = () => {
    // 부상이 선택되지 않은 경우 '없음' 기본값 적용
    if (injuries.length === 0) {
      setInjuries(['none']);
    }
    router.push('/workout/result');
  };

  // 건너뛰기 처리
  const handleSkip = () => {
    applyDefaults();
    router.push('/workout/result');
  };

  // 최소 날짜 (오늘)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* 진행 표시 - 3단계 중 3단계 */}
      <ProgressIndicator currentStep={3} totalSteps={3} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">건강 정보</h2>
        <p className="text-muted-foreground mt-1">안전한 운동을 위해 알려주세요 (선택사항)</p>
      </div>

      {/* 건너뛰기 버튼 */}
      <button
        onClick={handleSkip}
        className="w-full py-3 text-indigo-600 text-sm font-medium hover:bg-indigo-50 rounded-xl transition-colors"
      >
        건너뛰고 바로 시작하기
      </button>

      {/* 섹션 1: 부상/통증 */}
      <div>
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-foreground">부상/통증</h3>
          <p className="text-muted-foreground text-sm mt-1">
            현재 불편한 부위가 있나요? (복수 선택 가능)
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {INJURIES.slice(0, 1).map((injury) => (
            <SelectionCard
              key={injury.id}
              mode="multiple"
              selected={injuries.includes(injury.id)}
              onSelect={() => handleInjurySelect(injury.id)}
              icon={<span className="text-xl">{injury.icon}</span>}
              title={injury.title}
              description={injury.desc}
              compact
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {INJURIES.slice(1).map((injury) => (
            <SelectionCard
              key={injury.id}
              mode="multiple"
              selected={injuries.includes(injury.id)}
              onSelect={() => handleInjurySelect(injury.id)}
              icon={<span className="text-xl">{injury.icon}</span>}
              title={injury.title}
              description={injury.desc}
              compact
            />
          ))}
        </div>
      </div>

      {/* 선택 현황 (부상) */}
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

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 2: 목표 설정 (접이식) */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowTargetSection(!showTargetSection)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">목표 설정</p>
            <p className="text-sm text-muted-foreground">체중, 날짜 목표 (선택)</p>
          </div>
          {showTargetSection ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {showTargetSection && (
          <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
            {/* 목표 체중 */}
            <div>
              <label
                htmlFor="target-weight"
                className="block text-sm font-medium text-foreground/80 mb-2"
              >
                목표 체중 (kg)
              </label>
              <div className="relative">
                <input
                  id="target-weight"
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weightInput}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="예: 55.0"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-card"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kg
                </span>
              </div>
            </div>

            {/* 목표 날짜 */}
            <div>
              <label
                htmlFor="target-date"
                className="block text-sm font-medium text-foreground/80 mb-2"
              >
                목표 달성 날짜
              </label>
              <input
                id="target-date"
                type="date"
                min={today}
                value={dateInput}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-card"
              />
            </div>

            {/* 설정된 목표 요약 */}
            {(targetWeight || targetDate) && (
              <div className="bg-indigo-50 rounded-xl p-4 space-y-1">
                <p className="text-sm font-medium text-indigo-700">설정된 목표</p>
                {targetWeight && <p className="text-sm text-indigo-600">체중: {targetWeight}kg</p>}
                {targetDate && (
                  <p className="text-sm text-indigo-600">
                    날짜: {new Date(targetDate).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-sm text-amber-700">
          건강 정보는 선택사항입니다. 입력하지 않아도 맞춤 운동 추천을 받을 수 있어요.
        </p>
      </div>

      {/* 네비게이션 버튼 */}
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
