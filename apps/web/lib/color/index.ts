/**
 * 색공간 변환 통합 모듈 (Color Module)
 *
 * 7개 독립 색공간 변환 구현을 CIE 15:2004 정밀 상수 기반 단일 모듈로 통합
 *
 * @module lib/color
 * @see docs/adr/ADR-066-ssot-consolidation-strategy.md
 * @see docs/principles/color-science.md
 *
 * @example
 * import { rgbToLab, calculateCIEDE2000, calculateChroma } from '@/lib/color';
 *
 * // 개별 파라미터
 * const lab1 = rgbToLab(245, 220, 200);
 *
 * // RGBColor 객체
 * const lab2 = rgbToLab({ r: 200, g: 180, b: 160 });
 *
 * // CIEDE2000 색차
 * const deltaE = calculateCIEDE2000(lab1, lab2);
 *
 * // 파생 지표
 * const chroma = calculateChroma(lab1);
 */

// 타입 (SSOT: integration-types.ts)
export type { LabColor, RGBColor, XYZColor, LabDerivedMetrics, CIEDE2000Options } from './types';

// 상수
export { D65_WHITE, LAB_CONSTANTS, SRGB_XYZ_MATRIX } from './types';

// 변환 함수
export {
  rgbToXyz,
  xyzToRgb,
  xyzToLab,
  labToXyz,
  rgbToLab,
  labToRgb,
  hexToRgb,
  rgbToHex,
  hexToLab,
  labToHex,
  calculateChroma,
  calculateHue,
  calculateDerivedMetrics,
  calculateITA,
} from './conversions';

// 색차 계산
export { calculateLabDistance, calculateCIEDE2000 } from './ciede2000';
