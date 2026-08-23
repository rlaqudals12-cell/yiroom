# SDD-INTEGRATED-RESULT-UI — 통합 분석 UI 스펙

> **Version**: 1.1 | **Created**: 2026-04-23 | **Status**: implemented
> **상위 ADR**: [ADR-100](../adr/ADR-100-integrated-analysis-ui.md) (accepted)
> **선행 스펙**: [SDD-INTEGRATED-ANALYSIS](./SDD-INTEGRATED-ANALYSIS.md) (Phase A 완료)
>
> **Phase B 완료 (2026-04-23)**: 10 ATOM 전체 구현, 18 신규 tests pass (누적 40 tests), typecheck/lint 0 errors.
> **Storage 버킷 설정**: `202608230400_integrated_sessions_storage_bucket.sql`을 prod SQL
> Editor에서 수동 gap-apply한다(`supabase db push` 금지).

---

## 1. 개요

### 1.1 목적

Phase A에서 완성한 통합 분석 API(`POST /api/analyze/integrated`)에 **사용자 인터페이스**를 연결.

### 1.2 범위

**포함:**

- 입력 페이지 (`/analysis/integrated`) — 이미지 업로드 + 자가입력 + 제출
- 결과 페이지 (`/analysis/integrated/result/[sessionId]`) — 5축 통합 표시
- 이미지 Storage 업로드 헬퍼 (Phase A sentinel URL 교체)
- 로딩 UI (5-10초 대기 체감 완화)
- Partial Success UI

**제외:**

- 홈/랜딩 CTA 전환 (Phase C)
- 다국어 지원 (일단 한국어)
- 소셜 공유 기능 (기존 시스템 재사용, Phase B.2)
- 결과 비교 UI (Phase C)

### 1.3 성공 기준

- 입력→결과 전체 플로우 수동 테스트 통과
- typecheck + lint + 컴포넌트 테스트 모두 통과
- Core Web Vitals: LCP < 2.5s on 3G (결과 페이지)
- 모바일 responsive (375px ~ 1920px)

---

## 2. 입력 페이지 스펙

### 2.1 라우트

```
GET /analysis/integrated
```

Client Component (`'use client'`) — 파일 선택 이벤트 필요.

### 2.2 컴포넌트 구조

```tsx
// app/(main)/analysis/integrated/page.tsx
'use client';

export default function IntegratedAnalysisInputPage() {
  return (
    <div>
      <Header title="5축 통합 분석" />
      <ImageUploadSection /> {/* 얼굴 + 선택 전신 */}
      <QuestionnaireForm /> {/* 자가입력 3-4문항 */}
      <SubmitButton /> {/* POST 호출 + 로딩 UI 전환 */}
      {isLoading && <IntegratedLoadingUI />}
    </div>
  );
}
```

### 2.3 이미지 업로드 섹션

**필수:**

- 얼굴 셀카 1장 (필수)
- 전신 사진 1장 (선택)

**검증:**

- 클라이언트: 파일 타입(image/\*), 크기(<5MB)
- Base64 변환 후 data URL 검증 (ZoDod `integratedAnalysisInputSchema`)

**UX:**

- 파일 선택 후 즉시 미리보기 (캔버스 또는 `<img>` 표시)
- 재선택 가능
- 전신 사진은 "전신 사진 없이 자가입력으로 진행" 버튼 옵션

### 2.4 자가입력 폼

**스킨 (1문항):**

```
피부 타입을 알려주세요
[건성] [지성] [복합성] [중성] [민감성] [잘 모르겠어요]
```

**헤어 (3문항, 모두 선택):**

```
머리 길이: [짧음] [중간] [긴 편] [매우 김]
머리숱: [적음] [보통] [많음]
곱슬기: [직모] [살짝] [곱슬] [심한 곱슬]
```

**체형 (전신 사진 없을 때만 필수, 있으면 선택):**

```
키: [__] cm
몸무게: [__] kg (선택)
어깨 너비: [__] cm (선택)
허리: [__] cm (선택)
```

### 2.5 제출 동작

