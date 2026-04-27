# SDD-INTEGRATED-ANALYSIS — 통합 분석 플로우 스펙

> **Version**: 1.1 | **Created**: 2026-04-23 | **Status**: implemented (Phase A)
> **상위 ADR**: [ADR-099](../adr/ADR-099-integrated-analysis-flow.md) (accepted)
> **근거 원리**: [image-processing.md](../principles/image-processing.md), [ai-inference.md](../principles/ai-inference.md)
>
> **Phase A 완료 (2026-04-23)**: 10 ATOM 전체 구현, 22 tests pass, typecheck/lint 0 errors.
> **남은 작업**: Phase B(UI), Phase C(홈/랜딩 재설계) — 별도 ADR

---

## 1. 개요

### 1.1 목적

5축(PC/S/C/H/M) 분석을 **단일 입력 세션**으로 병렬 실행하고, **하나의 세션 ID**로 묶인 통합 결과를 반환하는 API 및 데이터 파이프라인을 정의한다.

### 1.2 범위

**포함:**

- 통합 API 엔드포인트 (`POST /api/analyze/integrated`)
- 세션 테이블 + 각 결과 테이블 `session_id` FK 추가 (DB 마이그레이션)
- 5축 병렬 오케스트레이션 모듈 (`lib/analysis/integrated/`)
- Partial Success 처리 로직
- M-1 Composer 로직 (PC+S 결과 조합)
- 통합 테스트

**제외:**

- 통합 결과 페이지 UI (Phase B, 별도 SDD)
- 홈/랜딩 재설계 (Phase C)
- 모바일 앱 통합 플로우 (웹 검증 후)
- 통합 VTO/제품 매칭 (별도 ADR)

### 1.3 성공 기준

- 5축 중 4축 이상 성공률 95%+ (실측, Mock Fallback 포함)
- p95 응답 시간 10초 이내
- 기존 개별 분석 API 100% 하위 호환
- typecheck + lint + test 모두 통과

---

## 2. 입력 스펙

### 2.1 요청 스키마 (Zod)

```typescript
// lib/analysis/integrated/types.ts
import { z } from 'zod';

export const integratedAnalysisInputSchema = z.object({
  // 얼굴 셀카 (필수) — PC/S/H 축 공유
  faceImageBase64: z
    .string()
    .min(1, '얼굴 사진이 필요해요')
    .refine((val) => val.startsWith('data:image/'), '올바른 이미지 형식이 아니에요'),

  // 전신 사진 (선택) — C 축 전용
  bodyImageBase64: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('data:image/'), '올바른 이미지 형식이 아니에요'),

  // 축별 자가입력 (필수 문항 최소화, 2분 내 완료 목표)
  questionnaire: z.object({
    // S-1 피부 — 1문항
    skin: z
      .object({
        selfReportedType: z
          .enum(['dry', 'oily', 'combination', 'normal', 'sensitive', 'unknown'])
          .default('unknown'),
        concerns: z.array(z.string()).max(5).default([]), // 선택적 심화
      })
      .default({}),

    // H-1 헤어 — 3문항
    hair: z
      .object({
        length: z.enum(['very_short', 'short', 'medium', 'long', 'very_long']).optional(),
        density: z.enum(['thin', 'medium', 'thick']).optional(),
        curlType: z.enum(['straight', 'wavy', 'curly', 'coily']).optional(),
      })
      .default({}),

    // C-1 체형 — 4문항 (전신 사진 없을 때 필수)
    body: z
      .object({
        heightCm: z.number().int().min(100).max(220).optional(),
        weightKg: z.number().int().min(30).max(200).optional(),
        shoulderWidthCm: z.number().int().min(25).max(60).optional(),
        waistCm: z.number().int().min(40).max(150).optional(),
      })
      .default({}),
  }),

  // 분석 옵션
  options: z
    .object({
      locale: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
      skipMakeup: z.boolean().default(false), // 테스트/디버그용
    })
    .default({}),
});

export type IntegratedAnalysisInput = z.infer<typeof integratedAnalysisInputSchema>;
```

### 2.2 입력 검증 체크포인트

