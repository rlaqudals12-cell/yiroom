# SDD-PHASE-C-CTA-UNIFICATION — 통합 CTA 일원화 스펙

> **Version**: 1.1 | **Created**: 2026-04-24 | **Status**: implemented
> **상위 ADR**: [ADR-101](../adr/ADR-101-integrated-cta-unification.md)
> **선행 작업**: Phase A(ADR-099), Phase B(ADR-100) 완료
>
> **Phase C 완료 (2026-04-24)**: 8 ATOM 전체 구현, 6 신규 tests pass (누적 46 tests),
> typecheck/lint 0 errors (warning은 기존 코드 무관).

---

## 1. 개요

### 1.1 목적

ADR-099/100에서 완성한 통합 분석 플로우(`/analysis/integrated`)를 **랜딩 + 홈 주 진입점**으로 연결.

### 1.2 범위

**포함:**

- 랜딩 CTA 3곳 → 통합 플로우
- 홈 NewUserHero CTA 단일화
- 홈 GrowingNextStep — 통합 세션 없으면 "통합 먼저" 권유
- 홈 HomeAnalysisSummary — 최신 통합 세션 링크 추가
- `useLatestIntegratedSession()` 훅 신규
- 컴포넌트 테스트

**제외:**

- 모듈별 개별 페이지 제거 (유지)
- 22개 홈 위젯 재구조화
- 모바일 포팅 (Phase C.2)
- A/B 테스트
- 온보딩 "시작 의도" 문항 추가

### 1.3 성공 기준

- 랜딩/홈 주 CTA 클릭 = `/analysis/integrated` 진입
- 기존 모듈별 URL 100% 유지 (SEO/북마크 보호)
- typecheck + lint + 신규 테스트 모두 통과

---

## 2. 변경 대상 상세

### 2.1 `app/LandingContent.tsx`

**변경 지점 3곳:**

| 위치                 | Before                     | After                                            |
| -------------------- | -------------------------- | ------------------------------------------------ |
| 히어로 `startFree`   | `SignInButton` + 데모 링크 | `SignInButton` → `/analysis/integrated` redirect |
| 하단 `ctaStart`      | 동일                       | 동일                                             |
| 풋 `bottomCtaSignUp` | `SignInButton` 후 대시보드 | `SignInButton` 후 `/analysis/integrated`         |

Clerk `SignInButton`의 `afterSignInUrl`/`forceRedirectUrl`를 `/analysis/integrated`로 설정.

### 2.2 `app/(main)/home/_components/NewUserHero.tsx`

**Before:**

```tsx
<Link href="/analysis/personal-color">첫 분석 시작</Link>
<Link href="/analysis/skin">피부 먼저</Link>
```

**After:**

```tsx
<Link href="/analysis/integrated">
  내 정체성 5축 알아보기 (약 2분)
</Link>
<Link href="/onboarding/survey">
  설문으로 시작
</Link>
```

### 2.3 `hooks/useLatestIntegratedSession.ts` (신규)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { IntegratedSessionRow } from '@/lib/analysis/integrated';

