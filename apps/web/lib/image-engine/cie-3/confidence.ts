/**
 * CIE-3: AWB 신뢰도 계산 모듈
 *
 * @module lib/image-engine/cie-3/confidence
 * @description 보정 전후 색상 통계 비교로 AWB 신뢰도 산출
 * @see docs/specs/SDD-CIE-3-AWB-CORRECTION.md
 *
 * 신뢰도 계산 기준:
 * - 색온도 보정량이 적절 범위(±1000K) 내: +30점
 * - 그레이월드 가정 충족도: +30점
 * - 색상 분포 정규화 정도: +40점
 */

import type { AWBGains, RGB } from '../types';

/**
 * 색상 통계 (보정 전후 비교용)
 */
export interface ColorStats {
  avgRGB: RGB;
  cct: number; // 색온도 (Kelvin)
  nonSkinRatio?: number; // 비피부 영역 비율 (0-1)
}

/**
 * 신뢰도 계산 상세 결과
 */
export interface ConfidenceDetails {
  total: number; // 최종 신뢰도 (0-1)
  gainScore: number; // 게인 범위 점수 (0-1)
  cctScore: number; // 색온도 차이 점수 (0-1)
  nonSkinScore: number; // 비피부 영역 점수 (0-1)
}

// AWB 신뢰도 계산 상수
const AWB_CONFIDENCE_CONFIG = {
  // 게인 범위 임계값
  gain: {
    optimalMin: 0.7,
    optimalMax: 1.5,
    acceptableMin: 0.5,
    acceptableMax: 2.0,
    optimalScore: 1.0,
    acceptableScore: 0.7,
    poorScore: 0.3,
  },
  // 색온도 차이 임계값
  cct: {
    excellent: 500, // <500K: 우수
    good: 1500, // <1500K: 양호
    acceptable: 3000, // <3000K: 수용 가능
    excellentScore: 1.0,
    goodScore: 0.8,
    acceptableScore: 0.6,
    poorScore: 0.4,
  },
  // 비피부 영역 임계값
  nonSkin: {
    sufficient: 0.3, // 30% 이상: 충분
    minimal: 0.1, // 10% 이상: 최소
    sufficientScore: 1.0,
    minimalScore: 0.7,
    insufficientScore: 0.4,
  },
  // 가중치
  weights: {
    gain: 0.4, // 40%
    cct: 0.3, // 30%
    nonSkin: 0.3, // 30%
  },
};

/**
 * 단일 게인 값의 범위 점수 계산
 *
 * @param gain - 개별 게인 값 (r, g, 또는 b)
 * @returns 게인 점수 (0-1)
 */
function calculateSingleGainScore(gain: number): number {
  const { optimalMin, optimalMax, acceptableMin, acceptableMax, optimalScore, acceptableScore, poorScore } =
    AWB_CONFIDENCE_CONFIG.gain;

  if (gain >= optimalMin && gain <= optimalMax) {
    return optimalScore;
  }
  if (gain >= acceptableMin && gain <= acceptableMax) {
    return acceptableScore;
  }
  return poorScore;
}

/**
 * 게인 범위 점수 계산
 *
 * 0.7 ~ 1.5 범위가 이상적
 *
 * @param gains - AWB 게인
 * @returns 게인 범위 점수 (0-1)
 */
export function calculateGainScore(gains: AWBGains): number {
  const rScore = calculateSingleGainScore(gains.r);
  const gScore = calculateSingleGainScore(gains.g);
  const bScore = calculateSingleGainScore(gains.b);

  return (rScore + gScore + bScore) / 3;
}

/**
 * 색온도 차이 점수 계산
 *
 * 목표 색온도(6500K)와의 차이가 작을수록 높은 점수
 *
 * @param originalCCT - 원본 색온도
 * @param targetCCT - 목표 색온도 (기본값: 6500K)
 * @returns 색온도 점수 (0-1)
 */
export function calculateCCTScore(originalCCT: number, targetCCT = 6500): number {
  const { excellent, good, acceptable, excellentScore, goodScore, acceptableScore, poorScore } =
    AWB_CONFIDENCE_CONFIG.cct;

  const cctDiff = Math.abs(originalCCT - targetCCT);

  if (cctDiff < excellent) return excellentScore;
  if (cctDiff < good) return goodScore;
  if (cctDiff < acceptable) return acceptableScore;
  return poorScore;
}

/**
 * 비피부 영역 점수 계산
 *
 * 비피부 영역이 충분해야 Gray World 가정이 유효
 *
 * @param nonSkinRatio - 비피부 영역 비율 (0-1)
 * @returns 비피부 영역 점수 (0-1)
 */
export function calculateNonSkinScore(nonSkinRatio: number): number {
  const { sufficient, minimal, sufficientScore, minimalScore, insufficientScore } = AWB_CONFIDENCE_CONFIG.nonSkin;

  if (nonSkinRatio >= sufficient) return sufficientScore;
  if (nonSkinRatio >= minimal) return minimalScore;
  return insufficientScore;
}

