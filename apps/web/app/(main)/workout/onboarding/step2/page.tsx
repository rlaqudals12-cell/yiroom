'use client';

import { useRouter } from 'next/navigation';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';
import { ProgressIndicator, StepNavigation, SelectionCard } from '@/components/workout/common';
import { useTranslations } from 'next-intl';

// 운동 빈도 옵션
const FREQUENCY_IDS = ['1-2', '3-4', '5-6', 'daily'];

// 운동 장소 옵션
const LOCATION_IDS = ['home', 'gym', 'outdoor'];

// 장비 옵션
const EQUIPMENT_IDS = ['none', 'dumbbell', 'band', 'mat', 'machine'];

export default function Step2Page() {
  const t = useTranslations('workoutOnboarding');
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
    <div className="space-y-6" data-testid="workout-step2-page">
      {/* 진행 표시 - 3단계 중 2단계 */}
      <ProgressIndicator currentStep={2} totalSteps={3} />

      {/* 섹션 1: 운동 빈도 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('step2FrequencyTitle')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step2FrequencyDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FREQUENCY_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="single"
              selected={frequency === id}
              onSelect={() => handleFrequencySelect(id)}
              title={t(`frequency_${id}`)}
              description={t(`frequency_${id}_desc`)}
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
          <h2 className="text-lg font-bold text-foreground">{t('step2LocationTitle')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step2LocationDesc')}</p>
        </div>
        <div className="space-y-2">
          {LOCATION_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="single"
              selected={location === id}
              onSelect={() => handleLocationSelect(id)}
              title={t(`location_${id}`)}
              description={t(`location_${id}_desc`)}
            />
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-border" />

      {/* 섹션 3: 사용 가능한 장비 */}
      <div>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-foreground">{t('step2EquipmentTitle')}</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('step2EquipmentDesc')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_IDS.map((id) => (
            <SelectionCard
              key={id}
              mode="multiple"
              selected={equipment.includes(id)}
              onSelect={() => handleEquipmentSelect(id)}
              title={t(`equipment_${id}`)}
              description={t(`equipment_${id}_desc`)}
              compact
            />
          ))}
        </div>
      </div>

      {/* 선택 현황 */}
      {(frequency || location || equipment.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 space-y-1">
          {frequency && (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('summaryFrequency')}{' '}
              <span className="font-medium">{t(`frequency_${frequency}`)}</span>
            </p>
          )}
          {location && (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('summaryLocation')}{' '}
              <span className="font-medium">{t(`location_${location}`)}</span>
            </p>
          )}
          {equipment.length > 0 && (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {t('summaryEquipment', { count: equipment.length })}
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
