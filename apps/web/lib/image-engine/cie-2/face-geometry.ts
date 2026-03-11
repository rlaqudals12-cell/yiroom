/**
 * CIE-2 Phase 2: 얼굴 기하학 측정 모듈
 *
 * @module lib/image-engine/cie-2/face-geometry
 * @description 468-point 랜드마크에서 15+ 얼굴 비율 측정값 추출
 * @see docs/principles/body-mechanics.md
 *
 * 측정 항목 (16개):
 * - 얼굴 기본: 너비, 높이, 비율
 * - 눈: 간격, 좌우 너비, 얼굴 대비 비율
 * - 코: 길이, 너비, 얼굴 대비 비율
 * - 입: 너비, 얼굴 대비 비율
 * - 턱: 너비, 턱선 각도
 * - 이마: 높이
 * - 광대: 너비
 */

import type { Point3D } from '../types';
import { FACE_LANDMARK_INDICES } from '../constants';

// ============================================
// 타입 정의
// ============================================

/** 얼굴 기하학 측정 결과 */
export interface FaceGeometryMeasurements {
  // 얼굴 기본 비율
  faceWidth: number;
  faceHeight: number;
  faceRatio: number; // width / height (0.6~0.8이 보통)

  // 눈
  eyeDistance: number; // 양 눈 중심 간 거리 (px)
  leftEyeWidth: number;
  rightEyeWidth: number;
  eyeToFaceRatio: number; // 눈 간격 / 얼굴 너비

  // 코
  noseLength: number;
  noseWidth: number;
  noseToFaceRatio: number; // 코 길이 / 얼굴 높이

  // 입
  mouthWidth: number;
  mouthToFaceRatio: number; // 입 너비 / 얼굴 너비

  // 턱
  jawWidth: number;
  jawAngleDegrees: number; // 턱선 각도 (도)

  // 이마
  foreheadHeight: number;

  // 광대
  cheekboneWidth: number;
}

/** 얼굴형 분류 */
export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';

/** 얼굴 기하학 분석 결과 */
export interface FaceGeometryResult {
  measurements: FaceGeometryMeasurements;
  faceShape: FaceShape;
  faceShapeConfidence: number;
  symmetryScore: number; // 0-100
}

// ============================================
// MediaPipe 468-point 주요 인덱스
// ============================================

/** 확장 랜드마크 인덱스 (face-geometry 전용) */
const GEOMETRY_INDICES = {
  // 기본 (constants.ts에서 가져옴)
  ...FACE_LANDMARK_INDICES,

  // 눈 중심 (동공 근사치)
  leftPupil: 468, // MediaPipe iris 모델 사용 시; fallback: 159
  rightPupil: 473, // fallback: 386

  // 눈 꼭짓점
  leftEyeInnerCorner: 133,
  leftEyeOuterCorner: 33,
  rightEyeInnerCorner: 362,
  rightEyeOuterCorner: 263,

  // 코
  noseTip: 1,
  noseBridge: 6,
  noseLeftAla: 129,
  noseRightAla: 358,

  // 입
  mouthLeftCorner: 61,
  mouthRightCorner: 291,
  upperLipCenter: 0,
  lowerLipCenter: 17,

  // 턱
  chin: 152,
  jawLeft: 172,
  jawRight: 397,
  jawLeftAngle: 136,
  jawRightAngle: 365,

  // 이마
  foreheadTop: 10,
  foreheadHairline: 151,

  // 광대
  leftCheekbone: 234,
  rightCheekbone: 454,

  // 얼굴 측면
  leftTemple: 127,
  rightTemple: 356,
} as const;

// ============================================
// 거리 계산 유틸리티
// ============================================

/** 두 점 사이 유클리드 거리 (2D) */
function dist2D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** 안전한 랜드마크 접근 (범위 초과 시 fallback) */
function getPoint(points: Point3D[], index: number, fallback?: number): Point3D {
  if (index < points.length) return points[index];
  if (fallback !== undefined && fallback < points.length) return points[fallback];
  throw new Error(`Landmark index ${index} out of range (total: ${points.length})`);
}

// ============================================
// 측정 함수
// ============================================

/**
 * 468-point 랜드마크에서 16개 얼굴 기하학 측정값 추출
 *
 * @param points - 468-point 랜드마크 배열 (픽셀 좌표)
 * @returns 얼굴 기하학 측정 결과
 */
