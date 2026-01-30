# Redis Rate Limiting 고도화

> **ID**: RATE-LIMIT-REDIS
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: apps/web/lib/security/rate-limit.ts

---

## 1. 현재 구현 분석

### 현재 상태

```typescript
// apps/web/lib/security/rate-limit.ts
// 인메모리 방식 (Map 기반)

✅ Fixed Window 알고리즘 구현
✅ 엔드포인트별 설정 분리
✅ IP/userId 기반 식별
✅ Rate Limit 헤더 (X-RateLimit-*)
✅ 429 응답 + Retry-After

⚠️ 문제점
- 서버리스 환경에서 요청마다 리셋 가능
- 분산 환경 미지원 (Vercel 다중 인스턴스)
- 메모리 누수 가능성 (cleanup 있으나 불완전)
- Fixed Window의 버스트 문제
```

### 현재 설정

```typescript
const rateLimitConfigs = {
  '/api/analyze': { windowMs: 60_000, maxRequests: 10 },
  '/api/gemini': { windowMs: 60_000, maxRequests: 10 },
  '/api/chat': { windowMs: 60_000, maxRequests: 30 },
  '/api/auth': { windowMs: 60_000, maxRequests: 20 },
  '/api/feedback': { windowMs: 60_000, maxRequests: 5 },
  default: { windowMs: 60_000, maxRequests: 100 },
};
```

---

## 2. 알고리즘 비교

### 2.1 Fixed Window (현재)

```
장점: 구현 간단, 메모리 효율적
단점: 윈도우 경계에서 2배 버스트 가능

예시: 10 req/min 제한
- 0:59에 10개 요청 → 통과
- 1:00에 10개 요청 → 통과
- 결과: 2초 내 20개 요청 (의도한 2배)
```

### 2.2 Sliding Window (권장)

```
장점: 버스트 문제 해결, 부드러운 제한
단점: 약간의 추가 연산

원리: 현재 윈도우 + 이전 윈도우 가중 평균
- 이전 윈도우 카운트 × 남은 비율 + 현재 카운트

예시: 10 req/min, 현재 시점 0:30
- 이전(0:00-0:59): 8개
- 현재(0:30-1:30): 4개
- 계산: 8 × 0.5 + 4 = 8 (10 미만 → 통과)
```

### 2.3 Token Bucket

```
장점: 버스트 허용 + 평균 속도 제한, 유연한 제어
단점: 구현 복잡도

원리: 토큰이 일정 속도로 충전, 요청 시 토큰 소비
- refillRate: 초당 토큰 충전량
- maxTokens: 최대 토큰 (버스트 허용량)

예시: refill 1/sec, max 10
- 평균: 1 req/sec
- 버스트: 최대 10개 연속 가능
```

### 2.4 권장 알고리즘

| 엔드포인트 | 권장 알고리즘 | 이유 |
|-----------|-------------|------|
| `/api/analyze/*` | Sliding Window | AI 비용 보호, 버스트 방지 |
| `/api/chat/*` | Token Bucket | 대화 연속성, 버스트 허용 |
| `/api/auth/*` | Sliding Window | 보안 중요, 브루트포스 방지 |
| 기타 | Fixed Window | 간단, 충분 |

---

## 3. Upstash Redis 고도화

### 3.1 설치 및 설정

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// lib/security/redis-rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis 클라이언트 (환경변수에서 자동 로드)
const redis = Redis.fromEnv();

// 캐싱 활성화 (Edge Function 성능 최적화)
// 함수 외부에 선언하여 "hot" 상태에서 재사용
export const aiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:ai',
});

export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(5, '10 s', 30), // 10초마다 5토큰, 최대 30
  analytics: true,
  prefix: 'ratelimit:chat',
});

export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

export const defaultRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:default',
});
```

### 3.2 사용 패턴

```typescript
// lib/security/rate-limit-v2.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  aiRatelimit,
  chatRatelimit,
  authRatelimit,
  defaultRatelimit,
} from './redis-rate-limit';

type RatelimitInstance = typeof aiRatelimit;

