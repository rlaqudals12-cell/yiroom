/**
 * CIE-1: 선명도 분석 모듈
 *
 * @module lib/image-engine/cie-1/sharpness
 * @description Laplacian Variance 기반 선명도 측정
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 * @see docs/principles/image-processing.md
 */

import type { RGBImageData, GrayscaleImageData, SharpnessResult } from '../types';
import { toGrayscale } from '../utils/grayscale';
import { LAPLACIAN_KERNEL_3X3, SHARPNESS_GRADES, FEEDBACK_MESSAGES } from '../constants';

/**
 * Laplacian 필터 적용 (3x3 커널)
 *
 * 커널:
 * [ 0,  1,  0]
 * [ 1, -4,  1]
 * [ 0,  1,  0]
 *
 * @param grayData - 그레이스케일 이미지
 * @returns Laplacian 적용된 이미지 데이터
 */
export function applyLaplacianFilter(grayData: GrayscaleImageData): Float32Array {
  const { data, width, height } = grayData;
  const result = new Float32Array(width * height);

  // 경계 픽셀은 0으로 유지 (padding 없이)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // 3x3 Laplacian 커널 적용
      const laplacian =
        LAPLACIAN_KERNEL_3X3[0][1] * data[idx - width] + // 상
        LAPLACIAN_KERNEL_3X3[1][0] * data[idx - 1] + // 좌
        LAPLACIAN_KERNEL_3X3[1][1] * data[idx] + // 중앙
        LAPLACIAN_KERNEL_3X3[1][2] * data[idx + 1] + // 우
        LAPLACIAN_KERNEL_3X3[2][1] * data[idx + width]; // 하

      result[idx] = laplacian;
    }
  }

  return result;
}

/**
 * Laplacian Variance 계산
 *
 * Variance = Σ(L - μ)² / N
 * 여기서 L은 Laplacian 값, μ는 평균
 *
 * @param laplacianData - Laplacian 필터 적용된 데이터
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @returns Laplacian 분산값
 */
export function calculateLaplacianVariance(
  laplacianData: Float32Array,
  width: number,
  height: number
): number {
  // 경계 제외한 유효 픽셀 수
  const validWidth = width - 2;
  const validHeight = height - 2;
  const validPixelCount = validWidth * validHeight;

  if (validPixelCount <= 0) {
    return 0;
  }

  // 평균 계산
  let sum = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      sum += laplacianData[y * width + x];
    }
  }
  const mean = sum / validPixelCount;

  // 분산 계산
  let varianceSum = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const diff = laplacianData[y * width + x] - mean;
      varianceSum += diff * diff;
    }
  }

  return varianceSum / validPixelCount;
}

/**
 * Laplacian Variance를 0-100 점수로 정규화
 *
 * 정규화 공식:
 * - variance < 80: rejected (score = variance / 80 * 30)
 * - 80 <= variance < 120: warning (score = 30 + (variance - 80) / 40 * 20)
 * - 120 <= variance < 500: acceptable (score = 50 + (variance - 120) / 380 * 40)
 * - variance >= 500: optimal (score = 90 + min(10, (variance - 500) / 500 * 10))
 *
 * @param variance - Laplacian 분산값
 * @returns 정규화된 점수 (0-100)
 */
export function normalizeSharpnessScore(variance: number): number {
  const { rejected, warning, acceptable } = SHARPNESS_GRADES;

  if (variance < rejected.max) {
    // Rejected: 0-30점
    return (variance / rejected.max) * 30;
  } else if (variance < warning.max) {
    // Warning: 30-50점
    return 30 + ((variance - warning.min) / (warning.max - warning.min)) * 20;
  } else if (variance < acceptable.max) {
    // Acceptable: 50-90점
    return 50 + ((variance - acceptable.min) / (acceptable.max - acceptable.min)) * 40;
  } else {
    // Optimal: 90-100점
    return Math.min(100, 90 + ((variance - acceptable.max) / 500) * 10);
  }
}

/**
 * 선명도 등급 판정
 *
 * @param variance - Laplacian 분산값
 * @returns 등급
 */
export function getSharpnessVerdict(
  variance: number
): 'rejected' | 'warning' | 'acceptable' | 'optimal' {
  if (variance < SHARPNESS_GRADES.rejected.max) {
    return 'rejected';
  } else if (variance < SHARPNESS_GRADES.warning.max) {
    return 'warning';
  } else if (variance < SHARPNESS_GRADES.acceptable.max) {
    return 'acceptable';
  } else {
    return 'optimal';
  }
}

/**
 * 선명도 피드백 메시지 생성
 *
 * @param verdict - 등급
 * @returns 한국어 피드백 메시지
 */
export function getSharpnessFeedback(
  verdict: 'rejected' | 'warning' | 'acceptable' | 'optimal'
): string {
  return FEEDBACK_MESSAGES.sharpness[verdict];
}

/**
 * 선명도 분석 (메인 함수)
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 선명도 분석 결과
 */
export function analyzeSharpness(imageData: RGBImageData): SharpnessResult {
  // 1. 그레이스케일 변환
  const grayData = toGrayscale(imageData);

  // 2. Laplacian 필터 적용
  const laplacianData = applyLaplacianFilter(grayData);

  // 3. Laplacian Variance 계산
  const variance = calculateLaplacianVariance(
    laplacianData,
    grayData.width,
    grayData.height
  );

  // 4. 점수 정규화 및 등급 판정
  const score = normalizeSharpnessScore(variance);
  const verdict = getSharpnessVerdict(variance);
  const feedback = getSharpnessFeedback(verdict);

  return {
    score: Math.round(score),
    laplacianVariance: variance,
    verdict,
    feedback,
  };
}

/**
 * 그레이스케일 이미지에서 직접 선명도 분석
 *
 * @param grayData - 그레이스케일 이미지 데이터
 * @returns 선명도 분석 결과
 */
export function analyzeSharpnessFromGray(grayData: GrayscaleImageData): SharpnessResult {
  const laplacianData = applyLaplacianFilter(grayData);
  const variance = calculateLaplacianVariance(
    laplacianData,
    grayData.width,
    grayData.height
  );

  const score = normalizeSharpnessScore(variance);
  const verdict = getSharpnessVerdict(variance);
  const feedback = getSharpnessFeedback(verdict);

  return {
    score: Math.round(score),
    laplacianVariance: variance,
    verdict,
    feedback,
  };
}
