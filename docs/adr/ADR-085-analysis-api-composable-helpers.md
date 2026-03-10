# ADR-085: Analysis API Composable Helpers

> **상태**: accepted
> **날짜**: 2026-03-10
> **관련**: ADR-007 (Mock Fallback), ADR-010 (AI Pipeline), ADR-068 (DB Resilience)

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

새 분석 모듈 API를 추가할 때 5개 조합형 헬퍼를 import하고 도메인 로직만 작성하면 되는 상태.
인증, Rate Limit, AI 폴백, DB 저장, 게이미피케이션이 모두 재사용 가능한 단위로 분리됨.

### 100점 기준

| 지표                          | 100점 기준 | 현재  | 비고                                   |
| ----------------------------- | ---------- | ----- | -------------------------------------- |
| 새 API 추가 시 보일러플레이트 | 0줄        | ~80줄 | 인증+Rate Limit+폴백+DB+게이미피케이션 |
| 중복 코드율                   | 0%         | ~68%  | 14개 핸들러 간                         |
| 헬퍼 단위 테스트              | 100%       | 0%    | 헬퍼 미존재                            |

### 현재 목표: 70%

이번 구현에서 5개 헬퍼 추출 + 테스트. 기존 14개 route.ts는 수정하지 않음 (OCP).

### 의도적 제외

| 제외 항목                           | 이유                                | 재검토 시점                          |
| ----------------------------------- | ----------------------------------- | ------------------------------------ |
| 기존 14개 route.ts 리팩토링         | OCP: 작동하는 코드 수정 금지        | 새 분석 모듈 추가 시 자연스럽게 전환 |
| 단일 `createAnalysisRoute()` 팩토리 | 도메인 로직 끼어들 여지 없음        | -                                    |
| 미들웨어 체인 패턴                  | App Router에서 미들웨어 중첩 미지원 | Next.js 업데이트 시                  |

## 1. 맥락 (Context)

14개 분석 API 핸들러에 공통 6단계 파이프라인이 반복됨:

```
1. auth → Clerk 인증 확인
2. validate → Rate Limit + 입력 검증
3. AI/mock → Gemini 호출 또는 Mock 폴백
4. DB save → Supabase 저장 (실패 시 합성 응답)
5. gamification → XP + 뱃지 수여
6. respond → JSON 응답 구성
```

총 ~3,500줄 중 ~2,400줄(68%)이 중복. 각 핸들러에서 인증 15줄, AI 폴백 40줄, DB 저장 30줄, 게이미피케이션 25줄이 거의 동일하게 반복됨.

## 2. 결정 (Decision)

**조합형 서브 헬퍼 5개를 추출**한다. 모놀리식 팩토리가 아닌 독립 함수로, 각 API 핸들러가 필요한 것만 import하여 조합.

### 헬퍼 목록

| 헬퍼                  | 역할                        | 시그니처                                               |
| --------------------- | --------------------------- | ------------------------------------------------------ |
| `withAnalysisAuth`    | Clerk 인증 + Rate Limit     | `(req, userId?) → { userId } \| ErrorResponse`         |
| `withAIFallback<T>`   | AI 호출 + Mock 폴백         | `(aiCall, mockCall, opts?) → { result, usedFallback }` |
| `saveWithFallback<T>` | DB 저장 + 합성 응답 폴백    | `(saveOp) → { data, dbSaveFailed }`                    |
| `withGamification`    | XP + 뱃지 수여              | `(supabase, userId, badgeType) → GamificationResult`   |
| `uploadAnalysisImage` | 이미지 업로드 (해당 모듈만) | `(supabase, userId, base64, bucket) → url`             |

### 디렉토리 구조

```
lib/api/analysis-helpers/
├── index.ts              # Barrel export (P8)
├── types.ts              # 공유 타입
├── auth.ts               # withAnalysisAuth
├── ai-fallback.ts        # withAIFallback
├── db-save.ts            # saveWithFallback
├── gamification.ts       # withGamification
└── image-upload.ts       # uploadAnalysisImage
```

## 3. 대안 (Alternatives)

### 3.1 단일 `createAnalysisRoute()` 팩토리 (기각)

```typescript
// 기각: 도메인 로직이 config 객체에 갇힘
export const POST = createAnalysisRoute({
  schema: skinSchema,
  analyze: analyzeSkin,
  mock: generateMockSkin,
  tableName: 'skin_assessments',
  badgeType: 'skin',
});
```

**기각 이유**: 분석 모듈마다 DB 매핑, 후처리, 추가 쿼리 등 도메인 특화 로직이 다름. 단일 팩토리로는 이 다양성을 수용할 수 없고, config 옵션이 폭발적으로 증가함.

### 3.2 미들웨어 체인 패턴 (기각)

**기각 이유**: Next.js App Router는 라우트별 미들웨어 중첩을 지원하지 않음. `proxy.ts`만 전역으로 존재.

### 3.3 현상 유지 (기각)

**기각 이유**: 새 분석 모듈 추가 시 ~80줄 보일러플레이트 복사 필요. 인증/폴백 로직 변경 시 14곳 수정 필요.

## 4. 적용 전략 (OCP 준수)

```
기존 14개 route.ts → 수정하지 않음 (작동하는 코드)
향후 새 분석 모듈 → 헬퍼 사용하여 작성
기존 코드 → 자연스럽게 리팩토링 기회가 올 때 전환 (강제 금지)
```

## 5. 관련 문서

- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) — AI 폴백 패턴
- [ADR-010: AI 파이프라인](./ADR-010-ai-pipeline.md) — 6단계 파이프라인 정의
- [ADR-068: DB 저장 실패 시 합성 응답](./ADR-068-analysis-api-db-resilience.md) — DB 폴백
- [OCP 패턴 규칙](../../.claude/rules/ocp-patterns.md) — 기존 코드 수정 금지 원칙

---

**Version**: 1.0 | **Created**: 2026-03-10
