'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import {
  useNutritionInputStore,
  type Gender,
  type ActivityLevel,
} from '@/lib/stores/nutritionInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { ACTIVITY_LEVEL_LABELS } from '@/lib/nutrition/calculateBMR';
import type { NutritionGoal } from '@/types/nutrition';
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

// 영양 목표 옵션
const NUTRITION_GOALS: { id: NutritionGoal; icon: string; title: string; desc: string }[] = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '칼로리 적자 식단' },
  { id: 'maintain', icon: '⚖️', title: '체중 유지', desc: '균형 잡힌 식단' },
  { id: 'muscle', icon: '💪', title: '근육 증가', desc: '고단백 식단' },
  { id: 'skin', icon: '✨', title: '피부 개선', desc: '피부 친화 식단' },
  { id: 'health', icon: '❤️', title: '건강 관리', desc: '균형 영양 식단' },
];

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
 * N-1 온보딩 Step 1: 목표 + 기본 정보 통합
 */
export default function NutritionStep1Page() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const {
    goal,
    gender,
    birthDate,
    height,
    weight,
    activityLevel,
    setGoal,
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
  const [showBodyInfo, setShowBodyInfo] = useState(false);

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

  // 다음 단계
  const handleNext = () => {
    setStep(2);
    router.push('/nutrition/onboarding/step2');
  };

  // 유효성 검사
  const canProceed = goal && gender && birthDate && height && weight && activityLevel;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
        <p className="text-muted-foreground">정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 진행 표시 - 3단계 중 1단계 */}
      <ProgressIndicator currentStep={1} totalSteps={3} />

      {/* 면책 조항 */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-medium">서비스 이용 안내</span>
          <br />
          <br />본 서비스는 전문 의료 조언을 대체하지 않습니다. 특정 질환이 있거나 임신 중인 경우
          전문가와 상담 후 이용하세요.
        </p>
      </div>

      {/* 섹션 1: 식사 목표 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">식사 목표</h2>
          <p className="text-muted-foreground text-sm mt-1">원하는 목표를 선택해 주세요</p>
        </div>
        <div className="space-y-2">
          {NUTRITION_GOALS.map((item) => (
            <SelectionCard
              key={item.id}
              mode="single"
              selected={goal === item.id}
              onSelect={() => setGoal(item.id)}
              icon={<span>{item.icon}</span>}
              title={item.title}
              description={item.desc}
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 2: 기본 정보 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">기본 정보</h2>
          <p className="text-muted-foreground text-sm mt-1">
            칼로리 계산을 위한 정보를 입력해 주세요
          </p>
        </div>

        {/* C-1 연동 알림 */}
        {hasC1Data && (
          <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">체형 분석 데이터에서 키/체중을 불러왔어요</p>
          </div>
        )}

        {/* 성별 선택 */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-foreground/80">성별</label>
          <div className="grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setGender(option.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  gender === option.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <span className="text-2xl">{option.icon}</span>
                <p className="mt-1 font-medium text-foreground">{option.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-foreground/80">생년월일</label>
          <input
            type="date"
            value={birthDate || ''}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* 키/체중 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80">키 (cm)</label>
            <input
              type="number"
              value={height || ''}
              onChange={(e) => setHeight(Number(e.target.value) || null)}
              placeholder="170"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min={100}
              max={250}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80">체중 (kg)</label>
            <input
              type="number"
              value={weight || ''}
              onChange={(e) => setWeight(Number(e.target.value) || null)}
              placeholder="65"
              className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min={30}
              max={200}
            />
          </div>
        </div>

        {/* 활동 수준 (접이식) */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowBodyInfo(!showBodyInfo)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <div className="text-left">
              <p className="font-medium text-foreground">활동 수준</p>
              <p className="text-sm text-muted-foreground">
                {activityLevel ? ACTIVITY_LEVEL_LABELS[activityLevel].label : '선택해 주세요'}
              </p>
            </div>
            {showBodyInfo ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {showBodyInfo && (
            <div className="px-4 pb-4 border-t border-border/50 pt-4">
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
          )}
        </div>
      </div>

      {/* 선택 현황 */}
      {(goal || gender) && (
        <div className="bg-green-50 rounded-xl p-4 space-y-1">
          {goal && (
            <p className="text-sm text-green-700">
              목표:{' '}
              <span className="font-medium">
                {NUTRITION_GOALS.find((g) => g.id === goal)?.title}
              </span>
            </p>
          )}
          {gender && height && weight && (
            <p className="text-sm text-green-700">
              {GENDER_OPTIONS.find((g) => g.id === gender)?.title}, {height}cm, {weight}kg
            </p>
          )}
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <StepNavigation
        isFirstStep={true}
        isLastStep={false}
        canProceed={!!canProceed}
        onPrev={() => {}}
        onNext={handleNext}
      />
    </div>
  );
}
