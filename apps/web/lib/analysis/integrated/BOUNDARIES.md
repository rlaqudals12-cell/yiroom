# 통합 분석 모듈 경계 정의

> **Module**: `lib/analysis/integrated`
> **ADR**: [ADR-099](../../../../docs/adr/ADR-099-integrated-analysis-flow.md)
> **SDD**: [SDD-INTEGRATED-ANALYSIS](../../../../docs/specs/SDD-INTEGRATED-ANALYSIS.md)

---

## 공개 API (index.ts)

### 함수

- `runIntegratedAnalysis(input, clerkUserId): Promise<IntegratedAnalysisResult>` — 5축 병렬 분석 실행

### Zod 스키마

- `integratedAnalysisInputSchema` — 입력 검증 스키마
- `skinQuestionnaireSchema`, `hairQuestionnaireSchema`, `bodyQuestionnaireSchema` — 축별 자가입력

### 상수

- `AXIS_CODES` — 5축 식별자 배열

### 타입

- `IntegratedAnalysisInput`, `IntegratedAnalysisResult`
- `AxisCode`, `AxisResult<T>`, `AxisError`, `AxisErrorCode`
- `SessionStatus`, `IntegratedSessionRow`
- `PersonalColorAxisData`, `SkinAxisData`, `BodyAxisData`, `HairAxisData`, `MakeupAxisData`
- `SkinQuestionnaire`, `HairQuestionnaire`, `BodyQuestionnaire`

---

## 의존성 (이 모듈이 사용하는 것)

### 내부 (같은 앱)

- `@/lib/supabase/service-role` — DB 접근 (RLS 우회)
- `@/lib/analysis/personal-color-v2` — PC mock/분석
- `@/lib/analysis/skin-v2` — S mock/분석
- `@/lib/analysis/body-v2` — C mock/분석
- `@/lib/analysis/hair` — H mock/분석

### 외부

- `zod` — 입력 검증

---

## 사용처 (이 모듈을 사용하는 것)

- `app/api/analyze/integrated/route.ts` — 통합 분석 API 엔드포인트

---

## 호출 방향 (P8 준수)

```
app/api/analyze/integrated/route.ts (Presentation/API)
   ↓
lib/analysis/integrated/orchestrator.ts (Domain)
   ↓
lib/analysis/integrated/internal/* (Internal)
   ↓
lib/analysis/{pc,s,c,h}-v2 (기존 축 모듈, Black Box)
   ↓
lib/supabase/service-role (Repository)
```

**역방향 호출 금지**: Repository → Domain, 또는 internal → Presentation 금지.

---

## 금지 사항

1. **내부 파일 직접 import 금지**

   ```ts
   // ❌ 금지
   import { createSession } from '@/lib/analysis/integrated/internal/session-store';

   // ✅ 허용
   import { runIntegratedAnalysis } from '@/lib/analysis/integrated';
   ```

2. **기존 축 모듈(personal-color-v2 등) 내부 수정 금지**
   - 각 축 모듈은 Black Box로 취급
   - Mock 함수, 공개 타입만 사용
   - 내부 로직 변경 필요 시 별도 리팩토링 ADR 필요

3. **순환 의존성 금지**
   - 이 모듈을 다른 축 모듈(`lib/analysis/{pc,s,c,h}-v2`)에서 import 금지

---

## 파일 역할

| 파일                          | 역할                                       | 공개 |
| ----------------------------- | ------------------------------------------ | ---- |
| `index.ts`                    | Barrel Export (공개 API)                   | ✅   |
| `types.ts`                    | 입력/출력/에러 타입 + Zod 스키마           | ✅   |
| `orchestrator.ts`             | 5축 병렬 실행 + Partial Success 처리       | ✅   |
| `internal/session-store.ts`   | `integrated_analysis_sessions` 테이블 CRUD | ❌   |
| `internal/axis-adapters.ts`   | PC/S/C/H 4축 래퍼 (DB 저장 포함)           | ❌   |
| `internal/makeup-composer.ts` | M-1 PC+S 조합 logic + DB 저장              | ❌   |
| `BOUNDARIES.md`               | 본 문서 (경계 정의)                        | 📄   |

---

## 테스트 경계

- `tests/lib/analysis/integrated/orchestrator.test.ts` — Orchestrator 단위 테스트
- `tests/api/analyze/integrated.test.ts` — API 통합 테스트

테스트는 `internal/*`도 import 가능 (예외: `@internal` 함수 테스트용).

---

**Version**: 1.0 | **Created**: 2026-04-23
