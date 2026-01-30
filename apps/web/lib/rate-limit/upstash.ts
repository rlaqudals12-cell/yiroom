/**
 * Upstash Redis 설정
 *
 * @description Upstash Redis 클라이언트 및 Rate Limiter 초기화
 * @see SDD-RATE-LIMITING.md
 */

// Upstash 동적 import (패키지 미설치 시에도 빌드 가능)
 
let RatelimitClass: any = null;
 
let RedisClass: any = null;

// 환경변수 확인
export const UPSTASH_ENABLED = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// 동적 import 시도
if (UPSTASH_ENABLED) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const upstashRatelimit = require('@upstash/ratelimit');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const upstashRedis = require('@upstash/redis');
    RatelimitClass = upstashRatelimit.Ratelimit;
    RedisClass = upstashRedis.Redis;
  } catch {
    console.warn('[Upstash] Packages not found, using in-memory fallback');
  }
}

// Redis 클라이언트 싱글톤
 
let redisInstance: any = null;

/**
 * Redis 클라이언트 가져오기 (싱글톤)
 */
 
export function getRedisClient(): any | null {
  if (!UPSTASH_ENABLED || !RedisClass) {
    return null;
  }

  if (!redisInstance) {
    redisInstance = new RedisClass({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  return redisInstance;
}

/**
 * Redis 연결 테스트
 */
export async function testRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Upstash] Connection test failed:', error);
    return false;
  }
}

 
type RateLimiterType = any;

// 분당 리미터 캐시
const minuteLimiters = new Map<string, RateLimiterType>();
// 일일 리미터 캐시
const dailyLimiters = new Map<string, RateLimiterType>();

/**
 * 분당 Rate Limiter 생성/가져오기
 *
 * @param prefix 키 접두사 (카테고리별 구분)
 * @param limit 분당 최대 요청 수
 */
export function getMinuteLimiter(prefix: string, limit: number): RateLimiterType | null {
  if (!UPSTASH_ENABLED || !RatelimitClass) {
    return null;
  }

  const key = `${prefix}:${limit}`;
  if (minuteLimiters.has(key)) {
    return minuteLimiters.get(key);
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const limiter = new RatelimitClass({
    redis,
    limiter: RatelimitClass.slidingWindow(limit, '1 m'),
    prefix: `yiroom:minute:${prefix}`,
    analytics: true,
  });

  minuteLimiters.set(key, limiter);
  return limiter;
}

/**
 * 일일 Rate Limiter 생성/가져오기
 *
 * @param prefix 키 접두사 (카테고리별 구분)
 * @param limit 일일 최대 요청 수
 */
export function getDailyLimiter(prefix: string, limit: number): RateLimiterType | null {
  if (!UPSTASH_ENABLED || !RatelimitClass) {
    return null;
  }

  const key = `${prefix}:${limit}`;
  if (dailyLimiters.has(key)) {
    return dailyLimiters.get(key);
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const limiter = new RatelimitClass({
    redis,
    limiter: RatelimitClass.slidingWindow(limit, '24 h'),
    prefix: `yiroom:daily:${prefix}`,
    analytics: true,
  });

  dailyLimiters.set(key, limiter);
  return limiter;
}

/**
 * Upstash 사용 가능 여부 확인
 */
export function isUpstashAvailable(): boolean {
  return UPSTASH_ENABLED && RedisClass !== null && RatelimitClass !== null;
}
