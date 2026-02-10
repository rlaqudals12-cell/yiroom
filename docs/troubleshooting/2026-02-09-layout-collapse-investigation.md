# 레이아웃 깨짐 (콘텐츠 수직 축소) 조사

> **날짜**: 2026-02-09
> **영향 파일**: apps/web/app/ 전체 페이지 (home 제외)
> **심각도**: 높음
> **상태**: ✅ 해결됨 (근본 원인: @theme inline 순환 참조)

---

## 증상

- 모든 페이지(home 제외)에서 콘텐츠가 ~20-30px 폭으로 축소
- 텍스트가 세로로 한 글자씩 표시됨
- `/home`만 정상, `/dashboard`도 정상 (`max-w-4xl` → container 변수 사용)
- 11세션에 걸쳐 근본 원인 확인 및 수정

## 배제된 원인 (서버측)

### 1. CSS 컴파일/서빙 문제 — 배제

| 검증 항목                  | 결과                                           | 방법                 |
| -------------------------- | ---------------------------------------------- | -------------------- |
| CSS 파일 다운로드          | 21,014줄 정상                                  | curl로 직접 다운로드 |
| `max-w-7xl` 클래스         | 존재                                           | grep 확인            |
| `min-h-[calc(100vh-80px)]` | 존재                                           | grep 확인            |
| `.container` 정의          | `width:100%` + 반응형 max-width                | 정상                 |
| `main` 규칙                | `max-width:80rem, mx-auto, pt-16, px-4`        | 정상                 |
| CSS 변수                   | `--container-7xl: 80rem`, `--spacing: 0.25rem` | 정상                 |

### 2. 서버 HTML 구조 — 정상

```
curl /home → 200 → 올바른 <main> + 콘텐츠
curl /announcements → 200 → 올바른 <main> + 콘텐츠
curl /workout → 307 (인증 필요, 테스트 불가)
```

두 공개 페이지 모두 동일한 올바른 HTML 구조:

```html
<body class="...antialiased bg-background text-foreground">
  <header class="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
  <main id="main-content" class="pb-bottom-nav md:pb-0">
    <!-- 페이지 콘텐츠 -->
  </main>
  <nav class="fixed bottom-0 ...">
</body>
```

### 3. Provider DOM 래퍼 — 모두 투명

| Provider                | DOM 출력                              | 검증                         |
| ----------------------- | ------------------------------------- | ---------------------------- |
| ThemeProvider           | Context만                             | CSS class 토글만 (html root) |
| I18nProvider            | Context만                             |                              |
| SyncUserProvider        | `<>{children}</>`                     | Fragment                     |
| GenderProvider          | Context만                             |                              |
| GamificationProvider    | Context만                             |                              |
| AgeVerificationProvider | Context만 (로딩 중엔 스피너 오버레이) | 로딩 해제 후 투명            |
| AgreementGuard          | `return null`                         | DOM 요소 없음                |

### 4. 클라이언트 레이아웃 수정 — 없음

| 검색 항목                                 | 결과                         |
| ----------------------------------------- | ---------------------------- |
| `useLayoutEffect` (providers, app)        | 없음                         |
| `document.getElementById('main-content')` | 없음                         |
| 동적 `style.width` / `style.maxWidth`     | 없음                         |
| CSS-in-JS / style injection               | 없음                         |
| OnboardingTutorial                        | fixed 오버레이만 (z-100~102) |
| ProductCompare                            | fixed 버튼만 (z-40)          |

### 5. 코드 변경 → 원인이 아님

**결정적 증거**: `apps/web/app/(main)/workout/page.tsx`는 커밋 대비 코드 변경이 **0줄**인데도 깨짐.

- 40개 페이지의 `<main>` → `<div>` 변경은 원인이 아님
- `globals.css`는 변경 없음 (커밋과 동일)
- UI 컴포넌트는 변경 없음

### 6. inline style 테스트 — 실패

