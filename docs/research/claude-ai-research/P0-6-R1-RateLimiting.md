# Next.js 16 Rate Limiting 구현 완벽 가이드

**Sliding Window Counter 알고리즘과 @upstash/ratelimit 조합이 Yiroom과 같은 AI 이미지 처리 서비스에 최적의 선택이다.** 이 조합은 정확도와 메모리 효율성의 균형을 제공하며, Vercel Edge Runtime에서 connectionless HTTP 기반으로 작동해 서버리스 환경에 완벽히 적합하다. 무료 티어는 시간당 5회, Pro 티어는 50회의 AI 이미지 생성 제한을 권장하며, 분당+시간당+일일 다중 윈도우 전략으로 버스트와 지속적 사용 모두를 효과적으로 관리할 수 있다.

---

## 알고리즘 선택이 비용과 정확도를 결정한다

Rate Limiting 알고리즘은 크게 5가지로 분류되며, 각각 고유한 트레이드오프를 가진다. **Sliding Window Counter**가 2024-2025년 프로덕션 환경에서 가장 권장되는데, Fixed Window의 단순함과 Sliding Window Log의 정확성을 결합했기 때문이다.

### 알고리즘별 특성 비교

| 알고리즘 | 시간복잡도 | 공간복잡도 | Redis 명령어/요청 | 버스트 허용 | 권장 상황 |
|---------|-----------|-----------|-----------------|------------|----------|
| **Token Bucket** | O(1) | O(1) | 4-5개 | ✅ 허용 | 스트리밍, 버스트 필요 API |
| **Leaky Bucket** | O(1) | O(1) | 3-4개 | ❌ 불허 | VoIP, 백엔드 보호 |
| **Fixed Window** | O(1) | O(1) | **2개** | ⚠️ 경계문제 | 멀티리전, 비용 최소화 |
| **Sliding Window Log** | O(N) | O(N) | 3-4개 | ❌ 불허 | 저볼륨, 정확도 필수 |
| **Sliding Window Counter** | O(1) | O(버킷) | 3-4개 | ⚠️ 제한적 | **범용 권장** |

**Token Bucket**은 버킷 용량만큼 순간 버스트를 허용하면서 장기적으로 평균 속도를 유지한다. Stripe와 OpenAI가 이 방식을 채택했다. 반면 **Leaky Bucket**은 입력 속도와 관계없이 출력을 일정하게 유지해 트래픽 평활화에 탁월하다.

**Fixed Window**의 치명적 단점은 윈도우 경계에서 **2배 트래픽**이 허용될 수 있다는 점이다. 예를 들어 분당 100 요청 제한에서 00:00:59에 100개, 00:01:00에 100개 요청이 모두 통과한다. **Sliding Window Counter**는 이전 윈도우와 현재 윈도우의 가중 평균을 계산해 이 문제를 해결한다:

```
rate = (이전_윈도우_요청 × (window - 경과시간) / window) + 현재_윈도우_요청
```

### Upstash가 지원하는 알고리즘

@upstash/ratelimit 라이브러리는 **Fixed Window, Sliding Window, Token Bucket** 3가지를 지원한다. Multi-Region 환경에서는 Fixed Window만 완전히 지원되며, Token Bucket은 명령어 수가 많아 비용이 가장 높다.

---

## Next.js 16 App Router에서 Upstash 구현 패턴

### middleware.ts 전역 Rate Limiting

