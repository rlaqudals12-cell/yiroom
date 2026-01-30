/**
 * CIE-1: 노출 분석 모듈
 *
 * @module lib/image-engine/cie-1/exposure
 * @description 히스토그램 기반 노출 분석
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */

import type { RGBImageData, GrayscaleImageData, ExposureResult } from '../types';
import {
  toGrayscale,
  calculateMeanBrightness,
  calculateHistogram,
} from '../utils/grayscale';
import { DEFAULT_CIE_CONFIG, FEEDBACK_MESSAGES } from '../constants';

/**
 * 노출 등급 판정
 *
 * @param meanBrightness - 평균 밝기 (0-255)
 * @param config - 노출 설정
 * @returns 노출 등급
 */
export function getExposureVerdict(
  meanBrightness: number,
  config = DEFAULT_CIE_CONFIG.cie1.exposure
): 'underexposed' | 'normal' | 'overexposed' {
  if (meanBrightness < config.minBrightness) {
    return 'underexposed';
  } else if (meanBrightness > config.maxBrightness) {
    return 'overexposed';
  }
  return 'normal';
}

/**
 * 노출 신뢰도 계산
 *
 * 적정 범위(80-190) 중앙에 가까울수록 높은 신뢰도
 * 범위 바깥으로 갈수록 낮은 신뢰도
 *
 * @param meanBrightness - 평균 밝기
 * @param config - 노출 설정
 * @returns 신뢰도 (0-1)
 */
export function calculateExposureConfidence(
  meanBrightness: number,
  config = DEFAULT_CIE_CONFIG.cie1.exposure
): number {
  const { minBrightness, maxBrightness } = config;
  const midPoint = (minBrightness + maxBrightness) / 2;
  const range = (maxBrightness - minBrightness) / 2;

  // 중앙에서의 거리
  const distanceFromCenter = Math.abs(meanBrightness - midPoint);

  // 신뢰도 계산 (중앙일수록 1에 가까움)
  if (distanceFromCenter <= range) {
    // 적정 범위 내: 0.7 ~ 1.0
    return 0.7 + 0.3 * (1 - distanceFromCenter / range);
  } else {
    // 적정 범위 외: 선형 감소
    const overshoot = distanceFromCenter - range;
    return Math.max(0.1, 0.7 - overshoot / 100);
  }
}

/**
 * 노출 피드백 메시지 생성
 *
 * @param verdict - 노출 등급
 * @returns 한국어 피드백
 */
export function getExposureFeedback(
  verdict: 'underexposed' | 'normal' | 'overexposed'
): string {
  return FEEDBACK_MESSAGES.exposure[verdict];
}

/**
 * 히스토그램 분석 (상세)
 *
 * @param histogram - 256 bin 히스토그램
 * @param pixelCount - 총 픽셀 수
 * @returns 히스토그램 통계
 */
export function analyzeHistogram(
  histogram: number[],
  pixelCount: number
): {
  clippedDarkRatio: number;
  clippedBrightRatio: number;
  peakBin: number;
  dynamicRange: number;
} {
  // 입력 검증: 빈 데이터 또는 잘못된 형식 처리
  if (!histogram || histogram.length !== 256 || pixelCount <= 0) {
    return {
      clippedDarkRatio: 0,
      clippedBrightRatio: 0,
      peakBin: 128, // 중간값
      dynamicRange: 0,
    };
  }

  // 클리핑 비율 (0-5, 250-255 bin)
  let clippedDark = 0;
  let clippedBright = 0;
  for (let i = 0; i < 6; i++) {
    clippedDark += histogram[i] ?? 0;
    clippedBright += histogram[255 - i] ?? 0;
  }

  // 피크 bin
  let peakBin = 0;
  let maxCount = 0;
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > maxCount) {
      maxCount = histogram[i];
      peakBin = i;
    }
  }

  // 동적 범위 (5% 이상 픽셀이 있는 범위)
  const threshold = pixelCount * 0.05;
  let minBin = 0;
  let maxBin = 255;

  let cumSum = 0;
  for (let i = 0; i < 256; i++) {
    cumSum += histogram[i];
    if (cumSum >= threshold) {
      minBin = i;
      break;
    }
  }

  cumSum = 0;
  for (let i = 255; i >= 0; i--) {
    cumSum += histogram[i];
    if (cumSum >= threshold) {
      maxBin = i;
      break;
    }
  }

  return {
    clippedDarkRatio: clippedDark / pixelCount,
    clippedBrightRatio: clippedBright / pixelCount,
    peakBin,
    dynamicRange: maxBin - minBin,
  };
}

/**
 * 노출 분석 (메인 함수)
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - 노출 설정 (옵션)
 * @returns 노출 분석 결과
 */
export function analyzeExposure(
  imageData: RGBImageData,
  config = DEFAULT_CIE_CONFIG.cie1.exposure
): ExposureResult {
  // 1. 그레이스케일 변환
  const grayData = toGrayscale(imageData);

  // 2. 평균 밝기 계산
  const meanBrightness = calculateMeanBrightness(grayData);

  // 3. 등급 판정
  const verdict = getExposureVerdict(meanBrightness, config);

  // 4. 신뢰도 계산
  const confidence = calculateExposureConfidence(meanBrightness, config);

  // 5. 피드백 생성
  const feedback = getExposureFeedback(verdict);

  return {
    meanBrightness,
    verdict,
    confidence,
    feedback,
  };
}

/**
 * 그레이스케일 이미지에서 직접 노출 분석
 *
 * @param grayData - 그레이스케일 이미지
 * @param config - 노출 설정 (옵션)
 * @returns 노출 분석 결과
 */
export function analyzeExposureFromGray(
  grayData: GrayscaleImageData,
  config = DEFAULT_CIE_CONFIG.cie1.exposure
): ExposureResult {
  const meanBrightness = calculateMeanBrightness(grayData);
  const verdict = getExposureVerdict(meanBrightness, config);
  const confidence = calculateExposureConfidence(meanBrightness, config);
  const feedback = getExposureFeedback(verdict);

  return {
    meanBrightness,
    verdict,
    confidence,
    feedback,
  };
}

/**
 * 상세 노출 분석 (히스토그램 포함)
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 상세 노출 분석 결과
 */
export function analyzeExposureDetailed(
  imageData: RGBImageData
): ExposureResult & {
  histogram: number[];
  histogramStats: ReturnType<typeof analyzeHistogram>;
} {
  const grayData = toGrayscale(imageData);
  const meanBrightness = calculateMeanBrightness(grayData);
  const histogram = calculateHistogram(grayData);
  const pixelCount = grayData.width * grayData.height;
  const histogramStats = analyzeHistogram(histogram, pixelCount);

  const verdict = getExposureVerdict(meanBrightness);
  const confidence = calculateExposureConfidence(meanBrightness);
  const feedback = getExposureFeedback(verdict);

  return {
    meanBrightness,
    verdict,
    confidence,
    feedback,
    histogram,
    histogramStats,
  };
}
