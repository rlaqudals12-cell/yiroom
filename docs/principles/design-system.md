# 디자인 시스템 원리

> 이 문서는 이룸 플랫폼의 디자인 시스템 기반 원리를 설명한다.
>
> **소스 리서치**: INF-1-R1, INF-2-R1, INF-3-R1, INF-4-R1

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"완벽한 일관성의 디자인 시스템"

- 100% 토큰화: 모든 시각적 속성이 디자인 토큰으로 관리됨
- 지각적 균일성: OKLCH 기반 색상으로 모든 컬러 팔레트가 지각적으로 일관됨
- 완벽한 다크 모드: 라이트/다크 테마 전환 시 가독성과 미관 모두 유지
- 무결함 반응형: 모든 뷰포트에서 완벽한 레이아웃과 타이포그래피
- Atomic Design 완성: Primitives → Patterns → Blocks → Templates 계층 완벽 구현
- 접근성 내장: WCAG 2.1 AA 기준 모든 컴포넌트 자동 준수
- Design-Dev 동기화: Figma 토큰과 코드 토큰 100% 일치
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| **브라우저 지원** | OKLCH 미지원 브라우저 (7%) 존재 → 폴백 필수 |
| **P3 색역** | sRGB 모니터에서 P3 색상 정확 재현 불가 |
| **Figma 동기화** | 수동 동기화 필요, 자동화 도구 제한적 |
| **성능 트레이드오프** | 과도한 CSS 변수 사용 시 성능 영향 |
| **브랜드 일관성** | 외부 임베드/위젯에서 일관성 유지 어려움 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| **토큰 커버리지** | 색상/타이포/스페이싱/반경/그림자 100% 토큰화 |
| **OKLCH 전환율** | 모든 색상 정의가 OKLCH 기반 |
| **다크 모드 완성도** | 모든 컴포넌트 다크 모드 대응 |
| **컴포넌트 라이브러리** | 50개 이상 재사용 컴포넌트 |
| **CVA 패턴 적용** | 모든 가변 컴포넌트 CVA 사용 |
| **Atomic Design 준수** | 4계층 (Primitives/Patterns/Blocks/Templates) 완벽 분리 |
| **Figma-Code 동기화** | 토큰 불일치 0건 |
| **접근성 자동화** | 모든 컴포넌트 WCAG AA 자동 검증 |
| **문서화** | 모든 컴포넌트 Storybook 문서 완비 |

### 현재 목표

**85%** - MVP 디자인 시스템

- ✅ OKLCH 기반 색상 시스템
- ✅ 3계층 토큰 구조 (Primitive → Semantic → Component)
- ✅ 다크 모드 기본 지원
- ✅ shadcn/ui 기반 컴포넌트 라이브러리
- ✅ Tailwind v4 @theme 통합
- ✅ CVA 패턴 적용 (주요 컴포넌트)
- ✅ YIROOM IDENTITY v3 (민트 → 블랙 그라디언트)
- ⏳ Atomic Design 완전 분리 (70%)
- ⏳ Figma-Code 동기화 (60%)
- ⏳ Storybook 문서화 (50%)

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| Design Token 자동 동기화 | Figma API 비용, 복잡도 | Phase 3 |
| 모션 디자인 시스템 | 우선순위 낮음 | Phase 4 |
| 브랜드 가이드 완전 문서화 | MVP 범위 외 | Phase 2 |
| 컴포넌트 성능 벤치마킹 | MVP 후 최적화 | Phase 3 |

---

## 1. 색상 공간 원리

### 1.1 OKLCH vs HSL vs RGB

**핵심 원리**: OKLCH는 **지각적 균일성(Perceptual Uniformity)**을 가진 색상 공간이다.

| 색상 공간 | 표현 방식 | 색역(Gamut) | 특징 |
|----------|----------|-------------|------|
| **RGB** | `rgb(109 162 218)` | sRGB (~35% 가시광) | 기기 의존적, 직관적 조작 불가 |
| **HSL** | `hsl(210 60% 64%)` | sRGB | 인간 친화적이나 비지각적 |
| **OKLCH** | `oklch(0.7 0.14 240)` | P3, Rec2020 지원 | 지각적 균일성, 와이드 가뭇 |

### 1.2 OKLCH 구성 요소

```
L (Lightness): 0-1 → 지각적 밝기
C (Chroma):    0 ~ 0.37 → 채도/선명도
H (Hue):       0-360° → 색상각
```

**Hue 참조값**: 빨강 ~20°, 노랑 ~90°, 초록 ~140°, 파랑 ~240°

### 1.3 지각적 균일성의 중요성

**문제**: HSL에서 동일한 L값(50%)이라도 파랑과 노랑의 밝기가 다르게 보임.

```css
/* HSL: 파랑과 노랑이 다른 밝기로 보임 */
.hsl-blue { color: hsl(240 100% 50%); }
.hsl-yellow { color: hsl(60 100% 50%); }

/* OKLCH: 동일한 L = 동일한 지각적 밝기 */
.oklch-blue { color: oklch(0.7 0.15 240); }
.oklch-yellow { color: oklch(0.7 0.15 90); }
```

**결과**: OKLCH는 hover 상태에서 10% 밝기 증가 시 **모든 색상에서 일관된 시각적 결과** 제공.

### 1.4 브라우저 지원 (2025년)

| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome | 111+ (2023년 3월~) |
| Firefox | 113+ (2023년 5월~) |
| Safari | 15.4+ (2022년 3월~) |
| Edge | 111+ |

**전역 지원율**: 92.87%

