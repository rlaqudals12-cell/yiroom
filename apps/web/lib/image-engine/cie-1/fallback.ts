/**
 * CIE-1: Fallback 데이터 생성
 *
 * @module lib/image-engine/cie-1/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 * @see docs/adr/ADR-007-mock-fallback-strategy.md
 */

import type { CIE1Output, SharpnessResult, ExposureResult, CCTResult } from '../types';
import { FEEDBACK_MESSAGES } from '../constants';

/**
 * 기본 선명도 Fallback 결과
 */
export function generateSharpnessFallback(): SharpnessResult {
  return {
    score: 70,
    laplacianVariance: 150,
    verdict: 'acceptable',
    feedback: FEEDBACK_MESSAGES.sharpness.acceptable,
  };
}

/**
 * 기본 노출 Fallback 결과
 */
export function generateExposureFallback(): ExposureResult {
  return {
    meanBrightness: 128,
    verdict: 'normal',
    confidence: 0.5,
    feedback: FEEDBACK_MESSAGES.exposure.normal,
  };
}

/**
 * 기본 CCT Fallback 결과
 */
export function generateCCTFallback(): CCTResult {
  return {
    kelvin: 6500,
    verdict: 'neutral',
    chromaticity: { x: 0.31271, y: 0.32902 },
    confidence: 0.5,
    feedback: FEEDBACK_MESSAGES.cct.neutral,
  };
}

/**
 * CIE-1 전체 Fallback 결과 생성
 *
 * @param processingTime - 처리 시간 (ms)
 * @returns CIE-1 Fallback 출력
 */
export function generateCIE1Fallback(processingTime = 0): CIE1Output {
  return {
    isAcceptable: true,
    overallScore: 70,
    confidence: 0.5,
    sharpness: generateSharpnessFallback(),
    resolution: null,
    exposure: generateExposureFallback(),
    colorTemperature: generateCCTFallback(),
    primaryIssue: null,
    allIssues: [],
    processingTime,
  };
}

/**
 * 부분 실패 시 Fallback (일부 결과 유지)
 *
 * @param partial - 부분 결과
 * @param processingTime - 처리 시간
 * @returns 병합된 CIE-1 출력
 */
export function generatePartialCIE1Fallback(
  partial: Partial<CIE1Output>,
  processingTime = 0
): CIE1Output {
  const fallback = generateCIE1Fallback(processingTime);

  return {
    ...fallback,
    ...partial,
    // 신뢰도 감소 (부분 결과이므로)
    confidence: (partial.confidence ?? fallback.confidence) * 0.8,
    processingTime,
  };
}

/**
 * 거부 상태 Fallback (분석 불가)
 *
 * @param reason - 거부 이유
 * @param processingTime - 처리 시간
 * @returns 거부 상태 CIE-1 출력
 */
export function generateRejectedFallback(
  reason: string,
  processingTime = 0
): CIE1Output {
  return {
    isAcceptable: false,
    overallScore: 0,
    confidence: 0.1,
    sharpness: {
      score: 0,
      laplacianVariance: 0,
      verdict: 'rejected',
      feedback: reason,
    },
    resolution: null,
    exposure: {
      meanBrightness: 0,
      verdict: 'underexposed',
      confidence: 0.1,
      feedback: reason,
    },
    colorTemperature: {
      kelvin: 0,
      verdict: 'too_warm',
      chromaticity: { x: 0, y: 0 },
      confidence: 0.1,
      feedback: reason,
    },
    primaryIssue: reason,
    allIssues: [reason],
    processingTime,
  };
}

/**
 * 랜덤 Mock 데이터 생성 (테스트용)
 *
 * @returns 랜덤화된 CIE-1 출력
 */
export function generateRandomCIE1Mock(): CIE1Output {
  const sharpnessScore = Math.floor(Math.random() * 100);
  const meanBrightness = Math.floor(Math.random() * 256);
  const kelvin = 4000 + Math.floor(Math.random() * 4000);

  const sharpnessVerdict =
    sharpnessScore < 30 ? 'rejected' :
    sharpnessScore < 50 ? 'warning' :
    sharpnessScore < 80 ? 'acceptable' : 'optimal';

  const exposureVerdict =
    meanBrightness < 80 ? 'underexposed' :
    meanBrightness > 190 ? 'overexposed' : 'normal';

  const cctVerdict =
    kelvin < 4000 ? 'too_warm' :
    kelvin < 5500 ? 'warm' :
    kelvin < 6500 ? 'neutral' :
    kelvin < 7500 ? 'cool' : 'too_cool';

  return {
    isAcceptable: sharpnessVerdict !== 'rejected' && exposureVerdict === 'normal',
    overallScore: sharpnessScore,
    confidence: 0.8 + Math.random() * 0.2,
    sharpness: {
      score: sharpnessScore,
      laplacianVariance: sharpnessScore * 5,
      verdict: sharpnessVerdict,
      feedback: FEEDBACK_MESSAGES.sharpness[sharpnessVerdict],
    },
    resolution: {
      width: 1024,
      height: 768,
      pixelCount: 1024 * 768,
      isValid: true,
      feedback: null,
    },
    exposure: {
      meanBrightness,
      verdict: exposureVerdict,
      confidence: 0.8,
      feedback: FEEDBACK_MESSAGES.exposure[exposureVerdict],
    },
    colorTemperature: {
      kelvin,
      verdict: cctVerdict,
      chromaticity: { x: 0.31 + Math.random() * 0.02, y: 0.32 + Math.random() * 0.02 },
      confidence: 0.8,
      feedback: FEEDBACK_MESSAGES.cct[cctVerdict === 'too_warm' ? 'tooWarm' : cctVerdict === 'too_cool' ? 'tooCool' : cctVerdict],
    },
    primaryIssue: null,
    allIssues: [],
    processingTime: Math.random() * 100,
  };
}
