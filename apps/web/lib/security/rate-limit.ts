/**
 * Rate Limiter with Daily Limits
 * - API 엔드포인트 보호
 * - IP 또는 userId 기반 요청 제한
 * - 분당 제한 + 일일 제한 이중 체크
 * - Upstash Redis 지원 (환경변수 설정 시)
 * - 인메모리 Fallback (Redis 실패 또는 미설정 시)
 *
 * @see SDD-RATE-LIMITING.md
 */

import { NextRequest, NextResponse } from 'next/server';

// Upstash Redis 동적 import 타입 (any로 처리하여 패키지 미설치 시에도 컴파일 가능)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RedisRateLimit: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Redis: any = null;

// Upstash 사용 가능 여부 체크
const UPSTASH_ENABLED =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// 동적 import 시도 (빌드 타임에 실패해도 무시)
if (UPSTASH_ENABLED) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const upstashRatelimit = require('@upstash/ratelimit');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const upstashRedis = require('@upstash/redis');
    RedisRateLimit = upstashRatelimit.Ratelimit;
    Redis = upstashRedis.Redis;
  } catch {
    // Upstash 패키지 미설치 - 인메모리 폴백 사용
    console.warn('[RateLimit] Upstash packages not found, using in-memory fallback');
  }
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface DailyLimitEntry {
  count: number;
  resetTime: number; // 자정 UTC 기준 리셋
}

// 인메모리 스토어 (서버리스 환경에서는 요청마다 리셋될 수 있음)
const rateLimitStore = new Map<string, RateLimitEntry>();
const dailyLimitStore = new Map<string, DailyLimitEntry>();

// Upstash Redis 인스턴스 (지연 초기화)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dailyRateLimiter: any = null;

function getRedisClient() {
  if (!UPSTASH_ENABLED || !Redis) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisClient;
}

function getDailyRateLimiter() {
  if (!UPSTASH_ENABLED || !RedisRateLimit || !Redis) return null;
  if (!dailyRateLimiter) {
    const redis = getRedisClient();
    if (redis) {
      dailyRateLimiter = new RedisRateLimit({
        redis,
        limiter: RedisRateLimit.slidingWindow(50, '24 h'),
        analytics: true,
        prefix: 'yiroom:daily',
      });
    }
  }
  return dailyRateLimiter;
}

// 오래된 엔트리 정리 (메모리 누수 방지)
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
  for (const [key, entry] of dailyLimitStore.entries()) {
    if (now > entry.resetTime) {
      dailyLimitStore.delete(key);
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
  /** 일일 최대 요청 수 (선택, 미설정 시 일일 제한 없음) */
  dailyMaxRequests?: number;
}

// 24시간 (밀리초)
const DAY_MS = 24 * 60 * 60 * 1000;

// 기본 설정 (분당 100회, 일일 제한 없음)
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분 (60초)
  maxRequests: 100,
};

// 엔드포인트별 설정
// AI 분석 API: 분당 10회 + 일일 50회 (스펙 기준)
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // AI 분석 API (비용 높음) - 분당 10회, 일일 50회
  '/api/analyze': { windowMs: 60 * 1000, maxRequests: 10, dailyMaxRequests: 50 },
  '/api/gemini': { windowMs: 60 * 1000, maxRequests: 10, dailyMaxRequests: 50 },
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 30, dailyMaxRequests: 200 },
  '/api/coach': { windowMs: 60 * 1000, maxRequests: 30, dailyMaxRequests: 200 },

  // 영양/운동 API - 분당 30회
  '/api/nutrition': { windowMs: 60 * 1000, maxRequests: 30 },
  '/api/workout': { windowMs: 60 * 1000, maxRequests: 30 },

  // 인증 관련 - 분당 20회
  '/api/auth': { windowMs: 60 * 1000, maxRequests: 20 },

  // 피드백/리포트 - 분당 5회
  '/api/feedback': { windowMs: 60 * 1000, maxRequests: 5 },

  // 어필리에이트 - 분당 50회
  '/api/affiliate/click': { windowMs: 60 * 1000, maxRequests: 50 },
  '/api/affiliate/conversion': { windowMs: 60 * 1000, maxRequests: 50 },

  // 일반 API - 분당 100회 (일일 제한 없음)
  default: { windowMs: 60 * 1000, maxRequests: 100 },
};

