/**
 * PC-2: 12-Tone Personal Color Module
 *
 * @module lib/analysis/personal-color
 * @description Lab 색공간 기반 12-Tone 퍼스널컬러 분류 시스템
 *
 * @example
 * import {
 *   classify12Tone,
 *   getSubtypeCharacteristics,
 *   generateTonePalette,
 *   getToneCompatibility,
 * } from "@/lib/analysis/personal-color";
 *
 * const result = classify12Tone({ lab: { L: 68, a: 10, b: 22 } });
 * // { tone: "true-spring", confidence: 85, ... }
 */

// Types
export type {
  LabColor,
  LabDerivedMetrics,
  Season,
  Undertone,
  Subtype,
  TwelveTone,
  TwelveToneResult,
  UndertoneResult,
  SubtypeCharacteristics,
  TonePalette,
  ColorInfo,
  ColorCompatibility,
  SkinMetrics,
} from './types';

export { KOREAN_ADJUSTMENTS, SEASON_SUBTYPES } from './types';

// Color Space Utilities (SSOT: lib/color)
export {
  rgbToLab,
  hexToLab,
  calculateDerivedMetrics,
  calculateChroma,
  calculateHue,
  calculateLabDistance,
  calculateCIEDE2000,
} from '@/lib/color';

export type { CIEDE2000Options } from '@/lib/color';

// Classification
export {
  classify12Tone,
  determineUndertone,
  determineSeason,
  determineSubtype,
  parseTwelveTone,
  composeTwelveTone,
  getReferenceLab,
  getKoreanName,
} from './classify';

// Characteristics
export { getSubtypeCharacteristics, getAllToneCharacteristics } from './characteristics';

// Palette
export { generateTonePalette, getToneCompatibility, getAllTonePalettes } from './palette';
