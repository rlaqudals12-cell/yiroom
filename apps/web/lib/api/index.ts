// lib/api 공개 API

// 에러 응답
export {
  createErrorResponse,
  unauthorizedError,
  forbiddenError,
  notFoundError,
  badRequestError,
  validationError,
  rateLimitError,
  internalError,
  dbError,
  aiServiceError,
  analysisFailedError,
  dailyLimitError,
  imageQualityError,
  createSuccessResponse,
  emptySuccessResponse,
  isApiError,
} from './error-response';
export type {
  ApiErrorCode,
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiResponse,
} from './error-response';

// 분석 라우트 핸들러
export { createAnalysisRoute } from './analysis-route-handler';
export type { AnalysisRouteConfig } from './analysis-route-handler';

// 이미지 동의
export {
  checkImageConsent,
  uploadImageToStorage,
  checkConsentAndUploadImages,
} from './image-consent';
export type { AnalysisType, ImageConsentResult } from './image-consent';

// 이미지 품질
export {
  validateImageForAnalysis,
  imageQualityErrorResponse,
  logQualityResult,
} from './image-quality';
export type { ImageQualityError, ImageQualitySuccess, ImageQualityResult } from './image-quality';

// 이미지 파이프라인
export { runFullPipeline, computeHybridTrust } from './image-pipeline';
export type {
  PipelineMetadata,
  FullPipelineSuccess,
  FullPipelineFailure,
  FullPipelineResult,
  HybridTrustResult,
  FullPipelineOptions,
} from './image-pipeline';
