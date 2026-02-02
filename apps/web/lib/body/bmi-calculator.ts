/**
 * BMI 계산기 - 아시아 기준 (대한비만학회, KSSO)
 *
 * @module lib/body/bmi-calculator
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 4
 * @see docs/research/PHASE-K-RESEARCH.md 섹션 2.1
 *
 * 참고: 아시아인은 같은 BMI에서 더 많은 내장지방을 저장하므로
 * WHO 기준보다 낮은 기준을 적용합니다.
 */

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * BMI 카테고리 (아시아 기준)
 *
 * | 분류 | BMI 범위 | vs WHO |
 * |------|----------|--------|
 * | 저체중 | < 18.5 | 동일 |
 * | 정상 | 18.5-22.9 | WHO: 18.5-24.9 |
 * | 과체중 | 23.0-24.9 | 아시아 기준 |
 * | 1단계 비만 | 25.0-29.9 | WHO: 과체중 |
 * | 2단계 비만 | 30.0-34.9 | WHO: 1단계 비만 |
 * | 3단계 비만 | ≥ 35 | WHO: 2단계 비만 |
 */
export type BMICategory =
  | 'underweight' // 저체중 (< 18.5)
  | 'normal' // 정상 (18.5-22.9)
  | 'overweight' // 과체중/비만 전단계 (23.0-24.9)
  | 'obese1' // 1단계 비만 (25.0-29.9)
  | 'obese2' // 2단계 비만 (30.0-34.9)
  | 'obese3'; // 3단계 비만/고도비만 (≥ 35)

/**
 * BMI 계산 결과
 */
export interface BMIResult {
  /** BMI 수치 (소수점 1자리) */
  value: number;
  /** BMI 카테고리 (아시아 기준) */
  category: BMICategory;
  /** 건강 체중 범위 (kg) */
  healthyWeightRange: { min: number; max: number };
  /** 정상 BMI 범위 */
  normalBMIRange: { min: number; max: number };
  /** 이상 체중과의 차이 (kg, 양수=과체중, 음수=저체중) */
  weightDifference: number;
  /** 한국어 레이블 */
  categoryLabel: string;
  /** 의학적 면책조항 */
  disclaimer: string;
}

/**
 * 복부비만 결과
 */
export interface AbdominalObesityResult {
  /** 허리둘레 (cm) */
  waistCircumference: number;
  /** 복부비만 여부 */
  isAbdominalObesity: boolean;
  /** 성별 기준값 (cm) */
  threshold: number;
  /** 한국어 설명 */
  description: string;
}

/**
 * 체질량 종합 분석 결과
 */
export interface BodyMassAnalysis {
  /** BMI 분석 */
  bmi: BMIResult;
  /** 복부비만 분석 (허리둘레 입력 시) */
  abdominalObesity?: AbdominalObesityResult;
  /** 종합 건강 상태 */
  overallStatus: 'healthy' | 'caution' | 'warning';
  /** 종합 권장사항 */
  recommendations: string[];
}

// ============================================================================
// 상수 정의
// ============================================================================

/** 아시아 BMI 카테고리 경계값 */
const BMI_THRESHOLDS = {
  underweight: 18.5,
  normal: 23.0, // 아시아 기준 (WHO: 25.0)
  overweight: 25.0,
  obese1: 30.0,
  obese2: 35.0,
} as const;

/** 복부비만 허리둘레 기준 (cm) */
const WAIST_THRESHOLDS = {
  male: 90, // 한국 및 WHO 아시아-태평양 기준
  female: 85, // 한국 기준 (WHO 아시아-태평양: 80)
} as const;

/** BMI 카테고리 한국어 레이블 */
const CATEGORY_LABELS: Record<BMICategory, string> = {
  underweight: '저체중',
  normal: '정상',
  overweight: '과체중',
  obese1: '1단계 비만',
  obese2: '2단계 비만',
  obese3: '3단계 비만 (고도비만)',
};

/** 의학적 면책조항 */
const MEDICAL_DISCLAIMER =
  '이 결과는 참고용이며, 정확한 건강 상태 평가는 전문 의료인과 상담하시기 바랍니다. ' +
  'BMI는 근육량, 뼈 밀도, 나이 등을 고려하지 않으므로 개인 차이가 있을 수 있습니다.';

