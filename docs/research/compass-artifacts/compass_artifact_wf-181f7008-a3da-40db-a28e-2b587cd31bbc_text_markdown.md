# Upstash Redis와 Next.js 16을 활용한 Rate Limiting 전략

Upstash의 @upstash/ratelimit 라이브러리와 Next.js 16의 Edge Runtime을 결합하면 **AI 분석 API의 일일 사용량 제한을 효율적으로 구현**할 수 있다. 이룸(Yiroom) 플랫폼의 무료(3회/일)/프리미엄(50회/일) 티어 제한에는 **Fixed Window 알고리즘**이 가장 적합하며, Clerk 인증과 연동한 사용자별 식별자 기반 구현이 핵심이다. 월 예상 비용은 일 10,000명 기준 약 **$3-5**로, Upstash Free Tier(500K 명령어/월)로도 상당 부분 커버 가능하다.

---

## 알고리즘 선택: 일일 제한에는 Fixed Window가 최적

Rate Limiting 알고리즘은 크게 세 가지로 나뉜다. **Fixed Window**(고정 윈도우)는 시간을 일정 단위로 분할하고 각 윈도우마다 카운터를 리셋하는 방식이다. **Sliding Window**(슬라이딩 윈도우)는 현재 시점 기준 과거 윈도우를 가중 평균으로 계산해 더 정밀한 제한을 제공한다. **Token Bucket**(토큰 버킷)은 일정 속도로 토큰을 충전하고 요청마다 토큰을 소비하는 방식으로, 버스트 트래픽을 제어된 범위 내에서 허용한다.

| 알고리즘 | 구현 복잡도 | 메모리 사용 | 정확도 | AI 일일 제한 적합성 |
|---------|-----------|-----------|-------|-------------------|
| Fixed Window | ⭐ 매우 쉬움 | 최저 (카운터 1개) | 경계 문제 있음 | **⭐⭐⭐ 최적** |
| Sliding Window | ⭐⭐⭐ 중간 | 중간 | 높음 | ⭐⭐ 과도함 |
| Token Bucket | ⭐⭐ 비교적 쉬움 | 낮음 | 높음 | ⭐⭐⭐ 적합 |

이룸의 AI 분석처럼 **일일 3~50회의 저빈도 제한**에서는 Fixed Window의 "윈도우 경계 문제"(자정 직전/직후 요청 집중 시 2배 허용)가 실질적 영향이 없다. 오히려 "오늘 남은 분석 횟수: 2회" 같은 **명확한 사용자 커뮤니케이션**이 가능하다는 장점이 크다. OpenAI의 일일 제한도 Token Bucket을 사용하지만, 단순성을 우선시한다면 Fixed Window가 유지보수와 디버깅 측면에서 유리하다.

---

## Upstash Ratelimit 라이브러리 핵심 API (v2.0.8)

@upstash/ratelimit의 최신 버전(2.0.8, 2026년 1월 기준)은 Edge Runtime에 최적화된 REST 기반 Redis 클라이언트를 제공한다. 핵심 설정 옵션은 다음과 같다:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),              // 환경변수에서 자동 설정
  limiter: Ratelimit.fixedWindow(3, '1 d'),  // 하루 3회
  analytics: true,                      // 대시보드 분석 활성화
  prefix: '@yiroom/ratelimit',          // Redis 키 네임스페이스
  ephemeralCache: new Map(),            // 인메모리 캐시 (비용 절감)
  timeout: 5000,                        // 타임아웃 5초
});
```

**limit() 메서드 반환값**은 Rate Limiting 로직의 핵심이다:

```typescript
const { success, limit, remaining, reset, pending } = await ratelimit.limit(identifier);
// success: 요청 허용 여부 (boolean)
// limit: 최대 허용 요청 수 (3)
// remaining: 남은 요청 수 (2, 1, 0...)
// reset: 리셋 시간 Unix 타임스탬프 (ms)
// pending: Analytics 전송용 Promise
```

**Redis 명령어 비용**은 알고리즘에 따라 다르다. Fixed Window는 요청당 **2-3개**, Sliding Window는 **4-5개**, Token Bucket은 **4개** 명령어를 사용한다. `ephemeralCache` 옵션 활성화 시 차단된 사용자의 재요청은 Redis 호출 없이 로컬에서 즉시 거부되어 **30-50% 비용 절감** 효과가 있다.

---

## Next.js 16 Middleware 기반 다중 레이어 구현

Next.js 16에서 `proxy.ts`가 새로 도입되었지만, Rate Limiting에는 **Edge Runtime 기반의 middleware.ts를 계속 사용**하는 것이 권장된다. 전 세계 분산 처리에 최적화된 Vercel Edge에서 실행되기 때문이다.

### 완전한 미들웨어 구현 (Clerk 연동)

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// 티어별 Rate Limiter 정의
const rateLimiters = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '1 d'),  // 무료: 3회/일
    prefix: '@yiroom/ratelimit:free',
    analytics: true,
    ephemeralCache: new Map(),
  }),
  premium: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(50, '1 d'),  // 프리미엄: 50회/일
    prefix: '@yiroom/ratelimit:premium',
    analytics: true,
    ephemeralCache: new Map(),
  }),
  anonymous: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),  // 미인증: 5회/시간
    prefix: '@yiroom/ratelimit:anon',
    analytics: true,
  }),
};

// AI 분석 API 경로 매칭
const isAIRoute = createRouteMatcher(['/api/analysis(.*)', '/api/ai(.*)']);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (!isAIRoute(request)) return NextResponse.next();

  const { userId } = await auth();
  let identifier: string;
  let limiter: Ratelimit;

  if (userId) {
    // Clerk publicMetadata에서 플랜 정보 조회 (실제 구현 시 캐싱 권장)
    const plan = await getUserPlan(userId);  // 'free' | 'premium'
    identifier = `user:${userId}`;
    limiter = plan === 'premium' ? rateLimiters.premium : rateLimiters.free;
  } else {
    identifier = `ip:${getClientIP(request)}`;
    limiter = rateLimiters.anonymous;
  }

  const { success, limit, remaining, reset, pending } = await limiter.limit(identifier);
  
  // Edge 환경에서 Analytics 전송 보장
  void pending;

  if (!success) {
    return createRateLimitResponse({ limit, remaining, reset, userId });
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  return response;
});

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1';
}

function createRateLimitResponse(params: { 
  limit: number; remaining: number; reset: number; userId?: string | null 
}) {
  const retryAfter = Math.ceil((params.reset - Date.now()) / 1000);
  
  return new NextResponse(
    JSON.stringify({
      error: 'Too Many Requests',
      message: params.userId
        ? '일일 AI 분석 한도에 도달했습니다. 프리미엄으로 업그레이드하세요.'
        : '요청 한도 초과입니다. 로그인하면 더 많은 분석이 가능합니다.',
      limit: params.limit,
      remaining: 0,
      resetAt: new Date(params.reset).toISOString(),
      retryAfter,
      upgradeUrl: '/pricing',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': params.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': params.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
```

