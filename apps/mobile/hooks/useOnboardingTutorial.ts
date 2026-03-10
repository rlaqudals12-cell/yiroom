'use client';

import { useState, useEffect, useCallback } from 'react';

// 튜토리얼 스텝 정의
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // 하이라이트할 요소의 CSS 선택자
  position?: 'top' | 'bottom' | 'left' | 'right';
  href?: string; // 해당 스텝에서 이동할 페이지
}

// 기본 튜토리얼 스텝
export const DEFAULT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '이룸에 오신 것을 환영해요! 👋',
    description:
      '이룸은 퍼스널컬러, 피부, 체형 분석부터 운동, 영양까지 통합 관리하는 웰니스 플랫폼이에요. 간단한 둘러보기를 시작할까요?',
    position: 'bottom',
  },
  {
    id: 'analysis',
    title: '나를 알아가는 첫 단계',
    description:
      '퍼스널컬러, 피부, 체형을 AI로 분석해보세요. 이 결과를 바탕으로 맞춤 추천을 받을 수 있어요.',
    targetSelector: '[data-tutorial="analysis"]',
    position: 'bottom',
  },
  {
    id: 'workout',
    title: '맞춤 운동 추천',
    description:
      '체형과 목표에 맞는 운동을 추천받고 기록해보세요. 연예인 루틴도 확인할 수 있어요!',
    targetSelector: '[data-tutorial="workout"]',
    position: 'top',
  },
  {
    id: 'nutrition',
    title: '스마트한 식단 관리',
    description:
      '음식 사진만 찍으면 AI가 칼로리와 영양소를 분석해요. 신호등 시스템으로 쉽게 관리하세요.',
    targetSelector: '[data-tutorial="nutrition"]',
    position: 'top',
  },
  {
    id: 'products',
    title: '맞춤 제품 추천',
    description:
      '분석 결과를 바탕으로 화장품, 영양제, 운동기구를 추천받아보세요. 매칭도 점수로 확인할 수 있어요.',
    targetSelector: '[data-tutorial="products"]',
    position: 'top',
  },
  {
    id: 'complete',
    title: '준비 완료! 🎉',
    description:
      '이제 이룸과 함께 건강한 변화를 시작하세요. 설정에서 언제든 튜토리얼을 다시 볼 수 있어요.',
    position: 'bottom',
  },
];

// 로컬스토리지 키
const STORAGE_KEY = 'yiroom_onboarding_completed';
const CURRENT_STEP_KEY = 'yiroom_onboarding_current_step';

export interface UseOnboardingTutorialOptions {
  steps?: TutorialStep[];
  autoStart?: boolean; // 첫 방문 시 자동 시작
}

export interface UseOnboardingTutorialReturn {
  // 상태
  isActive: boolean;
  isCompleted: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  totalSteps: number;

  // 액션
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  goToStep: (index: number) => void;
}

/**
 * 온보딩 튜토리얼 상태 관리 훅
 * localStorage로 완료 여부 및 현재 스텝 저장
 */
export function useOnboardingTutorial(
  options: UseOnboardingTutorialOptions = {}
): UseOnboardingTutorialReturn {
  const { steps = DEFAULT_TUTORIAL_STEPS, autoStart = true } = options;

  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true); // 기본값 true (로드 전 깜빡임 방지)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // localStorage에서 완료 상태 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const completed = localStorage.getItem(STORAGE_KEY);
    const savedStep = localStorage.getItem(CURRENT_STEP_KEY);

    const isFirstVisit = completed === null;
    setIsCompleted(completed === 'true');

    // 저장된 스텝이 있으면 복원
    if (savedStep) {
      const stepIndex = parseInt(savedStep, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStepIndex(stepIndex);
      }
    }

    // 첫 방문 + autoStart이면 자동 시작
    if (isFirstVisit && autoStart) {
      setIsActive(true);
      setIsCompleted(false);
    }
  }, [autoStart, steps.length]);

  // 현재 스텝 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isActive) {
      localStorage.setItem(CURRENT_STEP_KEY, currentStepIndex.toString());
    }
  }, [currentStepIndex, isActive]);

  // 튜토리얼 시작
  const startTutorial = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsCompleted(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // 다음 스텝
  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // 마지막 스텝이면 완료
      setIsActive(false);
      setIsCompleted(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.removeItem(CURRENT_STEP_KEY);
    }
  }, [currentStepIndex, steps.length]);

  // 이전 스텝
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // 튜토리얼 스킵
  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(CURRENT_STEP_KEY);
  }, []);

  // 튜토리얼 완료
  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(CURRENT_STEP_KEY);
  }, []);

  // 튜토리얼 리셋 (설정에서 다시 보기)
  const resetTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
    setIsCompleted(false);
    setCurrentStepIndex(0);
  }, []);

  // 특정 스텝으로 이동
  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        setCurrentStepIndex(index);
      }
    },
    [steps.length]
  );

  const currentStep = isActive ? steps[currentStepIndex] : null;

  return {
    isActive,
    isCompleted,
    currentStepIndex,
    currentStep,
    totalSteps: steps.length,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    resetTutorial,
    goToStep,
  };
}