/**
 * 다음 자정 (UTC) 시간 계산
 */
function getNextMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.getTime();
}

/**
 * 일일 한도 체크 (인메모리)
 */
function checkDailyLimitInMemory(
  identifier: string,
  endpoint: string,
  dailyMax: number
): { success: boolean; remaining: number; resetTime: number } {
  const key = `daily:${identifier}:${getEndpointKey(endpoint)}`;
  const now = Date.now();

  let entry = dailyLimitStore.get(key);

  // 새 엔트리 또는 일일 리셋
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: getNextMidnightUTC(),
    };
    dailyLimitStore.set(key, entry);
    return {
      success: true,
      remaining: dailyMax - 1,
      resetTime: entry.resetTime,
    };
  }

  // 기존 일일 윈도우 내
  entry.count++;
  dailyLimitStore.set(key, entry);

  const remaining = Math.max(0, dailyMax - entry.count);
  const success = entry.count <= dailyMax;

  return {
    success,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * 일일 한도 체크 (Upstash Redis 사용 가능 시)
 */
async function checkDailyLimitRedis(
  identifier: string
): Promise<{ success: boolean; remaining: number; resetTime: number } | null> {
  const limiter = getDailyRateLimiter();
  if (!limiter) return null;

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  } catch (error) {
    console.error('[RateLimit] Redis daily limit check failed:', error);
    return null; // 폴백으로 인메모리 사용
  }
}

/**
 * Rate Limit 체크 (분당 + 일일)
 * @param identifier IP 주소 또는 사용자 ID
 * @param endpoint API 엔드포인트
 * @returns { success: boolean, remaining: number, resetTime: number, dailyRemaining?: number }
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string
): { success: boolean; remaining: number; resetTime: number; dailyRemaining?: number; dailyResetTime?: number } {
  const config = getConfigForEndpoint(endpoint);
  const key = `${identifier}:${getEndpointKey(endpoint)}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // 분당 제한 체크
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  } else {
    entry.count++;
    rateLimitStore.set(key, entry);
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const minuteSuccess = entry.count <= config.maxRequests;

  // 일일 제한이 없으면 분당 제한만 반환
  if (!config.dailyMaxRequests) {
    return {
      success: minuteSuccess,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  // 일일 제한 체크 (인메모리 - 동기)
  const dailyResult = checkDailyLimitInMemory(
    identifier,
    endpoint,
    config.dailyMaxRequests
  );

  return {
    success: minuteSuccess && dailyResult.success,
    remaining,
    resetTime: entry.resetTime,
    dailyRemaining: dailyResult.remaining,
    dailyResetTime: dailyResult.resetTime,
  };
}

/**
 * Rate Limit 체크 (비동기 - Redis 일일 한도 지원)
 * Redis가 설정되어 있으면 Redis 사용, 아니면 인메모리 폴백
 */
