# API 설계 원리

> 이 문서는 REST API 설계의 기반이 되는 기본 원리를 설명한다.

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 RESTful API 시스템"

- Richardson Level 3: HATEOAS 완전 적용
- 100% 일관성: 모든 엔드포인트 동일 응답 형식
- 완벽한 버전 관리: Breaking change 없는 API 진화
- 자동 문서화: OpenAPI 스펙 자동 생성
- 에러 표준화: RFC 7807 Problem Details 적용
- Rate Limiting: 모든 엔드포인트 공정한 사용 보장
- 캐싱 최적화: ETag, Cache-Control 완벽 적용
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **HATEOAS 복잡도** | 클라이언트 구현 복잡도 증가 |
| **버전 공존** | 다중 버전 유지보수 비용 |
| **문서 동기화** | 코드-문서 불일치 가능 |
| **캐시 무효화** | 정확한 캐시 무효화 어려움 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **REST 성숙도** | Level 2+ (HTTP 메서드 + 상태코드) |
| **응답 일관성** | 모든 엔드포인트 표준 응답 형식 |
| **에러 형식** | RFC 7807 Problem Details |
| **버전 관리** | URL 기반 버전 (/api/v2/) |
| **Rate Limit** | 모든 엔드포인트 적용 |
| **문서화** | OpenAPI 3.0 스펙 100% |
| **테스트 커버** | API 테스트 커버리지 85% |

### 현재 목표

**75%** - MVP API 시스템