| 검증 단계     | 위치                                | 실패 응답                |
| ------------- | ----------------------------------- | ------------------------ |
| 인증          | API 라우트 진입                     | 401 `AUTH_ERROR`         |
| Rate Limit    | 인증 후                             | 429 `RATE_LIMIT_ERROR`   |
| Zod 스키마    | Body 파싱 후                        | 400 `VALIDATION_ERROR`   |
| CIE-1 품질    | 얼굴 이미지 (필수)                  | 400 `IMAGE_QUALITY`      |
| CIE-1 품질    | 전신 이미지 (있을 때)               | 400 `IMAGE_QUALITY`      |
| C-1 입력 조합 | bodyImage/자가입력 중 최소 1개 필요 | 400 `BODY_INPUT_MISSING` |

### 2.3 페이로드 제약

- 이미지 2장 Base64 합계 최대 ~4MB (Vercel body limit 4.5MB 내)
- 얼굴 이미지 권장: 1024px, JPEG, quality 80%
- 전신 이미지 권장: 1280px, JPEG, quality 80%
- 프론트에서 `lib/image/preprocess.ts` 재사용으로 압축

---

## 3. 출력 스펙

### 3.1 응답 스키마

```typescript
// lib/analysis/integrated/types.ts
export interface IntegratedAnalysisResult {
  sessionId: string;
  status: 'completed' | 'partial' | 'failed';
  axes: {
    personalColor: AxisResult<PersonalColorResult>;
    skin: AxisResult<SkinResult>;
    body: AxisResult<BodyResult>;
    hair: AxisResult<HairResult>;
    makeup: AxisResult<MakeupResult>; // PC+S 기반 composer 결과
  };
  axesCompleted: string[]; // ['personal_color', 'skin', ...]
  axesFailed: string[];
  createdAt: string;
  completedAt: string;
  usedFallback: string[]; // Mock Fallback이 적용된 축 목록
}

export type AxisResult<T> =
  | { success: true; data: T; usedFallback: boolean }
  | { success: false; error: AxisError };

export interface AxisError {
  code:
    | 'AI_TIMEOUT'
    | 'AI_SERVICE_ERROR'
    | 'IMAGE_QUALITY'
    | 'MISSING_INPUT'
    | 'REQUIRES_PC_AND_S' // M-1 전용
    | 'UNKNOWN';
  message: string; // 기술 메시지 (로깅)
  userMessage: string; // 한국어 사용자 메시지
  retryable: boolean; // 다시 시도 가능 여부
}
```

### 3.2 HTTP 상태 코드

| 상태            | 조건                             | HTTP 코드                              |
| --------------- | -------------------------------- | -------------------------------------- |
| `completed`     | 5축 모두 성공                    | 200                                    |
| `partial`       | 1~4축 성공                       | 200                                    |
| `failed`        | 모두 실패 (Mock Fallback도 실패) | 200 또는 502 (재시도 가능 여부로 판단) |
| 입력 검증 실패  | Zod/CIE-1 실패                   | 400                                    |
| 인증 실패       | Clerk userId 없음                | 401                                    |
| Rate Limit 초과 | 20 req/24h 초과                  | 429                                    |
| 서버 오류       | 예상 밖 예외                     | 500                                    |

> **결정**: Partial/Failed도 HTTP 200으로 반환 (클라이언트가 `status` 필드로 분기). HTTP 500/502는 **복구 불가능한** 서버 오류에만 사용.

### 3.3 응답 예시

**완전 성공:**

```json
{
  "sessionId": "7a3f...",
  "status": "completed",
  "axes": {
    "personalColor": { "success": true, "data": { "season": "spring", "tone": "warm_light", ... }, "usedFallback": false },
    "skin": { "success": true, "data": { "type": "combination", "scores": {...} }, "usedFallback": false },
    "body": { "success": true, "data": { "type": "S", ... }, "usedFallback": false },
    "hair": { "success": true, "data": { "faceShape": "oval", ... }, "usedFallback": false },
    "makeup": { "success": true, "data": { "palette": [...], "tutorial": {...} }, "usedFallback": false }
  },
  "axesCompleted": ["personal_color", "skin", "body", "hair", "makeup"],
  "axesFailed": [],
  "createdAt": "2026-04-23T10:00:00Z",
  "completedAt": "2026-04-23T10:00:08Z",
  "usedFallback": []
}
```

**부분 실패:**

