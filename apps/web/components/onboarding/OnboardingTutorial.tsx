'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TutorialStep } from './TutorialStep';
import {
  useOnboardingTutorial,
  type TutorialStep as TutorialStepType,
  type UseOnboardingTutorialOptions,
} from '@/hooks/useOnboardingTutorial';

interface OnboardingTutorialProps {
  /** 커스텀 튜토리얼 스텝 */
  steps?: TutorialStepType[];
  /** 첫 방문 시 자동 시작 여부 */
  autoStart?: boolean;
  /** 완료 시 콜백 */
  onComplete?: () => void;
  /** 스킵 시 콜백 */
  onSkip?: () => void;
}

/**
 * 온보딩 튜토리얼 컴포넌트
 * - 첫 방문 사용자에게 앱 기능 안내
 * - localStorage로 완료 여부 저장
 * - 6단계 진행 (환영 → 분석 → 운동 → 영양 → 제품 → 완료)
 *
 * @example
 * ```tsx
 * // 레이아웃에 추가
 * <OnboardingTutorial />
 *
 * // 커스텀 스텝 사용
 * <OnboardingTutorial
 *   steps={customSteps}
 *   onComplete={() => console.log('완료!')}
 * />
 * ```
 */
export function OnboardingTutorial({
  steps,
  autoStart = true,
  onComplete,
  onSkip,
}: OnboardingTutorialProps) {
  const router = useRouter();

  const options: UseOnboardingTutorialOptions = {
    steps,
    autoStart,
  };

  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  } = useOnboardingTutorial(options);

  // 스텝에 href가 있으면 해당 페이지로 이동
  useEffect(() => {
    if (isActive && currentStep?.href) {
      router.push(currentStep.href);
    }
  }, [isActive, currentStep?.href, router]);

  const handleNext = () => {
    nextStep();
  };

  const handlePrev = () => {
    prevStep();
  };

  const handleSkip = () => {
    skipTutorial();
    onSkip?.();
  };

  const handleComplete = () => {
    completeTutorial();
    onComplete?.();
  };

  // 활성화되지 않았거나 현재 스텝이 없으면 렌더링하지 않음
  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <TutorialStep
      step={currentStep}
      stepIndex={currentStepIndex}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleSkip}
      onComplete={handleComplete}
    />
  );
}

/**
 * 튜토리얼 상태만 제공하는 훅 (외부에서 UI 커스텀)
 */
export { useOnboardingTutorial } from '@/hooks/useOnboardingTutorial';
export type { TutorialStep as TutorialStepType } from '@/hooks/useOnboardingTutorial';