### 1.5 폴백 전략

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

---

## 2. 토큰 아키텍처

### 2.1 3계층 토큰 구조

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

### 2.2 시맨틱 컬러 카테고리

| 카테고리 | 용도 | 토큰명 |
|---------|------|--------|
| **Primary** | 주요 브랜드/액션 | `--primary` |
| **Secondary** | 보조 액션 | `--secondary` |
| **Destructive** | 에러, 삭제 | `--destructive` |
| **Warning** | 경고 상태 | `--warning` |
| **Success** | 성공 상태 | `--success` |
| **Muted** | 비활성/보조 | `--muted` |

### 2.3 Background/Foreground 패턴

**핵심 원리**: 모든 배경색에는 대응하는 전경색이 필요하다.

| 배경 토큰 | 텍스트 토큰 |
|----------|-----------|
| `--primary` | `--primary-foreground` |
| `--secondary` | `--secondary-foreground` |
| `--destructive` | `--destructive-foreground` |
| `--muted` | `--muted-foreground` |

### 2.4 인터랙티브 상태 토큰

| 상태 | 설명 | 패턴 |
|------|------|------|
| **Default** | 기본 상태 | 베이스 컬러 |
| **Hover** | 마우스 오버 | 반 스텝 어둡게/밝게 |
| **Active** | 클릭/탭 | 두 스텝 변경 |
| **Focus** | 키보드 포커스 | 포커스 링 |
| **Disabled** | 비활성 | 투명도 감소 |

### 2.5 CSS 변수 네이밍

**표준**: kebab-case

```css
/* 좋음: 목적 기반 */
--color-error: oklch(0.58 0.25 27);
--spacing-card-padding: 1.5rem;

/* 피함: 값 기반 */
--color-red-500: oklch(0.58 0.25 27);
--spacing-24: 1.5rem;
```

---

## 3. 다크 모드 원리

### 3.1 next-themes 패턴

```tsx
// components/theme-provider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// app/layout.tsx
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
```

### 3.2 토큰 오버라이드

```css
:root {
  /* 시맨틱 토큰 - 라이트 모드 */
  --bg-page: var(--gray-50);
  --text-primary: var(--gray-900);
}

.dark {
  /* 다크 모드에서 시맨틱 토큰 재매핑 */
  --bg-page: var(--gray-900);
  --text-primary: var(--gray-50);
}
```

### 3.3 색상 반전 문제 방지

1. **단순 반전 금지**: 다크 모드는 흑↔백 스왑이 아님
2. **오프화이트/오프블랙 사용**: 배경 `#121212` 권장
3. **깊이 계층 유지**: 다크 모드에서도 가까운 요소가 더 밝아야 함
4. **채도 낮추기**: 어두운 배경에서 고채도 색상은 거슬림

### 3.4 FOUC 방지

**문제**: SSR은 localStorage에 접근 불가 → hydration 전 잘못된 테마 표시

**해결**: `suppressHydrationWarning` + next-themes 자동 처리

---

## 4. Tailwind v4 통합

### 4.1 CSS-First 설정

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.65 0.15 240);
  --color-secondary: oklch(0.70 0.12 180);
  --font-display: "Satoshi", sans-serif;
}
```

### 4.2 @theme vs :root

| 사용 | 용도 |
|------|------|
| **@theme** | 유틸리티 클래스 생성 (bg-*, text-* 등) |
| **:root** | 일반 CSS 변수 (유틸리티 클래스 생성 안 함) |

### 4.3 @theme 네임스페이스

| 네임스페이스 | 유틸리티 클래스 |
|------------|----------------|
| `--color-*` | `bg-*`, `text-*`, `border-*` |
| `--font-*` | `font-*` (font-family) |
| `--spacing-*` | `px-*`, `mt-*`, `w-*`, `h-*` |
| `--radius-*` | `rounded-*` |

### 4.4 다크 모드 변형

```css
@custom-variant dark (&:is(.dark *));
```

---

## 5. 온보딩 UX 원리

### 5.1 5단계 임계점

**핵심 원리**: 5단계 초과 온보딩에서 **50% 이상 사용자가 이탈**한다.

| 단계 수 | 완료율 | 권장 여부 |
|---------|--------|-----------|
| 2-4단계 | ~50% | 최적 |
| 5단계 | 임계점 | 최대치 |
| 5단계+ | 50%+ 이탈 | 피해야 함 |

### 5.2 프로그레스 바 효과

**제이가르닉 효과(Zeigarnik Effect)**: 미완료 작업에 대한 기억이 강화되고 완료 욕구가 증가.

- 프로그레스 바 추가 → **완료율 22% 상승**
- **부여된 진행(Endowed Progress)**: 시작 시 10-20% 미리 채워 표시

### 5.3 문맥적 권한 요청

**핵심 원리**: 가치 제공 후 권한 요청 시 승인율이 **78-88%**까지 상승.

| 시점 | 승인율 |
|------|--------|
| 앱 시작 직후 | 50-60% |
| 가치 제공 후 | **78-88%** |

**프리-퍼미션 화면 필수 요소**:
```
📸 카메라가 필요한 이유:
• 정확한 피부색 측정
• 실시간 조명 보정
• 분석 후 이미지는 즉시 삭제됩니다
```

### 5.4 TTFV (Time to First Value)

**핵심 원리**: 사용자가 "아하!" 순간을 경험하기까지의 시간을 최소화.

| 앱 | TTFV |
|----|------|
| Instagram | 30초 이내 |
| Duolingo | 1분 이내 |
| **Yiroom 목표** | **2분 이내** |

**권장 플로우**: 셀카 → 즉시 기본 결과 → 결과 저장을 위해 가입

### 5.5 점진적 프로파일링

| 단계 | 수집 정보 | 시점 |
|-----|----------|-----|
| 1단계 | 소셜 로그인 | 결과 저장 시 |
| 2단계 | 피부 고민 (선택) | 첫 분석 완료 후 |
| 3단계 | 얼굴 이미지 | 분석 기능 사용 시 |
| 4단계 | 손목/추가 이미지 | 정밀 분석 요청 시 |

---

## 6. AI Fallback 전략

### 6.1 계층적 Fallback 체계

```
[AI 분석 요청]
     │
     ▼