```json
{
  "sessionId": "7a3f...",
  "status": "partial",
  "axes": {
    "personalColor": { "success": true, ... },
    "skin": { "success": true, ... },
    "body": { "success": false, "error": { "code": "MISSING_INPUT", "message": "No body image or measurements", "userMessage": "체형 분석을 위해 전신 사진이나 신체 정보가 필요해요", "retryable": true }},
    "hair": { "success": true, ... },
    "makeup": { "success": true, ... }
  },
  "axesCompleted": ["personal_color", "skin", "hair", "makeup"],
  "axesFailed": ["body"],
  ...
}
```

---

## 4. 데이터베이스 스펙

### 4.1 신규 테이블

```sql
-- 파일: supabase/migrations/20260423_integrated_analysis_sessions.sql

CREATE TABLE IF NOT EXISTS integrated_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  face_image_url TEXT,
  body_image_url TEXT,
  questionnaire JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'completed', 'failed')),
  axes_completed TEXT[] NOT NULL DEFAULT '{}',
  axes_failed TEXT[] NOT NULL DEFAULT '{}',
  used_fallback TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE integrated_analysis_sessions IS 'ADR-099 통합 분석 플로우 - 5축 분석 세션';
COMMENT ON COLUMN integrated_analysis_sessions.axes_completed IS '성공한 축 코드 배열 (personal_color/skin/body/hair/makeup)';
COMMENT ON COLUMN integrated_analysis_sessions.axes_failed IS '실패한 축 코드 배열';
COMMENT ON COLUMN integrated_analysis_sessions.used_fallback IS 'Mock Fallback이 적용된 축 코드 배열';

-- 인덱스
CREATE INDEX idx_integrated_sessions_user
  ON integrated_analysis_sessions(clerk_user_id, created_at DESC);

CREATE INDEX idx_integrated_sessions_status
  ON integrated_analysis_sessions(status)
  WHERE status IN ('pending', 'partial');

-- RLS
ALTER TABLE integrated_analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_sessions_select"
  ON integrated_analysis_sessions FOR SELECT
  USING (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_sessions_insert"
  ON integrated_analysis_sessions FOR INSERT
  WITH CHECK (clerk_user_id = auth.get_user_id());

CREATE POLICY "user_own_sessions_update"
  ON integrated_analysis_sessions FOR UPDATE
  USING (clerk_user_id = auth.get_user_id());
```

### 4.2 기존 테이블 컬럼 추가 (실제 테이블명 반영)

```sql
-- 각 결과 테이블에 session_id FK 추가 (NULLABLE, 하위 호환)
ALTER TABLE personal_color_assessments
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

ALTER TABLE skin_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

ALTER TABLE body_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

ALTER TABLE hair_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

ALTER TABLE makeup_analyses
  ADD COLUMN IF NOT EXISTS session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;

-- 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_pc_assessments_session
  ON personal_color_assessments(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_skin_analyses_session
  ON skin_analyses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_body_analyses_session
  ON body_analyses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hair_analyses_session
  ON hair_analyses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_makeup_analyses_session
  ON makeup_analyses(session_id) WHERE session_id IS NOT NULL;
```

### 4.3 실제 테이블명 확정 (2026-04-23 검증 완료)

> **검증 결과**: 실제 `supabase/migrations/` 파일 기준 테이블명 이질적임 — PC만 `_assessments`, 나머지 4개는 `_analyses`.

| 축  | 실제 테이블명                |
| --- | ---------------------------- |
| PC  | `personal_color_assessments` |
| S   | `skin_analyses`              |
| C   | `body_analyses`              |
| H   | `hair_analyses`              |
| M   | `makeup_analyses`            |

위 섹션 4.2의 ALTER TABLE SQL은 이 이름으로 수정해서 적용해야 함.

### 4.4 롤백 스크립트

```sql
-- 파일: supabase/migrations/rollback/20260423_integrated_analysis_sessions_rollback.sql

ALTER TABLE makeup_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE hair_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE body_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE skin_analyses DROP COLUMN IF EXISTS session_id;
ALTER TABLE personal_color_assessments DROP COLUMN IF EXISTS session_id;

DROP TABLE IF EXISTS integrated_analysis_sessions;
```

### 4.5 M-1 Composer 신규 작성 필요 (2026-04-23 검증 완료)

> **현재 상태**: M-1은 독립 Gemini 분석으로 구현돼 있어 ADR-098 "실행 층" 원칙과 괴리.
> **필요 작업**: PC + S 결과를 입력받아 M-1 추천을 생성하는 순수 함수 composer 신규 작성.

