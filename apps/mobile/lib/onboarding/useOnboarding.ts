/**
 * 온보딩 상태 관리 훅
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type {
  OnboardingData,
  OnboardingGoal,
  OnboardingBasicInfo,
  OnboardingPreferences,
} from './types';
import { DEFAULT_ONBOARDING_DATA } from './types';

const STORAGE_KEY = 'yiroom_onboarding_data';
const COMPLETED_KEY = 'yiroom_onboarding_completed';

// ============================================================
// 온보딩 상태 훅
// ============================================================

interface UseOnboardingResult {
  data: OnboardingData;
  currentStep: number;
  isLoading: boolean;
  isCompleted: boolean;

  // 스텝 네비게이션
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // 데이터 업데이트
  setGoals: (goals: OnboardingGoal[]) => void;
  toggleGoal: (goal: OnboardingGoal) => void;
  setBasicInfo: (info: Partial<OnboardingBasicInfo>) => void;
  setPreferences: (prefs: Partial<OnboardingPreferences>) => void;

  // 완료/리셋
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING_DATA);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  // 초기 로드
  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const [storedData, completed] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(COMPLETED_KEY),
      ]);

      if (storedData) {
        setData({ ...DEFAULT_ONBOARDING_DATA, ...JSON.parse(storedData) });
      }

      setIsCompleted(completed === 'true');
    } catch (error) {
      console.error('[Onboarding] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: OnboardingData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('[Onboarding] Save error:', error);
    }
  };

  // 스텝 네비게이션
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= 3) {
        setCurrentStep(step);
        router.push(`/(onboarding)/step${step}` as never);
      }
    },
    [router]
  );

  const nextStep = useCallback(() => {
    if (currentStep < 3) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  // 목표 설정
  const setGoals = useCallback((goals: OnboardingGoal[]) => {
    setData((prev) => {
      const newData = { ...prev, goals };
      saveData(newData);
      return newData;
    });
  }, []);

  const toggleGoal = useCallback((goal: OnboardingGoal) => {
    setData((prev) => {
      const goals = prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal];
      const newData = { ...prev, goals };
      saveData(newData);
      return newData;
    });
  }, []);

  // 기본 정보 설정
  const setBasicInfo = useCallback((info: Partial<OnboardingBasicInfo>) => {
    setData((prev) => {
      const newData = {
        ...prev,
        basicInfo: { ...prev.basicInfo, ...info },
      };
      saveData(newData);
      return newData;
    });
  }, []);

  // 선호도 설정
  const setPreferences = useCallback(
    (prefs: Partial<OnboardingPreferences>) => {
      setData((prev) => {
        const newData = {
          ...prev,
          preferences: { ...prev.preferences, ...prefs },
        };
        saveData(newData);
        return newData;
      });
    },
    []
  );

  // 온보딩 완료
  const completeOnboarding = useCallback(async () => {
    const completedData: OnboardingData = {
      ...data,
      completedAt: new Date().toISOString(),
    };

    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completedData)),
        AsyncStorage.setItem(COMPLETED_KEY, 'true'),
      ]);

      setData(completedData);
      setIsCompleted(true);

      // 메인 탭으로 이동
      router.replace('/(tabs)' as never);
    } catch (error) {
      console.error('[Onboarding] Complete error:', error);
    }
  }, [data, router]);

  // 온보딩 리셋
  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY),
        AsyncStorage.removeItem(COMPLETED_KEY),
      ]);

      setData(DEFAULT_ONBOARDING_DATA);
      setCurrentStep(1);
      setIsCompleted(false);
    } catch (error) {
      console.error('[Onboarding] Reset error:', error);
    }
  }, []);

  return {
    data,
    currentStep,
    isLoading,
    isCompleted,
    goToStep,
    nextStep,
    prevStep,
    setGoals,
    toggleGoal,
    setBasicInfo,
    setPreferences,
    completeOnboarding,
    resetOnboarding,
  };
}

// ============================================================
// 온보딩 완료 체크 훅
// ============================================================

export function useOnboardingCheck(): {
  isCompleted: boolean;
  isLoading: boolean;
  checkOnboarding: () => Promise<boolean>;
} {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      const completed = await AsyncStorage.getItem(COMPLETED_KEY);
      const result = completed === 'true';
      setIsCompleted(result);
      return result;
    } catch (error) {
      console.error('[Onboarding] Check error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  return {
    isCompleted,
    isLoading,
    checkOnboarding,
  };
}

// ============================================================
// 온보딩 데이터 조회 훅 (완료된 데이터만)
// ============================================================

export function useOnboardingData(): {
  data: OnboardingData | null;
  isLoading: boolean;
} {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedData, completed] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(COMPLETED_KEY),
        ]);

        if (completed === 'true' && storedData) {
          setData({ ...DEFAULT_ONBOARDING_DATA, ...JSON.parse(storedData) });
        }
      } catch (error) {
        console.error('[Onboarding] Load data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return { data, isLoading };
}
