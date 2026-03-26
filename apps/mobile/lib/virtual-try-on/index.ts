/**
 * 가상 메이크업 시뮬레이션 모듈
 * @module lib/virtual-try-on
 *
 * 립스틱, 블러셔 시뮬레이션을 제공하는 모듈.
 * MediaPipe 468 랜드마크 기반 얼굴 영역 감지 + 알파 블렌딩.
 *
 * @example
 * import { applyLipColor, LIP_PRESETS } from '@/lib/virtual-try-on';
 *
 * const result = await applyLipColor(imageEl, {
 *   type: 'lip',
 *   color: LIP_PRESETS[0].color,
 *   opacity: 0.55,
 * });
 */

export { applyLipColor } from './lip-engine';
export { applyBlush } from './blush-engine';
export { applyHairColor } from './hair-engine';
export { calculateEyeshadowPreview, interpolateDualColor } from './eyeshadow-engine';
export { calculateFoundationPreview, computeFoundationAlpha } from './foundation-engine';
export {
  rgbToLab,
  calculateDeltaE,
  calculateMatchScore,
  colorSimilarityScore,
  extractProductColor,
  seasonBonusScore,
  popularityScore,
  matchProductsByColor,
} from './product-matcher';
export {
  getLipPresetsForSeason,
  getBlushPresetsForSeason,
  getEyeshadowPresetsForSeason,
  getHairPresetsForSeason,
  getFoundationPresetsForSeason,
  getDefaultColorForSeason,
  SEASON_LABELS,
} from './season-presets';
export type { MakeupType, MakeupConfig, MakeupResult, RgbaColor } from './types';
export type { HairColorConfig, HairColorResult, EyeshadowConfig, FoundationConfig } from './types';
export { LIP_PRESETS, BLUSH_PRESETS, HAIR_PRESETS, EYESHADOW_PRESETS, FOUNDATION_PRESETS } from './types';
export type { EyeshadowResult } from './eyeshadow-engine';
export type { FoundationResult } from './foundation-engine';
export type { VTOMakeupType, LabColor, VTOMatchedProduct } from './product-matcher';
export type { PersonalColorSeason, SeasonPreset } from './season-presets';