```typescript
const handleSubmit = async (data: IntegratedAnalysisInput) => {
  setIsLoading(true);
  try {
    const res = await fetch('/api/analyze/integrated', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success) {
      router.push(`/analysis/integrated/result/${json.result.sessionId}`);
    } else {
      setError(json.error);
    }
  } catch (e) {
    setError('네트워크 오류가 발생했어요.');
  } finally {
    setIsLoading(false);
  }
};
```

---

## 3. 결과 페이지 스펙

### 3.1 라우트

```
GET /analysis/integrated/result/[sessionId]
```

**Server Component** — 초기 데이터 SSR, 권한 검증 서버 측.

### 3.2 페이지 구조

```tsx
// app/(main)/analysis/integrated/result/[sessionId]/page.tsx
export default async function ResultPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const session = await getSessionWithAxes(params.sessionId, userId);
  if (!session) notFound();

  return (
    <div>
      <AxesSummaryCard session={session} />

      {session.status === 'partial' && <PartialSuccessBanner axesFailed={session.axesFailed} />}

      <AxisDetailAccordion axes={session.axes} />
      <NextStepsLinks session={session} />
    </div>
  );
}
```

### 3.3 세션 조회 함수

```typescript
// lib/analysis/integrated/internal/result-fetcher.ts (신규)
export async function getSessionWithAxes(
  sessionId: string,
  clerkUserId: string
): Promise<ResultPageData | null> {
  const supabase = await createClerkSupabaseClient();

  // 세션 조회 (RLS로 권한 검증)
  const session = await fetchSession(supabase, sessionId);
  if (!session) return null;

  // 5축 결과 병렬 조회
  const [pc, skin, body, hair, makeup] = await Promise.all([
    supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle(),
    supabase.from('skin_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('body_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('hair_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
    supabase.from('makeup_analyses').select('*').eq('session_id', sessionId).maybeSingle(),
  ]);

  return {
    session,
    axes: {
      personalColor: pc.data,
      skin: skin.data,
      body: body.data,
      hair: hair.data,
      makeup: makeup.data,
    },
  };
}
```

---

## 4. 주요 컴포넌트 스펙

### 4.1 AxesSummaryCard (상단 요약)

```tsx
interface Props {
  session: IntegratedSessionRow;
  axes: { personalColor; skin; body; hair; makeup }; // 각 DB 레코드 또는 null
}

// 출력:
// ┌──────────────────────────────────────────┐
// │ 🎨 색: 봄 웜톤 ($#F9A8D4 $#F472B6)       │
// │ ✨ 피부: 바이탈리티 78점                 │
// │ 👕 체형: S타입                           │
// │ ✂️ 헤어: 라운드형                        │
// │ 💄 메이크업: 듀이 + light 커버           │
// └──────────────────────────────────────────┘
```

- 축별 한 줄 요약
- 축이 실패(null)면 "분석 미완료" 표시
- 클릭 시 해당 축 아코디언으로 스크롤

### 4.2 AxisDetailAccordion (중단 상세)

```tsx
interface Props {
  axes: AxesData;
}

// Radix UI Accordion (shadcn/ui) 사용
// 각 축이 접기/펴기 가능
// 기본 상태: 모두 접힘
// 펼치면 상세 정보 표시 (JSONB 필드 포함)
```

### 4.3 PartialSuccessBanner (실패 축 안내)

```tsx
interface Props {
  axesFailed: AxisCode[];
}

// status === 'partial'일 때만 렌더링
// 실패 축 나열 + "다시 시도" CTA
// v1은 "전체 다시 시도"만 지원 → /analysis/integrated로 router.push
```

### 4.4 NextStepsLinks (하단 CTA)

```tsx
// 성공한 축 기반 다음 단계 제안
// PC 성공 → 색상 팔레트 상세
// S 성공 → 추천 화장품
// C 성공 → 스타일 가이드
// H 성공 → 헤어스타일 추천
// M 성공 → 메이크업 튜토리얼
```

### 4.5 IntegratedLoadingUI (로딩)

```tsx
interface Props {
  elapsedMs: number; // 경과 시간 (추정 기반)
}

// 5축 체크리스트 표시
// 경과 시간에 따라 순차적으로 "분석 중..." → "완료" 전환
// 10초 초과 시 "조금 오래 걸릴 수 있어요" 메시지
```

---

## 5. 이미지 Storage 업로드

