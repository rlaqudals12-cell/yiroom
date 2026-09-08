# ADR-038: Rate Limiting 전략

## 2026-09-08 배치 S — 코치 사용자 턴 원자 예약

- 근거: `c:/tmp/yiroom-codex-reports/2026-09-07-skincare-consultation-sim.md` §B·§E, 기존 `docs/principles/security-patterns.md`. 근거 재조사 없이 지정 보고서를 적용한다.
- 웹 SSE와 모바일 JSON의 모델 호출 직전에 같은 서비스에서 KST 달력 일20·월100 사용자 턴을 예약한다. 결정론 응답은 모델0호출이므로 미차감이다.
- Redis Lua 한 문장으로 일·월 카운터와 예약 영수증을 함께 검사·갱신한다. 독립 INCR 두 번은 두 한도 사이 경합/부분 갱신 때문에 기각했다.
- 모델 전송을 시작한 턴은 timeout·abort·오류도 소진 유지한다. 전송하지 않은 예약만 한 번 환급한다. 정산은 멱등이며 원래 날짜 키만 갱신한다.
- `/api/coach/chat`·`/api/coach/stream`은 전용 요청 카테고리 `coachTurn`(분 20·일 400 **요청**)을 쓴다. 요청 제한은 RAG·DB 남용을, 턴 예약은 모델 비용을 막는 서로 다른 축이라 둘 다 유지한다. 한도 초과에도 무료 결정론 안내와 루틴 열람을 허용한다.
  - 정정(2026-09-08 검증): 초기 구현은 두 경로를 요청 제한에서 전면 제외해 분당 버스트 방어가 사라졌다. 인증 사용자당 무제한 요청으로 RAG·DB 비용이 열려 되돌렸다.
- Redis가 없거나 실패하는 운영 환경에서는 모델 호출을 차단한다. 서버별 메모리 카운터로 우회하지 않는다. 로컬/테스트만 단일 프로세스 메모리 저장소를 사용한다.
  - 이 차단은 무음이면 안 된다. 원인이 '한도 소진'이 아니라 '저장소 미설정'임을 서버 로그로 남기고, 응답도 폴백으로 표시한다. `UPSTASH_REDIS_REST_*`는 운영 필수 환경변수이며 배포 전 점검 대상이다.
- 모델 호출당 출력250토큰과 thinking 제한은 별도 생성 config로 고정한다. 횟수 상한은 입력 길이·캐시 비용·사업 전체 청구액의 절대 금액 보증이 아니다.

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 API가 공정하게 보호되고 악용이 완벽하게 차단되는 상태"

- **완벽한 DDoS 방어**: 어떤 공격에도 서비스 가용성 유지
- **공정한 할당**: 모든 사용자에게 동등한 리소스 보장
- **지능형 제한**: 사용 패턴 학습하여 동적으로 한도 조정
- **투명한 피드백**: 사용자에게 남은 한도와 리셋 시간 실시간 표시

### 물리적 한계

| 항목             | 한계                                           |
| ---------------- | ---------------------------------------------- |
| 분산 환경 동기화 | 서버리스 인스턴스 간 완벽한 실시간 동기화 불가 |
| Redis 지연       | 외부 Redis 호출 시 ~50ms 추가 지연             |
| IP 우회          | VPN/프록시로 IP 기반 제한 우회 가능            |
| 비용             | Redis 사용량에 따른 월 비용 발생               |

### 100점 기준

| 지표                | 100점 기준    | 현재 | 비고             |
| ------------------- | ------------- | ---- | ---------------- |
| 엔드포인트 커버리지 | 100%          | 80%  | 핵심 API 적용    |
| 우회 방지율         | 99%           | 90%  | IP + userId 조합 |
| 평균 지연 추가      | < 10ms        | 50ms | Upstash 호출     |
| 장애 복구           | 자동 fallback | 수동 | 인메모리 폴백    |

### 현재 목표: 85%

### 의도적 제외

