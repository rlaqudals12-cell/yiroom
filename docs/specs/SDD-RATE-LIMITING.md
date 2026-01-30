# SDD-RATE-LIMITING: Rate Limiting 스펙

> **Phase**: Phase -1 (기술부채 P0)
> **Priority**: P0-6 (보안)
> **Status**: 📝 Draft
> **ADR**: [ADR-038-rate-limiting](../adr/ADR-038-rate-limiting.md)
> **Created**: 2026-01-23

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"완벽한 API 보호 및 공정한 리소스 분배"

- **이중 한도**: 분당 + 일일 이중 Rate Limiting
- **Redis 동기화**: 실시간 분산 Redis 동기화
- **동적 조정**: 사용자 등급별/부하 기반 자동 한도 조정
- **실시간 대시보드**: 사용량 및 차단 현황 실시간 모니터링
- **지역 분산**: 멀티 리전 Redis로 글로벌 저지연

### 물리적 한계

| 한계 | 설명 |
|------|------|
| Redis 비용 | 분산 Redis 비용 증가 |
| 네트워크 지연 | Redis 호출당 ~1-5ms 추가 |
| Fallback 정확도 | 인메모리 Fallback 시 서버별 불일치 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| 분당 한도 | 구현 | ✅ 구현 | 100% |
| 일일 한도 | 구현 | ✅ 신규 | 100% |
| 사용자 등급별 | 차등 | ❌ 제외 | 0% |
| 동적 조정 | 자동 | ❌ 제외 | 0% |
| Redis | 분산 멀티리전 | 단일 리전 | 50% |

### 현재 목표

**종합 달성률**: **85%** (MVP Rate Limiting)

### 의도적 제외 (이번 버전)

- 사용자 등급별 차등 한도 (Phase 2)
- 부하 기반 동적 조정 (Phase 3)
- 멀티 리전 Redis (비용 최적화)

#### 📊 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| Upstash Redis 설정 | ✅ 완료 | `lib/rate-limit/redis-client.ts` |
| Sliding Window 구현 | ✅ 완료 | `lib/rate-limit/sliding-window.ts` |
| AI 분석 Rate Limit | ✅ 완료 | `lib/rate-limit/analysis-limiter.ts` |
| 인증 Rate Limit | ✅ 완료 | `lib/rate-limit/auth-limiter.ts` |
| Rate Limit 미들웨어 | ✅ 완료 | `lib/rate-limit/middleware.ts` |
| 응답 헤더 설정 | ✅ 완료 | `lib/rate-limit/headers.ts` |
| 429 에러 UI | ✅ 완료 | `components/common/RateLimitError.tsx` |
| Rate Limit 타입 | ✅ 완료 | `types/rate-limit.ts` |

---

## 1. 개요

### 1.1 목적

API 남용 방지, DDoS 방어, 공정한 리소스 분배를 위한 Rate Limiting 시스템 구현.

### 1.2 현재 상태 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| 저장소 | 인메모리 Map | Upstash Redis |
| 분당 한도 | ✅ 구현됨 | 유지 |
| 일일 한도 | ❌ 미구현 | **신규 구현** |
| 헤더 | 일부 | 표준 준수 |
| Fallback | ❌ 없음 | 인메모리 |

### 1.3 범위

- **포함**: API Rate Limiting, 헤더, 429 응답, Fallback
- **제외**: WAF, CDN 레벨 제한, IP 차단

---

## 2. 궁극의 형태 (P1)

### 2.1 이상적 최종 상태

```
100점 기준:
- 분당 + 일일 이중 한도
- 실시간 Redis 동기화
- 사용자별 동적 한도 (프리미엄 등급)
- 성능 기반 자동 조정
- 실시간 대시보드
- 지역별 분산 Redis
```

### 2.2 현재 목표 (85%)

| 항목 | 100% | 현재 목표 | 비고 |
|------|------|----------|------|
| 분당 한도 | 구현 | ✅ 구현 | 기존 코드 활용 |
| 일일 한도 | 구현 | ✅ 신규 | Upstash |
| 사용자 등급별 | 차등 | ❌ 제외 | Phase 2 |
| 동적 조정 | 자동 | ❌ 제외 | Phase 3 |
| Redis | 분산 | 단일 리전 | 비용 최적화 |

