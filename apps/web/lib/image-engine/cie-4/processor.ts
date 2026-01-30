/**
 * CIE-4: 조명 분석 통합 프로세서
 *
 * @module lib/image-engine/cie-4/processor
 * @description CCT, 6존 분석, 그림자 감지 통합
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 */

import type {
  RGBImageData,
  CIE4Output,
  NormalizedRect,
} from '../types';
import { DEFAULT_CIE_CONFIG, PROCESSING_TIMEOUT } from '../constants';
import {
  estimateCCTFromFace,
  estimateCCTFromImage,
  classifyLightingType,
  evaluateCCTSuitability,
  needsCCTCorrection,
} from './cct-analyzer';
import { performZoneAnalysis, uniformityToScore } from './zone-analyzer';
import { performShadowAnalysis, shadowToScore } from './shadow-detector';
import { generateCIE4Fallback } from './fallback';

/**
 * 조명 분석 처리 (메인 함수)
 *
 * @param imageData - RGB 이미지 데이터
 * @param faceRegion - 얼굴 영역 (선택)
 * @param config - CIE-4 설정
 * @returns CIE-4 출력
 */
export function processLightingAnalysis(
  imageData: RGBImageData,
  faceRegion?: NormalizedRect,
  partialConfig: Partial<typeof DEFAULT_CIE_CONFIG.cie4> = {}
): CIE4Output {
  const config = { ...DEFAULT_CIE_CONFIG.cie4, ...partialConfig };
  const startTime = performance.now();

  try {
    // 1. CCT 분석
    const estimatedCCT = faceRegion
      ? estimateCCTFromFace(imageData, faceRegion)
      : estimateCCTFromImage(imageData);

    const lightingType = classifyLightingType(estimatedCCT);
    const cctSuitability = evaluateCCTSuitability(estimatedCCT);
    const requiresCorrection = needsCCTCorrection(estimatedCCT);

    // 2. 6존 분석 (얼굴 영역이 있을 때만)
    let zoneAnalysis = null;
    let uniformityScore = 100;

    if (faceRegion) {
      zoneAnalysis = performZoneAnalysis(imageData, faceRegion);
      uniformityScore = uniformityToScore(zoneAnalysis.uniformity);
    }

    // 3. 그림자 분석 (얼굴 영역이 있을 때만)
    let shadowAnalysis = null;
    let shadowScore = 100;

    if (faceRegion) {
      shadowAnalysis = performShadowAnalysis(imageData, faceRegion);
      shadowScore = shadowToScore(shadowAnalysis);
    }

    // 4. 종합 점수 계산
    const overallScore = calculateOverallScore(
      cctSuitability,
      uniformityScore,
      shadowScore
    );

    // 5. 적합성 판정
    const isSuitable = overallScore >= config.minQualityScore;

    // 6. 피드백 생성
    const feedback = generateFeedback(
      estimatedCCT,
      lightingType,
      zoneAnalysis,
      shadowAnalysis,
      overallScore
    );

    const processingTime = performance.now() - startTime;

    return {
      success: true,
      isSuitable,
      estimatedCCT,
      lightingType,
      cctSuitability,
      requiresCorrection,
      zoneAnalysis,
      shadowAnalysis,
      overallScore,
      feedback,
      metadata: {
        processingTime,
        hasFaceRegion: !!faceRegion,
        confidence: calculateConfidence(faceRegion, overallScore),
      },
    };
  } catch (error) {
    console.error('[CIE-4] Lighting analysis error:', error);
    return generateCIE4Fallback(performance.now() - startTime);
  }
}

/**
 * 타임아웃 적용 조명 분석
 *
 * @param imageData - RGB 이미지 데이터
 * @param faceRegion - 얼굴 영역 (선택)
 * @param config - CIE-4 설정
 * @param timeout - 타임아웃 (ms)
 * @returns CIE-4 출력 Promise
 */
