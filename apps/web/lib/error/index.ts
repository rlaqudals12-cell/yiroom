/**
 * Error 모듈 통합 Export
 */

export {
  recordUserAction,
  captureErrorWithContext,
  captureApiError,
  captureAiError,
  captureDatabaseError,
  captureValidationError,
  captureNetworkError,
  captureUiError,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
} from './context';

export type { ErrorCategory, ErrorContext } from './context';
