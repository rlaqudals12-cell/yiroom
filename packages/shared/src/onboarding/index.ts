/**
 * 온보딩 공통 상수 및 타입
 *
 * 웹/모바일 간 라벨 드리프트 방지를 위한 Single Source of Truth
 */

// ============================================================
// 타입 정의
// ============================================================

export type Gender = 'male' | 'female' | 'neutral';
export type StylePreference = 'masculine' | 'feminine' | 'unisex';
export type OnboardingGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'health_maintenance'
  | 'stress_relief'
  | 'better_sleep';

export type AnalysisInterest =
  | 'personal_color'
  | 'skin'
  | 'body'
  | 'hair'
  | 'makeup'
  | 'ingredients';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

// ============================================================
// 성별 라벨
// ============================================================

export const GENDER_LABELS: Record<Gender, string> = {
  male: '남성',
  female: '여성',
  neutral: '선택 안 함',
};

export const GENDER_DESCRIPTIONS: Record<Gender, string> = {
  male: '남성용 추천 스타일과 제품을 받아보세요',
  female: '여성용 추천 스타일과 제품을 받아보세요',
  neutral: '성별 구분 없이 다양한 추천을 받아보세요',
};

// ============================================================
// 스타일 선호 라벨
// ============================================================

export const STYLE_PREFERENCE_LABELS: Record<StylePreference, string> = {
  masculine: '미니멀 스타일',
  feminine: '소프트 스타일',
  unisex: '자유로운 스타일',
};

export const STYLE_PREFERENCE_SHORT_LABELS: Record<StylePreference, string> = {
  masculine: '미니멀',
  feminine: '소프트',
  unisex: '자유로운',
};

export const STYLE_PREFERENCE_DESCRIPTIONS: Record<StylePreference, string> = {
  masculine: '깔끔하고 심플한 스타일을 추천해요',
  feminine: '화사하고 부드러운 스타일을 추천해요',
  unisex: '다양한 스타일을 자유롭게 추천해요',
};

// ============================================================
// 건강 목표 라벨
// ============================================================

export const GOAL_LABELS: Record<OnboardingGoal, string> = {
  weight_loss: '체중 감량',
  muscle_gain: '근육 증가',
  health_maintenance: '건강 유지',
  stress_relief: '스트레스 해소',
  better_sleep: '수면 개선',
};

export const GOAL_DESCRIPTIONS: Record<OnboardingGoal, string> = {
  weight_loss: '건강한 식단과 운동으로 체중을 관리해요',
  muscle_gain: '근력 운동과 고단백 식단을 추천해요',
  health_maintenance: '전반적인 건강 지표를 개선해요',
  stress_relief: '유연성과 마음 챙김으로 스트레스를 줄여요',
  better_sleep: '수면 패턴 분석으로 숙면을 도와요',
};

// ============================================================
// 분석 관심사 라벨
// ============================================================

export const ANALYSIS_LABELS: Record<AnalysisInterest, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부 분석',
  body: '체형 분석',
  hair: '헤어 분석',
  makeup: '메이크업',
  ingredients: '성분 분석',
};

export const ANALYSIS_DESCRIPTIONS: Record<AnalysisInterest, string> = {
  personal_color: '내게 어울리는 색상을 찾아요',
  skin: '피부 타입과 맞춤 케어를 알아봐요',
  body: '체형에 맞는 스타일링을 추천해요',
  hair: '어울리는 헤어스타일을 찾아요',
  makeup: '퍼스널컬러 기반 메이크업을 추천해요',
  ingredients: '안전한 제품을 선택할 수 있어요',
};

// ============================================================
// 생년월일 검증
// ============================================================

export const BIRTH_YEAR_MIN = 1900;
export const MINIMUM_AGE = 14;

export function validateBirthYear(year: number): {
  valid: boolean;
  error?: string;
} {
  const currentYear = new Date().getFullYear();

  if (isNaN(year) || year < BIRTH_YEAR_MIN || year > currentYear) {
    return { valid: false, error: '올바른 출생년도를 입력해주세요' };
  }

  const age = currentYear - year;
  if (age < MINIMUM_AGE) {
    return { valid: false, error: `만 ${MINIMUM_AGE}세 이상만 이용할 수 있어요` };
  }

  return { valid: true };
}

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}
