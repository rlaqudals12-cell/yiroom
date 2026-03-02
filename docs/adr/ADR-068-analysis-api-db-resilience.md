# ADR-068: 분석 API DB 저장 실패 시 합성 응답 반환

## 상태

**승인** (2026-03-03)

## 컨텍스트

11개 분석 API 라우트에서 AI/Mock 분석이 성공한 후 DB 저장(`INSERT`)이 실패하면
500 에러가 반환되어 분석 결과가 사용자에게 전달되지 않는 문제가 있었다.

### 문제 시나리오

```
1. 사용자가 분석 요청
2. AI/Mock 분석 성공 (수 초~수십 초 소요)
3. DB 저장 실패 (RLS, 네트워크, 스키마 불일치 등)
4. → 500 에러 반환 → 분석 결과 유실
```

### 발생 조건

- 개발 서버: `FORCE_MOCK_AI=true` + Supabase 환경변수 미설정
- 프로덕션: Supabase 네트워크 일시 장애, RLS 정책 불일치
- Vercel 환경변수 오염 (`\n` 문자 포함)

### 관련 모듈

| 유형 | 라우트 수                           | Mock 플래그               |
| ---- | ----------------------------------- | ------------------------- |
| V1   | 6개 (PC-1, S-1, C-1, H-1, M-1, A-1) | `usedMock`                |
| V2   | 4개 (PC-2, S-2, C-2, H-2)           | `usedFallback`            |
| 제외 | 1개 (ingredients)                   | Mock 미사용, DB 저장 없음 |

## 결정

**DB 저장 실패 시 합성 ID로 분석 결과를 반환한다.**

### 원칙

> "분석 결과는 절대 유실하지 않는다"

비용이 높은 AI 분석 결과를 DB 저장 실패 하나로 버리는 것은 사용자 경험을 크게 해친다.

### V1 vs V2 정책 차이

| 구분              | V1 라우트             | V2 라우트          |
| ----------------- | --------------------- | ------------------ |
| DB INSERT 에러    | Mock일 때만 합성 응답 | **항상** 합성 응답 |
| catch 블록        | Mock일 때만 합성 응답 | **항상** 합성 응답 |
| Real AI + DB 실패 | 500 에러 반환         | 합성 응답 반환     |
| 설계 철학         | DB 저장 보장 우선     | 사용자 경험 우선   |

V2 라우트가 더 관대한 이유:

- V2는 최신 아키텍처로, "분석 결과 유실 방지"를 최우선으로 설계
- 클라이언트 `sessionStorage` 폴백 체인이 이미 구현되어 DB 미저장도 안전

## 대안 검토

### 대안 1: DB 저장 실패 시 500 에러 (기존 동작, 기각)

```
AI 성공 → DB 실패 → 500 에러 → 분석 결과 유실
```

**기각 이유**: AI 분석에 수 초~수십 초 소요되는데, DB 실패로 결과를 완전히 버리는 것은 부적절.

### 대안 2: DB 저장 재시도 후 실패 시 에러 (기각)

```
AI 성공 → DB 실패 → 3회 재시도 → 실패 → 500 에러
```

**기각 이유**: 재시도로 응답 시간 증가, 재시도해도 실패하는 구조적 문제(RLS, 스키마)에는 무의미.

### 대안 3: 합성 ID + dbSaveFailed 플래그 (채택)

```
AI 성공 → DB 실패 → crypto.randomUUID() + dbSaveFailed: true → 분석 결과 반환
```

**채택 이유**:

- 분석 결과 유실 없음
- `dbSaveFailed` 플래그로 클라이언트가 상태 인지 가능
- 클라이언트 `sessionStorage` 폴백 체인과 자연스럽게 연동
- 게이미피케이션(XP, 배지)은 0으로 반환하여 무결성 보장

## 구현

### 합성 응답 구조

```typescript
{
  success: true,
  data: {
    id: crypto.randomUUID(),
    clerk_user_id: userId,
    created_at: new Date().toISOString(),
  },
  result,                     // 분석 결과 (유실 없음)
  usedMock: true,             // V1 / usedFallback: true (V2)
  dbSaveFailed: true,         // 클라이언트 감지용
  gamification: {
    badgeResults: [],
    xpAwarded: 0,             // DB 실패 시 XP 미지급
  },
}
```

### 적용 패턴

```typescript
// DB 작업 전체를 try-catch로 래핑
try {
  const supabase = createServiceRoleClient();
  // INSERT, users sync, gamification...
} catch (dbOperationError) {
  // V2: 항상 합성 응답 반환
  // V1: usedMock일 때만 합성 응답, 아니면 throw
  console.warn('[Module] DB operations failed, using synthetic response');
  return NextResponse.json({ success: true, ... , dbSaveFailed: true });
}
```

### 영향 파일 (11개)

**V1**: `personal-color`, `skin`, `body`, `hair`, `makeup`, `posture` route.ts
**V2**: `personal-color-v2`, `skin-v2`, `body-v2`, `hair-v2` route.ts

## 결과

- 개발 서버에서 DB 연결 없이도 분석 플로우 완전 동작
- 프로덕션에서 DB 일시 장애 시에도 분석 결과 반환 (V2)
- `dbSaveFailed` 플래그로 클라이언트 재시도 UI 제공 가능
- 게이미피케이션 무결성 유지 (DB 실패 시 XP/배지 미지급)

## 관련 문서

- [ADR-065: PC-1 Mock Fallback 금지 정책](./ADR-065-pc1-mock-fallback-policy.md) — AI 실패 시 Mock 금지 (별개 결정)
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) — 일반 Fallback 정책
- [트러블슈팅: 분석 API DB 저장 실패](../troubleshooting/2026-03-03-analysis-api-db-resilience.md) — 상세 이슈 기록
- [hybrid-data-pattern.md](../../.claude/rules/hybrid-data-pattern.md) — Hybrid 데이터 패턴

---

**Version**: 1.0 | **Created**: 2026-03-03
