/**
 * Rate Limiter 핵심 구현
 *
 * @description 분당 + 일일 이중 한도 Rate Limiting
 * @see SDD-RATE-LIMITING.md
 */

import {
  RateLimitCategory,
  RateLimitResult,
  RATE_LIMIT_CONFIGS,
  RATE_LIMIT_HEADERS,
} from '@/types/rate-limit';
import { getMinuteLimiter, getDailyLimiter, isUpstashAvailable } from './upstash';

/**
 * 경로에서 Rate Limit 카테고리 추출
 *
 * @param pathname URL 경로
 * @returns Rate Limit 카테고리
 */
export function getRateLimitCategory(pathname: string): RateLimitCategory {
  // 정규식 매칭으로 카테고리 결정
  if (/^\/api\/(analyze|gemini)/.test(pathname)) return 'analyze';
  if (/^\/api\/auth/.test(pathname)) return 'auth';
  if (/^\/api\/upload/.test(pathname)) return 'upload';
  if (/^\/api\/(coach|chat)/.test(pathname)) return 'coach';
  if (/^\/api\/feedback/.test(pathname)) return 'feedback';
  if (/^\/api\/nutrition/.test(pathname)) return 'nutrition';
  if (/^\/api\/workout/.test(pathname)) return 'workout';
  if (/^\/api\/affiliate/.test(pathname)) return 'affiliate';

  return 'default';
}

/**
 * 식별자 결정
 *
 * @param category Rate Limit 카테고리
 * @param userId 사용자 ID (로그인 시)
 * @param ip IP 주소
 * @returns 식별자 문자열
 */
export function getIdentifier(
  category: RateLimitCategory,
  userId: string | null,
  ip: string
): string {
  const config = RATE_LIMIT_CONFIGS[category];

  // auth 카테고리는 항상 IP 기반
  if (config.identifier === 'ip') {
    return `ip:${ip}`;
  }

  // userId가 있으면 userId 사용, 없으면 IP fallback
  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Rate Limit 헤더 생성
 *
 * @param result Rate Limit 검사 결과
 * @param usedFallback Fallback 사용 여부
 */
export function createRateLimitHeaders(
  result: Omit<RateLimitResult, 'headers' | 'success'>,
  usedFallback = false
): Record<string, string> {
  const headers: Record<string, string> = {
    [RATE_LIMIT_HEADERS.LIMIT_MINUTE]: result.minuteLimit.toString(),
    [RATE_LIMIT_HEADERS.REMAINING_MINUTE]: result.minuteRemaining.toString(),
    [RATE_LIMIT_HEADERS.LIMIT_DAY]: result.dailyLimit.toString(),
    [RATE_LIMIT_HEADERS.REMAINING_DAY]: result.dailyRemaining.toString(),
    [RATE_LIMIT_HEADERS.RESET]: Math.ceil(
      Math.max(result.resetMinute, result.resetDaily) / 1000
    ).toString(),
  };

  if (usedFallback) {
    headers[RATE_LIMIT_HEADERS.FALLBACK] = 'true';
  }

  return headers;
}

/**
 * Upstash Redis를 통한 Rate Limit 검사
 *
 * @param identifier 식별자
 * @param category Rate Limit 카테고리
 * @returns Rate Limit 결과 또는 null (Redis 실패 시)
 */
async function checkRateLimitRedis(
  identifier: string,
  category: RateLimitCategory
): Promise<RateLimitResult | null> {
  if (!isUpstashAvailable()) {
    return null;
  }

  const config = RATE_LIMIT_CONFIGS[category];
  const minuteLimiter = getMinuteLimiter(category, config.minuteLimit);
  const dailyLimiter = getDailyLimiter(category, config.dailyLimit);

  if (!minuteLimiter || !dailyLimiter) {
    return null;
  }

  try {
    // 분당, 일일 한도 동시 검사
    const [minuteResult, dailyResult] = await Promise.all([
      minuteLimiter.limit(identifier),
      dailyLimiter.limit(identifier),
    ]);

    const success = minuteResult.success && dailyResult.success;

    const result: Omit<RateLimitResult, 'headers'> = {
      success,
      minuteLimit: config.minuteLimit,
      minuteRemaining: minuteResult.remaining,
      dailyLimit: config.dailyLimit,
      dailyRemaining: dailyResult.remaining,
      resetMinute: minuteResult.reset,
      resetDaily: dailyResult.reset,
      usedFallback: false,
    };

    return {
      ...result,
      headers: createRateLimitHeaders(result, false),
    };
  } catch (error) {
    console.error('[RateLimit] Redis check failed:', error);
    return null;
  }
}

/**
 * Rate Limit 검사 (Redis 우선, 실패 시 null 반환)
 *
 * @param identifier 식별자 (user:xxx 또는 ip:xxx)
 * @param category Rate Limit 카테고리
 * @returns Rate Limit 결과 또는 null
 */
export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'default'
): Promise<RateLimitResult | null> {
  return checkRateLimitRedis(identifier, category);
}

/**
 * Rate Limit이 필요한 경로인지 확인
 *
 * @param pathname URL 경로
 */
export function isRateLimitedPath(pathname: string): boolean {
  // API 경로만 Rate Limit 적용
  if (!pathname.startsWith('/api')) {
    return false;
  }

  // 제외 경로 (웹훅 등)
  const excludedPaths = [
    '/api/webhooks',
    '/api/cron',
    '/api/health',
  ];

  return !excludedPaths.some((excluded) => pathname.startsWith(excluded));
}

/**
 * IP 주소 추출
 *
 * @param request Next.js Request 객체
 */
export function extractIpAddress(request: Request): string {
  // Vercel/Cloudflare 헤더 우선
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  return (
    cfConnectingIp ||
    forwardedFor?.split(',')[0]?.trim() ||
    realIp ||
    'unknown'
  );
}
