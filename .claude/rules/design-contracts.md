# 설계 계약 (Design-Time Contracts)

> 코드 파일을 열기 **전, 계획/설계 단계**에서 확정되는 교차 계약. 경로 스코프 규칙은 파일을 읽어야 로딩되므로, 이 계약들은 계획 중에도 보이도록 **always-on**으로 둔다. 각 항목의 상세·예시·팩토리 코드는 해당 scoped 규칙 참조.

## 1. 에러 봉투 (AppError)

모든 에러는 `AppError` 형태로 통일한다 (모듈 간 사전 합의 계약):

```typescript
{ code: ErrorCode; message: string; userMessage: string; details?: Record<string, unknown> }
```

- `message`는 기술 메시지(로깅용), **`userMessage`는 사용자 대면 한국어 필수**(정중·자연스럽게).
- 3단 폴백: 재시도(retry) → 대체(fallback) → 우아한 실패(graceful degradation).
- 상세 → `error-handling-patterns.md` (scoped: `**/*.ts`)

## 2. API 응답 봉투

- 성공: `{ success: true, data, pagination? }`
- 실패: `{ success: false, error: { code, message, userMessage, details? } }`
- HTTP 상태: 200 · 201 생성 · 204 삭제 · 400 검증 · 401 인증 · 403 권한 · 404 없음 · 409 충돌 · 429 제한 · 500 서버.
- 사용자 입력은 **Zod 검증** 후 처리.
- 상세 → `api-design.md` (scoped: `**/app/api/**`)

## 3. AI 호출 불변식 (Mock 폴백)

이룸 제품의 핵심 계약 — 새 분석 축을 설계할 때 반드시 준수:

- **모든 AI 호출은 Mock 폴백 필수.** 타임아웃 3s / 재시도 2회.
- 폴백 시 결과에 `usedFallback: true`(또는 `isMock`) + **낮은 신뢰도**를 표시하고 UI에 정직하게 노출한다.
- 프롬프트에는 원리 문서(`docs/principles/`)의 수치·기준을 주입한다(Level 2).
- 상세 → `ai-integration.md`·`hybrid-data-pattern.md` (scoped), [ADR-007](../../docs/adr/ADR-007-mock-fallback-strategy.md)

---

**Version**: 1.0 | **Created**: 2026-07-12 | always-on. 계획-시점에 안 뜨던 3대 교차 계약(에러 봉투·API 봉투·AI 폴백)을 표면화 — 상세는 scoped 규칙 유지.
