/**
 * 수학 유틸리티
 *
 * @module lib/image-engine/utils/math
 * @description 벡터 연산, 행렬 연산, 통계 함수
 *
 * @see {@link docs/principles/image-processing.md}
 */

import type { Point2D, Point3D } from '../types';

// ============================================
// 기본 통계
// ============================================

/**
 * 평균 계산
 *
 * @param values - 숫자 배열
 * @returns 평균값
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 분산 계산
 *
 * @param values - 숫자 배열
 * @param meanValue - 미리 계산된 평균 (선택)
 * @returns 분산
 */
export function variance(values: number[], meanValue?: number): number {
  if (values.length === 0) return 0;
  const m = meanValue ?? mean(values);
  return values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
}

/**
 * 표준편차 계산
 *
 * @param values - 숫자 배열
 * @param meanValue - 미리 계산된 평균 (선택)
 * @returns 표준편차
 */
export function standardDeviation(values: number[], meanValue?: number): number {
  return Math.sqrt(variance(values, meanValue));
}

/**
 * 최소값
 */
export function min(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * 최대값
 */
export function max(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * 중앙값
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 백분위수 계산
 *
 * @param values - 숫자 배열
 * @param percentile - 백분위수 (0-100)
 * @returns 해당 백분위수 값
 */
export function percentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

// ============================================
// 값 제한 및 정규화
// ============================================

/**
 * 값을 범위 내로 제한
 *
 * @param value - 입력값
 * @param minVal - 최소값
 * @param maxVal - 최대값
 * @returns 제한된 값
 */
export function clamp(value: number, minVal: number, maxVal: number): number {
  return Math.max(minVal, Math.min(maxVal, value));
}

/**
 * 값을 0-1 범위로 정규화
 *
 * @param value - 입력값
 * @param minVal - 원본 최소값
 * @param maxVal - 원본 최대값
 * @returns 정규화된 값 (0-1)
 */
export function normalize(value: number, minVal: number, maxVal: number): number {
  if (maxVal === minVal) return 0;
  return (value - minVal) / (maxVal - minVal);
}

/**
 * 0-1 값을 다른 범위로 변환
 *
 * @param value - 정규화된 값 (0-1)
 * @param minVal - 목표 최소값
 * @param maxVal - 목표 최대값
 * @returns 스케일된 값
 */
export function denormalize(value: number, minVal: number, maxVal: number): number {
  return value * (maxVal - minVal) + minVal;
}

/**
 * 선형 보간
 *
 * @param a - 시작값
 * @param b - 끝값
 * @param t - 보간 계수 (0-1)
 * @returns 보간된 값
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ============================================
// 벡터 연산 (2D)
// ============================================

/**
 * 2D 벡터 덧셈
 */
export function add2D(a: Point2D, b: Point2D): Point2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * 2D 벡터 뺄셈
 */
export function subtract2D(a: Point2D, b: Point2D): Point2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * 2D 벡터 스칼라 곱
 */
export function scale2D(v: Point2D, scalar: number): Point2D {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * 2D 벡터 내적
 */
export function dot2D(a: Point2D, b: Point2D): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * 2D 벡터 크기
 */
export function magnitude2D(v: Point2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * 2D 벡터 정규화
 */
export function normalize2D(v: Point2D): Point2D {
  const mag = magnitude2D(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * 두 2D 점 사이의 거리
 */
export function distance2D(a: Point2D, b: Point2D): number {
  return magnitude2D(subtract2D(a, b));
}

// ============================================
// 벡터 연산 (3D)
// ============================================

/**
 * 3D 벡터 덧셈
 */
export function add3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * 3D 벡터 뺄셈
 */
export function subtract3D(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * 3D 벡터 스칼라 곱
 */
export function scale3D(v: Point3D, scalar: number): Point3D {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

/**
 * 3D 벡터 내적
 */
export function dot3D(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * 3D 벡터 외적
 */
export function cross3D(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * 3D 벡터 크기
 */
export function magnitude3D(v: Point3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * 3D 벡터 정규화
 */
export function normalize3D(v: Point3D): Point3D {
  const mag = magnitude3D(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

/**
 * 두 3D 점 사이의 거리
 */
export function distance3D(a: Point3D, b: Point3D): number {
  return magnitude3D(subtract3D(a, b));
}

// ============================================
// 행렬 연산
// ============================================

/**
 * 3x3 행렬 × 3D 벡터
 *
 * @param matrix - 3x3 행렬 (행 우선)
 * @param v - 3D 벡터
 * @returns 변환된 벡터
 */
export function multiplyMatrix3x3Vector(matrix: number[][], v: Point3D): Point3D {
  return {
    x: matrix[0][0] * v.x + matrix[0][1] * v.y + matrix[0][2] * v.z,
    y: matrix[1][0] * v.x + matrix[1][1] * v.y + matrix[1][2] * v.z,
    z: matrix[2][0] * v.x + matrix[2][1] * v.y + matrix[2][2] * v.z,
  };
}

/**
 * 3x3 행렬 × 3x3 행렬
 *
 * @param a - 첫 번째 3x3 행렬
 * @param b - 두 번째 3x3 행렬
 * @returns 곱 행렬
 */
export function multiplyMatrix3x3(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }

  return result;
}

/**
 * 3x3 행렬 전치
 */
export function transposeMatrix3x3(m: number[][]): number[][] {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

/**
 * 3x3 행렬식
 */
export function determinant3x3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

/**
 * 3x3 역행렬
 *
 * @param m - 3x3 행렬
 * @returns 역행렬 (또는 null if singular)
 */
export function inverseMatrix3x3(m: number[][]): number[][] | null {
  const det = determinant3x3(m);
  if (Math.abs(det) < 1e-10) return null;

  const invDet = 1 / det;

  return [
    [
      (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * invDet,
      (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet,
      (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet,
    ],
    [
      (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet,
      (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet,
      (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet,
    ],
    [
      (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * invDet,
      (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * invDet,
      (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * invDet,
    ],
  ];
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

// ============================================
// 2D 컨볼루션
// ============================================

/**
 * 2D 컨볼루션 (경계 처리: 제로 패딩)
 *
 * @param image - 2D 이미지 배열
 * @param kernel - 컨볼루션 커널
 * @returns 컨볼루션 결과
 */
export function convolve2D(image: number[][], kernel: number[][]): number[][] {
  const imageHeight = image.length;
  const imageWidth = image[0]?.length ?? 0;
  const kernelHeight = kernel.length;
  const kernelWidth = kernel[0]?.length ?? 0;

  const padY = Math.floor(kernelHeight / 2);
  const padX = Math.floor(kernelWidth / 2);

  const result: number[][] = [];

  for (let y = 0; y < imageHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < imageWidth; x++) {
      let sum = 0;

      for (let ky = 0; ky < kernelHeight; ky++) {
        for (let kx = 0; kx < kernelWidth; kx++) {
          const iy = y + ky - padY;
          const ix = x + kx - padX;

          // 제로 패딩
          const pixelValue =
            iy >= 0 && iy < imageHeight && ix >= 0 && ix < imageWidth
              ? image[iy][ix]
              : 0;

          sum += pixelValue * kernel[ky][kx];
        }
      }

      row.push(sum);
    }
    result.push(row);
  }

  return result;
}

/**
 * Laplacian 커널
 * 이미지 선명도 측정용
 */
export const LAPLACIAN_KERNEL: number[][] = [
  [0, 1, 0],
  [1, -4, 1],
  [0, 1, 0],
];

/**
 * Laplacian 분산 계산 (선명도 측정)
 *
 * @param grayscale2D - 2D 그레이스케일 이미지
 * @returns Laplacian 분산 값
 */
export function laplacianVariance(grayscale2D: number[][]): number {
  const laplacian = convolve2D(grayscale2D, LAPLACIAN_KERNEL);

  // 분산 계산
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (const row of laplacian) {
    for (const value of row) {
      sum += value;
      sumSq += value * value;
      count++;
    }
  }

  if (count === 0) return 0;

  const meanVal = sum / count;
  return sumSq / count - meanVal * meanVal;
}