`<main>` 태그에 최고 우선순위 inline style 적용:

```tsx
<main style={{ maxWidth: '80rem', marginInline: 'auto', padding: '4rem 1rem' }}>
```

**결과**: 여전히 깨짐 → CSS 우선순위/값 문제가 아님

## 근본 원인: `@theme inline` 순환 참조

### 메커니즘

`globals.css`의 `@theme inline` 블록에 spacing/shadow 변수의 순환 참조가 포함되어 있었다:

```css
@theme inline {
  /* ... 정상 변수들 ... */
  --spacing-lg: var(--spacing-lg); /* 순환 참조! */
  --spacing-xl: var(--spacing-xl); /* 순환 참조! */
  --spacing-2xl: var(--spacing-2xl); /* 순환 참조! */
  /* ... */
}
```

이것이 Tailwind CSS v4의 유틸리티 클래스 매핑을 오염시켰다:

| 유틸리티    | 정상 매핑                              | 오염된 매핑                          | 결과                       |
| ----------- | -------------------------------------- | ------------------------------------ | -------------------------- |
| `max-w-lg`  | `var(--container-lg)` = 32rem (512px)  | `var(--spacing-lg)` = 1.5rem (24px)  | **콘텐츠 24px로 축소**     |
| `max-w-2xl` | `var(--container-2xl)` = 42rem (672px) | `var(--spacing-2xl)` = 2.5rem (40px) | **콘텐츠 40px로 축소**     |
| `max-w-4xl` | `var(--container-4xl)` = 56rem         | `var(--container-4xl)` = 56rem       | 영향 없음 (container 변수) |

### CSS Cascade 동작

1. `@theme inline`에서 `--spacing-lg: var(--spacing-lg);` 정의
2. Tailwind v4가 `--spacing-lg` 토큰을 인식하여 `max-w-lg`를 `var(--spacing-lg)`로 매핑
3. `:root { --spacing-lg: 1.5rem; }` (CSS 후반에서 실제 값 정의)
4. CSS cascade에서 후자가 승리 → `--spacing-lg` = 1.5rem
5. `max-w-lg` = `max-width: var(--spacing-lg)` = `max-width: 1.5rem` = **24px**

### 왜 `/home`과 `/dashboard`만 정상이었나

| 페이지           | 사용 클래스              | 매핑 결과                            | 상태                       |
| ---------------- | ------------------------ | ------------------------------------ | -------------------------- |
| `/home`          | `max-w-*` 미사용         | N/A                                  | 정상                       |
| `/dashboard`     | `max-w-4xl`              | `var(--container-4xl)` = 56rem       | 정상 (container 변수 사용) |
| `/workout`       | `max-w-lg`               | `var(--spacing-lg)` = 1.5rem = 24px  | **깨짐**                   |
| `/announcements` | `max-w-2xl`              | `var(--spacing-2xl)` = 2.5rem = 40px | **깨짐**                   |
| 기타 대부분      | `max-w-lg` ~ `max-w-2xl` | spacing 변수로 매핑                  | **깨짐**                   |

### 왜 inline style도 실패했나

layout.tsx의 `<main>`에 `style={{ maxWidth: '80rem' }}`을 적용했지만 여전히 깨졌던 이유:

- `<main>` 자체는 정상 (80rem)
- 그 안의 **페이지 콘텐츠 `<div>`**가 `max-w-lg` 등을 사용
- 자식 요소의 `max-width: 24px`가 콘텐츠를 축소

## 수정 내용

### 변경 파일: `apps/web/app/globals.css`

`@theme inline` 블록에서 순환 참조 10개 제거:

```css
/* 제거됨 */
--spacing-xs: var(--spacing-xs);
--spacing-sm: var(--spacing-sm);
--spacing-md: var(--spacing-md);
--spacing-lg: var(--spacing-lg);
--spacing-xl: var(--spacing-xl);
--spacing-2xl: var(--spacing-2xl);
--shadow-sm: var(--shadow-sm);
--shadow-md: var(--shadow-md);
--shadow-lg: var(--shadow-lg);
--shadow-card: var(--shadow-card);
```

