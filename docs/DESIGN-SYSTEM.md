# 이룸 디자인 시스템

> **버전**: 2.0 | **업데이트**: 2025-12-11
> **플랫폼**: Web (Next.js) + Mobile (React Native/Expo)

---

## 색상 시스템

### 색상 표기법

이룸은 **OKLch 색상 공간**을 사용합니다. 더 넓은 색역과 일관된 명도 인식을 제공합니다.

```
oklch(L C H)
- L: Lightness (0~1) - 밝기
- C: Chroma (0~0.4) - 채도
- H: Hue (0~360) - 색상각
```

### 기본 색상 팔레트

```css
:root {
  /* 배경 */
  --background: oklch(0.98 0.005 270);        /* #f8f9fc */
  --foreground: oklch(0.15 0.02 270);         /* #0d101c */

  /* 프라이머리 (이룸 블루) */
  --primary: oklch(0.53 0.23 262);            /* #2e5afa */
  --primary-foreground: oklch(0.98 0.005 270);

  /* 세컨더리 */
  --secondary: oklch(0.93 0.02 270);          /* #e6e9f4 */
  --secondary-foreground: oklch(0.15 0.02 270);

  /* 뮤트 */
  --muted: oklch(0.93 0.02 270);              /* #e6e9f4 */
  --muted-foreground: oklch(0.48 0.12 270);   /* #475a9e */

  /* 보더/인풋 */
  --border: oklch(0.87 0.03 270);             /* #ced4e9 */
  --input: oklch(0.87 0.03 270);
  --ring: oklch(0.53 0.23 262);               /* 포커스 링 */
}
```

### 모듈별 액센트 색상

각 기능 모듈은 고유한 색상 테마를 가집니다:

| 모듈 | CSS 변수 | 기본 | Light | Dark |
|------|----------|------|-------|------|
| **운동** | `--module-workout` | `oklch(0.85 0.15 45)` | `oklch(0.95 0.08 45)` | `oklch(0.65 0.18 45)` |
| **영양** | `--module-nutrition` | `oklch(0.75 0.15 150)` | `oklch(0.92 0.08 150)` | `oklch(0.55 0.18 150)` |
| **피부** | `--module-skin` | `oklch(0.80 0.12 350)` | `oklch(0.95 0.06 350)` | `oklch(0.60 0.15 350)` |
| **체형** | `--module-body` | `oklch(0.75 0.15 250)` | `oklch(0.92 0.08 250)` | `oklch(0.55 0.18 250)` |
| **퍼스널컬러** | `--module-personal-color` | `oklch(0.70 0.18 300)` | `oklch(0.90 0.10 300)` | `oklch(0.50 0.20 300)` |

**Tailwind 사용 예시:**
```tsx
// 배경색
<div className="bg-module-workout-light" />

// 텍스트색
<span className="text-module-nutrition-dark" />

// 테두리
<div className="border-module-skin" />
```

### 상태 색상

```css
:root {
  --status-success: oklch(0.72 0.17 142);   /* 성공/완료 */
  --status-warning: oklch(0.80 0.16 85);    /* 경고/주의 */
  --status-error: oklch(0.65 0.22 25);      /* 오류/실패 */
  --status-info: oklch(0.70 0.15 230);      /* 정보 */
}
```

**Tailwind 사용:**
```tsx
<div className="bg-status-success text-white" />
<span className="text-status-error" />
<div className="border-status-warning" />
```

### 그라디언트

```css
:root {
  /* 브랜드 그라디언트 (핑크 → 퍼플) */
  --gradient-brand: linear-gradient(135deg, oklch(0.70 0.18 340), oklch(0.60 0.20 300));

  /* 프라이머리 그라디언트 (블루 → 인디고) */
  --gradient-primary: linear-gradient(135deg, oklch(0.53 0.23 262), oklch(0.55 0.20 280));

  /* 모듈별 그라디언트 */
  --gradient-workout: linear-gradient(135deg, var(--module-workout), var(--module-workout-dark));
  --gradient-nutrition: linear-gradient(135deg, var(--module-nutrition), var(--module-nutrition-dark));
  --gradient-skin: linear-gradient(135deg, var(--module-skin), var(--module-skin-dark));
  --gradient-body: linear-gradient(135deg, var(--module-body), var(--module-body-dark));
  --gradient-personal-color: linear-gradient(135deg, var(--module-personal-color), var(--module-personal-color-dark));
}
```