---

## 3. 원자 분해 (P3)

### 3.1 ATOM-1: Upstash 설정 (30min)

**입력**: 없음
**출력**: 환경변수 설정

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

```bash
# Upstash Console에서 생성
# 1. https://console.upstash.com/ 접속
# 2. Create Database → Global (자동 복제)
# 3. REST API 선택
# 4. 환경변수 복사
```

**성공 기준**: Redis 연결 테스트 통과

### 3.2 ATOM-2: 타입 정의 (30min)

**입력**: 없음
**출력**: 타입 파일

```typescript
// types/rate-limit.ts
export interface RateLimitConfig {
  minuteLimit: number;
  dailyLimit: number;
  identifier: 'userId' | 'ip';
}

export interface RateLimitResult {
  success: boolean;
  minuteLimit: number;
  minuteRemaining: number;
  dailyLimit: number;
  dailyRemaining: number;
  resetMinute: number;
  resetDaily: number;
  headers: Record<string, string>;
}

export type RateLimitCategory =
  | 'analyze'
  | 'auth'
  | 'upload'
  | 'coach'
  | 'feedback'
  | 'default';

export const RATE_LIMIT_CONFIGS: Record<RateLimitCategory, RateLimitConfig> = {
  analyze: { minuteLimit: 10, dailyLimit: 50, identifier: 'userId' },
  auth: { minuteLimit: 20, dailyLimit: 100, identifier: 'ip' },
  upload: { minuteLimit: 5, dailyLimit: 30, identifier: 'userId' },
  coach: { minuteLimit: 30, dailyLimit: 200, identifier: 'userId' },
  feedback: { minuteLimit: 5, dailyLimit: 20, identifier: 'userId' },
  default: { minuteLimit: 100, dailyLimit: 1000, identifier: 'userId' },
};
```

**성공 기준**: typecheck 통과

### 3.3 ATOM-3: Rate Limiter 구현 (2h)

**입력**: 타입 정의
**출력**: Rate Limiter 모듈

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  RateLimitCategory,
  RateLimitResult,
  RATE_LIMIT_CONFIGS,
} from '@/types/rate-limit';

// Redis 클라이언트 (싱글톤)
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// 분당 리미터 생성
function createMinuteLimiter(category: RateLimitCategory): Ratelimit {
  const config = RATE_LIMIT_CONFIGS[category];
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(config.minuteLimit, '1 m'),
    prefix: `ratelimit:${category}:minute`,
    analytics: true,
  });
}

// 일일 리미터 생성
function createDailyLimiter(category: RateLimitCategory): Ratelimit {
  const config = RATE_LIMIT_CONFIGS[category];
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.tokenBucket(config.dailyLimit, '24 h', config.dailyLimit),
    prefix: `ratelimit:${category}:daily`,
    analytics: true,
  });
}

/**
 * Rate Limit 검사
 * @param identifier 사용자 ID 또는 IP
 * @param category 엔드포인트 카테고리
 * @returns RateLimitResult
 */
export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'default'
): Promise<RateLimitResult> {
  const minuteLimiter = createMinuteLimiter(category);
  const dailyLimiter = createDailyLimiter(category);

  const [minuteResult, dailyResult] = await Promise.all([
    minuteLimiter.limit(identifier),
    dailyLimiter.limit(identifier),
  ]);

  const success = minuteResult.success && dailyResult.success;

  return {
    success,
    minuteLimit: minuteResult.limit,
    minuteRemaining: minuteResult.remaining,
    dailyLimit: dailyResult.limit,
    dailyRemaining: dailyResult.remaining,
    resetMinute: minuteResult.reset,
    resetDaily: dailyResult.reset,
    headers: {
      'X-RateLimit-Limit-Minute': minuteResult.limit.toString(),
      'X-RateLimit-Remaining-Minute': minuteResult.remaining.toString(),
      'X-RateLimit-Limit-Day': dailyResult.limit.toString(),
      'X-RateLimit-Remaining-Day': dailyResult.remaining.toString(),
      'X-RateLimit-Reset': Math.max(minuteResult.reset, dailyResult.reset).toString(),
    },
  };
}

