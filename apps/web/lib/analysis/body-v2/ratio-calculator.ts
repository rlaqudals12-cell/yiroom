/**
 * C-2: 체형 비율 계산
 *
 * @module lib/analysis/body-v2/ratio-calculator
 * @description MediaPipe Pose 랜드마크 기반 체형 비율 계산
 * @see {@link docs/principles/body-mechanics.md} 체형 역학 원리
 */

import type { Landmark33, BodyRatios, PoseDetectionResult } from './types';
import { POSE_LANDMARK_INDEX } from './types';
import {
  calculateLandmarkDistance,
  calculateMidpoint,
  validatePoseLandmarks,
} from './pose-detector';

// =============================================================================
// 상수
// =============================================================================

/**
 * 허리 위치 추정 비율
 * 어깨-힙 사이에서 허리 위치 (0.4 = 어깨에서 40% 지점)
 */
const WAIST_POSITION_RATIO = 0.4;

/**
 * 허리 너비 추정 비율
 * 힙 너비 대비 허리 너비 기본값 (실제 측정 불가 시 추정)
 */
const DEFAULT_WAIST_TO_HIP_RATIO = 0.8;

// =============================================================================
// 내부 유틸리티 함수
// =============================================================================

/**
 * 세그먼트 길이 계산 (여러 포인트 연결)
 */
function calculateSegmentLength(points: Landmark33[]): number {
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalLength += calculateLandmarkDistance(points[i], points[i + 1]);
  }
  return totalLength;
}

/**
 * 어깨 너비 계산
 */
function getShoulderWidth(landmarks: Landmark33[]): number {
  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
  return calculateLandmarkDistance(leftShoulder, rightShoulder);
}

/**
 * 힙 너비 계산
 */
function getHipWidth(landmarks: Landmark33[]): number {
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];
  return calculateLandmarkDistance(leftHip, rightHip);
}

/**
 * 상체 길이 계산 (어깨 중심 ~ 힙 중심)
 */
function getUpperBodyLength(landmarks: Landmark33[]): number {
  const leftShoulder = landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];

  const shoulderMid = calculateMidpoint(leftShoulder, rightShoulder);
  const hipMid = calculateMidpoint(leftHip, rightHip);

  return calculateLandmarkDistance(shoulderMid, hipMid);
}

/**
 * 하체 길이 계산 (힙 중심 ~ 발목 중심)
 */
function getLowerBodyLength(landmarks: Landmark33[]): number {
  const leftHip = landmarks[POSE_LANDMARK_INDEX.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];
  const leftAnkle = landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARK_INDEX.RIGHT_ANKLE];

  const hipMid = calculateMidpoint(leftHip, rightHip);
  const ankleMid = calculateMidpoint(leftAnkle, rightAnkle);

  return calculateLandmarkDistance(hipMid, ankleMid);
}

/**
 * 팔 길이 계산 (어깨 ~ 팔꿈치 ~ 손목)
 */
function getArmLength(landmarks: Landmark33[], side: 'left' | 'right'): number {
  const shoulder =
    side === 'left'
      ? landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER]
      : landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER];
  const elbow =
    side === 'left'
      ? landmarks[POSE_LANDMARK_INDEX.LEFT_ELBOW]
      : landmarks[POSE_LANDMARK_INDEX.RIGHT_ELBOW];
  const wrist =
    side === 'left'
      ? landmarks[POSE_LANDMARK_INDEX.LEFT_WRIST]
      : landmarks[POSE_LANDMARK_INDEX.RIGHT_WRIST];

  return calculateSegmentLength([shoulder, elbow, wrist]);
}

/**
 * 다리 길이 계산 (힙 ~ 무릎 ~ 발목)
 */
function getLegLength(landmarks: Landmark33[], side: 'left' | 'right'): number {
  const hip =
    side === 'left'
      ? landmarks[POSE_LANDMARK_INDEX.LEFT_HIP]
      : landmarks[POSE_LANDMARK_INDEX.RIGHT_HIP];
  const knee =
    side === 'left'
      ? landmarks[POSE_LANDMARK_INDEX.LEFT_KNEE]
      : landmarks[POSE_LANDMARK_INDEX.RIGHT_KNEE];
  const ankle =
    side === 'left'
      ? landmarks[POSE_LANDMARK_INDEX.LEFT_ANKLE]
      : landmarks[POSE_LANDMARK_INDEX.RIGHT_ANKLE];

  return calculateSegmentLength([hip, knee, ankle]);
}

/**
 * 허리 너비 추정
 *
 * MediaPipe Pose는 허리 랜드마크를 직접 제공하지 않으므로,
 * 어깨와 힙 사이의 중간 지점에서 허리 너비를 추정합니다.
 *
 * 추정 방법:
 * 1. 어깨-힙 사이 40% 지점을 허리 위치로 가정
 * 2. 해당 지점에서 어깨와 힙의 가중 평균으로 너비 추정
 */