[1. 캐시 확인] ──있음──► [캐시 결과 반환]
     │
     ▼ 없음
[2. Primary AI (Gemini)] ──성공──► [결과 반환 + 캐시 저장]
     │
     ▼ 실패/타임아웃
[3. Retry with Jitter] (최대 3회)
     │
     ▼ 실패
[4. Secondary AI] (OpenAI/Claude)
     │
     ▼ 실패
[5. Mock 데이터] + "예상 결과" 표시
```

### 6.2 Exponential Backoff with Jitter

```
delay = min(baseDelay * 2^attempt, maxDelay) * random(0, 1)
```

| 파라미터 | 권장값 |
|----------|--------|
| maxRetries | 3회 |
| baseDelay | 1000ms |
| maxDelay | 10000ms |

### 6.3 Circuit Breaker 패턴

| 상태 | 동작 |
|------|------|
| **Closed** (정상) | 모든 요청 통과, 실패율 모니터링 |
| **Open** (차단) | 즉시 Fallback 반환 |
| **Half-Open** (테스트) | 제한된 요청만 허용 |

**권장 임계값**:

| 파라미터 | 권장값 |
|----------|--------|
| timeout | 60초 |
| errorThresholdPercentage | 30% |
| resetTimeout | 60초 |
| volumeThreshold | 3개 |

### 6.4 Mock 데이터 생성 규칙

**한국인 퍼스널 컬러 분포** (잼페이스 2022년 기반):

| 유형 | 비율 |
|------|------|
| 가을 웜 트루 | **22.8%** |
| 여름 쿨 트루 | 18.4% |
| 봄 웜 트루 | 18.2% |
| 겨울 쿨 트루 | 10.4% |

**Mock 식별 필드**:
```typescript
{
  isMock: true,
  dataSource: 'fallback_mock',
  confidence: 0.0,  // 0.0 = Mock, 0.7-1.0 = 정상 AI
}
```

### 6.5 Fallback 알림 UX

| Source | UI 표시 |
|--------|---------|
| `ai` (fresh) | 없음 |
| `cache` | "이전 분석 결과" |
| `mock` | "예상 결과" 배지 + 재분석 버튼 |

### 6.6 모니터링 임계값

| Fallback 비율 | 상태 | 대응 |
|--------------|------|------|
| < 1% | 정상 | 모니터링 유지 |
| 1-5% | 경고 | 원인 조사 |
| **5-10%** | 주의 | **Slack 알림** |
| **10-20%** | 심각 | **즉시 대응** |
| > 20% | 위기 | PagerDuty 에스컬레이션 |

---

## 7. 모노레포 공유 원리

### 7.1 packages/shared 구조

```
packages/shared/
├── src/
│   ├── types/           # 도메인 타입 정의
│   │   ├── domain/      # User, Beauty, Booking
│   │   ├── api/         # Request/Response
│   │   └── common/      # Pagination, Error
│   ├── utils/           # 유틸리티 함수
│   ├── constants/       # 상수 및 Enum
│   └── schemas/         # Zod 스키마
└── package.json
```

### 7.2 Granular Exports (Barrel 금지)

**문제**: Barrel files(`index.ts`)가 번들러 성능 저하.

**해결**: package.json의 `exports` 필드 활용.

```json
{
  "exports": {
    "./types/user": "./src/types/domain/user.ts",
    "./types/beauty": "./src/types/domain/beauty.ts",
    "./schemas/*": "./src/schemas/*.ts"
  }
}
```

### 7.3 Just-in-Time 패키지 전략

**핵심 원리**: `build` 스크립트 없이 번들러(Webpack/Metro)가 직접 TypeScript 컴파일.

```json
{
  "name": "@yiroom/shared",
  "version": "0.0.0",
  "private": true,
  "sideEffects": false
}
```

### 7.4 Zod 스키마 공유

**핵심 원리**: 타입 정의와 런타임 검증을 단일 소스에서 관리.

```typescript
// packages/shared/src/schemas/beauty-profile.ts
import { z } from 'zod';

export const ColorSeasonSchema = z.enum(['spring', 'summer', 'autumn', 'winter']);

export const BeautyProfileSchema = z.object({
  userId: z.string().uuid(),
  colorSeason: ColorSeasonSchema,
  concerns: z.array(z.string()).min(1),
});

