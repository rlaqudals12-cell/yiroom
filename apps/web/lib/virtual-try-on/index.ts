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
export { applyEyeshadow } from './eyeshadow-engine';
export { applyFoundation } from './foundation-engine';
export type { MakeupType, MakeupConfig, MakeupResult, RgbaColor } from './types';
export type { HairColorConfig, HairColorResult } from './types';
export type { EyeshadowConfig, EyeshadowResult } from './types';
export type { FoundationConfig, FoundationResult } from './types';
export {
  LIP_PRESETS,
  BLUSH_PRESETS,
  HAIR_PRESETS,
  EYESHADOW_PRESETS,
  FOUNDATION_PRESETS,
} from './types';

// 시즌 프리셋 (퍼스널컬러 연동)
export type { PersonalColorSeason, SeasonPreset } from './season-presets';
export {
  getLipPresetsForSeason,
  getBlushPresetsForSeason,
  getEyeshadowPresetsForSeason,
  getHairPresetsForSeason,
  getFoundationPresetsForSeason,
  getDefaultColorForSeason,
  SEASON_LABELS,
} from './season-presets';