```typescript
// lib/analysis/integrated/internal/makeup-composer.ts (신규)
export function composeMakeup(
  pcResult: PersonalColorResult,
  skinResult: SkinAnalysisResult
): MakeupComposerOutput;
```

- 기존 `lib/analysis/makeupSkinInsight.ts` (S→M 조정 로직)는 **재사용 가능**
- 기존 `lib/analysis/makeup/` (독립 M-1 분석)은 **통합 플로우에서 사용 안 함** (레거시 유지)
- 통합 플로우에서 M-1은 **AI 호출 없음** (composer 로직만)

---

## 5. 모듈 구조 (P8 캡슐화)

### 5.1 폴더 구조

```
apps/web/lib/analysis/integrated/
├── index.ts              # 공개 API (Barrel)
├── types.ts              # 공개 타입
├── orchestrator.ts       # 메인 오케스트레이션
├── BOUNDARIES.md         # 경계 정의
└── internal/
    ├── session-store.ts       # 세션 테이블 CRUD
    ├── axis-adapters.ts       # 각 축 분석 함수 표준 래퍼
    ├── makeup-composer.ts     # PC+S → M 조합 로직
    ├── partial-result.ts      # Partial Success 처리
    └── error-normalizer.ts    # 축별 에러를 AxisError로 정규화

apps/web/app/api/analyze/integrated/
└── route.ts              # POST 핸들러
```

### 5.2 공개 API (index.ts)

```typescript
export { runIntegratedAnalysis } from './orchestrator';
export type {
  IntegratedAnalysisInput,
  IntegratedAnalysisResult,
  AxisResult,
  AxisError,
} from './types';
export { integratedAnalysisInputSchema } from './types';
```

### 5.3 의존성 방향 (P8)

```
API Route (app/api/analyze/integrated/route.ts)
   ↓
Domain Orchestrator (lib/analysis/integrated/orchestrator.ts)
   ↓
Axis Adapters (internal/axis-adapters.ts)
   ↓
기존 축 모듈 (lib/analysis/personal-color-v2, lib/analysis/skin, lib/analysis/body, lib/analysis/hair)
   ↓
Gemini / Supabase / Image Engine
```

- 역방향 호출 금지
- 기존 축 모듈은 black box로 취급 (내부 변경 금지)

---

## 6. P3 원자 분해

### ATOM 1: 세션 테이블 마이그레이션 작성 (1.5시간)

- 입력: 없음
- 출력: `supabase/migrations/20260423_integrated_analysis_sessions.sql` + rollback
- 성공 기준:
  - 로컬 Supabase에 `supabase db push` 성공
  - RLS 정책 적용 확인
  - 5개 기존 테이블에 `session_id` 컬럼 존재
- 의존성: 없음

### ATOM 2: 입력/출력 타입 + Zod 스키마 (1시간)

- 입력: ADR-099 + 본 SDD 2장, 3장
- 출력: `lib/analysis/integrated/types.ts`
- 성공 기준: typecheck 통과, Zod parse 유닛 테스트 3개 통과
- 의존성: 없음

### ATOM 3: Session Store 구현 (1.5시간)

- 입력: ATOM 1 (테이블), ATOM 2 (타입)
- 출력: `lib/analysis/integrated/internal/session-store.ts`
  - `createSession()`, `updateSessionStatus()`, `finalizeSession()`, `getSession()`
- 성공 기준: CRUD 각 함수 유닛 테스트 (DB mock)
- 의존성: ATOM 1, 2

### ATOM 4: Axis Adapters 구현 (2시간)

- 입력: 기존 축 분석 함수들
- 출력: `lib/analysis/integrated/internal/axis-adapters.ts`
  - `analyzePCAdapter()`, `analyzeSkinAdapter()`, `analyzeBodyAdapter()`, `analyzeHairAdapter()`
  - 각 함수는 축별 입력을 받아 `AxisResult<T>` 반환 (표준화)
- 성공 기준:
  - 각 adapter가 성공/실패 케이스 모두 `AxisResult` 형식으로 반환
  - Mock Fallback 적용 시 `usedFallback: true` 플래그
- 의존성: ATOM 2

### ATOM 5: Makeup Composer 구현 (1시간)

