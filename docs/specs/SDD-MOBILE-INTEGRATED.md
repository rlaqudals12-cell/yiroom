# SDD-MOBILE-INTEGRATED — 모바일 통합 분석 플로우 스펙

> **Version**: 1.1 | **Created**: 2026-04-24 | **Status**: implemented (Phase D MVP)
> **상위 ADR**: [ADR-102](../adr/ADR-102-mobile-integrated-porting.md) (accepted)
> **선행 작업**: 웹 Phase A(ADR-099), B(ADR-100), C(ADR-101) 완료
>
> **Phase D 완료 (2026-04-24)**: 7 ATOM 전체 구현, 9 신규 tests pass (누적 55 tests),
> 모바일 typecheck 0 errors.
> **배포 전 필수**: `.env`에 `EXPO_PUBLIC_YIROOM_API_URL=https://yiroom.app` 추가 후 EAS 재빌드.

---

## 1. 개요

### 1.1 목적

웹 통합 분석 API(`POST /api/analyze/integrated`)를 모바일에서 재사용하여 **모바일에도 5축 통합 분석 UX 제공**.

### 1.2 범위

**포함:**

- 모바일 HTTP 클라이언트 (`lib/api/integrated.ts`)
- 모바일 로컬 타입 정의 (`lib/types/integrated.ts`)
- 입력 페이지 (`app/(analysis)/integrated/index.tsx`)
- 결과 페이지 (`app/(analysis)/integrated/result/[sessionId].tsx`)
- 핵심 하위 컴포넌트 (`components/analysis/integrated/`)
- 홈 히어로 영역 CTA 1곳 전환
- 기본 테스트

**제외:**

- 결과 재방문 시 Supabase 직접 조회 (Phase D.2)
- 모바일 전체 CTA 교체 (Phase D.2)
- Partial 축별 재시도 (웹 v2 동기화)
- 다국어 (모바일 i18n 부재)
- packages/shared 타입 추출 (Phase D.2)
- 오프라인 캐싱

### 1.3 성공 기준

- 모바일 입력 → 결과 플로우 수동 검증 (에뮬레이터)
- TypeScript 0 errors
- Jest 신규 테스트 통과
- 이미지 압축으로 4MB 제한 미만
- Clerk JWT 자동 갱신

---

## 2. HTTP 클라이언트 스펙

### 2.1 환경변수

```bash
# apps/mobile/.env
EXPO_PUBLIC_YIROOM_API_URL=https://yiroom.app
```

### 2.2 모듈 구조

```typescript
// lib/api/integrated.ts
import type { IntegratedAnalysisInput, IntegratedAnalysisResult } from '@/lib/types/integrated';

export async function requestIntegratedAnalysis(
  input: IntegratedAnalysisInput,
  clerkToken: string
): Promise<IntegratedAnalysisResult> {
  const baseUrl = process.env.EXPO_PUBLIC_YIROOM_API_URL;
  if (!baseUrl) throw new Error('EXPO_PUBLIC_YIROOM_API_URL 미설정');

  const res = await fetch(`${baseUrl}/api/analyze/integrated`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clerkToken}`,
    },
    body: JSON.stringify(input),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || !json.success) {
    const msg = json?.error?.userMessage ?? json?.error?.message ?? '분석 요청에 실패했어요.';
    throw new IntegratedApiError(msg, res.status, json?.error?.code);
  }
  return json.result as IntegratedAnalysisResult;
}

export class IntegratedApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'IntegratedApiError';
  }
}
```

### 2.3 에러 처리

| HTTP    | 상황                 | 처리                                                   |
| ------- | -------------------- | ------------------------------------------------------ |
| 401     | Clerk 토큰 무효/만료 | `getToken()` 재호출 후 1회 재시도, 실패 시 로그인 유도 |
| 429     | Rate Limit           | "잠시 후 다시 시도해주세요" 토스트                     |
| 400     | 입력 검증 실패       | 인라인 에러 메시지                                     |
| 500/502 | 서버 오류            | "일시적 오류" + 재시도 버튼                            |
| Network | 네트워크 실패        | "네트워크 연결 확인"                                   |

---

## 3. 로컬 타입 정의

```typescript
// lib/types/integrated.ts
// 웹 apps/web/lib/analysis/integrated/types.ts 와 동기화 유지

export type AxisCode = 'personal_color' | 'skin' | 'body' | 'hair' | 'makeup';

export interface IntegratedAnalysisInput {
  faceImageBase64: string;
  bodyImageBase64?: string;
  questionnaire: {
    skin: { selfReportedType: string; concerns?: string[] };
    hair: { length?: string; density?: string; curlType?: string };
    body: { heightCm?: number; weightKg?: number; shoulderWidthCm?: number; waistCm?: number };
  };
  options: { locale: 'ko' | 'en' | 'ja' | 'zh'; skipMakeup: boolean };
}

