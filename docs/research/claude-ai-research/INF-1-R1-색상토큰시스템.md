# 디자인 시스템 컬러 토큰 시스템 종합 연구

## 1. 핵심 요약 (Key Summary)

**OKLCH는 2025년 디자인 시스템의 표준 색상 공간으로 자리잡았습니다.** 92.87%의 브라우저 지원율과 지각적 균일성(perceptual uniformity)으로 일관된 색상 스케일 생성이 가능합니다. Tailwind CSS v4는 CSS-first 설정 방식으로 전환되어 `@theme` 디렉티브를 통해 OKLCH 기반 커스텀 컬러 토큰을 직접 정의합니다. shadcn/ui의 background/foreground 패턴과 next-themes 조합은 다크모드 구현의 프로덕션 표준이며, 시맨틱 토큰 계층(primitive → semantic → component)을 통해 유지보수성과 테마 확장성을 동시에 확보할 수 있습니다.

---

## 2. 상세 내용 (Detailed Content)

### 2.1 OKLCH vs HSL vs RGB 색상 공간 비교

#### 기술적 차이점

| 색상 공간 | 표현 방식 | 색역(Gamut) | 특징 |
|----------|----------|------------|------|
| **RGB** | `rgb(109 162 218)` | sRGB (~35% 가시광) | 기기 의존적, 직관적 조작 불가 |
| **HSL** | `hsl(210 60% 64%)` | sRGB | 인간 친화적이나 비지각적 |
| **OKLCH** | `oklch(0.7 0.14 240)` | P3, Rec2020 지원 | 지각적 균일성, 와이드 가뭇 |

**OKLCH 구성 요소:**
- **L (Lightness)**: 0-1 또는 0%-100% - *지각적* 밝기
- **C (Chroma)**: 0 ~ 0.37 - 채도/선명도
- **H (Hue)**: 0-360° 색상각 (빨강 ~20°, 노랑 ~90°, 초록 ~140°, 파랑 ~240°)

#### 지각적 균일성이 중요한 이유

HSL에서 `hsl(240 100% 50%)`(파랑)과 `hsl(60 100% 50%)`(노랑)은 동일한 밝기값(50%)을 가지지만, **노랑이 훨씬 밝게 보입니다**. 이는 색상 팔레트 생성 시 예측 불가능한 결과를 초래합니다.

OKLCH는 L값이 동일하면 실제로 동일한 밝기로 인식되어, **hover 상태에서 10% 밝기 증가 시 모든 색상에서 일관된 시각적 결과**를 얻을 수 있습니다.

```css
/* HSL: 파랑과 노랑이 다른 밝기로 보임 */
.hsl-blue { color: hsl(240 100% 50%); }
.hsl-yellow { color: hsl(60 100% 50%); }

/* OKLCH: 동일한 L = 동일한 지각적 밝기 */
.oklch-blue { color: oklch(0.7 0.15 240); }
.oklch-yellow { color: oklch(0.7 0.15 90); }
```

#### 2025년 브라우저 지원 현황

**전역 지원율: 92.87%**

| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 111+ (2023년 3월~) |
| Firefox | 113+ (2023년 5월~) |
| Safari | 15.4+ (2022년 3월~) |
| Edge | 111+ |
| Safari iOS | 15.4+ |

**폴백 전략:**
```css
.element {
  /* 레거시 브라우저 폴백 */
  background-color: rgb(100, 149, 237);
}

@supports (color: oklch(0% 0 0)) {
  .element {
    background-color: oklch(70% 0.15 240);
  }
}
```

#### 성능 고려사항

- **RGB/Hex**: 가장 빠름 - 브라우저 네이티브 포맷
- **HSL**: 약간 느림 - RGB 변환 필요
- **OKLCH**: 변환 오버헤드 있음 - 실제 영향 미미

**실질적 이점**: PNG 그라데이션 이미지를 OKLCH CSS 그라데이션으로 대체 시 번들 크기 **120KB 감소**, LCP **11% 개선** 사례 보고

#### 접근성 함의 (WCAG)

WCAG 2.1 대비 계산은 여전히 **sRGB 기반**입니다. 권장 워크플로우:
1. OKLCH로 디자인하여 지각적 일관성 확보
2. sRGB Hex로 변환하여 WCAG 대비비 검증
3. L ≥ 0.87인 색상은 검정 텍스트와 좋은 대비 보장