| 제외 항목          | 이유                              | 재검토 시점               |
| ------------------ | --------------------------------- | ------------------------- |
| ML 기반 이상 감지  | 복잡도 대비 ROI (HIGH_COMPLEXITY) | 공격 빈번 시              |
| 사용자별 동적 한도 | 구현 복잡도                       | 프리미엄 티어 도입 시     |
| 지역별 차등 제한   | 글로벌 서비스 아직 미운영         | 글로벌 확장 시            |
| WAF 연동           | 비용 (FINANCIAL_HOLD)             | 엔터프라이즈 고객 확보 시 |

---

## 맥락 (Context)

이룸 서비스는 AI 분석 API, 인증 API 등 비용이 높은 엔드포인트를 제공합니다. 다음 문제를 해결해야 합니다:

### 현재 문제

1. **보안 체크리스트와 구현 불일치**:
   | 엔드포인트 | 체크리스트 | 현재 구현 |
   |-----------|-----------|----------|
   | `/api/analyze/*` | 50 req/24h/user | 10 req/min |
   | `/api/auth/*` | 20 req/1m/IP | 20 req/min |
   | `/api/upload/*` | 5 req/1m/user | 미구현 |

2. **인메모리 저장소 한계**:
   - 서버리스 환경에서 인스턴스 간 공유 불가
   - 재배포 시 리셋됨
   - 스케일 아웃 시 제한 우회 가능

3. **일일 한도 미구현**:
   - 현재: 분당 한도만 존재
   - 필요: 일일(24시간) 한도 추가

### 요구사항

| 요구사항              | 우선순위 | 근거                 |
| --------------------- | -------- | -------------------- |
| 분당 + 일일 이중 한도 | P0       | 보안 체크리스트 준수 |
| 사용자별 공정 할당    | P0       | DDoS 방어            |
| Redis 저장소          | P0       | 프로덕션 안정성      |
| 동적 조정             | P1       | 성능 기반 자동 조절  |

## 결정 (Decision)

**Upstash Redis 기반 Sliding Window + Token Bucket 이중 제한**을 구현합니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rate Limiting 아키텍처                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  요청 → Middleware (proxy.ts)                                   │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Rate Limiter                            │       │
│  │  ┌─────────────────┐  ┌─────────────────┐          │       │
│  │  │ Sliding Window  │  │  Token Bucket   │          │       │
│  │  │  (분당 한도)     │  │  (일일 한도)    │          │       │
│  │  └────────┬────────┘  └────────┬────────┘          │       │
│  │           │                    │                    │       │
│  │           └──────────┬─────────┘                    │       │
│  │                      ▼                              │       │
│  │              Upstash Redis                          │       │
│  └─────────────────────────────────────────────────────┘       │
│            │                                                    │
│            ▼                                                    │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ 허용 → 요청 처리 │  │ 거부 → 429 응답  │                      │
│  │ + 헤더 추가      │  │ + Retry-After   │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 엔드포인트별 한도

| 엔드포인트        | 분당 한도 | 일일 한도 | 식별자 |
| ----------------- | --------- | --------- | ------ |
| `/api/analyze/*`  | 10        | **50**    | userId |
| `/api/gemini/*`   | 10        | 50        | userId |
| `/api/coach/*`    | 30        | 200       | userId |
| `/api/chat/*`     | 30        | 200       | userId |
| `/api/auth/*`     | 20        | 100       | **IP** |
| `/api/upload/*`   | **5**     | 30        | userId |
| `/api/feedback/*` | 5         | 20        | userId |
| `/api/*` (기본)   | 100       | 1000      | userId |

### 응답 헤더

```http
HTTP/1.1 200 OK
X-RateLimit-Limit-Minute: 10
X-RateLimit-Remaining-Minute: 7
X-RateLimit-Limit-Day: 50
X-RateLimit-Remaining-Day: 45
X-RateLimit-Reset: 1706054400
```

