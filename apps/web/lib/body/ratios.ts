/**
 * 체형 비율 계산 함수
 *
 * @description P2 준수: docs/principles/body-mechanics.md 섹션 2 기반
 * @module lib/body
 *
 * 원리 문서 공식:
 * - WHR = 허리 둘레 / 엉덩이 둘레
 * - SHR = 어깨 너비 / 엉덩이 너비
 * - WHtR = 허리 둘레 / 신장
 */

import type {
  Gender,
  WHRClassification,
  WHtRClassification,
  SHRClassification,
  WHRHealthStatus,
  WHtRHealthStatus,
  SHRBodyShape,
} from './types';

/**
 * WHR (Waist-to-Hip Ratio) 계산
 *
 * 공식: WHR = 허리 둘레 / 엉덩이 둘레
 *
 * @param waist - 허리 둘레 (cm)
 * @param hip - 엉덩이 둘레 (cm)
 * @returns WHR 값 (소수점 2자리)
 * @throws Error - 입력값이 0 이하인 경우
 *
 * @example
 * const whr = calculateWHR(78.4, 94.3); // 0.83
 */
export function calculateWHR(waist: number, hip: number): number {
  if (waist <= 0 || hip <= 0) {
    throw new Error('허리와 엉덩이 둘레는 0보다 커야 합니다.');
  }

  // 원리 문서 공식: WHR = 허리 둘레 / 엉덩이 둘레
  const whr = waist / hip;

  return Math.round(whr * 100) / 100;
}

/**
 * SHR (Shoulder-to-Hip Ratio) 계산
 *
 * 공식: SHR = 어깨 너비 / 엉덩이 너비
 *
 * @param shoulder - 어깨 너비 (cm)
 * @param hip - 엉덩이 너비 (cm)
 * @returns SHR 값 (소수점 2자리)
 * @throws Error - 입력값이 0 이하인 경우
 *
 * @example
 * const shr = calculateSHR(40.1, 37.2); // 1.08
 */
export function calculateSHR(shoulder: number, hip: number): number {
  if (shoulder <= 0 || hip <= 0) {
    throw new Error('어깨와 엉덩이 너비는 0보다 커야 합니다.');
  }

  // 원리 문서 공식: SHR = 어깨 너비 / 엉덩이 너비
  const shr = shoulder / hip;

  return Math.round(shr * 100) / 100;
}

/**
 * WHtR (Waist-to-Height Ratio) 계산
 *
 * 공식: WHtR = 허리 둘레 / 신장
 *
 * @param waist - 허리 둘레 (cm)
 * @param height - 신장 (cm)
 * @returns WHtR 값 (소수점 2자리)
 * @throws Error - 입력값이 0 이하인 경우
 *
 * @example
 * const whtr = calculateWHtR(78.4, 174.4); // 0.45
 */
export function calculateWHtR(waist: number, height: number): number {
  if (waist <= 0 || height <= 0) {
    throw new Error('허리 둘레와 신장은 0보다 커야 합니다.');
  }

  // 원리 문서 공식: WHtR = 허리 둘레 / 신장
  const whtr = waist / height;

  return Math.round(whtr * 100) / 100;
}

/**
 * WHR 건강 상태 분류
 *
 * WHO 기준 (원리 문서 섹션 2.1):
 * - 남성: 정상 < 0.90, 위험 >= 0.90
 * - 여성: 정상 < 0.85, 위험 >= 0.85
 *
 * @param whr - WHR 값
 * @param gender - 성별
 * @returns WHR 분류 결과
 */
export function classifyWHR(whr: number, gender: Gender): WHRClassification {
  const threshold = gender === 'male' ? 0.90 : 0.85;
  const status: WHRHealthStatus = whr < threshold ? 'normal' : 'risk';

  const description =
    status === 'normal'
      ? `정상 범위입니다 (기준: ${threshold} 미만)`
      : `주의가 필요합니다 (기준: ${threshold} 이상)`;

  return {
    value: whr,
    status,
    threshold,
    description,
  };
}

/**
 * WHtR 건강 상태 분류
 *
 * NICE 2022 기준 (원리 문서 섹션 2.2):
 * - < 0.4: 저체중 가능
 * - 0.4 ~ 0.49: 정상
 * - 0.5 ~ 0.59: 주의
 * - >= 0.6: 위험
 *
 * @param whtr - WHtR 값
 * @returns WHtR 분류 결과
 */
export function classifyWHtR(whtr: number): WHtRClassification {
  let status: WHtRHealthStatus;
  let description: string;

  if (whtr < 0.4) {
    status = 'underweight';
    description = '저체중 가능성이 있습니다. 영양 상담을 권장합니다.';
  } else if (whtr < 0.5) {
    status = 'normal';
    description = '정상 범위입니다. 허리 둘레가 신장의 절반 미만으로 건강합니다.';
  } else if (whtr < 0.6) {
    status = 'caution';
    description = '주의가 필요합니다. 생활습관 개선을 권장합니다.';
  } else {
    status = 'risk';
    description = '위험 범위입니다. 의료 상담을 권장합니다.';
  }

  return {
    value: whtr,
    status,
    description,
  };
}

/**
 * SHR 체형 분류
 *
 * 원리 문서 섹션 2.3 기준:
 * - > 1.1: 역삼각형
 * - 0.9 ~ 1.1: 균형
 * - < 0.9: 배형/삼각형
 *
 * @param shr - SHR 값
 * @returns SHR 분류 결과
 */
export function classifySHR(shr: number): SHRClassification {
  let shape: SHRBodyShape;
  let description: string;

  if (shr > 1.1) {
    shape = 'invertedTriangle';
    description = '역삼각형 체형입니다. 어깨가 넓고 상체가 발달했습니다.';
  } else if (shr >= 0.9) {
    shape = 'balanced';
    description = '균형 잡힌 체형입니다. 어깨와 엉덩이 비율이 조화롭습니다.';
  } else {
    shape = 'pear';
    description = '배형/삼각형 체형입니다. 하체가 발달했습니다.';
  }

  return {
    value: shr,
    shape,
    description,
  };
}