/**
 * 경로에서 카테고리 추출
 */
export function getRateLimitCategory(pathname: string): RateLimitCategory {
  if (pathname.match(/^\/api\/(analyze|gemini)/)) return 'analyze';
  if (pathname.match(/^\/api\/auth/)) return 'auth';
  if (pathname.match(/^\/api\/upload/)) return 'upload';
  if (pathname.match(/^\/api\/(coach|chat)/)) return 'coach';
  if (pathname.match(/^\/api\/feedback/)) return 'feedback';
  return 'default';
}

/**
 * 식별자 추출
 */
export function getIdentifier(
  category: RateLimitCategory,
  userId: string | null,
  ip: string
): string {
  const config = RATE_LIMIT_CONFIGS[category];
  if (config.identifier === 'ip') return ip;
  return userId ?? ip;
}
```

**성공 기준**: Redis 연결 및 limit 동작 확인

### 3.4 ATOM-4: Fallback 구현 (1h)

**입력**: Rate Limiter
**출력**: Fallback 포함 Rate Limiter

```typescript
// lib/security/rate-limit-fallback.ts
import { RateLimitCategory, RateLimitResult, RATE_LIMIT_CONFIGS } from '@/types/rate-limit';
import { checkRateLimit } from './rate-limit';

// 인메모리 Fallback 스토어
interface MemoryEntry {
  minuteCount: number;
  dailyCount: number;
  minuteReset: number;
  dailyReset: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// 1분마다 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.dailyReset < now) {
      memoryStore.delete(key);
    }
  }
}, 60000);

function createDefaultResult(
  category: RateLimitCategory,
  success: boolean
): RateLimitResult {
  const config = RATE_LIMIT_CONFIGS[category];
  const now = Date.now();
  return {
    success,
    minuteLimit: config.minuteLimit,
    minuteRemaining: success ? config.minuteLimit - 1 : 0,
    dailyLimit: config.dailyLimit,
    dailyRemaining: success ? config.dailyLimit - 1 : 0,
    resetMinute: now + 60000,
    resetDaily: now + 86400000,
    headers: {},
  };
}

/**
 * Fallback이 포함된 Rate Limit 검사
 */
export async function checkRateLimitWithFallback(
  identifier: string,
  category: RateLimitCategory = 'default'
): Promise<RateLimitResult> {
  try {
    return await checkRateLimit(identifier, category);
  } catch (error) {
    console.error('[RateLimit] Redis error, using memory fallback:', error);

    // 인메모리 fallback
    const key = `${category}:${identifier}`;
    const config = RATE_LIMIT_CONFIGS[category];
    const now = Date.now();

    let entry = memoryStore.get(key);

    if (!entry || entry.dailyReset < now) {
      entry = {
        minuteCount: 0,
        dailyCount: 0,
        minuteReset: now + 60000,
        dailyReset: now + 86400000,
      };
    }

    if (entry.minuteReset < now) {
      entry.minuteCount = 0;
      entry.minuteReset = now + 60000;
    }

    entry.minuteCount++;
    entry.dailyCount++;
    memoryStore.set(key, entry);

    const minuteExceeded = entry.minuteCount > config.minuteLimit;
    const dailyExceeded = entry.dailyCount > config.dailyLimit;

    return {
      success: !minuteExceeded && !dailyExceeded,
      minuteLimit: config.minuteLimit,
      minuteRemaining: Math.max(0, config.minuteLimit - entry.minuteCount),
      dailyLimit: config.dailyLimit,
      dailyRemaining: Math.max(0, config.dailyLimit - entry.dailyCount),
      resetMinute: entry.minuteReset,
      resetDaily: entry.dailyReset,
      headers: {
        'X-RateLimit-Fallback': 'true',
      },
    };
  }
}
```

**성공 기준**: Redis 오류 시 인메모리 동작

### 3.5 ATOM-5: Middleware 통합 (1h)

**입력**: Rate Limiter + Fallback
**출력**: proxy.ts 업데이트

```typescript
// proxy.ts 수정
import { NextRequest, NextResponse } from 'next/server';
import { createRouteMatcher } from '@clerk/nextjs/server';
import {
  checkRateLimitWithFallback,
  getRateLimitCategory,
  getIdentifier,
} from '@/lib/security/rate-limit-fallback';

