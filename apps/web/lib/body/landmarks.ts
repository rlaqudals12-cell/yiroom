/**
 * MediaPipe Pose 33 랜드마크 추출 및 체형 측정 변환
 *
 * @description P2 준수: docs/principles/body-mechanics.md 섹션 1 기반
 * @module lib/body
 *
 * 주요 랜드마크 인덱스:
 * - 11, 12: 왼쪽/오른쪽 어깨
 * - 23, 24: 왼쪽/오른쪽 엉덩이
 * - 25, 26: 왼쪽/오른쪽 무릎
 * - 27, 28: 왼쪽/오른쪽 발목
 */

import type {
  PoseLandmark,
  LandmarkIndex,
  Point2D,
  BodyProportions,
  LandmarkMeasurements,
  PixelToRealConfig,
} from './types';

// ============================================
// 랜드마크 인덱스 상수 (MediaPipe Pose 33)
// ============================================

/**
 * MediaPipe Pose 33 랜드마크 인덱스
 * @description 원리 문서 섹션 1.1
 */
export const LANDMARK_INDEX: Record<string, LandmarkIndex> = {
  // 얼굴
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,

  // 상체
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,

  // 하체
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * 체형 분석에 필수인 랜드마크 인덱스
 */
export const ESSENTIAL_LANDMARKS: LandmarkIndex[] = [
  LANDMARK_INDEX.LEFT_SHOULDER,
  LANDMARK_INDEX.RIGHT_SHOULDER,
  LANDMARK_INDEX.LEFT_HIP,
  LANDMARK_INDEX.RIGHT_HIP,
  LANDMARK_INDEX.LEFT_KNEE,
  LANDMARK_INDEX.RIGHT_KNEE,
  LANDMARK_INDEX.LEFT_ANKLE,
  LANDMARK_INDEX.RIGHT_ANKLE,
];

// ============================================
// 신뢰도 검증
// ============================================

/**
 * 랜드마크 신뢰도 임계값
 * @description 원리 문서 섹션 1.3 - visibility/presence > 0.5
 */
const RELIABILITY_THRESHOLD = 0.5;

/**
 * 랜드마크 신뢰도 검증
 *
 * @param landmark - MediaPipe 랜드마크
 * @returns 신뢰 가능 여부
 */
export function isReliableLandmark(landmark: PoseLandmark): boolean {
  return (
    (landmark.visibility ?? 0) > RELIABILITY_THRESHOLD &&
    (landmark.presence ?? 0) > RELIABILITY_THRESHOLD
  );
}

/**
 * 필수 랜드마크들의 신뢰도 검증
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 모든 필수 랜드마크가 신뢰 가능한지 여부
 */
export function areEssentialLandmarksReliable(landmarks: PoseLandmark[]): boolean {
  return ESSENTIAL_LANDMARKS.every((index) => {
    const landmark = landmarks[index];
    return landmark && isReliableLandmark(landmark);
  });
}

/**
 * 랜드마크 신뢰도 요약
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 신뢰도 요약 객체
 */
export function getLandmarkReliabilitySummary(landmarks: PoseLandmark[]): {
  totalCount: number;
  reliableCount: number;
  essentialReliable: boolean;
  unreliableIndices: LandmarkIndex[];
} {
  const unreliableIndices: LandmarkIndex[] = [];
  let reliableCount = 0;

  landmarks.forEach((landmark, index) => {
    if (isReliableLandmark(landmark)) {
      reliableCount++;
    } else if (ESSENTIAL_LANDMARKS.includes(index as LandmarkIndex)) {
      unreliableIndices.push(index as LandmarkIndex);
    }
  });

  return {
    totalCount: landmarks.length,
    reliableCount,
    essentialReliable: unreliableIndices.length === 0,
    unreliableIndices,
  };
}

// ============================================
// 유클리드 거리 계산
// ============================================

/**
 * 2D 유클리드 거리 계산
 *
 * @param p1 - 점 1
 * @param p2 - 점 2
 * @returns 유클리드 거리
 */
function euclideanDistance2D(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 두 점의 중점 계산
 *
 * @param p1 - 점 1
 * @param p2 - 점 2
 * @returns 중점 좌표
 */
function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

// ============================================
// 체형 측정 추출 함수
// ============================================

/**
 * 어깨 너비 추정 (픽셀 단위)
 *
 * @description 랜드마크 11(왼쪽 어깨), 12(오른쪽 어깨) 간 유클리드 거리
 * @see docs/principles/body-mechanics.md 섹션 1.2
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 어깨 너비 (정규화된 좌표 기준, 0-1)
 * @throws Error - 필수 랜드마크가 신뢰할 수 없는 경우
 */
export function estimateShoulderWidth(landmarks: PoseLandmark[]): number {
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];

  if (!leftShoulder || !rightShoulder) {
    throw new Error('어깨 랜드마크가 누락되었습니다.');
  }

  if (!isReliableLandmark(leftShoulder) || !isReliableLandmark(rightShoulder)) {
    throw new Error('어깨 랜드마크의 신뢰도가 낮습니다.');
  }

  // 2D 거리 (정면 이미지 기준)
  return euclideanDistance2D(leftShoulder, rightShoulder);
}

/**
 * 엉덩이 너비 추정 (픽셀 단위)
 *
 * @description 랜드마크 23(왼쪽 엉덩이), 24(오른쪽 엉덩이) 간 유클리드 거리
 * @see docs/principles/body-mechanics.md 섹션 1.2
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 엉덩이 너비 (정규화된 좌표 기준, 0-1)
 * @throws Error - 필수 랜드마크가 신뢰할 수 없는 경우
 */
export function estimateHipWidth(landmarks: PoseLandmark[]): number {
  const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];

  if (!leftHip || !rightHip) {
    throw new Error('엉덩이 랜드마크가 누락되었습니다.');
  }

  if (!isReliableLandmark(leftHip) || !isReliableLandmark(rightHip)) {
    throw new Error('엉덩이 랜드마크의 신뢰도가 낮습니다.');
  }

  return euclideanDistance2D(leftHip, rightHip);
}

