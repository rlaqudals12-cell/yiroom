/**
 * CIE-4: 그림자 감지 모듈
 *
 * @module lib/image-engine/cie-4/shadow-detector
 * @description 얼굴의 그림자 패턴 분석
 * @see docs/specs/SDD-CIE-4-LIGHTING-ANALYSIS.md
 */

import type { RGBImageData, NormalizedRect, ShadowAnalysis } from '../types';
import { analyzeZoneBrightness } from './zone-analyzer';

/**
 * 그림자 임계값 설정
 */
export const SHADOW_THRESHOLDS = {
  /** 어두운 영역 판정 밝기 */
  darkThreshold: 80,
  /** 밝은 영역 판정 밝기 */
  brightThreshold: 180,
  /** 좌우 비대칭 경고 임계값 */
  asymmetryWarning: 0.15,
  /** 좌우 비대칭 심각 임계값 */
  asymmetrySevere: 0.25,
};

/**
 * 그림자 방향 감지
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 그림자 방향
 */
export function detectShadowDirection(
  zoneBrightness: number[]
): 'left' | 'right' | 'top' | 'bottom' | 'none' {
  if (zoneBrightness.length !== 6) return 'none';

  const leftAvg = (zoneBrightness[0] + zoneBrightness[2] + zoneBrightness[4]) / 3;
  const rightAvg = (zoneBrightness[1] + zoneBrightness[3] + zoneBrightness[5]) / 3;
  const topAvg = (zoneBrightness[0] + zoneBrightness[1]) / 2;
  const bottomAvg = (zoneBrightness[4] + zoneBrightness[5]) / 2;

  const lrDiff = Math.abs(leftAvg - rightAvg);
  const tbDiff = Math.abs(topAvg - bottomAvg);

  const threshold = 20; // 20 밝기 차이 이상이면 그림자 있음

  if (lrDiff < threshold && tbDiff < threshold) {
    return 'none';
  }

  if (lrDiff > tbDiff) {
    return leftAvg < rightAvg ? 'left' : 'right';
  } else {
    return topAvg < bottomAvg ? 'top' : 'bottom';
  }
}

/**
 * 그림자 강도 계산
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 그림자 강도 (0-1)
 */
export function calculateShadowIntensity(zoneBrightness: number[]): number {
  if (zoneBrightness.length === 0) return 0;

  const max = Math.max(...zoneBrightness);
  const min = Math.min(...zoneBrightness);

  if (max === 0) return 0;

  // 명암비 기반 강도
  const contrast = (max - min) / max;
  return Math.min(1, contrast);
}

/**
 * 어두운 영역 비율 계산
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 어두운 영역 비율 (0-1)
 */
export function calculateDarkAreaRatio(zoneBrightness: number[]): number {
  if (zoneBrightness.length === 0) return 0;

  const darkCount = zoneBrightness.filter(
    (b) => b < SHADOW_THRESHOLDS.darkThreshold
  ).length;

  return darkCount / zoneBrightness.length;
}

/**
 * 과노출 영역 비율 계산
 *
 * @param zoneBrightness - 6존 밝기 배열
 * @returns 과노출 영역 비율 (0-1)
 */
export function calculateOverexposedRatio(zoneBrightness: number[]): number {
  if (zoneBrightness.length === 0) return 0;

  const brightCount = zoneBrightness.filter(
    (b) => b > SHADOW_THRESHOLDS.brightThreshold
  ).length;

  return brightCount / zoneBrightness.length;
}

/**
 * 종합 그림자 분석
 *
 * @param imageData - RGB 이미지 데이터
 * @param faceRegion - 얼굴 영역
 * @returns 그림자 분석 결과
 */
export function performShadowAnalysis(
  imageData: RGBImageData,
  faceRegion: NormalizedRect
): ShadowAnalysis {
  const zoneBrightness = analyzeZoneBrightness(imageData, faceRegion);

  const direction = detectShadowDirection(zoneBrightness);
  const intensity = calculateShadowIntensity(zoneBrightness);
  const darkAreaRatio = calculateDarkAreaRatio(zoneBrightness);
  const overexposedRatio = calculateOverexposedRatio(zoneBrightness);

  // 그림자 있음 판정
  const hasShadow = direction !== 'none' && intensity > 0.2;

  // 그림자 문제 심각도
  const severity = calculateShadowSeverity(intensity, darkAreaRatio, overexposedRatio);

  return {
    hasShadow,
    direction,
    intensity,
    severity,
    darkAreaRatio,
    overexposedRatio,
    recommendation: generateShadowRecommendation(direction, severity),
  };
}

/**
 * 그림자 심각도 계산
 *
 * @param intensity - 그림자 강도
 * @param darkRatio - 어두운 영역 비율
 * @param overexposedRatio - 과노출 비율
 * @returns 심각도
 */
function calculateShadowSeverity(
  intensity: number,
  darkRatio: number,
  overexposedRatio: number
): 'none' | 'mild' | 'moderate' | 'severe' {
  const score = intensity * 0.5 + darkRatio * 0.3 + overexposedRatio * 0.2;

  if (score < 0.1) return 'none';
  if (score < 0.25) return 'mild';
  if (score < 0.4) return 'moderate';
  return 'severe';
}

/**
 * 그림자 개선 권장사항 생성
 *
 * @param direction - 그림자 방향
 * @param severity - 심각도
 * @returns 권장사항
 */
function generateShadowRecommendation(
  direction: ShadowAnalysis['direction'],
  severity: ShadowAnalysis['severity']
): string {
  if (severity === 'none') {
    return '조명 상태가 양호합니다.';
  }

  const directionTips: Record<string, string> = {
    left: '오른쪽에서 추가 조명을 사용해보세요.',
    right: '왼쪽에서 추가 조명을 사용해보세요.',
    top: '아래에서 반사판이나 조명을 사용해보세요.',
    bottom: '정면 또는 위쪽 조명을 조절해보세요.',
    none: '균일한 조명으로 조절해보세요.',
  };

  const severityPrefix: Record<string, string> = {
    mild: '약간의 그림자가 감지되었습니다. ',
    moderate: '그림자가 있습니다. ',
    severe: '강한 그림자가 있어 분석 정확도에 영향을 줄 수 있습니다. ',
  };

  return severityPrefix[severity] + directionTips[direction];
}

/**
 * 그림자 없음 점수 (0-100)
 *
 * @param shadowAnalysis - 그림자 분석 결과
 * @returns 점수 (높을수록 그림자 없음)
 */
export function shadowToScore(shadowAnalysis: ShadowAnalysis): number {
  if (!shadowAnalysis.hasShadow) return 100;

  const severityScores: Record<ShadowAnalysis['severity'], number> = {
    none: 100,
    mild: 80,
    moderate: 50,
    severe: 20,
  };

  const baseScore = severityScores[shadowAnalysis.severity];

  // 어두운 영역과 과노출 영역 페널티
  const penalty = (shadowAnalysis.darkAreaRatio + shadowAnalysis.overexposedRatio) * 20;

  return Math.max(0, Math.round(baseScore - penalty));
}