### 429 응답

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
```

## 대안 (Alternatives Considered)

| 대안                  | 장점              | 단점                   | 제외 사유                   |
| --------------------- | ----------------- | ---------------------- | --------------------------- |
| **인메모리 Map**      | 구현 단순, 비용 0 | 인스턴스 간 공유 불가  | `SCALE` - 프로덕션 부적합   |
| **Fixed Window**      | 구현 단순         | 윈도우 경계에서 버스트 | `SECURITY` - 제한 우회 가능 |
| **Sliding Log**       | 정확함            | 메모리 사용 높음       | `COST` - Redis 비용 증가    |
| **Leaky Bucket**      | 일정한 처리율     | 버스트 허용 안 함      | `UX` - 사용자 경험 저하     |
| **Sliding Window** ✅ | 정확 + 효율적     | 구현 복잡도            | **채택** (분당)             |
| **Token Bucket** ✅   | 버스트 허용       | 상태 관리 필요         | **채택** (일일)             |

### Upstash 선택 이유

| 기준      | Upstash      | Redis Cloud     | 자체 Redis   |
| --------- | ------------ | --------------- | ------------ |
| 비용      | $0.2/10K req | $5/month 최소   | EC2 비용     |
| 서버리스  | ✅ 최적화    | ⚠️ 연결 풀 필요 | ❌ 관리 필요 |
| 지연 시간 | ~50ms        | ~30ms           | ~10ms        |
| 관리      | 없음         | 있음            | 많음         |

**결정**: Upstash (서버리스 최적화, 저비용)

## 결과 (Consequences)

### 긍정적 결과

- **보안 준수**: 체크리스트 기준 완전 준수
- **확장성**: 인스턴스 간 공유, 스케일 아웃 지원
- **유연성**: 엔드포인트별 세분화된 제한
- **투명성**: 헤더로 남은 한도 표시

### 부정적 결과

- **비용**: Upstash 사용료 (예상 $5-20/월)
- **지연**: Redis 호출 추가 (50ms)
- **복잡도**: 이중 한도 관리 필요

### 리스크

- **Upstash 장애**: 인메모리 fallback 구현
- **비용 급증**: 모니터링 + 알림 설정
- **우회 시도**: IP + userId 조합 검증

## 구현 가이드

### 1. Upstash 설정

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### 2. Rate Limiter 클래스

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 엔드포인트별 설정
const RATE_LIMITS = {
  analyze: {
    minute: Ratelimit.slidingWindow(10, '1 m'),
    day: Ratelimit.tokenBucket(50, '24 h', 50),
  },
  auth: {
    minute: Ratelimit.slidingWindow(20, '1 m'),
    day: Ratelimit.tokenBucket(100, '24 h', 100),
  },
  upload: {
    minute: Ratelimit.slidingWindow(5, '1 m'),
    day: Ratelimit.tokenBucket(30, '24 h', 30),
  },
  default: {
    minute: Ratelimit.slidingWindow(100, '1 m'),
    day: Ratelimit.tokenBucket(1000, '24 h', 1000),
  },
} as const;

export type RateLimitCategory = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  minuteLimit: number;
  minuteRemaining: number;
  dayLimit: number;
  dayRemaining: number;
  reset: number;
  headers: Record<string, string>;
}

export async function checkRateLimit(
  identifier: string,
  category: RateLimitCategory = 'default'
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[category];

  const minuteLimiter = new Ratelimit({
    redis,
    limiter: config.minute,
    prefix: `ratelimit:${category}:minute`,
  });

  const dayLimiter = new Ratelimit({
    redis,
    limiter: config.day,
    prefix: `ratelimit:${category}:day`,
  });

  const [minuteResult, dayResult] = await Promise.all([
    minuteLimiter.limit(identifier),
    dayLimiter.limit(identifier),
  ]);

  const success = minuteResult.success && dayResult.success;
  const reset = Math.max(minuteResult.reset, dayResult.reset);

  return {
    success,
    minuteLimit: minuteResult.limit,
    minuteRemaining: minuteResult.remaining,
    dayLimit: dayResult.limit,
    dayRemaining: dayResult.remaining,
    reset,
    headers: {
      'X-RateLimit-Limit-Minute': minuteResult.limit.toString(),
      'X-RateLimit-Remaining-Minute': minuteResult.remaining.toString(),
      'X-RateLimit-Limit-Day': dayResult.limit.toString(),
      'X-RateLimit-Remaining-Day': dayResult.remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}

export function getRateLimitCategory(pathname: string): RateLimitCategory {
  if (pathname.startsWith('/api/analyze') || pathname.startsWith('/api/gemini')) {
    return 'analyze';
  }
  if (pathname.startsWith('/api/auth')) {
    return 'auth';
  }
  if (pathname.startsWith('/api/upload')) {
    return 'upload';
  }
  return 'default';
}
```