- ✅ REST 6대 제약 조건 이해
- ✅ 리소스 중심 설계 (명사 기반)
- ✅ 멱등성 원칙 적용
- ✅ 표준 응답 형식 정의
- ✅ Zod 기반 입력 검증
- ⏳ Rate Limiting 전체 적용 (60%)
- ⏳ OpenAPI 문서화 (50%)
- ⏳ HATEOAS 부분 적용 (30%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| HATEOAS 완전 적용 | 클라이언트 복잡도 | Phase 4 |
| GraphQL | REST 충분, 복잡도 증가 | 미정 |
| gRPC | 웹 브라우저 제약 | 미정 |

---

## 1. 핵심 개념

### 1.1 REST (Representational State Transfer)

Roy Fielding이 정의한 아키텍처 스타일의 6가지 제약 조건:

| 제약 조건 | 설명 | 이룸 적용 |
|-----------|------|----------|
| **Client-Server** | UI와 데이터 분리 | Next.js App Router |
| **Stateless** | 세션 상태 서버 미저장 | JWT 기반 인증 |
| **Cacheable** | 응답 캐시 가능 | Cache-Control 헤더 |
| **Uniform Interface** | 일관된 인터페이스 | 표준 응답 형식 |
| **Layered System** | 계층화된 구조 | Proxy, RLS |
| **Code on Demand** | 선택적 코드 전송 | (미사용) |

### 1.2 리소스 중심 설계

```
API는 동사가 아닌 명사로 설계한다.

❌ /getUsers
❌ /createUser
❌ /deleteUserById

✅ GET    /users
✅ POST   /users
✅ DELETE /users/{id}
```

### 1.3 Richardson Maturity Model

API 성숙도 4단계:

| Level | 특징 | 이룸 목표 |
|-------|------|----------|
| 0 | POX (Plain Old XML) | - |
| 1 | 리소스 | ✅ |
| 2 | HTTP 메서드 + 상태코드 | ✅ |
| 3 | HATEOAS | 부분 적용 |

---

## 2. 수학적/물리학적 기반

### 2.1 멱등성 (Idempotency)

```
f(f(x)) = f(x)

HTTP 메서드별 멱등성:
  GET    → 멱등 (읽기)
  PUT    → 멱등 (전체 교체)
  DELETE → 멱등 (삭제)
  POST   → 비멱등 (생성)
  PATCH  → 비멱등 (부분 수정)
```

멱등성 보장 패턴:

```typescript
// POST 멱등성 보장: Idempotency-Key 헤더
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: {
    'Idempotency-Key': `payment_${orderId}_${timestamp}`,
  },
  body: JSON.stringify(paymentData),
});
```

### 2.2 안전성 (Safety)

```
안전한 메서드 = 서버 상태를 변경하지 않음

GET, HEAD, OPTIONS → 안전
POST, PUT, DELETE, PATCH → 비안전
```

### 2.3 HTTP 상태 코드 분류

```
1xx: 정보 (처리 중)
2xx: 성공
3xx: 리다이렉션
4xx: 클라이언트 오류
5xx: 서버 오류

상태 코드 = 100 * category + specific_code
```

---

## 3. 구현 도출

### 3.1 원리 → 알고리즘

**원리**: 일관되고 예측 가능한 API 인터페이스

**알고리즘**:

```
1. 리소스 식별 (명사로 URL 설계)
2. HTTP 메서드로 동작 표현
3. 표준 상태 코드 반환
4. 일관된 응답 구조
5. 버전 관리
6. 에러 표준화
```

### 3.2 알고리즘 → 코드

**URL 구조 표준**:

```
/api/v{version}/{resource}/{id?}/{sub-resource?}

예시:
  /api/v2/analyze/skin           # 피부 분석
  /api/v2/users/123              # 특정 사용자
  /api/v2/users/123/assessments  # 사용자의 분석 기록
```

**표준 응답 구조**:

```typescript
// 성공 응답
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// 에러 응답
interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;       // 내부용 (영어)
    userMessage: string;   // 사용자용 (한국어)
    details?: Record<string, unknown>;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

**API 라우트 구현 패턴**:

```typescript
// app/api/v2/analyze/skin/route.ts
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SkinAnalysisResult>>> {
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

    // 2. 입력 검증
    const body = await request.json();
    const validated = skinAnalysisSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validated.error.message,
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
    // 5. 에러 처리
    return handleApiError(error);
  }
}
```

---

## 4. 버전 관리 원리

### 4.1 버전 관리 전략 비교

| 전략 | 방식 | 장단점 |
|------|------|--------|
| **URL Path** | `/api/v2/...` | ✅ 명확함, 캐시 용이 |
| Query Param | `/api?v=2` | 캐시 어려움 |
| Header | `Accept-Version: 2` | 숨겨진 버전 |

이룸은 **URL Path 버전 관리** 채택.

### 4.2 버전 전환 전략

```
┌─────────────────────────────────────────────────────────────┐
│                    버전 전환 타임라인                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  v1 ━━━━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━> deprecated │
│                │            │                               │
│                │ v2 출시    │ v1 deprecated                 │
│                │            │ (6개월 유지)                   │
│                ▼            ▼                               │
│  v2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━> current   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Deprecation 헤더

```http
HTTP/1.1 200 OK
X-API-Version: 1.0
X-Deprecated-At: 2026-06-01
X-Sunset: 2026-09-01
X-Upgrade-To: /api/v2/analyze/skin
```

---

## 5. 에러 코드 체계

### 5.1 에러 코드 분류

```typescript
type ErrorCode =
  // 인증/인가 (4xx)
  | 'AUTH_ERROR'           // 401: 인증 필요
  | 'FORBIDDEN_ERROR'      // 403: 권한 없음

  // 입력 검증 (400)
  | 'VALIDATION_ERROR'     // 잘못된 입력
  | 'NOT_FOUND_ERROR'      // 404: 리소스 없음
  | 'CONFLICT_ERROR'       // 409: 중복/충돌

  // 비즈니스 로직 (4xx)
  | 'RATE_LIMIT_ERROR'     // 429: 요청 제한
  | 'QUOTA_EXCEEDED'       // 402: 할당량 초과

  // 외부 서비스 (5xx)
  | 'AI_TIMEOUT_ERROR'     // 504: AI 타임아웃
  | 'AI_SERVICE_ERROR'     // 503: AI 서비스 오류
  | 'DB_ERROR'             // 500: DB 오류

  // 기타
  | 'UNKNOWN_ERROR';       // 500: 알 수 없는 오류
```