const endpointRatelimits: Record<string, RatelimitInstance> = {
  '/api/analyze': aiRatelimit,
  '/api/gemini': aiRatelimit,
  '/api/chat': chatRatelimit,
  '/api/coach': chatRatelimit,
  '/api/auth': authRatelimit,
};

function getRatelimit(pathname: string): RatelimitInstance {
  for (const [prefix, ratelimit] of Object.entries(endpointRatelimits)) {
    if (pathname.startsWith(prefix)) {
      return ratelimit;
    }
  }
  return defaultRatelimit;
}

export async function applyRateLimitV2(
  request: NextRequest,
  userId?: string | null
): Promise<{
  success: boolean;
  response?: NextResponse;
  headers: Record<string, string>;
}> {
  const pathname = new URL(request.url).pathname;
  const ratelimit = getRatelimit(pathname);

  // 식별자: userId 우선, 없으면 IP
  const identifier = userId
    ? `user:${userId}`
    : `ip:${request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'}`;

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

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

  return { success: true, headers };
}
```

---

## 4. Edge Middleware 적용 (권장)

### 4.1 Edge에서 Rate Limiting

```typescript
// middleware.ts (기존 미들웨어에 추가)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge에서 Redis 연결 (전역)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function middleware(request: NextRequest) {
  // API 요청만 Rate Limit 적용
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 4.2 Edge vs Serverless 비교

| 항목 | Edge Middleware | API Route |
|------|----------------|-----------|
| Cold Start | 없음 | 있음 |
| 실행 위치 | 사용자 가까운 엣지 | 중앙 서버 |
| 비용 | 저렴 | 상대적 비쌈 |
| 차단 시점 | 백엔드 도달 전 | 핸들러 진입 후 |
| 권장 용도 | 전역 Rate Limit | 세밀한 제어 |

**권장**: Edge에서 전역 Rate Limit, API에서 엔드포인트별 추가 제한

---

## 5. 다층 Rate Limiting

### 5.1 계층 구조

```
Layer 1: Edge (전역)
├── 모든 요청: 100 req/min per IP
│
Layer 2: API Route (엔드포인트별)
├── /api/analyze/*: 10 req/min per user
├── /api/chat/*: 30 req/min per user (Token Bucket)
├── /api/auth/*: 20 req/min per IP
│
Layer 3: 비즈니스 로직 (일일 한도)
└── AI 분석: 50 req/day per user (DB 체크)
```

### 5.2 일일 한도 구현

```typescript
// lib/security/daily-limit.ts
import { createServerClient } from '@/lib/supabase/server';

interface DailyLimitConfig {
  endpoint: string;
  dailyLimit: number;
}

const dailyLimits: DailyLimitConfig[] = [
  { endpoint: '/api/analyze', dailyLimit: 50 },
];

export async function checkDailyLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const config = dailyLimits.find((c) =>
    endpoint.startsWith(c.endpoint)
  );

  if (!config) {
    return { allowed: true, remaining: Infinity };
  }

  const supabase = await createServerClient();
  const today = new Date().toISOString().split('T')[0];

  // 오늘 사용량 조회
  const { count } = await supabase
    .from('api_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('clerk_user_id', userId)
    .like('endpoint', `${config.endpoint}%`)
    .gte('created_at', `${today}T00:00:00Z`);

  const used = count || 0;
  const remaining = Math.max(0, config.dailyLimit - used);

  return {
    allowed: used < config.dailyLimit,
    remaining,
  };
}
```

---

## 6. 에러 처리 UX

### 6.1 클라이언트 대응

```typescript
// hooks/useRateLimitedFetch.ts
import { useState } from 'react';
import { toast } from 'sonner';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export function useRateLimitedFetch() {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  const fetchWithRateLimit = async (url: string, options?: RequestInit) => {
    const response = await fetch(url, options);

    // Rate Limit 헤더 파싱
    const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
    const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

    setRateLimitInfo({ limit, remaining, reset });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

      toast.error('요청이 너무 많습니다', {
        description: `${retryAfter}초 후에 다시 시도해주세요.`,
        duration: 5000,
      });

      // 자동 재시도 (선택적)
      // await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      // return fetchWithRateLimit(url, options);

      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // 남은 요청 경고 (20% 이하)
    if (remaining > 0 && remaining / limit < 0.2) {
      toast.warning(`요청 한도가 얼마 남지 않았습니다 (${remaining}/${limit})`);
    }

    return response;
  };

  return { fetchWithRateLimit, rateLimitInfo };
}
```

