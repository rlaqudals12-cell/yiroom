/**
 * 7-Type 체형 분류 함수
 *
 * @description P2 준수: docs/principles/body-mechanics.md 섹션 5.2, 5.3 기반
 * @module lib/body
 *
 * 과일형 분류 알고리즘:
 * - 여성: 모래시계, 배형, 역삼각형, 사과형, 직사각형
 * - 남성: 역삼각형, 사다리꼴, 직사각형, 삼각형, 타원형
 */

import type {
  Gender,
  BodyRatios,
  BodyTypeResult,
  BodyShape7,
} from './types';
import { calculateWHR, calculateSHR, calculateWHtR } from './ratios';

/**
 * 체형 분류에 필요한 측정값
 */
export interface ClassifyInput {
  bust: number;      // 가슴 둘레 (cm) - 여성용
  waist: number;     // 허리 둘레 (cm)
  hip: number;       // 엉덩이 둘레 (cm)
  shoulder: number;  // 어깨 너비 (cm)
  height: number;    // 신장 (cm)
  gender: Gender;
}

/**
 * 체형별 한국어 이름 매핑
 */
const BODY_SHAPE_KOREAN: Record<BodyShape7, string> = {
  hourglass: '모래시계형',
  pear: '배형',
  invertedTriangle: '역삼각형',
  apple: '사과형',
  rectangle: '직사각형',
  trapezoid: '사다리꼴',
  oval: '타원형',
};

/**
 * 여성 체형 분류 (과일형)
 *
 * 원리 문서 섹션 5.2 기준:
 * - 모래시계: (bust-hips) <= 1" AND (bust-waist >= 9" OR hips-waist >= 10")
 * - 배형: (hips-bust) >= 3.6" AND (hips-waist) < 9"
 * - 역삼각형: (bust-hips) >= 3.6" AND (bust-waist) < 9"
 * - 사과형: waist >= bust OR waist >= hips
 * - 직사각형: 모든 측정치 ±5%, waist > bust×0.75
 *
 * @param bust - 가슴 둘레 (cm)
 * @param waist - 허리 둘레 (cm)
 * @param hip - 엉덩이 둘레 (cm)
 * @returns 체형 분류 결과
 */
function classifyFemaleBody(
  bust: number,
  waist: number,
  hip: number
): BodyTypeResult {
  // 인치 → cm 변환 (1인치 = 2.54cm)
  const CM_PER_INCH = 2.54;

  const bustHipDiff = bust - hip;
  const hipsBustDiff = hip - bust;
  const bustWaistDiff = bust - waist;
  const hipsWaistDiff = hip - waist;

  // 모래시계형: 가슴과 엉덩이 비슷, 허리 잘록함
  if (
    Math.abs(bustHipDiff) <= 1 * CM_PER_INCH &&
    (bustWaistDiff >= 9 * CM_PER_INCH || hipsWaistDiff >= 10 * CM_PER_INCH)
  ) {
    return {
      type: 'hourglass',
      confidence: 0.9,
      koreanName: BODY_SHAPE_KOREAN.hourglass,
    };
  }

  // 배형: 엉덩이가 가슴보다 훨씬 큼
  if (hipsBustDiff >= 3.6 * CM_PER_INCH && hipsWaistDiff < 9 * CM_PER_INCH) {
    return {
      type: 'pear',
      confidence: 0.85,
      koreanName: BODY_SHAPE_KOREAN.pear,
    };
  }

  // 역삼각형: 가슴이 엉덩이보다 훨씬 큼
  if (bustHipDiff >= 3.6 * CM_PER_INCH && bustWaistDiff < 9 * CM_PER_INCH) {
    return {
      type: 'invertedTriangle',
      confidence: 0.85,
      koreanName: BODY_SHAPE_KOREAN.invertedTriangle,
    };
  }

  // 사과형: 허리가 가슴 또는 엉덩이보다 큼
  if (waist >= bust || waist >= hip) {
    return {
      type: 'apple',
      confidence: 0.8,
      koreanName: BODY_SHAPE_KOREAN.apple,
    };
  }

  // 직사각형: 전체적으로 일자형
  return {
    type: 'rectangle',
    confidence: 0.7,
    koreanName: BODY_SHAPE_KOREAN.rectangle,
  };
}

/**
 * 남성 체형 분류 (과일형)
 *
 * 원리 문서 섹션 5.3 기준:
 * - 역삼각형: SHR > 1.2 AND 어깨/허리 > 1.15
 * - 사다리꼴: SHR > 1.05 AND 어깨/허리 > 1.2
 * - 직사각형: 어깨 ≈ 엉덩이 ≈ 허리
 * - 삼각형: 엉덩이 > 어깨
 * - 타원형: 허리 >= 어깨 AND 허리 >= 엉덩이
 *
 * @param shoulder - 어깨 너비 (cm)
 * @param waist - 허리 둘레 (cm)
 * @param hip - 엉덩이 너비/둘레 (cm)
 * @returns 체형 분류 결과
 */
