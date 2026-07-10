/**
 * 네비게이션 모듈 공개 API
 *
 * @module lib/navigation
 * @description returnTo 체인 (가드 인터셉트 → 원 목적지 복귀) + 오픈 리다이렉트 방지
 */

export {
  RETURN_TO_PARAM,
  isSafeInternalPath,
  sanitizeReturnTo,
  withReturnTo,
  currentDestination,
  readReturnToFromLocation,
} from './return-to';