- 입력: PC + S 결과
- 출력: `lib/analysis/integrated/internal/makeup-composer.ts`
  - `composeMakeup(pcResult, skinResult): MakeupResult`
- 성공 기준:
  - PC+S 모두 성공 시 MakeupResult 생성
  - 하나라도 실패 시 `AxisError.REQUIRES_PC_AND_S` 반환
  - 기존 M-1 composer 로직 재사용 (이미 있으면)
- 의존성: ATOM 2, 4

### ATOM 6: Orchestrator 구현 (2시간)

- 입력: ATOM 3, 4, 5
- 출력: `lib/analysis/integrated/orchestrator.ts`
  - `runIntegratedAnalysis(input, userId): Promise<IntegratedAnalysisResult>`
- 성공 기준:
  - `Promise.allSettled`로 4축 병렬 실행
  - M-1은 PC+S 완료 후 실행
  - 세션 상태 업데이트 (pending → partial/completed/failed)
  - 예외는 절대 throw하지 않음 (항상 AxisError로 정규화)
- 의존성: ATOM 3, 4, 5

### ATOM 7: API Route 구현 (1.5시간)

- 입력: ATOM 6
- 출력: `app/api/analyze/integrated/route.ts`
  - POST 핸들러: 인증 → Rate Limit → Zod → Orchestrator → 응답
- 성공 기준:
  - 인증 없을 때 401
  - Rate Limit 초과 시 429
  - 입력 오류 시 400
  - 정상 흐름 200 + `IntegratedAnalysisResult`
- 의존성: ATOM 2, 6

### ATOM 8: 통합 테스트 (2시간)

- 입력: 전체 구현
- 출력: `tests/api/analyze/integrated.test.ts`, `tests/lib/analysis/integrated/orchestrator.test.ts`
- 성공 기준:
  - 완전 성공 케이스 1개
  - Partial Success 케이스 (C-1 실패) 1개
  - 완전 실패 케이스 1개
  - 인증/Rate Limit/Zod 에러 케이스 각 1개
  - 총 6+ 테스트, 모두 통과
- 의존성: ATOM 7

### ATOM 9: 공개 API + Barrel Export (0.5시간)

- 입력: 전체 구현
- 출력: `lib/analysis/integrated/index.ts`, `BOUNDARIES.md`
- 성공 기준: 공개 API 목록 정리, 내부 구현 비노출 확인
- 의존성: ATOM 7, 8

### ATOM 10: 문서 동기화 (1시간)

- 입력: 구현 완료 후
- 출력:
  - `docs/adr/ADR-099-integrated-analysis-flow.md` 상태 `proposed` → `accepted`
  - `docs/adr/README.md` 인덱스 업데이트
  - `docs/specs/README.md` 인덱스 업데이트
  - `docs/DATABASE-SCHEMA.md` 신규 테이블 + 컬럼 반영
- 성공 기준: doc-sync.md 체크리스트 모두 통과
- 의존성: 전체 완료 후

### 총 소요 시간 예상

- 10 ATOM × 평균 1.4시간 = **약 14시간** (순차 기준)
- 병렬 가능: ATOM 1 + 2 동시 → 약 12시간으로 단축 가능

---

## 7. 에러 처리 전략

### 7.1 축별 에러 정규화

```typescript
// internal/error-normalizer.ts
export function normalizeAxisError(axis: string, error: unknown): AxisError {
  if (error instanceof TimeoutError) {
    return {
      code: 'AI_TIMEOUT',
      message: `${axis} analysis timeout`,
      userMessage: '분석 시간이 초과됐어요. 다시 시도해주세요.',
      retryable: true,
    };
  }
  if (error instanceof ImageQualityError) {
    return {
      code: 'IMAGE_QUALITY',
      message: `${axis} image quality failed`,
      userMessage: '사진이 선명하지 않아요. 자연광에서 다시 찍어주세요.',
      retryable: true,
    };
  }
  // ... 기타
  return {
    code: 'UNKNOWN',
    message: String(error),
    userMessage: '일시적인 오류가 발생했어요.',
    retryable: true,
  };
}
```

### 7.2 Mock Fallback 정책

- 각 축 adapter는 기존 Mock Fallback(ADR-007) 호출
- Fallback 적용 시 `AxisResult.usedFallback: true`
- 세션 `used_fallback` 배열에 기록
- 클라이언트는 "추정 결과" 뱃지 표시

