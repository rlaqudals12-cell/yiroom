/**
 * 분석 API 조합형 헬퍼 공개 API (P8 Barrel Export)
 *
 * @module lib/api/analysis-helpers
 * @description 14개 분석 API 핸들러의 공통 6단계 파이프라인을 5개 독립 헬퍼로 분리.
 *              기존 route.ts는 수정하지 않으며, 새 분석 모듈부터 적용 (OCP).
 *
 * @see ADR-085 Analysis API Composable Helpers
 *
 * @example
 * import {
 *   withAnalysisAuth,
 *   withAIFallback,
 *   saveWithFallback,
 *   withGamification,
 *   uploadAnalysisImage,
 * } from '@/lib/api/analysis-helpers';
 */

// 인증 + Rate Limit
export { withAnalysisAuth } from './auth';

// AI 호출 + Mock 폴백
export { withAIFallback } from './ai-fallback';

// DB 저장 + 합성 응답 폴백
export { saveWithFallback } from './db-save';

// 게이미피케이션 (XP + 뱃지)
export { withGamification } from './gamification';

// 이미지 업로드
export { uploadAnalysisImage } from './image-upload';

// 공유 타입
export type {
  AuthOrError,
  AIFallbackResult,
  AIFallbackOptions,
  DBSaveResult,
  GamificationResult,
  AnalysisBadgeType,
} from './types';
