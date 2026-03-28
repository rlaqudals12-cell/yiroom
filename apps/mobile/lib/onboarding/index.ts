/**
 * 온보딩 시스템 통합 모듈
 */

// ============================================================
// 타입, 상수, 순수 함수
// ============================================================

export {
  // 타입
  type AnalysisInterest,
  type StylePreference,
  type OnboardingGoal,
  type ActivityLevel,
  type Gender,
  type WorkoutFrequency,
  type MealPreference,
  type OnboardingBasicInfo,
  type OnboardingPreferences,
  type OnboardingData,
  // 분석 관심 상수 (Step 1)
  ANALYSIS_LABELS,
  ANALYSIS_ICONS,
  ANALYSIS_DESCRIPTIONS,
  ANALYSIS_COLORS,
  // 스타일 상수 (Step 2)
  STYLE_PREFERENCE_LABELS,
  STYLE_PREFERENCE_DESCRIPTIONS,
  // 웰니스 목표 상수 (Step 3)
  GOAL_LABELS,
  GOAL_ICONS,
  GOAL_DESCRIPTIONS,
  GOAL_COLORS,
  ACTIVITY_LEVEL_LABELS,
  GENDER_LABELS,
  WORKOUT_FREQUENCY_LABELS,
  MEAL_PREFERENCE_LABELS,
  DEFAULT_ONBOARDING_DATA,
  // 생년월일 검증
  BIRTH_YEAR_MIN,
  MINIMUM_AGE,
  validateBirthYear,
  // 유틸리티 함수
  isOnboardingComplete,
  calculateBMI,
  getBMICategory,
  calculateAge,
} from './types';

// ============================================================
// 훅
// ============================================================

export { useOnboarding, useOnboardingCheck, useOnboardingData } from './useOnboarding';
