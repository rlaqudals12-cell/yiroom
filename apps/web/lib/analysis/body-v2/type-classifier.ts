/**
 * C-2: 체형 유형 분류
 *
 * @module lib/analysis/body-v2/type-classifier
 * @description 체형 비율 기반 5가지 체형 유형 분류
 * @see {@link docs/principles/body-mechanics.md} 체형 역학 원리
 */

import type {
  BodyRatios,
  BodyShapeType,
  BodyShapeInfo,
} from './types';
import {
  BODY_SHAPE_INFO,
  BODY_SHAPE_THRESHOLDS,
} from './types';

// =============================================================================
// 내부 함수
// =============================================================================

/**
 * 모래시계형 판별
 *
 * @description
 * 어깨와 힙이 비슷하고 허리가 잘록한 경우
 * - 어깨-힙 차이가 10% 이내
 * - 허리가 어깨/힙의 75% 이하
 */
function isHourglass(ratios: BodyRatios): boolean {
  const { shoulderWidth, waistWidth, hipWidth } = ratios;

  // 어깨-힙 차이 10% 이내
  const shoulderHipRatio = shoulderWidth / hipWidth;
  const isBalanced = shoulderHipRatio >= 0.9 && shoulderHipRatio <= 1.1;

  // 허리가 어깨/힙 평균의 75% 이하
  const avgShoulderHip = (shoulderWidth + hipWidth) / 2;
  const waistRatio = waistWidth / avgShoulderHip;
  const hasNarrowWaist = waistRatio <= BODY_SHAPE_THRESHOLDS.hourglassWaistRatio;

  return isBalanced && hasNarrowWaist;
}

/**
 * 역삼각형 판별
 *
 * @description
 * 어깨가 넓고 힙이 좁은 경우
 * - 어깨가 힙보다 10% 이상 넓음
 */
function isInvertedTriangle(ratios: BodyRatios): boolean {
  const { shoulderWidth, hipWidth } = ratios;
  const shoulderToHipRatio = shoulderWidth / hipWidth;

  return shoulderToHipRatio >= BODY_SHAPE_THRESHOLDS.invertedTriangleRatio;
}

/**
 * 삼각형 판별
 *
 * @description
 * 힙이 어깨보다 넓은 경우
 * - 힙이 어깨보다 10% 이상 넓음
 */
function isTriangle(ratios: BodyRatios): boolean {
  const { shoulderWidth, hipWidth } = ratios;
  const hipToShoulderRatio = hipWidth / shoulderWidth;

  return hipToShoulderRatio >= BODY_SHAPE_THRESHOLDS.triangleRatio;
}

/**
 * 타원형 판별
 *
 * @description
 * 허리가 가장 넓은 경우
 * - 허리가 어깨 또는 힙보다 넓음
 */
function isOval(ratios: BodyRatios): boolean {
  const { shoulderWidth, waistWidth, hipWidth } = ratios;

  const waistToShoulderRatio = waistWidth / shoulderWidth;
  const waistToHipRatio = waistWidth / hipWidth;

  // 허리가 어깨 또는 힙과 비슷하거나 더 넓음
  return (
    waistToShoulderRatio >= BODY_SHAPE_THRESHOLDS.ovalWaistRatio ||
    waistToHipRatio >= BODY_SHAPE_THRESHOLDS.ovalWaistRatio
  );
}

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 체형 유형 분류
 *
 * @description
 * 측정된 체형 비율을 기반으로 5가지 체형 유형 중 하나를 분류합니다.
 *
 * 분류 순서 (우선순위):
 * 1. 모래시계형: 어깨-힙 균형 + 잘록한 허리
 * 2. 타원형: 허리가 가장 넓음
 * 3. 역삼각형: 어깨 > 힙
 * 4. 삼각형: 힙 > 어깨
 * 5. 직사각형: 위 조건 해당 없음 (기본값)
 *
 * @param ratios - 계산된 체형 비율
 * @returns 체형 유형
 *
 * @example
 * const bodyType = classifyBodyType(ratios);
 * console.log('체형:', bodyType); // 'hourglass'
 */
export function classifyBodyType(ratios: BodyRatios): BodyShapeType {
  // 1. 모래시계형 체크 (가장 먼저 - 특수 조건)
  if (isHourglass(ratios)) {
    return 'hourglass';
  }

  // 2. 타원형 체크 (허리가 넓은 경우 우선)
  if (isOval(ratios)) {
    return 'oval';
  }

  // 3. 역삼각형 체크
  if (isInvertedTriangle(ratios)) {
    return 'inverted-triangle';
  }

  // 4. 삼각형 체크
  if (isTriangle(ratios)) {
    return 'triangle';
  }

  // 5. 기본값: 직사각형
  return 'rectangle';
}

/**
 * 체형 정보 조회
 *
 * @description 체형 유형에 해당하는 상세 정보를 반환합니다.
 *
 * @param type - 체형 유형
 * @returns 체형 정보 (라벨, 설명, 특성, 스타일링 팁)
 *
 * @example
 * const info = getBodyShapeInfo('hourglass');
 * console.log(info.label); // '모래시계형'
 * console.log(info.stylingTips); // ['허리를 강조하는 핏', ...]
 */