// ============================================================================
// BMI 계산 함수
// ============================================================================

/**
 * BMI 값 계산 (내부용)
 */
function computeBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * BMI 카테고리 분류 (아시아 기준)
 */
export function classifyBMI(bmi: number): BMICategory {
  if (bmi < BMI_THRESHOLDS.underweight) return 'underweight';
  if (bmi < BMI_THRESHOLDS.normal) return 'normal';
  if (bmi < BMI_THRESHOLDS.overweight) return 'overweight';
  if (bmi < BMI_THRESHOLDS.obese1) return 'obese1';
  if (bmi < BMI_THRESHOLDS.obese2) return 'obese2';
  return 'obese3';
}

/**
 * 건강 체중 범위 계산
 */
function calculateHealthyWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = heightCm / 100;
  const heightSquared = heightM * heightM;

  return {
    min: Math.round(BMI_THRESHOLDS.underweight * heightSquared * 10) / 10,
    max: Math.round((BMI_THRESHOLDS.normal - 0.1) * heightSquared * 10) / 10,
  };
}

/**
 * 이상 체중과의 차이 계산
 */
function calculateWeightDifference(
  heightCm: number,
  weightKg: number,
  category: BMICategory
): number {
  const heightM = heightCm / 100;
  const heightSquared = heightM * heightM;

  // 이상 BMI (정상 범위 중앙값: 20.7)
  const idealBMI = 20.7;
  const idealWeight = idealBMI * heightSquared;

  return Math.round((weightKg - idealWeight) * 10) / 10;
}

/**
 * BMI 계산 (메인 함수)
 *
 * @param heightCm 키 (cm), 150-200 범위
 * @param weightKg 체중 (kg), 30-150 범위
 * @returns BMI 계산 결과
 * @throws 입력값이 유효 범위를 벗어나면 에러
 *
 * @example
 * const result = calculateBMI(170, 65);
 * // { value: 22.5, category: 'normal', categoryLabel: '정상', ... }
 */
