/**
 * API 유틸리티 모듈
 *
 * @module lib/api
 */
export { checkRateLimit, incrementRateLimit, getRateLimitInfo } from './rate-limit';

// 통합 분석 HTTP 클라이언트 (웹 API 재사용) — ADR-102
export { requestIntegratedAnalysis, IntegratedApiError } from './integrated';
export type {
  IntegratedAnalysisInput,
  IntegratedAnalysisResult,
  PersonaProfile,
  AxisCode,
  AxisResult,
  AxisError,
  AxisData,
  SkinQuestionnaire,
  HairQuestionnaire,
  BodyQuestionnaire,
} from './integrated';
