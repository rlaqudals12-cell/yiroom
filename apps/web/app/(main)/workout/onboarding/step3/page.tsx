'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/date-format';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { ChevronDown, ChevronUp } from 'lucide-react';

// 부상/통증 부위 옵션
const INJURY_IDS = ['none', 'knee', 'back', 'shoulder', 'wrist', 'ankle', 'neck'];

export default function Step3Page() {
  const t = useTranslations('workoutOnboarding');
  const router = useRouter();
  const locale = useLocale();
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
    <div className="space-y-6" data-testid="workout-step3-page">
      {/* 진행 표시 - 3단계 중 3단계 */}
      <ProgressIndicator currentStep={3} totalSteps={3} />

      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">{t('step3Title')}</h2>
        <p className="text-muted-foreground mt-1">{t('step3Desc')}</p>
      </div>

      {/* 건너뛰기 버튼 */}
      <button
        onClick={handleSkip}
        className="w-full py-3 text-indigo-600 text-sm font-medium hover:bg-indigo-50 rounded-xl transition-colors"
      >
        {t('skipAndStart')}
      </button>

      {/* 섹션 1: 부상/통증 */}
      <div>
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-foreground">{t('step3InjuryTitle')}</h3>
          <p className="text-muted-foreground text-sm mt-1">{t('step3InjuryDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {INJURY_IDS.slice(0, 1).map((id) => (
            <SelectionCard
              key={id}
              mode="multiple"
              selected={injuries.includes(id)}
              onSelect={() => handleInjurySelect(id)}
              title={t(`injury_${id}`)}
              description={t(`injury_${id}_desc`)}
              compact
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {INJURY_IDS.slice(1).map((id) => (
            <SelectionCard
              key={id}
              mode="multiple"
              selected={injuries.includes(id)}
              onSelect={() => handleInjurySelect(id)}
              title={t(`injury_${id}`)}
              description={t(`injury_${id}_desc`)}
              compact
            />
          ))}
        </div>
      </div>

      {/* 선택 현황 (부상) */}
      {injuries.length > 0 && !injuries.includes('none') && (
        <div className="bg-orange-50 dark:bg-orange-950/30 rounded-xl p-4">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            {t('injurySummary', { count: injuries.length })}
            <span className="block mt-1 text-orange-600 dark:text-orange-400">
              {t('injuryRecommendation')}
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
          aria-label={showTargetSection ? t('collapseTarget') : t('expandTarget')}
          aria-expanded={showTargetSection}
        >
          <div className="text-left">
            <p className="font-medium text-foreground">{t('targetSettingTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('targetSettingDesc')}</p>
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
                {t('targetWeightLabel')}
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
                  placeholder={t('targetWeightPlaceholder')}
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
                {t('targetDateLabel')}
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
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-1">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                  {t('targetSummaryTitle')}
                </p>
                {targetWeight && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    {t('targetSummaryWeight', { weight: targetWeight })}
                  </p>
                )}
                {targetDate && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    {t('targetSummaryDate', { date: formatDate(new Date(targetDate), locale) })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4">
        <p className="text-sm text-amber-700 dark:text-amber-300">{t('healthInfoHint')}</p>
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