/**
 * 허리 위치 추정 (어깨-엉덩이 중간점 기준)
 *
 * @description MediaPipe에 허리 랜드마크가 없으므로 어깨-엉덩이 중간점(약 60%)을 허리로 추정
 * @see docs/principles/body-mechanics.md 섹션 1.2 주의사항
 *
 * @param landmarks - 33개 랜드마크 배열
 * @param ratio - 어깨~엉덩이 구간에서 허리 위치 비율 (기본: 0.6, 어깨에서 60% 지점)
 * @returns 허리 위치 좌표
 */
export function estimateWaistPosition(
  landmarks: PoseLandmark[],
  ratio: number = 0.6
): Point2D {
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];

  // 어깨 중점
  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  // 엉덩이 중점
  const hipMid = midpoint(leftHip, rightHip);

  // 어깨 중점에서 엉덩이 중점 방향으로 ratio 비율 지점
  return {
    x: shoulderMid.x + (hipMid.x - shoulderMid.x) * ratio,
    y: shoulderMid.y + (hipMid.y - shoulderMid.y) * ratio,
  };
}

/**
 * 허리 너비 추정
 *
 * @description 원리 문서: 허리 너비 = 엉덩이 너비 x 0.8 (추정값)
 * @see docs/principles/body-mechanics.md 섹션 1.2
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 허리 너비 (정규화된 좌표 기준, 0-1)
 */
export function estimateWaistWidth(landmarks: PoseLandmark[]): number {
  const hipWidth = estimateHipWidth(landmarks);
  // 원리 문서 공식: 허리 너비 = 엉덩이 너비 x 0.8
  return hipWidth * 0.8;
}

/**
 * 상체 길이 추정
 *
 * @description 어깨 중점에서 엉덩이 중점까지의 거리
 * @see docs/principles/body-mechanics.md 섹션 1.2
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 상체 길이 (정규화된 좌표 기준)
 */
export function estimateUpperBodyLength(landmarks: PoseLandmark[]): number {
  const leftShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const hipMid = midpoint(leftHip, rightHip);

  return euclideanDistance2D(shoulderMid, hipMid);
}