**도구**: OddContrast (oddcontrast.com) - OKLCH 지원 대비 검사기

#### 사용 시점 가이드

| 상황 | 권장 색상 공간 |
|------|--------------|
| 디자인 시스템 구축 | **OKLCH** |
| 동적 테마/색상 변형 | **OKLCH** |
| P3 와이드 가뭇 지원 | **OKLCH** |
| 레거시 시스템 | RGB/Hex |
| 이미지 라이브러리 연동 | RGB |

---

### 2.2 시맨틱 토큰 설계 패턴

#### 3계층 토큰 아키텍처

```
┌─────────────────────────────────────────────────┐
│  Component Tokens (컴포넌트 토큰)                │
│  --button-bg: var(--color-primary)              │
├─────────────────────────────────────────────────┤
│  Semantic Tokens (시맨틱 토큰)                   │
│  --color-primary: var(--blue-60)                │
├─────────────────────────────────────────────────┤
│  Primitive Tokens (프리미티브 토큰)              │
│  --blue-60: oklch(0.62 0.21 240)                │
└─────────────────────────────────────────────────┘
```

#### 표준 시맨틱 컬러 카테고리

| 카테고리 | 용도 | 토큰명 예시 |
|---------|------|-----------|
| **Primary** | 주요 브랜드/액션 | `primary`, `accent`, `brand` |
| **Secondary** | 보조 액션 | `secondary` |
| **Destructive/Error** | 에러, 삭제 | `destructive`, `error`, `danger` |
| **Warning** | 경고 상태 | `warning`, `caution` |
| **Success** | 성공 상태 | `success`, `positive` |
| **Muted** | 비활성/보조 | `muted` |
| **Neutral** | 텍스트/보더용 회색 | `neutral`, `gray` |

#### Surface/Background 토큰 패턴

**Material Design 3 Surface 컨테이너:**
```
surface
surface-container-lowest
surface-container-low
surface-container (기본)
surface-container-high
surface-container-highest
```

**Radix UI 12단계 스케일 용도:**
```css
/* Steps 1-2: 앱/미묘한 배경 */
--gray-1  /* 앱 배경 */
--gray-2  /* 카드 배경 */

/* Steps 3-5: 컴포넌트 배경 */
--gray-3  /* 기본 상태 */
--gray-4  /* 호버 상태 */
--gray-5  /* 눌림/선택 상태 */

/* Steps 6-8: 보더 */
--gray-6  /* 미묘한 보더 */
--gray-7  /* 기본 보더 */
--gray-8  /* 호버 보더, 포커스 링 */

/* Steps 9-10: 솔리드 배경 */
--gray-9  /* 버튼 배경 */
--gray-10 /* 버튼 호버 */

/* Steps 11-12: 텍스트 */
--gray-11 /* 저대비 텍스트 */
--gray-12 /* 고대비 텍스트 */
```

#### "On-Color" 텍스트 토큰 패턴

모든 배경색에는 대응하는 전경색이 필요합니다:

| 배경 토큰 | 텍스트 토큰 |
|----------|-----------|
| `--primary` | `--primary-foreground` |
| `--secondary` | `--secondary-foreground` |
| `--destructive` | `--destructive-foreground` |
| `--muted` | `--muted-foreground` |

**shadcn/ui 패턴:**
```css
:root {
  --primary: oklch(0.21 0.006 285);
  --primary-foreground: oklch(0.985 0 0);
  
  --destructive: oklch(0.577 0.245 27.33);
  /* destructive-foreground는 primary-foreground(흰색) 사용 */
}
```

#### 인터랙티브 상태 토큰

| 상태 | 설명 | 일반적 패턴 |
|------|------|-----------|
| **Default** | 기본 상태 | 베이스 컬러 |
| **Hover** | 마우스 오버 | 반 스텝 어둡게/밝게 |
| **Active/Pressed** | 클릭/탭 | 두 스텝 변경 |
| **Focus** | 키보드 포커스 | 포커스 링 + 호버 |
| **Disabled** | 비활성 | 투명도/대비 감소 |

```css
/* Shopify Polaris 패턴 */
--color-bg-surface           /* 기본 */
--color-bg-surface-hover     /* 호버 */
--color-bg-surface-active    /* 액티브 */
--color-bg-surface-selected  /* 선택 */
--color-bg-surface-disabled  /* 비활성 */
```

