# SEC-2-R1: API 보안

> CORS, Rate Limiting, 요청 서명 기반 API 보안 전략

## 1. 리서치 배경

### 1.1 현재 상황

이룸 프로젝트의 API는 Next.js App Router를 사용하며, Clerk 인증과 Supabase 백엔드를 연동합니다. API 보안은 다중 계층 방어가 필요합니다.

### 1.2 리서치 목표

- CORS 정책 최적화
- Rate Limiting 구현 전략
- 요청 무결성 검증
- API 남용 방지

## 2. CORS (Cross-Origin Resource Sharing)

### 2.1 CORS 설정

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// 허용된 오리진 목록
const ALLOWED_ORIGINS = [
  'https://yiroom.app',
  'https://www.yiroom.app',
  'https://app.yiroom.app',
  // 개발 환경
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []),
];

export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');

  // Preflight 요청 처리
  if (request.method === 'OPTIONS') {
    return handlePreflight(origin);
  }

  // 일반 요청 CORS 헤더
  const response = NextResponse.next();

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }

  return response;
}

function handlePreflight(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 });

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-CSRF-Token, X-Request-Id'
    );
    response.headers.set('Access-Control-Max-Age', '86400'); // 24시간 캐시
  }

  return response;
}
```

### 2.2 API 라우트 CORS

```typescript
// lib/api/cors.ts
import { NextRequest, NextResponse } from 'next/server';

export function withCORS<T extends Response>(
  handler: (request: NextRequest) => Promise<T>
) {
  return async (request: NextRequest): Promise<T | NextResponse> => {
    // Preflight
    if (request.method === 'OPTIONS') {
      return handlePreflight(request.headers.get('origin'));
    }

    const response = await handler(request);
    const origin = request.headers.get('origin');

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      // 응답에 CORS 헤더 추가
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');

      return new Response(response.body, {
        status: response.status,
        headers,
      }) as T;
    }

    return response;
  };
}
```

## 3. Rate Limiting

### 3.1 다중 계층 Rate Limiting

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// 엔드포인트별 Rate Limiter
export const rateLimiters = {
  // AI 분석 API: 50 req/24h/user
  aiAnalysis: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '24 h'),
    prefix: 'rl:ai',
    analytics: true,
  }),

  // 일반 API: 100 req/min/user
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:general',
  }),

  // 인증 API: 10 req/min/IP (브루트포스 방지)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '1 m'),
    prefix: 'rl:auth',
  }),

  // 업로드 API: 10 req/min/user
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:upload',
  }),

  // 전역 제한: 1000 req/min/IP (DDoS 방지)
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    prefix: 'rl:global',
  }),
};

export type RateLimitType = keyof typeof rateLimiters;
```

### 3.2 Rate Limit 미들웨어

```typescript
// lib/security/rate-limit-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, RateLimitType } from './rate-limit';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'general'
): Promise<RateLimitResult> {
  const limiter = rateLimiters[type];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

export function rateLimitResponse(
  result: RateLimitResult
): NextResponse | null {
  if (result.success) {
    return null;
  }

  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        retryAfter,
      },
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
```

### 3.3 엔드포인트별 Rate Limit 적용

```typescript
// app/api/analyze/skin/route.ts
import { withAuth } from '@/lib/auth/protect-api';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rate-limit-middleware';

export const POST = withAuth(async (request, { userId }) => {
  // AI 분석 Rate Limit 체크
  const rateLimit = await checkRateLimit(userId, 'aiAnalysis');
  const limitResponse = rateLimitResponse(rateLimit);

  if (limitResponse) {
    return limitResponse;
  }

  // 분석 로직...
  const result = await analyzeSkin(request);

  return NextResponse.json({
    success: true,
    data: result,
  }, {
    headers: {
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    },
  });
});
```

## 4. 요청 서명 및 무결성 검증

### 4.1 요청 서명 생성

```typescript
// lib/security/request-signing.ts
import crypto from 'crypto';

interface SignatureParams {
  method: string;
  path: string;
  timestamp: number;
  body?: string;
  nonce: string;
}

// 요청 서명 생성 (클라이언트)
export function signRequest(
  params: SignatureParams,
  secretKey: string
): string {
  const payload = [
    params.method.toUpperCase(),
    params.path,
    params.timestamp.toString(),
    params.nonce,
    params.body || '',
  ].join('\n');

  return crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
}

// 요청 서명 검증 (서버)
export function verifyRequestSignature(
  request: Request,
  body: string
): { valid: boolean; error?: string } {
  const signature = request.headers.get('x-signature');
  const timestamp = request.headers.get('x-timestamp');
  const nonce = request.headers.get('x-nonce');

  if (!signature || !timestamp || !nonce) {
    return { valid: false, error: 'Missing signature headers' };
  }

  // 타임스탬프 유효성 (5분 이내)
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return { valid: false, error: 'Request timestamp expired' };
  }

  // 논스 재사용 검사
  if (await isNonceUsed(nonce)) {
    return { valid: false, error: 'Nonce already used' };
  }

  // 서명 검증
  const url = new URL(request.url);
  const expectedSignature = signRequest(
    {
      method: request.method,
      path: url.pathname,
      timestamp: requestTime,
      nonce,
      body,
    },
    process.env.API_SIGNING_SECRET!
  );

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (isValid) {
    await markNonceUsed(nonce);
  }

  return { valid: isValid };
}
```