`:root`의 실제 값 정의는 유지 (커스텀 CSS 변수로 사용):

```css
:root {
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  /* ... */
}
```

### 검증 결과

수정 후 컴파일된 CSS에서 매핑 정상 확인:

```
수정 전: max-w-lg → var(--spacing-lg) = 1.5rem (24px) ❌
수정 후: max-w-lg → var(--container-lg) = 32rem (512px) ✅

수정 전: max-w-2xl → var(--spacing-2xl) = 2.5rem (40px) ❌
수정 후: max-w-2xl → var(--container-2xl) = 42rem (672px) ✅
```

HTTP 상태 코드 검증:

```
/home → 200 ✅
/announcements → 200 ✅
/workout → 307 (인증 필요, 정상) ✅
```

## Turbopack 캐시 손상 (별개 이슈)

조사 도중 Turbopack 캐시 손상 발견:

```
thread 'tokio-runtime-worker' panicked at turbo-tasks-backend:
Failed to restore task data (corrupted database or bug)

Caused by:
  Unable to open static sorted file 00002117.sst
  지정된 파일을 찾을 수 없습니다. (os error 2)
```

**해결**: `.next` 폴더 완전 삭제 후 재시작

```bash
taskkill /F /IM node.exe
rm -rf apps/web/.next
cd apps/web && npx next dev --turbopack
```

## 교훈

1. **`@theme inline`에 spacing/shadow 변수 정의 금지** — Tailwind v4가 `max-w-lg`를 `var(--spacing-lg)`로 매핑하여 레이아웃 깨짐
2. **정상/비정상 페이지 비교가 핵심** — `max-w-*` 클래스별 매핑 차이를 분석하여 근본 원인 발견
3. **컴파일된 CSS의 변수 매핑 직접 확인** — 소스 코드만 보면 문제를 찾을 수 없었음
4. **inline style 실패 ≠ CSS 무관** — 부모가 아니라 자식 요소의 CSS가 원인일 수 있음
5. **`@theme inline`과 `:root`의 역할 구분** — `@theme inline`은 Tailwind 토큰 등록, `:root`는 CSS 변수값 정의
6. **Turbopack .next 캐시는 자주 손상됨** — 문제 시 즉시 삭제

## 관련 파일

| 파일                                | 내용                                     |
| ----------------------------------- | ---------------------------------------- |
| `apps/web/app/layout.tsx`           | Root layout (`<main id="main-content">`) |
| `apps/web/app/globals.css`          | `@layer base { main { ... } }`           |
| `apps/web/app/(main)/layout.tsx`    | AgeVerificationProvider 래퍼             |
| `apps/web/next.config.ts`           | PWA/Workbox 캐싱 설정                    |
| `.claude/rules/server-debugging.md` | 서버 디버깅 규칙                         |

## 조사 타임라인

| 세션 | 시도                                        | 결과               |
| ---- | ------------------------------------------- | ------------------ |
| 1-3  | CSS 파일 다운로드, HTML 구조, Provider 검증 | 모두 정상 → 배제   |
| 4-5  | 클라이언트 JS 검색, inline style 테스트     | 영향 없음 → 배제   |
| 6-7  | 코드 변경 diff 분석, 캐시/SW 가설           | 코드 무관 확인     |
| 8    | Turbopack 캐시 손상 발견 및 해결            | 별개 이슈          |
| 9    | 정상/비정상 페이지 `max-w-*` 클래스 비교    | 패턴 발견          |
| 10   | 컴파일된 CSS 변수 매핑 분석                 | **근본 원인 확인** |
| 11   | `@theme inline` 순환 참조 제거 + 검증       | **수정 완료**      |

---

**Version**: 2.0 | **Updated**: 2026-02-09 | 근본 원인 확인 및 수정 완료
