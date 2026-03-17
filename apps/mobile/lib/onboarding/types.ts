/**
 * 온보딩 시스템 타입 정의
 */

// ============================================================
// 온보딩 목표 타입
// ============================================================

// 관심 분석 타입 (Step 1 — 뷰티 중심)
export type AnalysisInterest =
  | 'personal_color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'ingredients';

// 웰니스 목표 타입 (Step 3 — 선택)
export type OnboardingGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'health_maintenance'
  | 'stress_relief'
  | 'better_sleep';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type Gender = 'male' | 'female' | 'neutral';

export type StylePreference = 'masculine' | 'feminine' | 'unisex';

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
  // Step 1: 관심 분석 (뷰티 중심)
  analysisInterests: AnalysisInterest[];
  // Step 2: 성별/스타일/생년월일
  stylePreference?: StylePreference;
  // Step 3: 웰니스 목표 (선택)
  goals: OnboardingGoal[];
  // 기존 호환
  basicInfo: OnboardingBasicInfo;
  preferences: OnboardingPreferences;
  completedAt?: string;
}

// ============================================================
// 상수
// ============================================================

// ============================================================
// 관심 분석 상수 (Step 1)
// ============================================================

export const ANALYSIS_LABELS: Record<AnalysisInterest, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부 분석',
  body: '체형 분석',
  hair: '헤어 분석',
  makeup: '메이크업',
  ingredients: '성분 분석',
};

export const ANALYSIS_ICONS: Record<AnalysisInterest, string> = {
  personal_color: '🎨',
  skin: '✨',
  body: '📐',
  hair: '💇',
  makeup: '💄',
  ingredients: '🧴',
};

export const ANALYSIS_DESCRIPTIONS: Record<AnalysisInterest, string> = {
  personal_color: '내게 어울리는 색상을 찾아요',
  skin: '피부 타입과 맞춤 케어를 알아봐요',
  body: '체형에 맞는 스타일링을 추천해요',
  hair: '어울리는 헤어스타일을 찾아요',
  makeup: '퍼스널컬러 기반 메이크업을 추천해요',
  ingredients: '안전한 제품을 선택할 수 있어요',
};

export const ANALYSIS_COLORS: Record<AnalysisInterest, { gradient: [string, string]; bg: string }> = {
  personal_color: { gradient: ['#C084FC', '#A855F7'], bg: '#FAF5FF' },
  skin: { gradient: ['#F472B6', '#EC4899'], bg: '#FDF2F8' },
  body: { gradient: ['#818CF8', '#6366F1'], bg: '#EEF2FF' },
  hair: { gradient: ['#FBBF24', '#F59E0B'], bg: '#FFFBEB' },
  makeup: { gradient: ['#F9A8D4', '#EC4899'], bg: '#FDF2F8' },
  ingredients: { gradient: ['#34D399', '#10B981'], bg: '#ECFDF5' },
};

// ============================================================
// 성별/스타일 상수 (Step 2)
// ============================================================

export const STYLE_PREFERENCE_LABELS: Record<StylePreference, string> = {
  masculine: '남성적 스타일',
  feminine: '여성적 스타일',
  unisex: '유니섹스 스타일',
};

export const STYLE_PREFERENCE_DESCRIPTIONS: Record<StylePreference, string> = {
  masculine: '깔끔하고 심플한 스타일을 추천해요',
  feminine: '화사하고 부드러운 스타일을 추천해요',
  unisex: '성별 구분 없는 다양한 스타일을 추천해요',
};

// ============================================================
// 웰니스 목표 상수 (Step 3)
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

export const GOAL_DESCRIPTIONS: Record<OnboardingGoal, string> = {
  weight_loss: '건강한 식단과 운동으로 체중을 관리해요',
  muscle_gain: '근력 운동과 고단백 식단을 추천해요',
  health_maintenance: '전반적인 건강 지표를 개선해요',
  stress_relief: '유연성과 마음 챙김으로 스트레스를 줄여요',
  better_sleep: '수면 패턴 분석으로 숙면을 도와요',
};

export const GOAL_COLORS: Record<OnboardingGoal, { gradient: [string, string]; bg: string }> = {
  weight_loss: { gradient: ['#F472B6', '#EC4899'], bg: '#FDF2F8' },
  muscle_gain: { gradient: ['#A78BFA', '#8B5CF6'], bg: '#F5F3FF' },
  health_maintenance: { gradient: ['#34D399', '#10B981'], bg: '#ECFDF5' },
  stress_relief: { gradient: ['#60A5FA', '#3B82F6'], bg: '#EFF6FF' },
  better_sleep: { gradient: ['#818CF8', '#6366F1'], bg: '#EEF2FF' },
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
  neutral: '선택 안 함',
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

  // Step 1: 최소 1개 관심 분석 선택
  if (!analysisInterests || analysisInterests.length === 0) return false;

  // Step 2: 성별 + 생년월일 필수
  if (!basicInfo.gender || !basicInfo.birthYear) return false;

  // Step 3: 선택 사항 → 건너뛰기 가능
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
