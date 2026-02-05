# ADR-065: PC-1 AI 실패 시 Mock Fallback 금지 정책

## 상태

**승인** (2026-02-06)

## 컨텍스트

PC-1 퍼스널 컬러 분석 API(`/api/analyze/personal-color`)에서 Gemini AI 호출 실패 시
자동으로 Mock 데이터를 반환할지(Mock Fallback) 아니면 에러를 반환할지 결정이 필요하다.

### 현황

- `route.ts` line 306: `// 신뢰성 문제로 랜덤 Mock Fallback 금지`
- AI 실패 시 503 + `retryable: true` 반환
- ADR-007에 일반적인 Mock Fallback 전략이 정의되어 있으나, PC-1 구체적 정책은 미문서화

### 관련 모듈

| 모듈              | Mock 정책      | 이유                                |
| ----------------- | -------------- | ----------------------------------- |
| PC-1 (퍼스널컬러) | **금지**       | 시즌 결과가 랜덤이면 사용자 피해    |
| S-1 (피부분석)    | 허용 (ADR-007) | 점수 범위가 좁아 오차 영향 적음     |
| C-1 (체형분석)    | 허용 (ADR-007) | 체형 카테고리가 넓어 오차 수용 가능 |

## 결정

**PC-1 프로덕션에서 AI 실패 시 Mock Fallback을 사용하지 않는다.**

대신:

1. 503 상태 코드 + `retryable: true` 반환
2. 클라이언트에서 "다시 시도" 버튼 표시
3. 사용자가 명시적으로 `useMock=true` 요청한 경우만 Mock 사용 (개발/테스트용)

## 대안 검토

### 대안 1: Mock Fallback + "AI 추정 결과" 표시 (기각)

```
AI 실패 → 랜덤 Mock 결과 반환 → UI에 "추정 결과" 배지 표시
```

**기각 이유**:

- 퍼스널컬러는 4개 시즌 중 1개를 결정하는 분석
- 랜덤 Mock은 75% 확률로 **틀린 결과**를 제공
- 사용자가 틀린 시즌 기반으로 의류/화장품을 구매하면 실질적 피해
- "추정 결과" 배지를 사용자가 무시할 가능성 높음

### 대안 2: 캐시된 이전 결과 반환 (부분 채택)

```
AI 실패 → 이전 분석 결과 존재 시 해당 결과 표시
```

**부분 채택**: 이전 결과가 있는 경우 GET API로 조회 가능하므로 별도 구현 불필요.
새 분석 요청 실패 시에는 에러 반환이 올바른 동작.

### 대안 3: 에러 + 재시도 UI (채택)

```
AI 실패 → 503 에러 반환 → 클라이언트에서 "다시 시도" 버튼 표시
```

**채택 이유**:

- 정직한 실패가 부정확한 결과보다 사용자 신뢰에 기여
- 재시도로 일시적 네트워크/API 문제 해결 가능
- 지속 실패 시 사용자가 나중에 다시 시도 가능

## 구현

### 서버 (POST route)

```typescript
// AI 분석 실패 시 (route.ts line 305-317)
} catch (aiError) {
  // 신뢰성 문제로 랜덤 Mock Fallback 금지 - 에러를 사용자에게 전달
  console.error('[PC-1] AI analysis failed:', aiError);
  return NextResponse.json(
    {
      error: 'AI 분석 실패',
      retryable: true,
    },
    { status: 503 }
  );
}
```

### 클라이언트 (결과 페이지)

```typescript
// 503 감지 시 재시도 가능 표시
if (!response.ok) {
  const retryable = response.status >= 500;
  setIsRetryable(retryable);
  throw new Error(json.error || '결과를 불러올 수 없습니다');
}

// 에러 UI에서 재시도 버튼 표시
{isRetryable ? (
  <Button onClick={handleRetry}>다시 시도</Button>
) : (
  <Button onClick={handleNewAnalysis}>새로 분석하기</Button>
)}
```

### Mock 사용 허용 조건

| 조건                             | Mock 사용 | 설명           |
| -------------------------------- | --------- | -------------- |
| `useMock=true` (클라이언트 요청) | 허용      | 개발/테스트용  |
| `FORCE_MOCK=true` (환경변수)     | 허용      | 개발 환경 전용 |
| AI 실패 (프로덕션)               | **금지**  | 503 에러 반환  |

## 결과

- 사용자는 항상 실제 AI 분석 결과 또는 명시적 에러를 받음
- Mock 데이터가 프로덕션에서 실제 결과로 위장되지 않음
- 일시적 AI 실패 시 재시도 UI로 사용자 경험 보전

## 관련 문서

- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) - 일반 Fallback 정책
- [error-handling-patterns.md](../../.claude/rules/error-handling-patterns.md) - 3단계 폴백 전략
- [draping-simulation.md](../principles/draping-simulation.md) - 드레이핑 시뮬레이션 원리

---

**Version**: 1.0 | **Created**: 2026-02-06