export type AxisResult<T> =
  | { success: true; data: T; usedFallback: boolean }
  | { success: false; error: AxisError };

export interface AxisError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

// ... PersonalColorAxisData, SkinAxisData 등 웹과 동일

export interface IntegratedAnalysisResult {
  sessionId: string;
  status: 'completed' | 'partial' | 'failed';
  axes: {
    personalColor: AxisResult<unknown>;
    skin: AxisResult<unknown>;
    body: AxisResult<unknown>;
    hair: AxisResult<unknown>;
    makeup: AxisResult<unknown>;
  };
  axesCompleted: AxisCode[];
  axesFailed: AxisCode[];
  usedFallback: AxisCode[];
  createdAt: string;
  completedAt: string;
}
```

> **동기화 규칙**: 웹 types.ts 변경 시 모바일도 업데이트 필요. Phase D.2에서 `packages/shared`로 추출.

---

## 4. 입력 페이지 스펙

### 4.1 라우트

```
apps/mobile/app/(analysis)/integrated/index.tsx
```

### 4.2 UI 구성

```
┌──────────────────────────────┐
│ ScreenContainer              │
│ ├─ 헤더: "5축 통합 분석"     │
│ ├─ 안내 문구 (2분 소요)      │
│ ├─ 얼굴 셀카 업로드 카드     │
│ │   [카메라] [갤러리]        │
│ ├─ 전신 사진 (선택) 카드     │
│ ├─ 자가입력 섹션             │
│ │   피부 타입 (칩)           │
│ │   헤어 (길이/숱/곱슬)      │
│ │   체형 (키/몸무게 옵션)    │
│ ├─ 에러 메시지 (있으면)      │
│ └─ [내 정체성 알아보기] CTA  │
└──────────────────────────────┘
```

### 4.3 이미지 처리

```typescript
// expo-camera 또는 expo-image-picker
// 반환된 base64를 그대로 data URL로 변환 (prefix 추가)
const dataUrl = `data:image/jpeg;base64,${rawBase64}`;

// 4MB 초과 시 expo-image-manipulator로 재압축
// quality: 0.7, maxWidth: 1024
```

### 4.4 제출 플로우

```typescript
const { getToken } = useAuth();

async function handleSubmit() {
  setIsSubmitting(true);
  try {
    const token = await getToken();
    if (!token) throw new Error('인증 토큰이 없어요.');

    const result = await requestIntegratedAnalysis(input, token);
    router.replace({
      pathname: '/(analysis)/integrated/result/[sessionId]',
      params: {
        sessionId: result.sessionId,
        // Phase D MVP: 결과 데이터를 쿼리로 전달 (재방문 조회 기능은 D.2)
        payload: encodeURIComponent(JSON.stringify(result)),
      },
    });
  } catch (e) {
    setError(e instanceof Error ? e.message : '실패');
  } finally {
    setIsSubmitting(false);
  }
}
```

### 4.5 로딩 UI

- 별도 라우트 없이 `isSubmitting` 상태로 전환
- 5축 체크리스트 + 예상 소요 안내 (웹 `IntegratedLoadingUI` 대응)

---

## 5. 결과 페이지 스펙

### 5.1 라우트

```
apps/mobile/app/(analysis)/integrated/result/[sessionId].tsx
```

### 5.2 데이터 소스 (MVP)

- URL `params.payload`에서 POST 응답 result 파싱
- 없으면 "세션을 찾을 수 없어요" + 새 분석 유도 (재방문 지원은 Phase D.2)

```typescript
const { sessionId, payload } = useLocalSearchParams();

const result = useMemo<IntegratedAnalysisResult | null>(() => {
  if (!payload || typeof payload !== 'string') return null;
  try {
    return JSON.parse(decodeURIComponent(payload));
  } catch {
    return null;
  }
}, [payload]);

if (!result) {
  return <EmptyResultState sessionId={sessionId as string} />;
}
```

### 5.3 UI 구성

```
┌──────────────────────────────┐
│ ScreenContainer              │
│ ├─ 헤더: "내 정체성 5축"    │
│ ├─ PartialSuccessBanner      │
│ │   (status === 'partial')   │
│ ├─ AxesSummaryCard           │
│ │   5축 라벨 + 값 요약       │
│ ├─ NextStepsLinks            │
│ │   (완료된 축의 다음 단계)  │
│ └─ 하단 안내 문구             │
└──────────────────────────────┘
```

### 5.4 AxesSummaryCard 모바일 버전

웹과 동일한 구조, React Native 컴포넌트로 재작성:

- `View` + `Text` + `Ionicons`/`lucide-react-native`
- NativeWind 클래스 사용

---

## 6. 모바일 홈 CTA 전환

### 6.1 대상

`apps/mobile/app/(tabs)/index.tsx` 홈 화면의 **히어로 영역 Primary CTA**.

### 6.2 Before / After

```tsx
// Before: PC + 피부 2개 버튼
<Button onPress={() => router.push('/(analysis)/personal-color')}>
  퍼스널컬러
