/**
 * 앱 투어 상태 관리 훅
 * AsyncStorage 기반 상태 관리
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppTourStep, UseAppTourReturn } from './types';
import { DEFAULT_APP_TOUR_STEPS, STORAGE_KEY, CURRENT_STEP_KEY } from './types';

// ============================================================
// 옵션 타입
// ============================================================

export interface UseAppTourOptions {
  steps?: AppTourStep[];
  autoStart?: boolean;
}

// ============================================================
// 앱 투어 훅
// ============================================================

export function useAppTour(options: UseAppTourOptions = {}): UseAppTourReturn {
  const { steps = DEFAULT_APP_TOUR_STEPS, autoStart = true } = options;

  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 초기 로드
  useEffect(() => {
    loadTourState();
  }, []);

  const loadTourState = async () => {
    try {
      const [completed, savedStep] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(CURRENT_STEP_KEY),
      ]);

      const isFirstVisit = completed === null;
      setIsCompleted(completed === 'true');

      if (savedStep) {
        const stepIndex = parseInt(savedStep, 10);
        if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < steps.length) {
          setCurrentStepIndex(stepIndex);
        }
      }

      // 첫 방문 + 자동 시작
      if (isFirstVisit && autoStart) {
        setIsActive(true);
        setIsCompleted(false);
      }
    } catch (error) {
      console.error('[AppTour] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 스텝 저장
  useEffect(() => {
    if (isActive && !isLoading) {
      AsyncStorage.setItem(CURRENT_STEP_KEY, currentStepIndex.toString()).catch((error) => {
        console.error('[AppTour] Save step error:', error);
      });
    }
  }, [currentStepIndex, isActive, isLoading]);

  // 투어 시작
  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
    setIsCompleted(false);
    AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
      console.error('[AppTour] Start error:', error);
    });
  }, []);

  // 다음 스텝
  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // 마지막 스텝이면 완료
      setIsActive(false);
      setIsCompleted(true);
      Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, 'true'),
        AsyncStorage.removeItem(CURRENT_STEP_KEY),
      ]).catch((error) => {
        console.error('[AppTour] Complete error:', error);
      });
    }
  }, [currentStepIndex, steps.length]);

  // 이전 스텝
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // 투어 건너뛰기
  const skipTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, 'true'),
      AsyncStorage.removeItem(CURRENT_STEP_KEY),
    ]).catch((error) => {
      console.error('[AppTour] Skip error:', error);
    });
  }, []);

  // 투어 완료
  const completeTour = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, 'true'),
      AsyncStorage.removeItem(CURRENT_STEP_KEY),
    ]).catch((error) => {
      console.error('[AppTour] Complete error:', error);
    });
  }, []);

  // 투어 리셋 (설정에서 다시 보기용)
  const resetTour = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY),
        AsyncStorage.removeItem(CURRENT_STEP_KEY),
      ]);
      setIsCompleted(false);
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('[AppTour] Reset error:', error);
    }
  }, []);

  const currentStep = isActive ? steps[currentStepIndex] : null;

  return {
    isActive,
    isCompleted,
    isLoading,
    currentStepIndex,
    currentStep,
    totalSteps: steps.length,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
}
