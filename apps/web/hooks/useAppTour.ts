'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * 앱 투어 스텝 정의
 * - BottomNav 탭, 분석 버튼, 프로필 등 주요 UI 요소 타겟팅
 */
export interface AppTourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // 하이라이트할 요소의 CSS 선택자
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const DEFAULT_APP_TOUR_STEPS: AppTourStep[] = [
  {
    id: 'home-tab',
    title: '홈',
    description: '오늘의 추천, 미션, 대시보드를 한눈에 확인하세요.',
    targetSelector: '[data-tutorial="home"]',
    position: 'top',
  },
  {
    id: 'beauty-tab',
    title: '뷰티',
    description: '피부 분석 결과를 바탕으로 맞춤 화장품을 추천받아보세요.',
    targetSelector: '[data-tutorial="beauty"]',
    position: 'top',
  },
  {
    id: 'style-tab',
    title: '스타일',
    description: '체형에 맞는 코디와 스타일을 확인해보세요.',
    targetSelector: '[data-tutorial="style"]',
    position: 'top',
  },
  {
    id: 'record-tab',
    title: '기록',
    description: '운동과 영양 기록을 한곳에서 관리하세요.',
    targetSelector: '[data-tutorial="record"]',
    position: 'top',
  },
  {
    id: 'profile-tab',
    title: '프로필',
    description: '내 정보, 친구, 챌린지, 배지를 확인하세요. 설정에서 투어를 다시 볼 수 있어요.',
    targetSelector: '[data-tutorial="profile"]',
    position: 'top',
  },
  {
    id: 'analysis-section',
    title: 'AI 분석 시작하기',
    description: '퍼스널컬러, 피부, 체형을 AI로 분석해보세요. 맞춤 추천의 시작점이에요!',
    targetSelector: '[data-tutorial="analysis"]',
    position: 'bottom',
  },
];

const STORAGE_KEY = 'yiroom_app_tour_completed';
const CURRENT_STEP_KEY = 'yiroom_app_tour_current_step';

export interface UseAppTourOptions {
  steps?: AppTourStep[];
  autoStart?: boolean;
}

export interface UseAppTourReturn {
  isActive: boolean;
  isCompleted: boolean;
  currentStepIndex: number;
  currentStep: AppTourStep | null;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  goToStep: (index: number) => void;
}

/**
 * 앱 투어 상태 관리 훅
 * - localStorage로 완료 여부 및 현재 스텝 저장
 * - BottomNav 탭, 분석 버튼, 프로필 타겟팅
 */
export function useAppTour(options: UseAppTourOptions = {}): UseAppTourReturn {
  const { steps = DEFAULT_APP_TOUR_STEPS, autoStart = true } = options;

  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const completed = localStorage.getItem(STORAGE_KEY);
    const savedStep = localStorage.getItem(CURRENT_STEP_KEY);

    const isFirstVisit = completed === null;
    setIsCompleted(completed === 'true');

    if (savedStep) {
      const stepIndex = parseInt(savedStep, 10);
      if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStepIndex(stepIndex);
      }
    }

    if (isFirstVisit && autoStart) {
      setIsActive(true);
      setIsCompleted(false);
    }
  }, [autoStart, steps.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isActive) {
      localStorage.setItem(CURRENT_STEP_KEY, currentStepIndex.toString());
    }
  }, [currentStepIndex, isActive]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsCompleted(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsActive(false);
      setIsCompleted(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.removeItem(CURRENT_STEP_KEY);
    }
  }, [currentStepIndex, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(CURRENT_STEP_KEY);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.removeItem(CURRENT_STEP_KEY);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_STEP_KEY);
    setIsCompleted(false);
    setCurrentStepIndex(0);
  }, []);

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
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
    goToStep,
  };
}