### 7.3 완전 실패 (status: 'failed')

- 5축 모두 실패 + Mock Fallback도 실패 = 실질적으로 서버 장애
- HTTP 502 반환 + 세션은 `status: failed`로 저장
- 클라이언트는 "다시 시도" 버튼만 노출

---

## 8. 성능 및 관찰성

### 8.1 성능 목표

| 메트릭               | 목표   |
| -------------------- | ------ |
| p50 응답 시간        | < 6초  |
| p95 응답 시간        | < 10초 |
| p99 응답 시간        | < 15초 |
| 5축 중 4축+ 성공률   | > 95%  |
| Mock Fallback 발동률 | < 5%   |

### 8.2 로깅

```typescript
logger.info('[Integrated]', 'session started', { sessionId, userId });
logger.info('[Integrated]', 'axis completed', { sessionId, axis, durationMs, usedFallback });
logger.warn('[Integrated]', 'axis failed', { sessionId, axis, error: errorCode });
logger.info('[Integrated]', 'session finalized', { sessionId, status, axesCompleted });
```

### 8.3 애널리틱스 이벤트

- `integrated_analysis_started` — 세션 생성 시점
- `integrated_analysis_completed` — 세션 종료 (status 포함)
- `integrated_axis_failed` — 축별 실패 (축 코드 + 에러 코드)

---

## 9. 테스트 기준

### 9.1 단위 테스트 (필수)

- `session-store.test.ts` — CRUD 함수 각각
- `axis-adapters.test.ts` — 각 축 adapter 성공/실패
- `makeup-composer.test.ts` — PC+S 조합, 부분 입력 실패
- `error-normalizer.test.ts` — 에러 유형별 정규화

### 9.2 통합 테스트 (필수)

- `orchestrator.test.ts` — Promise.allSettled 병렬 + Partial Success
- `integrated.test.ts` (API) — 인증/Zod/Rate Limit/정상 흐름

### 9.3 E2E (선택, Phase B에서)

- 실제 이미지 업로드 → 통합 결과 페이지 확인 (Phase B 결과 UI 완성 후)

---

## 10. 의존성 및 하위 호환

### 10.1 기존 자산 재사용

| 자산                              | 역할             | 변경 여부 |
| --------------------------------- | ---------------- | --------- |
| `lib/analysis/personal-color-v2/` | PC-1 분석        | 변경 없음 |
| `lib/analysis/skin/`              | S-1 분석         | 변경 없음 |
| `lib/analysis/body/`              | C-1 분석         | 변경 없음 |
| `lib/analysis/hair/`              | H-1 분석         | 변경 없음 |
| `lib/image/preprocess.ts`         | 이미지 압축      | 변경 없음 |
| `lib/image/cie1/`                 | 이미지 품질 검증 | 변경 없음 |
| `lib/api/rate-limit.ts`           | Rate Limiting    | 변경 없음 |
| ADR-007 Mock Fallback             | 축별 Fallback    | 변경 없음 |

### 10.2 하위 호환

- 기존 `/api/analyze/{personal-color,skin,body,hair}` 엔드포인트 **100% 유지**
- 기존 개별 결과 테이블 **100% 유지** (컬럼 추가만)
- 기존 개별 결과 페이지 URL **100% 유지**
- 기존 사용자 데이터 **무변경** (session_id NULL)

---

## 11. 참고 문서

- [ADR-099 통합 분석 플로우](../adr/ADR-099-integrated-analysis-flow.md) — 상위 아키텍처 결정
- [ADR-098 정체성 재정의 v2](../adr/ADR-098-identity-redefinition-5axis-model.md) — 5축 모델 근거
- [ADR-007 Mock Fallback](../adr/ADR-007-mock-fallback-strategy.md) — 부분 실패 복구 기반
- [SDD-ANALYSIS-DB-SCHEMA](./SDD-ANALYSIS-DB-SCHEMA.md) — 기존 분석 테이블 구조
- [SDD-AI-TRANSPARENCY](./SDD-AI-TRANSPARENCY.md) — Fallback 표시 UI 기준
- [principles/ai-inference.md](../principles/ai-inference.md) — AI 호출 원리
- [principles/image-processing.md](../principles/image-processing.md) — CIE-1 품질 검증

---

**Author**: Claude Code
**Reviewed by**: -