/**
 * 하체 길이 추정 (엉덩이 -> 무릎 -> 발목 누적 거리)
 *
 * @description 왼쪽 기준: hip -> knee -> ankle 누적 거리
 * @see docs/principles/body-mechanics.md 섹션 1.2
 *
 * @param landmarks - 33개 랜드마크 배열
 * @param side - 측정할 쪽 ('left' | 'right')
 * @returns 하체 길이 (정규화된 좌표 기준)
 */
export function estimateLowerBodyLength(
  landmarks: PoseLandmark[],
  side: 'left' | 'right' = 'left'
): number {
  const hipIndex = side === 'left' ? LANDMARK_INDEX.LEFT_HIP : LANDMARK_INDEX.RIGHT_HIP;
  const kneeIndex = side === 'left' ? LANDMARK_INDEX.LEFT_KNEE : LANDMARK_INDEX.RIGHT_KNEE;
  const ankleIndex = side === 'left' ? LANDMARK_INDEX.LEFT_ANKLE : LANDMARK_INDEX.RIGHT_ANKLE;

  const hip = landmarks[hipIndex];
  const knee = landmarks[kneeIndex];
  const ankle = landmarks[ankleIndex];

  const hipToKnee = euclideanDistance2D(hip, knee);
  const kneeToAnkle = euclideanDistance2D(knee, ankle);

  return hipToKnee + kneeToAnkle;
}

/**
 * 전체 높이 추정 (코 -> 발목 + 머리 보정)
 *
 * @description 원리 문서: 코-발목 + 머리 보정(약 10%)
 * @see docs/principles/body-mechanics.md 섹션 1.2
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 전체 높이 (정규화된 좌표 기준)
 */
export function estimateTotalHeight(landmarks: PoseLandmark[]): number {
  const nose = landmarks[LANDMARK_INDEX.NOSE];
  const leftAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

  // 발목 중점
  const ankleMid = midpoint(leftAnkle, rightAnkle);

  // 코에서 발목까지 거리
  const noseToAnkle = euclideanDistance2D(nose, ankleMid);

  // 머리 상단 보정 (약 10% 추가)
  const HEAD_CORRECTION_RATIO = 1.1;

  return noseToAnkle * HEAD_CORRECTION_RATIO;
}

// ============================================
// 픽셀 -> 실제 치수 변환
// ============================================

/**
 * 기본 머리 크기 (cm) - 참조 길이로 사용
 * @description 한국인 평균 머리 길이 약 22cm (전후두길이)
 */
const DEFAULT_HEAD_SIZE_CM = 22;

/**
 * 픽셀 -> 실제 치수 변환 비율 계산
 *
 * @description 방법 1: 사용자 입력 신장 기반
 *              방법 2: 머리 크기 기반 추정 (기본값 22cm)
 *
 * @param config - 변환 설정
 * @returns 픽셀당 cm 비율
 */
export function calculatePixelToCmRatio(config: PixelToRealConfig): number {
  if (config.referenceType === 'height' && config.heightCm && config.totalHeightPixels) {
    // 방법 1: 사용자 입력 신장 기반
    return config.heightCm / config.totalHeightPixels;
  }

  if (config.referenceType === 'head' && config.headSizePixels) {
    // 방법 2: 머리 크기 기반 추정
    const headSizeCm = config.headSizeCm ?? DEFAULT_HEAD_SIZE_CM;
    return headSizeCm / config.headSizePixels;
  }

  throw new Error('유효한 참조 데이터가 필요합니다. (신장 또는 머리 크기)');
}

/**
 * 머리 크기 추정 (픽셀 단위)
 *
 * @description 귀 간 거리 기반
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 머리 크기 (픽셀)
 */
export function estimateHeadSizePixels(landmarks: PoseLandmark[]): number {
  const leftEar = landmarks[LANDMARK_INDEX.LEFT_EAR];
  const rightEar = landmarks[LANDMARK_INDEX.RIGHT_EAR];

  // 귀 간 거리 (정면 기준 머리 너비)
  const earToEar = euclideanDistance2D(leftEar, rightEar);

  // 머리 길이는 대략 너비의 1.2배 (타원형 머리 가정)
  return earToEar * 1.2;
}

// ============================================
// 통합 측정 함수
// ============================================

