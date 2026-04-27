# ADR-102: 모바일 통합 분석 플로우 포팅 — 웹 API 재사용 방식

## 상태

`accepted`

## 날짜

2026-04-24

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모바일도 동일한 통합 분석 UX 제공"

- 모바일 앱의 홈/분석 진입점 = 통합 플로우 1개 (웹과 동일 경로 개념)
- 모바일 입력 화면: 셀카 1장 + 선택 전신 + 자가입력 2분
- 모바일 결과 화면: 5축 요약 + 아코디언 상세 + Partial Success
- 웹과 서버 로직 100% 공유 (POST /api/analyze/integrated)
- 기존 모바일 개별 분석 라우트는 유지 (하위 호환 + 심화 사용자용)
```

### 물리적 한계

| 항목             | 한계                                                             |
| ---------------- | ---------------------------------------------------------------- |
| 모바일 HTTP 호출 | 앱에서 웹 API(`https://yiroom.app/api/...`)로 외부 호출 필요     |
| Clerk 토큰 주입  | 모바일 Clerk Expo SDK → JWT 획득 후 Authorization 헤더 수동 설정 |
| 이미지 크기      | Base64 전송 시 Vercel body limit 4.5MB                           |
| Expo 빌드        | 서버 URL 환경변수 변경 시 재빌드 필요                            |
| 오프라인 모드    | 통합 분석은 온라인 전용 (웹과 동일 제약)                         |

### 100점 기준

- 모바일 통합 분석 완주율 ≥ 웹의 80%
- 모바일 입력 → 결과 p95 응답 15초 내
- 웹과 모바일이 동일 세션 ID로 결과 조회 가능 (크로스 플랫폼)
- 기존 모바일 개별 분석 라우트 100% 유지 (하위 호환)
- 이미지 Base64 전송 성공률 95%+

### 현재 목표: 60%

- 모바일 통합 분석 라우트 MVP (`app/(analysis)/integrated/index.tsx` 입력 + `result/[sessionId].tsx` 결과)
- 웹 API HTTP 호출 클라이언트 (`lib/api/integrated.ts`)
- 모바일 홈 진입점 1곳 통합 CTA로 전환 (전체 전환은 Phase D.2)
- 기본 테스트

### 의도적 제외

| 제외 항목                      | 이유                                      | 재검토 시점                  |
| ------------------------------ | ----------------------------------------- | ---------------------------- |
| 결과 페이지 Supabase 직접 조회 | 웹 API 재사용 일관성                      | 응답 속도 문제 시            |
| Partial 축별 재시도            | v1 범위 외                                | 웹 v2와 동기화               |
| 크로스 모듈 인사이트           | 통합 결과 기본 표시만 v1                  | Phase D.2                    |
| packages/shared 통합 타입 추출 | 시간 제약, 모바일 로컬 타입 재정의가 빠름 | 웹/모바일 다음 메이저 버전   |
| 모바일 전체 기존 CTA 교체      | 리스크 분산 — 1곳부터 검증                | 실제 완주 데이터 확보 후     |
| 오프라인 대응                  | 통합 = 서버 필수                          | 오프라인 모드 전체 재설계 시 |
| 다국어 (i18n)                  | 모바일 i18n 인프라 부재                   | 출시 후 별도 작업            |

## 1. 맥락 (Context)

웹 Phase A+B+C로 통합 분석 플로우가 완성됐지만, **모바일은 기존 5축 개별 분석만 지원**. 이룸 MVP는 웹+모바일 동시 출시 목표이므로 모바일 포팅 필요.

### 1.1 모바일 기존 패턴

- Expo Router 기반 (`app/(analysis)/personal-color/` 등)
- 각 분석: 문진 → 카메라 → Gemini 호출 → Supabase 직접 저장 → 결과
- `useClerkSupabaseClient()` — Clerk JWT 자동 주입 Supabase 클라이언트
- NativeWind (Tailwind for RN), 자체 UI 컴포넌트 시스템

### 1.2 웹과의 차이

| 항목           | 웹                              | 모바일                                 |
| -------------- | ------------------------------- | -------------------------------------- |
| 인증           | Clerk 세션 쿠키                 | Clerk Expo SDK JWT                     |
| 분석 로직      | `/api/analyze/*-v2` 서버 라우트 | Supabase 클라이언트 직접 + Gemini 직접 |
| i18n           | next-intl (ko/en/ja/zh)         | 없음 (한국어 하드코딩)                 |
| Storage 업로드 | 서버에서 service_role           | (신규) 필요                            |

### 1.3 포팅 방식 비교