function classifyMaleBody(
  shoulder: number,
  waist: number,
  hip: number
): BodyTypeResult {
  const shr = shoulder / hip;
  const shoulderWaistRatio = shoulder / waist;

  // 역삼각형: 어깨가 매우 넓고 허리가 좁음
  if (shr > 1.2 && shoulderWaistRatio > 1.15) {
    return {
      type: 'invertedTriangle',
      confidence: 0.9,
      koreanName: BODY_SHAPE_KOREAN.invertedTriangle,
    };
  }

  // 사다리꼴: 어깨가 넓지만 균형 잡힘
  if (shr > 1.05 && shoulderWaistRatio > 1.2) {
    return {
      type: 'trapezoid',
      confidence: 0.85,
      koreanName: BODY_SHAPE_KOREAN.trapezoid,
    };
  }

  // 타원형: 허리가 가장 넓음
  if (waist >= shoulder && waist >= hip) {
    return {
      type: 'oval',
      confidence: 0.8,
      koreanName: BODY_SHAPE_KOREAN.oval,
    };
  }

  // 삼각형 (배형): 엉덩이가 어깨보다 넓음
  if (hip > shoulder) {
    return {
      type: 'pear',
      confidence: 0.75,
      koreanName: BODY_SHAPE_KOREAN.pear,
    };
  }

  // 직사각형: 전체적으로 비슷함
  return {
    type: 'rectangle',
    confidence: 0.7,
    koreanName: BODY_SHAPE_KOREAN.rectangle,
  };
}

/**
 * 7-Type 체형 분류
 *
 * @description 성별에 따라 적절한 분류 알고리즘을 적용합니다.
 *
 * @param input - 체형 측정값
 * @returns 체형 분류 결과
 * @throws Error - 필수 측정값이 누락된 경우
 *
 * @example
 * const result = classifyBodyType({
 *   bust: 88,
 *   waist: 68,
 *   hip: 91,
 *   shoulder: 36,
 *   height: 161,
 *   gender: 'female',
 * });
 * // { type: 'hourglass', confidence: 0.9, koreanName: '모래시계형' }
 */
export function classifyBodyType(input: ClassifyInput): BodyTypeResult {
  const { bust, waist, hip, shoulder, gender } = input;

  // 입력값 검증
  if (waist <= 0 || hip <= 0 || shoulder <= 0) {
    throw new Error('허리, 엉덩이, 어깨 측정값은 0보다 커야 합니다.');
  }

  if (gender === 'female') {
    if (bust <= 0) {
      throw new Error('여성 체형 분류에는 가슴 둘레가 필요합니다.');
    }
    return classifyFemaleBody(bust, waist, hip);
  }

  return classifyMaleBody(shoulder, waist, hip);
}

/**
 * 비율 기반 체형 분류 (간소화 버전)
 *
 * @description BodyRatios 객체를 입력받아 체형을 분류합니다.
 *              bust 측정값이 없을 때 사용합니다.
 *
 * @param ratios - WHR, SHR, WHtR 비율값
 * @param gender - 성별
 * @returns 체형 분류 결과
 *
 * @example
 * const ratios = { whr: 0.75, shr: 0.95, whtr: 0.42 };
 * const result = classifyBodyTypeFromRatios(ratios, 'female');
 */
export function classifyBodyTypeFromRatios(
  ratios: BodyRatios,
  gender: Gender
): BodyTypeResult {
  const { whr, shr } = ratios;

  // SHR 기반 기본 분류
  if (shr > 1.1) {
    return {
      type: 'invertedTriangle',
      confidence: 0.8,
      koreanName: BODY_SHAPE_KOREAN.invertedTriangle,
    };
  }

  if (shr < 0.9) {
    return {
      type: 'pear',
      confidence: 0.75,
      koreanName: BODY_SHAPE_KOREAN.pear,
    };
  }

  // WHR 기반 세부 분류
  if (gender === 'female') {
    if (whr < 0.75) {
      return {
        type: 'hourglass',
        confidence: 0.7,
        koreanName: BODY_SHAPE_KOREAN.hourglass,
      };
    }
    if (whr >= 0.85) {
      return {
        type: 'apple',
        confidence: 0.7,
        koreanName: BODY_SHAPE_KOREAN.apple,
      };
    }
  } else {
    if (whr >= 0.90) {
      return {
        type: 'oval',
        confidence: 0.7,
        koreanName: BODY_SHAPE_KOREAN.oval,
      };
    }
    if (shr > 1.05 && whr < 0.85) {
      return {
        type: 'trapezoid',
        confidence: 0.7,
        koreanName: BODY_SHAPE_KOREAN.trapezoid,
      };
    }
  }

  return {
    type: 'rectangle',
    confidence: 0.6,
    koreanName: BODY_SHAPE_KOREAN.rectangle,
  };
}

/**
 * 모든 체형 비율 계산
 *
 * @param waist - 허리 둘레 (cm)
 * @param hip - 엉덩이 둘레/너비 (cm)
 * @param shoulder - 어깨 너비 (cm)
 * @param height - 신장 (cm)
 * @returns 체형 비율 객체
 */
export function calculateAllRatios(
  waist: number,
  hip: number,
  shoulder: number,
  height: number
): BodyRatios {
  return {
    whr: calculateWHR(waist, hip),
    shr: calculateSHR(shoulder, hip),
    whtr: calculateWHtR(waist, height),
  };
}
