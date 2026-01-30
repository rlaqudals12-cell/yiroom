/**
 * CIE-1: 색온도(CCT) 분석 모듈
 *
 * @module lib/image-engine/cie-1/color-temperature
 * @description McCamy 공식 기반 상관 색온도 추정
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 * @see docs/principles/image-processing.md
 */

import type { RGBImageData, RGB, CCTResult } from '../types';
import { rgbToChromaticity, estimateCCT } from '../utils/color-space';
import { DEFAULT_CIE_CONFIG, CCT_RANGES, FEEDBACK_MESSAGES } from '../constants';

/**
 * CCT 등급 판정
 *
 * @param kelvin - 색온도 (Kelvin)
 * @returns CCT 등급
 */
export function getCCTVerdict(
  kelvin: number
): 'too_warm' | 'warm' | 'neutral' | 'cool' | 'too_cool' {
  if (kelvin < CCT_RANGES.tooWarm.max) {
    return 'too_warm';
  } else if (kelvin < CCT_RANGES.warm.max) {
    return 'warm';
  } else if (kelvin < CCT_RANGES.neutral.max) {
    return 'neutral';
  } else if (kelvin < CCT_RANGES.cool.max) {
    return 'cool';
  } else {
    return 'too_cool';
  }
}

/**
 * CCT 신뢰도 계산
 *
 * D65(6500K) 기준으로 거리에 따른 신뢰도
 * 적정 범위(4000K-7500K) 내에서 높은 신뢰도
 *
 * @param kelvin - 색온도
 * @param config - CCT 설정
 * @returns 신뢰도 (0-1)
 */
export function calculateCCTConfidence(
  kelvin: number,
  config = DEFAULT_CIE_CONFIG.cie1.cct
): number {
  const { minKelvin, maxKelvin, idealKelvin } = config;

  // 적정 범위 내
  if (kelvin >= minKelvin && kelvin <= maxKelvin) {
    // D65에 가까울수록 높은 신뢰도
    const distanceFromIdeal = Math.abs(kelvin - idealKelvin);
    const maxDistance = Math.max(idealKelvin - minKelvin, maxKelvin - idealKelvin);
    return 0.7 + 0.3 * (1 - distanceFromIdeal / maxDistance);
  }

  // 적정 범위 외
  const overshoot = kelvin < minKelvin
    ? minKelvin - kelvin
    : kelvin - maxKelvin;

  return Math.max(0.1, 0.7 - overshoot / 2000);
}

/**
 * CCT 피드백 메시지 생성
 *
 * @param verdict - CCT 등급
 * @returns 한국어 피드백
 */
export function getCCTFeedback(
  verdict: 'too_warm' | 'warm' | 'neutral' | 'cool' | 'too_cool'
): string {
  const feedbackMap: Record<typeof verdict, string> = {
    too_warm: FEEDBACK_MESSAGES.cct.tooWarm,
    warm: FEEDBACK_MESSAGES.cct.warm,
    neutral: FEEDBACK_MESSAGES.cct.neutral,
    cool: FEEDBACK_MESSAGES.cct.cool,
    too_cool: FEEDBACK_MESSAGES.cct.tooCool,
  };
  return feedbackMap[verdict];
}

/**
 * 이미지의 평균 RGB 계산
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 평균 RGB
 */
export function calculateImageAverageRGB(imageData: RGBImageData): RGB {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    sumR += data[offset];
    sumG += data[offset + 1];
    sumB += data[offset + 2];
  }

  return {
    r: Math.round(sumR / pixelCount),
    g: Math.round(sumG / pixelCount),
    b: Math.round(sumB / pixelCount),
  };
}

/**
 * 밝은 영역만 샘플링하여 CCT 추정 (더 정확)
 *
 * 어두운 영역은 색온도 측정에 노이즈를 추가할 수 있음
 *
 * @param imageData - RGB 이미지 데이터
 * @param brightnessThreshold - 밝기 임계값 (0-255)
 * @returns 밝은 영역의 평균 RGB
 */
export function calculateBrightRegionAverageRGB(
  imageData: RGBImageData,
  brightnessThreshold = 100
): RGB | null {
  const { data, width, height, channels } = imageData;
  const pixelCount = width * height;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let brightPixelCount = 0;

  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];

    // 밝기 계산 (간단한 방식)
    const brightness = (r + g + b) / 3;

    if (brightness >= brightnessThreshold) {
      sumR += r;
      sumG += g;
      sumB += b;
      brightPixelCount++;
    }
  }

  // 밝은 픽셀이 충분하지 않으면 null 반환
  if (brightPixelCount < pixelCount * 0.1) {
    return null;
  }

  return {
    r: Math.round(sumR / brightPixelCount),
    g: Math.round(sumG / brightPixelCount),
    b: Math.round(sumB / brightPixelCount),
  };
}

/**
 * 색온도 분석 (메인 함수)
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - CCT 설정 (옵션)
 * @returns CCT 분석 결과
 */
export function analyzeColorTemperature(
  imageData: RGBImageData,
  config = DEFAULT_CIE_CONFIG.cie1.cct
): CCTResult {
  // 1. 밝은 영역 또는 전체 이미지의 평균 RGB
  const brightAvgRGB = calculateBrightRegionAverageRGB(imageData);
  const avgRGB = brightAvgRGB ?? calculateImageAverageRGB(imageData);

  // 2. xy 색도 좌표 계산
  const chromaticity = rgbToChromaticity(avgRGB);

  // 3. McCamy 공식으로 CCT 추정
  const kelvin = estimateCCT(chromaticity);

  // 4. 등급 판정
  const verdict = getCCTVerdict(kelvin);

  // 5. 신뢰도 계산
  const confidence = calculateCCTConfidence(kelvin, config);

  // 6. 피드백 생성
  const feedback = getCCTFeedback(verdict);

  return {
    kelvin,
    verdict,
    chromaticity,
    confidence,
    feedback,
  };
}

/**
 * RGB 값에서 직접 CCT 분석
 *
 * @param avgRGB - 평균 RGB 값
 * @param config - CCT 설정 (옵션)
 * @returns CCT 분석 결과
 */
export function analyzeColorTemperatureFromRGB(
  avgRGB: RGB,
  config = DEFAULT_CIE_CONFIG.cie1.cct
): CCTResult {
  const chromaticity = rgbToChromaticity(avgRGB);
  const kelvin = estimateCCT(chromaticity);
  const verdict = getCCTVerdict(kelvin);
  const confidence = calculateCCTConfidence(kelvin, config);
  const feedback = getCCTFeedback(verdict);

  return {
    kelvin,
    verdict,
    chromaticity,
    confidence,
    feedback,
  };
}