export async function processLightingAnalysisWithTimeout(
  imageData: RGBImageData,
  faceRegion?: NormalizedRect,
  partialConfig: Partial<typeof DEFAULT_CIE_CONFIG.cie4> = {},
  timeout: number = PROCESSING_TIMEOUT.cie4
): Promise<CIE4Output> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn('[CIE-4] Lighting analysis timeout');
      resolve(generateCIE4Fallback(timeout));
    }, timeout);

    try {
      const result = processLightingAnalysis(imageData, faceRegion, partialConfig);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[CIE-4] Lighting analysis error:', error);
      resolve(generateCIE4Fallback(0));
    }
  });
}

/**
 * 종합 점수 계산
 *
 * @param cctScore - CCT 적합성 점수
 * @param uniformityScore - 균일성 점수
 * @param shadowScore - 그림자 없음 점수
 * @returns 종합 점수 (0-100)
 */
function calculateOverallScore(
  cctScore: number,
  uniformityScore: number,
  shadowScore: number
): number {
  // 가중 평균: CCT 40%, 균일성 35%, 그림자 25%
  const weights = { cct: 0.4, uniformity: 0.35, shadow: 0.25 };

  return Math.round(
    cctScore * weights.cct +
    uniformityScore * weights.uniformity +
    shadowScore * weights.shadow
  );
}

/**
 * 신뢰도 계산
 *
 * @param faceRegion - 얼굴 영역
 * @param overallScore - 종합 점수
 * @returns 신뢰도 (0-1)
 */
function calculateConfidence(
  faceRegion: NormalizedRect | undefined,
  overallScore: number
): number {
  // 얼굴 영역이 없으면 신뢰도 낮음
  const baseConfidence = faceRegion ? 0.9 : 0.5;

  // 점수가 극단적이면 신뢰도 조정
  if (overallScore > 90 || overallScore < 20) {
    return baseConfidence * 0.9;
  }

  return baseConfidence;
}

/**
 * 피드백 생성
 *
 * @param cct - 색온도
 * @param lightingType - 조명 타입
 * @param zoneAnalysis - 존 분석 결과
 * @param shadowAnalysis - 그림자 분석 결과
 * @param overallScore - 종합 점수
 * @returns 피드백 메시지 배열
 */
function generateFeedback(
  cct: number,
  lightingType: CIE4Output['lightingType'],
  zoneAnalysis: CIE4Output['zoneAnalysis'],
  shadowAnalysis: CIE4Output['shadowAnalysis'],
  overallScore: number
): string[] {
  const feedback: string[] = [];

  // CCT 피드백
  if (lightingType === 'warm') {
    feedback.push('조명이 따뜻한 색상입니다. 자연광 또는 백색 조명 아래에서 촬영하면 더 정확한 분석이 가능합니다.');
  } else if (lightingType === 'cool') {
    feedback.push('조명이 차가운 색상입니다. 피부톤이 실제보다 푸르게 보일 수 있습니다.');
  } else if (lightingType === 'extreme') {
    feedback.push('조명 색온도가 분석에 적합하지 않습니다. 다른 환경에서 다시 촬영해주세요.');
  }

  // 균일성 피드백
  if (zoneAnalysis && zoneAnalysis.uniformity < 0.7) {
    feedback.push('얼굴에 조명이 고르게 분포되지 않았습니다. 정면에서 균일한 조명을 사용해주세요.');
  }

  // 그림자 피드백
  if (shadowAnalysis && shadowAnalysis.hasShadow) {
    feedback.push(shadowAnalysis.recommendation);
  }

  // 종합 피드백
  if (overallScore >= 80) {
    feedback.unshift('조명 상태가 좋습니다. 정확한 분석이 가능합니다.');
  } else if (overallScore >= 50) {
    feedback.unshift('조명 상태가 보통입니다. 가능하면 조명 환경을 개선해주세요.');
  } else {
    feedback.unshift('조명 상태가 좋지 않습니다. 분석 정확도가 낮을 수 있습니다.');
  }

  return feedback;
}

/**
 * 간단 조명 체크 (빠른 검증용)
 *
 * @param imageData - RGB 이미지 데이터
 * @returns 적합 여부
 */
export function quickLightingCheck(imageData: RGBImageData): boolean {
  const cct = estimateCCTFromImage(imageData);
  const type = classifyLightingType(cct);
  return type !== 'extreme' && evaluateCCTSuitability(cct) >= 50;
}