**유틸리티 클래스:**
```tsx
<div className="bg-gradient-brand" />
<button className="bg-gradient-primary text-white" />
<span className="text-gradient-brand" />  {/* 텍스트 그라디언트 */}
```

---

## 다크모드

다크모드는 `.dark` 클래스로 활성화됩니다:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --primary: oklch(0.58 0.22 262);            /* 이룸 블루 유지 */
  --primary-foreground: oklch(0.98 0.005 270); /* 흰색 텍스트 */
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --ring: oklch(0.58 0.22 262);               /* 이룸 블루 (포커스) */
}
```

**구현 상태**: ✅ 완료 (ThemeProvider + ThemeToggle)

**테마 전환 방법**:
- `ThemeToggle` 컴포넌트 사용 (light/dark/system)
- localStorage에 `yiroom-theme` 키로 저장
- 시스템 테마 자동 감지 지원

---

## 타이포그래피

### 폰트 패밀리

```css
font-family: Inter, "Noto Sans KR", sans-serif;
```

| 폰트 | 용도 |
|------|------|
| **Inter** | 영문, 숫자 |
| **Noto Sans KR** | 한글 |

### 폰트 웨이트

| 웨이트 | 클래스 | 용도 |
|--------|--------|------|
| 400 | `font-normal` | 본문 |
| 500 | `font-medium` | 라벨, 네비게이션 |
| 700 | `font-bold` | 제목, 버튼 |
| 900 | `font-black` | 히어로 타이틀 |

### 텍스트 크기

| 요소 | 클래스 | 크기 |
|------|--------|------|
| 히어로 (데스크탑) | `text-5xl` | 48px |
| 히어로 (모바일) | `text-4xl` | 36px |
| 섹션 제목 | `text-2xl` | 24px |
| 카드 제목 | `text-base font-bold` | 16px |
| 본문 | `text-sm` | 14px |
| 캡션 | `text-xs` | 12px |

---

## 간격 및 레이아웃

### 간격 시스템

| 용도 | 클래스 | 값 |
|------|--------|-----|
| 페이지 패딩 | `px-4 md:px-6` | 16px / 24px |
| 섹션 간격 | `py-8` | 32px |
| 카드 내부 | `p-4` | 16px |
| 카드 간격 | `gap-4` | 16px |
| 버튼 간격 | `gap-2` | 8px |

### 컨테이너

```tsx
// 기본 컨테이너
<main className="max-w-7xl mx-auto pt-16 px-4">

// 콘텐츠 영역
<div className="max-w-4xl mx-auto">
```

### Border Radius

| 요소 | 클래스 | 값 |
|------|--------|-----|
| 버튼, 카드 | `rounded-xl` | 12px |
| 입력 필드 | `rounded-lg` | 8px |
| 배지, 태그 | `rounded-md` | 6px |
| 아바타 | `rounded-full` | 50% |

---

## 애니메이션

### 키프레임

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes count-up-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 유틸리티 클래스

| 클래스 | 효과 | 지속시간 |
|--------|------|----------|
| `animate-fade-in-up` | 아래에서 페이드인 | 0.5s |
| `animate-scale-in` | 확대 페이드인 | 0.4s |
| `animate-count-pulse` | 숫자 강조 펄스 | 0.3s |
| `animate-shimmer` | 스켈레톤 반짝임 | 1.5s |

### 딜레이 클래스

```tsx
<div className="animate-fade-in-up animation-delay-100" />
<div className="animate-fade-in-up animation-delay-200" />
<div className="animate-fade-in-up animation-delay-300" />
// ... animation-delay-100 ~ animation-delay-800
```

### 접근성 (Reduced Motion)

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up,
  .animate-scale-in,
  .animate-count-pulse,
  .animate-shimmer {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## 컴포넌트 스펙

### 버튼

**Primary 버튼**
```tsx
<Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4">
  시작하기