export function calculateBMI(heightCm: number, weightKg: number): BMIResult {
  // 입력 검증
  if (heightCm < 100 || heightCm > 250) {
    throw new Error(`키는 100-250cm 범위여야 합니다: ${heightCm}cm`);
  }
  if (weightKg < 20 || weightKg > 300) {
    throw new Error(`체중은 20-300kg 범위여야 합니다: ${weightKg}kg`);
  }

  const bmiValue = computeBMI(heightCm, weightKg);
  const category = classifyBMI(bmiValue);
  const healthyWeightRange = calculateHealthyWeightRange(heightCm);
  const weightDifference = calculateWeightDifference(heightCm, weightKg, category);

  return {
    value: Math.round(bmiValue * 10) / 10,
    category,
    healthyWeightRange,
    normalBMIRange: { min: 18.5, max: 22.9 },
    weightDifference,
    categoryLabel: CATEGORY_LABELS[category],
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

// ============================================================================
// 복부비만 판정
// ============================================================================

/**
 * 복부비만 판정
 *
 * @param waistCm 허리둘레 (cm)
 * @param gender 성별 ('male' | 'female')
 * @returns 복부비만 판정 결과
 *
 * @example
 * const result = checkAbdominalObesity(92, 'male');
 * // { isAbdominalObesity: true, threshold: 90, ... }
 */
export function checkAbdominalObesity(
  waistCm: number,
  gender: 'male' | 'female'
): AbdominalObesityResult {
  const threshold = WAIST_THRESHOLDS[gender];
  const isAbdominalObesity = waistCm >= threshold;

  const description = isAbdominalObesity
    ? `허리둘레 ${waistCm}cm는 복부비만 기준(${threshold}cm 이상)에 해당합니다.`
    : `허리둘레 ${waistCm}cm는 정상 범위입니다.`;

  return {
    waistCircumference: waistCm,
    isAbdominalObesity,
    threshold,
    description,
  };
}

// ============================================================================
// 종합 분석
// ============================================================================

/**
 * 체질량 종합 분석
 *
 * @param heightCm 키 (cm)
 * @param weightKg 체중 (kg)
 * @param waistCm 허리둘레 (cm, 선택)
 * @param gender 성별 (허리둘레 입력 시 필수)
 * @returns 종합 분석 결과
 */
export function analyzeBodyMass(
  heightCm: number,
  weightKg: number,
  waistCm?: number,
  gender?: 'male' | 'female'
): BodyMassAnalysis {
  const bmi = calculateBMI(heightCm, weightKg);

  let abdominalObesity: AbdominalObesityResult | undefined;
  if (waistCm !== undefined && gender !== undefined) {
    abdominalObesity = checkAbdominalObesity(waistCm, gender);
  }

  // 종합 상태 판정
  let overallStatus: 'healthy' | 'caution' | 'warning';
  if (bmi.category === 'normal' && (!abdominalObesity || !abdominalObesity.isAbdominalObesity)) {
    overallStatus = 'healthy';
  } else if (
    bmi.category === 'underweight' ||
    bmi.category === 'overweight' ||
    abdominalObesity?.isAbdominalObesity
  ) {
    overallStatus = 'caution';
  } else {
    overallStatus = 'warning';
  }

  // 권장사항 생성
  const recommendations = generateRecommendations(bmi, abdominalObesity);

  return {
    bmi,
    abdominalObesity,
    overallStatus,
    recommendations,
  };
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  bmi: BMIResult,
  abdominalObesity?: AbdominalObesityResult
): string[] {
  const recommendations: string[] = [];

  switch (bmi.category) {
    case 'underweight':
      recommendations.push('균형 잡힌 식단으로 건강한 체중 증가를 권장합니다.');
      recommendations.push('근력 운동을 통해 근육량을 늘려보세요.');
      break;
    case 'normal':
      recommendations.push('현재 건강한 체중을 유지하고 계세요!');
      recommendations.push('규칙적인 운동과 균형 잡힌 식단을 계속 유지해주세요.');
      break;
    case 'overweight':
      recommendations.push('가벼운 식단 조절과 규칙적인 운동을 권장합니다.');
      recommendations.push('하루 30분 이상 걷기부터 시작해보세요.');
      break;
    case 'obese1':
    case 'obese2':
    case 'obese3':
      recommendations.push('전문 의료인과 상담하여 건강 관리 계획을 세우시길 권장합니다.');
      recommendations.push('급격한 다이어트보다 점진적인 생활습관 개선이 효과적입니다.');
      break;
  }

  if (abdominalObesity?.isAbdominalObesity) {
    recommendations.push('복부 지방 감소를 위해 유산소 운동을 병행해보세요.');
    recommendations.push('당분과 정제 탄수화물 섭취를 줄이는 것이 도움됩니다.');
  }

  return recommendations;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * BMI 카테고리 레이블 조회
 */
export function getBMICategoryLabel(category: BMICategory): string {
  return CATEGORY_LABELS[category];
}

/**
 * BMI 값으로 카테고리 레이블 직접 조회
 */
export function getBMILabelFromValue(bmi: number): string {
  return CATEGORY_LABELS[classifyBMI(bmi)];
}

/**
 * 목표 체중 계산 (정상 BMI 범위 기준)
 */
export function calculateTargetWeight(
  heightCm: number,
  targetBMI: number = 21
): { min: number; ideal: number; max: number } {
  const heightM = heightCm / 100;
  const heightSquared = heightM * heightM;

  return {
    min: Math.round(18.5 * heightSquared * 10) / 10,
    ideal: Math.round(targetBMI * heightSquared * 10) / 10,
    max: Math.round(22.9 * heightSquared * 10) / 10,
  };
}

/**
 * BMI 수치 색상 코드 (UI용)
 */
export function getBMIColor(category: BMICategory): string {
  const colors: Record<BMICategory, string> = {
    underweight: '#3B82F6', // blue
    normal: '#22C55E', // green
    overweight: '#F59E0B', // amber
    obese1: '#F97316', // orange
    obese2: '#EF4444', // red
    obese3: '#DC2626', // dark red
  };
  return colors[category];
}