export function extractFaceGeometry(points: Point3D[]): FaceGeometryMeasurements {
  if (points.length < 468) {
    throw new Error(`최소 468개 랜드마크가 필요합니다 (현재: ${points.length})`);
  }

  const idx = GEOMETRY_INDICES;

  // 기준점 추출
  const leftTemple = getPoint(points, idx.leftTemple);
  const rightTemple = getPoint(points, idx.rightTemple);
  const foreheadTop = getPoint(points, idx.foreheadTop);
  const chin = getPoint(points, idx.chin);

  // 눈 꼭짓점
  const leftEyeInner = getPoint(points, idx.leftEyeInnerCorner);
  const leftEyeOuter = getPoint(points, idx.leftEyeOuterCorner);
  const rightEyeInner = getPoint(points, idx.rightEyeInnerCorner);
  const rightEyeOuter = getPoint(points, idx.rightEyeOuterCorner);

  // 눈 중심 (동공이 없으면 내/외안각 중점 사용)
  const leftEyeCenter = {
    x: (leftEyeInner.x + leftEyeOuter.x) / 2,
    y: (leftEyeInner.y + leftEyeOuter.y) / 2,
    z: (leftEyeInner.z + leftEyeOuter.z) / 2,
  };
  const rightEyeCenter = {
    x: (rightEyeInner.x + rightEyeOuter.x) / 2,
    y: (rightEyeInner.y + rightEyeOuter.y) / 2,
    z: (rightEyeInner.z + rightEyeOuter.z) / 2,
  };

  // 코
  const noseTip = getPoint(points, idx.noseTip);
  const noseBridge = getPoint(points, idx.noseBridge);
  const noseLeftAla = getPoint(points, idx.noseLeftAla);
  const noseRightAla = getPoint(points, idx.noseRightAla);

  // 입
  const mouthLeft = getPoint(points, idx.mouthLeftCorner);
  const mouthRight = getPoint(points, idx.mouthRightCorner);

  // 턱
  const jawLeft = getPoint(points, idx.jawLeft);
  const jawRight = getPoint(points, idx.jawRight);
  const jawLeftAngle = getPoint(points, idx.jawLeftAngle);
  const jawRightAngle = getPoint(points, idx.jawRightAngle);

  // 광대
  const leftCheekbone = getPoint(points, idx.leftCheekbone);
  const rightCheekbone = getPoint(points, idx.rightCheekbone);

  // 이마 높이 기준
  const foreheadHairline = getPoint(points, idx.foreheadHairline);

  // ──────────────────────────────────────
  // 측정값 계산
  // ──────────────────────────────────────

  const faceWidth = dist2D(leftTemple, rightTemple);
  const faceHeight = dist2D(foreheadTop, chin);
  const faceRatio = faceHeight > 0 ? faceWidth / faceHeight : 0;

  const eyeDistance = dist2D(leftEyeCenter, rightEyeCenter);
  const leftEyeWidth = dist2D(leftEyeInner, leftEyeOuter);
  const rightEyeWidth = dist2D(rightEyeInner, rightEyeOuter);
  const eyeToFaceRatio = faceWidth > 0 ? eyeDistance / faceWidth : 0;

  const noseLength = dist2D(noseBridge, noseTip);
  const noseWidth = dist2D(noseLeftAla, noseRightAla);
  const noseToFaceRatio = faceHeight > 0 ? noseLength / faceHeight : 0;

  const mouthWidth = dist2D(mouthLeft, mouthRight);
  const mouthToFaceRatio = faceWidth > 0 ? mouthWidth / faceWidth : 0;

  const jawWidth = dist2D(jawLeft, jawRight);

  // 턱선 각도: jawAngle → chin → jawAngle의 양쪽 벡터 사이 각도
  const jawAngleDegrees = calculateJawAngle(jawLeftAngle, chin, jawRightAngle);

  const foreheadHeight = dist2D(foreheadHairline, noseBridge);

  const cheekboneWidth = dist2D(leftCheekbone, rightCheekbone);

  return {
    faceWidth,
    faceHeight,
    faceRatio,
    eyeDistance,
    leftEyeWidth,
    rightEyeWidth,
    eyeToFaceRatio,
    noseLength,
    noseWidth,
    noseToFaceRatio,
    mouthWidth,
    mouthToFaceRatio,
    jawWidth,
    jawAngleDegrees,
    foreheadHeight,
    cheekboneWidth,
  };
}

/**
 * 턱선 각도 계산 (도)
 * 좌측 턱 모서리 → 턱 끝 → 우측 턱 모서리 벡터 사이 각도
 */
