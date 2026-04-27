# ADR-099: 통합 분석 플로우 — 5축 병렬 분석 아키텍처

## 상태

`accepted`

## 날짜

2026-04-23 (accepted)

## 구현 현황

Phase A 완료 (2026-04-23):

- DB 마이그레이션 (`20260423_integrated_analysis_sessions.sql` + 롤백)
- `lib/analysis/integrated/` 모듈 (index/types/orchestrator + internal 3개)
- `POST /api/analyze/integrated` 엔드포인트
- 단위 테스트 22개 통과 (types 13 + makeup-composer 9)
- 타입체크 + lint 0 에러

Phase B/C는 별도 ADR로 추적 예정.

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"셀카 한 장으로 5축을 한 번에"

- 사용자는 홈의 단일 CTA를 눌러서 **1회의 입력 세션**으로 5축 결과를 모두 받는다
  (얼굴 셀카 1장 + 선택적 전신 1장 + 자가 입력 2분)
- AI는 5축을 **병렬로 실행**하여 총 대기 시간을 최대 단일 축 시간으로 압축한다
- 5축 결과는 **하나의 세션 ID**로 묶여서 "한 번의 분석 = 한 번의 나 프로필" 구조를 만든다
- 개별 축 실패는 전체 실패로 이어지지 않는다 (Partial Success)
- 기존 개별 분석 경로는 그대로 유지되어 기존 사용자/북마크/SEO에 영향 없음
```

### 물리적 한계

| 항목               | 한계                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| AI 응답 시간       | 최대 축 지연 (보통 5~10초, Gemini 3 Flash 기준)                            |
| 단일 요청 페이로드 | Base64 이미지 2장 = ~2~4MB (Vercel body size limit 4.5MB 근접)             |
| 5축 입력 다양성    | 얼굴 셀카(PC/S/H 공유) + 전신(C) + 자가입력(S/H/C) — 축마다 필요 입력 상이 |
| 2D 사진 한계       | C-1 전신 미제공 시 자가입력 기반 추정만 가능 (정밀도 하락)                 |
| 동시 실행 비용     | 5축 병렬 = Gemini API 호출 5회 × 요청 수 (기존 개별 호출 총합과 동일)      |

### 100점 기준

- **5축 중 4축 이상 성공률 95%+** (실측 기준, Mock Fallback 포함)
- **p95 응답 시간 10초 이내** (병렬 실행 기준)
- **ADR-098의 "2~3분 온보딩" 약속 달성** (촬영 30초 + 자가입력 90초 + 분석 대기 10초)
- **기존 개별 분석 경로 100% 호환** (데이터/URL/API 모두 유지)
- **통합 세션 당 DB 저장 원자성** (5축 결과가 하나의 트랜잭션으로 커밋)

### 현재 목표: 70%

- 통합 API 엔드포인트 (`POST /api/analyze/integrated`) 추가
- 세션 테이블 + 각 결과 테이블에 `session_id` FK 추가
- 5축 병렬 오케스트레이션 모듈 (`lib/analysis/integrated/`)
- 기존 각 축 분석 함수는 재사용 (내부 구현 변경 없음)
- UI/홈 재설계는 Phase B/C에서 별도 진행 (본 ADR 범위 외)

### 의도적 제외

| 제외 항목                 | 이유                                    | 재검토 시점                   |
| ------------------------- | --------------------------------------- | ----------------------------- |
| 진행 상태 스트리밍 (SSE)  | v1은 단발 응답으로 충분, 복잡도↑        | p95 10초 초과 시 v2에서 검토  |
| 기존 개별 경로 제거       | 데이터/URL/SEO 호환성 최우선            | 출시 후 90일 데이터 기반 판단 |
| 홈 재설계 / 랜딩 CTA 교체 | 본 ADR 범위 외 (Phase B/C)              | ADR-099가 accepted된 후       |
| 통합 VTO/제품 매칭        | 입력이 5축 결과라 통합과 무관, 별도 ADR | 필요 시 ADR-100+에서          |
| 모바일 앱 통합 플로우     | 웹 먼저 구현 → 검증 → 모바일 포팅       | 웹 출시 + 2주                 |
| 통합 결과 페이지 UI       | SDD에서 인터페이스만 정의, UI는 Phase B | Phase B                       |

## 1. 맥락 (Context)

### 1.1 현재 상태의 문제

2026-04-23 기준 이룸의 분석 플로우:

- 5축(PC/S/C/H/M) 각각 **독립 진입점**을 가짐
- 사용자는 각 축마다 **별도 촬영 + 별도 자가입력 + 별도 결과 페이지**를 거쳐야 함
- 5축을 모두 경험하려면 **5번의 반복 액션**이 필요
- ADR-098에서 정의한 **"셀카 1장 + 전신 1장 + 자가입력 2분"** 약속과 괴리

### 1.2 ADR-098과의 관계

ADR-098(정체성 재정의 v2)의 이상적 최종 상태:

> 사용자는 얼굴 사진 1장 + 전신 사진 1장 + 자가 입력 2분으로
> 자신의 시각적 정체성 5축(색/피부/체형/헤어/메이크업)을 완전히 파악한다

→ 이 비전은 **통합 플로우가 없으면 실현 불가능**. ADR-098이 "정체성 확정"을, ADR-099가 "실현 메커니즘"을 담당.

### 1.3 사용자 관점 선택 마비

- 홈/랜딩에서 5축을 병렬 카드로 나열 → "어디부터 시작할지" 혼란
- 각 축이 "독립 분석"으로 설계되어 결과도 각자 나열 → "하나의 나"로 수렴 안 됨
- 경쟁사(Oh My Skin = 피부만, 팔레트 = PC만) 대비 이룸의 차별점 **"5축 통합"이 UX로 전달 안 됨**

### 1.4 기술적 이점

- 5축 각각의 AI 분석 함수는 이미 존재 (PC-1, S-1, C-1, H-1)
- M-1은 composer 로직 (PC+S 결과 조합)이라 추가 AI 호출 불필요
- `Promise.all` 병렬 호출만 추가하면 성능 3~5배 개선
- Mock Fallback이 축별 독립적이라 부분 실패 복구 용이 (ADR-007)

## 2. 결정 (Decision)

### 2.1 통합 API 엔드포인트 신설

```
POST /api/analyze/integrated
```

- 5축을 병렬 실행하는 단일 진입점
- 기존 `/api/analyze/{personal-color,skin,body,hair}` 는 그대로 유지 (하위 호환)
- 내부적으로 각 축 분석 함수를 재사용 (인터페이스 안정성)

### 2.2 세션 테이블 신규 생성 (결정 1)

```sql
CREATE TABLE integrated_analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  face_image_url TEXT,         -- Supabase Storage 경로
  body_image_url TEXT,          -- NULL 허용 (C-1 자가입력만 경우)
  questionnaire JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'completed', 'failed')),
  axes_completed TEXT[] NOT NULL DEFAULT '{}',  -- ['personal_color', 'skin', ...]
  axes_failed TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**이유**: 기존 개별 분석(세션 없이 직접 진입)과 통합 분석을 구분, 분석 히스토리 조회 쉬움, P8 모듈 경계 준수.

