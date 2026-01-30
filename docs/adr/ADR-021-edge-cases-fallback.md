# ADR-021: 엣지 케이스 및 폴백 전략

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 모듈이 동일한 3단계 폴백 전략을 준수하며, 예외 상황에서도 일관된 사용자 경험 제공"

- Level 1: 재시도 (3회, Exponential backoff)
- Level 2: Mock Fallback (신뢰도 표시)
- Level 3: 우아한 실패 (부분 기능 제공)
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 모듈 적용률 | 모든 AI 분석 100% 적용 |
| 일관성 | 동일한 에러 동일 대응 |
| 사용자 알림 | Mock 사용 시 100% 표시 |

### 현재 달성률

**70%** - 주요 분석 모듈 적용, 일부 ad-hoc 대응 존재

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸의 **예외 상황 처리가 모듈마다 일관되지 않습니다**:

1. **AI 실패**: Gemini API 타임아웃/오류 시 모듈별 다른 대응
2. **네트워크 오류**: 재시도 정책 불일치
3. **부분 데이터**: 일부 필드 누락 시 처리 방식 다양
4. **의존성 실패**: PC-1 실패 시 S-1/C-1 처리 미정의

## 결정 (Decision)

**3단계 폴백 전략** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   Fallback Strategy                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Level 1: 재시도 (Retry)                                     │
│  ├── 대상: 네트워크 오류, 일시적 장애                       │
│  ├── 전략: Exponential backoff (1s, 2s, 4s)                 │
│  └── 최대: 3회                                              │
│                                                              │
│  Level 2: 대체 처리 (Fallback)                               │
│  ├── 대상: AI 타임아웃, 서비스 장애                         │
│  ├── 전략: Mock 데이터로 대체                               │
│  └── 알림: 사용자에게 제한된 분석 안내                      │
│                                                              │
│  Level 3: 우아한 실패 (Graceful Degradation)                 │
│  ├── 대상: 핵심 서비스 장애                                 │
│  ├── 전략: 기능 비활성화 + 안내 메시지                      │
│  └── 복구: 서비스 복구 시 자동 재활성화                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 엣지 케이스 분류

| ID | 상황 | Level | 대응 |
|----|------|-------|------|
| `EC-01` | Gemini 타임아웃 | L2 | Mock 분석 결과 반환 |
| `EC-02` | Gemini 오류 응답 | L1→L2 | 재시도 후 Mock |
| `EC-03` | 네트워크 끊김 | L1 | 재시도 + 오프라인 큐 |
| `EC-04` | DB 연결 실패 | L1→L3 | 재시도 후 에러 페이지 |
| `EC-05` | 이미지 업로드 실패 | L1 | 재시도 + 에러 메시지 |
| `EC-06` | PC-1 미완료 | L3 | S-1/C-1 진입 차단 |
| `EC-07` | 부분 분석 데이터 | L2 | 가용 데이터로 부분 표시 |
| `EC-08` | Rate Limit 초과 | L1 | Retry-After 대기 후 재시도 |

### 의존성 실패 전파