---

### 2.3 CSS 변수 네이밍 패턴

#### 업계 표준 네이밍 컨벤션

**케밥 케이스(kebab-case)가 지배적 표준:**
- `--color-primary-500`
- `--font-size-lg`
- `--spacing-4`

모든 주요 디자인 시스템이 케밥 케이스 사용 (CSS 속성과 일관성)

#### 프리픽스 전략 비교

| 시스템 | 프리픽스 패턴 | 예시 |
|-------|-------------|------|
| **Tailwind v4** | `--color-`, `--font-` | `--color-primary-500` |
| **Radix UI** | 없음 | `--red-9`, `--blue-1` |
| **shadcn/ui** | 없음 (시맨틱명) | `--primary`, `--background` |
| **Chakra UI** | `--chakra-` | `--chakra-colors-red-200` |
| **Material Design 3** | `--md-sys-`, `--md-ref-` | `--md-sys-color-primary` |

**권장 프리픽스 전략:**
```css
/* 디자인 시스템 프리픽스 */
--ds-color-primary: oklch(0.65 0.15 240);

/* 브랜드/프로젝트 프리픽스 */
--brand-accent: oklch(0.70 0.20 300);

/* 컴포넌트 스코프 프리픽스 (내부용) */
.button {
  --_bg: var(--ds-color-primary);
  --_text: var(--ds-color-on-primary);
}
```

#### 스케일 네이밍 비교

| 시스템 | 스케일 | 이유 |
|-------|-------|------|
| **Tailwind CSS** | 50-950 | 업계 표준, 중간값 삽입 가능 |
| **Radix UI** | 1-12 | 각 스텝별 명확한 용도 |
| **Material Design** | 0-100 | 톤 값 (0=검정, 100=흰색) |

**권장**: 색상은 **50-950** (Tailwind 호환), 타이포그래피/스페이싱은 **네이밍 사이즈** (xs, sm, md, lg, xl)

#### 자기 문서화 네이밍

```css
/* ✅ 좋음: 목적 기반 */
--color-error: oklch(0.58 0.25 27);
--color-success: oklch(0.72 0.19 150);
--spacing-card-padding: 1.5rem;

/* ❌ 피함: 값 기반 */
--color-red-500: oklch(0.58 0.25 27);  /* 왜 이 빨강을 쓰나? */
--spacing-24: 1.5rem;
```

---

### 2.4 다크 모드 토큰 전환

#### CSS 전용 다크 모드

```css
/* 기본 라이트 테마 */
:root {
  --bg-color: oklch(1 0 0);
  --text-color: oklch(0.15 0 0);
}

/* 시스템 설정 감지 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: oklch(0.12 0 0);
    --text-color: oklch(0.95 0 0);
  }
}
```

#### JavaScript 제어 테마 전환 (next-themes)

**프로덕션 표준 패턴 - shadcn/ui에서 사용:**

```tsx
// components/theme-provider.tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

#### 토큰 오버라이드 전략

```css
:root {
  /* 프리미티브 토큰 */
  --blue-500: oklch(0.62 0.21 240);
  --gray-50: oklch(0.98 0 0);
  --gray-900: oklch(0.15 0 0);
  
  /* 시맨틱 토큰 - 프리미티브 참조 */
  --color-primary: var(--blue-500);
  --bg-page: var(--gray-50);
  --text-primary: var(--gray-900);
}

.dark {
  /* 다크 모드에서 시맨틱 토큰 재매핑 */
  --bg-page: var(--gray-900);
  --text-primary: var(--gray-50);
  --color-primary: oklch(0.75 0.12 240); /* 어두운 배경용 조정 */
}
```

#### 색상 반전 문제 방지

1. **단순 반전 금지** - 다크 모드는 흑↔백 스왑이 아님
2. **오프화이트/오프블랙 사용** - 배경 `#121212` 권장 (순수 검정 아님)
3. **이미지 밝기 조절**:
```css
body.dark-theme img {
  filter: brightness(.8) contrast(1.2);
}
```
4. **깊이 계층 유지** - 다크 모드에서도 가까운 요소가 더 밝아야 함
5. **채도 낮추기** - 어두운 배경에서 고채도 색상은 거슬림

#### SSR에서 FOUC(잘못된 테마 깜빡임) 방지

**문제**: SSR은 localStorage(클라이언트 전용)에 접근 불가, hydration 전 잘못된 테마 표시