### 4.2 논스 관리

```typescript
// lib/security/nonce.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const NONCE_TTL = 5 * 60; // 5분

export async function isNonceUsed(nonce: string): Promise<boolean> {
  const key = `nonce:${nonce}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function markNonceUsed(nonce: string): Promise<void> {
  const key = `nonce:${nonce}`;
  await redis.set(key, '1', { ex: NONCE_TTL });
}

// 클라이언트용 논스 생성
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}
```

## 5. API 보안 헤더

### 5.1 보안 헤더 미들웨어

```typescript
// lib/security/headers.ts
import { NextResponse } from 'next/server';

export function applySecurityHeaders(response: NextResponse): NextResponse {
  // XSS 방지
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 콘텐츠 타입 스니핑 방지
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 클릭재킹 방지
  response.headers.set('X-Frame-Options', 'DENY');

  // 참조자 정책
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 권한 정책 (불필요한 브라우저 기능 비활성화)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.yiroom.app",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://clerk.yiroom.app https://api.clerk.dev",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}
```

### 5.2 API 응답 헤더

```typescript
// lib/api/response.ts
import { NextResponse } from 'next/server';

export function jsonResponse<T>(
  data: T,
  options: {
    status?: number;
    cache?: 'no-store' | 'private' | 'public';
    maxAge?: number;
  } = {}
): NextResponse<T> {
  const { status = 200, cache = 'no-store', maxAge = 0 } = options;

  const response = NextResponse.json(data, { status });

  // 캐시 제어
  if (cache === 'no-store') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  } else if (cache === 'private') {
    response.headers.set('Cache-Control', `private, max-age=${maxAge}`);
  } else {
    response.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  }

  // API 버전 헤더
  response.headers.set('X-API-Version', '2.0');

  // 요청 ID (디버깅용)
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-Id', requestId);

  return response;
}
```

## 6. 웹훅 보안

### 6.1 Clerk 웹훅 검증

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  // 이벤트 처리
  switch (event.type) {
    case 'user.created':
      await handleUserCreated(event.data);
      break;
    case 'user.deleted':
      await handleUserDeleted(event.data);
      break;
    case 'session.revoked':
      await handleSessionRevoked(event.data);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

## 7. 입력 검증 및 Sanitization

### 7.1 Zod 스키마 검증

```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

// 이미지 Base64 검증
export const imageBase64Schema = z.string()
  .min(1, '이미지가 필요합니다')
  .refine(
    (val) => val.startsWith('data:image/'),
    '올바른 이미지 형식이 아닙니다'
  )
  .refine(
    (val) => {
      // 10MB 제한
      const base64 = val.split(',')[1] || '';
      return base64.length * 0.75 < 10 * 1024 * 1024;
    },
    '이미지 크기는 10MB 이하여야 합니다'
  );

// 사용자 입력 Sanitization
export const sanitizedStringSchema = z.string()
  .transform(val => val.trim())
  .transform(val => val.replace(/<[^>]*>/g, '')) // HTML 태그 제거
  .transform(val => val.replace(/[<>'"]/g, '')); // 특수문자 제거

// 페이지네이션
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
```

### 7.2 입력 검증 미들웨어

```typescript
// lib/api/validate.ts
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (
    request: NextRequest,
    validatedData: z.infer<T>
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const body = await request.json().catch(() => ({}));
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력 정보를 확인해주세요.',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    return handler(request, result.data);
  };
}
```

## 8. 구현 체크리스트

### 8.1 P0 (필수 구현)

- [ ] CORS 정책 설정 (허용 오리진 제한)
- [ ] AI 분석 API Rate Limiting (50/24h)
- [ ] 인증 API Rate Limiting (10/min)
- [ ] Zod 스키마 입력 검증
- [ ] 보안 헤더 적용

### 8.2 P1 (권장 구현)

- [ ] 요청 서명 검증
- [ ] 논스 기반 재사용 방지
- [ ] 웹훅 서명 검증
- [ ] 전역 DDoS 방어 Rate Limit

### 8.3 P2 (고급 구현)

- [ ] IP 기반 지리적 차단
- [ ] API 사용량 대시보드
- [ ] 이상 트래픽 자동 감지
- [ ] API Gateway 도입

## 9. 참고 자료

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Next.js Security Headers](https://nextjs.org/docs/app/guides/data-security)
- [Upstash Rate Limiting](https://upstash.com/docs/oss/sdks/py/ratelimit)

---

**Version**: 1.0 | **Created**: 2026-01-19
**Category**: 보안 심화 | **Priority**: P0