- **옵션 A**: 모바일 자체로 Supabase 직접 + Gemini 직접 (기존 개별 분석 패턴)
  - 단점: 5축 병렬 + Storage + M-1 composer를 모바일에 재구현 필요 (대규모)
- **옵션 B**: 모바일에서 웹 `/api/analyze/integrated` HTTP 호출
  - 단점: Clerk 토큰 주입 + 외부 API 호출 패턴이 모바일에 없음 (소규모 신규)
- **옵션 C**: Supabase Edge Function으로 통합 오케스트레이션 배포
  - 단점: 신규 배포 대상 추가, 웹 API와 이중 관리

## 2. 결정 (Decision)

### 2.1 옵션 B — 웹 API HTTP 호출 방식 채택

이유:

- 서버 로직 **100% 재사용** (5축 병렬, Storage 업로드, M-1 composer, DB 저장)
- 모바일은 UI만 구현하면 됨 — Phase A+B 투자 극대화
- 웹/모바일 결과 일관성 보장 (동일 API, 동일 세션 ID)
- 롤백 용이 (모바일 코드만 되돌리면 됨)

### 2.2 환경변수 신규 추가

```bash
# apps/mobile/.env
EXPO_PUBLIC_YIROOM_API_URL=https://yiroom.app
# 로컬 개발: http://192.168.x.x:3000 (device가 접근 가능한 호스트)
```

### 2.3 HTTP 클라이언트 구조

```typescript
// apps/mobile/lib/api/integrated.ts (신규)
export async function requestIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  clerkToken: string
): Promise<IntegratedAnalysisResult>;
```

- `useAuth().getToken()`으로 Clerk JWT 획득
- `Authorization: Bearer <token>` 헤더로 웹 API 호출
- 응답은 기존 `IntegratedAnalysisResult` 타입 (모바일 로컬 재정의)

### 2.4 결과 페이지도 웹 API 활용

모바일 결과 페이지는 **웹 POST 응답의 result를 그대로 표시** — 이후 재방문 시에는 GET 엔드포인트가 필요하지만 **Phase D MVP는 POST 응답 기반으로 한정**.

재방문 기능(세션 ID 북마크)는 Phase D.2:

- 신규 엔드포인트 `GET /api/analyze/integrated/[sessionId]` 추가 또는
- 모바일에서 Supabase 직접 조회 (기존 모바일 패턴)

### 2.5 라우트 구조

```
apps/mobile/app/(analysis)/integrated/
├── index.tsx              # 입력 페이지
├── loading.tsx            # 로딩 화면 (별도 라우트 or 상태)
└── result/
    └── [sessionId].tsx    # 결과 페이지
```

### 2.6 모바일 홈 CTA 부분 전환

MVP는 **홈 히어로 영역의 Primary CTA 1개만** 통합으로 전환:

- 기존 PC/피부 2개 CTA → 통합 1개 + 개별 진입은 Secondary
- 나머지 퀵 액션 원형/진행률 카드는 Phase D.2에서 추가 정리

### 2.7 기존 개별 분석 라우트 유지

- `app/(analysis)/personal-color/`, `skin/`, `body/`, `hair/`, `makeup/` 유지
- 심화/재측정 원하는 사용자 경로 (웹 정책과 동일)

## 3. 대안 (Alternatives Considered)

| 대안                                    | 장점                | 단점                                | 제외 사유             |
| --------------------------------------- | ------------------- | ----------------------------------- | --------------------- |
| 옵션 A — 모바일 자체 구현               | 오프라인 잠재 지원  | Phase A+B 로직 모두 재구현 (2-3일+) | 시간/중복 비용 막대   |
| 옵션 C — Supabase Edge Function         | 플랫폼 무관         | 신규 배포 대상, 런타임 추가         | 복잡도 대비 이득 적음 |
| packages/shared 통합 타입 추출          | 타입 이중 관리 방지 | tsconfig/빌드 설정 조정 필요        | Phase D.2로 연기      |
| 모바일 i18n 동시 도입                   | 다국어 동시 출시    | Phase D 범위 급증                   | 출시 후 별도 작업     |
| 모바일 전체 CTA 즉시 교체               | 일관성 즉시         | 리스크 집중                         | 1곳 먼저 검증         |
| WebView로 `/analysis/integrated` 렌더링 | 개발 0              | UX 이질감 치명                      | UX 나쁨               |

## 4. 결과 (Consequences)

### 긍정적 결과