```
┌─────────────────────────────────────────────────────────────┐
│                 Dependency Failure Propagation               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PC-1 실패                                                   │
│  ├── S-1: 진입 차단 + "퍼스널컬러 분석 먼저 필요" 안내      │
│  ├── C-1: 진입 차단 + "퍼스널컬러 분석 먼저 필요" 안내      │
│  └── Products: 기본 추천 (매칭률 없음)                      │
│                                                              │
│  CIE-1 실패 (이미지 품질 검증)                               │
│  ├── CIE-2~4: 건너뜀 (파이프라인 중단)                      │
│  └── 분석: 사용자에게 재촬영 요청                           │
│                                                              │
│  Supabase 연결 실패                                          │
│  ├── 읽기: 로컬 캐시에서 데이터 제공                        │
│  └── 쓰기: 오프라인 큐에 저장 후 나중에 동기화              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 즉시 에러 반환 | 간단 | UX 저하 | `LOW_ROI` |
| 무한 재시도 | 높은 성공률 | 리소스 낭비 | `NOT_NEEDED` |
| 외부 장애 서비스 | 자동 회복 | 복잡도 | `HIGH_COMPLEXITY` |

## 결과 (Consequences)

### 긍정적 결과

- **UX 향상**: 일시적 장애에도 서비스 연속성 유지
- **일관성**: 모든 모듈이 동일한 에러 처리
- **투명성**: 사용자에게 제한 사항 명확히 안내

### 부정적 결과

- **구현 복잡도**: 다단계 폴백 로직 관리
- **테스트 필요**: 각 엣지 케이스 테스트

## 구현 가이드

### 범용 재시도 래퍼

```typescript
// lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    exponential = true,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!shouldRetry(error) || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = exponential
        ? baseDelay * Math.pow(2, attempt)
        : baseDelay;

      await sleep(delay);
    }
  }

  throw lastError;
}
```

### AI 분석 폴백

```typescript
// lib/gemini/with-fallback.ts
export async function analyzeWithFallback<T>(
  analyze: () => Promise<T>,
  generateMock: () => T,
  options: FallbackOptions = {}
): Promise<{ result: T; usedFallback: boolean }> {
  const { timeout = 3000, maxRetries = 2 } = options;

  try {
    const result = await withRetry(
      () => Promise.race([
        analyze(),
        sleep(timeout).then(() => {
          throw new Error('AI analysis timeout');
        }),
      ]),
      { maxRetries }
    );

    return { result, usedFallback: false };
  } catch (error) {
    console.error('[AI] Analysis failed, using fallback:', error);

    return {
      result: generateMock(),
      usedFallback: true,
    };
  }
}
```

### 의존성 검증

```typescript
// lib/analysis/dependency-check.ts
export async function checkAnalysisDependencies(
  userId: string,
  requiredAnalysis: AnalysisType[]
): Promise<DependencyCheckResult> {
  const missing: AnalysisType[] = [];

  if (requiredAnalysis.includes('skin') || requiredAnalysis.includes('body')) {
    const hasPC1 = await hasPersonalColorAnalysis(userId);
    if (!hasPC1) {
      missing.push('personalColor');
    }
  }

  return {
    canProceed: missing.length === 0,
    missingDependencies: missing,
    message: missing.length > 0
      ? `먼저 ${missing.map(getAnalysisName).join(', ')} 분석이 필요합니다.`
      : null,
  };
}
```

### 에러 바운더리

```tsx
// components/AnalysisErrorBoundary.tsx
export function AnalysisErrorBoundary({ children, analysisType }: Props) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-4">
            분석 중 문제가 발생했습니다
          </h2>
          <p className="text-muted-foreground mb-4">
            {getErrorMessage(error, analysisType)}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={resetError}>다시 시도</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">대시보드로 이동</Link>
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Feature Flag 통합

```typescript
// lib/feature-flags/analysis-flags.ts
export const analysisFlags = {
  // CIE 파이프라인 활성화
  enableCoreImageEngine: true,

  // AI 폴백 허용
  allowMockFallback: true,

  // 폴백 시 사용자 알림
  notifyOnFallback: true,

  // 롤백 임계값 (에러율 %)
  rollbackThreshold: 10,
};
```

## 리서치 티켓

```
[ADR-021-R1] 엣지케이스 처리 고도화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Chaos Engineering을 활용한 장애 시나리오 테스트 방법론
2. 부분 실패(Partial Failure) 시 Progressive Enhancement UX 패턴
3. 의존성 실패 전파 차단을 위한 Bulkhead 패턴 구현

→ 결과를 Claude Code에서 lib/utils/retry.ts 및 에러 처리에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: AI 추론](../principles/ai-inference.md) - Fallback 전략, 엣지케이스, 서킷 브레이커

### 관련 ADR
- [ADR-007: Mock Fallback Strategy](./ADR-007-mock-fallback-strategy.md)
- [ADR-013: Error Handling](./ADR-013-error-handling.md)

### 구현 스펙
- [SDD-PHASE-D-SKIN-CONSULTATION](../specs/SDD-PHASE-D-SKIN-CONSULTATION.md) - AI 피부 상담
- [SDD-COACH-AI-CHAT](../specs/SDD-COACH-AI-CHAT.md) - AI 코치 채팅

### 관련 규칙
- [AI Integration Rules](../../.claude/rules/ai-integration.md)

---

**Author**: Claude Code
**Reviewed by**: -