### 2.3 각 결과 테이블에 `session_id` FK 추가

```sql
ALTER TABLE personal_color_assessments ADD COLUMN session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;
ALTER TABLE skin_assessments ADD COLUMN session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;
ALTER TABLE body_assessments ADD COLUMN session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;
ALTER TABLE hair_assessments ADD COLUMN session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;
ALTER TABLE makeup_recommendations ADD COLUMN session_id UUID
  REFERENCES integrated_analysis_sessions(id) ON DELETE CASCADE;
```

**하위 호환**: `session_id`는 NULLABLE — 기존 개별 분석 레코드는 NULL로 유지, 신규 통합 분석만 값 채움.

### 2.4 Partial Success 허용 (결정 2)

- 5축 중 성공한 축만 반환, 실패 축은 `{ failed: true, error }` 형태
- Mock Fallback이 각 축에 이미 있어 실제 완전 실패는 드묾
- `status`: 5축 모두 성공 → `completed`, 일부 성공 → `partial`, 모두 실패 → `failed`

**전체 실패 처리**: status = `failed` 시 클라이언트는 "다시 시도" 버튼 노출.

### 2.5 C-1 전신 사진 Optional (결정 3)

- `body_image_url`이 NULL이면 자가입력(키/체중/어깨/허리) 기반 추정 분석
- 자가입력도 없으면 C-1만 실패(`axes_failed`에 추가), 나머지 축은 정상 진행
- 전신 사진은 결과 페이지에서 "더 정확한 체형 분석" 액션으로 후속 유도

### 2.6 M-1 Composer 로직 (결정 4)

- M-1은 독립 AI 호출 없음
- PC-1 + S-1 결과가 모두 성공한 경우에만 실행
- 실패 처리: PC/S 둘 중 하나라도 실패 시 M-1 `failed: true, error: 'requires_pc_and_s'`

### 2.7 Base64 직접 전송 (결정 5)

