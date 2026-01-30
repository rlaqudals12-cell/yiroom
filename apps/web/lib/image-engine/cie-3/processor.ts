/**
 * CIE-3: AWB 보정 통합 프로세서
 *
 * @module lib/image-engine/cie-3/processor
 * @description Gray World, Von Kries, Skin-Aware AWB 통합
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 */

import type {
  RGBImageData,
  CIE3Output,
  AWBCorrectionResult,
  RGB,
} from '../types';
import { DEFAULT_CIE_CONFIG, PROCESSING_TIMEOUT } from '../constants';
import { estimateCCTFromRGB } from '../utils/color-space';
import { detectSkinMask, hasSufficientSkinCoverage } from './skin-detector';
import {
  applyGrayWorld,
  applyVonKries,
  applySkinAwareAWB,
  calculateGrayWorldGains,
  isValidGains,
} from './awb-algorithms';
import { generateCIE3Fallback } from './fallback';
import {
  calculateConfidence,
  getMethodDefaultConfidence,
} from './confidence';

/**
 * 이미지 평균 RGB 계산
 */
function calculateImageAverageRGB(imageData: RGBImageData): RGB {
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
 * 최적의 AWB 방법 선택 및 적용
 *
 * 우선순위:
 * 1. Skin-Aware (피부 감지 충분 시)
 * 2. Von Kries (색온도 편차 큰 경우)
 * 3. Gray World (기본)
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - CIE-3 설정
 * @returns AWB 보정 결과
 */
export function selectAndApplyAWB(
  imageData: RGBImageData,
  config = DEFAULT_CIE_CONFIG.cie3
): AWBCorrectionResult | null {
  // 1. 원본 평균 RGB 및 CCT
  const originalAvgRGB = calculateImageAverageRGB(imageData);
  const originalCCT = estimateCCTFromRGB(originalAvgRGB);

  // 2. CCT가 이미 적정 범위면 보정 불필요
  const cctDiff = Math.abs(originalCCT - config.targetCCT);
  if (cctDiff < 500) {
    return {
      correctedImage: imageData,
      gains: { r: 1, g: 1, b: 1 },
      originalCCT,
      correctedCCT: originalCCT,
      method: 'none',
      confidence: getMethodDefaultConfidence('none'),
    };
  }

  // 3. 피부 감지
  const skinMask = detectSkinMask(imageData, config.skinDetection);
  const hasSufficientSkin = hasSufficientSkinCoverage(skinMask, config.minSkinCoverage);

  let correctedImage: RGBImageData;
  let method: 'gray_world' | 'von_kries' | 'skin_aware' | 'none';

  // 4. 방법 선택
  if (hasSufficientSkin) {
    // Skin-Aware AWB 시도
    const skinAwareResult = applySkinAwareAWB(imageData, skinMask);
    if (skinAwareResult) {
      correctedImage = skinAwareResult;
      method = 'skin_aware';
    } else {
      // 실패 시 Gray World
      correctedImage = applyGrayWorld(imageData, originalAvgRGB);
      method = 'gray_world';
    }
  } else if (cctDiff > 1500) {
    // 큰 색온도 편차 → Von Kries
    correctedImage = applyVonKries(imageData, originalAvgRGB);
    method = 'von_kries';
  } else {
    // 기본 Gray World
    correctedImage = applyGrayWorld(imageData, originalAvgRGB);
    method = 'gray_world';
  }

  // 5. 보정 후 CCT 계산
  const correctedAvgRGB = calculateImageAverageRGB(correctedImage);
  const correctedCCT = estimateCCTFromRGB(correctedAvgRGB);

  // 6. 게인 계산
  const gains = calculateGrayWorldGains(originalAvgRGB);

  // 7. 게인 유효성 확인
  if (!isValidGains(gains)) {
    return null; // 극단적 보정 필요 → 보정 불가
  }

  // 8. 신뢰도 계산 (분리된 모듈 사용)
  // 비피부 영역 비율 계산
  const nonSkinRatio = 1 - skinMask.skinRatio;
  const confidence = calculateConfidence(gains, originalCCT, config.targetCCT, nonSkinRatio);

  return {
    correctedImage,
    gains,
    originalCCT,
    correctedCCT,
    method,
    confidence,
  };
}

/**
 * AWB 보정 처리 (메인 함수)
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - CIE-3 설정
 * @returns CIE-3 출력
 */
export function processAWBCorrection(
  imageData: RGBImageData,
  config = DEFAULT_CIE_CONFIG.cie3
): CIE3Output {
  const startTime = performance.now();

  try {
    // 1. 피부 감지
    const skinMask = detectSkinMask(imageData, config.skinDetection);

    // 2. AWB 보정 선택 및 적용
    const correctionResult = selectAndApplyAWB(imageData, config);

    const processingTime = performance.now() - startTime;

    if (!correctionResult) {
      return {
        success: true,
        correctionApplied: false,
        result: null,
        skinDetection: {
          detected: skinMask.skinPixelCount > 0,
          coverage: skinMask.skinRatio,
          mask: skinMask,
        },
        metadata: {
          processingTime,
          methodUsed: 'none',
          confidence: 0.5,
        },
      };
    }

    return {
      success: true,
      correctionApplied: correctionResult.method !== 'none',
      result: correctionResult,
      skinDetection: {
        detected: skinMask.skinPixelCount > 0,
        coverage: skinMask.skinRatio,
        mask: skinMask,
      },
      metadata: {
        processingTime,
        methodUsed: correctionResult.method,
        confidence: correctionResult.confidence,
      },
    };
  } catch (error) {
    console.error('[CIE-3] AWB correction error:', error);
    return generateCIE3Fallback(performance.now() - startTime);
  }
}

/**
 * 타임아웃 적용 AWB 보정
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - CIE-3 설정
 * @param timeout - 타임아웃 (ms)
 * @returns CIE-3 출력 Promise
 */
export async function processAWBCorrectionWithTimeout(
  imageData: RGBImageData,
  config = DEFAULT_CIE_CONFIG.cie3,
  timeout: number = PROCESSING_TIMEOUT.cie3
): Promise<CIE3Output> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn('[CIE-3] AWB correction timeout');
      resolve(generateCIE3Fallback(timeout));
    }, timeout);

    try {
      const result = processAWBCorrection(imageData, config);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[CIE-3] AWB correction error:', error);
      resolve(generateCIE3Fallback(0));
    }
  });
}