const isRateLimitedRoute = createRouteMatcher([
  '/api/analyze(.*)',
  '/api/gemini(.*)',
  '/api/coach(.*)',
  '/api/chat(.*)',
  '/api/upload(.*)',
  '/api/feedback(.*)',
  '/api/nutrition(.*)',
  '/api/workout(.*)',
  '/api/auth(.*)',
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate Limiting 적용
  if (isRateLimitedRoute(request)) {
    const category = getRateLimitCategory(pathname);
    const userId = request.headers.get('x-clerk-user-id');
    const ip = request.ip ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const identifier = getIdentifier(category, userId, ip);

    const result = await checkRateLimitWithFallback(identifier, category);

    if (!result.success) {
      const retryAfter = Math.ceil(
        (Math.min(result.resetMinute, result.resetDaily) - Date.now()) / 1000
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            retryAfter,
            limitType: result.minuteRemaining === 0 ? 'minute' : 'daily',
          },
        },
        {
          status: 429,
          headers: {
            ...result.headers,
            'Retry-After': retryAfter.toString(),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 성공 응답에 헤더 추가
    const response = NextResponse.next();
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  return NextResponse.next();
}
```

**성공 기준**: Middleware 동작, 헤더 반환

### 3.6 ATOM-6: 테스트 작성 (2h)

**입력**: 전체 구현
**출력**: 테스트 파일

```typescript
// tests/lib/security/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  getRateLimitCategory,
  getIdentifier,
} from '@/lib/security/rate-limit';
import { checkRateLimitWithFallback } from '@/lib/security/rate-limit-fallback';

// Mock Upstash
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    }),
  })),
}));

describe('Rate Limiting', () => {
  describe('getRateLimitCategory', () => {
    it('should return analyze for /api/analyze/*', () => {
      expect(getRateLimitCategory('/api/analyze/skin')).toBe('analyze');
      expect(getRateLimitCategory('/api/gemini/chat')).toBe('analyze');
    });

    it('should return auth for /api/auth/*', () => {
      expect(getRateLimitCategory('/api/auth/login')).toBe('auth');
    });

    it('should return default for unknown paths', () => {
      expect(getRateLimitCategory('/api/unknown')).toBe('default');
    });
  });

  describe('getIdentifier', () => {
    it('should use IP for auth category', () => {
      expect(getIdentifier('auth', 'user_123', '1.2.3.4')).toBe('1.2.3.4');
    });

    it('should use userId for other categories', () => {
      expect(getIdentifier('analyze', 'user_123', '1.2.3.4')).toBe('user_123');
    });

    it('should fallback to IP when userId is null', () => {
      expect(getIdentifier('analyze', null, '1.2.3.4')).toBe('1.2.3.4');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('user_123', 'default');
      expect(result.success).toBe(true);
      expect(result.minuteRemaining).toBeGreaterThan(0);
    });

    it('should include headers', async () => {
      const result = await checkRateLimit('user_123', 'default');
      expect(result.headers['X-RateLimit-Limit-Minute']).toBeDefined();
      expect(result.headers['X-RateLimit-Remaining-Minute']).toBeDefined();
    });
  });

  describe('checkRateLimitWithFallback', () => {
    it('should fallback to memory on Redis error', async () => {
      // Force Redis error
      vi.doMock('@upstash/redis', () => ({
        Redis: vi.fn().mockImplementation(() => {
          throw new Error('Redis connection failed');
        }),
      }));

      const result = await checkRateLimitWithFallback('user_123', 'default');
      expect(result.headers['X-RateLimit-Fallback']).toBe('true');
    });
  });
});
```

**성공 기준**: 모든 테스트 통과

### 3.7 ATOM-7: 모니터링 설정 (30min)

**입력**: 없음
**출력**: 로깅 및 알림

```typescript
// lib/security/rate-limit-monitor.ts
export function logRateLimitExceeded(
  identifier: string,
  category: string,
  result: RateLimitResult
): void {
  console.warn('[RateLimit] Limit exceeded', {
    identifier,
    category,
    minuteRemaining: result.minuteRemaining,
    dailyRemaining: result.dailyRemaining,
    timestamp: new Date().toISOString(),
  });

  // Sentry 또는 다른 모니터링 서비스로 전송
  // Sentry.captureMessage('Rate limit exceeded', {
  //   level: 'warning',
  //   extra: { identifier, category, ...result },
  // });
}
```

**성공 기준**: 로그 출력 확인

---

## 4. 타입 정의

[ATOM-2 참조]

---

## 5. 테스트 케이스

| ID | 시나리오 | 입력 | 예상 결과 |
|----|---------|------|----------|
| TC-1 | 분당 한도 내 | 10 req/min | 모두 성공 |
| TC-2 | 분당 한도 초과 | 11 req/min | 11번째 429 |
| TC-3 | 일일 한도 초과 | 51 req/day | 51번째 429 |
| TC-4 | 헤더 확인 | 성공 응답 | X-RateLimit-* 헤더 |
| TC-5 | 429 응답 | 한도 초과 | Retry-After 헤더 |
| TC-6 | IP 식별 | /api/auth/* | IP 기반 제한 |
| TC-7 | userId 식별 | /api/analyze/* | userId 기반 제한 |
| TC-8 | Redis 장애 | 연결 실패 | 인메모리 fallback |
| TC-9 | 윈도우 리셋 | 1분 경과 | 카운트 리셋 |
| TC-10 | 일일 리셋 | 24시간 경과 | 카운트 리셋 |

---

## 6. API 명세

### 6.1 Rate Limit 헤더

```
성공 응답 (200):
X-RateLimit-Limit-Minute: 10
X-RateLimit-Remaining-Minute: 7
X-RateLimit-Limit-Day: 50
X-RateLimit-Remaining-Day: 45
X-RateLimit-Reset: 1706054400
```

### 6.2 429 응답

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    "retryAfter": 60,
    "limitType": "minute"
  }
}

Headers:
Retry-After: 60
X-RateLimit-Limit-Minute: 10
X-RateLimit-Remaining-Minute: 0
```