function estimateWaistWidth(landmarks: Landmark33[]): number {
  const shoulderWidth = getShoulderWidth(landmarks);
  const hipWidth = getHipWidth(landmarks);

  // 허리는 일반적으로 어깨와 힙보다 좁음
  // 어깨와 힙의 가중 평균에서 허리 추정
  const t = WAIST_POSITION_RATIO;
  const interpolatedWidth = shoulderWidth * (1 - t) + hipWidth * t;

  // 실제 허리는 보간값보다 좁으므로 80% 적용
  return interpolatedWidth * DEFAULT_WAIST_TO_HIP_RATIO;
}

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 체형 비율 계산
 *
 * @description
 * MediaPipe Pose 33개 랜드마크에서 체형 분석에 필요한 비율을 계산합니다.
 *
 * 계산되는 비율:
 * - 어깨, 허리, 힙 너비 (정규화)
 * - 어깨-허리 비율: 상체 실루엣 판단
 * - 허리-힙 비율: 곡선 정도 판단
 * - 상하체 비율: 전체 비율 판단
 * - 팔-상체 비율: 팔 길이 판단
 *
 * @param poseResult - Pose 검출 결과
 * @returns 계산된 체형 비율
 *
 * @throws {Error} 필수 랜드마크가 부족할 경우
 *
 * @example
 * const poseResult = await detectPose(imageBase64);
 * const ratios = calculateBodyRatios(poseResult);
 * console.log('어깨-허리 비율:', ratios.shoulderToWaistRatio);
 */
export function calculateBodyRatios(poseResult: PoseDetectionResult): BodyRatios {
  const { landmarks } = poseResult;

  if (!validatePoseLandmarks(landmarks)) {
    throw new Error('[BodyRatios] 체형 분석에 필요한 랜드마크가 부족합니다');
  }

  // 기본 측정값 계산
  const shoulderWidth = getShoulderWidth(landmarks);
  const hipWidth = getHipWidth(landmarks);
  const waistWidth = estimateWaistWidth(landmarks);
  const upperBodyLength = getUpperBodyLength(landmarks);
  const lowerBodyLength = getLowerBodyLength(landmarks);

  // 팔 길이 (좌우 평균)
  const leftArm = getArmLength(landmarks, 'left');
  const rightArm = getArmLength(landmarks, 'right');
  const avgArmLength = (leftArm + rightArm) / 2;

  // 다리 길이 (좌우 평균)
  const leftLeg = getLegLength(landmarks, 'left');
  const rightLeg = getLegLength(landmarks, 'right');
  const avgLegLength = (leftLeg + rightLeg) / 2;

  // 비율 계산
  const shoulderToWaistRatio = waistWidth > 0 ? shoulderWidth / waistWidth : 1;
  const waistToHipRatio = hipWidth > 0 ? waistWidth / hipWidth : 1;
  const upperToLowerRatio = lowerBodyLength > 0 ? upperBodyLength / lowerBodyLength : 1;
  const armToTorsoRatio = upperBodyLength > 0 ? avgArmLength / upperBodyLength : 1;

  return {
    shoulderWidth,
    waistWidth,
    hipWidth,
    shoulderToWaistRatio,
    waistToHipRatio,
    upperBodyLength,
    lowerBodyLength,
    upperToLowerRatio,
    armLength: avgArmLength,
    legLength: avgLegLength,
    armToTorsoRatio,
  };
}

/**
 * 실제 치수 추정 (cm)
 *
 * @description
 * 사용자가 키를 입력한 경우, 정규화된 비율을 실제 cm 단위로 변환합니다.
 *
 * 가정:
 * - 전신이 이미지에 포함됨
 * - 이미지 높이의 대부분이 신장에 해당
 *
 * @param ratios - 계산된 체형 비율
 * @param heightCm - 사용자 키 (cm)
 * @param imageHeight - 이미지 높이 (정규화 기준, 보통 1.0)
 * @returns cm 단위로 변환된 비율
 */
export function convertToCentimeters(
  ratios: BodyRatios,
  heightCm: number,
  imageHeight = 1.0
): BodyRatios {
  // 이미지에서 전신 비율 추정 (머리부터 발목까지)
  const totalBodyHeight = ratios.upperBodyLength + ratios.lowerBodyLength;
  const scale = totalBodyHeight > 0 ? heightCm / totalBodyHeight : 1;

  return {
    shoulderWidth: ratios.shoulderWidth * scale,
    waistWidth: ratios.waistWidth * scale,
    hipWidth: ratios.hipWidth * scale,
    shoulderToWaistRatio: ratios.shoulderToWaistRatio, // 비율은 그대로
    waistToHipRatio: ratios.waistToHipRatio,
    upperBodyLength: ratios.upperBodyLength * scale,
    lowerBodyLength: ratios.lowerBodyLength * scale,
    upperToLowerRatio: ratios.upperToLowerRatio,
    armLength: ratios.armLength * scale,
    legLength: ratios.legLength * scale,
    armToTorsoRatio: ratios.armToTorsoRatio,
  };
}

