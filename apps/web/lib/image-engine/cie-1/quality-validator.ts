/**
 * CIE-1: 이미지 품질 종합 검증
 *
 * @module lib/image-engine/cie-1/quality-validator
 * @description 선명도, 노출, 색온도, 해상도 종합 검증
 * @see docs/specs/SDD-CIE-1-IMAGE-QUALITY.md
 */

import type {
  RGBImageData,
  CIE1Output,
  SharpnessResult,
  ExposureResult,
  CCTResult,
  ResolutionResult,
  CIE1Config,
} from '../types';
import { DEFAULT_CIE_CONFIG, PROCESSING_TIMEOUT } from '../constants';
import { analyzeSharpness } from './sharpness';
import { analyzeExposure } from './exposure';
import { analyzeColorTemperature } from './color-temperature';
import { validateResolution } from './resolution';
import { generateCIE1Fallback } from './fallback';

/**
 * 이미지 품질 종합 점수 계산
 *
 * 가중치 (SDD-CIE-1-IMAGE-QUALITY.md 섹션 3.5 기준):
 * - 선명도: 30%
 * - 해상도: 20%
 * - 노출: 25%
 * - 색온도: 25%
 *
 * @param sharpness - 선명도 결과
 * @param exposure - 노출 결과
 * @param cct - 색온도 결과
 * @param resolution - 해상도 결과
 * @returns 종합 점수 (0-100)
 */
export function calculateOverallScore(
  sharpness: SharpnessResult,
  exposure: ExposureResult,
  cct: CCTResult,
  resolution: ResolutionResult | null
): number {
  // 각 요소 점수 정규화
  const sharpnessScore = sharpness.score;

  // 노출 점수 (normal이면 100, 아니면 감점)
  let exposureScore = 100;
  if (exposure.verdict === 'underexposed') {
    exposureScore = Math.max(0, 50 - (80 - exposure.meanBrightness));
  } else if (exposure.verdict === 'overexposed') {
    exposureScore = Math.max(0, 50 - (exposure.meanBrightness - 190));
  }

  // CCT 점수 (neutral이면 100, 거리에 따라 감점)
  let cctScore = 100;
  const cctDistance = Math.abs(cct.kelvin - 6500);
  if (cctDistance > 0) {
    cctScore = Math.max(0, 100 - cctDistance / 50);
  }

  // 해상도 점수
  const resolutionScore = resolution?.isValid ? 100 : 50;

  // 가중 평균 (SDD-CIE-1-IMAGE-QUALITY.md 섹션 3.5 기준)
  return Math.round(
    sharpnessScore * 0.3 +      // 선명도 30%
    resolutionScore * 0.2 +     // 해상도 20%
    exposureScore * 0.25 +      // 노출 25%
    cctScore * 0.25             // 색온도 25%
  );
}

/**
 * 종합 신뢰도 계산
 *
 * @param exposure - 노출 결과
 * @param cct - 색온도 결과
 * @returns 신뢰도 (0-1)
 */
export function calculateOverallConfidence(
  exposure: ExposureResult,
  cct: CCTResult
): number {
  return (exposure.confidence + cct.confidence) / 2;
}

/**
 * 수용 가능 여부 판정
 *
 * 거부 조건:
 * - 선명도 rejected
 * - 해상도 미달
 * - 극단적 노출 (평균 밝기 <50 또는 >220)
 *
 * @param sharpness - 선명도 결과
 * @param exposure - 노출 결과
 * @param resolution - 해상도 결과
 * @returns 수용 가능 여부
 */
export function isAcceptable(
  sharpness: SharpnessResult,
  exposure: ExposureResult,
  resolution: ResolutionResult | null
): boolean {
  // 선명도 거부
  if (sharpness.verdict === 'rejected') {
    return false;
  }

  // 해상도 미달
  if (resolution && !resolution.isValid) {
    return false;
  }

  // 극단적 노출
  if (exposure.meanBrightness < 50 || exposure.meanBrightness > 220) {
    return false;
  }

  return true;
}

/**
 * 주요 이슈 결정
 *
 * @param sharpness - 선명도 결과
 * @param exposure - 노출 결과
 * @param cct - 색온도 결과
 * @param resolution - 해상도 결과
 * @returns 주요 이슈 메시지 또는 null
 */