- **최소 투자, 최대 재사용** — 모바일 UI만 구현하면 5축 통합 완성
- **크로스 플랫폼 결과 일관성** — 웹에서 만든 세션을 모바일에서 조회 가능 (Phase D.2)
- **하위 호환** — 기존 모바일 개별 분석 그대로
- **빠른 출시** — Phase A+B 완성된 API 즉시 활용

### 부정적 결과

- **네트워크 의존성 증가** — 모바일도 통합 분석 시 서버 왕복
- **타입 이중 관리** — 모바일 로컬에 `IntegratedAnalysisInput/Result` 재정의
- **환경변수 신규** — `EXPO_PUBLIC_YIROOM_API_URL` 배포 전 설정
- **Storage 업로드는 서버에서** — 모바일 이미지가 서버 거쳐서 Supabase로 갔다가 분석 결과 반환, 왕복 크기 증가

### 리스크

- **Base64 4MB 제한** — 얼굴+전신 합계 근접 가능 → 클라이언트 압축 필수
  - 완화: `expo-image-manipulator`로 1024px 리사이즈 + quality 0.8
- **Clerk 토큰 만료** — 15분~1시간 JWT, 장시간 세션 시 재발급 필요
  - 완화: `getToken({ template: 'supabase' })` 매 요청마다 호출
- **CORS** — 같은 도메인이 아니면 `/api/*`가 모바일 요청 거부 가능
  - 완화: Next.js API는 CORS 기본 허용 (확인 필요, proxy.ts 점검)
- **p95 응답 지연** — 웹보다 모바일에서 이미지 전송 시간 더 걸림
  - 완화: 로딩 UI, 타임아웃 20초로 완화
- **웹 API 변경 시 모바일 브레이크** — 계약 안정성 필요
  - 완화: 타입 유지, 응답 구조 하위 호환

## 5. 구현 가이드

### 5.1 파일 구조

```
apps/mobile/
├── app/(analysis)/integrated/
│   ├── index.tsx                    # 입력 페이지
│   └── result/
│       └── [sessionId].tsx          # 결과 페이지
├── lib/api/
│   └── integrated.ts                # HTTP 클라이언트
├── lib/types/
│   └── integrated.ts                # 로컬 타입 (웹 index.ts와 동기화)
└── components/analysis/integrated/  # 하위 컴포넌트
    ├── ImageUploadSection.tsx
    ├── QuestionnaireForm.tsx
    ├── IntegratedLoadingUI.tsx
    ├── AxesSummaryCard.tsx
    └── PartialSuccessBanner.tsx
```

### 5.2 핵심 HTTP 호출

```typescript
// lib/api/integrated.ts
export async function requestIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  clerkToken: string
): Promise<IntegratedAnalysisResult> {
  const baseUrl = process.env.EXPO_PUBLIC_YIROOM_API_URL;
  const res = await fetch(`${baseUrl}/api/analyze/integrated`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clerkToken}`,
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.userMessage ?? '분석 요청에 실패했어요.');
  }
  return json.result as IntegratedAnalysisResult;
}
```

### 5.3 입력 페이지 플로우

```typescript
// app/(analysis)/integrated/index.tsx
const { getToken } = useAuth();
const onSubmit = async () => {
  const token = await getToken();
  const result = await requestIntegratedAnalysis(input, token!);
  router.replace(`/(analysis)/integrated/result/${result.sessionId}`);
};
```

### 5.4 환경변수 가이드

```bash
# 로컬 개발 (모바일 에뮬레이터 → 동일 네트워크 웹 서버)
EXPO_PUBLIC_YIROOM_API_URL=http://localhost:3000

# 프로덕션
EXPO_PUBLIC_YIROOM_API_URL=https://yiroom.app
```

### 5.5 롤백 계획

- 모바일 라우트 `(analysis)/integrated/` 디렉토리 삭제
- 홈 CTA 링크 원복 (1줄)
- 웹 API는 영향 없음

## 6. 관련 문서

- [ADR-099](./ADR-099-integrated-analysis-flow.md) — 통합 API (Phase A)
- [ADR-100](./ADR-100-integrated-analysis-ui.md) — 웹 UI (Phase B)
- [ADR-101](./ADR-101-integrated-cta-unification.md) — 웹 CTA 일원화 (Phase C)
- [ADR-098](./ADR-098-identity-redefinition-5axis-model.md) — 정체성 재정의 v2
- [ADR-016](./ADR-016-web-mobile-sync.md) — 웹-모바일 동기화 원칙
- [SDD-MOBILE-INTEGRATED](../specs/SDD-MOBILE-INTEGRATED.md) — 구현 스펙

---

**Author**: Claude Code
**Reviewed by**: -