**해결책 1: 블로킹 스크립트 삽입 (Josh Comeau 패턴)**
```tsx
// _document.tsx 또는 layout.tsx
const MagicScriptTag = () => {
  const codeToRunOnClient = `
(function() {
  function getInitialColorMode() {
    const persistedPreference = window.localStorage.getItem('color-mode');
    if (typeof persistedPreference === 'string') {
      return persistedPreference;
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    return mql.matches ? 'dark' : 'light';
  }
  const colorMode = getInitialColorMode();
  document.documentElement.classList.add(colorMode);
})()`;

  return <script dangerouslySetInnerHTML={{ __html: codeToRunOnClient }} />;
};
```

**해결책 2: next-themes 사용 (자동 처리)**
```tsx
<html suppressHydrationWarning>
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
  </ThemeProvider>
</html>
```

**해결책 3: 쿠키 기반 SSR**
```tsx
// app/layout.tsx (Next.js App Router)
import { cookies } from 'next/headers';

export default function RootLayout({ children }) {
  const theme = cookies().get('theme')?.value || 'light';
  
  return (
    <html className={theme === 'dark' ? 'dark' : ''}>
      <body>{children}</body>
    </html>
  );
}
```

#### 테마 전환 애니메이션

```css
/* 기본 전환 */
body {
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 초기 로드 시 전환 비활성화 (깜빡임 방지) */
.disable-transitions * {
  transition: none !important;
}
```

**View Transitions API (2025년 모던 접근법):**
```tsx
import { flushSync } from 'react-dom';

const toggleDarkMode = (isDarkMode) => {
  document.startViewTransition(() => {
    flushSync(() => {
      setIsDarkMode(isDarkMode);
    });
  });
};
```

---

### 2.5 Tailwind CSS v4 통합

#### CSS-First 설정 방식

Tailwind v4는 `tailwind.config.js`에서 **CSS-first 설정**으로 패러다임 전환:

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.65 0.15 240);
  --color-secondary: oklch(0.70 0.12 180);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 1920px;
}
```

**핵심 장점:**
- 설정 파일 불필요 (제로 설정)
- 자동 템플릿 파일 감지
- **5배 빠른 전체 빌드, 100배 빠른 증분 빌드** (Oxide 엔진)

#### @theme 디렉티브 사용법

```css
@import "tailwindcss";

@theme {
  /* 색상 - bg-mint-500, text-mint-500 등 생성 */
  --color-mint-500: oklch(0.72 0.11 178);
  
  /* 폰트 - font-poppins 생성 */
  --font-poppins: Poppins, sans-serif;
  
  /* 브레이크포인트 - 3xl:* 변형 생성 */
  --breakpoint-3xl: 120rem;
  
  /* 스페이싱 - 모든 스페이싱 유틸리티에 영향 */
  --spacing: 0.25rem;
}
```

**@theme vs :root:**
- **`@theme`**: 유틸리티 클래스 생성 원할 때
- **`:root`**: 일반 CSS 변수 (유틸리티 클래스 생성 안 함)

**`@theme inline`** - 다른 변수 참조 시:
```css
@theme inline {
  --color-primary: var(--primary);
}
```
`font-family: var(--primary);`로 출력되어 CSS 변수 해석 문제 방지

#### 테마 변수 네임스페이스

| 네임스페이스 | 유틸리티 클래스 |
|------------|----------------|
| `--color-*` | `bg-*`, `text-*`, `border-*` 등 |
| `--font-*` | `font-*` (font-family) |
| `--text-*` | `text-*` (font-size) |
| `--spacing-*` | `px-*`, `mt-*`, `w-*`, `h-*` 등 |
| `--radius-*` | `rounded-*` |
| `--shadow-*` | `shadow-*` |
| `--breakpoint-*` | `sm:*`, `md:*` 변형 |

#### OKLCH 색상 팔레트 생성

```css
@theme {
  --color-brand-50: oklch(0.97 0.02 240);
  --color-brand-100: oklch(0.93 0.04 240);
  --color-brand-200: oklch(0.88 0.06 240);
  --color-brand-300: oklch(0.81 0.11 240);
  --color-brand-400: oklch(0.71 0.17 240);
  --color-brand-500: oklch(0.62 0.21 240);
  --color-brand-600: oklch(0.55 0.25 240);
  --color-brand-700: oklch(0.49 0.24 240);
  --color-brand-800: oklch(0.42 0.20 240);
  --color-brand-900: oklch(0.38 0.15 240);
  --color-brand-950: oklch(0.28 0.09 240);
}
```

#### shadcn/ui Tailwind v4 통합

```css
@import "tailwindcss";
@import "tw-animate-css";