// 타입 자동 추론
export type BeautyProfile = z.infer<typeof BeautyProfileSchema>;
```

### 7.5 플랫폼별 파일 확장자

| 확장자 | 대상 플랫폼 | 번들러 |
|--------|------------|--------|
| `.native.tsx` | iOS + Android | Metro |
| `.web.tsx` | Web | Webpack |
| `.tsx` | 기본 (모든 플랫폼) | 모두 |

### 7.6 workspace: 프로토콜

```json
{
  "dependencies": {
    "@yiroom/shared": "workspace:*",
    "@yiroom/ui": "workspace:*"
  }
}
```

| 프로토콜 | 배포 시 변환 |
|---------|-------------|
| `workspace:*` | `1.5.0` (정확한 버전) |
| `workspace:^` | `^1.5.0` (마이너 허용) |

### 7.7 빌드 캐시 최적화

**turbo.json 핵심 설정**:

```json
{
  "globalEnv": ["NODE_ENV", "CI"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*"]
    }
  }
}
```

**환경변수와 캐시 무효화**:

| 설정 | 캐시 영향 |
|------|---------|
| `globalEnv` | 모든 캐시 무효화 |
| `env` | 해당 태스크만 무효화 |
| `globalPassThroughEnv` | 캐시 영향 없음 |

---

## 8. 구현 체크리스트

### 8.1 색상 시스템

- [ ] OKLCH를 기본 색상 공간으로 채택
- [ ] 레거시 브라우저용 RGB 폴백 설정
- [ ] 시맨틱 토큰 계층 (primitive → semantic → component)
- [ ] 모든 배경색에 foreground 토큰 쌍 정의

### 8.2 다크 모드

- [ ] next-themes 설치 및 ThemeProvider 설정
- [ ] `suppressHydrationWarning` 적용
- [ ] 다크 모드 토큰 값 정의 (.dark 클래스)
- [ ] FOUC 방지 검증

### 8.3 Tailwind v4

- [ ] CSS-first 설정 (`@theme` 디렉티브)
- [ ] `@custom-variant dark` 설정
- [ ] shadcn/ui 색상 토큰 통합

### 8.4 온보딩 UX

- [ ] 5단계 이하 유지
- [ ] 프로그레스 바 추가
- [ ] 프리-퍼미션 화면 구현
- [ ] 2분 이내 TTFV 달성
- [ ] 점진적 프로파일링 적용

### 8.5 AI Fallback

- [ ] Circuit Breaker 라이브러리 설치 (opossum/cockatiel)
- [ ] Exponential Backoff with Jitter 구현
- [ ] Mock 데이터 가중치 테이블 (한국인 분포 반영)
- [ ] API 응답에 `isMock`, `dataSource`, `confidence` 필드
- [ ] Fallback 시 Inline 표시 + 재분석 버튼

### 8.6 모노레포 공유

- [ ] packages/shared 구조 설정
- [ ] package.json exports 필드 구성 (granular exports)
- [ ] `sideEffects: false` 설정
- [ ] Zod 스키마 공유 패키지
- [ ] workspace: 프로토콜 적용
- [ ] turbo.json 캐시 최적화

---

## 9. 타이포그래피 시스템

### 9.1 폰트 패밀리

| 용도 | 폰트 | 적용 |
|------|------|------|
| **본문** | Inter + Noto Sans KR | `font-sans` |
| **코드** | SF Mono, Menlo | `font-mono` |

### 9.2 폰트 크기 스케일 (Major Third 1.25)

| 토큰 | 크기 | 용도 | 사용 예시 |
|------|------|------|----------|
| `text-xs` | 12px | 캡션, 라벨, 뱃지 | 날짜, 태그 |
| `text-sm` | 14px | 보조 텍스트 | 설명문, 힌트 |
| `text-base` | 16px | 본문 기본 | 일반 텍스트 |
| `text-lg` | 18px | 강조 본문 | 중요 안내 |
| `text-xl` | 20px | 소제목 (H4) | 카드 제목 |
| `text-2xl` | 24px | 섹션 제목 (H3) | 섹션 헤더 |
| `text-3xl` | 30px | 페이지 제목 (H2) | 페이지 타이틀 |
| `text-4xl` | 36px | 히어로 제목 (H1) | 랜딩 히어로 |
| `text-5xl` | 48px | 대형 디스플레이 | 숫자 강조 |

### 9.3 폰트 무게

| 토큰 | 무게 | 용도 |
|------|------|------|
| `font-normal` | 400 | 본문 텍스트 |
| `font-medium` | 500 | 강조 텍스트, 라벨 |
| `font-semibold` | 600 | 소제목, 버튼 |
| `font-bold` | 700 | 대제목, 강한 강조 |

### 9.4 줄 높이

| 토큰 | 값 | 용도 |
|------|------|------|
| `leading-tight` | 1.25 | 제목 |
| `leading-snug` | 1.375 | 짧은 문단 |
| `leading-normal` | 1.5 | 본문 기본 |
| `leading-relaxed` | 1.625 | 긴 문단 |

### 9.5 타이포그래피 조합 레시피

```tsx
// 페이지 제목
<h1 className="text-3xl font-bold leading-tight tracking-tight">
  페이지 제목
</h1>

// 섹션 제목
<h2 className="text-2xl font-semibold leading-tight">
  섹션 제목
</h2>

// 카드 제목
<h3 className="text-xl font-semibold leading-snug">
  카드 제목
</h3>

// 본문
<p className="text-base font-normal leading-relaxed">
  본문 텍스트...
</p>

// 캡션
<span className="text-xs font-medium text-muted-foreground">
  캡션 텍스트
