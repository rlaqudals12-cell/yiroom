/**
 * H-1 얼굴형 분석 모듈
 *
 * MediaPipe 랜드마크 기반 7가지 얼굴형 분류
 *
 * @description 얼굴 비율 계산 및 얼굴형 분류
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import type { Landmark33 } from '../body-v2';
import type {
  FaceShapeType,
  FaceShapeAnalysis,
} from './types';
import { FACE_SHAPE_LABELS, FACE_SHAPE_DESCRIPTIONS } from './types';

// =============================================================================
// 얼굴 랜드마크 인덱스 (MediaPipe Face Mesh 기준)
// =============================================================================

/**
 * 얼굴 분석에 사용되는 주요 랜드마크 인덱스
 * MediaPipe Face Mesh: 468개 랜드마크
 * 여기서는 핵심 포인트만 사용
 */
const FACE_LANDMARKS = {
  // 이마
  foreheadTop: 10,
  foreheadLeft: 67,
  foreheadRight: 297,

  // 눈
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeInner: 362,
  rightEyeOuter: 263,

  // 광대
  leftCheekbone: 234,
  rightCheekbone: 454,

  // 코
  noseTip: 1,
  noseBase: 2,

  // 턱
  jawLeft: 172,
  jawRight: 397,
  chin: 152,

  // 턱선
  jawlineLeft: 132,
  jawlineRight: 361,
};

// =============================================================================
// 얼굴형 분류 함수
// =============================================================================

/**
 * 얼굴 랜드마크에서 얼굴형 분석
 *
 * @param landmarks - MediaPipe 얼굴 랜드마크 (최소 468개)
 * @returns 얼굴형 분석 결과
 */
export function analyzeFaceShape(
  landmarks: Array<{ x: number; y: number; z?: number }>
): FaceShapeAnalysis {
  // 얼굴 비율 계산
  const ratios = calculateFaceRatios(landmarks);

  // 얼굴형 분류
  const { faceShape, confidence } = classifyFaceShape(ratios);

  return {
    faceShape,
    faceShapeLabel: FACE_SHAPE_LABELS[faceShape],
    confidence,
    ratios,
  };
}

/**
 * 얼굴 비율 계산
 */