/* 커스텀 다크 모드 변형 */
@custom-variant dark (&:is(.dark *));

/* 라이트 테마 변수 */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  /* ... 다크 모드 값 */
}

/* Tailwind 유틸리티에 매핑 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

#### Turborepo 모노레포 구조

```
yiroom/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── globals.css
│       │   └── layout.tsx
│       └── postcss.config.js
├── packages/
│   ├── tailwind-config/
│   │   ├── package.json
│   │   ├── shared-styles.css
│   │   └── postcss.config.js
│   ├── design-system/
│   │   └── src/styles.css
│   └── ui/
│       ├── src/
│       │   ├── components/
│       │   └── styles.css
│       └── package.json
└── turbo.json
```

**공유 Tailwind 설정 패키지:**
```json
// packages/tailwind-config/package.json
{
  "name": "@yiroom/tailwind-config",
  "exports": {
    ".": "./shared-styles.css",
    "./postcss": "./postcss.config.js"
  }
}
```

```css
/* packages/tailwind-config/shared-styles.css */
@import "tailwindcss";

@theme {
  /* 브랜드 색상 */
  --color-brand-primary: oklch(0.65 0.15 240);
  --color-brand-secondary: oklch(0.70 0.12 180);
  
  /* 시맨틱 색상 */
  --color-success: oklch(0.72 0.19 150);
  --color-warning: oklch(0.84 0.16 84);
  --color-error: oklch(0.58 0.25 27);
  
  /* 타이포그래피 */
  --font-sans: "Pretendard", system-ui, sans-serif;
}
```

**앱 통합:**
```css
/* apps/web/app/globals.css */
@import "tailwindcss";
@import "@yiroom/tailwind-config";

/* 앱별 커스터마이징 */
@theme {
  --color-accent: oklch(0.70 0.20 300);
}
```

---

## 3. 구현 체크리스트 (Implementation Checklist)

### 색상 시스템 기반
- [ ] OKLCH를 기본 색상 공간으로 채택
- [ ] 레거시 브라우저용 RGB 폴백 전략 구현
- [ ] postcss-preset-env로 자동 변환 설정
- [ ] P3 와이드 가뭇 색상 `@media (color-gamut: p3)` 조건부 적용

### 토큰 계층 구조
- [ ] 프리미티브 토큰 정의 (50-950 스케일)
- [ ] 시맨틱 토큰 정의 (primary, secondary, error, warning, success, muted)
- [ ] 모든 배경색에 대응하는 foreground 토큰 쌍 생성
- [ ] 인터랙티브 상태 토큰 정의 (hover, active, focus, disabled)
- [ ] Surface 계층 토큰 정의 (최소 3-5단계)

### CSS 변수 네이밍
- [ ] kebab-case 사용 확정
- [ ] 프리픽스 전략 결정 (`--ds-` 또는 프리픽스 없음)
- [ ] 시맨틱 네이밍 가이드라인 문서화
- [ ] 컴포넌트 스코프 변수 컨벤션 (`--_` 프리픽스) 정의

### 다크 모드 구현
- [ ] next-themes 설치 및 ThemeProvider 설정
- [ ] `suppressHydrationWarning` 적용
- [ ] 다크 모드 토큰 값 정의 (.dark 클래스)
- [ ] FOUC 방지 검증
- [ ] 테마 전환 애니메이션 적용 (선택)
- [ ] 시스템 설정 감지 (`enableSystem`) 활성화

### Tailwind CSS v4 통합
- [ ] CSS-first 설정으로 마이그레이션
- [ ] `@theme` 디렉티브로 커스텀 색상 정의
- [ ] `@theme inline`으로 CSS 변수 참조 설정
- [ ] `@custom-variant dark` 설정
- [ ] shadcn/ui 색상 토큰 통합

### 모노레포 설정
- [ ] `@yiroom/tailwind-config` 공유 패키지 생성
- [ ] `@yiroom/ui` 컴포넌트 패키지 설정
- [ ] 앱에서 공유 스타일 import
- [ ] Turborepo 태스크 의존성 설정

### 품질 보증
- [ ] stylelint-gamut으로 가뭇 외 색상 검출
- [ ] WCAG 대비비 검증 (sRGB 변환 후)
- [ ] 크로스 브라우저 테스트 (Safari 15.4+, Chrome 111+, Firefox 113+)
- [ ] 라이트/다크 모드 전환 시 접근성 유지 확인

---

## 4. 코드 예시 (Code Examples)

### 4.1 완전한 OKLCH 색상 토큰 시스템

```css
/* packages/design-system/src/tokens/colors.css */
@import "tailwindcss";

