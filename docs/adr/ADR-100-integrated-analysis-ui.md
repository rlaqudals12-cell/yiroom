# ADR-100: 통합 분석 UI — 입력 페이지 + 결과 페이지 아키텍처

## 상태

`accepted`

## 날짜

2026-04-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"3단계 플로우로 5축 결과 체험"

1. 입력 페이지 (/analysis/integrated)
   - 셀카 1장 업로드 (필수) + 전신 1장 (선택)
   - 자가입력 3-4문항 (2분 내 완료 목표)
   - "내 정체성 알아보기" CTA

2. 로딩 UI (단일 컴포넌트)
   - 5축 병렬 진행 시각화
   - 5-10초 체감 대기 시간 최소화

3. 결과 페이지 (/analysis/integrated/result/[sessionId])
   - 상단: 5축 요약 카드 (스냅샷)
   - 중단: 축별 아코디언 (접기/펴기)
   - Partial Success: 실패 축은 "다시 시도" 버튼
   - 하단: "다음 단계" 링크 (옷장/제품/메이크업)
   - 세션 ID 기반 URL — 북마크 가능, 공유 가능
```

### 물리적 한계

| 항목                    | 한계                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| 이미지 업로드 크기      | Vercel body limit 4.5MB (얼굴+전신 합계 ~4MB 권장)                  |
| Supabase Storage 가용성 | 무료 tier 1GB, Paid Pro 100GB (MAU 1만 기준 충분)                   |
| 모바일 렌더링           | 5축 결과를 한 페이지에 표시 시 스크롤 길이 증가 (아코디언으로 완화) |
| 이미지 업로드 속도      | 4G/Wi-Fi 환경 가정 (~3초), 3G는 고려 대상 외                        |
| 결과 페이지 로딩        | Server Component + 병렬 쿼리로 <1초 목표                            |

### 100점 기준

- **입력 페이지 완료율**: 90%+ (로딩 도중 이탈 < 10%)
- **결과 페이지 Core Web Vitals**: LCP < 2.5s, CLS < 0.1
- **Partial Success 복구율**: 실패 축 재시도 성공률 70%+
- **모바일 사용성**: 모든 컴포넌트 responsive + 터치 타겟 44px+
- **세션 URL 공유**: `/analysis/integrated/result/[sessionId]` 북마크/공유 가능

### 현재 목표: 70%

- 입력 페이지 MVP (셀카 + 자가입력 + 제출)
- 결과 페이지 MVP (5축 요약 카드 + 아코디언 상세)
- 이미지 Storage 업로드 (Phase A의 sentinel URL → 실제 URL)
- Partial Success 기본 UI (실패 축 표시 + 재시도 버튼)
- 로딩 UI (5축 진행 바)

### 의도적 제외

| 제외 항목                   | 이유                            | 재검토 시점  |
| --------------------------- | ------------------------------- | ------------ |
| i18n 4개 언어 동시 지원     | 한국어 먼저 MVP, 검증 후 다국어 | 출시 후 30일 |
| 결과 비교 UI (과거 vs 현재) | Phase C에서 홈 재설계와 함께    | Phase C      |
| 공유 기능 (Twitter/카카오)  | 기존 공유 시스템 재사용 가능    | Phase B.2    |
| 결과 페이지 인쇄/PDF        | 수요 확인 후                    | MVP 이후     |
| 실시간 진행 상태 (SSE)      | v1 단발 응답 유지 (ADR-099)     | v2 전환 시   |

## 1. 맥락 (Context)

ADR-099에서 Phase A로 통합 분석 API(`POST /api/analyze/integrated`)를 완성. 하지만 **UI가 없으면 실제 사용자가 쓸 수 없음**. Phase B는 이 API에 사용자 인터페이스를 연결.

### 1.1 기존 UI 자산

- 각 축별 개별 분석 페이지 (`/analysis/personal-color-v2`, `/analysis/skin-v2` 등)가 이미 존재
- shadcn/ui + Tailwind v4 기반 디자인 시스템 확립
- 이미지 업로드 컴포넌트 재사용 가능 (`components/analysis/common/ImageUpload.tsx`)

### 1.2 ADR-098 "나 프로필" 연계

ADR-098의 P1은 "5축이 하나의 '나 프로필'로 통합" 비전을 제시. 통합 결과 페이지는 이 비전의 첫 구현체.

### 1.3 UX 우선순위

- **속도**: 클릭부터 결과까지 <15초 (업로드 3초 + 분석 10초 + 렌더링 1초)
- **명확성**: 각 축 결과가 "무엇을 의미하는지" 즉시 전달
- **복구성**: 실패 축은 재시도 가능, 전체 이탈 방지

## 2. 결정 (Decision)

### 2.1 라우트 구조

```
app/(main)/analysis/integrated/
├── page.tsx                      # 입력 페이지 (클라이언트 컴포넌트)
├── _components/                  # 입력 페이지 전용 컴포넌트
│   ├── ImageUploadSection.tsx
│   ├── QuestionnaireForm.tsx
│   └── IntegratedLoadingUI.tsx   # 5축 진행 바
└── result/[sessionId]/
    ├── page.tsx                  # 결과 페이지 (Server Component)
    └── _components/
        ├── AxesSummaryCard.tsx   # 5축 요약 (상단)
        ├── AxisDetailAccordion.tsx  # 축별 상세 (중단)
        ├── PartialSuccessBanner.tsx # 실패 축 안내
        └── NextStepsLinks.tsx    # 다음 단계 CTA (하단)