### 5.1 Supabase Storage 버킷 설정

버킷 이름: `integrated-sessions`

- 공개: false (private)
- 파일 크기: 버킷 한도 10MB(요청 본문은 기존 4.5MB 한도에 맞춰 전처리)
- MIME: image/jpeg, image/png, image/webp, image/heic, image/heif

### 5.2 Storage Uploader 원자 경계

- `questionnaire.imageStorageConsent === true`에서만 service-role 클라이언트를 만들고 업로드한다.
- 얼굴/전신 upload의 promise reject와 resolved `{error}`, 각 단계 deadline을 같은 rollback
  helper가 처리한다. remove도 reject와 resolved `{error}`를 모두 확인하고 완료를 await한다.
- rollback 성공은 `ImageStorageOperationError(cleanupConfirmed=true)`, rollback 실패는
  원본·정리 오류와 candidate path를 가진 `ImageStorageRollbackError`로 구분한다.

### 5.3 Orchestrator 순서

1. `crypto.randomUUID()`로 ID를 만들고 이미지 포인터가 null인 pending 세션을 먼저 INSERT한다.
   `clientRequestId`가 이 시점부터 이탈 복구 잠금 역할을 한다.
2. 업로더를 외부 `Promise.race` 없이 직접 await한다. deadline+정리는 업로더가 소유한다.
3. 업로드 성공 뒤 글로벌 생체 동의를 다시 확인하고, 통과한 경우에만 포인터를 UPDATE한다.
   도중 철회는 attach 전 rollback하며, attach 응답이 불확실하면 Storage rollback 후 DB
   포인터도 멱등하게 비운다.
4. 정리 확인된 선택 저장 실패는 비민감 실패 코드/시각을 남기고 5축 분석을 계속한다.
   정리 미확인은 분석을 중단하고 candidate path를 failed 세션의 영속 cleanup-pending 큐가
   소유한다. 일일 cron이 1년을 기다리지 않고 재시도한다.

### 5.4 보유기간 파기

`cleanup-consents`는 `(created_at,id)` 안정 keyset의 100건 페이지를 실행 예산 안에서 반복한다.
1년 도래 세션과 cleanup-pending 세션에 더해, 24시간 지난 `failed/pending` 동의 세션을
canonical 세션 prefix로 재귀 파기한다. 따라서 포인터 부착·재시도 큐 기록 전에 요청이 죽어도
원본을 회수하고, 성공 시 `_imageStoragePurgedAt`으로 재매칭을 막는다. 실패/backlog는
`remaining` 지표와 감사 로그에 남긴다. Storage 자체 lifecycle은 현재 없으므로 물리 삭제
완료 시각을 숨기거나 거짓으로 보장하지 않는다.

### 5.5 서명된 URL 발급

```typescript
// 결과 페이지에서 이미지 표시 시
export async function getSignedImageUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.storage
    .from('integrated-sessions')
    .createSignedUrl(path, expiresInSeconds);
  return data?.signedUrl ?? '';
}
```

---

## 6. P3 원자 분해

### ATOM B1: ADR-100 + SDD-INTEGRATED-RESULT-UI 작성 (완료)

- 출력: `docs/adr/ADR-100-integrated-analysis-ui.md`, `docs/specs/SDD-INTEGRATED-RESULT-UI.md`

### ATOM B2: 이미지 Storage 업로드 헬퍼 (1.5h)

- 출력: `lib/analysis/integrated/internal/storage-uploader.ts`
- createSession 시그니처 `id?: string` 파라미터 추가
- orchestrator에서 sessionId 미리 생성 후 Storage 업로드

### ATOM B3: 입력 페이지 (`/analysis/integrated`) (2h)

- 출력: `app/(main)/analysis/integrated/page.tsx` + `_components/*`
- 이미지 업로드 + 자가입력 + 제출

### ATOM B4: 결과 페이지 Server Component (1.5h)

- 출력: `app/(main)/analysis/integrated/result/[sessionId]/page.tsx`
- `result-fetcher.ts` 신규 추가
- 권한 검증, 병렬 쿼리

### ATOM B5: AxesSummaryCard (1h)

- 출력: `_components/AxesSummaryCard.tsx`
- 5축 한 줄 요약 + 아이콘