</Button>
<Button onPress={() => router.push('/(analysis)/skin')}>
  피부
</Button>

// After: 통합 1개 + Secondary 텍스트 링크
<Button
  onPress={() => router.push('/(analysis)/integrated')}
  gradient={['#ec4899', '#a855f7']}
>
  내 정체성 5축 알아보기
  {/* sub: 색 · 피부 · 체형 · 헤어 · 약 2분 */}
</Button>

<SecondaryLinks>
  퍼스널컬러 · 피부 · 체형 · 헤어 · 메이크업
</SecondaryLinks>
```

### 6.3 나머지 CTA는 Phase D.2

- 퀵 액션 원형 (PC/피부/체형)
- 진행률 카드 CTA
- 재측정 CTA

---

## 7. P3 원자 분해

### ATOM D1: ADR-102 + SDD 작성 (완료)

### ATOM D2: 로컬 타입 + HTTP 클라이언트 (0.5h)

- 출력: `lib/types/integrated.ts`, `lib/api/integrated.ts`

### ATOM D3: 입력 페이지 (2h)

- 출력: `app/(analysis)/integrated/index.tsx` + 하위 컴포넌트 3개
  - ImageUploadSection, QuestionnaireForm, IntegratedLoadingUI

### ATOM D4: 결과 페이지 (1.5h)

- 출력: `app/(analysis)/integrated/result/[sessionId].tsx` + AxesSummaryCard, PartialSuccessBanner, NextStepsLinks

### ATOM D5: 홈 히어로 CTA 전환 (0.5h)

- 출력: `app/(tabs)/index.tsx` 수정 (또는 해당 HeroSection 컴포넌트)

### ATOM D6: 테스트 (1h)

- 출력: `__tests__/lib/api/integrated.test.ts` (HTTP 모킹)
- `__tests__/components/analysis/integrated/AxesSummaryCard.test.tsx` (렌더링)

### ATOM D7: 문서 동기화 (0.5h)

- ADR-102 accepted, SDD implemented, MEMORY 업데이트

### 총 예상: 약 6시간

---

## 8. 에러 처리

### 8.1 입력 페이지

| 상황             | 처리                                   |
| ---------------- | -------------------------------------- |
| 이미지 없음      | 제출 버튼 비활성화                     |
| 이미지 처리 실패 | 토스트 + 재선택 유도                   |
| Clerk 토큰 없음  | "로그인이 필요해요" + 로그인 화면 이동 |
| 401              | 토큰 재발급 후 1회 재시도              |
| 기타             | 인라인 에러 + 재시도                   |

### 8.2 결과 페이지

| 상황                    | 처리                                       |
| ----------------------- | ------------------------------------------ |
| `payload` 파라미터 없음 | EmptyResultState ("세션을 찾을 수 없어요") |
| JSON 파싱 실패          | 동일                                       |
| status === 'failed'     | "분석이 실패했어요" + "다시 시도"          |

---

## 9. 테스트 기준

### 9.1 단위 테스트

- `requestIntegratedAnalysis` — 성공/401/429/네트워크 실패
- `IntegratedApiError` — 타입 + code 전달

### 9.2 컴포넌트 테스트

- `AxesSummaryCard` — 5축 렌더링, null 처리
- `PartialSuccessBanner` — 실패 축 한국어 라벨

### 9.3 E2E (Phase D.2)

- 에뮬레이터 기반 수동 검증 이번 MVP 범위

---

## 10. 의존성

### 10.1 웹 측 재사용

- `POST /api/analyze/integrated` — 그대로 (변경 없음)
- `IntegratedAnalysisResult` 타입 구조 — 모바일에 복사

### 10.2 모바일 기존 자산

- `useClerkSupabaseClient()` — 결과 페이지에서는 사용 안 함 (MVP는 POST 응답만)
- `useAuth().getToken()` — Clerk JWT 획득
- `expo-camera`, `expo-image-picker`, `expo-image-manipulator`
- NativeWind, `components/ui/Button`, `Card`, `ScreenContainer`

### 10.3 신규 환경변수

```bash
EXPO_PUBLIC_YIROOM_API_URL=https://yiroom.app  # 프로덕션
```

로컬 개발: 에뮬레이터에서 호스트 머신 접근용 IP (예: `http://10.0.2.2:3000` for Android emulator).

---

## 11. 관련 문서

- [ADR-102](../adr/ADR-102-mobile-integrated-porting.md)
- [ADR-099/100/101](../adr/)
- [ADR-016 웹-모바일 동기화](../adr/ADR-016-web-mobile-sync.md)
- [SDD-INTEGRATED-ANALYSIS](./SDD-INTEGRATED-ANALYSIS.md)
- [SDD-INTEGRATED-RESULT-UI](./SDD-INTEGRATED-RESULT-UI.md)

---

**Author**: Claude Code
**Reviewed by**: -