/**
 * 비율 신뢰도 계산
 *
 * @description
 * 측정된 비율이 얼마나 신뢰할 수 있는지 0-100 점수로 반환합니다.
 *
 * 고려 요소:
 * - 포즈 검출 신뢰도
 * - 필수 랜드마크 가시성
 * - 비율 값의 유효 범위
 *
 * @param poseResult - Pose 검출 결과
 * @param ratios - 계산된 비율
 * @returns 신뢰도 점수 (0-100)
 */
export function calculateRatioConfidence(
  poseResult: PoseDetectionResult,
  ratios: BodyRatios
): number {
  const { landmarks, confidence: poseConfidence } = poseResult;

  // 1. 포즈 검출 신뢰도 (40%)
  const poseScore = poseConfidence * 40;

  // 2. 핵심 랜드마크 가시성 (40%)
  const keyIndices = [
    POSE_LANDMARK_INDEX.LEFT_SHOULDER,
    POSE_LANDMARK_INDEX.RIGHT_SHOULDER,
    POSE_LANDMARK_INDEX.LEFT_HIP,
    POSE_LANDMARK_INDEX.RIGHT_HIP,
    POSE_LANDMARK_INDEX.LEFT_ANKLE,
    POSE_LANDMARK_INDEX.RIGHT_ANKLE,
  ];
  const keyVisibility =
    keyIndices.reduce((sum, idx) => sum + (landmarks[idx]?.visibility ?? 0), 0) /
    keyIndices.length;
  const visibilityScore = keyVisibility * 40;

  // 3. 비율 유효성 (20%)
  // 비정상적인 비율 값 감지
  let validityScore = 20;
  if (ratios.shoulderToWaistRatio < 0.5 || ratios.shoulderToWaistRatio > 2.0) {
    validityScore -= 5;
  }
  if (ratios.waistToHipRatio < 0.5 || ratios.waistToHipRatio > 1.5) {
    validityScore -= 5;
  }
  if (ratios.upperToLowerRatio < 0.3 || ratios.upperToLowerRatio > 1.5) {
    validityScore -= 5;
  }

  return Math.max(0, Math.min(100, poseScore + visibilityScore + validityScore));
}

/**
 * 좌우 대칭성 계산
 *
 * @description 좌우 신체의 대칭 정도를 0-1 사이 값으로 반환
 * @param landmarks - 33개 랜드마크
 * @returns 대칭성 점수 (1에 가까울수록 대칭)
 */
export function calculateSymmetry(landmarks: Landmark33[]): number {
  if (!validatePoseLandmarks(landmarks)) {
    return 0;
  }

  // 좌우 쌍 비교
  const pairs = [
    [POSE_LANDMARK_INDEX.LEFT_SHOULDER, POSE_LANDMARK_INDEX.RIGHT_SHOULDER],
    [POSE_LANDMARK_INDEX.LEFT_HIP, POSE_LANDMARK_INDEX.RIGHT_HIP],
    [POSE_LANDMARK_INDEX.LEFT_KNEE, POSE_LANDMARK_INDEX.RIGHT_KNEE],
    [POSE_LANDMARK_INDEX.LEFT_ANKLE, POSE_LANDMARK_INDEX.RIGHT_ANKLE],
  ];

  // 중심선 계산 (어깨 중심과 힙 중심 연결)
  const shoulderMid = calculateMidpoint(
    landmarks[POSE_LANDMARK_INDEX.LEFT_SHOULDER],
    landmarks[POSE_LANDMARK_INDEX.RIGHT_SHOULDER]
  );

  let totalDiff = 0;
  let validPairs = 0;

  for (const [leftIdx, rightIdx] of pairs) {
    const left = landmarks[leftIdx];
    const right = landmarks[rightIdx];

    if (left.visibility < 0.5 || right.visibility < 0.5) continue;

    // 중심선으로부터의 x 좌표 차이
    const leftDist = Math.abs(left.x - shoulderMid.x);
    const rightDist = Math.abs(right.x - shoulderMid.x);

    // 대칭 차이 (0에 가까울수록 대칭)
    const diff = Math.abs(leftDist - rightDist);
    totalDiff += diff;
    validPairs++;
  }

  if (validPairs === 0) return 0;

  // 평균 차이를 대칭 점수로 변환 (1 - 평균차이, 최소 0)
  const avgDiff = totalDiff / validPairs;
  return Math.max(0, 1 - avgDiff * 5); // 0.2 차이면 0점
}
