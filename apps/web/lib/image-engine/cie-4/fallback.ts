/**
 * CIE-4: Fallback 데이터 생성
 *
 * @module lib/image-engine/cie-4/fallback
 * @description 에러/타임아웃 시 Mock 데이터 반환
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 */

import type { CIE4Output, LightingZoneAnalysis, ShadowAnalysis } from '../types';
import { D65_CCT } from '../constants';

/**
 * 기본 6존 분석 Fallback 결과
 */
export function generateZoneAnalysisFallback(): LightingZoneAnalysis {
  return {
    zones: [
      { name: 'forehead_left', brightness: 128, status: 'normal' },
      { name: 'forehead_right', brightness: 128, status: 'normal' },
      { name: 'cheek_left', brightness: 120, status: 'normal' },
      { name: 'cheek_right', brightness: 120, status: 'normal' },
      { name: 'chin_left', brightness: 110, status: 'normal' },
      { name: 'chin_right', brightness: 110, status: 'normal' },
    ],
    uniformity: 0.9,
    leftRightBalance: 1.0,
    verticalGradient: -0.05,
  };
}

/**
 * 기본 그림자 분석 Fallback 결과
 */
export function generateShadowAnalysisFallback(): ShadowAnalysis {
  return {
    hasShadow: false,
    direction: 'none',
    intensity: 0,
    severity: 'none',
    darkAreaRatio: 0,
    overexposedRatio: 0,
    recommendation: '조명 상태가 양호합니다.',
  };
}

/**
 * CIE-4 전체 Fallback 결과 생성
 *
 * @param processingTime - 처리 시간 (ms)
 * @returns CIE-4 Fallback 출력
 */
export function generateCIE4Fallback(processingTime = 0): CIE4Output {
  return {
    success: true,
    isSuitable: true,
    estimatedCCT: D65_CCT,
    lightingType: 'neutral',
    cctSuitability: 90,
    requiresCorrection: false,
    zoneAnalysis: null,
    shadowAnalysis: null,
    overallScore: 80,
    feedback: ['조명 분석을 완료하지 못했습니다. 기본값이 사용됩니다.'],
    metadata: {
      processingTime,
      hasFaceRegion: false,
      confidence: 0.5,
    },
  };
}

/**
 * 에러 상태 Fallback
 *
 * @param errorMessage - 에러 메시지
 * @param processingTime - 처리 시간
 * @returns 에러 상태 CIE-4 출력
 */
export function generateErrorCIE4Fallback(
  errorMessage: string,
  processingTime = 0
): CIE4Output {
  return {
    success: false,
    isSuitable: false,
    estimatedCCT: D65_CCT,
    lightingType: 'neutral',
    cctSuitability: 50,
    requiresCorrection: false,
    zoneAnalysis: null,
    shadowAnalysis: null,
    overallScore: 50,
    feedback: [`조명 분석 중 오류가 발생했습니다: ${errorMessage}`],
    metadata: {
      processingTime,
      hasFaceRegion: false,
      confidence: 0,
    },
  };
}

/**
 * 랜덤 Mock 데이터 생성 (테스트용)
 *
 * @returns 랜덤화된 CIE-4 출력
 */
