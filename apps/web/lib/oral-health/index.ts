/**
 * OH-1 구강건강 분석 공개 API
 *
 * @module lib/oral-health
 * @description VITA 셰이드 시스템 기반 치아 색상 분석, 잇몸 건강 분석, 제품 추천
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 *
 * @example
 * import {
 *   analyzeToothColor,
 *   analyzeGumHealth,
 *   calculateWhiteningGoal,
 *   recommendOralProducts,
 * } from '@/lib/oral-health';
 *
 * // 치아 색상 분석
 * const toothResult = analyzeToothColor(labValues);
 *
 * // 잇몸 건강 분석
 * const gumResult = analyzeGumHealth(pixels);
 *
 * // 미백 목표 계산
 * const goal = calculateWhiteningGoal({
 *   currentShade: 'A2',
 *   personalColorSeason: 'spring',
 *   desiredLevel: 'moderate',
 * });
 */

// 치아 색상 분석
export { analyzeToothColor, generateToothColorSummary } from './tooth-color-analyzer';

// 잇몸 건강 분석
export {
  analyzeGumHealth,
  getGumHealthGrade,
  generateGumHealthSummary,
} from './gum-health-analyzer';

// 미백 목표 계산
export {
  calculateWhiteningGoal,
  trackWhiteningProgress,
  generateWhiteningPrecautions,
  generateWhiteningGoalSummary,
} from './whitening-goal-calculator';

// 제품 추천
export {
  recommendOralProducts,
  generateProductRecommendationSummary,
} from './product-recommender';

// Note: clearGeminiCache는 internal 함수이므로 export하지 않음 (P8 모듈 경계 원칙)
// 캐시 관리가 필요한 경우 별도 public API 설계 필요

// 공개 타입
export type {
  LabColor,
  RGBColor,
  VitaShade,
  VitaSeries,
  VitaShadeReference,
  ToothColorInput,
  ToothColorResult,
  GumHealthStatus,
  GumHealthMetrics,
  GumHealthInput,
  GumHealthResult,
  PersonalColorSeason,
  WhiteningGoalInput,
  WhiteningGoalResult,
  UserOralProfile,
  ProductPreferences,
  InterdentalRecommendation,
  OralProductRecommendation,
  OralHealthAssessment,
  OH1ToN1IntegrationData,
  OralHealthAnalysisRequest,
  OralHealthAnalysisResponse,
} from './types';