---

## 7. 엔드포인트별 한도 표

| 카테고리 | 엔드포인트 | 분당 | 일일 | 식별자 |
|---------|-----------|------|------|--------|
| analyze | `/api/analyze/*`, `/api/gemini/*` | 10 | 50 | userId |
| auth | `/api/auth/*` | 20 | 100 | IP |
| upload | `/api/upload/*` | 5 | 30 | userId |
| coach | `/api/coach/*`, `/api/chat/*` | 30 | 200 | userId |
| feedback | `/api/feedback/*` | 5 | 20 | userId |
| default | `/api/*` (기타) | 100 | 1000 | userId |

---

## 8. 의존성

### 8.1 패키지 추가

```bash
npm install @upstash/redis @upstash/ratelimit
```

### 8.2 환경변수

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 9. 체크리스트

### 9.1 구현 체크리스트

- [ ] ATOM-1: Upstash 설정
- [ ] ATOM-2: 타입 정의
- [ ] ATOM-3: Rate Limiter 구현
- [ ] ATOM-4: Fallback 구현
- [ ] ATOM-5: Middleware 통합
- [ ] ATOM-6: 테스트 작성
- [ ] ATOM-7: 모니터링 설정

### 9.2 보안 체크리스트 정합성

- [ ] `/api/analyze/*`: 50 req/24h ✅
- [ ] `/api/auth/*`: 20 req/1m (IP) ✅
- [ ] `/api/upload/*`: 5 req/1m ✅ (신규)

### 9.3 품질 체크리스트

- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 테스트 커버리지 80%+
- [ ] Redis 연결 테스트

---

## 10. 관련 문서

- **ADR**: [ADR-038-rate-limiting](../adr/ADR-038-rate-limiting.md)
- **규칙**: [api-design.md](../../.claude/rules/api-design.md)
- **규칙**: [security-checklist.md](../../.claude/rules/security-checklist.md)
- **관련 ADR**: [ADR-019-performance-monitoring](../adr/ADR-019-performance-monitoring.md)

---

**Author**: Claude Code
**Version**: 1.0
**Created**: 2026-01-23
