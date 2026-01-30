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
// 현재: 인메모리 Map 기반 구현

const rateLimitStore = new Map<string, RateLimitEntry>();

// 문제점:
// ❌ 서버 재시작 시 초기화
// ❌ 다중 인스턴스 환경에서 공유 불가
// ❌ 메모리 누수 가능성 (TTL 미정리)
// ❌ 분산 환경 미지원
```

### 개선 필요 항목

```
❌ Redis 기반 저장소 전환
❌ Sliding Window 알고리즘
❌ 엔드포인트별 차등 제한
❌ 사용자 등급별 제한
❌ 제한 헤더 응답
❌ 실시간 모니터링
```

---

## 2. Rate Limiting 알고리즘 비교

### 2.1 알고리즘 선택

| 알고리즘 | 장점 | 단점 | 적합 용도 |
|---------|------|------|----------|
| **Fixed Window** | 구현 간단 | 경계 버스트 | 단순 API |
| **Sliding Window Log** | 정확함 | 메모리 많이 사용 | 소규모 |
| **Sliding Window Counter** | 균형 잡힘 | 약간 부정확 | 대부분 |
| **Token Bucket** | 버스트 허용 | 복잡함 | 트래픽 변동 |
| **Leaky Bucket** | 균등 처리 | 버스트 불허 | 백그라운드 |

### 2.2 이룸 권장: Sliding Window Counter

```
장점:
✅ Fixed Window의 경계 문제 해결
✅ 메모리 효율적
✅ Upstash Ratelimit 기본 지원
```

---

## 3. Upstash Redis 구현

### 3.1 설치 및 설정

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### 3.2 기본 구현

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis 클라이언트 싱글톤
const redis = Redis.fromEnv();

// 기본 Rate Limiter (50회/24시간)
export const defaultRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,
  prefix: 'ratelimit:default',
});

// AI 분석용 (더 엄격)
export const aiAnalysisRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:ai',
});

// 인증 시도용 (브루트포스 방지)
export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});
```

### 3.3 엔드포인트별 설정

```typescript
// lib/security/rate-limit-config.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const RATE_LIMITS = {
  // AI 분석 API
  'analyze:skin': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '24 h'),
    prefix: 'rl:analyze:skin',
  }),
  'analyze:personal-color': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '24 h'),
    prefix: 'rl:analyze:pc',
  }),
  'analyze:body': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '24 h'),
    prefix: 'rl:analyze:body',
  }),

  // 이미지 업로드
  'upload:image': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    prefix: 'rl:upload',
  }),

  // 인증
  'auth:login': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:auth:login',
  }),
  'auth:signup': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'rl:auth:signup',
  }),

  // 일반 API
  'api:default': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:api',
  }),
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;
```

---

## 4. 미들웨어 통합

### 4.1 Rate Limit 헬퍼

```typescript
// lib/security/check-rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMITS, RateLimitKey } from './rate-limit-config';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

export async function checkRateLimit(
  identifier: string,
  key: RateLimitKey = 'api:default'
): Promise<RateLimitResult> {
  const limiter = RATE_LIMITS[key];
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
    'Retry-After': success ? '' : Math.ceil((reset - Date.now()) / 1000).toString(),
  };

  return { success, limit, remaining, reset, headers };
}

export function createRateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
    },
    {
      status: 429,
      headers: result.headers,
    }
  );
}
```

### 4.2 API 라우트 적용

```typescript
// app/api/analyze/skin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security/check-rate-limit';

export async function POST(request: NextRequest) {
  // 1. 인증
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  // 2. Rate Limit 체크
  const rateLimitResult = await checkRateLimit(userId, 'analyze:skin');
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  // 3. 비즈니스 로직
  try {
    const result = await analyzeSkin(request);
    return NextResponse.json(
      { success: true, data: result },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    // ... 에러 처리
  }
}
```

### 4.3 미들웨어 레벨 적용

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const globalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  prefix: 'rl:global',
});

export async function middleware(request: NextRequest) {
  // API 라우트만 적용
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // IP 기반 글로벌 제한
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success, limit, remaining, reset } = await globalRatelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 5. 사용자 등급별 제한

### 5.1 등급 설정