export async function checkRateLimitAsync(
  identifier: string,
  endpoint: string
): Promise<{ success: boolean; remaining: number; resetTime: number; dailyRemaining?: number; dailyResetTime?: number }> {
  const config = getConfigForEndpoint(endpoint);
  const key = `${identifier}:${getEndpointKey(endpoint)}`;
  const now = Date.now();

  // 분당 제한 체크 (인메모리)
  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  } else {
    entry.count++;
    rateLimitStore.set(key, entry);
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const minuteSuccess = entry.count <= config.maxRequests;

  // 일일 제한이 없으면 분당 제한만 반환
  if (!config.dailyMaxRequests) {
    return {
      success: minuteSuccess,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  // 일일 제한 체크 (Redis 시도 → 인메모리 폴백)
  let dailyResult = await checkDailyLimitRedis(identifier);
  if (!dailyResult) {
    // Redis 실패 또는 미설정 - 인메모리 폴백
    dailyResult = checkDailyLimitInMemory(
      identifier,
      endpoint,
      config.dailyMaxRequests
    );
  }

  return {
    success: minuteSuccess && dailyResult.success,
    remaining,
    resetTime: entry.resetTime,
    dailyRemaining: dailyResult.remaining,
    dailyResetTime: dailyResult.resetTime,
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
  limit: number,
  dailyRemaining?: number,
  dailyLimit?: number,
  dailyResetTime?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };

  // 일일 한도 헤더 추가
  if (dailyLimit !== undefined && dailyRemaining !== undefined) {
    headers['X-RateLimit-Daily-Limit'] = dailyLimit.toString();
    headers['X-RateLimit-Daily-Remaining'] = dailyRemaining.toString();
    if (dailyResetTime) {
      headers['X-RateLimit-Daily-Reset'] = Math.ceil(dailyResetTime / 1000).toString();
    }
  }

  return headers;
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
 * Rate Limit 미들웨어 래퍼 (동기 - 인메모리)
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
  const { success, remaining, resetTime, dailyRemaining, dailyResetTime } =
    checkRateLimit(identifier, endpoint);

  const headers = getRateLimitHeaders(
    remaining,
    resetTime,
    config.maxRequests,
    dailyRemaining,
    config.dailyMaxRequests,
    dailyResetTime
  );

  if (!success) {
    // 일일 한도 초과인지 분당 한도 초과인지 구분
    const isDailyExceeded = dailyRemaining !== undefined && dailyRemaining <= 0;
    const retryAfter = isDailyExceeded && dailyResetTime
      ? Math.ceil((dailyResetTime - Date.now()) / 1000)
      : Math.ceil((resetTime - Date.now()) / 1000);

    const errorMessage = isDailyExceeded
      ? '일일 요청 한도를 초과했습니다. 내일 다시 시도해주세요.'
      : '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

    const errorCode = isDailyExceeded ? 'DAILY_LIMIT_EXCEEDED' : 'RATE_LIMIT_EXCEEDED';

    return {
      success: false,
      headers,
      response: NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
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
 * Rate Limit 미들웨어 래퍼 (비동기 - Redis 지원)
 * Redis가 설정되어 있으면 Redis로 일일 한도 체크
 *
 * @example
 * ```ts
 * const rateLimitResult = await applyRateLimitAsync(request, userId);
 * if (!rateLimitResult.success) {
 *   return rateLimitResult.response;
 * }
 * ```
 */
export async function applyRateLimitAsync(
  request: NextRequest,
  userId?: string | null,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = getIdentifier(request, userId);
  const endpoint = new URL(request.url).pathname;

  const config = customConfig || getConfigForEndpoint(endpoint);
  const { success, remaining, resetTime, dailyRemaining, dailyResetTime } =
    await checkRateLimitAsync(identifier, endpoint);

  const headers = getRateLimitHeaders(
    remaining,
    resetTime,
    config.maxRequests,
    dailyRemaining,
    config.dailyMaxRequests,
    dailyResetTime
  );

  if (!success) {
    const isDailyExceeded = dailyRemaining !== undefined && dailyRemaining <= 0;
    const retryAfter = isDailyExceeded && dailyResetTime
      ? Math.ceil((dailyResetTime - Date.now()) / 1000)
      : Math.ceil((resetTime - Date.now()) / 1000);

    const errorMessage = isDailyExceeded
      ? '일일 요청 한도를 초과했습니다. 내일 다시 시도해주세요.'
      : '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';

    const errorCode = isDailyExceeded ? 'DAILY_LIMIT_EXCEEDED' : 'RATE_LIMIT_EXCEEDED';

    return {
      success: false,
      headers,
      response: NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
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