/**
 * 랜드마크에서 체형 측정값 추출
 *
 * @description 33개 MediaPipe 랜드마크에서 체형 분석에 필요한 모든 측정값 추출
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 랜드마크 기반 측정값 (정규화된 좌표 기준)
 * @throws Error - 필수 랜드마크가 신뢰할 수 없는 경우
 */
export function extractLandmarkMeasurements(landmarks: PoseLandmark[]): LandmarkMeasurements {
  // 신뢰도 검증
  if (!areEssentialLandmarksReliable(landmarks)) {
    const summary = getLandmarkReliabilitySummary(landmarks);
    const unreliableStr = summary.unreliableIndices.join(', ');
    throw new Error(
      '필수 랜드마크의 신뢰도가 낮습니다. 신뢰할 수 없는 인덱스: ' + unreliableStr
    );
  }

  return {
    shoulderWidth: estimateShoulderWidth(landmarks),
    hipWidth: estimateHipWidth(landmarks),
    waistWidth: estimateWaistWidth(landmarks),
    waistPosition: estimateWaistPosition(landmarks),
    upperBodyLength: estimateUpperBodyLength(landmarks),
    lowerBodyLength: estimateLowerBodyLength(landmarks),
    totalHeight: estimateTotalHeight(landmarks),
  };
}

/**
 * 전신 비율 계산
 *
 * @description 랜드마크 측정값을 비율로 변환 (픽셀->cm 변환 불필요)
 *
 * @param landmarks - 33개 랜드마크 배열
 * @returns 체형 비율 객체
 */
export function calculateBodyProportions(landmarks: PoseLandmark[]): BodyProportions {
  const measurements = extractLandmarkMeasurements(landmarks);

  // SHR = 어깨 너비 / 엉덩이 너비 (비율이므로 단위 무관)
  const shr = measurements.shoulderWidth / measurements.hipWidth;

  // 상하체 비율 = 상체 길이 / 하체 길이
  const upperLowerRatio = measurements.upperBodyLength / measurements.lowerBodyLength;

  // 다리 비율 = 하체 길이 / 전체 높이
  const legRatio = measurements.lowerBodyLength / measurements.totalHeight;

  // 허리-엉덩이 비율 (너비 기반 추정, 실제 둘레와 다름)
  // 주의: 이 값은 2D 이미지 기반 추정이므로 실제 WHR과 다를 수 있음
  const estimatedWaistHipRatio = measurements.waistWidth / measurements.hipWidth;

  return {
    shr: Math.round(shr * 100) / 100,
    upperLowerRatio: Math.round(upperLowerRatio * 100) / 100,
    legRatio: Math.round(legRatio * 100) / 100,
    estimatedWaistHipRatio: Math.round(estimatedWaistHipRatio * 100) / 100,
    measurements,
  };
}

/**
 * 랜드마크 측정값을 실제 치수(cm)로 변환
 *
 * @description 사용자 입력 신장 또는 머리 크기 기반 변환
 *
 * @param measurements - 정규화된 측정값
 * @param pixelToCmRatio - 픽셀당 cm 비율
 * @returns 실제 치수 (cm 단위)
 */
export function convertMeasurementsToCm(
  measurements: LandmarkMeasurements,
  pixelToCmRatio: number
): {
  shoulderWidthCm: number;
  hipWidthCm: number;
  waistWidthCm: number;
  upperBodyLengthCm: number;
  lowerBodyLengthCm: number;
  totalHeightCm: number;
} {
  return {
    shoulderWidthCm: Math.round(measurements.shoulderWidth * pixelToCmRatio * 10) / 10,
    hipWidthCm: Math.round(measurements.hipWidth * pixelToCmRatio * 10) / 10,
    waistWidthCm: Math.round(measurements.waistWidth * pixelToCmRatio * 10) / 10,
    upperBodyLengthCm: Math.round(measurements.upperBodyLength * pixelToCmRatio * 10) / 10,
    lowerBodyLengthCm: Math.round(measurements.lowerBodyLength * pixelToCmRatio * 10) / 10,
    totalHeightCm: Math.round(measurements.totalHeight * pixelToCmRatio * 10) / 10,
  };
}