</span>
```

---

## 10. 아이콘 시스템

### 10.1 아이콘 라이브러리

| 라이브러리 | 용도 | 스타일 |
|-----------|------|--------|
| **Lucide React** | 주 아이콘 | 선형 (stroke) |
| **Heroicons** | 보조 | 선형/채움 |

### 10.2 아이콘 크기 스케일

| 크기 | px | 용도 | Tailwind |
|------|-----|------|----------|
| **xs** | 12 | 인라인 텍스트, 뱃지 | `size-3` |
| **sm** | 16 | 버튼 내부, 작은 UI | `size-4` |
| **md** | 20 | 기본 아이콘 | `size-5` |
| **lg** | 24 | 네비게이션, 카드 헤더 | `size-6` |
| **xl** | 32 | 강조 아이콘 | `size-8` |
| **2xl** | 48 | 빈 상태, 히어로 | `size-12` |

### 10.3 아이콘 색상 패턴

| 상황 | 색상 토큰 | 예시 |
|------|----------|------|
| **기본** | `text-foreground` | 일반 아이콘 |
| **비활성** | `text-muted-foreground` | 비활성 탭 |
| **Primary** | `text-primary` | 활성 탭, 선택됨 |
| **성공** | `text-status-success` | 완료 체크 |
| **경고** | `text-status-warning` | 주의 표시 |
| **에러** | `text-status-error` | 삭제, 오류 |
| **모듈** | `text-module-*` | 모듈별 아이콘 |

### 10.4 아이콘 사용 패턴

```tsx
// 기본 아이콘
import { Heart, Star, Settings } from 'lucide-react';

// 크기별 사용
<Heart className="size-4" />  // 16px
<Heart className="size-5" />  // 20px (기본)
<Heart className="size-6" />  // 24px

// 색상 적용
<Heart className="size-5 text-primary" />
<Heart className="size-5 text-muted-foreground" />
<Heart className="size-5 text-status-error" />

// 버튼 내 아이콘
<Button>
  <Plus className="size-4 mr-2" />
  추가
</Button>

// 아이콘만 있는 버튼
<Button size="icon" variant="ghost">
  <Settings className="size-5" />
  <span className="sr-only">설정</span>
</Button>
```

### 10.5 모듈별 권장 아이콘

| 모듈 | 아이콘 | Lucide |
|------|--------|--------|
| **운동** | 💪 | `Dumbbell` |
| **영양** | 🥗 | `Apple`, `Salad` |
| **피부** | ✨ | `Sparkles` |
| **체형** | 📐 | `Ruler`, `Move` |
| **퍼스널컬러** | 🎨 | `Palette` |
| **얼굴형** | 😊 | `Smile`, `ScanFace` |
| **헤어** | 💇 | `Scissors` |

### 10.6 접근성 (아이콘)

```tsx
// 장식용 아이콘 (스크린리더 무시)
<Heart className="size-5" aria-hidden="true" />

// 의미 있는 아이콘 (라벨 필수)
<Button size="icon">
  <Trash2 className="size-5" />
  <span className="sr-only">삭제</span>
</Button>

// 텍스트와 함께 사용 (중복 방지)
<Button>
  <Plus className="size-4 mr-2" aria-hidden="true" />
  추가하기
</Button>
```

---

## 11. 컴포넌트 변형 시스템

> shadcn/ui 기반 컴포넌트 변형 가이드

### 11.1 Button 변형

| Variant | 용도 | 스타일 |
|---------|------|--------|
| `default` | 주요 액션 | Primary 배경 |
| `secondary` | 보조 액션 | Secondary 배경 |
| `outline` | 세 번째 액션 | 테두리만 |
| `ghost` | 텍스트 버튼 | 배경 없음 |
| `link` | 링크 스타일 | 밑줄 |
| `destructive` | 삭제/위험 | Error 배경 |

**Size 변형**:

| Size | 높이 | 패딩 | 용도 |
|------|------|------|------|
| `sm` | 32px | 12px 16px | 밀집 UI |
| `default` | 40px | 16px 24px | 일반 |
| `lg` | 48px | 20px 32px | CTA |
| `icon` | 40px | - | 아이콘 버튼 |

```tsx
<Button variant="default" size="lg">
  분석 시작하기
</Button>
```

### 11.2 Card 변형

| Variant | 용도 | 스타일 |
|---------|------|--------|
| `default` | 기본 카드 | 흰색 배경, 기본 그림자 |
| `outline` | 테두리 강조 | 배경 투명, 테두리 |
| `professional` | 전문성 강조 | 그라디언트, 큰 그림자 |
| `module-*` | 모듈별 강조 | 모듈 색상 액센트 |

```tsx
// 전문성 있는 분석 결과 카드
<Card variant="professional">
  <CardHeader>
    <CardTitle>피부 분석 결과</CardTitle>
  </CardHeader>
</Card>

// 모듈별 카드
<Card className="border-l-4 border-l-module-skin">
  <CardContent>피부 분석</CardContent>
</Card>
```

### 11.3 Badge 변형

| Variant | 용도 | 색상 |
|---------|------|------|
| `default` | 기본 | Primary |
| `secondary` | 보조 | Secondary |
| `outline` | 테두리 | 투명 + 테두리 |
| `destructive` | 경고/오류 | Error |
| `success` | 성공/완료 | Success |

**커스텀 뱃지 (모듈별)**:

```tsx
// 모듈별 색상 뱃지
<Badge className="bg-module-skin text-white">피부</Badge>
<Badge className="bg-module-workout text-white">운동</Badge>

// 신뢰도 뱃지
<Badge variant="outline" className="bg-professional-highlight/20">
  신뢰도 85%
</Badge>
```

### 11.4 Input 변형

| State | 스타일 |
|-------|--------|
| `default` | 기본 테두리 |
| `focus` | Primary 링 |
| `error` | Error 테두리 + 아이콘 |
| `disabled` | 흐린 배경 |

```tsx
// 에러 상태
<Input
  className="border-destructive focus-visible:ring-destructive"
  aria-invalid="true"
/>

