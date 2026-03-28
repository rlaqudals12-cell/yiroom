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
import { ACTIVITY_LEVEL_LABELS } from '@/lib/nutrition';
import type { NutritionGoal } from '@/types/nutrition';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

// 영양 목표 옵션
const NUTRITION_GOAL_IDS: NutritionGoal[] = ['weight_loss', 'maintain', 'muscle', 'skin', 'health'];

// 성별 옵션
const GENDER_IDS: Gender[] = ['male', 'female'];

// 활동 수준 옵션
const ACTIVITY_OPTIONS: { id: ActivityLevel }[] = [
  { id: 'sedentary' },
  { id: 'light' },
  { id: 'moderate' },
  { id: 'active' },
  { id: 'very_active' },
];

/**
 * N-1 온보딩 Step 1: 목표 + 기본 정보 통합
 */
export default function NutritionStep1Page() {
  const t = useTranslations('nutritionOnboarding');
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
        <p className="text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="nutrition-step1-page">
      {/* 진행 표시 - 3단계 중 1단계 */}
      <ProgressIndicator currentStep={1} totalSteps={3} />

      {/* 면책 조항 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          <span className="font-medium">{t('disclaimerTitle')}</span>
          <br />
          <br />
          {t('disclaimerBody')}
        </p>
      </div>

      {/* 섹션 1: 식사 목표 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">
            {t('step1GoalTitle')} <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step1GoalDesc')}</p>
        </div>
        <div className="space-y-2">
          {NUTRITION_GOAL_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="single"
              selected={goal === id}
              onSelect={() => setGoal(id)}
              title={t(`goal_${id}`)}
              description={t(`goal_${id}_desc`)}
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 2: 기본 정보 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('step1BasicInfoTitle')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step1BasicInfoDesc')}</p>
        </div>

        {/* C-1 연동 알림 */}
        {hasC1Data && (
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{t('c1DataLoaded')}</p>
          </div>
        )}

        {/* 성별 선택 */}
        <div className="space-y-3 mb-4">
          <label className="block text-sm font-medium text-foreground/80">
            {t('genderLabel')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('genderLabel')}>
            {GENDER_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setGender(id)}
                role="radio"
                aria-checked={gender === id}
                aria-label={t(`gender_${id}`)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  gender === id
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <p className="font-medium text-foreground">{t(`gender_${id}`)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 */}
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-foreground/80">
            {t('birthDateLabel')} <span className="text-red-500">*</span>
          </label>
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
            <label className="block text-sm font-medium text-foreground/80">
              {t('heightLabel')} <span className="text-red-500">*</span>
            </label>
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
            <label className="block text-sm font-medium text-foreground/80">
              {t('weightLabel')} <span className="text-red-500">*</span>
            </label>
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
              <p className="font-medium text-foreground">
                {t('activityLevelLabel')} <span className="text-red-500">*</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {activityLevel
                  ? ACTIVITY_LEVEL_LABELS[activityLevel].label
                  : t('activityLevelPlaceholder')}
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
        <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 space-y-1">
          {goal && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('summaryGoal')} <span className="font-medium">{t(`goal_${goal}`)}</span>
            </p>
          )}
          {gender && height && weight && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {t(`gender_${gender}`)}, {height}cm, {weight}kg
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
