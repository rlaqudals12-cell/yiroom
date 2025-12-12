'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation } from '@/components/workout/common';

export default function Step6Page() {
  const router = useRouter();
  const { targetWeight, targetDate, setTargetWeight, setTargetDate, setStep } = useWorkoutInputStore();

  // 로컬 상태 (입력 중인 값)
  const [weightInput, setWeightInput] = useState(targetWeight?.toString() || '');
  const [dateInput, setDateInput] = useState(targetDate || '');

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
    setStep(5);
    router.push('/workout/onboarding/step5');
  };

  // 다음 단계
  const handleNext = () => {
    setStep(7);
    router.push('/workout/onboarding/step7');
  };

  // 최소 날짜 (오늘)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={6} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">목표 설정</h2>
        <p className="text-gray-500 mt-1">
          구체적인 목표를 설정해 보세요 (선택사항)
        </p>
      </div>

      {/* 목표 체중 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label htmlFor="target-weight" className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            kg
          </span>
        </div>
      </div>

      {/* 목표 날짜 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label htmlFor="target-date" className="block text-sm font-medium text-gray-700 mb-2">
          목표 달성 날짜
        </label>
        <input
          id="target-date"
          type="date"
          min={today}
          value={dateInput}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
        />
      </div>

      {/* 안내 문구 */}
      <div className="bg-amber-50 rounded-xl p-4">
        <p className="text-sm text-amber-700">
          목표 설정은 선택사항입니다. 설정하지 않아도 맞춤 운동 추천을 받을 수 있어요.
        </p>
      </div>

      {/* 설정된 목표 요약 */}
      {(targetWeight || targetDate) && (
        <div className="bg-indigo-50 rounded-xl p-4 space-y-1">
          <p className="text-sm font-medium text-indigo-700">설정된 목표</p>
          {targetWeight && (
            <p className="text-sm text-indigo-600">체중: {targetWeight}kg</p>
          )}
          {targetDate && (
            <p className="text-sm text-indigo-600">
              날짜: {new Date(targetDate).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      )}

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