// 성공 상태
<Input
  className="border-status-success focus-visible:ring-status-success"
/>
```

### 11.5 모듈별 테마 적용

```tsx
// 모듈별 페이지 래퍼
interface ModulePageProps {
  module: 'workout' | 'nutrition' | 'skin' | 'body' | 'personal-color' | 'face';
  children: ReactNode;
}

function ModulePage({ module, children }: ModulePageProps) {
  return (
    <div className={cn(
      "min-h-screen",
      // 모듈별 액센트 색상 적용
      `[&_[data-accent]]:bg-module-${module}`,
      `[&_[data-accent]]:text-white`
    )}>
      {children}
    </div>
  );
}

// 사용
<ModulePage module="skin">
  <h1 data-accent className="px-4 py-2 rounded">피부 분석</h1>
</ModulePage>
```

### 11.6 상태 표시 패턴

```tsx
// 로딩 상태
<Button disabled>
  <Loader2 className="size-4 mr-2 animate-spin" />
  분석 중...
</Button>

// 성공 상태
<div className="flex items-center gap-2 text-status-success">
  <CheckCircle className="size-5" />
  <span>분석 완료</span>
</div>

// 에러 상태
<Alert variant="destructive">
  <AlertCircle className="size-4" />
  <AlertTitle>오류 발생</AlertTitle>
  <AlertDescription>다시 시도해주세요.</AlertDescription>
</Alert>

// 빈 상태
<div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
  <Inbox className="size-12" />
  <p>분석 결과가 없습니다</p>
</div>
```

---

## 12. 관련 문서

| 문서 | 설명 |
|------|------|
| [color-science.md](./color-science.md) | 색채학, 퍼스널컬러 색상 토큰 |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | 시스템 아키텍처 |
| [USER-FLOWS.md](../USER-FLOWS.md) | 사용자 플로우 |
| `.claude/rules/react-patterns.md` | React 컴포넌트 패턴 |
| `.claude/rules/performance-guidelines.md` | 성능 가이드라인 |

---

## 13. ADR 역참조

이 원리 문서를 참조하는 ADR 목록:

| ADR | 제목 | 관련 내용 |
|-----|------|----------|
| [ADR-005](../adr/ADR-005-monorepo-structure.md) | 모노레포 구조 | NativeWind, 디자인 토큰 |
| [ADR-012](../adr/ADR-012-state-management.md) | 상태 관리 | shadcn/ui 통합 |
| [ADR-016](../adr/ADR-016-web-mobile-sync.md) | 웹-모바일 싱크 | 디자인 시스템 공유 |
| [ADR-017](../adr/ADR-017-offline-support.md) | 오프라인 지원 | 5단계 임계점, TTFV |

---

## 14. Atomic Design 구조

> 컴포넌트 계층 구조 원리

### 14.1 4단계 계층 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                      Atomic Design 계층                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Templates (templates/)                                         │
│  └── 페이지 레벨 레이아웃, 상태 처리                             │
│      예: PageShell, AnalysisLayout, LoadingState               │
│                           ↑                                     │
│  Blocks (blocks/) = Organisms                                   │
│  └── 섹션/영역 수준 복합 컴포넌트                                │
│      예: BottomNav, DashboardHeader, ProductGrid               │
│                           ↑                                     │
│  Patterns (patterns/) = Molecules                               │
│  └── Primitives 조합, 재사용 가능한 패턴                        │
│      예: AnalysisHub, CameraView, AnalysisLoading              │
│                           ↑                                     │
│  Primitives (primitives/) = Atoms                               │
│  └── 최소 단위, 단일 책임 컴포넌트                               │
│      예: GradientButton, TrustBadge, StepProgress              │
│                           ↑                                     │
│  UI (ui/) = shadcn/ui                                           │
│  └── 기본 UI 컴포넌트 (수정 금지)                                │
│      예: Button, Card, Input, Dialog                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 14.2 폴더 구조

```
components/
├── ui/                      # shadcn/ui (수정 금지)
├── primitives/              # Atoms
│   ├── button-variants/
│   │   ├── GradientButton.tsx
│   │   └── LoadingButton.tsx
│   ├── badge-variants/
│   │   ├── TrustBadge.tsx
│   │   └── AdBadge.tsx
│   └── progress-variants/
│       └── StepProgress.tsx
├── patterns/                # Molecules
│   ├── analysis/
│   │   ├── AnalysisHub.tsx
│   │   └── index.ts
│   ├── camera/
│   │   └── CameraView.tsx
│   └── feedback/
│       └── AnalysisLoading.tsx
├── blocks/                  # Organisms
│   ├── navigation/
│   │   └── BottomNav.tsx
│   └── headers/
│       └── DashboardHeader.tsx
└── templates/               # Page Templates
    ├── layouts/
    └── states/
```

### 14.3 계층별 책임

| 계층 | 책임 | 의존 대상 | 예시 |
|------|------|----------|------|
| **ui/** | 기본 HTML 래퍼 | 없음 (독립) | Button, Input |
| **primitives/** | 단일 기능 UI | ui/ | GradientButton |
| **patterns/** | 기능 조합 | ui/, primitives/ | AnalysisHub |
| **blocks/** | 섹션 구성 | patterns/, primitives/ | BottomNav |
| **templates/** | 페이지 레이아웃 | blocks/, patterns/ | PageShell |

### 14.4 Barrel Export 패턴

```typescript
// primitives/index.ts
export { GradientButton, gradientButtonVariants } from './button-variants';
export type { GradientButtonProps } from './button-variants';