---

## 429 응답 처리와 클라이언트 통합

HTTP 429 응답은 표준 헤더와 함께 사용자 친화적 메시지를 포함해야 한다. **Retry-After 헤더**는 초 단위로 재시도 가능 시간을 명시하며, 클라이언트에서 이를 활용해 자동 재시도 로직이나 UI 피드백을 구현할 수 있다.

### React Hook으로 Rate Limit 상태 관리

```typescript
// hooks/useRateLimitedAPI.ts
'use client';
import { useState, useCallback } from 'react';

interface RateLimitState {
  isLimited: boolean;
  remaining: number | null;
  resetAt: Date | null;
  message: string | null;
}

export function useRateLimitedAPI<T>() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false, remaining: null, resetAt: null, message: null
  });

  const fetchWithRateLimit = useCallback(async (
    url: string, options?: RequestInit
  ): Promise<T | null> => {
    const response = await fetch(url, options);
    
    // Rate Limit 헤더 파싱
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining) {
      setRateLimitState(prev => ({ 
        ...prev, 
        remaining: parseInt(remaining, 10),
        resetAt: reset ? new Date(parseInt(reset, 10)) : null
      }));
    }

    if (response.status === 429) {
      const error = await response.json();
      setRateLimitState({
        isLimited: true,
        remaining: 0,
        resetAt: new Date(error.resetAt),
        message: error.message
      });
      return null;
    }

    setRateLimitState(prev => ({ ...prev, isLimited: false, message: null }));
    return response.json();
  }, []);

  return { fetchWithRateLimit, ...rateLimitState };
}
```

### 분석 버튼 컴포넌트

```tsx
// components/AnalysisButton.tsx
'use client';
import { useRateLimitedAPI } from '@/hooks/useRateLimitedAPI';
import Link from 'next/link';

export function AnalysisButton({ imageData }: { imageData: string }) {
  const { fetchWithRateLimit, isLimited, remaining, resetAt, message } = 
    useRateLimitedAPI<{ result: string }>();

  const handleAnalysis = async () => {
    const result = await fetchWithRateLimit('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData }),
    });
    if (result) {
      // 분석 결과 처리
    }
  };

  if (isLimited) {
    return (
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-amber-800 font-medium">{message}</p>
        <p className="text-sm text-amber-600 mt-1">
          재시도 가능: {resetAt?.toLocaleString('ko-KR')}
        </p>
        <Link href="/pricing" className="mt-3 inline-block text-blue-600 underline">
          프리미엄으로 업그레이드 →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button onClick={handleAnalysis} className="btn-primary">
        AI 피부 분석 시작
      </button>
      {remaining !== null && (
        <p className="text-sm text-gray-500 mt-2">
          오늘 남은 분석 횟수: <strong>{remaining}회</strong>
        </p>
      )}
    </div>
  );
}
```

---

## Rate Limit 우회 방지 전략

단순 IP 기반 제한은 프록시 회전, VPN 사용, 공유 IP 악용으로 쉽게 우회된다. **다중 식별자 조합**이 핵심 방어 전략이다.

### 복합 식별자 생성