export function generateRandomCIE4Mock(): CIE4Output {
  const cct = 4500 + Math.floor(Math.random() * 3500); // 4500K ~ 8000K
  const lightingTypes = ['warm', 'neutral', 'cool'] as const;
  const lightingType = lightingTypes[Math.floor(Math.random() * lightingTypes.length)];

  const uniformity = 0.6 + Math.random() * 0.4;
  const hasShadow = Math.random() > 0.7;

  return {
    success: true,
    isSuitable: Math.random() > 0.3,
    estimatedCCT: cct,
    lightingType,
    cctSuitability: Math.round(50 + Math.random() * 50),
    requiresCorrection: cct < 4500 || cct > 7500,
    zoneAnalysis: {
      zones: [
        { name: 'forehead_left', brightness: Math.round(100 + Math.random() * 80), status: 'normal' },
        { name: 'forehead_right', brightness: Math.round(100 + Math.random() * 80), status: 'normal' },
        { name: 'cheek_left', brightness: Math.round(90 + Math.random() * 70), status: 'normal' },
        { name: 'cheek_right', brightness: Math.round(90 + Math.random() * 70), status: 'normal' },
        { name: 'chin_left', brightness: Math.round(80 + Math.random() * 60), status: 'normal' },
        { name: 'chin_right', brightness: Math.round(80 + Math.random() * 60), status: 'normal' },
      ],
      uniformity,
      leftRightBalance: 0.85 + Math.random() * 0.15,
      verticalGradient: (Math.random() - 0.5) * 0.2,
    },
    shadowAnalysis: {
      hasShadow,
      direction: hasShadow
        ? (['left', 'right', 'top', 'bottom'] as const)[Math.floor(Math.random() * 4)]
        : 'none',
      intensity: hasShadow ? 0.1 + Math.random() * 0.4 : 0,
      severity: hasShadow
        ? (['mild', 'moderate'] as const)[Math.floor(Math.random() * 2)]
        : 'none',
      darkAreaRatio: Math.random() * 0.2,
      overexposedRatio: Math.random() * 0.1,
      recommendation: hasShadow
        ? '그림자가 감지되었습니다. 조명을 조절해주세요.'
        : '조명 상태가 양호합니다.',
    },
    overallScore: Math.round(60 + Math.random() * 40),
    feedback: ['테스트 데이터입니다.'],
    metadata: {
      processingTime: Math.random() * 200,
      hasFaceRegion: true,
      confidence: 0.7 + Math.random() * 0.3,
    },
  };
}

/**
 * 특정 조명 조건 Mock 생성
 *
 * @param condition - 조명 조건
 * @returns 조건에 맞는 CIE-4 출력
 */
export function generateConditionedCIE4Mock(
  condition: 'optimal' | 'warm_light' | 'cool_light' | 'harsh_shadow' | 'dark'
): CIE4Output {
  const configs: Record<typeof condition, Partial<CIE4Output>> = {
    optimal: {
      estimatedCCT: 6500,
      lightingType: 'neutral',
      cctSuitability: 95,
      overallScore: 90,
      isSuitable: true,
      requiresCorrection: false,
    },
    warm_light: {
      estimatedCCT: 3500,
      lightingType: 'warm',
      cctSuitability: 45,
      overallScore: 55,
      isSuitable: false,
      requiresCorrection: true,
    },
    cool_light: {
      estimatedCCT: 8500,
      lightingType: 'cool',
      cctSuitability: 40,
      overallScore: 50,
      isSuitable: false,
      requiresCorrection: true,
    },
    harsh_shadow: {
      estimatedCCT: 6000,
      lightingType: 'neutral',
      cctSuitability: 80,
      overallScore: 45,
      isSuitable: false,
    },
    dark: {
      estimatedCCT: 5500,
      lightingType: 'neutral',
      cctSuitability: 70,
      overallScore: 35,
      isSuitable: false,
    },
  };

  const base = generateCIE4Fallback();
  return {
    ...base,
    ...configs[condition],
    feedback: getFeedbackForCondition(condition),
  };
}

function getFeedbackForCondition(condition: string): string[] {
  const feedbackMap: Record<string, string[]> = {
    optimal: ['조명 상태가 매우 좋습니다.'],
    warm_light: ['조명이 따뜻한 색상입니다. 백색 조명 아래에서 촬영해주세요.'],
    cool_light: ['조명이 차가운 색상입니다. 피부톤이 실제보다 푸르게 보일 수 있습니다.'],
    harsh_shadow: ['강한 그림자가 감지되었습니다. 균일한 조명 환경에서 촬영해주세요.'],
    dark: ['조명이 부족합니다. 더 밝은 환경에서 촬영해주세요.'],
  };
  return feedbackMap[condition] || ['알 수 없는 조건입니다.'];
}