```typescript
// lib/security/user-tier-limits.ts
export const USER_TIER_LIMITS = {
  free: {
    'analyze:skin': { requests: 5, window: '24 h' },
    'analyze:personal-color': { requests: 5, window: '24 h' },
    'analyze:body': { requests: 5, window: '24 h' },
    'upload:image': { requests: 20, window: '1 h' },
  },
  premium: {
    'analyze:skin': { requests: 50, window: '24 h' },
    'analyze:personal-color': { requests: 50, window: '24 h' },
    'analyze:body': { requests: 50, window: '24 h' },
    'upload:image': { requests: 100, window: '1 h' },
  },
  enterprise: {
    'analyze:skin': { requests: 500, window: '24 h' },
    'analyze:personal-color': { requests: 500, window: '24 h' },
    'analyze:body': { requests: 500, window: '24 h' },
    'upload:image': { requests: 1000, window: '1 h' },
  },
} as const;

export type UserTier = keyof typeof USER_TIER_LIMITS;
```

### 5.2 동적 Rate Limiter

```typescript
// lib/security/tiered-rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { USER_TIER_LIMITS, UserTier } from './user-tier-limits';

const redis = Redis.fromEnv();

// 캐시된 Rate Limiter 인스턴스
const limiterCache = new Map<string, Ratelimit>();

export function getTieredRatelimit(
  tier: UserTier,
  endpoint: keyof typeof USER_TIER_LIMITS['free']
): Ratelimit {
  const cacheKey = `${tier}:${endpoint}`;

  if (!limiterCache.has(cacheKey)) {
    const config = USER_TIER_LIMITS[tier][endpoint];
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.requests,
        config.window as `${number} ${'s' | 'm' | 'h' | 'd'}`
      ),
      prefix: `rl:${tier}:${endpoint}`,
    });
    limiterCache.set(cacheKey, limiter);
  }

  return limiterCache.get(cacheKey)!;
}

// 사용
export async function checkTieredRateLimit(
  userId: string,
  tier: UserTier,
  endpoint: keyof typeof USER_TIER_LIMITS['free']
) {
  const limiter = getTieredRatelimit(tier, endpoint);
  return limiter.limit(userId);
}
```

---

## 6. 모니터링 및 알림

### 6.1 Upstash Analytics

```typescript
// Upstash 대시보드에서 자동 제공:
// - 요청 수 / 시간
// - 차단된 요청 수
// - 지역별 분포
// - 응답 시간

// analytics: true 설정으로 자동 활성화
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,  // ← 활성화
});
```

### 6.2 커스텀 모니터링

```typescript
// lib/security/rate-limit-monitor.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getRateLimitStats(userId: string) {
  const keys = await redis.keys(`rl:*:${userId}`);
  const stats: Record<string, { used: number; total: number }> = {};

  for (const key of keys) {
    const [, endpoint] = key.split(':');
    const value = await redis.get(key);
    // 파싱 및 통계 집계
  }

  return stats;
}

// 알림 트리거
export async function checkAndAlert(userId: string, endpoint: string, remaining: number) {
  if (remaining <= 2) {
    // 거의 소진 알림
    await sendNotification(userId, {
      type: 'rate_limit_warning',
      message: `${endpoint} API 사용량이 거의 소진되었습니다.`,
      remaining,
    });
  }
}
```

### 6.3 사용량 API

```typescript
// app/api/user/usage/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRateLimitStats } from '@/lib/security/rate-limit-monitor';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await getRateLimitStats(userId);

  return NextResponse.json({
    success: true,
    data: {
      usage: stats,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
}
```

---

## 7. 에러 처리 및 UX

### 7.1 사용자 친화적 에러

```typescript
// lib/security/rate-limit-messages.ts
export const RATE_LIMIT_MESSAGES = {
  'analyze:skin': {
    ko: '오늘의 피부 분석 횟수를 모두 사용했습니다. 내일 다시 시도해주세요.',
    resetInfo: (hours: number) => `${hours}시간 후 초기화됩니다.`,
  },
  'analyze:personal-color': {
    ko: '오늘의 퍼스널컬러 분석 횟수를 모두 사용했습니다.',
    resetInfo: (hours: number) => `${hours}시간 후 초기화됩니다.`,
  },
  'upload:image': {
    ko: '이미지 업로드 횟수가 초과되었습니다.',
    resetInfo: (minutes: number) => `${minutes}분 후 초기화됩니다.`,
  },
  'auth:login': {
    ko: '로그인 시도 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.',
    resetInfo: (minutes: number) => `${minutes}분 후 다시 시도할 수 있습니다.`,
  },
};
```

