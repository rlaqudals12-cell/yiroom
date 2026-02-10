# API 설계 규칙

> Next.js API 라우트 및 REST API 설계 표준

## API 버전 관리

> **현재 상태**: API 버전 관리 미구현. 모든 API는 `/api/{domain}` 형태.
> 외부 소비자가 없는 내부 API이므로 Breaking Change 발생 시점에 도입 예정.

### 현재 라우트 구조

```
app/api/
├── analyze/                 # AI 분석 API
│   ├── personal-color/
│   ├── skin/
│   ├── body/
│   └── ...
├── coach/                   # AI 코치
├── admin/                   # 관리자
├── user/                    # 사용자 정보
├── webhooks/                # 외부 웹훅
│   └── clerk/
└── health/                  # 헬스체크
```

### 향후 버전 관리 도입 시점

- 외부 파트너 API 개방 시
- Breaking Change 발생 시 (기존 클라이언트 호환 필요)
- `/api/v1/` 접두사 + 폐기 예정 헤더 방식 적용

### 라우트 핸들러 패턴

```typescript
// app/api/v2/analyze/skin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// 요청 스키마
const requestSchema = z.object({
  imageBase64: z.string().min(1),
  options: z
    .object({
      includeRecommendations: z.boolean().optional(),
    })
    .optional(),
});

// 응답 타입 - AppError 표준 참조 (error-handling-patterns.md)
interface SkinAnalysisResponse {
  success: boolean;
  data?: {
    skinType: string;
    scores: Record<string, number>;
    recommendations: string[];
  };
  error?: {
    code: string;
    message: string; // 기술 메시지 (로깅용)
    userMessage: string; // 사용자 메시지 (UI 표시)
    details?: Record<string, unknown>;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<SkinAnalysisResponse>> {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User not authenticated',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    // 2. 요청 검증
    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            userMessage: '입력 정보를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // 3. 비즈니스 로직
    const result = await analyzeSkin(userId, validated.data);

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] POST /analyze/skin error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '서버 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
```

## 응답 형식

### 성공 응답

```typescript
// 단일 리소스
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example",
    "createdAt": "2026-01-15T10:00:00Z"
  }
}

// 리스트
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 에러 응답

> **표준 에러 타입**: [error-handling-patterns.md](./error-handling-patterns.md) 참조

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",         // 기술 메시지 (로깅용)
    "userMessage": "입력 정보를 확인해주세요.", // 사용자 메시지 (UI 표시)
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### HTTP 상태 코드

| 코드 | 용도                  |
| ---- | --------------------- |
| 200  | 성공                  |
| 201  | 생성 성공             |
| 204  | 삭제 성공 (본문 없음) |
| 400  | 요청 오류 (검증 실패) |
| 401  | 인증 필요             |
| 403  | 권한 없음             |
| 404  | 리소스 없음           |
| 409  | 충돌 (중복)           |
| 429  | 요청 제한 초과        |
| 500  | 서버 오류             |

## 입력 검증

### Zod 스키마

```typescript
// types/api/schemas.ts
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const skinAnalysisInputSchema = z.object({
  imageBase64: z
    .string()
    .min(1, '이미지가 필요합니다')
    .refine((val) => val.startsWith('data:image/'), '올바른 이미지 형식이 아닙니다'),
  options: z
    .object({
      includeRecommendations: z.boolean().default(true),
      zone: z.enum(['full', 't-zone', 'u-zone']).default('full'),
    })
    .optional(),
});
```

### 사용 예시

```typescript
const input = skinAnalysisInputSchema.safeParse(body);

if (!input.success) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: input.error.errors[0].message,
        details: input.error.flatten(),
      },
    },
    { status: 400 }
  );
}

// input.data는 타입 안전
const { imageBase64, options } = input.data;
```

## 인증 및 권한

### 인증 패턴

```typescript
// 인증 필수 API
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Unauthorized',
          userMessage: '로그인이 필요합니다.',
        },
      },
      { status: 401 }
    );
  }

  // ...
}
```

### 공개 API

```typescript
// 인증 불필요 API (proxy.ts에서 제외)
// /api/webhooks/*, /api/public/*

export async function POST(request: NextRequest) {
  // 웹훅 서명 검증
  const signature = request.headers.get('x-webhook-signature');
  if (!verifyWebhookSignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ...
}
```

## Rate Limiting

### 구현

```typescript
// lib/api/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}
```

### 사용

```typescript
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  const { success, headers } = await checkRateLimit(userId);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Rate limit exceeded',
          userMessage: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        },
      },
      { status: 429, headers }
    );
  }

  // ...
}
```

## 페이지네이션

### 커서 기반 (권장)

```typescript
// 요청
GET /api/products?cursor=abc123&limit=20

// 응답
{
  "success": true,
  "data": [...],
  "pagination": {
    "nextCursor": "xyz789",
    "hasMore": true
  }
}
```

### 오프셋 기반

```typescript
// 요청
GET /api/products?page=2&pageSize=20

// 응답
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## API 문서화

### JSDoc 주석

```typescript
/**
 * 피부 분석 API
 *
 * @route POST /api/v2/analyze/skin
 * @auth required
 * @rateLimit 50 requests per 24 hours
 *
 * @param {string} imageBase64 - Base64 인코딩된 이미지
 * @param {object} [options] - 분석 옵션
 * @param {boolean} [options.includeRecommendations=true] - 추천 포함 여부
 *
 * @returns {object} 분석 결과
 * @returns {string} returns.skinType - 피부 타입
 * @returns {object} returns.scores - 점수 객체
 *
 * @throws {401} 인증 실패
 * @throws {400} 입력 검증 실패
 * @throws {429} 요청 제한 초과
 */
export async function POST(request: NextRequest) {
  // ...
}
```

## Cron Job 패턴

```typescript
// app/api/cron/cleanup-images/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 작업 실행
  const result = await cleanupOldImages();

  return NextResponse.json({
    success: true,
    processed: result.count,
  });
}

// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-images",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## 관련 문서

- [error-handling-patterns.md](./error-handling-patterns.md) - AppError 타입, createAppError 함수
- [ADR-020](../../docs/adr/ADR-020-api-design.md) - API 설계 결정

---

**Version**: 1.2 | **Updated**: 2026-02-11 | API 버전 관리 현황 반영, 라우트 구조 실제와 동기화
