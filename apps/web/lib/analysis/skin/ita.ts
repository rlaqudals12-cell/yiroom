/**
 * ITA (Individual Typology Angle) 피부톤 분석 모듈
 *
 * @module lib/analysis/skin/ita
 * @description Lab 색공간 기반 ITA 공식으로 피부톤 분류
 * @see {@link docs/principles/color-science.md} ITA 공식 원리
 */

/**
 * ITA 기반 피부톤 분류 레벨
 * 범위: Very Light (>55°) ~ Dark (≤-30°)
 */
export type SkinToneLevel =
  | 'very-light'
  | 'light'
  | 'intermediate'
  | 'tan'
  | 'brown'
  | 'dark';

/**
 * ITA 분류 임계값 (도 단위)
 * @see docs/principles/color-science.md
 */
export const ITA_THRESHOLDS = {
  VERY_LIGHT: 55,   // > 55°
  LIGHT: 41,        // 41° < ITA ≤ 55°
  INTERMEDIATE: 28, // 28° < ITA ≤ 41°
  TAN: 10,          // 10° < ITA ≤ 28°
  BROWN: -30,       // -30° < ITA ≤ 10°
  // DARK: ITA ≤ -30°
} as const;

/**
 * ITA (Individual Typology Angle) 계산
 *
 * 공식: ITA = arctan[(L* - 50) / b*] × (180/π)
 *
 * @param L - Lab 색공간의 L* 값 (명도, 0-100)
 * @param b - Lab 색공간의 b* 값 (황-청 축, -128 to +127)
 * @returns ITA 값 (도 단위, -90 ~ +90 범위)
 *
 * @example
 * // 밝은 피부 (L*=70, b*=15)
 * calculateITA(70, 15) // 약 53.13°
 *
 * // 어두운 피부 (L*=35, b*=20)
 * calculateITA(35, 20) // 약 -36.87°
 *
 * @see docs/principles/color-science.md#ita-공식
 */
export function calculateITA(L: number, b: number): number {
  // b가 0이면 arctan이 ±90° (수직선)
  // L > 50이면 +90°, L < 50이면 -90°, L = 50이면 0° (b=0일 때 특수 케이스)
  if (b === 0) {
    if (L > 50) return 90;
    if (L < 50) return -90;
    return 0; // L = 50, b = 0
  }

  // ITA = arctan[(L* - 50) / b*] × (180/π)
  const radians = Math.atan((L - 50) / b);
  const degrees = radians * (180 / Math.PI);

  return degrees;
}

/**
 * ITA 값을 기반으로 피부톤 분류
 *
 * 분류 기준 (docs/principles/color-science.md):
 * - Very Light: ITA > 55°
 * - Light: 41° < ITA ≤ 55°
 * - Intermediate: 28° < ITA ≤ 41°
 * - Tan: 10° < ITA ≤ 28°
 * - Brown: -30° < ITA ≤ 10°
 * - Dark: ITA ≤ -30°
 *
 * @param ita - ITA 값 (도 단위)
 * @returns 피부톤 분류 레벨
 *
 * @example
 * classifySkinToneByITA(60)  // 'very-light'
 * classifySkinToneByITA(45)  // 'light'
 * classifySkinToneByITA(35)  // 'intermediate'
 * classifySkinToneByITA(15)  // 'tan'
 * classifySkinToneByITA(0)   // 'brown'
 * classifySkinToneByITA(-40) // 'dark'
 */
export function classifySkinToneByITA(ita: number): SkinToneLevel {
  if (ita > ITA_THRESHOLDS.VERY_LIGHT) {
    return 'very-light';
  }
  if (ita > ITA_THRESHOLDS.LIGHT) {
    return 'light';
  }
  if (ita > ITA_THRESHOLDS.INTERMEDIATE) {
    return 'intermediate';
  }
  if (ita > ITA_THRESHOLDS.TAN) {
    return 'tan';
  }
  if (ita > ITA_THRESHOLDS.BROWN) {
    return 'brown';
  }
  return 'dark';
}

/**
 * ITA 분석 결과 인터페이스
 */
export interface ITAAnalysisResult {
  /** ITA 값 (도 단위) */
  ita: number;
  /** 피부톤 분류 */
  skinToneLevel: SkinToneLevel;
  /** 입력된 L* 값 */
  labL: number;
  /** 입력된 b* 값 */
  labB: number;
}

/**
 * Lab 색상값으로 ITA 분석 수행
 *
 * @param L - Lab 색공간의 L* 값
 * @param b - Lab 색공간의 b* 값
 * @returns ITA 분석 결과
 */
export function analyzeITA(L: number, b: number): ITAAnalysisResult {
  const ita = calculateITA(L, b);
  const skinToneLevel = classifySkinToneByITA(ita);

  return {
    ita,
    skinToneLevel,
    labL: L,
    labB: b,
  };
}
