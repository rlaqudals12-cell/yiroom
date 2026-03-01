/**
 * 체형 측정 유틸 모듈
 *
 * 비율 계산, 체형 분류, BMI, 한국인 표준 비교
 *
 * @module lib/body
 * @see docs/principles/body-mechanics.md
 */

// ─── 타입 ────────────────────────────────────────────

export type Gender = 'male' | 'female';
export type AgeGroup = '20s' | '30s' | '40s' | '50s';

export interface BodyMeasurements {
  bust?: number;
  waist: number;
  hip: number;
  shoulder?: number;
  height: number;
  weight?: number;
  gender: Gender;
  age?: number;
}

export interface BodyRatios {
  whr: number;
  shr: number | null;
  whtr: number;
}

export type BodyShape7 =
  | 'hourglass'
  | 'pear'
  | 'invertedTriangle'
  | 'apple'
  | 'rectangle'
  | 'trapezoid'
  | 'oval';

export interface BodyTypeResult {
  shape: BodyShape7;
  label: string;
  description: string;
  ratios: BodyRatios;
  confidence: number;
}

export type WHRHealthStatus = 'healthy' | 'moderate' | 'high';
export type WHtRHealthStatus = 'thin' | 'healthy' | 'overweight' | 'obese';

export interface WHRClassification {
  value: number;
  status: WHRHealthStatus;
  label: string;
}

export interface WHtRClassification {
  value: number;
  status: WHtRHealthStatus;
  label: string;
}

export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese1' | 'obese2' | 'obese3';

export interface BMIResult {
  value: number;
  category: BMICategory;
  label: string;
  idealWeightRange: { min: number; max: number };
}

// ─── 비율 계산 ────────────────────────────────────────

/**
 * WHR (허리-엉덩이 비율)
 */
export function calculateWHR(waistCm: number, hipCm: number): number {
  return Math.round((waistCm / hipCm) * 1000) / 1000;
}

/**
 * SHR (어깨-엉덩이 비율)
 */
export function calculateSHR(shoulderCm: number, hipCm: number): number {
  return Math.round((shoulderCm / hipCm) * 1000) / 1000;
}

/**
 * WHtR (허리-키 비율)
 */
export function calculateWHtR(waistCm: number, heightCm: number): number {
  return Math.round((waistCm / heightCm) * 1000) / 1000;
}

// ─── 비율 분류 ────────────────────────────────────────

/**
 * WHR 건강 분류
 */
export function classifyWHR(whr: number, gender: Gender): WHRClassification {
  const threshold = gender === 'female' ? 0.85 : 0.9;
  const moderate = gender === 'female' ? 0.8 : 0.85;

  if (whr < moderate) return { value: whr, status: 'healthy', label: '건강' };
  if (whr < threshold) return { value: whr, status: 'moderate', label: '주의' };
  return { value: whr, status: 'high', label: '위험' };
}

/**
 * WHtR 건강 분류
 */
export function classifyWHtR(whtr: number): WHtRClassification {
  if (whtr < 0.4) return { value: whtr, status: 'thin', label: '마름' };
  if (whtr < 0.5) return { value: whtr, status: 'healthy', label: '건강' };
  if (whtr < 0.6) return { value: whtr, status: 'overweight', label: '과체중' };
  return { value: whtr, status: 'obese', label: '비만' };
}

/**
 * 모든 비율 계산
 */
export function calculateAllRatios(measurements: BodyMeasurements): BodyRatios {
  return {
    whr: calculateWHR(measurements.waist, measurements.hip),
    shr: measurements.shoulder
      ? calculateSHR(measurements.shoulder, measurements.hip)
      : null,
    whtr: calculateWHtR(measurements.waist, measurements.height),
  };
}

// ─── 체형 분류 (7-Type) ───────────────────────────────

export const BODY_SHAPE_LABELS: Record<BodyShape7, string> = {
  hourglass: '모래시계형',
  pear: '배형',
  invertedTriangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴형',
  oval: '타원형',
};

export const BODY_SHAPE_DESCRIPTIONS: Record<BodyShape7, string> = {
  hourglass: '상체와 하체가 균형잡힌 S라인',
  pear: '하체가 상체보다 넓은 안정적 체형',
  invertedTriangle: '어깨가 넓고 하체가 좁은 역삼각형',
  apple: '허리 중심으로 볼륨이 있는 체형',
  rectangle: '상하체 폭이 비슷한 일직선 체형',
  trapezoid: '어깨가 넓고 허리-엉덩이가 균형잡힌 남성적 체형',
  oval: '전체적으로 둥근 곡선형 체형',
};

/**
 * 체형 분류
 */
