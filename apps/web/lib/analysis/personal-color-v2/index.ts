/**
 * PC-2: 퍼스널컬러 v2 모듈 (Lab 12톤 시스템)
 *
 * @module lib/analysis/personal-color-v2
 * @description Lab 색공간 기반 12톤 퍼스널컬러 분석 시스템
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 * @see docs/principles/color-science.md
 *
 * @example
 * // 기본 사용법
 * import {
 *   classifyTone,
 *   rgbToLab,
 *   generateMockResult,
 * } from '@/lib/analysis/personal-color-v2';
 *
 * const lab = rgbToLab(245, 220, 200);
 * const result = classifyTone(lab);
 * console.log(result.tone); // 'true-spring'
 */

// ============================================
// Types (공개 타입)
// ============================================

export type {
  LabColor,
  RGBColor,
  XYZColor,
  Season,
  Subtype,
  TwelveTone,
  Undertone,
  HarmonyType,
  TwelveToneClassificationResult,
  TonePalette,
  PersonalColorV2Input,
  PersonalColorV2Result,
} from './types';

export {
  KOREAN_ADJUSTMENTS,
  TWELVE_TONE_REFERENCE_LAB,
  SEASON_DESCRIPTIONS,
  TWELVE_TONE_LABELS,
} from './types';

// ============================================
// Lab 유틸리티
// ============================================

export {
  // RGB <-> Lab 변환
  rgbToLab,
  labToRgb,
  // HEX <-> Lab 변환
  hexToLab,
  labToHex,
  // Lab 파생 지표
  calculateChroma,
  calculateHue,
  calculateITA,
  // 색차 계산
  calculateLabDistance,
  calculateCIEDE2000,
} from './lab-utils';

// ============================================
// 12톤 분류
// ============================================

export {
  // 메인 분류 함수
  classifyTone,
  // 단계별 판정 함수
  determineUndertone,
  determineSeason,
  determineSubtype,
  // 톤 조합/분해
  composeTwelveTone,
  parseTwelveTone,
  // 점수 계산
  calculateToneScores,
  // 보조 함수
  getReferenceLab,
  classifySkinBrightness,
  calculateToneSimilarity,
  getAdjacentTones,
} from './tone-classifier';

// ============================================
// Mock 데이터 (Fallback용)
// ============================================

export {
  // Mock 결과 생성
  generateMockResult,
  generateMockClassification,
  // 팔레트 조회
  getTonePalette,
  getToneLabel,
  // 팔레트 상수
  TONE_PALETTES,
} from './mock';

// ============================================
// Gemini 프롬프트
// ============================================

export {
  // 시스템 프롬프트
  PERSONAL_COLOR_SYSTEM_PROMPT,
  // 프롬프트 생성 함수
  generateAnalysisPrompt,
  generateDrapingPrompt,
  generateMakeupRecommendationPrompt,
  generateStylingRecommendationPrompt,
  // JSON 유틸리티
  extractJsonFromResponse,
  validateToneValue,
  validateLabRange,
  validateAnalysisResult,
} from './prompts';
