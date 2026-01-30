/**
 * 인사이트 모듈 공개 API
 *
 * @module lib/insights
 * @description 크로스 모듈 인사이트 생성 및 관리
 *
 * @example
 * ```typescript
 * import {
 *   generateUserInsights,
 *   getAnalysisProgress,
 *   type Insight,
 * } from '@/lib/insights';
 *
 * // 사용자 인사이트 생성
 * const result = await generateUserInsights(supabase, userId, {
 *   maxInsights: 5,
 * });
 *
 * // 분석 진행률 확인
 * const progress = await getAnalysisProgress(supabase, userId);
 * ```
 *
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 */

// ============================================
// 타입 내보내기
// ============================================
export type {
  // 기본 타입
  AnalysisModule,
  InsightCategory,
  InsightPriority,
  // 인사이트 타입
  BaseInsight,
  Insight,
  ColorMatchInsight,
  SkinCareInsight,
  StyleTipInsight,
  ProductRecommendationInsight,
  HealthAlertInsight,
  RoutineSuggestionInsight,
  SynergyInsight,
  // 데이터 타입
  AnalysisDataBundle,
  PersonalColorData,
  SkinData,
  BodyData,
  FaceData,
  HairData,
  OralHealthData,
  // 옵션/결과 타입
  InsightGeneratorOptions,
  InsightGenerationResult,
} from './types';

// ============================================
// 점수 계산 유틸리티
// ============================================
export {
  getCategoryBaseScore,
  getModuleCountBonus,
  getConfidenceBonus,
  getCompletenessBonus,
  getFreshnessBonus,
  calculatePriorityScore,
  scoreToPriority,
  priorityToScoreRange,
  sortByPriorityScore,
  filterByMinScore,
} from './scoring';

// ============================================
// 인사이트 생성
// ============================================
export {
  generateInsights,
  generateInsightsByCategory,
  generateInsightsForModule,
} from './generator';

// ============================================
// 크로스 모듈 통합 (DB 연동)
// ============================================
export {
  // 데이터 조회
  fetchAnalysisDataBundle,
  // 진행률
  getAnalysisProgress,
  type AnalysisProgress,
  // 인사이트 생성 (DB 연동)
  generateUserInsights,
  generateModuleInsights,
  // 분석 순서 추천
  getRecommendedAnalysisOrder,
  // PC-1 이미지 재사용
  canReusePersonalColorImage,
} from './cross-module-insights';

// ============================================
// 어댑터 (UI ↔ 인사이트 변환)
// ============================================
export { analysisToDataBundle, calculateProgressFromFlags } from './adapters';
