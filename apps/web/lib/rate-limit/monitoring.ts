/**
 * Rate Limit 모니터링
 *
 * @description Rate Limit 사용량 로깅 및 알림
 * @see SDD-RATE-LIMITING.md
 */

import { RateLimitCategory, RateLimitResult } from '@/types/rate-limit';

/**
 * Rate Limit 로그 레벨
 */
type LogLevel = 'info' | 'warn' | 'error';

/**
 * Rate Limit 이벤트
 */
interface RateLimitEvent {
  timestamp: string;
  identifier: string;
  category: RateLimitCategory;
  minuteRemaining: number;
  dailyRemaining: number;
  limitType: 'minute' | 'daily';
  usedFallback: boolean;
}

/**
 * 콘솔 로깅 (개발 환경)
 */
function logToConsole(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `[RateLimit] [${timestamp}]`;

  switch (level) {
    case 'info':
      console.info(prefix, message, data);
      break;
    case 'warn':
      console.warn(prefix, message, data);
      break;
    case 'error':
      console.error(prefix, message, data);
      break;
  }
}

/**
 * Rate Limit 한도 초과 로깅
 *
 * @param identifier 식별자
 * @param category Rate Limit 카테고리
 * @param result Rate Limit 검사 결과
 */
export function logRateLimitExceeded(
  identifier: string,
  category: RateLimitCategory,
  result: RateLimitResult
): void {
  const limitType = result.minuteRemaining === 0 ? 'minute' : 'daily';

  const event: RateLimitEvent = {
    timestamp: new Date().toISOString(),
    identifier: sanitizeIdentifier(identifier),
    category,
    minuteRemaining: result.minuteRemaining,
    dailyRemaining: result.dailyRemaining,
    limitType,
    usedFallback: result.usedFallback ?? false,
  };

  logToConsole('warn', 'Rate limit exceeded', event);

  // TODO: Sentry 또는 다른 모니터링 서비스로 전송
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureMessage('Rate limit exceeded', {
  //     level: 'warning',
  //     extra: event,
  //     tags: {
  //       category,
  //       limitType,
  //     },
  //   });
  // }
}

/**
 * Rate Limit 사용량 로깅 (선택적)
 *
 * @param identifier 식별자
 * @param category Rate Limit 카테고리
 * @param result Rate Limit 검사 결과
 */
export function logRateLimitUsage(
  identifier: string,
  category: RateLimitCategory,
  result: RateLimitResult
): void {
  // 80% 이상 사용 시에만 로깅 (노이즈 감소)
  const minuteUsagePercent =
    ((result.minuteLimit - result.minuteRemaining) / result.minuteLimit) * 100;
  const dailyUsagePercent =
    ((result.dailyLimit - result.dailyRemaining) / result.dailyLimit) * 100;

  if (minuteUsagePercent >= 80 || dailyUsagePercent >= 80) {
    const event = {
      timestamp: new Date().toISOString(),
      identifier: sanitizeIdentifier(identifier),
      category,
      minuteUsagePercent: Math.round(minuteUsagePercent),
      dailyUsagePercent: Math.round(dailyUsagePercent),
      usedFallback: result.usedFallback ?? false,
    };

    logToConsole('info', 'Rate limit approaching threshold', event);
  }
}

/**
 * Fallback 사용 로깅
 *
 * @param reason Fallback 사용 이유
 */
export function logFallbackUsed(reason: string): void {
  logToConsole('warn', 'Using in-memory fallback', { reason });
}

/**
 * 식별자 정제 (개인정보 보호)
 *
 * @param identifier 원본 식별자
 * @returns 마스킹된 식별자
 */
function sanitizeIdentifier(identifier: string): string {
  // IP 주소 마스킹: 192.168.1.100 -> 192.168.x.x
  if (identifier.startsWith('ip:')) {
    const ip = identifier.slice(3);
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `ip:${parts[0]}.${parts[1]}.x.x`;
    }
    // IPv6 또는 기타
    return `ip:${ip.slice(0, 10)}...`;
  }

  // 사용자 ID 마스킹: user:user_abc123def456 -> user:user_abc...456
  if (identifier.startsWith('user:')) {
    const userId = identifier.slice(5);
    if (userId.length > 10) {
      return `user:${userId.slice(0, 8)}...${userId.slice(-3)}`;
    }
    return identifier;
  }

  return identifier;
}

/**
 * Rate Limit 통계 수집 (향후 확장용)
 */
export interface RateLimitStats {
  category: RateLimitCategory;
  totalRequests: number;
  blockedRequests: number;
  fallbackUsed: number;
  periodStart: Date;
  periodEnd: Date;
}

// 향후 구현: 통계 수집 및 대시보드 연동
// export function collectStats(): RateLimitStats[] { ... }
