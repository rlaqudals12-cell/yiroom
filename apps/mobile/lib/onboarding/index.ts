/**
 * 온보딩 시스템 통합 모듈
 */

// ============================================================
// 타입, 상수, 순수 함수
// ============================================================

export {
  // 타입
  type OnboardingGoal,
  type ActivityLevel,
  type Gender,
  type WorkoutFrequency,
  type MealPreference,
  type OnboardingBasicInfo,
  type OnboardingPreferences,
  type OnboardingData,
  // 상수
  GOAL_LABELS,
  GOAL_ICONS,
  ACTIVITY_LEVEL_LABELS,
  GENDER_LABELS,
  WORKOUT_FREQUENCY_LABELS,
  MEAL_PREFERENCE_LABELS,
  DEFAULT_ONBOARDING_DATA,
  // 유틸리티 함수
  isOnboardingComplete,
  calculateBMI,
  getBMICategory,
  calculateAge,
} from './types';

// ============================================================
// 훅
// ============================================================

export {
  useOnboarding,
  useOnboardingCheck,
  useOnboardingData,
} from './useOnboarding';