// patterns/index.ts
export { AnalysisHub, analysisHubVariants, THEME_CONFIG } from './analysis';
export type { AnalysisHubProps, AnalysisModuleType, AnalysisTheme } from './analysis';

// 사용
import { GradientButton } from '@/components/primitives';
import { AnalysisHub } from '@/components/patterns';
```

---

## 15. 모듈별 테마 시스템

> 분석 모듈별 색상 테마 원리
> **Note**: ADR-057에 의해 YIROOM IDENTITY (핑크 기반 다크 테마)로 확정됨

### 15.1 브랜드 색상 원리 (YIROOM IDENTITY v3)

**핵심 원리**: 브랜드 기본 색상은 **타겟층(20-35 여성)에게 프리미엄 뷰티 앱**으로 인식되어야 한다.

| 색상 | 용도 | 선택 이유 |
|------|------|----------|
| 핑크 (#F8C8DC) | ✅ 브랜드 기본 | 타겟층 선호, 프리미엄 뷰티 포지셔닝 |
| 다크 (#0F0F0F) | 배경 | 핑크와 대비, 고급스러움 |
| 블루 (#60A5FA) | 피부 분석 (S-1) | 청결, 수분 연상 |
| 퍼플 (#A78BFA) | 체형 분석 (C-1) | 신비, 전문성 연상 |

**결론**: 핑크 그라디언트 기반 다크 테마, 모듈별로 특화 색상 사용

### 15.2 테마 타입 정의

```typescript
export type AnalysisTheme = 'brand' | 'skin' | 'personalColor' | 'body';
```

| 테마 | 색상 | Hex | 용도 | 심리적 연상 |
|------|------|-----|------|------------|
| `brand` | 핑크 그라디언트 | #F8C8DC → #FFB6C1 | 대시보드, 공통 UI, CTA | 따뜻함, 프리미엄 |
| `skin` | 블루 | #60A5FA | S-1 피부 분석 | 청결, 수분, 신뢰 |
| `personalColor` | 핑크 | #F472B6 | PC-1 퍼스널컬러 | 패션, 아름다움 |
| `body` | 퍼플 | #A78BFA | C-1 체형 분석 | 전문성, 신비 |

### 15.3 THEME_CONFIG 구조

```typescript
// YIROOM IDENTITY v3 기반 테마 설정
const THEME_CONFIG: Record<AnalysisTheme, {
  gradient: string;
  accentClass: string;
  shadowColor: string;
  buttonVariant: 'brand' | 'skin' | 'personalColor' | 'body';
}> = {
  brand: {
    // 핑크 그라디언트 (브랜드 기본)
    gradient: 'bg-gradient-to-r from-[#F8C8DC] to-[#FFB6C1]',
    accentClass: 'text-primary border-primary/20 bg-primary/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_rgba(248,200,220,0.2)]',
    buttonVariant: 'brand',
  },
  skin: {
    // 블루 (피부 분석)
    gradient: 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]',
    accentClass: 'text-module-skin border-module-skin/20 bg-module-skin/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_rgba(96,165,250,0.3)]',
    buttonVariant: 'skin',
  },
  personalColor: {
    // 핑크 (퍼스널컬러)
    gradient: 'bg-gradient-to-r from-[#F472B6] to-[#EC4899]',
    accentClass: 'text-module-personal-color border-module-personal-color/20 bg-module-personal-color/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_rgba(244,114,182,0.3)]',
    buttonVariant: 'personalColor',
  },
  body: {
    // 퍼플 (체형 분석)
    gradient: 'bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6]',
    accentClass: 'text-module-body border-module-body/20 bg-module-body/10',
    shadowColor: 'shadow-[0_40px_100px_-20px_rgba(167,139,250,0.3)]',
    buttonVariant: 'body',
  },
};
```

### 15.4 테마 사용 패턴

```tsx
// 기본 (민트) - 대시보드, 공통
<AnalysisHub onSelectModule={handleSelect} />

// 피부 분석 페이지 (핑크) - Gemini 원본
<AnalysisHub theme="skin" onSelectModule={handleSelect} />

// 퍼스널컬러 페이지 (퍼플)
<AnalysisHub theme="personalColor" onSelectModule={handleSelect} />

// 체형 분석 페이지 (블루)
<AnalysisHub theme="body" onSelectModule={handleSelect} />
```

### 15.5 테마 적용 원칙

| 원칙 | 설명 |
|------|------|
| **일관성** | 같은 모듈 내에서는 동일 테마 유지 |
| **맥락 인식** | 현재 분석 모듈에 맞는 테마 자동 적용 |
| **접근성** | 모든 테마에서 WCAG AA 대비율 충족 |
| **다크모드** | 테마별 다크모드 변형 필수 |

---

## 16. CVA 변형 패턴

> Class Variance Authority 기반 컴포넌트 변형

### 16.1 CVA란?

**핵심 원리**: CVA는 Tailwind CSS 클래스를 **타입 안전하게 조합**하는 유틸리티.

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
```

### 16.2 기본 패턴