```

### 2.2 결과 페이지는 Server Component

이유:

- SEO 최적화 (공유 URL 인덱싱)
- 초기 로딩 속도 (서버에서 데이터 페칭)
- 민감 데이터 보호 (권한 검증을 서버에서)
- `createClerkSupabaseClient()` 직접 사용 가능

클라이언트 인터랙션(아코디언 토글 등)만 Client Component로 분리.

### 2.3 입력 페이지는 Client Component

이유:

- 이미지 파일 선택 (`<input type="file">`)
- 실시간 미리보기
- 제출 전 검증
- 업로드 진행률 표시

### 2.4 이미지 Storage 업로드 (Phase A의 sentinel URL 교체)

```typescript
// lib/analysis/integrated/internal/storage-uploader.ts (신규)
export async function uploadSessionImages(
  sessionId: string,
  clerkUserId: string,
  faceBase64: string,
  bodyBase64: string | null
): Promise<{ faceImageUrl: string; bodyImageUrl: string | null }>;
```

- Supabase Storage 버킷: `integrated-sessions/` (private)
- 경로: `{clerkUserId}/{sessionId}/face.jpg`, `body.jpg`
- 서명된 URL 1시간 만료 (결과 페이지에서 실제 이미지 참조)
- orchestrator 내부에서 세션 생성 직후 호출

### 2.5 Partial Success UI 패턴

```
┌─────────────────────────────────────┐
│ ⚠️ 일부 분석이 완료되지 않았어요  │
│                                     │
│ 성공: 퍼스널컬러, 피부, 헤어       │
│ 실패: 체형 (전신 사진 필요)         │
│                                     │
│ [체형 다시 시도] [이대로 저장]     │
└─────────────────────────────────────┘
```

- 실패 축만 재시도 가능 (성공 축은 재분석 없음)
- "이대로 저장"은 세션 현재 상태 유지
- 재시도 시 `PATCH /api/analyze/integrated/[sessionId]/[axis]` 엔드포인트 (Phase B.2)
  - v1에서는 "전체 다시 시도"만 지원 (새 세션 생성)

### 2.6 로딩 UI 패턴

```
┌──────────────────────────────┐
│  5축 분석 중...              │
│                              │
│  ✅ 퍼스널컬러 (3s)         │
│  ✅ 피부 (4s)                │
│  ⏳ 체형 (분석 중...)        │
│  ⏳ 헤어 (대기)              │
│  ⏳ 메이크업 (대기)          │
│                              │
│  예상 소요: 약 10초          │
└──────────────────────────────┘
```

- Skeleton UI + 각 축 상태 표시
- v1은 백엔드가 단발 응답이라 실제 축별 진행은 추정값 (진행률 표시)
- 10초 초과 시 "조금 오래 걸릴 수 있어요" 메시지

## 3. 대안 (Alternatives Considered)

| 대안                                   | 장점               | 단점                                         | 제외 사유                              |
| -------------------------------------- | ------------------ | -------------------------------------------- | -------------------------------------- |
| 결과 페이지를 Client Component로       | 인터랙션 자유도    | SEO/초기 로딩 저하                           | Server Component가 이룸 관례 (ADR-018) |
| 입력+결과를 한 페이지(SPA)로 통합      | 전환 없는 매끄러움 | URL 공유 불가, 북마크 불가, 세션 손실 리스크 | 세션 URL 필요 (ADR-099)                |
| 결과 페이지에 공유 기능 즉시 포함      | 바이럴 효과        | 범위 확장, 복잡도↑                           | Phase B.2로 분리                       |
| 이미지 업로드를 2단계(업로드 → 분석)로 | 업로드 진행률 명확 | 2번 네트워크 호출, UX 복잡                   | Base64 직접 전송이 Phase A와 일관      |
| 실시간 진행률 SSE                      | UX 최고            | Vercel Edge 제약, 복잡도↑                    | ADR-099 v1 단발 결정 유지              |
| 각 축 실패 개별 재시도 엔드포인트      | 세밀한 복구        | API 표면 증가                                | v1은 "전체 재시도"만                   |

## 4. 결과 (Consequences)

### 긍정적 결과

- **ADR-098 "나 프로필" 첫 구현** — 5축 결과가 한 페이지에 통합 표시
- **URL 공유 가능** — 세션 ID 기반 URL, 향후 소셜 공유/바이럴 기반
- **Partial Success UX** — 전체 실패 없이 가능한 만큼 결과 전달
- **기존 자산 재사용** — 이미지 업로드 컴포넌트, shadcn/ui 그대로
- **Phase A와 일관** — Base64 업로드, 단발 응답 유지

### 부정적 결과

- **홈/랜딩 CTA 전환은 Phase C 대기** — 통합 URL은 있지만 진입점은 아직 미확정
- **스토리지 비용 발생** — 이미지 2장 × 세션 수 (MAU 1만 기준 월 ~50GB 예상, Pro tier 여유)
- **1차 제출 실패 시 재업로드 필요** — v1은 세션 복구 없음

### 리스크

- **모바일 UI 스크롤 지옥** — 5축 결과 아코디언 높이 계산 필요
- **Partial Success 혼란** — 사용자가 "이게 진짜 내 결과인가" 의심 (설명 문구 필요)
- **로딩 UI 부정확** — v1 단발 응답이라 축별 진행 실제로 못 앎 (추정 타이머)
- **Storage 업로드 실패 시 세션 반환 불가** — 업로드 실패하면 세션 생성 자체 실패로 처리 필요

## 5. 구현 가이드

### 5.1 파일 구조

```
app/(main)/analysis/integrated/
├── page.tsx
├── _components/
│   ├── ImageUploadSection.tsx
│   ├── QuestionnaireForm.tsx
│   └── IntegratedLoadingUI.tsx
└── result/[sessionId]/
    ├── page.tsx
    └── _components/
        ├── AxesSummaryCard.tsx
        ├── AxisDetailAccordion.tsx
        ├── PartialSuccessBanner.tsx
        └── NextStepsLinks.tsx