middleware는 모든 API 요청에 대해 Rate Limiting을 적용하는 가장 효율적인 방법이다. **핸들러 외부에서 인스턴스를 선언**해야 hot function 동안 캐싱이 유지된다.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 반드시 핸들러 외부에서 선언
const cache = new Map();

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  ephemeralCache: cache, // 차단된 요청 캐싱으로 Redis 호출 절약
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? 
    "127.0.0.1";
  
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { 
        error: "Too many requests",
        retryAfter: Math.ceil((reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
        }
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
```

### Route Handler에서 세밀한 제어

AI 이미지 생성처럼 리소스 집약적인 엔드포인트는 개별 Route Handler에서 더 엄격한 제한을 적용한다.

```typescript
// app/api/ai/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge"; // Edge Runtime 사용

const cache = new Map();
const aiLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.tokenBucket(5, "1 h", 10), // 시간당 5개, 최대 10개 버스트
  ephemeralCache: cache,
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { success, remaining, reset } = await aiLimiter.limit(`ai:${userId}`);

  if (!success) {
    return NextResponse.json(
      {
        error: "AI generation limit exceeded",
        remaining: 0,
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
        upgradeUrl: "/pricing"
      },
      { status: 429 }
    );
  }

  // AI 이미지 생성 로직
  return NextResponse.json({ imageUrl: "...", remaining });
}
```

### Edge Runtime과 Node.js Runtime 차이

| 특성 | Edge Runtime | Node.js Runtime |
|------|-------------|-----------------|
| 실행 위치 | CDN Edge 노드 | Serverless Function |
| Cold Start | 거의 없음 | 상대적으로 느림 |
| IP 추출 | `@vercel/edge` ipAddress() | x-forwarded-for 헤더 |
| Upstash 호환성 | ✅ 완벽 (HTTP 기반) | ✅ 완벽 |
| 적합 케이스 | 간단한 rate limiting | 복잡한 비즈니스 로직 |

---

## 사용자 티어별 복합 키 설계 전략

### Clerk 통합 다층 Rate Limiting

인증된 사용자는 `userId`, 비인증 사용자는 `IP`를 기준으로 제한하되, 엔드포인트 유형에 따라 차등 적용한다.

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const rateLimiters = {
  // 일반 API
  anonymous: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "yiroom:anonymous",
  }),
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "yiroom:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, "1 m"),
    prefix: "yiroom:pro",
  }),
  
  // AI 이미지 처리 (리소스 집약적)
  aiFree: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "yiroom:ai:free",
  }),
  aiPro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 h"),
    prefix: "yiroom:ai:pro",
  }),
};

// 복합 키 생성
export function buildRateLimitKey(options: {
  userId?: string;
  ip: string;
  endpoint: string;
}): string {
  const identifier = options.userId ?? options.ip;
  return `${identifier}:${options.endpoint}`;
}
```

### Yiroom 서비스 권장 제한 수치

실제 AI 이미지 처리 서비스들의 정책을 분석한 결과, 다음 수치를 권장한다:

| 기능 | 무료 티어 | Pro ($20/월) | Enterprise |
|------|----------|-------------|------------|
| **일반 API (읽기)** | 60/분, 2,000/일 | 300/분, 10,000/일 | 1,000/분, 무제한 |
| **일반 API (쓰기)** | 20/분, 500/일 | 100/분, 3,000/일 | 500/분, 무제한 |
| **AI 이미지 생성** | 2/분, **5/시간**, 20/일 | 10/분, **50/시간**, 200/일 | 50/분, 500/시간 |
| **최대 동시 처리** | 1개 | 3개 | 10개 |
| **최대 해상도** | 1024×1024 | 2048×2048 | 4096×4096 |

**무료:유료 비율**은 일반 API **1:5**, AI 기능 **1:10**이 업계 표준이다. OpenAI는 1:10, GitHub는 1:83 비율을 사용한다.

### 다중 윈도우 조합 구현

분당+시간당+일일 제한을 조합해 버스트와 지속적 남용 모두를 방지한다:

```typescript
// lib/multi-tier-limiter.ts
class MultiTierRateLimiter {
  private minuteLimiter: Ratelimit;
  private hourLimiter: Ratelimit;
  private dayLimiter: Ratelimit;

  constructor(redis: Redis, config: {
    perMinute: number;
    perHour: number;
    perDay: number;
  }) {
    this.minuteLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.perMinute, "1 m"),
      prefix: "yiroom:minute",
    });
    this.hourLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.perHour, "1 h"),
      prefix: "yiroom:hour",
    });
    this.dayLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(config.perDay, "1 d"),
      prefix: "yiroom:day",
    });
  }

  async check(identifier: string) {
    // 분당 → 시간당 → 일일 순서로 확인
    const minuteResult = await this.minuteLimiter.limit(identifier);
    if (!minuteResult.success) return { success: false, limitHit: "minute", ...minuteResult };

    const hourResult = await this.hourLimiter.limit(identifier);
    if (!hourResult.success) return { success: false, limitHit: "hour", ...hourResult };

    const dayResult = await this.dayLimiter.limit(identifier);
    if (!dayResult.success) return { success: false, limitHit: "day", ...dayResult };

    return { success: true, limitHit: null, ...minuteResult };
  }
}

// Yiroom AI 이미지 처리용
export const aiImageLimiter = {
  free: new MultiTierRateLimiter(Redis.fromEnv(), {
    perMinute: 2,
    perHour: 5,
    perDay: 20,
  }),
  pro: new MultiTierRateLimiter(Redis.fromEnv(), {
    perMinute: 10,
    perHour: 50,
    perDay: 200,
  }),
};
```

---

## 429 응답 설계와 표준 헤더 구현

### RFC 6585 표준과 IETF 드래프트 헤더

RFC 6585는 429 응답에 **Retry-After 헤더**를 포함할 것을 권장한다. 2025년 9월 발행된 IETF 드래프트는 새로운 표준 헤더를 정의했다:

```http
# IETF 드래프트 표준 (권장)
RateLimit: "default";r=0;t=60
RateLimit-Policy: "default";q=100;w=60

# 레거시 X-RateLimit 헤더 (하위 호환성)
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60

# Retry-After (초 단위 권장)
Retry-After: 60
```

### TypeScript 응답 생성 함수

```typescript
// lib/rate-limit-response.ts
import { NextResponse } from "next/server";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export function createRateLimitResponse(
  body: object,
  status: number,
  info: RateLimitInfo
): NextResponse {
  const response = NextResponse.json(body, { status });

  // IETF 드래프트 표준
  response.headers.set("RateLimit", `"default";r=${info.remaining};t=${info.resetInSeconds}`);
  
  // 레거시 호환성
  response.headers.set("X-RateLimit-Limit", String(info.limit));
  response.headers.set("X-RateLimit-Remaining", String(info.remaining));
  response.headers.set("X-RateLimit-Reset", String(info.resetInSeconds));

  if (status === 429) {
    response.headers.set("Retry-After", String(info.resetInSeconds));
  }

  return response;
}

// 사용자 친화적 429 응답
export function createTooManyRequestsResponse(
  resetInSeconds: number,
  locale: "ko" | "en" = "ko"
): NextResponse {
  const messages = {
    ko: {
      title: "요청이 너무 많습니다",
      detail: "잠시 후 다시 시도해주세요.",
      upgrade: "더 많은 요청이 필요하시면 프리미엄 플랜을 확인해보세요."
    },
    en: {
      title: "Too Many Requests",
      detail: "Please try again later.",
      upgrade: "Need more requests? Check out our premium plan."
    }
  };

  return createRateLimitResponse(
    {
      type: "https://iana.org/assignments/http-problem-types#quota-exceeded",
      title: messages[locale].title,
      status: 429,
      detail: messages[locale].detail,
      retryAfter: resetInSeconds,
      upgradeUrl: "/pricing"
    },
    429,
    { limit: 0, remaining: 0, resetInSeconds }
  );
}
```

### React Native 클라이언트 재시도 로직

**Exponential Backoff with Jitter**는 Thundering Herd 문제를 방지하는 필수 패턴이다:

```typescript
// utils/apiClient.ts (React Native/Expo)
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const MAX_DELAY = 60000;

// Full Jitter (AWS 권장)
const calculateDelay = (attempt: number): number => {
  const exponential = Math.min(BASE_DELAY * Math.pow(2, attempt), MAX_DELAY);
  return Math.floor(Math.random() * exponential);
};

const parseRetryAfter = (headers: any): number | null => {
  const retryAfter = headers["retry-after"];
  if (!retryAfter) return null;
  
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  return null;
};

export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    if (!config || !error.response) return Promise.reject(error);

    const status = error.response.status;
    config._retryCount = config._retryCount || 0;

    if ((status === 429 || status >= 500) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;

      // Retry-After 헤더 우선 사용
      const retryAfterDelay = parseRetryAfter(error.response.headers);
      const delay = retryAfterDelay || calculateDelay(config._retryCount);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient.request(config);
    }

    return Promise.reject(error);
  }
);
```

---

## Vercel/Cloudflare 환경에서 실제 IP 추출

### X-Forwarded-For 신뢰 문제

**X-Forwarded-For는 클라이언트가 임의로 조작 가능**하므로 직접 신뢰해서는 안 된다. Cloudflare 환경에서는 `CF-Connecting-IP`, Vercel 환경에서는 `x-real-ip`를 사용한다.

```typescript
// lib/getClientIP.ts
import { headers } from "next/headers";

export function getClientIP(): string {
  const headersList = headers();
  
  // 1. Cloudflare: CF-Connecting-IP (가장 신뢰)
  const cfConnectingIP = headersList.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP.trim();
  
  // 2. Cloudflare: True-Client-IP
  const trueClientIP = headersList.get("true-client-ip");
  if (trueClientIP) return trueClientIP.trim();
  
  // 3. Vercel: x-real-ip
  const realIP = headersList.get("x-real-ip");
  if (realIP) return realIP.trim();
  
  // 4. X-Forwarded-For (마지막 신뢰할 수 있는 프록시에서 추가한 값)
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    return ips[0]; // 가장 왼쪽이 원본 클라이언트
  }
  
  return "0.0.0.0";
}
```

### 보안 체크리스트

- X-Forwarded-For를 직접 신뢰하지 않고 플랫폼별 전용 헤더 사용
- API 키 + IP 조합으로 키 공유 남용 방지
- 다중 윈도우 정책 (초/분/시간/일) 적용
- 로그인, 회원가입 등 민감 API에 더 엄격한 제한
- DDoS 시 429 응답 대신 연결 끊기 고려 (RFC 6585 권장)
- 비정상 패턴 감지 시 적응형 제한 강화

---

## Upstash 비용 최적화 전략

### 알고리즘별 Redis 명령어 수

| 알고리즘 | 명령어/요청 | 월 100만 요청 시 |
|---------|-----------|-----------------|
| **Fixed Window** | 2개 | 200만 명령어 |
| **Sliding Window** | 3개 | 300만 명령어 |
| **Token Bucket** | 4-5개 | 400-500만 명령어 |

### 비용 절감 팁

1. **ephemeralCache 필수 사용**: 차단된 요청의 Redis 호출 제거
2. **analytics 선택적 활성화**: 프로덕션에서만 `analytics: true`
3. **Fixed Window 우선 검토**: 경계 문제가 치명적이지 않다면 가장 저렴
4. **적절한 윈도우 크기**: 너무 짧은 윈도우는 호출 빈도 증가
5. **리전별 데이터베이스**: Multi-Region 대신 사용자 가까운 단일 리전

```typescript
// 비용 최적화 설정 예시
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(100, "1 m"), // 비용 효율적
  analytics: process.env.NODE_ENV === "production",
  ephemeralCache: cache, // 필수
  timeout: 3000, // 장애 시 fail-open
});
```

---

## 결론: Yiroom 구현 권장사항

Yiroom AI 이미지 처리 서비스에 최적화된 Rate Limiting 전략은 다음과 같다:

**알고리즘 선택**: 일반 API는 **Sliding Window Counter**, 비용 민감한 환경이면 **Fixed Window**, AI 처리처럼 버스트가 필요하면 **Token Bucket**을 사용한다.

**구현 패턴**: middleware.ts에서 전역 Rate Limiting을 적용하고, AI 엔드포인트는 Route Handler에서 추가 제한을 적용한다. Clerk의 `userId`를 기본 식별자로, 비인증 사용자는 IP 기반으로 제한한다.

**제한 수치**: 무료 티어는 시간당 AI 이미지 5개, 일일 20개로 체험 제공하고, Pro 티어($20/월)는 10배인 시간당 50개, 일일 200개를 제공한다.

**응답 설계**: IETF 드래프트 표준 `RateLimit` 헤더와 레거시 `X-RateLimit-*` 헤더를 모두 포함하고, 클라이언트는 Exponential Backoff with Jitter로 재시도한다.

**핵심 참고 자료**:
- Upstash Ratelimit 문서: upstash.com/docs/redis/sdks/ratelimit-ts/overview
- GitHub 저장소: github.com/upstash/ratelimit-js
- RFC 6585 (429 상태 코드): datatracker.ietf.org/doc/html/rfc6585
- IETF Rate Limit 헤더 드래프트: datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/