export function classifyBodyType(measurements: BodyMeasurements): BodyTypeResult {
  const ratios = calculateAllRatios(measurements);
  const { waist, hip, gender } = measurements;
  const bust = measurements.bust ?? hip;
  const shoulder = measurements.shoulder;

  // 비율 기반 분류 로직
  const bustHipDiff = Math.abs(bust - hip);
  const waistBustRatio = waist / bust;
  const waistHipRatio = ratios.whr;

  let shape: BodyShape7;
  let confidence = 0.7;

  if (bustHipDiff < 5 && waistBustRatio < 0.75) {
    shape = 'hourglass';
    confidence = 0.85;
  } else if (hip > bust + 5 && waistHipRatio < 0.8) {
    shape = 'pear';
    confidence = 0.8;
  } else if (shoulder && ratios.shr && ratios.shr > 1.05 && gender === 'male') {
    shape = 'trapezoid';
    confidence = 0.75;
  } else if (bust > hip + 5 || (shoulder && shoulder > hip * 1.1)) {
    shape = 'invertedTriangle';
    confidence = 0.75;
  } else if (waistHipRatio > 0.85 && waistBustRatio > 0.85) {
    if (gender === 'female') {
      shape = 'apple';
    } else {
      shape = 'oval';
    }
    confidence = 0.7;
  } else {
    shape = 'rectangle';
    confidence = 0.65;
  }

  return {
    shape,
    label: BODY_SHAPE_LABELS[shape],
    description: BODY_SHAPE_DESCRIPTIONS[shape],
    ratios,
    confidence,
  };
}

// ─── BMI ──────────────────────────────────────────────

/**
 * BMI 계산 (아시아 기준)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * BMI 분류 (아시아-태평양 기준)
 */
export function classifyBMI(bmi: number): BMICategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 23) return 'normal';
  if (bmi < 25) return 'overweight';
  if (bmi < 30) return 'obese1';
  if (bmi < 35) return 'obese2';
  return 'obese3';
}

export const BMI_LABELS: Record<BMICategory, string> = {
  underweight: '저체중',
  normal: '정상',
  overweight: '과체중',
  obese1: '비만 1단계',
  obese2: '비만 2단계',
  obese3: '고도비만',
};

/**
 * BMI 분석 결과
 */
export function analyzeBMI(weightKg: number, heightCm: number): BMIResult {
  const value = calculateBMI(weightKg, heightCm);
  const category = classifyBMI(value);
  const heightM = heightCm / 100;

  return {
    value,
    category,
    label: BMI_LABELS[category],
    idealWeightRange: {
      min: Math.round(18.5 * heightM * heightM * 10) / 10,
      max: Math.round(23 * heightM * heightM * 10) / 10,
    },
  };
}

// ─── 한국인 표준 ──────────────────────────────────────

// Size Korea 8차 조사 (2020) 평균값
export const KOREAN_STANDARDS: Record<Gender, Record<AgeGroup, { waist: number; hip: number; shoulder: number; height: number }>> = {
  female: {
    '20s': { waist: 68.5, hip: 93.8, shoulder: 36.2, height: 161.4 },
    '30s': { waist: 72.1, hip: 95.2, shoulder: 36.5, height: 160.8 },
    '40s': { waist: 76.4, hip: 96.1, shoulder: 36.8, height: 159.5 },
    '50s': { waist: 80.2, hip: 96.5, shoulder: 37.0, height: 157.8 },
  },
  male: {
    '20s': { waist: 78.4, hip: 94.3, shoulder: 40.2, height: 174.1 },
    '30s': { waist: 83.2, hip: 95.8, shoulder: 40.5, height: 173.5 },
    '40s': { waist: 86.5, hip: 96.2, shoulder: 40.8, height: 172.1 },
    '50s': { waist: 87.8, hip: 95.5, shoulder: 40.6, height: 170.2 },
  },
};

/**
 * 나이 → AgeGroup 변환
 */
export function ageToAgeGroup(age: number): AgeGroup {
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  if (age < 50) return '40s';
  return '50s';
}

/**
 * 한국인 표준 대비 정규화 (z-score 근사)
 */
export function normalizeToKorean(
  measurement: number,
  field: 'waist' | 'hip' | 'shoulder' | 'height',
  gender: Gender,
  ageGroup: AgeGroup
): { zScore: number; percentile: string } {
  const standard = KOREAN_STANDARDS[gender][ageGroup];
  const mean = standard[field];
  // 표준편차 근사값 (Size Korea 기반)
  const stdDev = mean * 0.08;
  const zScore = Math.round(((measurement - mean) / stdDev) * 100) / 100;

  let percentile: string;
  if (zScore < -2) percentile = '하위 2%';
  else if (zScore < -1) percentile = '하위 16%';
  else if (zScore < 0) percentile = '평균 이하';
  else if (zScore < 1) percentile = '평균 이상';
  else if (zScore < 2) percentile = '상위 16%';
  else percentile = '상위 2%';

  return { zScore, percentile };
}
