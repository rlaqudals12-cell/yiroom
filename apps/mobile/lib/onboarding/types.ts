/**
 * 온보딩 시스템 타입 정의
 *
 * 공통 타입/라벨: @yiroom/shared에서 re-export (Single Source of Truth)
 * 모바일 전용 상수: 이 파일에서 직접 정의 (색상, 아이콘 등 UI 전용)
 */

// ============================================================
// 공통 타입 및 라벨 — @yiroom/shared에서 re-export
// ============================================================

export {
  // 타입
  type Gender,
  type StylePreference,
  type OnboardingGoal,
  type AnalysisInterest,
  type ActivityLevel,
  // 성별
  GENDER_LABELS,
  GENDER_DESCRIPTIONS,
  // 스타일
  STYLE_PREFERENCE_LABELS,
  STYLE_PREFERENCE_DESCRIPTIONS,
  // 건강 목표
  GOAL_LABELS,
  GOAL_DESCRIPTIONS,
  // 분석 관심사
  ANALYSIS_LABELS,
  ANALYSIS_DESCRIPTIONS,
  // 생년월일 검증
  BIRTH_YEAR_MIN,
  MINIMUM_AGE,
  validateBirthYear,
  calculateAge,
} from '@yiroom/shared/onboarding';

// ============================================================
// 모바일 전용 타입
// ============================================================

export type WorkoutFrequency = 'none' | '1-2' | '3-4' | '5+';
export type MealPreference = 'regular' | 'intermittent' | 'low_carb' | 'high_protein';

export interface OnboardingBasicInfo {
  gender?: import('@yiroom/shared/onboarding').Gender;
  birthYear?: number;
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: import('@yiroom/shared/onboarding').ActivityLevel;
}

export interface OnboardingPreferences {
  workoutFrequency?: WorkoutFrequency;
  mealPreference?: MealPreference;
  notificationsEnabled?: boolean;
}

export interface OnboardingData {
  // Step 1: 관심 분석 (뷰티 중심)
  analysisInterests: import('@yiroom/shared/onboarding').AnalysisInterest[];
  // Step 2: 성별/스타일/생년월일
  stylePreference?: import('@yiroom/shared/onboarding').StylePreference;
  // Step 3: 웰니스 목표 (선택)
  goals: import('@yiroom/shared/onboarding').OnboardingGoal[];
  // 기존 호환
  basicInfo: OnboardingBasicInfo;
  preferences: OnboardingPreferences;
  completedAt?: string;
}

// ============================================================
// 모바일 전용 상수 — UI 색상/아이콘 (플랫폼 의존)
// ============================================================

export const ANALYSIS_ICONS: Record<import('@yiroom/shared/onboarding').AnalysisInterest, string> = {
  personal_color: '',
  skin: '',
  body: '',
  hair: '',
  makeup: '',
  ingredients: '',
};

export const ANALYSIS_COLORS: Record<import('@yiroom/shared/onboarding').AnalysisInterest, { gradient: [string, string]; bg: string }> = {
  personal_color: { gradient: ['#C084FC', '#A855F7'], bg: '#FAF5FF' },
  skin: { gradient: ['#F472B6', '#EC4899'], bg: '#FDF2F8' },
  body: { gradient: ['#818CF8', '#6366F1'], bg: '#EEF2FF' },
  hair: { gradient: ['#FBBF24', '#F59E0B'], bg: '#FFFBEB' },
  makeup: { gradient: ['#F9A8D4', '#EC4899'], bg: '#FDF2F8' },
  ingredients: { gradient: ['#34D399', '#10B981'], bg: '#ECFDF5' },
};

export const GOAL_ICONS: Record<import('@yiroom/shared/onboarding').OnboardingGoal, string> = {
  weight_loss: '',
  muscle_gain: '',
  health_maintenance: '',
  stress_relief: '',
  better_sleep: '',
};

export const GOAL_COLORS: Record<import('@yiroom/shared/onboarding').OnboardingGoal, { gradient: [string, string]; bg: string }> = {
  weight_loss: { gradient: ['#F472B6', '#EC4899'], bg: '#FDF2F8' },
  muscle_gain: { gradient: ['#A78BFA', '#8B5CF6'], bg: '#F5F3FF' },
  health_maintenance: { gradient: ['#34D399', '#10B981'], bg: '#ECFDF5' },
  stress_relief: { gradient: ['#60A5FA', '#3B82F6'], bg: '#EFF6FF' },
  better_sleep: { gradient: ['#818CF8', '#6366F1'], bg: '#EEF2FF' },
};

export const ACTIVITY_LEVEL_LABELS: Record<import('@yiroom/shared/onboarding').ActivityLevel, string> = {
  sedentary: '거의 안함',
  light: '가벼운 활동',
  moderate: '보통',
  active: '활발함',
  very_active: '매우 활발함',
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
  analysisInterests: [],
  goals: [],
  basicInfo: {},
  preferences: {},
};

// ============================================================
// 유틸리티 함수
// ============================================================

export function isOnboardingComplete(data: OnboardingData): boolean {
  const { analysisInterests, basicInfo } = data;
  if (!analysisInterests || analysisInterests.length === 0) return false;
  if (!basicInfo.gender || !basicInfo.birthYear) return false;
  return true;
}

export function calculateBMI(height: number, weight: number): number {
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '저체중';
  if (bmi < 23) return '정상';
  if (bmi < 25) return '과체중';
  return '비만';
}
