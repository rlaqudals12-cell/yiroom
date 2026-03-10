/**
 * Rate Limiting 타입 정의
 *
 * @description API Rate Limiting 관련 타입 및 설정
 * @see SDD-RATE-LIMITING.md
 */

/**
 * Rate Limit 카테고리
 * - 엔드포인트 그룹별 분류
 */
export type RateLimitCategory =
  | 'analyze'   // AI 분석 API (/api/analyze/*, /api/gemini/*)
  | 'auth'      // 인증 API (/api/auth/*)
  | 'upload'    // 업로드 API (/api/upload/*)
  | 'coach'     // 코치/채팅 API (/api/coach/*, /api/chat/*)
  | 'feedback'  // 피드백 API (/api/feedback/*)
  | 'nutrition' // 영양 API (/api/nutrition/*)
  | 'workout'   // 운동 API (/api/workout/*)
  | 'affiliate' // 어필리에이트 API (/api/affiliate/*)
  | 'default';  // 기타 API

/**
 * 식별자 유형
 * - userId: 사용자 ID 기반 (로그인 필수 API)
 * - ip: IP 주소 기반 (인증 API, 공개 API)
 */
export type IdentifierType = 'userId' | 'ip';

/**
 * Rate Limit 설정
 */
export interface RateLimitConfig {
  /** 분당 최대 요청 수 */
  minuteLimit: number;
  /** 일일 최대 요청 수 */
  dailyLimit: number;
  /** 식별자 유형 (userId 또는 ip) */
  identifier: IdentifierType;
}

/**
 * Rate Limit 검사 결과
 */
export interface RateLimitResult {
  /** 요청 허용 여부 */
  success: boolean;
  /** 분당 한도 */
  minuteLimit: number;
  /** 분당 잔여 요청 수 */
  minuteRemaining: number;
  /** 일일 한도 */
  dailyLimit: number;
  /** 일일 잔여 요청 수 */
  dailyRemaining: number;
  /** 분당 한도 리셋 시간 (Unix timestamp ms) */
  resetMinute: number;
  /** 일일 한도 리셋 시간 (Unix timestamp ms) */
  resetDaily: number;
  /** HTTP 응답 헤더 */
  headers: Record<string, string>;
  /** Fallback 사용 여부 */
  usedFallback?: boolean;
}

/**
 * 카테고리별 Rate Limit 설정
 *
 * @description 스펙(SDD-RATE-LIMITING.md) 기준
 * - analyze: 분당 10회, 일일 50회 (비용 높음)
 * - auth: 분당 20회, 일일 100회 (IP 기반)
 * - upload: 분당 5회, 일일 30회
 * - coach: 분당 30회, 일일 200회
 * - feedback: 분당 5회, 일일 20회
 * - nutrition/workout: 분당 30회, 일일 300회
 * - affiliate: 분당 50회, 일일 500회
 * - default: 분당 100회, 일일 1000회
 */
export const RATE_LIMIT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  analyze: {
    minuteLimit: 10,
    dailyLimit: 50,
    identifier: 'userId',
  },
  auth: {
    minuteLimit: 20,
    dailyLimit: 100,
    identifier: 'ip',
  },
  upload: {
    minuteLimit: 5,
    dailyLimit: 30,
    identifier: 'userId',
  },
  coach: {
    minuteLimit: 30,
    dailyLimit: 200,
    identifier: 'userId',
  },
  feedback: {
    minuteLimit: 5,
    dailyLimit: 20,
    identifier: 'userId',
  },
  nutrition: {
    minuteLimit: 30,
    dailyLimit: 300,
    identifier: 'userId',
  },
  workout: {
    minuteLimit: 30,
    dailyLimit: 300,
    identifier: 'userId',
  },
  affiliate: {
    minuteLimit: 50,
    dailyLimit: 500,
    identifier: 'userId',
  },
  default: {
    minuteLimit: 100,
    dailyLimit: 1000,
    identifier: 'userId',
  },
};

/**
 * Rate Limit 한도 초과 유형
 */
export type LimitExceededType = 'minute' | 'daily';

/**
 * Rate Limit 에러 응답
 */
export interface RateLimitErrorResponse {
  success: false;
  error: {
    code: 'RATE_LIMIT_ERROR';
    message: string;
    retryAfter: number;
    limitType: LimitExceededType;
  };
}

/**
 * Rate Limit 헤더 이름
 */
export const RATE_LIMIT_HEADERS = {
  LIMIT_MINUTE: 'X-RateLimit-Limit-Minute',
  REMAINING_MINUTE: 'X-RateLimit-Remaining-Minute',
  LIMIT_DAY: 'X-RateLimit-Limit-Day',
  REMAINING_DAY: 'X-RateLimit-Remaining-Day',
  RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
  FALLBACK: 'X-RateLimit-Fallback',
} as const;