- 기존 개별 분석과 동일한 방식 (CIE-1 품질 검증 파이프라인 재사용)
- 이미지 2장 최대 ~4MB (Vercel 제약 내)
- 업로드 시점에 CIE-1 품질 검증 실행 → 실패 시 재촬영 안내

### 2.8 v1 단발 응답 (결정 6)

- 요청 → 5축 병렬 실행 완료까지 블로킹 → 단발 응답
- 클라이언트는 로딩 UI (5개 축 진행 바 표시)
- SSE 스트리밍은 v2에서 p95 응답 시간 데이터 기반으로 판단

## 3. 대안 (Alternatives Considered)

| 대안                             | 장점                      | 단점                                          | 제외 사유                            |
| -------------------------------- | ------------------------- | --------------------------------------------- | ------------------------------------ |
| 순차 실행 (Sequential)           | 구현 단순                 | 응답 시간 5축 합계 (25~50초)                  | UX 실패, 이탈률 급증                 |
| All-or-Nothing (전체 또는 실패)  | 로직 단순                 | 1축 실패 = 전체 실패, Mock Fallback 효과 상실 | UX 나쁨, 실질 성공률 저하            |
| 기존 페이지 리다이렉트만         | 구현 0                    | 실질적 통합 없음                              | ADR-098 비전 미충족                  |
| 세션 ID를 기존 테이블에 옵셔널만 | 마이그레이션 단순         | 세션 단위 메타데이터(questionnaire) 저장 불가 | 데이터 모델 어색                     |
| SSE 스트리밍 v1부터 도입         | UX 즉각성 높음            | 구현 복잡도↑, Vercel Edge 제약                | p95 10초 이내면 v1 단발로 충분       |
| C-1 전신 사진 필수               | 정확도 최대               | 온보딩 진입장벽 급증                          | ADR-098 "2~3분 온보딩" 위반          |
| M-1을 독립 AI 호출로 확장        | 메이크업 정확도 소폭 상승 | AI 호출 1회 추가, ADR-098 "실행 층" 원칙 위반 | 비용 대비 이득 낮음                  |
| 이미지를 Signed URL로 받기       | 페이로드 감소             | 2단계 요청 (업로드 → 분석), UX 지연           | 현재 단일 축 API도 Base64라 일관성 ↑ |

## 4. 결과 (Consequences)

### 긍정적 결과

- **ADR-098 "2~3분 온보딩" 약속 실현** — 1회 입력으로 5축 완료
- **응답 시간 3~5배 개선** — 순차 25~50초 → 병렬 5~10초
- **5축 통합 매칭 가능** — 제품 추천 정확도 상승 (현재는 축별 독립)
- **기존 코드 재사용 극대화** — 각 축 AI 함수/CIE-1/Mock Fallback 모두 변경 없음
- **P8 모듈 경계 준수** — 각 축 모듈은 black box, 통합 오케스트레이터가 조합만 담당
- **데이터 일관성** — 같은 세션의 이미지로 분석 → 조명/컨디션 편차 제거

### 부정적 결과

- **DB 스키마 변경** — 마이그레이션 1건 (5개 테이블에 컬럼 추가 + 1개 테이블 신규)
- **결과 페이지 복잡도 증가** — 5축을 한 페이지에 표현 (Phase B에서 UI 설계 필요)
- **에러 UI 복잡도** — Partial Success UI 필요 (성공 축 + 실패 축 혼재 표현)
- **이미지 품질 요구 상승** — 셀카 1장이 PC/S/H 3축에 영향 → 품질 검증 강화 필요

### 리스크

- **p95 응답 시간 10초 초과** — 단일 축이 특히 오래 걸리는 경우 병목 (모니터링 필요)
- **부분 실패가 빈발** — 특정 축 AI가 지속적으로 실패하면 UX 혼란 (Mock Fallback으로 완화)
- **온보딩 자가입력 설문 피로** — 5축 자가입력을 2분 내에 맞추려면 문항 선별 필요 (SDD에서 정의)
- **결과 페이지 스크롤 지옥** — 5축 전체를 한 페이지에 쌓으면 UX 나쁨 (Phase B에서 아코디언/탭 설계)
- **session_id NULL vs 값 있는 레코드 혼재** — 쿼리 작성 시 WHERE 조건 누락 가능 (타입 가드/테스트로 방지)

## 5. 구현 가이드

### 5.1 폴더 구조 (P8 준수)