### ATOM B6: AxisDetailAccordion (1.5h)

- 출력: `_components/AxisDetailAccordion.tsx`
- shadcn Accordion 기반

### ATOM B7: PartialSuccessBanner + NextStepsLinks (1h)

- 출력: `_components/PartialSuccessBanner.tsx`, `NextStepsLinks.tsx`

### ATOM B8: IntegratedLoadingUI (0.5h)

- 출력: `_components/IntegratedLoadingUI.tsx`
- 추정 타이머 기반 체크리스트

### ATOM B9: 컴포넌트 테스트 (2h)

- 출력: `tests/components/analysis/integrated/*.test.tsx`
- AxesSummaryCard, PartialSuccessBanner 렌더링 테스트

### ATOM B10: 문서 동기화 + MEMORY (0.5h)

- ADR-100 accepted, SDD implemented, MEMORY 업데이트

### 총 소요: 약 11.5시간

---

## 7. 에러 처리

### 7.1 입력 페이지

| 상황                     | 처리                                        |
| ------------------------ | ------------------------------------------- |
| 이미지 없음              | 제출 버튼 비활성화                          |
| 이미지 크기 초과         | 클라이언트 alert + 재선택 유도              |
| API 400/VALIDATION_ERROR | 인라인 에러 메시지 (한국어)                 |
| API 401                  | `/sign-in` 리다이렉트                       |
| API 429                  | "요청이 많아요. 잠시 후 다시 시도해주세요." |
| API 500                  | "일시적 오류가 발생했어요." + 재시도 버튼   |
| 네트워크 실패            | "네트워크 연결을 확인해주세요."             |

### 7.2 결과 페이지

| 상황              | 처리                           |
| ----------------- | ------------------------------ |
| 세션 ID 존재 X    | `notFound()` (404)             |
| 권한 없음         | `notFound()` (RLS가 null 반환) |
| 인증 실패         | `redirect('/sign-in')`         |
| 축 결과 일부 누락 | PartialSuccessBanner 표시      |

---

## 8. 테스트 기준

### 8.1 단위 테스트

- `AxesSummaryCard` 렌더링 (5축 성공 케이스)
- `AxesSummaryCard` 부분 실패 케이스 (축 null 처리)
- `PartialSuccessBanner` 실패 축 텍스트 표시
- `NextStepsLinks` 성공 축만 CTA 표시
- `IntegratedLoadingUI` 경과 시간 기반 상태 전환

### 8.2 통합 테스트 (선택, Phase B.2)

- 입력 페이지 폼 제출 → 결과 페이지 전환 (MSW 또는 실제 서버)
- 결과 페이지 권한 검증

### 8.3 E2E (Phase B.2 이후)

- Playwright로 전체 플로우

---

## 9. 의존성

### 9.1 Phase A 재사용

- `POST /api/analyze/integrated` — 변경 없이 호출
- `lib/analysis/integrated/` 모듈 — index.ts 타입 사용
- 세션/각 축 테이블 — SELECT만 (RLS 적용)

### 9.2 Phase A 수정 필요

- `session-store.ts` `createSession` 에 `id?: string` 파라미터 추가
- `orchestrator.ts` 에서 sessionId 미리 생성 + Storage 업로드 단계 추가

### 9.3 외부 라이브러리

- shadcn/ui Accordion, Button, Card, Skeleton
- `@clerk/nextjs`
- `next/navigation`

---

## 10. 관련 문서

- [ADR-100 통합 분석 UI](../adr/ADR-100-integrated-analysis-ui.md) — 상위 의사결정
- [ADR-099 통합 분석 플로우](../adr/ADR-099-integrated-analysis-flow.md) — Phase A 백엔드
- [SDD-INTEGRATED-ANALYSIS](./SDD-INTEGRATED-ANALYSIS.md) — Phase A 스펙
- [principles/image-processing.md](../principles/image-processing.md) — CIE-1 검증
- [code-style.md](../../.claude/rules/code-style.md) — React 컴포넌트 패턴
- [react-patterns.md](../../.claude/rules/react-patterns.md)
- [nextjs-conventions.md](../../.claude/rules/nextjs-conventions.md)

---

**Author**: Claude Code
**Reviewed by**: -
