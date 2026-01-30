/**
 * Shared Module - Cross-Module Integration
 * P8: lib/shared/ 공통 모듈
 *
 * @module lib/shared
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 *
 * CMP-A1: integration-types.ts - 연동 타입 정의
 * CMP-A2: integration-events.ts - 이벤트 발행 시스템
 * CMP-A3: integration-client.ts - 연동 클라이언트
 * CMP-A6: integration-error.ts - 에러 처리 모듈
 * 추가: confidence-propagation.ts - 신뢰도 전파 시스템
 */

// ============================================
// 연동 타입 (CMP-A1)
// ============================================
export type {
  SourceModule,
  TargetModule,
  IntegrationMetadata,
  PC2ToM1IntegrationData,
  PC2ToH1IntegrationData,
  S2ToSK1IntegrationData,
  S2ToM1IntegrationData,
  C2ToW2IntegrationData,
  OH1ToN1IntegrationData,
  CIE1ToAnalysisData,
  CIE2ToAnalysisData,
  CIE3ToAnalysisData,
  CIE4ToAnalysisData,
  IntegrationDataMap,
} from './integration-types';

export {
  DEFAULT_INTEGRATION_DATA,
  MODULE_DEPENDENCIES,
  MODULE_INTEGRATION_MAP,
} from './integration-types';

// ============================================
// 에러 처리 (CMP-A6)
// ============================================
export {
  INTEGRATION_ERROR_CODES,
  IntegrationError,
  IntegrationDataNotFoundError,
  IntegrationDataExpiredError,
  IntegrationSchemaMismatchError,
  IntegrationTimeoutError,
  IntegrationValidationError,
  handleIntegrationError,
  getUserMessage,
  getModuleDisplayName,
  isIntegrationError,
  hasErrorCode,
  isRetryableError,
  isUserFacingError,
  wrapError,
  USER_MESSAGES,
} from './integration-error';

export type {
  IntegrationErrorCode,
  IntegrationErrorContext,
  IntegrationResult,
  IntegrationResultFlags,
} from './integration-error';

// ============================================
// 이벤트 시스템 (CMP-A2)
// ============================================
export {
  INTEGRATION_EVENT_TYPES,
  CACHE_INVALIDATION_RULES,
  PUSH_NOTIFICATION_EVENTS,
  publishIntegrationEvent,
  publishAnalysisResultEvent,
  subscribeToEvent,
  clearAllHandlers,
  getEventTypeForModule,
  getEventHistory,
  clearEventHistory,
  recordEventHistory,
} from './integration-events';

export type {
  IntegrationEventType,
  IntegrationEvent,
  EventPublishResult,
} from './integration-events';

// ============================================
// 연동 클라이언트 (CMP-A3)
// ============================================
export {
  fetchIntegrationData,
  fetchPC2ForMakeup,
  fetchPC2ForHair,
  fetchS2ForProcedure,
  fetchS2ForMakeup,
  fetchC2ForStretching,
  fetchOH1ForNutrition,
  fetchMultipleIntegrationData,
  getDefaultIntegrationData,
  getTableName,
  invalidateCache,
  invalidateUserCache,
  getCacheStats,
  clearAllCache,
} from './integration-client';

export type {
  FetchOptions,
  CachedData,
  CacheStats,
  IntegrationDataType,
} from './integration-client';

// ============================================
// 신뢰도 전파 시스템
// ============================================
export {
  calculatePropagatedConfidence,
  calculateCIEConfidenceModifier,
  calculateWellnessConfidence,
  calculateTargetConfidence,
  validateProductRecommendationConfidence,
  applyConfidenceWeight,
  validateMinConfidenceThreshold,
  getConfidenceGrade,
  getConfidenceGradeLabel,
  getConfidenceDegradation,
  MODULE_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  CONFIDENCE_FLOW_GRAPH,
} from './confidence-propagation';

export type {
  ConfidenceSource,
  ConfidenceOptions,
  ConfidenceResult,
  ConfidenceGrade,
  AggregationMethod,
} from './confidence-propagation';