export function determinePrimaryIssue(
  sharpness: SharpnessResult,
  exposure: ExposureResult,
  cct: CCTResult,
  resolution: ResolutionResult | null
): string | null {
  // 우선순위: 해상도 → 선명도 → 노출 → 색온도
  if (resolution && !resolution.isValid) {
    return resolution.feedback;
  }

  if (sharpness.verdict === 'rejected') {
    return sharpness.feedback;
  }

  if (exposure.verdict !== 'normal') {
    return exposure.feedback;
  }

  if (cct.verdict === 'too_warm' || cct.verdict === 'too_cool') {
    return cct.feedback;
  }

  return null;
}

/**
 * 모든 이슈 수집
 *
 * @param sharpness - 선명도 결과
 * @param exposure - 노출 결과
 * @param cct - 색온도 결과
 * @param resolution - 해상도 결과
 * @returns 이슈 메시지 배열
 */
export function collectAllIssues(
  sharpness: SharpnessResult,
  exposure: ExposureResult,
  cct: CCTResult,
  resolution: ResolutionResult | null
): string[] {
  const issues: string[] = [];

  if (resolution && !resolution.isValid && resolution.feedback) {
    issues.push(resolution.feedback);
  }

  if (sharpness.verdict === 'rejected' || sharpness.verdict === 'warning') {
    issues.push(sharpness.feedback);
  }

  if (exposure.verdict !== 'normal') {
    issues.push(exposure.feedback);
  }

  if (cct.verdict !== 'neutral') {
    issues.push(cct.feedback);
  }

  return issues;
}

/**
 * 이미지 품질 종합 검증 (메인 함수)
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - CIE-1 설정 (옵션)
 * @param skipResolution - 해상도 검증 스킵 (옵션)
 * @returns CIE-1 출력
 */
export function validateImageQuality(
  imageData: RGBImageData,
  config: CIE1Config = DEFAULT_CIE_CONFIG.cie1,
  skipResolution = false
): CIE1Output {
  const startTime = performance.now();

  try {
    // 1. 선명도 분석
    const sharpness = analyzeSharpness(imageData);

    // 2. 노출 분석
    const exposure = analyzeExposure(imageData, config.exposure);

    // 3. 색온도 분석
    const colorTemperature = analyzeColorTemperature(imageData, config.cct);

    // 4. 해상도 검증 (선택적)
    const resolution = skipResolution
      ? null
      : validateResolution(imageData, config.resolution);

    // 5. 종합 점수 계산
    const overallScore = calculateOverallScore(
      sharpness,
      exposure,
      colorTemperature,
      resolution
    );

    // 6. 종합 신뢰도 계산
    const confidence = calculateOverallConfidence(exposure, colorTemperature);

    // 7. 수용 가능 여부
    const acceptable = isAcceptable(sharpness, exposure, resolution);

    // 8. 이슈 수집
    const primaryIssue = determinePrimaryIssue(
      sharpness,
      exposure,
      colorTemperature,
      resolution
    );
    const allIssues = collectAllIssues(
      sharpness,
      exposure,
      colorTemperature,
      resolution
    );

    const processingTime = performance.now() - startTime;

    return {
      isAcceptable: acceptable,
      overallScore,
      confidence,
      sharpness,
      resolution,
      exposure,
      colorTemperature,
      primaryIssue,
      allIssues,
      processingTime,
    };
  } catch (error) {
    // 에러 발생 시 Fallback 반환
    console.error('[CIE-1] Validation error:', error);
    const processingTime = performance.now() - startTime;
    return generateCIE1Fallback(processingTime);
  }
}

/**
 * 타임아웃 적용 이미지 품질 검증
 *
 * @param imageData - RGB 이미지 데이터
 * @param config - CIE-1 설정 (옵션)
 * @param timeout - 타임아웃 (ms)
 * @returns CIE-1 출력 Promise
 */
export async function validateImageQualityWithTimeout(
  imageData: RGBImageData,
  config: CIE1Config = DEFAULT_CIE_CONFIG.cie1,
  timeout = PROCESSING_TIMEOUT.cie1
): Promise<CIE1Output> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn('[CIE-1] Validation timeout');
      resolve(generateCIE1Fallback(timeout));
    }, timeout);

    try {
      const result = validateImageQuality(imageData, config);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[CIE-1] Validation error:', error);
      resolve(generateCIE1Fallback(0));
    }
  });
}
