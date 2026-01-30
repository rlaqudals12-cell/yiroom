/**
 * Rate Limit 모듈 공개 API
 *
 * @module lib/rate-limit
 * @description API Rate Limiting (분당 + 일일 이중 한도)
 * @see SDD-RATE-LIMITING.md
 *
 * @example
 * ```typescript
 * // Middleware에서 사용
 * import { applyRateLimitMiddleware, addRateLimitHeaders } from '@/lib/rate-limit';
 *
 * const result = await applyRateLimitMiddleware(request, userId);
 * if (!result.allowed) {
 *   return result.response;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // API Route에서 직접 사용
 * import { checkRateLimitWithFallback, getRateLimitCategory, getIdentifier } from '@/lib/rate-limit';
 *
 * const category = getRateLimitCategory('/api/analyze/skin');
 * const identifier = getIdentifier(category, userId, ip);
 * const result = await checkRateLimitWithFallback(identifier, category);
 *
 * if (!result.success) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * ```
 */

// Middleware 헬퍼
export {
  applyRateLimitMiddleware,
  addRateLimitHeaders,
  type RateLimitMiddlewareResult,
} from './middleware';

// 핵심 함수
export {
  checkRateLimitWithFallback,
  getRateLimitCategory,
  getIdentifier,
  isRateLimitedPath,
  extractIpAddress,
  createRateLimitHeaders,
  clearMemoryStore,
  getMemoryStoreSize,
} from './fallback';

// Upstash 관련
export {
  isUpstashAvailable,
  testRedisConnection,
  UPSTASH_ENABLED,
} from './upstash';

// 모니터링
export {
  logRateLimitExceeded,
  logRateLimitUsage,
  logFallbackUsed,
} from './monitoring';

// 타입 re-export
export type {
  RateLimitCategory,
  RateLimitConfig,
  RateLimitResult,
  RateLimitErrorResponse,
  LimitExceededType,
  IdentifierType,
} from '@/types/rate-limit';

export { RATE_LIMIT_CONFIGS, RATE_LIMIT_HEADERS } from '@/types/rate-limit';