lib/analysis/integrated/internal/
└── storage-uploader.ts          # 신규 (이미지 Storage 업로드)
```

### 5.2 핵심 플로우

```
[Client]                           [Server]
User clicks "분석 시작"
  ↓
입력 페이지 폼 제출
  ↓
POST /api/analyze/integrated
  - base64 이미지 + 자가입력
  ↓                              ↓
                            Storage 업로드
                            세션 생성
                            5축 병렬 실행
                            세션 finalize
                              ↓
← 200 { sessionId, status, axes }
  ↓
router.push(`/analysis/integrated/result/${sessionId}`)
  ↓
[결과 페이지 Server Component]
  - 세션 조회 (권한 검증)
  - 5축 결과 조회
  - 렌더링
```

### 5.3 세션 권한 검증

```typescript
// result/[sessionId]/page.tsx
export default async function ResultPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClerkSupabaseClient();
  const session = await getSessionWithAxes(supabase, params.sessionId, userId);

  if (!session) notFound();
  // RLS가 이미 적용되므로 userId 불일치면 null 반환

  return <IntegratedResultUI session={session} />;
}
```

### 5.4 Storage 버킷 설정

```sql
-- supabase/migrations/20260424_integrated_sessions_storage.sql
-- Supabase Storage는 마이그레이션이 아닌 대시보드에서 설정
-- 여기는 RLS 정책만 정의
```

버킷 이름: `integrated-sessions`

- 공개: false
- 파일 크기 제한: 5MB
- 허용 MIME: image/jpeg, image/png, image/webp

## 6. 리서치 티켓

```
[ADR-100-R1] Partial Success UI 패턴
────────────────────────
리서치 질문:
1. 부분 성공을 "실패"로 받아들이는 사용자 비율은?
2. "이대로 저장" vs "다시 시도" 선호도 조사
3. 실패 축 설명 문구의 영향

예상 출력:
- Linear/Notion AI의 Partial UI 레퍼런스
- 한국 사용자 대상 A/B 테스트 결과
```

```
[ADR-100-R2] 로딩 UI 체감 속도
────────────────────────
리서치 질문:
1. 10초 대기 중 "가짜 진행률"이 실제 진행률보다 낫나?
2. 5축 체크리스트 vs 단일 프로그레스 바 선호도
3. "약 10초" 안내 문구의 효과

예상 출력:
- Psychology of waiting 원칙 적용
- 실측 이탈률 데이터 (Phase B 배포 후)
```

## 7. 관련 문서

- [ADR-099 통합 분석 플로우](./ADR-099-integrated-analysis-flow.md) — 백엔드 (Phase A)
- [ADR-098 정체성 재정의 v2](./ADR-098-identity-redefinition-5axis-model.md) — 5축 "나 프로필" 비전
- [ADR-007 Mock Fallback](./ADR-007-mock-fallback-strategy.md) — Partial Success 기반
- [SDD-INTEGRATED-RESULT-UI](../specs/SDD-INTEGRATED-RESULT-UI.md) — 본 ADR의 구현 스펙

---

**Author**: Claude Code
**Reviewed by**: -