### 6.2 Rate Limit 상태 표시

```typescript
// components/RateLimitIndicator.tsx
export function RateLimitIndicator({ info }: { info: RateLimitInfo | null }) {
  if (!info) return null;

  const percentage = (info.remaining / info.limit) * 100;
  const resetTime = new Date(info.reset).toLocaleTimeString();

  return (
    <div className="text-xs text-muted-foreground">
      API 요청: {info.remaining}/{info.limit}
      {percentage < 20 && (
        <span className="text-warning ml-2">
          (리셋: {resetTime})
        </span>
      )}
    </div>
  );
}
```

---

## 7. 모니터링 및 분석

### 7.1 Upstash Analytics

```typescript
// Upstash 대시보드에서 확인 가능:
// - 총 요청 수
// - 차단된 요청 수
// - 엔드포인트별 사용량
// - 시간대별 트래픽

// analytics: true 설정 시 자동 수집
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true, // ← 활성화
});
```

### 7.2 커스텀 로깅

```typescript
// lib/security/rate-limit-logger.ts
export async function logRateLimitEvent(
  identifier: string,
  endpoint: string,
  success: boolean,
  remaining: number
) {
  // 차단된 요청만 로깅 (비용 절약)
  if (!success) {
    console.warn('[RateLimit] Blocked:', {
      identifier: identifier.startsWith('user:') ? identifier : '[IP]',
      endpoint,
      remaining,
      timestamp: new Date().toISOString(),
    });

    // Sentry 전송 (선택적)
    // Sentry.captureMessage('Rate limit exceeded', { extra: { endpoint } });
  }
}
```

---

## 8. 환경변수 설정

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# 또는 단일 변수 (fromEnv() 사용 시)
# KV_REST_API_URL=...
# KV_REST_API_TOKEN=...
```

---

## 9. 마이그레이션 계획

### Phase 1: Upstash 설정 (즉시)

- [ ] Upstash 계정/Redis 생성
- [ ] 환경변수 설정
- [ ] `@upstash/ratelimit` 설치

### Phase 2: API Route 적용 (1일)

- [ ] `redis-rate-limit.ts` 생성
- [ ] `applyRateLimitV2` 구현
- [ ] AI 분석 API에 적용 테스트

### Phase 3: Edge Middleware 적용 (3일)

- [ ] middleware.ts 수정
- [ ] 전역 Rate Limit 적용
- [ ] 모니터링 대시보드 확인

### Phase 4: 정리 (1주)

- [ ] 기존 인메모리 방식 제거
- [ ] 문서화
- [ ] 알림 설정 (차단률 임계치)

---

## 10. 비용 분석

### Upstash Redis 무료 티어

```
- 일일 10,000 명령
- 256MB 데이터
- 글로벌 복제 불가

Rate Limit 1회 = 약 2-3 명령
→ 일일 ~3,500회 Rate Limit 체크 가능
```

### 유료 티어 (필요 시)

```
Pay As You Go:
- $0.2 / 100,000 명령
- $0.25 / GB 데이터

예상 비용 (월 100만 API 요청):
- Rate Limit 명령: ~3M
- 비용: ~$6/월
```

---

## 11. 참고 자료

- [Upstash Rate Limiting Algorithms](https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms)
- [Rate Limiting Next.js with Upstash](https://upstash.com/blog/nextjs-ratelimiting)
- [Edge Rate Limiting with Vercel](https://upstash.com/blog/edge-rate-limiting)
- [@upstash/ratelimit GitHub](https://github.com/upstash/ratelimit-js)
- [Vercel Ratelimit Template](https://vercel.com/templates/next.js/ratelimit-with-upstash-redis)

---

**Version**: 1.0 | **Priority**: P0 Critical
