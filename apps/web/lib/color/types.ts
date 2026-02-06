/**
 * 색공간 타입 정의 (SSOT)
 *
 * @module lib/color/types
 * @description 색공간 변환에 사용되는 공통 타입 및 상수
 * @see docs/principles/color-science.md
 * @see docs/adr/ADR-066-ssot-consolidation-strategy.md
 */

// SSOT: integration-types.ts에서 재export
export type { LabColor, RGBColor, XYZColor } from '@/lib/shared/integration-types';

/** Lab 파생 지표 (채도, 색상각) */
export interface LabDerivedMetrics {
  chroma: number;
  hue: number;
}

/** CIEDE2000 가중치 옵션 */
export interface CIEDE2000Options {
  /** 명도 가중치 (기본값: 1) */
  kL?: number;
  /** 채도 가중치 (기본값: 1) */
  kC?: number;
  /** 색상 가중치 (기본값: 1) */
  kH?: number;
}

/**
 * D65 표준 조명 백색점 (CIE 1931, 정규화)
 *
 * XYZ 값은 0-1 범위 (Y=1.0 기준)
 * @see CIE 15:2004
 */
export const D65_WHITE = {
  X: 0.95047,
  Y: 1.0,
  Z: 1.08883,
} as const;

/**
 * Lab 변환 상수 (CIE 15:2004 정밀 분수)
 *
 * - epsilon = 216/24389 (정확히 (6/29)^3)
 * - kappa = 24389/27 (정확히 (29/3)^3)
 */
export const LAB_CONSTANTS = {
  epsilon: 216 / 24389,
  kappa: 24389 / 27,
} as const;

/**
 * sRGB ↔ XYZ 변환 행렬 (D65 기준)
 * IEC 61966-2-1:1999 표준
 */
export const SRGB_XYZ_MATRIX = {
  // RGB → XYZ (순방향)
  forward: [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.072175],
    [0.0193339, 0.119192, 0.9503041],
  ],
  // XYZ → RGB (역방향)
  inverse: [
    [3.2404542, -1.5371385, -0.4985314],
    [-0.969266, 1.8760108, 0.041556],
    [0.0556434, -0.2040259, 1.0572252],
  ],
} as const;
