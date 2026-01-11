/**
 * 인메모리 Rate Limiter
 * - API 엔드포인트 보호
 * - IP 또는 userId 기반 요청 제한
 *
 * 프로덕션에서는 Redis 기반으로 업그레이드 권장
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// 인메모리 스토어 (서버리스 환경에서는 요청마다 리셋될 수 있음)
const rateLimitStore = new Map<string, RateLimitEntry>();

// 오래된 엔트리 정리 (메모리 누수 방지)
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 주기적 정리 (1분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 60 * 1000);
}

export interface RateLimitConfig {
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
  /** 윈도우 내 최대 요청 수 */
  maxRequests: number;
}

// 기본 설정 (분당 100회)
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분 (60초)
  maxRequests: 100,
};

// 엔드포인트별 설정
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // AI 분석 API (비용 높음) - 분당 10회
  '/api/analysis': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/gemini': { windowMs: 60 * 1000, maxRequests: 10 },
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 30 },

  // 인증 관련 - 분당 20회
  '/api/auth': { windowMs: 60 * 1000, maxRequests: 20 },

  // 피드백/리포트 - 분당 5회
  '/api/feedback': { windowMs: 60 * 1000, maxRequests: 5 },

  // 어필리에이트 - 분당 50회
  '/api/affiliate/click': { windowMs: 60 * 1000, maxRequests: 50 },
  '/api/affiliate/conversion': { windowMs: 60 * 1000, maxRequests: 50 },

  // 일반 API - 분당 100회
  default: { windowMs: 60 * 1000, maxRequests: 100 },
};

/**
 * Rate Limit 체크
 * @param identifier IP 주소 또는 사용자 ID
 * @param endpoint API 엔드포인트
 * @returns { success: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string
): { success: boolean; remaining: number; resetTime: number } {
  const config = getConfigForEndpoint(endpoint);
  const key = `${identifier}:${getEndpointKey(endpoint)}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // 새 엔트리 또는 윈도우 리셋
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // 기존 윈도우 내
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * 엔드포인트 키 정규화 (상세 경로 제거)
 */
function getEndpointKey(endpoint: string): string {
  // /api/analysis/skin/123 → /api/analysis
  const parts = endpoint.split('/').slice(0, 3);
  return parts.join('/');
}

/**
 * Rate Limit 헤더 생성
 */
export function getRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}

/**
 * Request에서 식별자 추출 (userId 우선, 없으면 IP)
 */
export function getIdentifier(request: NextRequest, userId?: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  // IP 주소 추출
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Rate Limit 결과 타입
 */
export interface RateLimitResult {
  success: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
}

/**
 * Rate Limit 미들웨어 래퍼
 * API 라우트에서 간편하게 사용
 *
 * @example
 * ```ts
 * const rateLimitResult = applyRateLimit(request, userId);
 * if (!rateLimitResult.success) {
 *   return rateLimitResult.response;
 * }
 * // 이후 정상 처리...
 * return NextResponse.json({ ... }, { headers: rateLimitResult.headers });
 * ```
 */
export function applyRateLimit(
  request: NextRequest,
  userId?: string | null,
  customConfig?: RateLimitConfig
): RateLimitResult {
  const identifier = getIdentifier(request, userId);
  const endpoint = new URL(request.url).pathname;

  // 커스텀 설정이 있으면 해당 엔드포인트 설정 덮어쓰기
  const config = customConfig || getConfigForEndpoint(endpoint);
  const { success, remaining, resetTime } = checkRateLimit(identifier, endpoint);

  const headers = getRateLimitHeaders(remaining, resetTime, config.maxRequests);

  if (!success) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    return {
      success: false,
      headers,
      response: NextResponse.json(
        {
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString(),
          },
        }
      ),
    };
  }

  return {
    success: true,
    headers,
  };
}

/**
 * 엔드포인트에 맞는 설정 가져오기 (export 추가)
 */
export function getConfigForEndpoint(endpoint: string): RateLimitConfig {
  // 정확한 매칭 먼저
  if (rateLimitConfigs[endpoint]) {
    return rateLimitConfigs[endpoint];
  }

  // 접두사 매칭
  for (const [prefix, config] of Object.entries(rateLimitConfigs)) {
    if (prefix !== 'default' && endpoint.startsWith(prefix)) {
      return config;
    }
  }

  return rateLimitConfigs.default || defaultConfig;
}