```typescript
// 1. variants 정의
const buttonVariants = cva(
  // 기본 클래스 (항상 적용)
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      // variant 축
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      // size 축
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    // 기본값
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// 2. 타입 추출
type ButtonVariants = VariantProps<typeof buttonVariants>;

// 3. Props 정의
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  children: React.ReactNode;
}

// 4. 컴포넌트 구현
function Button({ className, variant, size, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 16.3 복합 변형 (Compound Variants)

```typescript
const cardVariants = cva('rounded-lg border', {
  variants: {
    variant: {
      default: 'bg-card',
      outline: 'bg-transparent',
    },
    elevated: {
      true: '',
      false: '',
    },
  },
  // 조합별 추가 클래스
  compoundVariants: [
    {
      variant: 'default',
      elevated: true,
      className: 'shadow-lg',
    },
    {
      variant: 'outline',
      elevated: true,
      className: 'shadow-sm',
    },
  ],
  defaultVariants: {
    variant: 'default',
    elevated: false,
  },
});
```

### 16.4 테마 통합 패턴

```typescript
// 테마를 CVA와 결합
const analysisLoadingVariants = cva(
  'fixed inset-0 bg-background z-[300] flex flex-col items-center justify-center',
  {
    variants: {
      variant: {
        default: '',
        minimal: 'bg-background/95 backdrop-blur-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// 테마는 별도 객체로 관리 (THEME_CONFIG)
// CVA는 레이아웃/구조 변형에 집중
```

### 16.5 네이밍 규칙

| 패턴 | 예시 | 용도 |
|------|------|------|
| `[컴포넌트]Variants` | `buttonVariants` | CVA 정의 |
| `[컴포넌트]Props` | `ButtonProps` | Props 인터페이스 |
| `THEME_CONFIG` | `THEME_CONFIG` | 테마 설정 객체 |
| `[컴포넌트]` | `Button` | 컴포넌트 함수 |

---

## 17. Gemini 디자인 통합

> Gemini AI가 생성한 디자인의 통합 원리

### 17.1 Gemini 출력 특성

Gemini 2.5 Flash로 생성된 디자인의 특징:

| 특성 | 설명 | 조정 필요 |
|------|------|----------|
| 핑크 베이스 | `#F8C8DC` 기본 | ✅ 민트로 변경 |
| 80px 라운드 | 극단적 둥글기 | 유지 (브랜드 특성) |
| Glow 효과 | OKLCH 그림자 | 유지 |
| 그라디언트 | 선형 그라디언트 | 토큰화 |

### 17.2 색상 조정 공식

```
Gemini 출력 → 이룸 토큰 변환 (YIROOM IDENTITY v3)

핑크 (#F8C8DC) → var(--color-primary) [브랜드 기본, 그대로 유지]
핑크 진한 (#FFB6C1) → var(--color-primary-dark) [그대로 유지]

모듈별 색상:
- 피부 분석: #60A5FA (블루)
- 퍼스널컬러: #F472B6 (핑크)
- 체형 분석: #A78BFA (퍼플)
```

### 17.3 레이아웃 보존

다음 Gemini 디자인 요소는 그대로 유지:

| 요소 | 값 | 이유 |
|------|-----|------|
| 카드 라운드 | `rounded-[3.5rem]` | 부드러운 미래적 느낌 |
| 섹션 패딩 | `p-10` | 여유로운 Apple 스타일 |
| 그림자 | `shadow-[0_40px_100px]` | 깊이감 있는 Glow |
| 애니메이션 | `duration-700` | 고급스러운 전환 |

### 17.4 토큰 매핑

```css
/* Gemini 하드코딩 → globals.css 토큰 (YIROOM IDENTITY v3) */

/* 그라디언트 - 핑크 기본 유지 */
from-[#F8C8DC] to-[#FFB6C1] → var(--gradient-brand)

/* 배경 */
bg-[#0F0F0F] → var(--background)
bg-[#1A1A1A] → var(--card)

/* 그림자 */
shadow-[0_40px_100px_-20px_rgba(248,200,220,0.3)] → shadow-brand-glow

/* 텍스트 색상 */
text-[#F8C8DC] → text-primary
text-[#FFFFFF] → text-foreground
text-[#9CA3AF] → text-muted-foreground
```

---

## 18. 구현 체크리스트 (확장)

### 18.7 Atomic Design

- [ ] primitives/ 폴더 구조 생성
- [ ] patterns/ 폴더 구조 생성
- [ ] blocks/ 폴더 구조 생성
- [ ] templates/ 폴더 구조 생성
- [ ] 각 계층 index.ts Barrel Export 설정

### 18.8 테마 시스템

- [ ] THEME_CONFIG 타입 정의
- [ ] 4개 테마 (brand/skin/personalColor/body) 설정
- [ ] 각 테마에 gradient/accentClass/shadowColor 포함
- [ ] 다크모드 테마 변형 설정

### 18.9 CVA 패턴

- [ ] 신규 컴포넌트에 CVA 적용
- [ ] VariantProps 타입 추출
- [ ] compoundVariants 필요 시 정의
- [ ] 테마는 별도 객체(THEME_CONFIG)로 분리

### 18.10 Gemini 디자인 통합

- [ ] 색상 토큰화 (하드코딩 제거)
- [ ] 레이아웃 값 유지 (라운드, 패딩)
- [ ] skin 테마에 원본 핑크 보존
- [ ] brand 테마에 민트 적용

---

**Version**: 3.1 | **Created**: 2026-01-16 | **Updated**: 2026-01-24
**소스 리서치**: INF-1-R1, INF-2-R1, INF-3-R1, INF-4-R1
**관련 ADR**: [ADR-057](../adr/ADR-057-design-system-v2.md) - YIROOM IDENTITY 결정
**변경 이력**:
- v3.1 - YIROOM IDENTITY (핑크 기반 다크 테마) 반영, ADR-057 연동
- v3.0 - Atomic Design, 모듈별 테마 시스템, CVA 패턴, Gemini 통합 추가
- v2.0 - 타이포그래피, 아이콘, 컴포넌트 변형 시스템 추가
