# ADR-013: 에러 처리 및 사용자 피드백 전략

## 상태

`accepted`

## 날짜

2026-01-15

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 에러가 사용자에게 친절하고 복구 가능한 경험으로 전환되는 상태"

- **자동 복구**: 대부분의 에러가 사용자 개입 없이 자동 해결
- **예측 방지**: 에러 발생 전 사전 경고 및 예방 조치
- **학습 시스템**: 에러 패턴 분석으로 지속적 개선
- **투명성**: 기술적 문제를 이해하기 쉬운 언어로 전달

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 외부 API 장애 | 제어 불가능 (Gemini, Supabase) |
| 네트워크 불안정 | 사용자 환경 의존 |
| 브라우저 제한 | localStorage, 메모리 한계 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| 자동 복구율 | 80% | 50% | 재시도 + fallback |
| 사용자 이해도 | 95% | 75% | UX 라이팅 개선 필요 |
| 에러 로깅 완성도 | 100% | 85% | PII 마스킹 적용됨 |
| MTTR (평균 복구 시간) | < 5초 | 10초 | 재시도 지연 최적화 |

### 현재 목표: 80%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| AI 에러 예측 | 데이터 부족 | MAU 10만+ |
| 실시간 에러 대시보드 | 운영 오버헤드 | 팀 규모 확대 시 |
| 자동 버그 리포트 | 사용자 동의 필요 | GDPR 완료 후 |

---

## 맥락 (Context)

현재 에러 처리가 **일관성 없이 분산**:

1. **API 에러**: `lib/api/error-response.ts` 존재하지만 적용 불균일
2. **React 에러**: Error Boundary 미구현
3. **AI 에러**: Mock fallback 있으나 사용자 피드백 규칙 없음
4. **네트워크 에러**: 재시도 정책 미정의

**문제점**:
- Toast vs Alert vs Inline 선택 기준 없음
- PII(개인정보) 로깅 규칙 없음
- 사용자 대면 에러 메시지 불친절

## 결정 (Decision)

**3계층 에러 처리 전략** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   Error Handling Strategy                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: API Error (서버)                                   │
│  ├── 표준 에러 응답 형식                                    │
│  ├── HTTP 상태 코드 + 에러 코드 + 메시지                    │
│  └── 개발 환경에서만 상세 정보 노출                         │
│                                                              │
│  Layer 2: React Error Boundary (클라이언트)                  │
│  ├── 라우트 레벨: 페이지 전체 복구                          │
│  ├── 컴포넌트 레벨: 부분 복구 (선택적)                      │
│  └── Fallback UI: 에러 메시지 + 재시도 버튼                 │
│                                                              │
│  Layer 3: User Feedback (UI)                                 │
│  ├── Toast: 일시적 정보 (3초 자동 닫힘)                     │
│  ├── Alert: 확인 필요 (사용자 액션 필요)                    │
│  └── Inline: 폼 필드 에러 (필드 옆 표시)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### UI 피드백 선택 기준

| 상황 | UI 유형 | 예시 |
|------|--------|------|
| 성공/확인 | Toast (3초) | "저장되었습니다" |
| 네트워크 일시 오류 | Toast + 재시도 | "연결 실패, 재시도 중..." |
| 폼 입력 오류 | Inline | 필드 옆 빨간 텍스트 |
| 인증 필요 | Alert + Redirect | "로그인이 필요합니다" |
| 심각한 오류 | Error Boundary | 전체 페이지 대체 |

### 재시도 정책

| 에러 유형 | 재시도 횟수 | 전략 |
|----------|-----------|------|
| **AI API** | 2회 | Exponential (1s, 2s) + Mock fallback |
| **일반 API** | 3회 | Linear (1s 간격) |
| **인증** | 0회 | 즉시 로그인 리다이렉트 |
| **Rate Limit** | 1회 | Retry-After 헤더 대기 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 모든 에러 Toast | 일관성 | 중요 에러 놓침 | `LOW_ROI` |
| 모달 에러만 | 명확한 확인 | UX 방해 | `NOT_NEEDED` |

## 결과 (Consequences)

### 긍정적 결과

- **일관된 UX**: 예측 가능한 에러 피드백
- **디버깅 용이**: 체계적 로깅
- **복구 가능**: 재시도 + fallback

### 부정적 결과

- **구현 비용**: Error Boundary 추가 필요
- **복잡도 증가**: 3계층 관리

## 구현 가이드

### API 에러 응답 표준

```typescript
// lib/api/error-response.ts
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;        // 사용자용
    details?: string;       // 개발용 (dev only)
  };
}

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'AI_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number
): Response {
  return Response.json(
    { success: false, error: { code, message } },
    { status }
  );
}
```

### React Error Boundary

```typescript
// components/common/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    // Sentry 전송
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">
            문제가 발생했습니다
          </h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || '알 수 없는 오류'}
          </p>
          <Button onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 재시도 로직

```typescript
// lib/api/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    delay: number;
    exponential?: boolean;
  }
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < options.maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const waitTime = options.exponential
        ? options.delay * Math.pow(2, i)
        : options.delay;
      await sleep(waitTime);
    }
  }

  throw lastError;
}
```

### 로깅 규칙 (PII 보호)

```typescript
// lib/utils/logger.ts
export function sanitizeForLogging(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;

  const PII_FIELDS = [
    'email', 'phone', 'birthDate', 'address',
    'faceImage', 'bodyImage', 'clerk_user_id'
  ];

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) =>
      PII_FIELDS.includes(key)
        ? [key, '[REDACTED]']
        : [key, sanitizeForLogging(value)]
    )
  );
}
```

## 리서치 티켓

```
[ADR-013-R1] 에러 처리 UX 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Error Boundary vs Suspense Boundary 조합 패턴 모범 사례
2. 에러 메시지의 심리적 영향과 긍정적 프레이밍 연구
3. PII 자동 탐지 및 마스킹 알고리즘 (정규식 vs ML 기반)

→ 결과를 Claude Code에서 components/ErrorBoundary 및 lib/utils/logger에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - Fallback 전략, 에러 분류
- [원리: 보안 패턴](../principles/security-patterns.md) - 에러 노출 방지, 로깅

### 관련 ADR/스펙
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)
- [Error Handling Patterns](../../.claude/rules/error-handling-patterns.md)

---

**Author**: Claude Code
**Reviewed by**: -
