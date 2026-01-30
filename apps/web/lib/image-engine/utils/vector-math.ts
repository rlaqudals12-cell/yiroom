/**
 * 벡터 연산 유틸리티
 *
 * @module lib/image-engine/utils/vector-math
 * @description 3D 랜드마크, 각도 계산에 필요한 벡터 연산
 */

import type { Point2D, Point3D, EulerAngles } from '../types';

// ============================================
// 2D 벡터 연산
// ============================================

/**
 * 2D 벡터의 덧셈
 */
export function add2D(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * 2D 벡터의 뺄셈
 */
export function subtract2D(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * 2D 벡터의 스칼라 곱
 */
export function scale2D(v: Point2D, scalar: number): Point2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * 2D 벡터의 크기
 */
export function magnitude2D(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 2D 벡터의 정규화
 */
export function normalize2D(v: Point2D): Point2D {
  const mag = magnitude2D(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * 2D 벡터의 내적
 */
export function dot2D(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * 두 2D 점 사이의 거리
 */
export function distance2D(a: Point2D, b: Point2D): number {
  return magnitude2D(subtract2D(a, b));
}

// ============================================
// 3D 벡터 연산
// ============================================

/**
 * 3D 벡터의 덧셈
 */
export function add3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * 3D 벡터의 뺄셈
 */
export function subtract3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * 3D 벡터의 스칼라 곱
 */
export function scale3D(v: Point3D, scalar: number): Point3D {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

/**
 * 3D 벡터의 크기
 */
export function magnitude3D(v: Point3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * 3D 벡터의 정규화
 */
export function normalize3D(v: Point3D): Point3D {
  const mag = magnitude3D(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

/**
 * 3D 벡터의 내적
 */
export function dot3D(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * 3D 벡터의 외적
 */
export function cross3D(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * 두 3D 점 사이의 거리
 */
export function distance3D(a: Point3D, b: Point3D): number {
  return magnitude3D(subtract3D(a, b));
}

// ============================================
// 각도 변환
// ============================================

/**
 * 라디안 → 도
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * 도 → 라디안
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 오일러 각도를 도 단위로 변환
 */
export function eulerToDegrees(euler: EulerAngles): EulerAngles {
  return {
    pitch: radiansToDegrees(euler.pitch),
    yaw: radiansToDegrees(euler.yaw),
    roll: radiansToDegrees(euler.roll),
  };
}

// ============================================
// 얼굴 각도 계산
// ============================================

/**
 * 3점으로 얼굴 방향 벡터 계산
 * (이마, 왼쪽 볼, 오른쪽 볼)
 *
 * @param forehead - 이마 랜드마크
 * @param leftCheek - 왼쪽 볼 랜드마크
 * @param rightCheek - 오른쪽 볼 랜드마크
 * @returns 정규화된 방향 벡터
 */
export function calculateFaceNormal(
  forehead: Point3D,
  leftCheek: Point3D,
  rightCheek: Point3D
): Point3D {
  // 두 벡터 계산
  const v1 = subtract3D(leftCheek, forehead);
  const v2 = subtract3D(rightCheek, forehead);

  // 외적으로 법선 벡터 계산
  const normal = cross3D(v1, v2);

  return normalize3D(normal);
}

/**
 * 방향 벡터에서 오일러 각도 추출
 *
 * @param normal - 얼굴 법선 벡터
 * @returns 오일러 각도 (라디안)
 */
export function normalToEulerAngles(normal: Point3D): EulerAngles {
  // 정면 기준 벡터: { x: 0, y: 0, z: 1 } (z 방향)
  // Yaw (좌우 회전): xz 평면에서의 각도
  const yaw = Math.atan2(normal.x, normal.z);

  // Pitch (상하 회전): 법선의 y 성분
  const pitch = Math.asin(-normal.y);

  // Roll (기울기): 별도 계산 필요 (랜드마크 기반)
  // 여기서는 간략화를 위해 0으로 설정
  const roll = 0;

  return { pitch, yaw, roll };
}

/**
 * 두 눈의 기울기로 Roll 각도 계산
 *
 * @param leftEye - 왼쪽 눈 위치
 * @param rightEye - 오른쪽 눈 위치
 * @returns Roll 각도 (라디안)
 */
export function calculateRollFromEyes(leftEye: Point2D, rightEye: Point2D): number {
  const dx = rightEye.x - leftEye.x;
  const dy = rightEye.y - leftEye.y;
  return Math.atan2(dy, dx);
}

/**
 * 얼굴 랜드마크에서 오일러 각도 계산 (종합)
 *
 * @param forehead - 이마 랜드마크 (3D)
 * @param leftCheek - 왼쪽 볼 랜드마크 (3D)
 * @param rightCheek - 오른쪽 볼 랜드마크 (3D)
 * @param leftEye - 왼쪽 눈 랜드마크 (2D)
 * @param rightEye - 오른쪽 눈 랜드마크 (2D)
 * @returns 오일러 각도 (라디안)
 */
export function calculateFaceEulerAngles(
  forehead: Point3D,
  leftCheek: Point3D,
  rightCheek: Point3D,
  leftEye: Point2D,
  rightEye: Point2D
): EulerAngles {
  const normal = calculateFaceNormal(forehead, leftCheek, rightCheek);
  const { pitch, yaw } = normalToEulerAngles(normal);
  const roll = calculateRollFromEyes(leftEye, rightEye);

  return { pitch, yaw, roll };
}

// ============================================
// 정면성 점수 계산
// ============================================

/**
 * 정면성 점수 계산
 *
 * @param angles - 오일러 각도 (라디안)
 * @param thresholds - 각도별 임계값 (도)
 * @param weights - 각도별 가중치
 * @returns 0-100 점수
 */
export function calculateFrontalityScore(
  angles: EulerAngles,
  thresholds: { pitch: number; yaw: number; roll: number },
  weights: { pitch: number; yaw: number; roll: number }
): number {
  // 라디안 → 도 변환
  const pitchDeg = Math.abs(radiansToDegrees(angles.pitch));
  const yawDeg = Math.abs(radiansToDegrees(angles.yaw));
  const rollDeg = Math.abs(radiansToDegrees(angles.roll));

  // 각 각도의 점수 (0-100)
  // 임계값 이내면 100, 초과하면 선형 감소
  const pitchScore = Math.max(0, 100 * (1 - pitchDeg / (thresholds.pitch * 2)));
  const yawScore = Math.max(0, 100 * (1 - yawDeg / (thresholds.yaw * 2)));
  const rollScore = Math.max(0, 100 * (1 - rollDeg / (thresholds.roll * 2)));

  // 가중 평균
  const totalWeight = weights.pitch + weights.yaw + weights.roll;
  const score =
    (pitchScore * weights.pitch +
      yawScore * weights.yaw +
      rollScore * weights.roll) /
    totalWeight;

  return Math.round(Math.max(0, Math.min(100, score)));
}

// ============================================
// 기타 유틸리티
// ============================================

/**
 * 점 배열의 중심 계산
 */
export function centroid3D(points: Point3D[]): Point3D {
  if (points.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumZ += p.z;
  }

  const n = points.length;
  return { x: sumX / n, y: sumY / n, z: sumZ / n };
}

/**
 * 선형 보간
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * 3D 점의 선형 보간
 */
export function lerp3D(a: Point3D, b: Point3D, t: number): Point3D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

/**
 * 값을 범위 내로 클램핑
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
