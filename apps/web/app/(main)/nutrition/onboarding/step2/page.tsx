'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useNutritionInputStore, type Gender, type ActivityLevel } from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { ACTIVITY_LEVEL_LABELS } from '@/lib/nutrition/calculateBMR';
import { Loader2, CheckCircle2 } from 'lucide-react';

// 성별 옵션
const GENDER_OPTIONS: { id: Gender; icon: string; title: string }[] = [
  { id: 'male', icon: '👨', title: '남성' },
  { id: 'female', icon: '👩', title: '여성' },
];

// 활동 수준 옵션
const ACTIVITY_OPTIONS: { id: ActivityLevel; icon: string }[] = [
  { id: 'sedentary', icon: '🪑' },
  { id: 'light', icon: '🚶' },
  { id: 'moderate', icon: '🏃' },
  { id: 'active', icon: '💪' },
  { id: 'very_active', icon: '🔥' },
];

/**
 * N-1 온보딩 Step 2: 기본 정보 입력
 * - C-1 연동: 키/체중 자동 불러오기
 * - 성별, 생년월일, 활동량 입력
 */
export default function NutritionStep2Page() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const {
    gender,
    birthDate,
    height,
    weight,
    activityLevel,
    setGender,
    setBirthDate,
    setHeight,
    setWeight,
    setActivityLevel,
    setBodyTypeData,
    setStep,
  } = useNutritionInputStore();

  const [isLoading, setIsLoading] = useState(true);
  const [hasC1Data, setHasC1Data] = useState(false);

  // C-1 데이터 불러오기
  useEffect(() => {
    async function fetchC1Data() {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('body_analyses')
          .select('height, weight, body_type, shoulder, waist, hip')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          setHasC1Data(true);
          if (data.height) setHeight(data.height);
          if (data.weight) setWeight(data.weight);
          setBodyTypeData({
            type: data.body_type,
            proportions: {
              shoulder: data.shoulder || 0,
              waist: data.waist || 0,
              hip: data.hip || 0,
            },
            height: data.height || undefined,
            weight: data.weight || undefined,
          });
        }
      } catch (err) {
        console.error('Error fetching C-1 data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchC1Data();
  }, [isLoaded, isSignedIn, supabase, setHeight, setWeight, setBodyTypeData]);

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

  // 유효성 검사
  const canProceed = gender && birthDate && height && weight && activityLevel;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
        <p className="text-gray-500">정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 진행 표시 */}
      <ProgressIndicator currentStep={2} totalSteps={7} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>
        <p className="text-gray-500 mt-1">
          칼로리 계산을 위한 정보를 입력해 주세요
        </p>
      </div>

      {/* C-1 연동 알림 */}
      {hasC1Data && (
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">
            체형 분석 데이터에서 키/체중을 불러왔어요
          </p>
        </div>
      )}

      {/* 성별 선택 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">성별</label>
        <div className="grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setGender(option.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                gender === option.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <p className="mt-1 font-medium text-gray-900">{option.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 생년월일 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">생년월일</label>
        <input
          type="date"
          value={birthDate || ''}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* 키/체중 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">키 (cm)</label>
          <input
            type="number"
            value={height || ''}
            onChange={(e) => setHeight(Number(e.target.value) || null)}
            placeholder="170"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min={100}
            max={250}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">체중 (kg)</label>
          <input
            type="number"
            value={weight || ''}
            onChange={(e) => setWeight(Number(e.target.value) || null)}
            placeholder="65"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min={30}
            max={200}
          />
        </div>
      </div>

      {/* 활동 수준 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">활동 수준</label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((option) => {
            const label = ACTIVITY_LEVEL_LABELS[option.id];
            return (
              <SelectionCard
                key={option.id}
                mode="single"
                selected={activityLevel === option.id}
                onSelect={() => setActivityLevel(option.id)}
                icon={<span>{option.icon}</span>}
                title={label.label}
                description={label.description}
              />
            );
          })}
        </div>
      </div>

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
