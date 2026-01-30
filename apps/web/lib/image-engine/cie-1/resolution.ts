/**
 * CIE-1: 해상도 검증 모듈
 *
 * @module lib/image-engine/cie-1/resolution
 * @description 이미지 해상도 검증
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */

import type { RGBImageData, ResolutionResult } from '../types';
import { DEFAULT_CIE_CONFIG, FEEDBACK_MESSAGES } from '../constants';

/**
 * 해상도 검증
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - 해상도 설정 (옵션)
 * @returns 해상도 검증 결과
 */
export function validateResolution(
  imageData: RGBImageData,
  config = DEFAULT_CIE_CONFIG.cie1.resolution
): ResolutionResult {
  const { width, height } = imageData;
  const { minWidth, minHeight } = config;

  const pixelCount = width * height;
  const isValid = width >= minWidth && height >= minHeight;

  let feedback: string | null = null;
  if (!isValid) {
    feedback = FEEDBACK_MESSAGES.resolution.tooSmall;
  }

  return {
    width,
    height,
    pixelCount,
    isValid,
    feedback,
  };
}

/**
 * 해상도 점수 계산
 *
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @param config - 해상도 설정
 * @returns 0-100 점수
 */
export function calculateResolutionScore(
  width: number,
  height: number,
  config = DEFAULT_CIE_CONFIG.cie1.resolution
): number {
  const { minWidth, minHeight, recommendedWidth, recommendedHeight } = config;

  // 최소 해상도 미달
  if (width < minWidth || height < minHeight) {
    const widthRatio = width / minWidth;
    const heightRatio = height / minHeight;
    return Math.min(widthRatio, heightRatio) * 50;
  }

  // 최소~권장 사이
  if (width < recommendedWidth || height < recommendedHeight) {
    const widthProgress = (width - minWidth) / (recommendedWidth - minWidth);
    const heightProgress = (height - minHeight) / (recommendedHeight - minHeight);
    return 50 + Math.min(widthProgress, heightProgress) * 40;
  }

  // 권장 해상도 이상
  return 90 + Math.min(10, (width * height) / (recommendedWidth * recommendedHeight * 2) * 10);
}

/**
 * 해상도에서 직접 검증 (이미지 데이터 없이)
 *
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @param config - 해상도 설정 (옵션)
 * @returns 해상도 검증 결과
 */
export function validateResolutionDirect(
  width: number,
  height: number,
  config = DEFAULT_CIE_CONFIG.cie1.resolution
): ResolutionResult {
  const { minWidth, minHeight } = config;

  const pixelCount = width * height;
  const isValid = width >= minWidth && height >= minHeight;

  let feedback: string | null = null;
  if (!isValid) {
    feedback = FEEDBACK_MESSAGES.resolution.tooSmall;
  }

  return {
    width,
    height,
    pixelCount,
    isValid,
    feedback,
  };
}

/**
 * 얼굴 분석에 적합한 해상도인지 확인
 *
 * 얼굴 분석은 최소 얼굴 크기 100x100 픽셀 필요
 * 전체 이미지의 10-50%가 얼굴이라고 가정
 *
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @returns 얼굴 분석 적합 여부
 */
export function isSuitableForFaceAnalysis(width: number, height: number): boolean {
  // 최소 얼굴 크기 100x100
  // 이미지의 20%가 얼굴이라면, 전체 이미지는 최소 500x500
  const minDimension = Math.min(width, height);
  return minDimension >= 320; // 여유 있게 320px 이상
}

/**
 * 권장 리사이즈 크기 계산
 *
 * @param width - 현재 너비
 * @param height - 현재 높이
 * @param maxDimension - 최대 치수 (기본: 1024)
 * @returns 권장 크기
 */
export function calculateRecommendedSize(
  width: number,
  height: number,
  maxDimension = 1024
): { width: number; height: number; scale: number } {
  const maxCurrent = Math.max(width, height);

  if (maxCurrent <= maxDimension) {
    return { width, height, scale: 1 };
  }

  const scale = maxDimension / maxCurrent;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  };
}