### 7.2 프론트엔드 표시

```typescript
// components/RateLimitWarning.tsx
'use client';

interface RateLimitWarningProps {
  remaining: number;
  total: number;
  resetAt: string;
  type: 'warning' | 'error';
}

export function RateLimitWarning({
  remaining,
  total,
  resetAt,
  type,
}: RateLimitWarningProps) {
  const resetTime = new Date(resetAt);
  const hoursUntilReset = Math.ceil(
    (resetTime.getTime() - Date.now()) / (1000 * 60 * 60)
  );

  if (type === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          일일 분석 횟수를 모두 사용했습니다.
        </p>
        <p className="text-red-600 text-sm mt-1">
          {hoursUntilReset}시간 후 초기화됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800">
        오늘 남은 분석 횟수: {remaining}/{total}
      </p>
    </div>
  );
}
```

---

## 8. 보안 고려사항

### 8.1 식별자 선택

```typescript
// 우선순위:
// 1. 인증된 사용자 ID (가장 정확)
// 2. IP + User-Agent 조합 (익명 사용자)
// 3. IP만 (최후 수단)

function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? 'unknown';

  // IP + UA 해시
  return `anon:${hashString(`${ip}:${ua}`)}`;
}
```

### 8.2 바이패스 방지

```typescript
// 프록시/VPN 감지
function isKnownProxy(ip: string): boolean {
  // 알려진 프록시/데이터센터 IP 범위 체크
  // 또는 외부 서비스 (MaxMind 등) 활용
  return false;
}

// 의심스러운 패턴 감지
function detectAbusePattern(requests: RequestLog[]): boolean {
  // 너무 정확한 간격의 요청
  // 동일한 요청 패턴 반복
  // 비정상적인 User-Agent
  return false;
}
```

---

## 9. 테스트

### 9.1 단위 테스트

```typescript
// tests/lib/security/rate-limit.test.ts
import { checkRateLimit } from '@/lib/security/check-rate-limit';

// Mock Redis
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => ({
      // Mock 구현
    }),
  },
}));

describe('Rate Limiting', () => {
  test('should allow requests within limit', async () => {
    const result = await checkRateLimit('user_123', 'api:default');
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  test('should block requests over limit', async () => {
    // 제한 초과 시뮬레이션
    for (let i = 0; i < 101; i++) {
      await checkRateLimit('user_flood', 'api:default');
    }

    const result = await checkRateLimit('user_flood', 'api:default');
    expect(result.success).toBe(false);
  });
});
```

### 9.2 통합 테스트

```typescript
// tests/integration/rate-limit.test.ts
describe('Rate Limit API Integration', () => {
  test('should return 429 when limit exceeded', async () => {
    const response = await fetch('/api/analyze/skin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({ imageBase64: '...' }),
    });

    // 반복 호출하여 제한 초과
    // ...

    expect(response.status).toBe(429);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
```

---

## 10. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Upstash Redis 설정
- [ ] 기본 Rate Limiter 구현
- [ ] AI 분석 API에 적용
- [ ] Rate Limit 헤더 응답

### 단기 적용 (P1)

- [ ] 엔드포인트별 차등 제한
- [ ] 사용자 등급별 제한
- [ ] 사용량 모니터링 API

### 장기 적용 (P2)

- [ ] 실시간 모니터링 대시보드
- [ ] 자동 알림 시스템
- [ ] 어뷰즈 탐지

---

## 11. 참고 자료

- [Upstash Ratelimit Docs](https://upstash.com/docs/oss/sdks/ts/ratelimit/overview)
- [Rate Limiting Best Practices](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/)
- [Sliding Window Algorithm](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/)

---

**Version**: 1.0 | **Priority**: P0 Critical
