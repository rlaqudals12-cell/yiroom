/**
 * Rate Limit In-Memory Fallback
 *
 * @description Upstash Redis 장애 시 인메모리 폴백
 * @see SDD-RATE-LIMITING.md
 */

import {
  RateLimitCategory,
  RateLimitResult,
  RATE_LIMIT_CONFIGS,
} from '@/types/rate-limit';
import {
  checkRateLimit,
  createRateLimitHeaders,
  getRateLimitCategory,
  getIdentifier,
  isRateLimitedPath,
  extractIpAddress,
} from './limiter';

/**
 * 인메모리 엔트리
 */
interface MemoryEntry {
  minuteCount: number;
  dailyCount: number;
  minuteReset: number;
  dailyReset: number;
}

/**
 * 인메모리 스토어
 *
 * @description 서버리스 환경에서는 콜드 스타트마다 리셋됨
 * 프로덕션에서는 Redis 사용 권장
 */
const memoryStore = new Map<string, MemoryEntry>();

/**
 * 다음 자정 (UTC) 타임스탬프
 */
function getNextMidnightUTC(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return tomorrow.getTime();
}

/**
 * 오래된 엔트리 정리 (메모리 누수 방지)
 */
function cleanupOldEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.dailyReset < now) {
      memoryStore.delete(key);
    }
  }
}

// 1분마다 정리 (서버 환경에서만)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldEntries, 60 * 1000);
}

/**
 * 인메모리 Rate Limit 검사
 *
 * @param identifier 식별자
 * @param category Rate Limit 카테고리
 */
function checkRateLimitMemory(
  identifier: string,
  category: RateLimitCategory
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[category];
  const key = `${category}:${identifier}`;
  const now = Date.now();

  let entry = memoryStore.get(key);

  // 새 엔트리 생성 또는 일일 리셋
  if (!entry || entry.dailyReset < now) {
    entry = {
      minuteCount: 0,
      dailyCount: 0,
      minuteReset: now + 60 * 1000,
      dailyReset: getNextMidnightUTC(),
    };
  }

  // 분당 리셋
  if (entry.minuteReset < now) {
    entry.minuteCount = 0;
    entry.minuteReset = now + 60 * 1000;
  }

  // 카운트 증가
  entry.minuteCount++;
  entry.dailyCount++;
  memoryStore.set(key, entry);

  // 한도 확인
  const minuteExceeded = entry.minuteCount > config.minuteLimit;
  const dailyExceeded = entry.dailyCount > config.dailyLimit;

  const result = {
    success: !minuteExceeded && !dailyExceeded,
    minuteLimit: config.minuteLimit,
    minuteRemaining: Math.max(0, config.minuteLimit - entry.minuteCount),
    dailyLimit: config.dailyLimit,
    dailyRemaining: Math.max(0, config.dailyLimit - entry.dailyCount),
    resetMinute: entry.minuteReset,
    resetDaily: entry.dailyReset,
    usedFallback: true,
  };

  return {
    ...result,
    headers: createRateLimitHeaders(result, true),
  };
}

/**
 * Rate Limit 검사 (Redis 우선, 실패 시 인메모리 폴백)
 *
 * @param identifier 식별자
 * @param category Rate Limit 카테고리
 */
export async function checkRateLimitWithFallback(
  identifier: string,
  category: RateLimitCategory = 'default'
): Promise<RateLimitResult> {
  try {
    // Redis 시도
    const redisResult = await checkRateLimit(identifier, category);
    if (redisResult) {
      return redisResult;
    }
  } catch (error) {
    console.error('[RateLimit] Redis error, using memory fallback:', error);
  }

  // 인메모리 폴백
  return checkRateLimitMemory(identifier, category);
}

/**
 * 인메모리 스토어 상태 확인 (디버깅용)
 */
export function getMemoryStoreSize(): number {
  return memoryStore.size;
}

/**
 * 인메모리 스토어 초기화 (테스트용)
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}

// Re-export limiter functions
export {
  getRateLimitCategory,
  getIdentifier,
  isRateLimitedPath,
  extractIpAddress,
  createRateLimitHeaders,
};