export function getBodyShapeInfo(type: BodyShapeType): BodyShapeInfo {
  const info = BODY_SHAPE_INFO[type];
  return {
    type,
    ...info,
  };
}

/**
 * 모든 체형 정보 조회
 *
 * @description 5가지 체형 전체의 정보를 배열로 반환합니다.
 * @returns 모든 체형 정보 배열
 */
export function getAllBodyShapeInfo(): BodyShapeInfo[] {
  const types: BodyShapeType[] = [
    'rectangle',
    'inverted-triangle',
    'triangle',
    'oval',
    'hourglass',
  ];

  return types.map(getBodyShapeInfo);
}

/**
 * 체형 분류 신뢰도 계산
 *
 * @description
 * 분류된 체형이 얼마나 명확한지 0-100 점수로 반환합니다.
 *
 * 높은 신뢰도:
 * - 여러 기준을 충족하는 명확한 체형
 * - 경계값에서 멀리 떨어진 비율
 *
 * 낮은 신뢰도:
 * - 경계값 근처의 비율
 * - 여러 체형 특성이 혼합됨
 *
 * @param ratios - 체형 비율
 * @param classifiedType - 분류된 체형
 * @returns 신뢰도 점수 (0-100)
 */
export function calculateClassificationConfidence(
  ratios: BodyRatios,
  classifiedType: BodyShapeType
): number {
  const { shoulderWidth, waistWidth, hipWidth } = ratios;

  // 각 비율 계산
  const shoulderHipRatio = shoulderWidth / hipWidth;
  const waistToAvg = waistWidth / ((shoulderWidth + hipWidth) / 2);

  let confidence = 50; // 기본 신뢰도

  switch (classifiedType) {
    case 'hourglass': {
      // 어깨-힙 균형도 (1.0에 가까울수록 좋음)
      const balanceScore = 1 - Math.abs(1 - shoulderHipRatio);
      // 허리 잘록함 정도 (낮을수록 좋음)
      const waistScore = Math.max(0, BODY_SHAPE_THRESHOLDS.hourglassWaistRatio - waistToAvg);

      confidence += balanceScore * 30 + waistScore * 100;
      break;
    }

    case 'inverted-triangle': {
      // 어깨가 힙보다 얼마나 넓은지
      const excess = shoulderHipRatio - BODY_SHAPE_THRESHOLDS.invertedTriangleRatio;
      confidence += Math.min(excess * 100, 40);
      break;
    }

    case 'triangle': {
      // 힙이 어깨보다 얼마나 넓은지
      const hipExcess = (hipWidth / shoulderWidth) - BODY_SHAPE_THRESHOLDS.triangleRatio;
      confidence += Math.min(hipExcess * 100, 40);
      break;
    }

    case 'oval': {
      // 허리가 얼마나 넓은지
      const waistExcess = Math.max(
        waistWidth / shoulderWidth - BODY_SHAPE_THRESHOLDS.ovalWaistRatio,
        waistWidth / hipWidth - BODY_SHAPE_THRESHOLDS.ovalWaistRatio
      );
      confidence += Math.min(waistExcess * 100, 40);
      break;
    }

    case 'rectangle': {
      // 모든 비율이 얼마나 비슷한지
      const similarity = 1 - Math.abs(shoulderHipRatio - 1) - Math.abs(waistToAvg - 0.9);
      confidence += similarity * 40;
      break;
    }
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * 체형 유형별 스타일링 우선순위
 *
 * @description 체형에 맞는 스타일링 아이템 카테고리 우선순위를 반환합니다.
 *
 * @param type - 체형 유형
 * @returns 스타일링 카테고리 우선순위 배열
 */
export function getStylingPriorities(type: BodyShapeType): string[] {
  const priorities: Record<BodyShapeType, string[]> = {
    rectangle: ['벨트', 'A라인 스커트', '페플럼 탑', '하이웨이스트'],
    'inverted-triangle': ['와이드 팬츠', 'A라인 스커트', '보트넥', '브이넥'],
    triangle: ['오프숄더', '보트넥', '패드 숄더', '밝은 상의'],
    oval: ['세로줄 패턴', '롱 카디건', 'V넥', '엠파이어 라인'],
    hourglass: ['랩 드레스', '바디컨', '하이웨이스트', '벨트'],
  };

  return priorities[type];
}

/**
 * 체형별 피해야 할 스타일
 *
 * @description 체형에 맞지 않는 스타일 아이템을 반환합니다.
 *
 * @param type - 체형 유형
 * @returns 피해야 할 스타일 배열
 */
export function getStylesToAvoid(type: BodyShapeType): string[] {
  const avoid: Record<BodyShapeType, string[]> = {
    rectangle: ['박시한 상의', '일자핏 전체', '허리 없는 드레스'],
    'inverted-triangle': ['패드 숄더', '보트넥 과다', '타이트한 하의'],
    triangle: ['스키니진', '타이트 스커트', '밝은 하의'],
    oval: ['타이트핏', '가로줄 패턴', '벨트 과다'],
    hourglass: ['박시한 실루엣', '일자 드레스', '숨기는 스타일'],
  };

  return avoid[type];
}