/**
 * AWB 신뢰도 계산 (상세 결과 포함)
 *
 * @param gains - AWB 게인
 * @param originalCCT - 원본 색온도
 * @param targetCCT - 목표 색온도
 * @param nonSkinRatio - 비피부 영역 비율
 * @returns 신뢰도 상세 결과
 */
export function calculateConfidenceDetails(
  gains: AWBGains,
  originalCCT: number,
  targetCCT: number,
  nonSkinRatio: number
): ConfidenceDetails {
  const gainScore = calculateGainScore(gains);
  const cctScore = calculateCCTScore(originalCCT, targetCCT);
  const nonSkinScore = calculateNonSkinScore(nonSkinRatio);

  const { weights } = AWB_CONFIDENCE_CONFIG;
  const total = gainScore * weights.gain + cctScore * weights.cct + nonSkinScore * weights.nonSkin;

  return {
    total,
    gainScore,
    cctScore,
    nonSkinScore,
  };
}

/**
 * AWB 신뢰도 계산 (메인 함수)
 *
 * CIE-3 보정 신뢰도 계산
 * - 게인 값의 적정 범위 (0.7 ~ 1.5가 이상적): 40%
 * - 원본 색온도와 목표의 차이: 30%
 * - 비피부 영역의 충분성: 30%
 *
 * @param gains - AWB 게인
 * @param originalCCT - 원본 색온도
 * @param targetCCT - 목표 색온도 (기본값: 6500K)
 * @param nonSkinRatio - 비피부 영역 비율 (기본값: 0.5)
 * @returns 신뢰도 (0-1)
 *
 * @example
 * const confidence = calculateConfidence(
 *   { r: 1.1, g: 1.0, b: 0.9 },
 *   5500, // original CCT
 *   6500, // target CCT
 *   0.5   // non-skin ratio
 * );
 * // confidence > 0.8
 */
export function calculateConfidence(
  gains: AWBGains,
  originalCCT: number,
  targetCCT = 6500,
  nonSkinRatio = 0.5
): number {
  return calculateConfidenceDetails(gains, originalCCT, targetCCT, nonSkinRatio).total;
}

/**
 * 보정 전후 색상 통계 기반 신뢰도 계산
 *
 * ColorStats 인터페이스를 사용하여 보정 전후 비교
 *
 * @param beforeStats - 보정 전 색상 통계
 * @param afterStats - 보정 후 색상 통계
 * @param targetCCT - 목표 색온도 (기본값: 6500K)
 * @returns 신뢰도 (0-1)
 */
export function calculateAWBConfidence(beforeStats: ColorStats, afterStats: ColorStats, targetCCT = 6500): number {
  // 게인 계산 (보정 전후 비율)
  const gains: AWBGains = {
    r: afterStats.avgRGB.r / Math.max(1, beforeStats.avgRGB.r),
    g: afterStats.avgRGB.g / Math.max(1, beforeStats.avgRGB.g),
    b: afterStats.avgRGB.b / Math.max(1, beforeStats.avgRGB.b),
  };

  // 비피부 영역 비율 (없으면 기본값 0.5)
  const nonSkinRatio = beforeStats.nonSkinRatio ?? afterStats.nonSkinRatio ?? 0.5;

  return calculateConfidence(gains, beforeStats.cct, targetCCT, nonSkinRatio);
}

/**
 * 메서드별 기본 신뢰도 반환
 *
 * 상세 계산이 불가능한 경우 사용
 *
 * @param method - AWB 방법
 * @returns 기본 신뢰도 (0-1)
 */
export function getMethodDefaultConfidence(method: 'gray_world' | 'von_kries' | 'skin_aware' | 'none'): number {
  switch (method) {
    case 'skin_aware':
      return 0.85;
    case 'von_kries':
      return 0.8;
    case 'gray_world':
      return 0.75;
    case 'none':
      return 0.9; // 보정 불필요한 경우
    default:
      return 0.7;
  }
}

/**
 * 폴백 시 신뢰도 조정
 *
 * 폴백 발생 시 신뢰도 감소
 *
 * @param baseConfidence - 기본 신뢰도
 * @param fallbackType - 폴백 유형
 * @returns 조정된 신뢰도 (0-1)
 */
export function adjustConfidenceForFallback(
  baseConfidence: number,
  fallbackType: 'cct_estimation_failed' | 'skin_mask_failed' | 'von_kries_failed' | 'clipping_detected'
): number {
  const adjustments: Record<string, number> = {
    cct_estimation_failed: -0.15,
    skin_mask_failed: -0.1,
    von_kries_failed: -0.2,
    clipping_detected: -0.1,
  };

  const adjustment = adjustments[fallbackType] ?? -0.1;
  return Math.max(0, baseConfidence + adjustment);
}