function calculateFaceRatios(
  landmarks: Array<{ x: number; y: number; z?: number }>
): FaceShapeAnalysis['ratios'] {
  // 안전한 인덱스 접근
  const get = (idx: number) => landmarks[idx] || { x: 0.5, y: 0.5 };

  // 주요 포인트 추출
  const foreheadTop = get(FACE_LANDMARKS.foreheadTop);
  const foreheadLeft = get(FACE_LANDMARKS.foreheadLeft);
  const foreheadRight = get(FACE_LANDMARKS.foreheadRight);
  const leftCheekbone = get(FACE_LANDMARKS.leftCheekbone);
  const rightCheekbone = get(FACE_LANDMARKS.rightCheekbone);
  const jawLeft = get(FACE_LANDMARKS.jawLeft);
  const jawRight = get(FACE_LANDMARKS.jawRight);
  const chin = get(FACE_LANDMARKS.chin);

  // 거리 계산 함수
  const distance = (
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

  // 얼굴 길이 (이마 상단 ~ 턱 끝)
  const faceLength = distance(foreheadTop, chin);

  // 이마 너비
  const foreheadWidth = distance(foreheadLeft, foreheadRight);

  // 광대 너비
  const cheekboneWidth = distance(leftCheekbone, rightCheekbone);

  // 턱 너비
  const jawWidth = distance(jawLeft, jawRight);

  // 얼굴 너비 (광대 기준)
  const faceWidth = cheekboneWidth;

  // 길이/너비 비율
  const lengthToWidthRatio = faceWidth > 0 ? faceLength / faceWidth : 1.3;

  return {
    faceLength: Math.round(faceLength * 1000) / 1000,
    faceWidth: Math.round(faceWidth * 1000) / 1000,
    foreheadWidth: Math.round(foreheadWidth * 1000) / 1000,
    cheekboneWidth: Math.round(cheekboneWidth * 1000) / 1000,
    jawWidth: Math.round(jawWidth * 1000) / 1000,
    lengthToWidthRatio: Math.round(lengthToWidthRatio * 100) / 100,
  };
}

/**
 * 비율 기반 얼굴형 분류
 */
function classifyFaceShape(
  ratios: FaceShapeAnalysis['ratios']
): { faceShape: FaceShapeType; confidence: number } {
  const {
    lengthToWidthRatio,
    foreheadWidth,
    cheekboneWidth,
    jawWidth,
  } = ratios;

  // 상대적 비율 계산
  const foreheadToJaw = jawWidth > 0 ? foreheadWidth / jawWidth : 1;
  const cheekboneToJaw = jawWidth > 0 ? cheekboneWidth / jawWidth : 1;
  const foreheadToCheekbone = cheekboneWidth > 0 ? foreheadWidth / cheekboneWidth : 1;

  let faceShape: FaceShapeType;
  let confidence: number;

  // 분류 로직
  // 1. 길이/너비 비율로 1차 분류
  if (lengthToWidthRatio > 1.5) {
    // 긴 얼굴 계열
    if (foreheadToJaw > 0.95 && foreheadToJaw < 1.05) {
      faceShape = 'rectangle';
      confidence = 75 + (1 - Math.abs(foreheadToJaw - 1)) * 20;
    } else {
      faceShape = 'oblong';
      confidence = 70 + (lengthToWidthRatio - 1.5) * 10;
    }
  } else if (lengthToWidthRatio < 1.1) {
    // 둥근/사각 계열
    if (cheekboneToJaw > 1.1 && foreheadToJaw > 0.9) {
      faceShape = 'round';
      confidence = 75 + (1.1 - lengthToWidthRatio) * 20;
    } else {
      faceShape = 'square';
      confidence = 70 + Math.abs(cheekboneToJaw - 1) * 15;
    }
  } else {
    // 중간 비율
    if (foreheadToCheekbone > 1.05 && foreheadToJaw > 1.15) {
      // 이마 > 광대 > 턱
      faceShape = 'heart';
      confidence = 75 + (foreheadToJaw - 1.15) * 20;
    } else if (cheekboneToJaw > 1.2 && foreheadToCheekbone < 0.9) {
      // 광대 > 이마, 턱
      faceShape = 'diamond';
      confidence = 70 + (cheekboneToJaw - 1.2) * 15;
    } else {
      // 균형 잡힌 형태
      faceShape = 'oval';
      const balance = Math.abs(foreheadToCheekbone - 1) + Math.abs(cheekboneToJaw - 1.05);
      confidence = 80 - balance * 20;
    }
  }

  // 신뢰도 범위 조정
  confidence = Math.max(50, Math.min(95, confidence));

  return { faceShape, confidence: Math.round(confidence) };
}

/**
 * Pose 랜드마크(33개)에서 얼굴형 추정
 * Face Mesh가 없을 때 사용하는 대체 함수
 */
export function estimateFaceShapeFromPose(
  poseLandmarks: Landmark33[]
): FaceShapeAnalysis {
  // Pose 랜드마크에서 얼굴 관련 포인트 추출
  // 0: 코, 1-4: 눈, 5-6: 귀, 7-8: 입
  const nose = poseLandmarks[0];
  const leftEye = poseLandmarks[2];
  const rightEye = poseLandmarks[5];
  const leftEar = poseLandmarks[7];
  const rightEar = poseLandmarks[8];
  const leftMouth = poseLandmarks[9];
  const rightMouth = poseLandmarks[10];

  // 간단한 비율 추정
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);
  const earDistance = Math.abs(rightEar.x - leftEar.x);
  const mouthWidth = Math.abs(rightMouth.x - leftMouth.x);
  const faceHeight = Math.abs(nose.y - ((leftEar.y + rightEar.y) / 2)) * 2;

  const estimatedRatios: FaceShapeAnalysis['ratios'] = {
    faceLength: faceHeight,
    faceWidth: earDistance,
    foreheadWidth: eyeDistance * 1.3, // 추정
    cheekboneWidth: earDistance,
    jawWidth: mouthWidth * 1.2, // 추정
    lengthToWidthRatio: earDistance > 0 ? faceHeight / earDistance : 1.3,
  };

  const { faceShape, confidence } = classifyFaceShape(estimatedRatios);

  return {
    faceShape,
    faceShapeLabel: FACE_SHAPE_LABELS[faceShape],
    confidence: Math.max(40, confidence - 15), // Pose 기반은 신뢰도 낮춤
    ratios: estimatedRatios,
  };
}

/**
 * 얼굴형 설명 가져오기
 */
export function getFaceShapeDescription(faceShape: FaceShapeType): string {
  return FACE_SHAPE_DESCRIPTIONS[faceShape];
}

/**
 * 얼굴형 신뢰도 등급
 */
export function getFaceShapeConfidenceGrade(
  confidence: number
): { label: string; color: string } {
  if (confidence >= 85) return { label: '매우 높음', color: 'emerald' };
  if (confidence >= 70) return { label: '높음', color: 'blue' };
  if (confidence >= 55) return { label: '보통', color: 'amber' };
  return { label: '낮음', color: 'red' };
}