function calculateJawAngle(leftJaw: Point3D, chinPoint: Point3D, rightJaw: Point3D): number {
  const v1x = leftJaw.x - chinPoint.x;
  const v1y = leftJaw.y - chinPoint.y;
  const v2x = rightJaw.x - chinPoint.x;
  const v2y = rightJaw.y - chinPoint.y;

  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

// ============================================
// 얼굴형 분류
// ============================================

/**
 * 측정값에서 얼굴형 분류
 *
 * 분류 기준:
 * - oval: 이상적 비율 (faceRatio 0.65-0.75, 광대 > 턱)
 * - round: 넓고 짧은 (faceRatio > 0.75, 유사 너비)
 * - square: 넓고 턱이 각진 (jawAngle < 110°)
 * - heart: 광대 넓고 턱 좁은 (cheekbone >> jaw)
 * - oblong: 길고 좁은 (faceRatio < 0.6)
 * - diamond: 광대 넓고 이마/턱 좁은
 */
export function classifyFaceShape(m: FaceGeometryMeasurements): {
  shape: FaceShape;
  confidence: number;
} {
  const scores: Record<FaceShape, number> = {
    oval: 0,
    round: 0,
    square: 0,
    heart: 0,
    oblong: 0,
    diamond: 0,
  };

  const cheekToJawRatio = m.jawWidth > 0 ? m.cheekboneWidth / m.jawWidth : 1;
  const foreheadToJawRatio = m.jawWidth > 0 ? m.faceWidth / m.jawWidth : 1;

  // 얼굴 비율 기반 점수
  if (m.faceRatio >= 0.65 && m.faceRatio <= 0.75) {
    scores.oval += 30;
  } else if (m.faceRatio > 0.75) {
    scores.round += 25;
    scores.square += 15;
  } else if (m.faceRatio < 0.6) {
    scores.oblong += 30;
  }

  // 광대 대 턱 비율
  if (cheekToJawRatio > 1.2) {
    scores.heart += 20;
    scores.diamond += 20;
  } else if (cheekToJawRatio < 1.05) {
    scores.square += 15;
    scores.round += 10;
  } else {
    scores.oval += 15;
  }

  // 턱선 각도
  if (m.jawAngleDegrees < 110) {
    scores.square += 25;
  } else if (m.jawAngleDegrees > 130) {
    scores.oval += 10;
    scores.round += 10;
    scores.heart += 10;
  }

  // 이마 대 턱 비율
  if (foreheadToJawRatio > 1.15) {
    scores.heart += 15;
  }

  // 광대 돌출 (광대 > 이마이고 > 턱)
  if (m.cheekboneWidth > m.faceWidth * 0.95 && cheekToJawRatio > 1.15) {
    scores.diamond += 15;
  }

  // 최고 점수 찾기
  let bestShape: FaceShape = 'oval';
  let bestScore = 0;
  let totalScore = 0;

  for (const [shape, score] of Object.entries(scores) as Array<[FaceShape, number]>) {
    totalScore += score;
    if (score > bestScore) {
      bestScore = score;
      bestShape = shape;
    }
  }

  const confidence =
    totalScore > 0 ? Math.min(100, Math.round((bestScore / totalScore) * 100)) : 50;

  return { shape: bestShape, confidence };
}

// ============================================
// 대칭 분석
// ============================================

/**
 * 얼굴 좌우 대칭 점수 계산
 *
 * @param m - 얼굴 측정값
 * @returns 대칭 점수 (0-100, 100=완벽한 대칭)
 */
export function calculateSymmetryScore(m: FaceGeometryMeasurements): number {
  const asymmetries: number[] = [];

  // 좌우 눈 너비 대칭
  const maxEyeWidth = Math.max(m.leftEyeWidth, m.rightEyeWidth);
  if (maxEyeWidth > 0) {
    asymmetries.push(Math.abs(m.leftEyeWidth - m.rightEyeWidth) / maxEyeWidth);
  }

  // 눈 간격 대 얼굴 중심 대칭 (eyeToFaceRatio로 간접 측정)
  // 완벽한 대칭은 0.33 근처
  const eyeSymmetry = Math.abs(m.eyeToFaceRatio - 0.33) * 2;
  asymmetries.push(Math.min(1, eyeSymmetry));

  // 코 너비 대칭 (코가 중앙에 있다고 가정)
  const noseAsymmetry = m.faceWidth > 0 ? Math.abs(m.noseWidth / m.faceWidth - 0.25) : 0;
  asymmetries.push(Math.min(1, noseAsymmetry));

  if (asymmetries.length === 0) return 100;

  const avgAsymmetry = asymmetries.reduce((s, v) => s + v, 0) / asymmetries.length;
  return Math.round(Math.max(0, (1 - avgAsymmetry) * 100));
}

// ============================================
// 통합 분석 함수
// ============================================

/**
 * 얼굴 기하학 전체 분석
 *
 * @param points - 468-point 랜드마크 배열 (픽셀 좌표)
 * @returns 측정값, 얼굴형, 대칭 점수
 */
export function analyzeFaceGeometry(points: Point3D[]): FaceGeometryResult {
  const measurements = extractFaceGeometry(points);
  const { shape, confidence } = classifyFaceShape(measurements);
  const symmetryScore = calculateSymmetryScore(measurements);

  return {
    measurements,
    faceShape: shape,
    faceShapeConfidence: confidence,
    symmetryScore,
  };
}
