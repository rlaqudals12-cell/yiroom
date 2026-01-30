/**
 * 한국인 체형 표준 데이터 및 정규화 함수
 *
 * @description P2 준수: docs/principles/body-mechanics.md 섹션 6 기반
 * @module lib/body
 *
 * 데이터 출처: Size Korea 8차 조사 (2020-2023)
 */

import type {
  Gender,
  AgeGroup,
  KoreanStandard,
  NormalizedResult,
} from './types';

/**
 * 한국인 표준 데이터 (Size Korea 8차 조사)
 * @description 원리 문서 섹션 6.1 표 데이터
 */
export const KOREAN_STANDARDS: Record<Gender, Record<AgeGroup, KoreanStandard>> = {
  male: {
    '20s': { height: 174.4, shoulder: 401, waist: 78.4, hip: 94.3 },
    '30s': { height: 174.9, shoulder: 402, waist: 84.5, hip: 97.0 },
    '40s': { height: 172.5, shoulder: 397, waist: 87.0, hip: 97.5 },
    '50s': { height: 170.5, shoulder: 392, waist: 88.0, hip: 96.0 },
  },
  female: {
    '20s': { height: 161.1, shoulder: 357, waist: 68.0, hip: 91.0 },
    '30s': { height: 162.0, shoulder: 362, waist: 72.0, hip: 93.5 },
    '40s': { height: 160.4, shoulder: 362, waist: 76.0, hip: 94.5 },
    '50s': { height: 157.5, shoulder: 357, waist: 79.0, hip: 95.0 },
  },
};

/**
 * 표준편차 데이터
 * @description 원리 문서 섹션 6.3
 */
export const STD_DEV: Record<Gender, Record<keyof KoreanStandard, number>> = {
  male: { height: 5.8, shoulder: 21, waist: 8.5, hip: 5.2 },
  female: { height: 5.2, shoulder: 18, waist: 7.0, hip: 5.0 },
};

/**
 * 정규분포 CDF 근사 함수
 * @description 원리 문서 섹션 6.3 공식
 * @param zScore - Z-점수
 * @returns 백분위 (0-100)
 */
function approximateNormalCDF(zScore: number): number {
  // 원리 문서 공식: (1 + sign(z) * sqrt(1 - exp(-2z²/π))) / 2
  const sign = Math.sign(zScore);
  const absZ = Math.abs(zScore);
  const exponent = -2 * absZ * absZ / Math.PI;
  const percentile = (1 + sign * Math.sqrt(1 - Math.exp(exponent))) / 2 * 100;

  return Math.round(percentile);
}

/**
 * 한국인 표준 대비 정규화
 *
 * @description Size Korea 기준으로 z-score와 백분위를 계산합니다.
 *
 * @param value - 측정값 (height: cm, shoulder: mm, waist: cm, hip: cm)
 * @param measurement - 측정 항목
 * @param gender - 성별
 * @param ageGroup - 연령대
 * @returns Z-점수 및 백분위
 *
 * @example
 * const result = normalizeToKorean(78.4, 'waist', 'male', '20s');
 * // { zScore: 0, percentile: 50 }
 */
export function normalizeToKorean(
  value: number,
  measurement: keyof KoreanStandard,
  gender: Gender,
  ageGroup: AgeGroup
): NormalizedResult {
  const mean = KOREAN_STANDARDS[gender][ageGroup][measurement];
  const stdDev = STD_DEV[gender][measurement];

  // Z-점수 계산
  const zScore = (value - mean) / stdDev;
  const roundedZScore = Math.round(zScore * 100) / 100;

  // 백분위 계산 (정규분포 CDF 근사)
  const percentile = approximateNormalCDF(zScore);

  return {
    zScore: roundedZScore,
    percentile,
  };
}

/**
 * 연령 → 연령대 변환
 *
 * @param age - 나이
 * @returns 연령대
 */
export function ageToAgeGroup(age: number): AgeGroup {
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  if (age < 50) return '40s';
  return '50s';
}

/**
 * 표준 WHR 조회
 *
 * @description 원리 문서 섹션 6.1 WHR 값
 *
 * @param gender - 성별
 * @param ageGroup - 연령대
 * @returns 표준 WHR 값
 */
export function getStandardWHR(gender: Gender, ageGroup: AgeGroup): number {
  const standard = KOREAN_STANDARDS[gender][ageGroup];
  return Math.round((standard.waist / standard.hip) * 100) / 100;
}

/**
 * 측정값이 정상 범위인지 확인
 *
 * @param value - 측정값
 * @param measurement - 측정 항목
 * @param gender - 성별
 * @param ageGroup - 연령대
 * @param toleranceSigma - 허용 표준편차 범위 (기본: 2)
 * @returns 정상 범위 여부
 */
export function isWithinNormalRange(
  value: number,
  measurement: keyof KoreanStandard,
  gender: Gender,
  ageGroup: AgeGroup,
  toleranceSigma: number = 2
): boolean {
  const mean = KOREAN_STANDARDS[gender][ageGroup][measurement];
  const stdDev = STD_DEV[gender][measurement];

  const lowerBound = mean - toleranceSigma * stdDev;
  const upperBound = mean + toleranceSigma * stdDev;

  return value >= lowerBound && value <= upperBound;
}