### 5.2 에러 코드 매핑

```typescript
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  AUTH_ERROR: 401,
  FORBIDDEN_ERROR: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND_ERROR: 404,
  CONFLICT_ERROR: 409,
  RATE_LIMIT_ERROR: 429,
  QUOTA_EXCEEDED: 402,
  AI_TIMEOUT_ERROR: 504,
  AI_SERVICE_ERROR: 503,
  DB_ERROR: 500,
  UNKNOWN_ERROR: 500,
};
```

---

## 6. 페이지네이션 원리

### 6.1 오프셋 기반 vs 커서 기반

| 방식 | 장점 | 단점 | 적합 |
|------|------|------|------|
| **오프셋** | 임의 페이지 접근 | 삽입/삭제 시 불안정 | 정적 데이터 |
| **커서** | 실시간 안정 | 임의 접근 불가 | 동적 피드 |

### 6.2 커서 기반 구현

```typescript
// 요청
GET /api/v2/products?cursor=abc123&limit=20

// 응답
{
  "success": true,
  "data": [...],
  "meta": {
    "nextCursor": "xyz789",
    "hasMore": true
  }
}
```

### 6.3 오프셋 기반 구현

```typescript
// 요청
GET /api/v2/products?page=2&pageSize=20

// 응답
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 2,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 7. Rate Limiting 원리

### 7.1 Leaky Bucket vs Token Bucket

| 알고리즘 | 특징 | 이룸 적용 |
|----------|------|----------|
| **Leaky Bucket** | 일정 속도 출력 | - |
| **Token Bucket** | 버스트 허용 | ✅ |
| **Sliding Window** | 정밀한 제어 | ✅ |

### 7.2 구현

```typescript
// Sliding Window 기반
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  analytics: true,
});

// 응답 헤더
{
  'X-RateLimit-Limit': '50',
  'X-RateLimit-Remaining': '45',
  'X-RateLimit-Reset': '1706054400',
}
```

---

## 8. 검증 방법

### 8.1 API 계약 검증

```typescript
// Zod 스키마로 계약 정의
const skinAnalysisResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    skinType: z.enum(['dry', 'oily', 'combination', 'normal', 'sensitive']),
    scores: z.record(z.number()),
    recommendations: z.array(z.string()),
  }),
});

// 응답 검증
const response = await POST(request);
const parsed = skinAnalysisResponseSchema.safeParse(await response.json());
expect(parsed.success).toBe(true);
```

### 8.2 일관성 검증 체크리스트

```markdown
□ 모든 성공 응답이 { success: true, data: T } 형식
□ 모든 에러 응답이 { success: false, error: { code, message, userMessage } } 형식
□ HTTP 상태 코드와 에러 코드 일치
□ 인증 필요 엔드포인트에 auth.protect() 적용
□ Rate Limit 헤더 포함
□ API 버전 명시
```

---

## 9. 관련 문서

### 규칙
- [api-design.md](../../.claude/rules/api-design.md) - 구체적 구현 가이드

### ADR
- [ADR-020: API 버전 관리 전략](../adr/ADR-020-api-versioning.md)
- [ADR-013: 에러 처리 전략](../adr/ADR-013-error-handling.md)

### 스펙
- SDD-API-VERSIONING (계획됨)

---

## 10. 참고 자료

- [REST API Design - Roy Fielding](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html)
- [HTTP Semantics (RFC 9110)](https://www.rfc-editor.org/rfc/rfc9110)
- [Problem Details for HTTP APIs (RFC 7807)](https://datatracker.ietf.org/doc/html/rfc7807)

---

**Version**: 1.0 | **Created**: 2026-01-21 | **Updated**: 2026-01-21