```
apps/web/lib/analysis/integrated/
├── index.ts              # 공개 API (Barrel Export)
├── types.ts              # IntegratedAnalysisInput, IntegratedAnalysisResult
├── orchestrator.ts       # Promise.all 병렬 + Partial Success 처리
├── internal/
│   ├── makeup-composer.ts  # PC+S 결과 → M-1 조합
│   ├── session-store.ts    # 세션 테이블 CRUD
│   └── axis-adapters.ts    # 각 축 분석 함수 래퍼 (표준 인터페이스)
└── BOUNDARIES.md         # 모듈 경계 정의

apps/web/app/api/analyze/integrated/
└── route.ts              # POST 핸들러 (인증, Rate Limit, Zod 검증)
```

### 5.2 오케스트레이터 핵심 로직

```typescript
// lib/analysis/integrated/orchestrator.ts
export async function runIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  userId: string
): Promise<IntegratedAnalysisResult> {
  const session = await createSession(userId, input);

  const [pcResult, skinResult, bodyResult, hairResult] = await Promise.allSettled([
    analyzePC(input.faceImage, userId, session.id),
    analyzeSkin(input.faceImage, input.questionnaire.skin, userId, session.id),
    analyzeBody(input.bodyImage, input.questionnaire.body, userId, session.id),
    analyzeHair(input.faceImage, input.questionnaire.hair, userId, session.id),
  ]);

  const axes = {
    personalColor: unwrap(pcResult),
    skin: unwrap(skinResult),
    body: unwrap(bodyResult),
    hair: unwrap(hairResult),
  };

  const makeup =
    axes.personalColor.success && axes.skin.success
      ? composeMakeup(axes.personalColor.data, axes.skin.data)
      : { success: false, error: 'requires_pc_and_s' };

  await finalizeSession(session.id, { axes, makeup });

  return { sessionId: session.id, axes: { ...axes, makeup } };
}
```

### 5.3 Rate Limiting

- 현재 `/api/analyze/*` 50 req/24h/user → 통합은 **20 req/24h/user** (5축 병렬이므로 총 AI 호출은 기존과 비슷)

### 5.4 RLS 정책

```sql
ALTER TABLE integrated_analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_sessions" ON integrated_analysis_sessions
  FOR ALL
  USING (clerk_user_id = auth.get_user_id());
```

### 5.5 마이그레이션 전략

```
Phase A (본 ADR):
  1. 통합 API 엔드포인트 추가
  2. DB 마이그레이션 (세션 테이블 + FK)
  3. 통합 테스트

Phase B (별도 ADR):
  1. 통합 결과 페이지 UI (`/analysis/integrated/result/[sessionId]`)
  2. 기존 개별 결과 페이지는 "상세 보기" 링크로 재사용

Phase C (별도 ADR):
  1. 홈 3-Tier 재설계
  2. 랜딩 CTA를 통합 플로우로 유도
  3. 온보딩 "시작 의도 선택" (선택적)

Phase D (출시 후 90일 데이터 기반):
  1. 개별 진입점을 Nav 2차 메뉴로 격리할지 판단
  2. 데이터 기반 UX 최적화
```

## 6. 리서치 티켓

```
[ADR-099-R1] 5축 병렬 실행 시 Gemini Rate Limit
────────────────────────
리서치 질문:
1. 동시 5회 호출 시 429 발생 빈도는?
2. 병렬 호출 간격(0ms vs 100ms) 조정이 필요한가?
3. Partial Success 통계 — 어떤 축이 가장 자주 실패하는가?

예상 출력:
- Gemini 3 Flash rate limit 실측 데이터
- 병렬 실행 최적 지연값
- 축별 실패 원인 분류 (이미지 품질/AI/네트워크)
```

```
[ADR-099-R2] Partial Success UX 패턴
────────────────────────
리서치 질문:
1. 5축 중 일부 실패 시 사용자가 혼란스러워하는 패턴은?
2. 실패 축을 "다시 시도" 또는 "건너뛰기" 중 어느 쪽이 선호되는가?
3. 부분 결과만으로도 만족하는 축 조합은?

예상 출력:
- Partial Success UI 레퍼런스 (Notion AI, Linear 등 참조)
- 축별 중요도 가중치 (PC/S 실패 vs C/H 실패)
```

## 7. 관련 문서

- [ADR-098 정체성 재정의 v2](./ADR-098-identity-redefinition-5axis-model.md) — 5축 모델 확정 (상위 근거)
- [ADR-007 Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md) — 부분 실패 처리 기반
- [ADR-010 AI 파이프라인](./ADR-010-ai-pipeline.md) — AI 호출 아키텍처
- [ADR-020 API 버전 관리](./ADR-020-api-versioning.md) — 신규 엔드포인트 정책
- [SDD-INTEGRATED-ANALYSIS](../specs/SDD-INTEGRATED-ANALYSIS.md) — 본 ADR의 구현 스펙

---

**Author**: Claude Code
**Reviewed by**: -