</Button>
```

**Secondary 버튼**
```tsx
<Button variant="secondary" className="rounded-xl h-10 px-4">
  더 알아보기
</Button>
```

**그라디언트 버튼**
```tsx
<Button className="bg-gradient-brand hover:opacity-90 text-white rounded-xl">
  무료로 시작하기
</Button>
```

### 카드

```tsx
<div className="rounded-xl border border-border bg-card p-4 shadow-sm">
  <h3 className="font-bold text-foreground">제목</h3>
  <p className="text-sm text-muted-foreground mt-1">설명</p>
</div>
```

### 배지

```tsx
// 모듈 태그
<span className="bg-module-workout-light text-module-workout-dark px-3 py-1 rounded-md text-sm">
  운동
</span>

// 상태 배지
<span className="bg-status-success/10 text-status-success px-2 py-0.5 rounded text-xs">
  완료
</span>
```

---

## 아이콘

**라이브러리**: Lucide React

```tsx
import { Heart, Brain, Dumbbell, Bell } from 'lucide-react';

<Heart className="w-5 h-5 text-module-skin" />
<Brain className="w-5 h-5 text-module-personal-color" />
<Dumbbell className="w-5 h-5 text-module-workout" />
```

**아이콘 크기 가이드**:
| 용도 | 클래스 |
|------|--------|
| 인라인 텍스트 | `w-4 h-4` |
| 버튼 내부 | `w-5 h-5` |
| 카드 아이콘 | `w-6 h-6` |
| 피처 아이콘 | `w-8 h-8` |

---

## React Native 가이드

### 색상 변환

React Native에서는 CSS 변수 대신 상수를 사용합니다:

```typescript
// packages/shared/src/constants/colors.ts
export const colors = {
  primary: '#2e5afa',
  background: '#f8f9fc',
  foreground: '#0d101c',

  module: {
    workout: { base: '#f5a623', light: '#fef3e2', dark: '#c77800' },
    nutrition: { base: '#4caf50', light: '#e8f5e9', dark: '#2e7d32' },
    skin: { base: '#ec407a', light: '#fce4ec', dark: '#c2185b' },
    body: { base: '#42a5f5', light: '#e3f2fd', dark: '#1565c0' },
    personalColor: { base: '#ab47bc', light: '#f3e5f5', dark: '#7b1fa2' },
  },

  status: {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
};
```

### 스타일 패턴

```typescript
// React Native StyleSheet
import { StyleSheet } from 'react-native';
import { colors } from '@shared/constants/colors';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
```

---

## 브랜드 에셋

### 로고/아이콘 파일

| 파일 | 크기 | 용도 |
|------|------|------|
| `public/logo.png` | - | 웹 로고 |
| `public/icons/icon-192x192.png` | 192×192 | PWA 아이콘 |
| `public/icons/icon-512x512.png` | 512×512 | PWA 아이콘 (maskable) |
| `apps/mobile/assets/icon.png` | 1024×1024 | 앱 아이콘 |
| `apps/mobile/assets/adaptive-icon.png` | - | Android Adaptive |
| `apps/mobile/assets/splash-icon.png` | - | 스플래시 스크린 |

### 브랜드 컬러

| 용도 | 색상 | 코드 |
|------|------|------|
| 앱 테마 | 이룸 블루 | `#2e5afa` |
| 스플래시 배경 | 이룸 블루 | `#2e5afa` |
| 로고 그라디언트 | 핑크→퍼플 | `--gradient-brand` |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v2.0 | 2025-12-11 | OKLch 색상 체계, 모듈 색상, 그라디언트, 애니메이션, 다크모드, RN 가이드 추가 |
| v1.1 | 2025-12-04 | Noto Sans KR 폰트 업데이트 |
| v1.0 | 2025-12-04 | 초기 버전 (Stitch 익스포트 기반) |