/* ===== 프리미티브 토큰 (Primitive Tokens) ===== */
@layer base {
  :root {
    /* Brand Colors - Personal Color Analysis Theme */
    --brand-spring-50: oklch(0.98 0.02 120);
    --brand-spring-100: oklch(0.95 0.05 120);
    --brand-spring-500: oklch(0.70 0.18 120);
    --brand-spring-900: oklch(0.30 0.10 120);

    --brand-summer-50: oklch(0.98 0.02 240);
    --brand-summer-100: oklch(0.95 0.04 240);
    --brand-summer-500: oklch(0.65 0.15 240);
    --brand-summer-900: oklch(0.28 0.12 240);

    --brand-autumn-50: oklch(0.98 0.03 60);
    --brand-autumn-100: oklch(0.94 0.06 60);
    --brand-autumn-500: oklch(0.65 0.16 60);
    --brand-autumn-900: oklch(0.30 0.10 60);

    --brand-winter-50: oklch(0.98 0.01 300);
    --brand-winter-100: oklch(0.94 0.03 300);
    --brand-winter-500: oklch(0.55 0.20 300);
    --brand-winter-900: oklch(0.25 0.15 300);

    /* Neutral Scale */
    --neutral-50: oklch(0.985 0 0);
    --neutral-100: oklch(0.967 0.001 286);
    --neutral-200: oklch(0.928 0.003 286);
    --neutral-300: oklch(0.869 0.005 286);
    --neutral-400: oklch(0.708 0.010 286);
    --neutral-500: oklch(0.556 0.013 286);
    --neutral-600: oklch(0.446 0.014 286);
    --neutral-700: oklch(0.373 0.013 286);
    --neutral-800: oklch(0.279 0.010 286);
    --neutral-900: oklch(0.208 0.006 286);
    --neutral-950: oklch(0.145 0.004 286);
  }
}

/* ===== 시맨틱 토큰 (Semantic Tokens) ===== */
@layer base {
  :root {
    /* Background/Surface */
    --background: var(--neutral-50);
    --foreground: var(--neutral-950);
    
    --card: oklch(1 0 0);
    --card-foreground: var(--neutral-950);
    
    --popover: oklch(1 0 0);
    --popover-foreground: var(--neutral-950);
    
    /* Surfaces (elevation) */
    --surface-1: var(--neutral-50);
    --surface-2: var(--neutral-100);
    --surface-3: var(--neutral-200);
    
    /* Primary - Default to Summer palette */
    --primary: var(--brand-summer-500);
    --primary-foreground: oklch(0.985 0 0);
    --primary-hover: oklch(0.58 0.17 240);
    --primary-active: oklch(0.52 0.19 240);
    
    /* Secondary */
    --secondary: var(--neutral-200);
    --secondary-foreground: var(--neutral-900);
    --secondary-hover: var(--neutral-300);
    
    /* Muted */
    --muted: var(--neutral-100);
    --muted-foreground: var(--neutral-500);
    
    /* Accent */
    --accent: var(--neutral-100);
    --accent-foreground: var(--neutral-900);
    
    /* Destructive/Error */
    --destructive: oklch(0.577 0.245 27);
    --destructive-foreground: oklch(0.985 0 0);
    --destructive-hover: oklch(0.52 0.26 27);
    
    /* Warning */
    --warning: oklch(0.84 0.16 84);
    --warning-foreground: oklch(0.28 0.07 46);
    
    /* Success */
    --success: oklch(0.72 0.19 150);
    --success-foreground: oklch(0.985 0 0);
    
    /* Info */
    --info: oklch(0.70 0.15 240);
    --info-foreground: oklch(0.985 0 0);
    
    /* Border & Input */
    --border: var(--neutral-200);
    --border-hover: var(--neutral-300);
    --input: var(--neutral-200);
    --ring: var(--primary);
    
    /* Radius */
    --radius: 0.625rem;
  }

  /* ===== 다크 모드 토큰 (Dark Mode Tokens) ===== */
  .dark {
    --background: var(--neutral-950);
    --foreground: var(--neutral-50);
    
    --card: var(--neutral-900);
    --card-foreground: var(--neutral-50);
    
    --popover: var(--neutral-900);
    --popover-foreground: var(--neutral-50);
    
    --surface-1: var(--neutral-950);
    --surface-2: var(--neutral-900);
    --surface-3: var(--neutral-800);
    
    --primary: oklch(0.75 0.12 240);
    --primary-foreground: var(--neutral-950);
    --primary-hover: oklch(0.80 0.10 240);
    --primary-active: oklch(0.70 0.14 240);
    
    --secondary: var(--neutral-800);
    --secondary-foreground: var(--neutral-100);
    --secondary-hover: var(--neutral-700);
    
    --muted: var(--neutral-800);
    --muted-foreground: var(--neutral-400);
    
    --accent: var(--neutral-800);
    --accent-foreground: var(--neutral-100);
    
    --destructive: oklch(0.65 0.22 27);
    --destructive-foreground: var(--neutral-950);
    
    --warning: oklch(0.75 0.14 84);
    --warning-foreground: var(--neutral-950);
    
    --success: oklch(0.78 0.16 150);
    --success-foreground: var(--neutral-950);
    
    --border: var(--neutral-800);
    --border-hover: var(--neutral-700);
    --input: var(--neutral-800);
  }
}