### 3. Middleware 통합

```typescript
// proxy.ts 또는 middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitCategory } from '@/lib/security/rate-limit';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate Limiting 적용 라우트
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks')) {
    const category = getRateLimitCategory(pathname);

    // 식별자: userId 우선, 없으면 IP
    const userId = request.headers.get('x-clerk-user-id');
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const identifier = category === 'auth' ? ip : (userId ?? ip);

    const result = await checkRateLimit(identifier, category);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_ERROR',
            message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
            limitType: result.minuteRemaining === 0 ? 'minute' : 'day',
          },
        },
        {
          status: 429,
          headers: {
            ...result.headers,
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 성공 시 헤더 추가
    const response = NextResponse.next();
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  return NextResponse.next();
}
```

### 4. Fallback (Redis 장애 시)

```typescript
// lib/security/rate-limit-fallback.ts
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimitWithFallback(
  identifier: string,
  category: RateLimitCategory
): Promise<RateLimitResult> {
  try {
    return await checkRateLimit(identifier, category);
  } catch (error) {
    console.error('[RateLimit] Redis error, using fallback:', error);

    // 인메모리 fallback (보수적 제한)
    const key = `${category}:${identifier}`;
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || entry.resetAt < now) {
      memoryStore.set(key, { count: 1, resetAt: now + 60000 });
      return createSuccessResult();
    }

    entry.count++;
    if (entry.count > 50) {
      // 보수적 제한
      return createFailureResult(entry.resetAt);
    }

    return createSuccessResult();
  }
}
```

## 모니터링

### Upstash Analytics

- 요청 수, 거부 수, 평균 지연 시간
- 대시보드: https://console.upstash.com/

### 커스텀 메트릭

```typescript
// 429 응답 시 로깅
console.warn('[RateLimit] Limit exceeded', {
  identifier,
  category,
  minuteRemaining: result.minuteRemaining,
  dayRemaining: result.dayRemaining,
});
```

## 테스트

```typescript
// tests/lib/security/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should allow requests within minute limit', async () => {
    // ...
  });

  it('should block after minute limit exceeded', async () => {
    // ...
  });

  it('should block after daily limit exceeded', async () => {
    // ...
  });

  it('should use IP for auth endpoints', async () => {
    // ...
  });

  it('should fallback to memory on Redis failure', async () => {
    // ...
  });
});
```

## 관련 문서

### 원리 문서 (과학적 기초)

- [원리: 보안 패턴](../principles/security-patterns.md) - Rate Limiting 전략, DDoS 방어
- [원리: API 설계](../principles/api-design.md) - API 보호 패턴, 응답 헤더

### 규칙 문서

- [api-design.md](../../.claude/rules/api-design.md) - Rate Limiting 섹션
- [security-checklist.md](../../.claude/rules/security-checklist.md) - 한도 기준

### 관련 ADR

- [ADR-004: 인증 전략](./ADR-004-auth-strategy.md) - userId 식별
- [ADR-019: 성능 모니터링](./ADR-019-performance-monitoring.md) - 메트릭 연동
- [ADR-020: API 버전 관리](./ADR-020-api-versioning.md)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙                                               | 상태         | 설명           |
| -------------------------------------------------- | ------------ | -------------- |
| [SDD-RATE-LIMITING](../specs/SDD-RATE-LIMITING.md) | 📝 작성 예정 | 상세 구현 스펙 |

---

**Author**: Claude Code
**Reviewed by**: -