export interface UseLatestIntegratedSessionResult {
  session: IntegratedSessionRow | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 현재 사용자의 가장 최근 통합 분석 세션 조회.
 * - status: completed | partial 만 (failed 제외)
 * - order: created_at DESC, limit 1
 */
export function useLatestIntegratedSession(): UseLatestIntegratedSessionResult {
  const supabase = useClerkSupabaseClient();
  const [session, setSession] = useState<IntegratedSessionRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('integrated_analysis_sessions')
          .select('*')
          .in('status', ['completed', 'partial'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (dbError) throw dbError;
        setSession(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return { session, isLoading, error };
}
```

### 2.4 `GrowingNextStep.tsx` / `HomeAnalysisSummary.tsx`

- `useLatestIntegratedSession()` 훅 호출
- 세션 없으면 → "5축 한 번에 알아보기" 권유 카드 최상단 렌더링
- 세션 있으면 → "최신 통합 결과 보기" 링크 표시 (`/analysis/integrated/result/{id}`)

두 컴포넌트 모두 `_components/IntegratedSessionPromptCard.tsx` (신규)를 공유 사용.

### 2.5 공유 프롬프트 카드 (신규)

```tsx
// app/(main)/home/_components/IntegratedSessionPromptCard.tsx
'use client';

export function IntegratedSessionPromptCard(): React.JSX.Element {
  const { session, isLoading } = useLatestIntegratedSession();

  if (isLoading) return <Skeleton />;

  if (session) {
    return (
      <Link href={`/analysis/integrated/result/${session.id}`}>
        <Card>최신 통합 결과 보기 ({session.axes_completed.length}/5)</Card>
      </Link>
    );
  }

  return (
    <Link href="/analysis/integrated">
      <Card>5축 한 번에 알아보기 (약 2분)</Card>
    </Link>
  );
}
```

---

## 3. P3 원자 분해

### ATOM C1: ADR-101 + SDD-PHASE-C 작성 (완료)

### ATOM C2: 랜딩 CTA 전환 (0.5h)

- 출력: `app/LandingContent.tsx` 3곳 수정
- 검증: 수동 클릭 테스트 (개발 서버)

### ATOM C3: NewUserHero CTA 통합 (0.5h)

- 출력: `app/(main)/home/_components/NewUserHero.tsx`
- 2개 링크 → 통합 1개 + 설문 1개

### ATOM C4: useLatestIntegratedSession 훅 (0.5h)

- 출력: `hooks/useLatestIntegratedSession.ts`

### ATOM C5: IntegratedSessionPromptCard 컴포넌트 (0.5h)

- 출력: `_components/IntegratedSessionPromptCard.tsx`

### ATOM C6: GrowingNextStep + HomeAnalysisSummary 연결 (0.5h)

- 기존 컴포넌트 최상단에 PromptCard 삽입

### ATOM C7: 컴포넌트 테스트 (1h)

- 출력: `tests/components/home/IntegratedSessionPromptCard.test.tsx`
- `tests/hooks/useLatestIntegratedSession.test.ts`

### ATOM C8: 문서 동기화 + MEMORY (0.5h)

**총 예상: 약 4시간**

---

## 4. 테스트 기준

### 4.1 단위 테스트

- `useLatestIntegratedSession` — 성공/실패/로딩 상태
- `IntegratedSessionPromptCard` — session === null일 때, 있을 때 각각 렌더링

### 4.2 수동 검증

- 비로그인 상태 `/` → `startFree` 클릭 → 로그인 후 `/analysis/integrated`
- 신규 사용자 로그인 → `/home` → NewUserHero 버튼 = `/analysis/integrated`
- 기존 사용자 (4+축 완료, 통합 세션 없음) → HomeAnalysisSummary에 권유 카드 표시
- 통합 세션 완료 후 → 홈 재방문 시 "최신 결과 보기" 링크 표시

---

## 5. 에러 처리

| 상황                                 | 처리                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `useLatestIntegratedSession` DB 실패 | `error` 반환, PromptCard는 세션 없는 경우처럼 렌더링 (안전한 기본값) |
| 로그인 사용자 Clerk 세션 만료        | RLS가 0개 결과 반환 → `session: null` (기존 동작과 동일)             |
| `/analysis/integrated` 404           | Next.js 기본 404 (이 페이지는 Phase B에서 생성됨)                    |

---

## 6. 의존성

### 6.1 Phase A/B 재사용

- `integrated_analysis_sessions` 테이블 (Phase A)
- `lib/analysis/integrated` 타입 (Phase A)
- `/analysis/integrated` 페이지 (Phase B)
- `/analysis/integrated/result/[sessionId]` 페이지 (Phase B)

### 6.2 기존 자산

- `useClerkSupabaseClient()` — RLS 적용 DB 접근
- `shadcn/ui` Card, Button

---

## 7. 관련 문서

- [ADR-101](../adr/ADR-101-integrated-cta-unification.md) — 상위 결정
- [ADR-099](../adr/ADR-099-integrated-analysis-flow.md) — Phase A
- [ADR-100](../adr/ADR-100-integrated-analysis-ui.md) — Phase B
- [SDD-INTEGRATED-ANALYSIS](./SDD-INTEGRATED-ANALYSIS.md)
- [SDD-INTEGRATED-RESULT-UI](./SDD-INTEGRATED-RESULT-UI.md)

---

**Author**: Claude Code
**Reviewed by**: -