/* ===== Tailwind v4 @theme 매핑 ===== */
@theme inline {
  /* Core Colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  
  /* Card & Popover */
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  
  /* Surfaces */
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  
  /* Primary */
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  
  /* Secondary */
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary-hover: var(--secondary-hover);
  
  /* Muted */
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  
  /* Accent */
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  
  /* Status Colors */
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  
  /* Border & Input */
  --color-border: var(--border);
  --color-border-hover: var(--border-hover);
  --color-input: var(--input);
  --color-ring: var(--ring);
  
  /* Radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-full: 9999px;
}

/* ===== 다크 모드 변형 정의 ===== */
@custom-variant dark (&:is(.dark *));
```

### 4.2 TypeScript 타입 정의

```typescript
// packages/design-system/src/types/tokens.ts

/**
 * 색상 토큰 타입 정의
 */
export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export interface PersonalColorPalette {
  spring: Record<ColorScale, string>;
  summer: Record<ColorScale, string>;
  autumn: Record<ColorScale, string>;
  winter: Record<ColorScale, string>;
}

export interface SemanticColors {
  // Background/Surface
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Primary
  primary: string;
  primaryForeground: string;
  primaryHover: string;
  primaryActive: string;
  
  // Secondary
  secondary: string;
  secondaryForeground: string;
  
  // Muted
  muted: string;
  mutedForeground: string;
  
  // Accent
  accent: string;
  accentForeground: string;
  
  // Status
  destructive: string;
  destructiveForeground: string;
  warning: string;
  warningForeground: string;
  success: string;
  successForeground: string;
  info: string;
  infoForeground: string;
  
  // Border & Input
  border: string;
  input: string;
  ring: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  personalColor?: 'spring' | 'summer' | 'autumn' | 'winter';
}
```

### 4.3 ThemeProvider 구현

```tsx
// packages/ui/src/providers/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

interface YiroomThemeProviderProps extends ThemeProviderProps {
  personalColor?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export function ThemeProvider({
  children,
  personalColor = 'summer',
  ...props
}: YiroomThemeProviderProps) {
  React.useEffect(() => {
    // Personal Color 클래스 적용
    document.documentElement.setAttribute('data-personal-color', personalColor);
  }, [personalColor]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

export { useTheme } from "next-themes";
```

### 4.4 모드 토글 컴포넌트

```tsx
// packages/ui/src/components/mode-toggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 변경</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          라이트
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          다크
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          시스템
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4.5 Personal Color 선택 컴포넌트

```tsx
// packages/ui/src/components/personal-color-selector.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type PersonalColorType = 'spring' | 'summer' | 'autumn' | 'winter';

interface PersonalColorOption {
  value: PersonalColorType;
  label: string;
  labelKo: string;
  colors: string[];
}

const personalColorOptions: PersonalColorOption[] = [
  {
    value: 'spring',
    label: 'Spring',
    labelKo: '봄 웜톤',
    colors: [
      'oklch(0.85 0.15 100)',
      'oklch(0.70 0.18 120)',
      'oklch(0.75 0.12 80)',
    ],
  },
  {
    value: 'summer',
    label: 'Summer',
    labelKo: '여름 쿨톤',
    colors: [
      'oklch(0.80 0.10 280)',
      'oklch(0.65 0.15 240)',
      'oklch(0.75 0.08 200)',
    ],
  },
  {
    value: 'autumn',
    label: 'Autumn',
    labelKo: '가을 웜톤',
    colors: [
      'oklch(0.70 0.14 60)',
      'oklch(0.60 0.16 40)',
      'oklch(0.55 0.12 80)',
    ],
  },
  {
    value: 'winter',
    label: 'Winter',
    labelKo: '겨울 쿨톤',
    colors: [
      'oklch(0.50 0.22 300)',
      'oklch(0.45 0.25 340)',
      'oklch(0.60 0.20 260)',
    ],
  },
];

interface PersonalColorSelectorProps {
  value: PersonalColorType;
  onChange: (value: PersonalColorType) => void;
  className?: string;
}

export function PersonalColorSelector({
  value,
  onChange,
  className,
}: PersonalColorSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {personalColorOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
            "hover:border-primary/50 hover:bg-accent",
            value === option.value
              ? "border-primary bg-accent"
              : "border-border"
          )}
        >
          <div className="flex gap-1">
            {option.colors.map((color, index) => (
              <div
                key={index}
                className="h-8 w-8 rounded-full shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">{option.labelKo}</p>
            <p className="text-xs text-muted-foreground">{option.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
```

### 4.6 Root Layout 설정

```tsx
// apps/web/app/layout.tsx
import type { Metadata } from "next";
import { Pretendard } from "@/lib/fonts";
import { ThemeProvider } from "@yiroom/ui/providers/theme-provider";
import "@yiroom/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "이룸 (Yiroom) - 나를 이해하는 첫 걸음",
  description: "퍼스널 컬러 분석 기반 맞춤형 뷰티, 패션, 피트니스, 영양 추천 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={Pretendard.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4.7 공유 Tailwind 설정 패키지

```json
// packages/tailwind-config/package.json
{
  "name": "@yiroom/tailwind-config",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./shared-styles.css",
    "./postcss": "./postcss.config.js"
  },
  "devDependencies": {
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.5",
    "tw-animate-css": "^1.2.0"
  }
}
```

```javascript
// packages/tailwind-config/postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
  },
};
```

---

## 5. 참고 자료 (Reference Sources)

### 색상 공간 & OKLCH
- [OKLCH Color Picker - Evil Martians](https://oklch.com/)
- [MDN - OKLCH Color Function](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch)
- [Can I Use - OKLCH](https://caniuse.com/mdn-css_types_color_oklch)
- [Color.js - CSS Color Spec Library](https://colorjs.io/)
- [Huetone - OKLCH Palette Generator](https://huetone.ardov.me/)

### 디자인 시스템 & 토큰
- [Material Design 3 Color System](https://m3.material.io/styles/color/overview)
- [Radix UI Colors](https://www.radix-ui.com/colors)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [Open Props](https://open-props.style/)
- [Chakra UI Design Tokens](https://chakra-ui.com/docs/styled-system/semantic-tokens)

### Tailwind CSS v4
- [Tailwind CSS v4 Theme Documentation](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)

### 다크 모드 & 테마
- [next-themes GitHub](https://github.com/pacocoursey/next-themes)
- [Josh Comeau - The Quest for the Perfect Dark Mode](https://www.joshwcomeau.com/react/dark-mode/)
- [CSS-Tricks - A Complete Guide to Dark Mode](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/)

### 모노레포 설정
- [Turborepo - Tailwind CSS Guide](https://turborepo.com/docs/guides/tools/tailwindcss)
- [Turborepo - UI Library Guide](https://turborepo.com/docs/guides/tools/storybook)

### 접근성 도구
- [OddContrast - OKLCH Contrast Checker](https://www.oddcontrast.com/)
- [APCA Contrast Calculator](https://www.myndex.com/APCA/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)