```typescript
// lib/fingerprint.ts
import { createHash } from 'crypto';

export function createRateLimitIdentifier(
  request: Request,
  userId?: string | null
): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const fingerprint = request.headers.get('x-fingerprint') || '';

  // 우선순위: userId > fingerprint+IP > IP만
  if (userId) return `user:${userId}`;
  
  if (fingerprint) {
    const hash = createHash('sha256')
      .update(`${ip}:${fingerprint}:${userAgent.slice(0, 50)}`)
      .digest('hex')
      .slice(0, 24);
    return `fp:${hash}`;
  }
  
  return `ip:${ip}`;
}
```

### 클라이언트 Fingerprint 수집 (FingerprintJS)

```typescript
// lib/client-fingerprint.ts (클라이언트 사이드)
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<string> | null = null;

export async function getFingerprint(): Promise<string> {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
      .then(fp => fp.get())
      .then(result => result.visitorId);
  }
  return fpPromise;
}

// API 호출 시 헤더에 포함
export async function callAIAPI(data: any) {
  const fingerprint = await getFingerprint();
  return fetch('/api/analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Fingerprint': fingerprint,
    },
    body: JSON.stringify(data),
  });
}
```

**VPN/프록시 감지**는 비용 대비 효과를 고려해야 한다. 무료 옵션인 GetIPIntel API는 0-1 확률 점수를 반환하며, 결과를 Redis에 24시간 캐싱하면 API 호출 비용을 최소화할 수 있다. 다만 이룸처럼 명확한 인증 체계(Clerk)가 있다면, **userId 기반 제한만으로도 대부분의 남용을 방지**할 수 있다.

---

## 모니터링과 비용 최적화

### Upstash Analytics 대시보드

`analytics: true` 옵션을 활성화하면 Upstash 콘솔(console.upstash.com/ratelimit)에서 실시간 통계를 확인할 수 있다:

- 식별자별 요청 수 및 차단률
- 시간대별 트래픽 패턴
- Rate Limited vs Allowed 요청 비율

### 커스텀 Slack 알림 구현

```typescript
// lib/rate-limit-monitor.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function logSuspiciousActivity(identifier: string, path: string) {
  const key = 'suspicious:activity';
  await redis.lpush(key, JSON.stringify({
    identifier,
    path,
    timestamp: Date.now(),
  }));
  await redis.ltrim(key, 0, 999);  // 최근 1000건만 유지

  // 5분 내 100건 초과 시 알림
  const recentCount = await redis.llen(key);
  if (recentCount > 100) {
    await sendSlackAlert(`⚠️ Rate Limit 이상 감지: 5분간 ${recentCount}건 차단`);
  }
}

async function sendSlackAlert(message: string) {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message }),
  });
}
```

### Upstash 비용 구조 (2025년 기준)

| 항목 | Free Tier | Pay-as-you-go |
|------|-----------|---------------|
| 명령어 | **500K/월** | $0.20 / 100K |
| 스토리지 | 256MB | 첫 1GB 무료, 이후 $0.25/GB |
| 대역폭 | 10GB | 첫 200GB 무료 |

**이룸 예상 비용 시뮬레이션**:
- 일 10,000 사용자 × 평균 5회 Rate Limit 체크 = 50,000회/일
- 월 1.5M 명령어 × $0.20/100K = **약 $3/월**
- ephemeralCache로 30% 절감 시 → **약 $2/월**

Free Tier의 500K 명령어/월은 일 **16,000회 체크**를 커버하므로, 초기 단계에서는 **완전 무료 운영**도 가능하다.

### 비용 절감 핵심 전략

1. **ephemeralCache 필수 활성화**: 차단된 사용자 재요청 시 Redis 호출 생략
2. **Fixed Window 사용**: Sliding Window 대비 명령어 40% 절감 (2-3개 vs 4-5개)
3. **적절한 TTL 설정**: 만료된 키 자동 정리로 스토리지 최적화
4. **예산 한도 설정**: Upstash 대시보드에서 70%, 90% 도달 시 알림 설정

---

## 결론: 실무 적용 체크리스트

이룸 플랫폼의 AI 분석 API Rate Limiting 구현을 위한 핵심 결정 사항을 정리한다:

- **알고리즘**: Fixed Window (`Ratelimit.fixedWindow(3, '1 d')`) - 단순성과 명확한 사용자 커뮤니케이션
- **식별자**: Clerk `userId` 기반 (인증 사용자), IP + Fingerprint 조합 (미인증 사용자)
- **구현 위치**: Next.js `middleware.ts` (Edge Runtime)
- **비용**: 월 $0-5 (Free Tier 또는 Pay-as-you-go)
- **모니터링**: Upstash Analytics + 커스텀 Slack 알림

Rate Limiting은 단순한 보안 기능이 아니라 **비용 관리와 사용자 경험의 균형점**이다. AI API 비용이 높은 이룸에서는 명확한 제한과 프리미엄 업그레이드 유도가 비즈니스 모델의 핵심이 된다. 위 구현은 Vercel Edge의 글로벌 분산 환경에서 **수 밀리초 레이턴시**로 작동하며, 월 $5 미만의 비용으로 안정적인 남용 방지 체계를 구축할 수 있다.