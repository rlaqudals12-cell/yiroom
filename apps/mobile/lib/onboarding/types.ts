/**
 * 온보딩 시스템 타입 정의
 */

// ============================================================
// 온보딩 목표 타입
// ============================================================

export type OnboardingGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'health_maintenance'
  | 'stress_relief'
  | 'better_sleep';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Gender = 'male' | 'female' | 'other';

export type WorkoutFrequency = 'none' | '1-2' | '3-4' | '5+';

export type MealPreference = 'regular' | 'intermittent' | 'low_carb' | 'high_protein';

// ============================================================
// 온보딩 데이터 타입
// ============================================================

export interface OnboardingBasicInfo {
  gender?: Gender;
  birthYear?: number;
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: ActivityLevel;
}

export interface OnboardingPreferences {
  workoutFrequency?: WorkoutFrequency;
  mealPreference?: MealPreference;
  notificationsEnabled?: boolean;
}

export interface OnboardingData {
  goals: OnboardingGoal[];
  basicInfo: OnboardingBasicInfo;
  preferences: OnboardingPreferences;
  completedAt?: string;
}

// ============================================================
// 상수
// ============================================================

export const GOAL_LABELS: Record<OnboardingGoal, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  health_maintenance: '건강 유지',
  stress_relief: '스트레스 해소',
  better_sleep: '수면 개선',
};

export const GOAL_ICONS: Record<OnboardingGoal, string> = {
  weight_loss: '⚖️',
  muscle_gain: '💪',
  health_maintenance: '❤️',
  stress_relief: '🧘',
  better_sleep: '😴',
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  sedentary: '거의 안함',
  light: '가벼운 활동',
  moderate: '보통',
  active: '활발함',
  very_active: '매우 활발함',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: '남성',
  female: '여성',
  other: '기타',
};

export const WORKOUT_FREQUENCY_LABELS: Record<WorkoutFrequency, string> = {
  none: '운동 안 함',
  '1-2': '주 1-2회',
  '3-4': '주 3-4회',
  '5+': '주 5회 이상',
};

export const MEAL_PREFERENCE_LABELS: Record<MealPreference, string> = {
  regular: '규칙적인 식사',
  intermittent: '간헐적 단식',
  low_carb: '저탄수화물',
  high_protein: '고단백',
};

// ============================================================
// 기본값
// ============================================================

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  goals: [],
  basicInfo: {},
  preferences: {},
};

// ============================================================
// 유틸리티 함수
// ============================================================

export function isOnboardingComplete(data: OnboardingData): boolean {
  const { goals, basicInfo, preferences } = data;

  // 최소 1개 목표 선택
  if (goals.length === 0) return false;

  // 기본 정보 필수 항목
  if (!basicInfo.gender || !basicInfo.birthYear) return false;

  // 선호도 최소 1개
  if (preferences.workoutFrequency === undefined && preferences.mealPreference === undefined) {
    return false;
  }

  return true;
}

export function calculateBMI(height: number, weight: number): number {
  // height in cm, weight in kg
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  return '비만';
}

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}
